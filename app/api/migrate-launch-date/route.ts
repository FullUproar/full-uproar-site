import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check if launchDate column exists
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Game' 
      AND column_name = 'launchDate'
    ` as any[];
    
    if (tableInfo.length === 0) {
      // Add launchDate column
      await prisma.$executeRaw`
        ALTER TABLE "Game" 
        ADD COLUMN "launchDate" TIMESTAMP(3)
      `;
      
      return NextResponse.json({ 
        success: true, 
        message: 'Launch date field added successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'Launch date field already exists' 
      });
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Migration failed' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to run migration' 
  });
}