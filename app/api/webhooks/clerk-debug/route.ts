import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  // Disable debug webhook in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'Debug webhook disabled in production'
    }, { status: 403 });
  }

  console.log('[CLERK WEBHOOK DEBUG] ========================================');
  console.log('[CLERK WEBHOOK DEBUG] Webhook received at:', new Date().toISOString());

  try {
    // Log headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    console.log('[CLERK WEBHOOK DEBUG] Headers present:', {
      svix_id: !!svix_id,
      svix_timestamp: !!svix_timestamp,
      svix_signature: !!svix_signature
    });

    // Get the body
    const payload = await req.json();
    console.log('[CLERK WEBHOOK DEBUG] Event type:', payload.type);
    console.log('[CLERK WEBHOOK DEBUG] Event data:', JSON.stringify(payload.data, null, 2));

    if (payload.type === 'user.created') {
      const { id, email_addresses } = payload.data;
      const email = email_addresses?.[0]?.email_address;

      console.log('[CLERK WEBHOOK DEBUG] Processing user.created for:', email);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id }
      });

      if (existingUser) {
        console.log('[CLERK WEBHOOK DEBUG] User already exists in database:', existingUser.email);
      } else {
        console.log('[CLERK WEBHOOK DEBUG] User does not exist, would create with email:', email);
      }

      // Check database connection
      const userCount = await prisma.user.count();
      console.log('[CLERK WEBHOOK DEBUG] Total users in database:', userCount);
    }

    // Log to a webhook log table (if you want to persist logs)
    try {
      await prisma.$executeRaw`
        INSERT INTO "WebhookLog" (id, event_type, payload, created_at)
        VALUES (gen_random_uuid(), ${payload.type}, ${JSON.stringify(payload)}, NOW())
      `.catch(() => {
        // Table might not exist, that's ok
        console.log('[CLERK WEBHOOK DEBUG] WebhookLog table does not exist (this is ok)');
      });
    } catch (e) {
      // Ignore if table doesn't exist
    }

    console.log('[CLERK WEBHOOK DEBUG] ========================================');

    return NextResponse.json({
      received: true,
      type: payload.type,
      debug: 'Check server logs for details'
    });

  } catch (error) {
    console.error('[CLERK WEBHOOK DEBUG] ERROR:', error);
    return NextResponse.json({
      error: 'Debug webhook error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}