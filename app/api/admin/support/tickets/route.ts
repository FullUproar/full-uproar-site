import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    await requirePermission('admin:access');

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { orderId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch tickets with relations
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        order: {
          select: {
            id: true,
            totalCents: true,
            status: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Calculate stats
    const stats = await calculateTicketStats();

    return NextResponse.json({
      tickets,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { 
      customerName, 
      customerEmail, 
      orderId, 
      category, 
      priority, 
      subject, 
      message,
      assignToSelf 
    } = data;

    // Generate ticket number
    const ticketNumber = await generateTicketNumber();

    // Create ticket with initial message
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerName,
        customerEmail,
        orderId,
        category,
        priority: priority || 'normal',
        status: 'open',
        subject,
        ...(assignToSelf && { assignedToId: user.id }),
        messages: {
          create: {
            senderType: 'customer',
            senderName: customerName,
            message,
            isInternal: false
          }
        }
      },
      include: {
        messages: true,
        order: {
          select: {
            id: true,
            totalCents: true,
            status: true
          }
        }
      }
    });

    // Send email notification (TODO: implement email service)
    // await sendTicketConfirmationEmail(customerEmail, ticket);

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

async function calculateTicketStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalOpen, totalInProgress, totalResolvedToday, avgResponseTime] = await Promise.all([
    // Total open tickets
    prisma.supportTicket.count({
      where: { status: 'open' }
    }),
    
    // Total in progress
    prisma.supportTicket.count({
      where: { status: 'in_progress' }
    }),
    
    // Resolved today
    prisma.supportTicket.count({
      where: {
        status: 'resolved',
        updatedAt: { gte: startOfDay }
      }
    }),
    
    // Average response time (in hours)
    calculateAverageResponseTime()
  ]);

  return {
    totalOpen,
    totalInProgress,
    totalResolved: totalResolvedToday,
    avgResponseTime
  };
}

async function calculateAverageResponseTime(): Promise<number> {
  // Get tickets with at least one staff response
  const tickets = await prisma.supportTicket.findMany({
    where: {
      messages: {
        some: {
          senderType: 'staff'
        }
      }
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc'
        },
        take: 2 // Just need first customer and first staff message
      }
    }
  });

  if (tickets.length === 0) return 0;

  let totalResponseTime = 0;
  let validTickets = 0;

  for (const ticket of tickets) {
    const customerMessage = ticket.messages.find(m => m.senderType === 'customer');
    const staffMessage = ticket.messages.find(m => m.senderType === 'staff');
    
    if (customerMessage && staffMessage) {
      const responseTime = staffMessage.createdAt.getTime() - customerMessage.createdAt.getTime();
      totalResponseTime += responseTime;
      validTickets++;
    }
  }

  if (validTickets === 0) return 0;

  // Convert to hours and round
  const avgMs = totalResponseTime / validTickets;
  const avgHours = Math.round(avgMs / (1000 * 60 * 60));
  
  return avgHours;
}

async function generateTicketNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Get count of tickets this month
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const count = await prisma.supportTicket.count({
    where: {
      createdAt: { gte: startOfMonth }
    }
  });
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `TKT${year}${month}${sequence}`;
}