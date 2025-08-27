import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const adminCheck = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!adminCheck || (adminCheck.role !== 'ADMIN' && adminCheck.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all customers with their order statistics
    const customers = await prisma.user.findMany({
      include: {
        orders: {
          select: {
            id: true,
            totalCents: true,
            createdAt: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate customer metrics
    const enrichedCustomers = customers.map(customer => {
      const totalOrders = customer.orders.length;
      const totalSpent = customer.orders.reduce((sum, order) => 
        sum + (order.totalCents / 100), 0
      );
      
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      
      // Calculate customer segment based on behavior
      let segment = 'New';
      if (totalOrders === 0) {
        segment = 'Potential';
      } else if (totalOrders >= 10 && totalSpent >= 1000) {
        segment = 'Champions';
      } else if (totalOrders >= 5) {
        segment = 'Loyal';
      } else if (totalOrders >= 2) {
        segment = 'Promising';
      }
      
      // Check if at risk (no orders in last 60 days)
      const lastOrderDate = customer.orders.length > 0 
        ? Math.max(...customer.orders.map(o => new Date(o.createdAt).getTime()))
        : null;
      
      if (lastOrderDate) {
        const daysSinceLastOrder = (Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24);
        if (daysSinceLastOrder > 60) {
          segment = 'At Risk';
        }
      }

      return {
        id: customer.id,
        name: customer.displayName || customer.username || customer.email.split('@')[0],
        email: customer.email,
        phone: null, // User model doesn't have phone field
        createdAt: customer.createdAt,
        lastOrderDate: lastOrderDate ? new Date(lastOrderDate).toISOString() : null,
        totalOrders,
        totalSpent,
        averageOrderValue,
        segment,
        role: customer.role,
        emailVerified: customer.emailVerified,
        hasCompletedOnboarding: false // User model doesn't have this field
      };
    });

    return NextResponse.json(enrichedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}