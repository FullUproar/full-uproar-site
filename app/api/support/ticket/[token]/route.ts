import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

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

    // Return ticket data (excluding sensitive fields)
    return NextResponse.json({
      ticketNumber: ticket.ticketNumber,
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      category: ticket.category,
      status: ticket.status,
      subject: ticket.subject,
      createdAt: ticket.createdAt.toISOString(),
      messages: ticket.messages.map((m) => ({
        id: m.id,
        senderType: m.senderType,
        senderName: m.senderName,
        message: m.message,
        createdAt: m.createdAt.toISOString(),
        isInternal: m.isInternal,
      })),
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}
