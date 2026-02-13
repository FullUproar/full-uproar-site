/**
 * @jest-environment node
 */

/**
 * Tests for order notification email functions
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
import {
  sendPaymentFailedNotification,
  sendRefundNotification,
  sendOrderShippedNotification,
} from '@/lib/email';

// Get reference to the sendMail mock created when email.ts loaded
const mockSendMail = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail as jest.Mock;

describe('sendPaymentFailedNotification', () => {
  const baseData = {
    orderId: 'order-1234-5678-abcd-ef01',
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    errorMessage: 'Your card was declined',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'test-password';
  });

  afterEach(() => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
  });

  it('sends email with correct recipient and subject', async () => {
    const result = await sendPaymentFailedNotification(baseData);

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe('test@example.com');
    expect(call.subject).toContain('Payment issue');
  });

  it('includes error message in HTML body', async () => {
    await sendPaymentFailedNotification(baseData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('Your card was declined');
    expect(call.text).toContain('Your card was declined');
  });

  it('includes order number in email', async () => {
    await sendPaymentFailedNotification({ ...baseData, orderNumber: 1042 });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('FU-1042');
  });

  it('includes try again link', async () => {
    await sendPaymentFailedNotification(baseData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('/checkout');
    expect(call.html).toContain('Try Again');
  });

  it('returns false when Gmail not configured', async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    const result = await sendPaymentFailedNotification(baseData);

    expect(result).toBe(false);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('returns false on send error', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

    const result = await sendPaymentFailedNotification(baseData);

    expect(result).toBe(false);
  });
});

describe('sendRefundNotification', () => {
  const baseData = {
    orderId: 'order-1234-5678-abcd-ef01',
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    refundAmountCents: 2999,
    isFullRefund: true,
  };

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
    const result = await sendRefundNotification(baseData);

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail.mock.calls[0][0].to).toBe('test@example.com');
  });

  it('shows full refund in subject for full refund', async () => {
    await sendRefundNotification(baseData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain('Full Refund');
  });

  it('shows partial refund in subject for partial refund', async () => {
    await sendRefundNotification({ ...baseData, isFullRefund: false });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain('Partial Refund');
  });

  it('formats refund amount correctly', async () => {
    await sendRefundNotification(baseData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('$29.99');
    expect(call.text).toContain('$29.99');
  });

  it('includes reason when provided', async () => {
    await sendRefundNotification({ ...baseData, reason: 'Wrong size ordered' });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('Wrong size ordered');
    expect(call.text).toContain('Wrong size ordered');
  });

  it('includes 5-10 business days messaging', async () => {
    await sendRefundNotification(baseData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('5–10 business days');
    expect(call.text).toContain('5-10 business days');
  });

  it('returns false when Gmail not configured', async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    const result = await sendRefundNotification(baseData);

    expect(result).toBe(false);
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});

describe('sendOrderShippedNotification', () => {
  const baseData = {
    orderId: 'order-1234',
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    trackingNumber: '9400111899223456789012',
    shippingCarrier: 'USPS',
    items: [
      { quantity: 1, priceCents: 2999, game: { title: 'Fugly', slug: 'fugly' }, merch: null },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'test-password';
  });

  afterEach(() => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
  });

  it('sends email with tracking number', async () => {
    const result = await sendOrderShippedNotification(baseData);

    expect(result).toBe(true);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('9400111899223456789012');
    expect(call.text).toContain('9400111899223456789012');
  });

  it('includes USPS tracking URL for USPS carrier', async () => {
    await sendOrderShippedNotification(baseData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('tools.usps.com');
  });

  it('includes UPS tracking URL for UPS carrier', async () => {
    await sendOrderShippedNotification({ ...baseData, shippingCarrier: 'UPS' });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('ups.com/track');
  });

  it('includes FedEx tracking URL for FedEx carrier', async () => {
    await sendOrderShippedNotification({ ...baseData, shippingCarrier: 'FedEx' });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('fedex.com');
  });

  it('includes item names in body', async () => {
    await sendOrderShippedNotification(baseData);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('Fugly');
  });

  it('returns false when Gmail not configured', async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    const result = await sendOrderShippedNotification(baseData);

    expect(result).toBe(false);
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
