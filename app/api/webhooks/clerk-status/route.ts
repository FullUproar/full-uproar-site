import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// This endpoint just logs what type of event was received for debugging
export async function POST(req: Request) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Log headers presence
  console.log('[WEBHOOK STATUS] ========================================');
  console.log('[WEBHOOK STATUS] Request received at:', new Date().toISOString());
  console.log('[WEBHOOK STATUS] Headers present:', {
    svix_id: !!svix_id,
    svix_timestamp: !!svix_timestamp,
    svix_signature: !!svix_signature
  });

  try {
    const payload = await req.json();
    console.log('[WEBHOOK STATUS] Event type:', payload.type);
    console.log('[WEBHOOK STATUS] Event object:', payload.object);

    // Log user data if present
    if (payload.type === 'user.created' || payload.type === 'user.updated') {
      console.log('[WEBHOOK STATUS] User event data:', {
        id: payload.data?.id,
        email: payload.data?.email_addresses?.[0]?.email_address,
        username: payload.data?.username
      });
    }

    // Log what events we're actually receiving
    const eventCategory = payload.type?.split('.')[0];
    console.log('[WEBHOOK STATUS] Event category:', eventCategory);

    return NextResponse.json({
      received: true,
      type: payload.type,
      category: eventCategory,
      message: 'Event logged for debugging'
    });

  } catch (error) {
    console.error('[WEBHOOK STATUS] Error parsing webhook:', error);
    return NextResponse.json({
      error: 'Failed to parse webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  } finally {
    console.log('[WEBHOOK STATUS] ========================================');
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Webhook status endpoint',
    instructions: [
      '1. In Clerk Dashboard, go to Webhooks',
      '2. Check that you are subscribed to these events:',
      '   - user.created',
      '   - user.updated',
      '   - user.deleted',
      '3. NOT email.* events (these are causing the failures)',
      '4. The webhook URL should be: https://fulluproar.com/api/webhooks/clerk',
      '5. Make sure the Signing Secret is copied to CLERK_WEBHOOK_SECRET in Vercel'
    ],
    currentIssue: 'You are receiving email.created events instead of user events. Update webhook subscriptions in Clerk.'
  });
}