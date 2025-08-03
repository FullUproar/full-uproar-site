import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await requirePermission('admin:access');

    const body = await request.json();
    const { type, confirmPhrase } = body;

    // Require confirmation phrase for safety
    if (confirmPhrase !== 'CLEAR TEST DATA') {
      return NextResponse.json(
        { error: 'Invalid confirmation phrase. Type "CLEAR TEST DATA" to confirm.' },
        { status: 400 }
      );
    }

    let results: any = {};

    if (type === 'orders' || type === 'all') {
      // Delete order-related data
      const statusHistory = await prisma.orderStatusHistory.deleteMany({});
      const orderItems = await prisma.orderItem.deleteMany({});
      const orders = await prisma.order.deleteMany({});
      
      // Reset reserved inventory
      const inventoryReset = await prisma.inventory.updateMany({
        where: { reserved: { gt: 0 } },
        data: { reserved: 0 }
      });
      
      const gameInventoryReset = await prisma.gameInventory.updateMany({
        where: { reserved: { gt: 0 } },
        data: { reserved: 0 }
      });

      results.orders = {
        statusHistory: statusHistory.count,
        orderItems: orderItems.count,
        orders: orders.count,
        inventoryReset: inventoryReset.count,
        gameInventoryReset: gameInventoryReset.count
      };
    }

    if (type === 'users' || type === 'all') {
      // Delete non-admin users (be careful!)
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });
      
      const adminIds = adminUsers.map(u => u.id);
      
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          id: { notIn: adminIds }
        }
      });

      results.users = {
        deleted: deletedUsers.count,
        adminsKept: adminIds.length
      };
    }

    if (type === 'reviews' || type === 'all') {
      const reviews = await prisma.review.deleteMany({});
      results.reviews = reviews.count;
    }

    if (type === 'analytics' || type === 'all') {
      const analytics = await prisma.analyticsEvent.deleteMany({});
      results.analytics = analytics.count;
    }

    // Note: Cart functionality uses localStorage, not database

    return NextResponse.json({
      success: true,
      message: 'Test data cleared successfully',
      results
    });

  } catch (error) {
    console.error('Error clearing test data:', error);
    return NextResponse.json(
      { error: 'Failed to clear test data' },
      { status: 500 }
    );
  }
}