import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ key: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('settings', 'update');
    
    const { key } = await params;
    const { value } = await request.json();
    
    // Check if setting exists
    const existing = await prisma.settings.findUnique({
      where: { key }
    });
    
    let setting;
    if (existing) {
      // Update existing setting
      setting = await prisma.settings.update({
        where: { key },
        data: { value }
      });
    } else {
      // Create new setting
      setting = await prisma.settings.create({
        data: { key, value }
      });
    }
    
    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}