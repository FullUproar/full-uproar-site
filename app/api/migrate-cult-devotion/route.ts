import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is disabled in production' }, { status: 403 });
  }

  try {
    // Run Prisma migration
    const result = await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "cultDevotion" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cultLevel" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cultLastVisit" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "achievementPoints" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "easterEggsFound" TEXT;
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      rowsAffected: result
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}