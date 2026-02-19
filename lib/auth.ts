import { auth as getSession } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user?.id) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
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
  // Handle colon notation (e.g., 'admin:access')
  if (!action && resource.includes(':')) {
    const parts = resource.split(':');
    resource = parts[0];
    action = parts[1];
  }

  const user = await getCurrentUser();
  if (!user) return false

  // God and Super admins have all permissions
  if (user.role === UserRole.GOD || user.role === UserRole.SUPER_ADMIN) return true

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
  const session = await getSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
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
        { resource: 'products', action: '*' },
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
