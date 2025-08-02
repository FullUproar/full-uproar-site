import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function getCurrentUser() {
  const user = await currentUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    include: { 
      permissions: true,
      profile: true 
    }
  })

  return dbUser
}

export async function checkPermission(
  resource: string,
  action?: string
): Promise<boolean> {
  // If called with old signature (3 params), handle it
  if (arguments.length === 3) {
    console.warn('checkPermission called with deprecated signature. Use checkPermission(resource, action) instead.');
    resource = arguments[1];
    action = arguments[2];
  }

  // Handle colon notation (e.g., 'admin:access')
  if (!action && resource.includes(':')) {
    const parts = resource.split(':');
    resource = parts[0];
    action = parts[1];
  }

  const user = await getCurrentUser();
  if (!user) return false

  // Super admins have all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true

  // If no action specified, check for any permission on the resource
  if (!action) {
    action = '*';
  }

  // Check role-based permissions
  const rolePermissions = getRolePermissions(user.role)
  if (rolePermissions.some(p => 
    p.resource === resource && 
    (p.action === action || p.action === '*')
  )) {
    return true
  }

  // Check individual permissions
  const permission = user.permissions.find(p =>
    p.resource === resource &&
    (p.action === action || p.action === '*') &&
    p.granted &&
    (!p.expiresAt || p.expiresAt > new Date())
  )

  return !!permission
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }
  return userId
}

export async function requirePermission(
  resource: string,
  action?: string
) {
  // Handle colon notation (e.g., 'admin:access')
  if (!action && resource.includes(':')) {
    const parts = resource.split(':');
    resource = parts[0];
    action = parts[1];
  }

  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const hasPermission = await checkPermission(resource, action)
  if (!hasPermission) {
    throw new Error('Forbidden')
  }

  return user
}

// Define role-based permissions
function getRolePermissions(role: UserRole) {
  const permissions: Array<{ resource: string; action: string }> = []

  switch (role) {
    case UserRole.ADMIN:
      permissions.push(
        { resource: 'admin', action: '*' },
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'update' },
        { resource: 'users', action: 'delete' },
        { resource: 'games', action: '*' },
        { resource: 'merch', action: '*' },
        { resource: 'orders', action: '*' },
        { resource: 'settings', action: '*' },
        { resource: 'messages', action: '*' }
      )
      break

    case UserRole.MODERATOR:
      permissions.push(
        { resource: 'messages', action: '*' },
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'ban' },
        { resource: 'users', action: 'mute' }
      )
      break

    case UserRole.USER:
      permissions.push(
        { resource: 'messages', action: 'create' },
        { resource: 'messages', action: 'read' },
        { resource: 'profile', action: '*' },
        { resource: 'orders', action: 'read:own' }
      )
      break
  }

  return permissions
}