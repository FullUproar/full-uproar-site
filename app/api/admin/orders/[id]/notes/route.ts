import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check admin permission
    await requirePermission('admin:access');

    const notes = await prisma.orderNote.findMany({
      where: { orderId: id },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('Error fetching order notes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notes' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    
    // Check admin permission
    await requirePermission('admin:access');
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const { note, noteType = 'general' } = await request.json();

    if (!note?.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create note
    const orderNote = await prisma.orderNote.create({
      data: {
        orderId,
        userId: user.id,
        note: note.trim(),
        noteType
      },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    // Also add to status history if it's an important note
    if (noteType === 'issue' || noteType === 'customer') {
      await prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: order.status,
          notes: `Note added: ${note.trim()}`
        }
      });
    }

    return NextResponse.json(orderNote);
  } catch (error: any) {
    console.error('Error creating order note:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create note' },
      { status: 500 }
    );
  }
}