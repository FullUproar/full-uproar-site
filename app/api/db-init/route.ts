import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint helps initialize the database tables
// Only run this once in production after setting up your database
export async function GET(request: Request) {
  try {
    // Basic info doesn't require auth
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const showDetails = secret === process.env.INIT_SECRET;
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Basic response for unauthorized requests
    if (!showDetails) {
      return NextResponse.json({
        status: 'Database connection successful',
        provider: process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'Other',
        message: 'To see table details, add ?secret=YOUR_SECRET to the URL',
        tables: 'Hidden - requires authentication'
      });
    }
    
    // Get database info (only with proper auth)
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    return NextResponse.json({
      status: 'Database connected',
      tables,
      provider: process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'Other',
      message: 'Run migrations using: npx prisma migrate deploy'
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : String(error),
      suggestion: 'Make sure DATABASE_URL is set correctly and migrations are applied'
    }, { status: 500 });
  }
}