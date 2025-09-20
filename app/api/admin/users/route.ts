import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('admin', 'read');

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate stats
    const stats = {
      total: users.length,
      admins: users.filter(u =>
        u.role === 'GOD' ||
        u.role === 'SUPER_ADMIN' ||
        u.role === 'ADMIN'
      ).length,
      users: users.filter(u => u.role === 'USER').length,
      verified: users.filter(u => u.emailVerified).length,
    };

    return NextResponse.json({
      users,
      stats
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('users', 'create');

    const data = await request.json();
    
    const user = await prisma.user.create({
      data: {
        ...data,
        profile: {
          create: {}
        }
      },
      include: {
        profile: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}