import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const diagnostics: any = {
    status: 'checking',
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 
      (process.env.DATABASE_URL.includes('file:') ? 'SQLite' : 'PostgreSQL') : 
      'Not configured',
    timestamp: new Date().toISOString()
  };

  try {
    // Test basic database connection
    await prisma.$connect();
    diagnostics.connection = 'success';

    // Try to check tables
    try {
      const gameCount = await prisma.game.count();
      const merchCount = await prisma.merch.count();
      const orderCount = await prisma.order.count();
      const artworkCount = await prisma.artwork.count().catch(() => 0);
      
      diagnostics.status = 'healthy';
      diagnostics.database = 'connected';
      diagnostics.counts = {
        games: gameCount,
        merch: merchCount,
        orders: orderCount,
        artwork: artworkCount
      };
      
      return NextResponse.json(diagnostics);
    } catch (tableError) {
      diagnostics.status = 'unhealthy';
      diagnostics.database = 'connected but missing tables';
      diagnostics.error = tableError instanceof Error ? tableError.message : String(tableError);
      
      // Check which tables exist
      const tables: any = {};
      tables.Game = await prisma.game.count().then(() => true).catch(() => false);
      tables.Merch = await prisma.merch.count().then(() => true).catch(() => false);
      tables.Order = await prisma.order.count().then(() => true).catch(() => false);
      tables.Artwork = await prisma.artwork.count().then(() => true).catch(() => false);
      tables.Comic = await prisma.comic.count().then(() => true).catch(() => false);
      tables.NewsPost = await prisma.newsPost.count().then(() => true).catch(() => false);
      
      diagnostics.tables = tables;
      diagnostics.solution = 'Run database initialization: POST /api/init-db?secret=emergency-init-2024';
      
      return NextResponse.json(diagnostics, { status: 503 });
    }
  } catch (error) {
    diagnostics.status = 'unhealthy';
    diagnostics.database = 'connection failed';
    diagnostics.error = error instanceof Error ? error.message : String(error);
    
    // Provide helpful error messages
    if (diagnostics.error.includes('P1001')) {
      diagnostics.solution = 'Database server is not reachable. Check DATABASE_URL environment variable.';
    } else if (diagnostics.error.includes('P1002')) {
      diagnostics.solution = 'Database server reached but timed out. Check network/firewall settings.';
    } else if (diagnostics.error.includes('P1003')) {
      diagnostics.solution = 'Database does not exist. Create the database first.';
    } else if (diagnostics.error.includes('file:')) {
      diagnostics.solution = 'SQLite database file issue. Ensure the file path is correct and writable.';
    }
    
    return NextResponse.json(diagnostics, { status: 503 });
  }
}