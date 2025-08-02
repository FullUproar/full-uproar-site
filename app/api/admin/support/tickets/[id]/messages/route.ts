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

    const messages = await prisma.supportMessage.findMany({
      where: { ticketId: parseInt(id) },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}

export async function POST(
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

    const data = await request.json();
    const { message, isInternal } = data;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Verify ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Create message
    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId: parseInt(id),
        senderType: 'staff',
        senderName: user.displayName || user.username,
        message: message.trim(),
        isInternal: isInternal || false
      }
    });

    // Update ticket status if it was waiting_customer
    if (ticket.status === 'waiting_customer' && !isInternal) {
      await prisma.supportTicket.update({
        where: { id: parseInt(id) },
        data: { status: 'in_progress' }
      });
    }

    // Update ticket's updatedAt timestamp
    await prisma.supportTicket.update({
      where: { id: parseInt(id) },
      data: { updatedAt: new Date() }
    });

    // Send email notification to customer if not internal
    if (!isInternal) {
      // TODO: Implement email service
      // await sendTicketReplyEmail(ticket.customerEmail, ticket, newMessage);
    }

    return NextResponse.json(newMessage);
  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create message' },
      { status: 500 }
    );
  }
}