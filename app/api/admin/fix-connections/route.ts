import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanupConnections } from '@/lib/utils/database';

export async function POST(request: NextRequest) {
  // Simple auth check - in production, use proper auth
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Attempt to clean up connections
    await cleanupConnections(prisma);
    
    // Test the connection
    await prisma.$executeRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      message: 'Database connections cleaned up successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}