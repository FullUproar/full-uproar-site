import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        paymentMethods: {
          orderBy: [
            { isDefault: 'desc' },
            { lastUsedAt: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!user) {
      return NextResponse.json([]);
    }

    return NextResponse.json(user.paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentMethodId, nickname } = body;

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      const { user: clerkUser } = await auth();
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || '',
          displayName: clerkUser?.fullName || clerkUser?.firstName || 'User'
        }
      });
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId && stripe) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.displayName || undefined,
        metadata: {
          userId: user.id,
          clerkId: userId
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      });
    }

    // Attach payment method to customer in Stripe
    if (stripe && stripeCustomerId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });

      // Get payment method details from Stripe
      const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      // If this is the first payment method or marked as default, set it as default
      const isFirstMethod = (await prisma.userPaymentMethod.count({ where: { userId: user.id } })) === 0;
      
      if (body.isDefault || isFirstMethod) {
        // Set as default in Stripe
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });

        // Unset other defaults in database
        await prisma.userPaymentMethod.updateMany({
          where: { userId: user.id },
          data: { isDefault: false }
        });
      }

      // Save payment method to database
      const paymentMethod = await prisma.userPaymentMethod.create({
        data: {
          userId: user.id,
          stripePaymentId: paymentMethodId,
          type: stripePaymentMethod.type,
          isDefault: body.isDefault || isFirstMethod,
          brand: stripePaymentMethod.card?.brand,
          last4: stripePaymentMethod.card?.last4,
          expMonth: stripePaymentMethod.card?.exp_month,
          expYear: stripePaymentMethod.card?.exp_year,
          nickname
        }
      });

      return NextResponse.json(paymentMethod, { status: 201 });
    } else {
      // Test mode - save mock payment method
      const paymentMethod = await prisma.userPaymentMethod.create({
        data: {
          userId: user.id,
          stripePaymentId: paymentMethodId || `test_${Date.now()}`,
          type: 'card',
          isDefault: body.isDefault || true,
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          nickname: nickname || 'Test Card'
        }
      });

      return NextResponse.json(paymentMethod, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');
    
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get payment method
    const paymentMethod = await prisma.userPaymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        userId: user.id
      }
    });

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Detach from Stripe customer
    if (stripe && paymentMethod.stripePaymentId) {
      try {
        await stripe.paymentMethods.detach(paymentMethod.stripePaymentId);
      } catch (error) {
        console.error('Error detaching from Stripe:', error);
      }
    }

    // Delete from database
    await prisma.userPaymentMethod.delete({
      where: { id: paymentMethodId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
  }
}