import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// TEMPORARY: Bypass webhook verification to test if events are coming through
export async function POST(req: Request) {
  console.log('[CLERK BYPASS] ========================================');
  console.log('[CLERK BYPASS] Webhook received (NO VERIFICATION)');

  try {
    const payload = await req.json();
    const eventType = payload.type;

    console.log('[CLERK BYPASS] Event type:', eventType);
    console.log('[CLERK BYPASS] Event data:', JSON.stringify(payload.data, null, 2));

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, username, first_name, last_name, image_url } = payload.data;

      if (!email_addresses || email_addresses.length === 0) {
        console.log('[CLERK BYPASS] No email addresses in event');
        return NextResponse.json({ received: true });
      }

      const email = email_addresses[0].email_address;
      console.log('[CLERK BYPASS] Processing user:', email);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id }
      });

      if (existingUser) {
        console.log('[CLERK BYPASS] User already exists:', existingUser.email);

        // Update user if it's an update event
        if (eventType === 'user.updated') {
          // Determine role based on email
          let role = existingUser.role;
          if (email.toLowerCase() === 'info@fulluproar.com' && existingUser.role !== 'GOD') {
            role = UserRole.GOD as UserRole;
          } else if (email.toLowerCase() === 'annika@fulluproar.com' && existingUser.role !== 'ADMIN' && existingUser.role !== 'GOD') {
            role = UserRole.ADMIN as UserRole;
          }

          await prisma.user.update({
            where: { clerkId: id },
            data: {
              email: email,
              username: username || existingUser.username,
              displayName: first_name && last_name ? `${first_name} ${last_name}` : existingUser.displayName,
              avatarUrl: image_url || existingUser.avatarUrl,
              role: role
            }
          });
          console.log('[CLERK BYPASS] User updated successfully');
        }
      } else {
        // Create new user
        let role: UserRole = UserRole.USER;
        if (email.toLowerCase() === 'info@fulluproar.com') {
          role = UserRole.GOD as UserRole;
        } else if (email.toLowerCase() === 'annika@fulluproar.com') {
          role = UserRole.ADMIN as UserRole;
        }

        const newUser = await prisma.user.create({
          data: {
            clerkId: id,
            email: email,
            username: username || email.split('@')[0],
            displayName: first_name && last_name ? `${first_name} ${last_name}` : email.split('@')[0],
            avatarUrl: image_url || undefined,
            role: role,
            cultDevotion: 0,
            cultLevel: 0,
            achievementPoints: 0
          }
        });

        console.log('[CLERK BYPASS] User created:', newUser.email, 'with role:', newUser.role);
      }
    }

    if (eventType === 'user.deleted') {
      const { id } = payload.data;

      try {
        await prisma.user.delete({
          where: { clerkId: id }
        });
        console.log('[CLERK BYPASS] User deleted:', id);
      } catch (error) {
        console.error('[CLERK BYPASS] Error deleting user:', error);
      }
    }

    console.log('[CLERK BYPASS] ========================================');

    return NextResponse.json({
      received: true,
      type: eventType,
      message: 'Webhook processed (bypass mode)'
    });

  } catch (error) {
    console.error('[CLERK BYPASS] ERROR:', error);
    return NextResponse.json({
      error: 'Webhook error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}