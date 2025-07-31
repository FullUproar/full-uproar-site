import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      message: existing ? `This slug is already used by "${existing.title || existing.name}"` : 'Slug is available'
    });
  } catch (error) {
    console.error('Slug validation error:', error);
    return NextResponse.json({
      available: false,
      message: 'Error checking slug availability'
    }, { status: 500 });
  }
}