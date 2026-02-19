import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';
import { rateLimit } from '@/lib/middleware/rate-limit';

interface CartItem {
  id: number;
  type: 'game' | 'merch';
  priceCents: number;
  quantity?: number;
}

export async function POST(request: NextRequest) {
  // Rate limit promo code validation to prevent brute force guessing
  const rateLimitResponse = await rateLimit(request, 'promo');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { code, cartItems, userEmail } = body as {
      code: string;
      cartItems: CartItem[];
      userEmail?: string;
    };

    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      );
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    // Get user ID if authenticated
    const session = await getSession();
    const userId = session?.user?.id;

    // Get client IP for guest abuse prevention
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     null;

    // Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() }
    });

    if (!promoCode) {
      return NextResponse.json(
        { valid: false, error: 'Invalid promo code' },
        { status: 400 }
      );
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { valid: false, error: 'This promo code is no longer active' },
        { status: 400 }
      );
    }

    // Check start date
    if (promoCode.startsAt && new Date() < promoCode.startsAt) {
      return NextResponse.json(
        { valid: false, error: 'This promo code is not yet active' },
        { status: 400 }
      );
    }

    // Check expiry
    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return NextResponse.json(
        { valid: false, error: 'This promo code has expired' },
        { status: 400 }
      );
    }

    // Check max uses
    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return NextResponse.json(
        { valid: false, error: 'This promo code has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check per-user limit (includes IP check for guest abuse prevention)
    if (userId || userEmail || clientIp) {
      const userUsageCount = await prisma.promoCodeUsage.count({
        where: {
          promoCodeId: promoCode.id,
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(userEmail ? [{ userEmail }] : []),
            // For guests, also check IP to prevent multiple email abuse
            ...(!userId && clientIp ? [{ ipAddress: clientIp }] : [])
          ]
        }
      });

      if (userUsageCount >= promoCode.maxUsesPerUser) {
        return NextResponse.json(
          { valid: false, error: 'You have already used this promo code' },
          { status: 400 }
        );
      }
    }

    // Check new customers only restriction
    if (promoCode.newCustomersOnly) {
      if (userId) {
        const previousOrders = await prisma.order.count({
          where: {
            userId,
            status: { notIn: ['cancelled', 'pending'] }
          }
        });

        if (previousOrders > 0) {
          return NextResponse.json(
            { valid: false, error: 'This promo code is for new customers only' },
            { status: 400 }
          );
        }
      } else if (userEmail) {
        const previousOrders = await prisma.order.count({
          where: {
            customerEmail: userEmail,
            status: { notIn: ['cancelled', 'pending'] }
          }
        });

        if (previousOrders > 0) {
          return NextResponse.json(
            { valid: false, error: 'This promo code is for new customers only' },
            { status: 400 }
          );
        }
      }
    }

    // Check specific user restrictions
    if (promoCode.specificUserIds && userId) {
      const allowedUsers = JSON.parse(promoCode.specificUserIds) as string[];
      if (!allowedUsers.includes(userId)) {
        return NextResponse.json(
          { valid: false, error: 'This promo code is not valid for your account' },
          { status: 400 }
        );
      }
    }

    // Calculate eligible items and total
    const specificGameIds = promoCode.specificGameIds ? JSON.parse(promoCode.specificGameIds) as number[] : null;
    const specificMerchIds = promoCode.specificMerchIds ? JSON.parse(promoCode.specificMerchIds) as number[] : null;
    const excludedGameIds = promoCode.excludedGameIds ? JSON.parse(promoCode.excludedGameIds) as number[] : null;
    const excludedMerchIds = promoCode.excludedMerchIds ? JSON.parse(promoCode.excludedMerchIds) as number[] : null;

    let eligibleTotal = 0;
    const eligibleItems: CartItem[] = [];

    for (const item of cartItems) {
      const quantity = item.quantity || 1;
      let isEligible = false;

      if (item.type === 'game') {
        // Check if games are applicable
        if (!promoCode.applicableToGames) continue;

        // Check specific game restrictions
        if (specificGameIds && !specificGameIds.includes(item.id)) continue;

        // Check exclusions
        if (excludedGameIds && excludedGameIds.includes(item.id)) continue;

        isEligible = true;
      } else if (item.type === 'merch') {
        // Check if merch is applicable
        if (!promoCode.applicableToMerch) continue;

        // Check specific merch restrictions
        if (specificMerchIds && !specificMerchIds.includes(item.id)) continue;

        // Check exclusions
        if (excludedMerchIds && excludedMerchIds.includes(item.id)) continue;

        isEligible = true;
      }

      if (isEligible) {
        eligibleTotal += item.priceCents * quantity;
        eligibleItems.push(item);
      }
    }

    if (eligibleItems.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'This promo code does not apply to any items in your cart' },
        { status: 400 }
      );
    }

    // Calculate total cart value for minimum check
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.priceCents * (item.quantity || 1)), 0);

    // Check minimum order value
    if (promoCode.minOrderCents && cartTotal < promoCode.minOrderCents) {
      const minOrderDollars = (promoCode.minOrderCents / 100).toFixed(2);
      return NextResponse.json(
        { valid: false, error: `Minimum order of $${minOrderDollars} required for this promo code` },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountCents = 0;

    if (promoCode.discountType === 'percentage') {
      discountCents = Math.floor(eligibleTotal * (promoCode.discountValue / 100));
    } else {
      // Fixed discount
      discountCents = promoCode.discountValue;
    }

    // Apply max discount cap
    if (promoCode.maxDiscountCents && discountCents > promoCode.maxDiscountCents) {
      discountCents = promoCode.maxDiscountCents;
    }

    // Don't let discount exceed eligible total
    if (discountCents > eligibleTotal) {
      discountCents = eligibleTotal;
    }

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        description: promoCode.description
      },
      discount: {
        cents: discountCents,
        formatted: `$${(discountCents / 100).toFixed(2)}`,
        eligibleItemCount: eligibleItems.length
      },
      message: promoCode.discountType === 'percentage'
        ? `${promoCode.discountValue}% off applied!`
        : `$${(promoCode.discountValue / 100).toFixed(2)} off applied!`
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}
