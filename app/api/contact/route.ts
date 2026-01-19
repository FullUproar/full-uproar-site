import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { sendTicketEmails } from '@/lib/email';

// Map contact form subjects to support ticket categories
const categoryMap: Record<string, string> = {
  'general': 'general',
  'order': 'order_issue',
  'wholesale': 'wholesale',
  'support': 'product_support',
  'feedback': 'feedback',
  'media': 'media_press'
};

// Map subjects to human-readable labels for ticket subject
const subjectLabels: Record<string, string> = {
  'general': 'General Inquiry',
  'order': 'Order Issue',
  'wholesale': 'Wholesale/Retail Inquiry',
  'support': 'Product Support',
  'feedback': 'Feedback/Suggestion',
  'media': 'Media/Press Inquiry'
};

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, captchaToken } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify CAPTCHA if token provided
    if (captchaToken && process.env.TURNSTILE_SECRET_KEY) {
      const captchaResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: captchaToken,
          }),
        }
      );

      const captchaResult = await captchaResponse.json();
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: 'CAPTCHA verification failed' },
          { status: 400 }
        );
      }
    }

    // Get current user if logged in
    const { userId: clerkId } = await auth();

    // Look up internal user ID if logged in
    let internalUserId: string | null = null;
    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true }
      });
      if (user) {
        internalUserId = user.id;
      }
    }

    // Generate ticket number
    const ticketNumber = await generateTicketNumber();

    // Map subject to category
    const category = categoryMap[subject] || 'general';
    const ticketSubject = `${subjectLabels[subject] || 'Contact Form'}: ${message.slice(0, 50)}${message.length > 50 ? '...' : ''}`;

    // Create support ticket with initial message
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerName: name,
        customerEmail: email,
        category,
        priority: 'normal',
        status: 'new',
        subject: ticketSubject,
        ...(internalUserId && { userId: internalUserId }),
        tags: ['contact_form', subject],
        messages: {
          create: {
            senderType: 'customer',
            senderName: name,
            message,
            isInternal: false,
            ...(internalUserId && { senderId: internalUserId })
          }
        }
      },
      include: {
        messages: true
      }
    });

    console.log('Contact form → Support ticket created:', {
      ticketNumber: ticket.ticketNumber,
      customerEmail: ticket.customerEmail,
      category: ticket.category,
      timestamp: new Date().toISOString()
    });

    // Send email notifications (customer confirmation + team notification)
    const emailResult = await sendTicketEmails({
      ticketNumber: ticket.ticketNumber,
      accessToken: ticket.accessToken,
      customerName: name,
      customerEmail: email,
      category,
      subject: ticketSubject,
      message,
    });

    console.log('Email notifications sent:', emailResult);

    return NextResponse.json({
      success: true,
      ticketNumber: ticket.ticketNumber,
      message: `Message received! Your ticket number is ${ticket.ticketNumber}. We'll get back to you soon.`
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}
