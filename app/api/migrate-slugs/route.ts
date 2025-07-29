import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Simple auth check
    if (secret !== 'migrate-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all games without slugs
    const games = await prisma.game.findMany({
      where: {
        slug: ''
      }
    });
    
    const results = [];
    
    for (const game of games) {
      const slug = game.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      try {
        await prisma.game.update({
          where: { id: game.id },
          data: { slug }
        });
        results.push(`Updated ${game.title} with slug: ${slug}`);
      } catch (error) {
        results.push(`Failed to update ${game.title}: ${error}`);
      }
    }
    
    // Also update merch slugs if needed
    const merchItems = await prisma.merch.findMany({
      where: {
        slug: ''
      }
    });
    
    for (const merch of merchItems) {
      const slug = merch.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      try {
        await prisma.merch.update({
          where: { id: merch.id },
          data: { slug }
        });
        results.push(`Updated merch ${merch.name} with slug: ${slug}`);
      } catch (error) {
        results.push(`Failed to update merch ${merch.name}: ${error}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      updated: results.length,
      results
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}