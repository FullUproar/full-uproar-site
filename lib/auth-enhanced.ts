import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { hasPermission, Role, Resource, Action } from '@/lib/permissions/config'

export async function getCurrentUser() {
  const user = await currentUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    include: { 
      permissions: true,
      profile: true,
      roles: true // Include multiple roles
    }
  })

  return dbUser
}

/**
 * Get all roles for a user (including primary role and additional roles)
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true }
  })
  
  if (!user) return []
  
  // God mode for info@fulluproar.com
  if (user.email === 'info@fulluproar.com') {
    return [Role.GOD]
  }
  
  const roles: Role[] = []
  
  // Add primary role
  if (user.role) {
    roles.push(user.role as Role)
  }
  
  // Add additional roles
  for (const roleAssignment of user.roles) {
    // Check if role is not expired
    if (!roleAssignment.expiresAt || roleAssignment.expiresAt > new Date()) {
      roles.push(roleAssignment.role as Role)
    }
  }
  
  // Remove duplicates
  return [...new Set(roles)]
}

/**
 * Enhanced permission check with multiple roles support
 */
export async function checkPermission(
  resource: string,
  action?: string
): Promise<boolean> {
  // Handle colon notation (e.g., 'admin:access')
  if (!action && resource.includes(':')) {
    const parts = resource.split(':')
    resource = parts.join(':') as Resource
    action = 'read'
  }

  const user = await getCurrentUser()
  if (!user) return false

  // Get all user roles
  const userRoles = await getUserRoles(user.id)
  
  // Check permission using the new system
  return hasPermission(
    userRoles,
    resource as Resource,
    action as Action,
    user.email
  )
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
  // Handle colon notation
  if (!action && resource.includes(':')) {
    const parts = resource.split(':')
    resource = parts.join(':') as Resource
    action = 'read'
  }

  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const hasPermission = await checkPermission(resource, action)
  if (!hasPermission) {
    throw new Error(`Forbidden: Missing permission for ${resource}:${action}`)
  }

  return user
}

/**
 * Assign a role to a user
 */
export async function assignRole(
  userId: string,
  role: Role,
  assignedBy?: string,
  expiresAt?: Date,
  notes?: string
) {
  // Check if the assigner has permission to assign roles
  if (assignedBy) {
    const assigner = await prisma.user.findUnique({
      where: { id: assignedBy }
    })
    
    if (assigner) {
      const assignerRoles = await getUserRoles(assignedBy)
      if (!hasPermission(assignerRoles, 'users:roles', 'update', assigner.email)) {
        throw new Error('Forbidden: Cannot assign roles')
      }
    }
  }
  
  // Create role assignment
  return await prisma.userRoleAssignment.create({
    data: {
      userId,
      role: role as UserRole,
      assignedBy,
      expiresAt,
      notes
    }
  })
}

/**
 * Remove a role from a user
 */
export async function removeRole(userId: string, role: Role) {
  return await prisma.userRoleAssignment.deleteMany({
    where: {
      userId,
      role: role as UserRole
    }
  })
}

/**
 * Update user's primary role (for backwards compatibility)
 */
export async function updatePrimaryRole(userId: string, role: Role) {
  return await prisma.user.update({
    where: { id: userId },
    data: { role: role as UserRole }
  })
}

/**
 * Check if user is God (info@fulluproar.com)
 */
export async function isGod(user: { email: string, roles?: any[] }): Promise<boolean> {
  return user.email === 'info@fulluproar.com' || 
         (user.roles?.some(r => r.role === 'GOD') ?? false)
}

/**
 * Initialize God user if needed
 */
export async function ensureGodUser() {
  const godEmail = 'info@fulluproar.com'
  
  const user = await prisma.user.findUnique({
    where: { email: godEmail }
  })
  
  if (user) {
    // Ensure user has GOD role
    if (user.role !== UserRole.GOD) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.GOD }
      })
    }
    
    // Also assign GOD role in the roles table
    const godRole = await prisma.userRoleAssignment.findFirst({
      where: {
        userId: user.id,
        role: UserRole.GOD
      }
    })
    
    if (!godRole) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: UserRole.GOD,
          notes: 'God mode - absolute power'
        }
      })
    }
  }
}