/**
 * @jest-environment node
 */

/**
 * Purchase Flow API Tests
 *
 * Tests the critical APIs in the purchase flow:
 * 1. POST /api/orders — Order creation with validation + email check
 * 2. GET /api/orders — Order listing (requires admin auth)
 * 3. PUT /api/orders — Status updates (requires admin auth)
 * 4. GET /api/orders/[orderId] — Individual order lookup (public, UUID-gated)
 * 5. PATCH /api/orders/[orderId] — Simulated payment confirmation (dev mode only)
 */

// ─── Mocks (must be before imports) ──────────────────────────────

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    game: { findUnique: jest.fn(), update: jest.fn() },
    gameInventory: { findUnique: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    merch: { findUnique: jest.fn() },
    inventory: { findFirst: jest.fn(), updateMany: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    promoCode: { findUnique: jest.fn() },
    promoCodeUsage: { count: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/tax', () => ({
  calculateTaxSync: jest.fn().mockReturnValue({ taxCents: 240, isEstimate: false }),
}));

jest.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: jest.fn(),
}));

jest.mock('@/lib/payment-mode', () => ({
  isSimulatedMode: jest.fn().mockReturnValue(true),
}));

// ─── Imports ─────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';
import { isSimulatedMode } from '@/lib/payment-mode';

// Route handlers
import { GET as getOrders, POST as createOrder, PUT as updateOrder } from '@/app/api/orders/route';
import { GET as getOrderById, PATCH as patchOrder } from '@/app/api/orders/[orderId]/route';

// ─── Typed mocks ─────────────────────────────────────────────────

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;
const mockIsSimulatedMode = isSimulatedMode as jest.MockedFunction<typeof isSimulatedMode>;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: null } as any);
});

// ─── Helpers ─────────────────────────────────────────────────────

function createRequest(method: string, path: string, body?: any): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    ...(body ? {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    } : {}),
  });
}

function adminAuthorized() {
  mockRequireAdmin.mockResolvedValue({
    authorized: true,
    userId: 'clerk_admin',
    user: { id: '1', role: 'ADMIN', email: 'admin@test.com' },
  } as any);
}

function adminUnauthorized(status: 401 | 403 = 401) {
  const msg = status === 401 ? 'Unauthorized' : 'Admin access required';
  mockRequireAdmin.mockResolvedValue({
    authorized: false,
    response: NextResponse.json({ error: msg }, { status }),
  } as any);
}

/** Authenticate as admin so POST bypasses the store-closed gate */
function authenticateAsAdmin() {
  mockAuth.mockResolvedValue({ userId: 'clerk_admin' } as any);
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
}

// ═══════════════════════════════════════════════════════════════════
// GET /api/orders — Admin-Only Order Listing
// ═══════════════════════════════════════════════════════════════════

describe('GET /api/orders — Admin-only order listing', () => {
  it('should return 401 when not authenticated', async () => {
    adminUnauthorized(401);

    const response = await getOrders(createRequest('GET', '/api/orders'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when user is not admin', async () => {
    adminUnauthorized(403);

    const response = await getOrders(createRequest('GET', '/api/orders'));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Admin access required');
  });

  it('should return orders when admin is authenticated', async () => {
    adminAuthorized();
    (prisma.order.findMany as jest.Mock).mockResolvedValue([
      { id: 'order-1', customerEmail: 'user@test.com', status: 'pending', items: [], statusHistory: [] },
    ]);

    const response = await getOrders(createRequest('GET', '/api/orders'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('order-1');
  });

  it('should filter orders by status', async () => {
    adminAuthorized();
    (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

    await getOrders(createRequest('GET', '/api/orders?status=shipped'));

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'shipped' }),
      })
    );
  });

  it('should filter orders by email', async () => {
    adminAuthorized();
    (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

    await getOrders(createRequest('GET', '/api/orders?email=test@test.com'));

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ customerEmail: 'test@test.com' }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// PUT /api/orders — Admin-Only Status Update
// ═══════════════════════════════════════════════════════════════════

describe('PUT /api/orders — Admin-only status update', () => {
  it('should return 401 when not authenticated', async () => {
    adminUnauthorized(401);

    const response = await updateOrder(
      createRequest('PUT', '/api/orders?id=order-1', { status: 'paid' })
    );

    expect(response.status).toBe(401);
  });

  it('should return 403 when user is not admin', async () => {
    adminUnauthorized(403);

    const response = await updateOrder(
      createRequest('PUT', '/api/orders?id=order-1', { status: 'paid' })
    );

    expect(response.status).toBe(403);
  });

  it('should return 400 when order ID is missing', async () => {
    adminAuthorized();

    const response = await updateOrder(
      createRequest('PUT', '/api/orders', { status: 'paid' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Order ID is required');
  });
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/orders — Order Creation Validation
// ═══════════════════════════════════════════════════════════════════

describe('POST /api/orders — Order creation validation', () => {
  // Store is closed in tests (env var not set), so authenticate as admin to bypass
  beforeEach(() => {
    authenticateAsAdmin();
  });

  it('should return 503 for non-admin when store is closed', async () => {
    // Don't authenticate as admin — store-closed check should block
    mockAuth.mockResolvedValue({ userId: null } as any);

    const response = await createOrder(
      createRequest('POST', '/api/orders', {
        customerEmail: 'test@example.com',
        customerName: 'John',
        shippingAddress: '123 Main St',
        items: [{ itemType: 'game', gameId: 1, quantity: 1, priceCents: 2999 }],
      })
    );

    expect(response.status).toBe(503);
  });

  it('should reject missing required fields', async () => {
    const response = await createOrder(
      createRequest('POST', '/api/orders', {
        customerEmail: 'test@example.com',
        // Missing customerName, shippingAddress, items
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should reject empty items array', async () => {
    const response = await createOrder(
      createRequest('POST', '/api/orders', {
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        shippingAddress: '123 Main St, City, ST 12345',
        items: [],
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Order must contain at least one item');
  });

  it('should reject invalid email (no domain)', async () => {
    const response = await createOrder(
      createRequest('POST', '/api/orders', {
        customerEmail: 'not-an-email',
        customerName: 'John Doe',
        shippingAddress: '123 Main St, City, ST 12345',
        items: [{ itemType: 'game', gameId: 1, quantity: 1, priceCents: 2999 }],
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email address');
  });

  it('should reject email with only @', async () => {
    const response = await createOrder(
      createRequest('POST', '/api/orders', {
        customerEmail: '@',
        customerName: 'John Doe',
        shippingAddress: '123 Main St',
        items: [{ itemType: 'game', gameId: 1, quantity: 1, priceCents: 2999 }],
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email address');
  });

  it('should reject email without TLD', async () => {
    const response = await createOrder(
      createRequest('POST', '/api/orders', {
        customerEmail: 'user@domain',
        customerName: 'John Doe',
        shippingAddress: '123 Main St',
        items: [{ itemType: 'game', gameId: 1, quantity: 1, priceCents: 2999 }],
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email address');
  });

  it('should accept valid email and proceed to order creation', async () => {
    // Mock the transaction to return a mock order
    const mockOrder = {
      id: 'order-test-1',
      customerEmail: 'valid@example.com',
      customerName: 'John Doe',
      totalCents: 3238,
      status: 'pending',
      items: [],
    };
    (prisma.$transaction as jest.Mock).mockResolvedValue(mockOrder);

    const response = await createOrder(
      createRequest('POST', '/api/orders', {
        customerEmail: 'valid@example.com',
        customerName: 'John Doe',
        shippingAddress: '123 Main St, City, ST 12345',
        items: [{ itemType: 'game', gameId: 1, quantity: 1, priceCents: 2999 }],
      })
    );
    const data = await response.json();

    // Should reach the transaction (not blocked by validation)
    expect(response.status).toBe(201);
    expect(data.id).toBe('order-test-1');
  });

  it('should accept email with plus addressing', async () => {
    (prisma.$transaction as jest.Mock).mockResolvedValue({
      id: 'order-plus',
      customerEmail: 'user+tag@example.com',
      totalCents: 3238,
      items: [],
    });

    const response = await createOrder(
      createRequest('POST', '/api/orders', {
        customerEmail: 'user+tag@example.com',
        customerName: 'John Doe',
        shippingAddress: '123 Main St',
        items: [{ itemType: 'game', gameId: 1, quantity: 1, priceCents: 2999 }],
      })
    );

    // Should NOT be rejected by email validation
    expect(response.status).toBe(201);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/orders/[orderId] — Individual Order Lookup
// ═══════════════════════════════════════════════════════════════════

describe('GET /api/orders/[orderId] — Individual order lookup', () => {
  it('should return order details when found', async () => {
    const mockOrder = {
      id: 'order-abc-123',
      customerEmail: 'buyer@example.com',
      customerName: 'Jane Doe',
      status: 'paid',
      totalCents: 4999,
      shippingCents: 899,
      taxCents: 400,
      items: [{
        id: 1,
        itemType: 'game',
        quantity: 1,
        priceCents: 4999,
        game: { title: 'Hack Your Deck', slug: 'hack-your-deck', imageUrl: '/img.jpg' },
        merch: null,
      }],
      statusHistory: [{ status: 'paid', createdAt: new Date().toISOString() }],
    };
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

    const request = new Request('http://localhost:3000/api/orders/order-abc-123');
    const response = await getOrderById(request, {
      params: Promise.resolve({ orderId: 'order-abc-123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('order-abc-123');
    expect(data.customerEmail).toBe('buyer@example.com');
    expect(data.items).toHaveLength(1);
    expect(data.items[0].game.title).toBe('Hack Your Deck');
  });

  it('should return 404 when order not found', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/orders/nonexistent');
    const response = await getOrderById(request, {
      params: Promise.resolve({ orderId: 'nonexistent' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Order not found');
  });

  it('should include game and merch details in items', async () => {
    const mockOrder = {
      id: 'order-mixed',
      items: [
        { id: 1, itemType: 'game', game: { title: 'Game 1', slug: 'game-1', imageUrl: '/g1.jpg' }, merch: null },
        { id: 2, itemType: 'merch', game: null, merch: { name: 'Shirt', slug: 'shirt', imageUrl: '/s1.jpg' } },
      ],
      statusHistory: [],
    };
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

    const request = new Request('http://localhost:3000/api/orders/order-mixed');
    const response = await getOrderById(request, {
      params: Promise.resolve({ orderId: 'order-mixed' }),
    });
    const data = await response.json();

    expect(data.items[0].game.title).toBe('Game 1');
    expect(data.items[1].merch.name).toBe('Shirt');
  });
});

// ═══════════════════════════════════════════════════════════════════
// PATCH /api/orders/[orderId] — Simulated Payment Confirmation
// ═══════════════════════════════════════════════════════════════════

describe('PATCH /api/orders/[orderId] — Simulated payment confirmation', () => {
  it('should mark pending order as paid in simulated mode', async () => {
    mockIsSimulatedMode.mockReturnValue(true);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      id: 'order-sim-1',
      status: 'pending',
    });

    const updatedOrder = { id: 'order-sim-1', status: 'paid', paidAt: new Date() };
    (prisma.$transaction as jest.Mock).mockResolvedValue(updatedOrder);

    const request = new Request('http://localhost:3000/api/orders/order-sim-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'simulate-payment' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await patchOrder(request, {
      params: Promise.resolve({ orderId: 'order-sim-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('paid');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should reject simulated payment when not in simulated mode', async () => {
    mockIsSimulatedMode.mockReturnValue(false);

    const request = new Request('http://localhost:3000/api/orders/order-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'simulate-payment' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await patchOrder(request, {
      params: Promise.resolve({ orderId: 'order-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('not available');
  });

  it('should return 404 for nonexistent order', async () => {
    mockIsSimulatedMode.mockReturnValue(true);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/orders/bad-id', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'simulate-payment' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await patchOrder(request, {
      params: Promise.resolve({ orderId: 'bad-id' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Order not found');
  });

  it('should reject payment for non-pending order', async () => {
    mockIsSimulatedMode.mockReturnValue(true);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      id: 'order-already-paid',
      status: 'paid',
    });

    const request = new Request('http://localhost:3000/api/orders/order-already-paid', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'simulate-payment' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await patchOrder(request, {
      params: Promise.resolve({ orderId: 'order-already-paid' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Cannot confirm payment');
  });

  it('should reject cancelled order', async () => {
    mockIsSimulatedMode.mockReturnValue(true);
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      id: 'order-cancelled',
      status: 'cancelled',
    });

    const request = new Request('http://localhost:3000/api/orders/order-cancelled', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'simulate-payment' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await patchOrder(request, {
      params: Promise.resolve({ orderId: 'order-cancelled' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Cannot confirm payment');
  });

  it('should reject unknown action', async () => {
    const request = new Request('http://localhost:3000/api/orders/order-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'unknown-action' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await patchOrder(request, {
      params: Promise.resolve({ orderId: 'order-1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid action');
  });
});
