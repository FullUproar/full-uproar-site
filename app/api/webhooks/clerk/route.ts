import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  console.log('[CLERK WEBHOOK] ========================================');
  console.log('[CLERK WEBHOOK] Called at:', new Date().toISOString());

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  console.log('[CLERK WEBHOOK] Headers present:', {
    svix_id: !!svix_id,
    svix_timestamp: !!svix_timestamp,
    svix_signature: !!svix_signature
  });

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[CLERK WEBHOOK] Missing required headers');
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Check if webhook secret exists - try both possible env vars
  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[CLERK WEBHOOK] No webhook secret found in environment');
    console.error('[CLERK WEBHOOK] Checked: CLERK_WEBHOOK_SIGNING_SECRET and CLERK_WEBHOOK_SECRET');
    return new Response('Server configuration error', {
      status: 500
    })
  }

  console.log('[CLERK WEBHOOK] Using secret from:', process.env.CLERK_WEBHOOK_SIGNING_SECRET ? 'CLERK_WEBHOOK_SIGNING_SECRET' : 'CLERK_WEBHOOK_SECRET');
  console.log('[CLERK WEBHOOK] Secret length:', webhookSecret.length);
  console.log('[CLERK WEBHOOK] Secret prefix:', webhookSecret.substring(0, 10) + '...');

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
    console.log('[CLERK WEBHOOK] Signature verified successfully');
  } catch (err) {
    console.error('[CLERK WEBHOOK] Signature verification failed:', err);
    console.error('[CLERK WEBHOOK] Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      name: err instanceof Error ? err.name : 'Unknown'
    });
    return new Response('Error verifying webhook signature', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type
  console.log('[CLERK WEBHOOK] ========================================');
  console.log('[CLERK WEBHOOK] Event type:', eventType);

  // Skip email events - we only care about user events
  if (eventType.startsWith('email.')) {
    console.log('[CLERK WEBHOOK] Skipping email event');
    return new Response('Email event ignored', { status: 200 });
  }

  // Skip session events unless it's for tracking last login
  if (eventType.startsWith('session.') && eventType !== 'session.created') {
    console.log('[CLERK WEBHOOK] Skipping session event');
    return new Response('Session event ignored', { status: 200 });
  }

  console.log('[CLERK WEBHOOK] Processing event data:', JSON.stringify(evt.data, null, 2));

  if (eventType === 'user.created') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data

    try {
      const email = email_addresses[0].email_address;
      console.log('[CLERK WEBHOOK] Creating user:', email);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id }
      });

      if (existingUser) {
        console.log('[CLERK WEBHOOK] User already exists:', existingUser.email);
        return new Response('User already exists', { status: 200 });
      }

      // Determine role based on email
      let role = 'USER';
      if (email.toLowerCase() === 'info@fulluproar.com') {
        role = 'GOD';
      } else if (email.toLowerCase() === 'annika@fulluproar.com') {
        role = 'ADMIN';
      }

      const newUser = await prisma.user.create({
        data: {
          clerkId: id,
          email: email,
          username: username || undefined,
          displayName: first_name && last_name ? `${first_name} ${last_name}` : undefined,
          avatarUrl: image_url || undefined,
          role: role as any,
          cultDevotion: 0,
          cultLevel: 0,
          achievementPoints: 0
        }
      });

      console.log('[CLERK WEBHOOK] User created:', newUser.email, 'Role:', newUser.role);
      console.log('[CLERK WEBHOOK] ========================================');
    } catch (error) {
      console.error('[CLERK WEBHOOK] Error creating user:', error)
      return new Response('Error creating user', { status: 500 })
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data

    try {
      const email = email_addresses[0].email_address;
      console.log('[CLERK WEBHOOK] Updating user:', email);

      // Get current user to check their role
      const currentUser = await prisma.user.findUnique({
        where: { clerkId: id }
      });

      if (!currentUser) {
        console.log('[CLERK WEBHOOK] User not found for update, creating instead');
        // User doesn't exist, create them
        let role = 'USER';
        if (email.toLowerCase() === 'info@fulluproar.com') {
          role = 'GOD';
        } else if (email.toLowerCase() === 'annika@fulluproar.com') {
          role = 'ADMIN';
        }

        const newUser = await prisma.user.create({
          data: {
            clerkId: id,
            email: email,
            username: username || undefined,
            displayName: first_name && last_name ? `${first_name} ${last_name}` : undefined,
            avatarUrl: image_url || undefined,
            role: role as any,
            cultDevotion: 0,
            cultLevel: 0,
            achievementPoints: 0
          }
        });
        console.log('[CLERK WEBHOOK] User created from update event:', newUser.email, 'Role:', newUser.role);
        return new Response('User created', { status: 200 });
      }

      // Determine role based on email
      let role = currentUser.role;
      if (email.toLowerCase() === 'info@fulluproar.com' && currentUser.role !== 'GOD') {
        role = 'GOD';
      } else if (email.toLowerCase() === 'annika@fulluproar.com' && currentUser.role !== 'ADMIN' && currentUser.role !== 'GOD') {
        role = 'ADMIN';
      }

      const updateData: any = {
        email: email,
        username: username || undefined,
        displayName: first_name && last_name ? `${first_name} ${last_name}` : undefined,
        avatarUrl: image_url || undefined,
      };

      // Update role if it changed
      if (role !== currentUser.role) {
        updateData.role = role;
        console.log('[CLERK WEBHOOK] Updating user role from', currentUser.role, 'to', role);
      }

      await prisma.user.update({
        where: { clerkId: id },
        data: updateData
      });

      console.log('[CLERK WEBHOOK] User updated successfully');
    } catch (error) {
      console.error('[CLERK WEBHOOK] Error updating user:', error)
      return new Response('Error updating user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      await prisma.user.delete({
        where: { clerkId: id! }
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      return new Response('Error deleting user', { status: 500 })
    }
  }

  if (eventType === 'session.created') {
    const { user_id } = evt.data

    try {
      await prisma.user.update({
        where: { clerkId: user_id },
        data: {
          lastLogin: new Date()
        }
      })
    } catch (error) {
      console.error('Error updating last login:', error)
    }
  }

  return new Response('', { status: 200 })
}