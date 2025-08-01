import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const slug = searchParams.get('slug');
    const excludeId = searchParams.get('excludeId');

    if (!slug) {
      return NextResponse.json({ 
        available: false, 
        message: 'Slug is required' 
      });
    }

    let existing;
    
    if (type === 'game') {
      existing = await prisma.game.findFirst({
        where: {
          slug,
          ...(excludeId ? { NOT: { id: parseInt(excludeId) } } : {})
        }
      });
    } else if (type === 'merch') {
      existing = await prisma.merch.findFirst({
        where: {
          slug,
          ...(excludeId ? { NOT: { id: parseInt(excludeId) } } : {})
        }
      });
    }

    return NextResponse.json({
      available: !existing,
      message: existing ? `This slug is already in use` : 'Slug is available'
    });
  } catch (error) {
    console.error('Slug validation error:', error);
    return NextResponse.json({
      available: false,
      message: 'Error checking slug availability'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { slug, currentId, type = 'game' } = await request.json();
    
    if (!slug) {
      return NextResponse.json({ 
        available: false, 
        message: 'Slug is required' 
      });
    }
    
    let existing;
    
    if (type === 'game') {
      existing = await prisma.game.findFirst({
        where: {
          slug,
          NOT: currentId ? { id: currentId } : undefined
        }
      });
    } else if (type === 'merch') {
      existing = await prisma.merch.findFirst({
        where: {
          slug,
          NOT: currentId ? { id: currentId } : undefined
        }
      });
    }
    
    return NextResponse.json({
      available: !existing,
      message: existing ? `This slug is already used by "${type === 'game' ? (existing as any).title : (existing as any).name}"` : 'Slug is available'
    });
  } catch (error) {
    console.error('Slug validation error:', error);
    return NextResponse.json({
      available: false,
      message: 'Error checking slug availability'
    }, { status: 500 });
  }
}