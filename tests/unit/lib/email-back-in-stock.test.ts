/**
 * @jest-environment node
 */

// Mock nodemailer — define sendMail inline to avoid jest.mock hoisting TDZ issues
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  })),
}));

// Mock stripe (imported transitively by email module)
jest.mock('@/lib/stripe', () => ({ stripe: null }));

import nodemailer from 'nodemailer';
import { sendBackInStockNotification } from '@/lib/email';

// Get reference to the sendMail mock
const mockSendMail = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail as jest.Mock;

const testData = {
  customerEmail: 'gamer@example.com',
  gameName: 'Crime and Funishments',
  gameSlug: 'crime-and-funishments',
  priceCents: 2999,
  imageUrl: 'https://example.com/game.jpg',
};

describe('sendBackInStockNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'test-password';
  });

  afterEach(() => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
  });

  it('sends email with correct recipient', async () => {
    await sendBackInStockNotification(testData);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe('gamer@example.com');
  });

  it('includes game name in subject', async () => {
    await sendBackInStockNotification(testData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain('Crime and Funishments');
    expect(call.subject).toContain('back in stock');
  });

  it('includes game name and price in HTML body', async () => {
    await sendBackInStockNotification(testData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('Crime and Funishments');
    expect(call.html).toContain('$29.99');
  });

  it('includes product link with correct slug', async () => {
    await sendBackInStockNotification(testData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('/shop/games/crime-and-funishments');
    expect(call.text).toContain('/shop/games/crime-and-funishments');
  });

  it('includes Get Your Copy CTA', async () => {
    await sendBackInStockNotification(testData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('Get Your Copy');
  });

  it('includes urgency messaging', async () => {
    await sendBackInStockNotification(testData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('limited');
  });

  it('includes image when provided', async () => {
    await sendBackInStockNotification(testData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('https://example.com/game.jpg');
  });

  it('works without image', async () => {
    const { imageUrl, ...dataNoImage } = testData;
    await sendBackInStockNotification(dataNoImage);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).not.toContain('<img');
  });

  it('returns false when Gmail not configured', async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    const result = await sendBackInStockNotification(testData);
    expect(result).toBe(false);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('returns false on send error', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

    const result = await sendBackInStockNotification(testData);
    expect(result).toBe(false);
  });

  it('returns true on success', async () => {
    const result = await sendBackInStockNotification(testData);
    expect(result).toBe(true);
  });
});
