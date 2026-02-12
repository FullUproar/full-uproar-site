/**
 * @jest-environment node
 */

/**
 * Stripe Webhook Handler Tests
 *
 * Tests POST /api/stripe/webhook
 * - Signature verification
 * - payment_intent.succeeded → marks order paid
 * - payment_intent.payment_failed → releases inventory
 * - charge.refunded → marks order refunded
 * - Idempotency (duplicate events)
 */

// ─── Mocks (must be before imports) ──────────────────────────────

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    orderStatusHistory: { create: jest.fn() },
    game: { update: jest.fn() },
    gameInventory: { updateMany: jest.fn() },
    inventory: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue({
    get: jest.fn((name: string) => {
      if (name === 'stripe-signature') return 'sig_test_123';
      return null;
    }),
  }),
}));

jest.mock('@/lib/services/logger', () => ({
  paymentLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/utils/error-handler', () => ({
  withErrorHandler: (fn: any) => fn,
}));

jest.mock('@/lib/email', () => ({
  sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
  sendPaymentFailedNotification: jest.fn().mockResolvedValue(undefined),
  sendRefundNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/discord', () => ({
  sendDiscordOrderNotification: jest.fn().mockResolvedValue(undefined),
  sendDiscordRefundNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/shipping/shipstation', () => ({
  syncOrderToShipStation: jest.fn().mockResolvedValue(undefined),
  isShipStationConfigured: jest.fn().mockReturnValue(false),
}));

jest.mock('@/lib/printify/auto-fulfill', () => ({
  fulfillPrintifyOrder: jest.fn().mockResolvedValue({ success: false }),
  isPrintifyConfigured: jest.fn().mockResolvedValue(false),
}));

// ─── Imports ─────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { sendOrderConfirmation, sendPaymentFailedNotification, sendRefundNotification } from '@/lib/email';
import { POST } from '@/app/api/stripe/webhook/route';

const mockConstructEvent = (stripe as any).webhooks.constructEvent as jest.Mock;

// ─── Helpers ─────────────────────────────────────────────────────

function createWebhookRequest(body: string = 'raw_body'): NextRequest {
  return new NextRequest('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': 'sig_test_123',
    },
  });
}

function makeEvent(type: string, data: any) {
  return {
    id: 'evt_test_123',
    type,
    data: { object: data },
  };
}

const samplePaymentIntent = {
  id: 'pi_test_123',
  amount: 4999,
  metadata: {
    orderId: 'order-abc-123',
    customerEmail: 'buyer@example.com',
    customerName: 'Test Buyer',
  },
};

const sampleOrder = {
  id: 'order-abc-123',
  status: 'pending',
  totalCents: 4999,
  customerEmail: 'buyer@example.com',
  customerName: 'Test Buyer',
  shippingAddress: '123 Main St',
  shippingMethod: 'USPS Priority',
  shippingCents: 599,
  taxCents: 240,
  paidAt: null,
  paymentIntentId: null,
  items: [
    {
      id: 1,
      itemType: 'game',
      gameId: 1,
      merchId: null,
      merchSize: null,
      quantity: 1,
      priceCents: 2999,
      game: { title: 'Test Game', slug: 'test-game' },
      merch: null,
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

  // Default: constructEvent succeeds
  mockConstructEvent.mockReturnValue(
    makeEvent('payment_intent.succeeded', samplePaymentIntent)
  );
});

// ═════════════════════════════════════════════════════════════════
// POST /api/stripe/webhook
// ═════════════════════════════════════════════════════════════════

describe('POST /api/stripe/webhook', () => {

  describe('Signature verification', () => {
    it('should return 400 when no signature header is provided', async () => {
      const mockHeaders = jest.fn().mockResolvedValue({
        get: jest.fn().mockReturnValue(null),
      });
      (headers as jest.Mock).mockImplementation(mockHeaders);

      const response = await POST(createWebhookRequest());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No signature provided');
    });

    it('should return 500 when webhook secret is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      // Restore signature header
      (headers as jest.Mock).mockResolvedValue({
        get: jest.fn((name: string) => {
          if (name === 'stripe-signature') return 'sig_test_123';
          return null;
        }),
      });

      const response = await POST(createWebhookRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Webhook secret not configured');
    });

    it('should return 400 when signature verification fails', async () => {
      (headers as jest.Mock).mockResolvedValue({
        get: jest.fn((name: string) => {
          if (name === 'stripe-signature') return 'invalid_sig';
          return null;
        }),
      });

      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await POST(createWebhookRequest());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Webhook Error');
    });
  });

  describe('payment_intent.succeeded', () => {
    beforeEach(() => {
      // Reset headers mock for these tests
      (headers as jest.Mock).mockResolvedValue({
        get: jest.fn((name: string) => {
          if (name === 'stripe-signature') return 'sig_test_123';
          return null;
        }),
      });
    });

    it('should mark order as paid', async () => {
      // Initial lookup for idempotency check
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-abc-123',
        status: 'pending',
        paidAt: null,
        paymentIntentId: null,
      });

      // Transaction mock
      const updatedOrder = { ...sampleOrder, status: 'paid', paidAt: new Date() };
      (prisma.$transaction as jest.Mock).mockResolvedValue(updatedOrder);

      const response = await POST(createWebhookRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should be idempotent — skip already-paid orders', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-abc-123',
        status: 'paid',
        paidAt: new Date(),
        paymentIntentId: 'pi_test_123',
      });

      const response = await POST(createWebhookRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      // Should NOT run the transaction
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle missing orderId in metadata gracefully', async () => {
      mockConstructEvent.mockReturnValue(
        makeEvent('payment_intent.succeeded', {
          id: 'pi_no_order',
          metadata: {},
        })
      );

      const response = await POST(createWebhookRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      // Should not attempt to update anything
      expect(prisma.order.findUnique).not.toHaveBeenCalled();
    });

    it('should handle order not found', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await POST(createWebhookRequest());
      const data = await response.json();

      // Returns 200 to prevent Stripe retries
      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });

  describe('payment_intent.payment_failed', () => {
    beforeEach(() => {
      (headers as jest.Mock).mockResolvedValue({
        get: jest.fn((name: string) => {
          if (name === 'stripe-signature') return 'sig_test_123';
          return null;
        }),
      });

      mockConstructEvent.mockReturnValue(
        makeEvent('payment_intent.payment_failed', {
          ...samplePaymentIntent,
          last_payment_error: { message: 'Card declined' },
        })
      );
    });

    it('should update status and release inventory', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        status: 'payment_pending',
      });
      (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      const response = await POST(createWebhookRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should skip orders in terminal state', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        status: 'paid',
      });

      const response = await POST(createWebhookRequest());

      expect(response.status).toBe(200);
      // Should NOT run transaction for already-paid order
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('charge.refunded', () => {
    beforeEach(() => {
      (headers as jest.Mock).mockResolvedValue({
        get: jest.fn((name: string) => {
          if (name === 'stripe-signature') return 'sig_test_123';
          return null;
        }),
      });
    });

    it('should mark order as refunded for full refund', async () => {
      mockConstructEvent.mockReturnValue(
        makeEvent('charge.refunded', {
          id: 'ch_test_123',
          payment_intent: 'pi_test_123',
          amount: 4999,
          amount_refunded: 4999,
        })
      );

      (prisma.order.findFirst as jest.Mock).mockResolvedValue({
        ...sampleOrder,
        status: 'paid',
        paymentIntentId: 'pi_test_123',
      });
      (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      const response = await POST(createWebhookRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should mark as partially_refunded for partial refund', async () => {
      mockConstructEvent.mockReturnValue(
        makeEvent('charge.refunded', {
          id: 'ch_test_456',
          payment_intent: 'pi_test_123',
          amount: 4999,
          amount_refunded: 2000,
        })
      );

      (prisma.order.findFirst as jest.Mock).mockResolvedValue({
        ...sampleOrder,
        status: 'paid',
        paymentIntentId: 'pi_test_123',
      });
      (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      const response = await POST(createWebhookRequest());

      expect(response.status).toBe(200);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle order not found for refund', async () => {
      mockConstructEvent.mockReturnValue(
        makeEvent('charge.refunded', {
          id: 'ch_orphan',
          payment_intent: 'pi_orphan',
          amount: 4999,
          amount_refunded: 4999,
        })
      );

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await POST(createWebhookRequest());

      expect(response.status).toBe(200);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('Unhandled events', () => {
    it('should return 200 for unhandled event types', async () => {
      (headers as jest.Mock).mockResolvedValue({
        get: jest.fn((name: string) => {
          if (name === 'stripe-signature') return 'sig_test_123';
          return null;
        }),
      });

      mockConstructEvent.mockReturnValue(
        makeEvent('customer.created', { id: 'cus_test_123' })
      );

      const response = await POST(createWebhookRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });
});
