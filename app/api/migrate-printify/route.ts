import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Add Printify fields to Merch table
    await prisma.$executeRaw`
      ALTER TABLE "Merch" 
      ADD COLUMN IF NOT EXISTS "printifyId" TEXT,
      ADD COLUMN IF NOT EXISTS "blueprintId" INTEGER,
      ADD COLUMN IF NOT EXISTS "printProviderId" INTEGER,
      ADD COLUMN IF NOT EXISTS "variantMapping" TEXT,
      ADD COLUMN IF NOT EXISTS "isPrintify" BOOLEAN DEFAULT false
    `;
    
    // Create Settings table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Settings" (
        "id" SERIAL PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        "description" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Settings_key_idx" ON "Settings"("key")
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Printify migration completed successfully'
    });
  } catch (error) {
    console.error('Error running Printify migration:', error);
    return NextResponse.json({ 
      error: 'Failed to run Printify migration',
      details: String(error)
    }, { status: 500 });
  }
}