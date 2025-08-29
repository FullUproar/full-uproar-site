import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    // Check if current user is attempting this
    const currentUser = await getCurrentUser();
    
    // Only allow if user is already an admin or is info@fulluproar.com
    if (!currentUser || 
        (currentUser.email !== 'info@fulluproar.com' && 
         currentUser.role !== UserRole.SUPER_ADMIN && 
         currentUser.role !== UserRole.GOD)) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins or info@fulluproar.com can perform this action' },
        { status: 403 }
      );
    }
    
    const godEmail = 'info@fulluproar.com';
    
    // Find or update the user
    const user = await prisma.user.findUnique({
      where: { email: godEmail }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User info@fulluproar.com not found. Please sign up first.' },
        { status: 404 }
      );
    }
    
    // Update to GOD role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.GOD }
    });
    
    // Also create role assignment
    const existingRole = await prisma.userRoleAssignment.findFirst({
      where: {
        userId: user.id,
        role: UserRole.GOD
      }
    });
    
    if (!existingRole) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: UserRole.GOD,
          notes: 'God mode - absolute power over the system',
          assignedBy: currentUser.id
        }
      });
    }
    
    // Grant all permissions explicitly as well (belt and suspenders)
    const resources = [
      'admin:access', 'admin:dashboard', 'admin:analytics', 'admin:settings',
      'products:*', 'orders:*', 'customers:*', 'users:*', 'marketing:*',
      'finance:*', 'hr:*', 'content:*', 'integrations:*', 'system:*'
    ];
    
    for (const resource of resources) {
      const [res, act] = resource.split(':');
      const action = act || '*';
      
      // Check if permission exists
      const existing = await prisma.permission.findFirst({
        where: {
          userId: user.id,
          resource: res,
          action: action
        }
      });
      
      if (!existing) {
        await prisma.permission.create({
          data: {
            userId: user.id,
            resource: res,
            action: action,
            granted: true,
            grantedBy: currentUser.id
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        message: 'God mode activated! You now have absolute power over the system.'
      }
    });
  } catch (error) {
    console.error('Error ensuring God user:', error);
    return NextResponse.json(
      { error: 'Failed to ensure God user' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check God user status
    const godUser = await prisma.user.findUnique({
      where: { email: 'info@fulluproar.com' },
      include: {
        roles: true,
        permissions: true
      }
    });
    
    if (!godUser) {
      return NextResponse.json({
        exists: false,
        message: 'God user (info@fulluproar.com) not found'
      });
    }
    
    return NextResponse.json({
      exists: true,
      hasGodRole: godUser.role === UserRole.GOD,
      additionalRoles: godUser.roles.map(r => r.role),
      permissionCount: godUser.permissions.length,
      user: {
        id: godUser.id,
        email: godUser.email,
        role: godUser.role,
        displayName: godUser.displayName
      }
    });
  } catch (error) {
    console.error('Error checking God user:', error);
    return NextResponse.json(
      { error: 'Failed to check God user status' },
      { status: 500 }
    );
  }
}