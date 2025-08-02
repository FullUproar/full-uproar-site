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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parseInt(id) },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        order: {
          include: {
            items: {
              include: {
                game: true,
                merch: true
              }
            }
          }
        },
        assignedUser: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ticket' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check admin permission
    await requirePermission('admin:access');
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    const { 
      status, 
      priority, 
      category, 
      assignedToId, 
      internalNotes,
      resolution 
    } = updates;

    // Get current ticket
    const currentTicket = await prisma.supportTicket.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Update ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(category && { category }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(resolution !== undefined && { resolution }),
        ...(status === 'resolved' && !currentTicket.resolvedAt && { resolvedAt: new Date() })
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    // If status changed, add system message
    if (status && status !== currentTicket.status) {
      await prisma.supportMessage.create({
        data: {
          ticketId: parseInt(id),
          senderType: 'system',
          senderName: user.displayName || user.username,
          message: `Status changed from ${currentTicket.status} to ${status}`,
          isInternal: true
        }
      });
    }

    // If assigned to someone, add system message
    if (assignedToId !== undefined && assignedToId !== currentTicket.assignedTo) {
      const assignedUser = assignedToId ? await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { displayName: true, username: true }
      }) : null;

      await prisma.supportMessage.create({
        data: {
          ticketId: parseInt(id),
          senderType: 'system',
          senderName: user.displayName || user.username,
          message: assignedUser 
            ? `Assigned to ${assignedUser.displayName || assignedUser.username}`
            : 'Unassigned',
          isInternal: true
        }
      });
    }

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check super admin permission for deletion
    await requirePermission('admin:super');

    // Soft delete by setting status to closed
    const ticket = await prisma.supportTicket.update({
      where: { id: parseInt(id) },
      data: {
        status: 'closed',
        resolvedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error closing ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to close ticket' },
      { status: error.message === 'Super admin access required' ? 403 : 500 }
    );
  }
}