/**
 * @jest-environment node
 */

/**
 * Payment Intent Creation API Tests
 *
 * Tests POST /api/stripe/create-payment-intent
 * - Store closed checks (admin bypass)
 * - Order validation (exists, correct status, amount match)
 * - Simulated mode returns mock clientSecret
 * - Stripe mode creates real PaymentIntent
 */

// ─── Mocks (must be before imports) ──────────────────────────────

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/payment-mode', () => ({
  isSimulatedMode: jest.fn(),
}));

jest.mock('@/lib/constants', () => ({
  ADMIN_ROLES: ['ADMIN', 'SUPER_ADMIN', 'GOD'],
}));

// ─── Imports ─────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { isSimulatedMode } from '@/lib/payment-mode';
import { stripe } from '@/lib/stripe';
import { POST } from '@/app/api/stripe/create-payment-intent/route';

// ─── Typed mocks ─────────────────────────────────────────────────

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockIsSimulatedMode = isSimulatedMode as jest.MockedFunction<typeof isSimulatedMode>;
const mockPaymentIntentsCreate = (stripe as any).paymentIntents.create as jest.Mock;

// ─── Helpers ─────────────────────────────────────────────────────

function createRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/stripe/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const sampleOrder = {
  id: 'order-abc-123',
  status: 'pending',
  totalCents: 4999,
  customerEmail: 'buyer@example.com',
  customerName: 'Test Buyer',
  shippingAddress: '123 Main St, Anytown, ST 12345',
  items: [
    { id: 1, gameId: 1, quantity: 1, priceCents: 2999 },
    { id: 2, merchId: 1, quantity: 1, priceCents: 2000 },
  ],
};

// STORE_OPEN is captured at module load time. In the test env it's false,
// so we authenticate as admin to bypass the store-closed gate.
// Store-closed behavior is tested separately in purchase-flow.test.ts.
function authenticateAsAdmin() {
  mockAuth.mockResolvedValue({ userId: 'clerk_admin' } as any);
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsSimulatedMode.mockReturnValue(false);
  authenticateAsAdmin();
});

// ═════════════════════════════════════════════════════════════════
// POST /api/stripe/create-payment-intent
// ═════════════════════════════════════════════════════════════════

describe('POST /api/stripe/create-payment-intent', () => {

  describe('Order validation', () => {
    it('should return 404 when order does not exist', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await POST(createRequest({
        orderId: 'nonexistent-order',
        amount: 4999,
      }));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Order not found');
    });

    it('should return 400 for already-paid order', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...sampleOrder,
        status: 'paid',
      });

      const response = await POST(createRequest({
        orderId: 'order-abc-123',
        amount: 4999,
      }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Cannot create payment');
    });

    it('should return 400 for cancelled order', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...sampleOrder,
        status: 'cancelled',
      });

      const response = await POST(createRequest({
        orderId: 'order-abc-123',
        amount: 4999,
      }));

      expect(response.status).toBe(400);
    });

    it('should return 400 when amount does not match order total', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(sampleOrder);

      const response = await POST(createRequest({
        orderId: 'order-abc-123',
        amount: 9999, // wrong amount
      }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Amount mismatch');
    });
  });

  describe('Simulated mode', () => {
    it('should return mock clientSecret in simulated mode', async () => {
      mockIsSimulatedMode.mockReturnValue(true);
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(sampleOrder);

      const response = await POST(createRequest({
        orderId: 'order-abc-123',
        amount: 4999,
      }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.clientSecret).toBe('test_secret_order-abc-123');
      expect(data.testMode).toBe(true);
      expect(data.amount).toBe(4999);
      // Should NOT call real Stripe
      expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
    });
  });

  describe('Stripe mode', () => {
    it('should create PaymentIntent and update order', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(sampleOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue({});
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
        amount: 4999,
        currency: 'usd',
      });

      const response = await POST(createRequest({
        orderId: 'order-abc-123',
        amount: 4999,
      }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.clientSecret).toBe('pi_test_123_secret_abc');
      expect(data.testMode).toBe(false);

      // Verify Stripe was called with correct params
      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 4999,
          currency: 'usd',
          metadata: expect.objectContaining({
            orderId: 'order-abc-123',
            customerEmail: 'buyer@example.com',
            customerName: 'Test Buyer',
          }),
          receipt_email: 'buyer@example.com',
        })
      );

      // Verify order was updated
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-abc-123' },
        data: {
          paymentIntentId: 'pi_test_123',
          status: 'payment_pending',
        },
      });
    });

    it('should include userId in metadata when user is authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_user_123' } as any);
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(sampleOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue({});
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_test_456',
        client_secret: 'pi_test_456_secret',
        amount: 4999,
        currency: 'usd',
      });

      await POST(createRequest({
        orderId: 'order-abc-123',
        amount: 4999,
      }));

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'clerk_user_123',
          }),
        })
      );
    });
  });
});
