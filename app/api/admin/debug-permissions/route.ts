import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(request: NextRequest) {
  try {
    // Admin-only debug endpoint
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Get role permissions
    const rolePermissions = getRolePermissions(user.role);
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      rolePermissions,
      individualPermissions: user.permissions,
      hasUsersReadPermission: rolePermissions.some(p => 
        p.resource === 'users' && (p.action === 'read' || p.action === '*')
      )
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json({ 
      error: 'Failed to check permissions' 
    }, { status: 500 });
  }
}

// Copy of getRolePermissions from auth.ts for debugging
function getRolePermissions(role: string) {
  const permissions: Array<{ resource: string; action: string }> = []

  switch (role) {
    case 'ADMIN':
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

    case 'MODERATOR':
      permissions.push(
        { resource: 'messages', action: '*' },
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'ban' },
        { resource: 'users', action: 'mute' }
      )
      break

    case 'USER':
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