import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCustomerReplyNotification } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { message } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Find ticket by access token
    const ticket = await prisma.supportTicket.findUnique({
      where: { accessToken: token },
      include: {
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Don't allow replies on closed tickets
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return NextResponse.json(
        { error: 'Cannot reply to a closed ticket' },
        { status: 400 }
      );
    }

    // Add the message
    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: 'customer',
        senderName: ticket.customerName,
        message: message.trim(),
        isInternal: false,
        ...(ticket.userId && { senderId: ticket.userId }),
      },
    });

    // Update ticket status to open if it was waiting on customer
    if (ticket.status === 'waiting_on_customer') {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: 'open' },
      });
    }

    // Build conversation history for email
    const allMessages = [...ticket.messages, {
      id: newMessage.id,
      senderType: newMessage.senderType,
      senderName: newMessage.senderName,
      message: newMessage.message,
      createdAt: newMessage.createdAt,
      isInternal: false,
    }];

    // Send email notification to support team with full conversation
    await sendCustomerReplyNotification({
      ticketNumber: ticket.ticketNumber,
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      category: ticket.category,
      subject: ticket.subject,
      newMessage: message.trim(),
      conversationHistory: allMessages.map((m) => ({
        senderType: m.senderType,
        senderName: m.senderName || 'Unknown',
        message: m.message,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
      })),
    });

    console.log('Customer reply added to ticket:', {
      ticketNumber: ticket.ticketNumber,
      messageId: newMessage.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}
