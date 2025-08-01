import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function getCurrentUser() {
  const user = await currentUser()
  if (!user) {
    console.log('No Clerk user found');
    return null
  }

  console.log('Clerk user:', { id: user.id, email: user.emailAddresses?.[0]?.emailAddress });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    include: { 
      permissions: true,
      profile: true 
    }
  })

  if (dbUser) {
    console.log('DB user found:', { id: dbUser.id, email: dbUser.email, role: dbUser.role });
  } else {
    console.log('No DB user found for Clerk ID:', user.id);
  }

  return dbUser
}

export async function checkPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { permissions: true }
  })

  if (!user) {
    console.log('No user found for permission check');
    return false
  }

  console.log('Permission check - User role:', user.role);

  // Super admins have all permissions
  if (user.role === UserRole.SUPER_ADMIN) {
    console.log('User is SUPER_ADMIN, granting permission');
    return true
  }

  // Check role-based permissions
  const rolePermissions = getRolePermissions(user.role)
  console.log('Role permissions:', rolePermissions);
  
  const hasRolePermission = rolePermissions.some(p => 
    p.resource === resource && 
    (p.action === action || p.action === '*')
  )
  
  if (hasRolePermission) {
    console.log('Permission granted via role');
    return true
  }

  // Check individual permissions
  const permission = user.permissions.find(p =>
    p.resource === resource &&
    p.action === action &&
    p.granted &&
    (!p.expiresAt || p.expiresAt > new Date())
  )

  console.log('Individual permission found:', !!permission);
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
  action: string
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const hasPermission = await checkPermission(user.id, resource, action)
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
        { resource: 'users', action: 'update' },
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