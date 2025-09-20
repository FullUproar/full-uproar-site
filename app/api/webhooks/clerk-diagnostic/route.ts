import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';

// Store last 10 webhook calls for analysis
let webhookHistory: any[] = [];

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();

  try {
    // Get headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // Get all headers for debugging
    const allHeaders: Record<string, string> = {};
    headerPayload.forEach((value, key) => {
      allHeaders[key] = value;
    });

    // Parse body
    const payload = await req.json();

    // Store in history
    const historyEntry = {
      timestamp,
      type: payload.type,
      object: payload.object,
      hasSignature: !!svix_signature,
      headers: {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature ? 'present' : 'missing',
        'user-agent': allHeaders['user-agent'],
        'content-type': allHeaders['content-type']
      },
      data: payload.type?.startsWith('user.') ? {
        id: payload.data?.id,
        email: payload.data?.email_addresses?.[0]?.email_address,
        username: payload.data?.username,
        created_at: payload.data?.created_at
      } : 'non-user event'
    };

    webhookHistory.unshift(historyEntry);
    if (webhookHistory.length > 10) {
      webhookHistory = webhookHistory.slice(0, 10);
    }

    console.log('[DIAGNOSTIC] ========================================');
    console.log('[DIAGNOSTIC] Webhook received:', timestamp);
    console.log('[DIAGNOSTIC] Event type:', payload.type);
    console.log('[DIAGNOSTIC] Object type:', payload.object);
    console.log('[DIAGNOSTIC] Has Svix signature:', !!svix_signature);

    // If it's a user event, try to process it
    if (payload.type === 'user.created' || payload.type === 'user.updated') {
      const userData = payload.data;
      console.log('[DIAGNOSTIC] User data:', {
        id: userData?.id,
        email: userData?.email_addresses?.[0]?.email_address,
        verified: userData?.email_addresses?.[0]?.verification?.status
      });

      // Check if user exists in database
      if (userData?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { clerkId: userData.id }
        });

        console.log('[DIAGNOSTIC] User in database:', !!dbUser);

        if (!dbUser && userData?.email_addresses?.[0]?.email_address) {
          console.log('[DIAGNOSTIC] User missing from database, creating...');

          const email = userData.email_addresses[0].email_address;
          let role = 'USER';
          if (email.toLowerCase() === 'info@fulluproar.com') {
            role = 'GOD';
          } else if (email.toLowerCase() === 'annika@fulluproar.com') {
            role = 'ADMIN';
          }

          try {
            const newUser = await prisma.user.create({
              data: {
                clerkId: userData.id,
                email: email,
                username: userData.username || email.split('@')[0],
                displayName: userData.first_name || userData.username || email.split('@')[0],
                avatarUrl: userData.image_url,
                role: role as any,
                cultDevotion: 0,
                cultLevel: 0,
                achievementPoints: 0
              }
            });
            console.log('[DIAGNOSTIC] User created successfully:', newUser.email);
          } catch (error) {
            console.error('[DIAGNOSTIC] Failed to create user:', error);
          }
        }
      }
    }

    console.log('[DIAGNOSTIC] ========================================');

    return NextResponse.json({
      received: true,
      type: payload.type,
      timestamp
    });

  } catch (error) {
    console.error('[DIAGNOSTIC] Error:', error);

    // Still store error in history
    webhookHistory.unshift({
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      error: 'Diagnostic error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get Clerk users
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({ limit: 5 });

    // Get database users
    const dbUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        email: true,
        clerkId: true,
        role: true,
        createdAt: true
      }
    });

    // Check for mismatches
    const clerkIds = clerkUsers.data.map(u => u.id);
    const dbClerkIds = dbUsers.map(u => u.clerkId);
    const missingInDb = clerkIds.filter(id => !dbClerkIds.includes(id));

    return NextResponse.json({
      diagnostic: {
        webhookSecretConfigured: !!process.env.CLERK_WEBHOOK_SECRET,
        secretLength: process.env.CLERK_WEBHOOK_SECRET?.length || 0,
        secretPrefix: process.env.CLERK_WEBHOOK_SECRET?.substring(0, 10) || 'not set'
      },
      recentWebhooks: webhookHistory,
      comparison: {
        clerkUsersCount: clerkUsers.totalCount,
        dbUsersCount: await prisma.user.count(),
        recentClerkUsers: clerkUsers.data.map(u => ({
          id: u.id,
          email: u.emailAddresses[0]?.emailAddress,
          createdAt: new Date(u.createdAt).toISOString()
        })),
        recentDbUsers: dbUsers,
        missingInDatabase: missingInDb
      },
      instructions: {
        checkWebhook: 'Visit Clerk Dashboard → Webhooks and verify:',
        step1: '1. Only ONE webhook endpoint exists',
        step2: '2. URL is: https://fulluproar.com/api/webhooks/clerk',
        step3: '3. Subscribed to: user.created, user.updated, user.deleted',
        step4: '4. NOT subscribed to email.* events',
        step5: '5. Signing Secret matches CLERK_WEBHOOK_SECRET in Vercel',

        temporaryFix: 'To sync missing users immediately:',
        fix1: 'Use /admin/webhook-test page',
        fix2: 'Get Clerk ID from this diagnostic',
        fix3: 'Manually create user with that ID'
      }
    });

  } catch (error) {
    console.error('[DIAGNOSTIC] GET Error:', error);
    return NextResponse.json({
      error: 'Failed to get diagnostic info',
      details: error instanceof Error ? error.message : 'Unknown error',
      recentWebhooks: webhookHistory
    }, { status: 500 });
  }
}