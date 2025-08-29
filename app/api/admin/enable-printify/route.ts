import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    await requirePermission('admin:access');

    // Enable Printify
    await prisma.settings.upsert({
      where: { key: 'printify_enabled' },
      update: { value: 'true' },
      create: {
        key: 'printify_enabled',
        value: 'true',
        description: 'Enable Printify POD products'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Printify enabled successfully'
    });
  } catch (error: any) {
    console.error('Error enabling Printify:', error);
    return NextResponse.json(
      { error: 'Failed to enable Printify', details: error.message },
      { status: 500 }
    );
  }
}