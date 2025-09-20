import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { prisma } from '@/lib/prisma';

// Simplified webhook using Clerk's built-in verification
export async function POST(req: NextRequest) {
  console.log('[CLERK SIMPLE] ========================================');
  console.log('[CLERK SIMPLE] Webhook received at:', new Date().toISOString());

  try {
    // Use Clerk's built-in verification
    const evt = await verifyWebhook(req);

    console.log('[CLERK SIMPLE] Event type:', evt.type);
    console.log('[CLERK SIMPLE] Event verified successfully');

    // Handle user.created event
    if (evt.type === 'user.created') {
      const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

      const email = email_addresses?.[0]?.email_address;
      if (!email) {
        console.log('[CLERK SIMPLE] No email in user.created event');
        return new Response('No email', { status: 200 });
      }

      console.log('[CLERK SIMPLE] Creating user:', email);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id }
      });

      if (existingUser) {
        console.log('[CLERK SIMPLE] User already exists:', existingUser.email);
        return new Response('User already exists', { status: 200 });
      }

      // Determine role
      let role = 'USER';
      if (email.toLowerCase() === 'info@fulluproar.com') {
        role = 'GOD';
      } else if (email.toLowerCase() === 'annika@fulluproar.com') {
        role = 'ADMIN';
      }

      // Create user
      const newUser = await prisma.user.create({
        data: {
          clerkId: id,
          email: email,
          username: username || email.split('@')[0],
          displayName: first_name || username || email.split('@')[0],
          avatarUrl: image_url,
          role: role as any,
          cultDevotion: 0,
          cultLevel: 0,
          achievementPoints: 0
        }
      });

      console.log('[CLERK SIMPLE] User created:', newUser.email, 'Role:', newUser.role);
    }

    // Handle user.updated event
    if (evt.type === 'user.updated') {
      const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

      const email = email_addresses?.[0]?.email_address;
      if (!email) {
        return new Response('No email', { status: 200 });
      }

      console.log('[CLERK SIMPLE] Updating user:', email);

      // Get existing user
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id }
      });

      if (!existingUser) {
        // User doesn't exist, create them
        console.log('[CLERK SIMPLE] User not found, creating:', email);

        let role = 'USER';
        if (email.toLowerCase() === 'info@fulluproar.com') {
          role = 'GOD';
        } else if (email.toLowerCase() === 'annika@fulluproar.com') {
          role = 'ADMIN';
        }

        await prisma.user.create({
          data: {
            clerkId: id,
            email: email,
            username: username || email.split('@')[0],
            displayName: first_name || username || email.split('@')[0],
            avatarUrl: image_url,
            role: role as any,
            cultDevotion: 0,
            cultLevel: 0,
            achievementPoints: 0
          }
        });
      } else {
        // Update existing user
        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: email,
            username: username || existingUser.username,
            displayName: first_name || existingUser.displayName,
            avatarUrl: image_url || existingUser.avatarUrl
          }
        });
      }

      console.log('[CLERK SIMPLE] User updated successfully');
    }

    // Handle user.deleted
    if (evt.type === 'user.deleted') {
      const { id } = evt.data;

      console.log('[CLERK SIMPLE] Deleting user:', id);

      try {
        await prisma.user.delete({
          where: { clerkId: id! }
        });
        console.log('[CLERK SIMPLE] User deleted');
      } catch (error) {
        console.log('[CLERK SIMPLE] User not found for deletion');
      }
    }

    console.log('[CLERK SIMPLE] ========================================');

    return new Response('Webhook received', { status: 200 });

  } catch (err) {
    console.error('[CLERK SIMPLE] Error verifying webhook:', err);
    return new Response('Error verifying webhook', { status: 400 });
  }
}

export async function GET() {
  const hasSecret = !!process.env.CLERK_WEBHOOK_SIGNING_SECRET || !!process.env.CLERK_WEBHOOK_SECRET;

  return NextResponse.json({
    status: 'Simple webhook endpoint using Clerk verifyWebhook',
    environment: {
      CLERK_WEBHOOK_SIGNING_SECRET: !!process.env.CLERK_WEBHOOK_SIGNING_SECRET,
      CLERK_WEBHOOK_SECRET: !!process.env.CLERK_WEBHOOK_SECRET,
      hasAnySecret: hasSecret
    },
    instructions: [
      '1. This uses Clerk\'s built-in verifyWebhook function',
      '2. Make sure CLERK_WEBHOOK_SIGNING_SECRET is set in Vercel',
      '3. The secret should include the whsec_ prefix',
      '4. Update webhook URL to: https://fulluproar.com/api/webhooks/clerk-simple'
    ]
  });
}