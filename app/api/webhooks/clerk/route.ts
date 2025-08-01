import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data

    try {
      const email = email_addresses[0].email_address;
      
      // Automatically grant admin role to info@fulluproar.com
      const isAdminEmail = email.toLowerCase() === 'info@fulluproar.com';
      
      await prisma.user.create({
        data: {
          clerkId: id,
          email: email,
          username: username || undefined,
          displayName: first_name && last_name ? `${first_name} ${last_name}` : undefined,
          avatarUrl: image_url || undefined,
          role: isAdminEmail ? 'ADMIN' : 'USER',
        }
      })
    } catch (error) {
      console.error('Error creating user:', error)
      return new Response('Error creating user', { status: 500 })
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data

    try {
      const email = email_addresses[0].email_address;
      
      // Check if this is the admin email
      const isAdminEmail = email.toLowerCase() === 'info@fulluproar.com';
      
      // Get current user to check their role
      const currentUser = await prisma.user.findUnique({
        where: { clerkId: id }
      });
      
      const updateData: any = {
        email: email,
        username: username || undefined,
        displayName: first_name && last_name ? `${first_name} ${last_name}` : undefined,
        avatarUrl: image_url || undefined,
      };
      
      // Update role to admin if this is the admin email and they're not already an admin
      if (isAdminEmail && currentUser && currentUser.role !== 'ADMIN') {
        updateData.role = 'ADMIN';
      }
      
      await prisma.user.update({
        where: { clerkId: id },
        data: updateData
      })
    } catch (error) {
      console.error('Error updating user:', error)
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