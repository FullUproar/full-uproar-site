import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Store is not yet open for orders - set to true when ready to launch
const STORE_OPEN = false;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    // Check if store is open (allow admins to bypass for testing)
    if (!STORE_OPEN) {
      let isAdmin = false;

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { role: true }
        });
        isAdmin = user?.role === 'ADMIN';
      }

      if (!isAdmin) {
        return NextResponse.json({
          error: 'Store coming soon! Our game mods launch Spring 2026.'
        }, { status: 503 });
      }
    }

    const { orderId, amount, currency = 'usd' } = await request.json();

    // Verify order exists and belongs to the user (if authenticated)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify amount matches order total
    if (order.totalCents !== amount) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // Check if we're in test mode or Stripe is not configured
    if (!stripe || process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === 'true') {
      // Return a mock payment intent for test mode
      return NextResponse.json({
        clientSecret: `test_secret_${orderId}`,
        amount,
        currency,
        testMode: true
      });
    }

    // Create metadata for the payment
    const metadata: Record<string, string> = {
      orderId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
    };

    if (userId) {
      metadata.userId = userId;
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Order ${orderId} - ${order.items.length} items`,
      receipt_email: order.customerEmail,
      shipping: {
        name: order.customerName,
        address: {
          line1: order.shippingAddress,
        },
      },
    });

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentIntentId: paymentIntent.id,
        status: 'payment_pending'
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      testMode: false
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent', details: error.message },
      { status: 500 }
    );
  }
}