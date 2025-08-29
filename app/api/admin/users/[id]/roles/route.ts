import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requirePermission('users:roles', 'read');
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        permissions: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      primaryRole: user.role,
      additionalRoles: user.roles,
      permissions: user.permissions
    });
  } catch (error: any) {
    console.error('Error fetching user roles:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const currentUser = await requirePermission('users:roles', 'update');
    const { id } = await params;
    const { roles } = await request.json();

    if (!Array.isArray(roles)) {
      return NextResponse.json({ error: 'Roles must be an array' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent users from modifying their own roles
    if (user.id === currentUser.id && user.email !== 'info@fulluproar.com') {
      return NextResponse.json({ error: 'Cannot modify your own roles' }, { status: 403 });
    }

    // Special protection for God user
    if (user.email === 'info@fulluproar.com' && currentUser.email !== 'info@fulluproar.com') {
      return NextResponse.json({ error: 'Cannot modify God user roles' }, { status: 403 });
    }

    // Begin transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update primary role (use the first role in the array)
      const primaryRole = roles[0] || UserRole.USER;
      await tx.user.update({
        where: { id },
        data: { role: primaryRole as UserRole }
      });

      // Clear existing role assignments
      await tx.userRoleAssignment.deleteMany({
        where: { userId: id }
      });

      // Add new role assignments
      const roleAssignments = [];
      for (const role of roles) {
        // Skip the primary role as it's already set
        if (role === primaryRole) continue;

        roleAssignments.push({
          userId: id,
          role: role as UserRole,
          assignedBy: currentUser.id,
          notes: `Assigned via admin panel by ${currentUser.email}`
        });
      }

      if (roleAssignments.length > 0) {
        await tx.userRoleAssignment.createMany({
          data: roleAssignments
        });
      }

      // Return updated user with roles
      return await tx.user.findUnique({
        where: { id },
        include: {
          roles: true
        }
      });
    });

    return NextResponse.json({
      success: true,
      user: result,
      message: `Roles updated successfully for ${user.email}`
    });
  } catch (error: any) {
    console.error('Error updating user roles:', error);
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update user roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const currentUser = await requirePermission('users:roles', 'create');
    const { id } = await params;
    const { role, expiresAt, notes } = await request.json();

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if role already assigned
    const existing = await prisma.userRoleAssignment.findFirst({
      where: {
        userId: id,
        role: role as UserRole
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Role already assigned' }, { status: 400 });
    }

    // Create role assignment
    const assignment = await prisma.userRoleAssignment.create({
      data: {
        userId: id,
        role: role as UserRole,
        assignedBy: currentUser.id,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        notes
      }
    });

    return NextResponse.json({
      success: true,
      assignment,
      message: `Role ${role} assigned to ${user.email}`
    });
  } catch (error: any) {
    console.error('Error assigning role:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requirePermission('users:roles', 'delete');
    const { id } = await params;
    const { role } = await request.json();

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Delete specific role assignment
    await prisma.userRoleAssignment.deleteMany({
      where: {
        userId: id,
        role: role as UserRole
      }
    });

    return NextResponse.json({
      success: true,
      message: `Role ${role} removed`
    });
  } catch (error: any) {
    console.error('Error removing role:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to remove role' }, { status: 500 });
  }
}