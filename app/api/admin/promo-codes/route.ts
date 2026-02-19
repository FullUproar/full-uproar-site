import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';

// GET - List all promo codes
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'MODERATOR', 'SUPPORT', 'GOD'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'all'; // all, active, expired, inactive
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status === 'active') {
      where.isActive = true;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
    } else if (status === 'expired') {
      where.expiresAt = { lt: new Date() };
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { orders: true, usageHistory: true }
          }
        }
      }),
      prisma.promoCode.count({ where })
    ]);

    // Get stats
    const [totalActive, totalExpired, totalUsageToday] = await Promise.all([
      prisma.promoCode.count({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        }
      }),
      prisma.promoCode.count({
        where: { expiresAt: { lt: new Date() } }
      }),
      prisma.promoCodeUsage.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      })
    ]);

    return NextResponse.json({
      promoCodes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalActive,
        totalExpired,
        totalUsageToday
      }
    });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

// POST - Create new promo code
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const adminUser = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, displayName: true, username: true }
    });

    if (!adminUser || !['ADMIN', 'GOD'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderCents,
      maxDiscountCents,
      maxUses,
      maxUsesPerUser,
      applicableToGames,
      applicableToMerch,
      specificGameIds,
      specificMerchIds,
      excludedGameIds,
      excludedMerchIds,
      newCustomersOnly,
      specificUserIds,
      startsAt,
      expiresAt,
      isTest
    } = body;

    // Validate required fields
    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: 'Code, discountType, and discountValue are required' },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { error: 'discountType must be "percentage" or "fixed"' },
        { status: 400 }
      );
    }

    // Validate percentage range
    if (discountType === 'percentage' && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A promo code with this code already exists' },
        { status: 400 }
      );
    }

    // Create promo code
    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        description,
        discountType,
        discountValue,
        minOrderCents: minOrderCents || null,
        maxDiscountCents: maxDiscountCents || null,
        maxUses: maxUses || null,
        maxUsesPerUser: maxUsesPerUser || 1,
        applicableToGames: applicableToGames !== false,
        applicableToMerch: applicableToMerch !== false,
        specificGameIds: specificGameIds ? JSON.stringify(specificGameIds) : null,
        specificMerchIds: specificMerchIds ? JSON.stringify(specificMerchIds) : null,
        excludedGameIds: excludedGameIds ? JSON.stringify(excludedGameIds) : null,
        excludedMerchIds: excludedMerchIds ? JSON.stringify(excludedMerchIds) : null,
        newCustomersOnly: newCustomersOnly || false,
        specificUserIds: specificUserIds ? JSON.stringify(specificUserIds) : null,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isTest: isTest || false,
        createdBy: adminUser.displayName || adminUser.username || userId,
      }
    });

    return NextResponse.json({
      success: true,
      promoCode,
      message: 'Promo code created successfully'
    });
  } catch (error) {
    console.error('Error creating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}

// PUT - Update promo code
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const adminUser = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true }
    });

    if (!adminUser || !['ADMIN', 'GOD'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Promo code ID is required' },
        { status: 400 }
      );
    }

    // If updating code, check it doesn't conflict
    if (updateData.code) {
      const existing = await prisma.promoCode.findFirst({
        where: {
          code: updateData.code.toUpperCase().trim(),
          id: { not: parseInt(id) }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A promo code with this code already exists' },
          { status: 400 }
        );
      }
      updateData.code = updateData.code.toUpperCase().trim();
    }

    // Process JSON fields
    if (updateData.specificGameIds !== undefined) {
      updateData.specificGameIds = updateData.specificGameIds ? JSON.stringify(updateData.specificGameIds) : null;
    }
    if (updateData.specificMerchIds !== undefined) {
      updateData.specificMerchIds = updateData.specificMerchIds ? JSON.stringify(updateData.specificMerchIds) : null;
    }
    if (updateData.excludedGameIds !== undefined) {
      updateData.excludedGameIds = updateData.excludedGameIds ? JSON.stringify(updateData.excludedGameIds) : null;
    }
    if (updateData.excludedMerchIds !== undefined) {
      updateData.excludedMerchIds = updateData.excludedMerchIds ? JSON.stringify(updateData.excludedMerchIds) : null;
    }
    if (updateData.specificUserIds !== undefined) {
      updateData.specificUserIds = updateData.specificUserIds ? JSON.stringify(updateData.specificUserIds) : null;
    }

    // Process date fields
    if (updateData.startsAt) {
      updateData.startsAt = new Date(updateData.startsAt);
    }
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    const promoCode = await prisma.promoCode.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      promoCode,
      message: 'Promo code updated successfully'
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to update promo code' },
      { status: 500 }
    );
  }
}

// DELETE - Delete promo code
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const adminUser = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true }
    });

    if (!adminUser || !['ADMIN', 'GOD'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Promo code ID is required' },
        { status: 400 }
      );
    }

    // Check if promo code has been used
    const usageCount = await prisma.promoCodeUsage.count({
      where: { promoCodeId: parseInt(id) }
    });

    if (usageCount > 0) {
      // Don't delete, just deactivate
      await prisma.promoCode.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      return NextResponse.json({
        success: true,
        message: 'Promo code has been deactivated (has usage history)'
      });
    }

    // Delete if no usage
    await prisma.promoCode.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 }
    );
  }
}
