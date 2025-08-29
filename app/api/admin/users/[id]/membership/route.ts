import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { MembershipTier } from '@prisma/client';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requirePermission('users', 'read');
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        membershipTier: true,
        membershipExpiry: true,
        membershipStarted: true,
        employeeDiscount: true,
        lifetimeValue: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user membership:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch user membership' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const currentUser = await requirePermission('users', 'update');
    const { id } = await params;
    const { membershipTier, membershipExpiry, employeeDiscount } = await request.json();

    // Validate membership tier
    if (membershipTier && !Object.values(MembershipTier).includes(membershipTier)) {
      return NextResponse.json({ error: 'Invalid membership tier' }, { status: 400 });
    }

    // Validate employee discount
    if (employeeDiscount !== undefined && (employeeDiscount < 0 || employeeDiscount > 100)) {
      return NextResponse.json({ error: 'Employee discount must be between 0 and 100' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update membership data
    const updateData: any = {};
    
    if (membershipTier !== undefined) {
      updateData.membershipTier = membershipTier as MembershipTier;
      
      // If upgrading from FREE, set membership start date
      if (user.membershipTier === 'FREE' && membershipTier !== 'FREE' && !user.membershipStarted) {
        updateData.membershipStarted = new Date();
      }
    }
    
    if (membershipExpiry !== undefined) {
      updateData.membershipExpiry = membershipExpiry ? new Date(membershipExpiry) : null;
    }
    
    if (employeeDiscount !== undefined) {
      updateData.employeeDiscount = employeeDiscount;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        membershipTier: true,
        membershipExpiry: true,
        membershipStarted: true,
        employeeDiscount: true,
        lifetimeValue: true
      }
    });

    // Log the membership change
    console.log(`Membership updated for ${user.email}:`, {
      from: user.membershipTier,
      to: membershipTier,
      by: currentUser.email
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Membership updated successfully for ${user.email}`
    });
  } catch (error: any) {
    console.error('Error updating user membership:', error);
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update user membership' }, { status: 500 });
  }
}