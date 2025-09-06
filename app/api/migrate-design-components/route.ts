import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Create the DesignComponent table if it doesn't exist
    // First, let's check if the table exists by trying to count records
    try {
      await prisma.designComponent.count();
      return NextResponse.json({ 
        message: 'DesignComponent table already exists',
        success: true 
      });
    } catch (error: any) {
      // Table doesn't exist, let's create it using raw SQL
      if (error.code === 'P2021' || error.message?.includes('table') || error.message?.includes('relation')) {
        
        // Create the table with raw SQL
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "DesignComponent" (
            "id" TEXT NOT NULL,
            "gameId" INTEGER NOT NULL,
            "type" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "status" TEXT NOT NULL DEFAULT 'IN_DRAFT',
            "previewUrl" TEXT,
            "notes" TEXT,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "lastReviewedAt" TIMESTAMP(3),
            "approvedBy" TEXT,
            
            CONSTRAINT "DesignComponent_pkey" PRIMARY KEY ("id")
          );
        `;

        // Add foreign key constraint
        await prisma.$executeRaw`
          ALTER TABLE "DesignComponent" 
          ADD CONSTRAINT "DesignComponent_gameId_fkey" 
          FOREIGN KEY ("gameId") 
          REFERENCES "Game"("id") 
          ON DELETE CASCADE 
          ON UPDATE CASCADE;
        `;

        // Create indexes
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "DesignComponent_gameId_idx" ON "DesignComponent"("gameId");
        `;
        
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "DesignComponent_type_idx" ON "DesignComponent"("type");
        `;
        
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "DesignComponent_status_idx" ON "DesignComponent"("status");
        `;
        
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "DesignComponent_sortOrder_idx" ON "DesignComponent"("sortOrder");
        `;

        return NextResponse.json({ 
          message: 'DesignComponent table created successfully',
          success: true 
        });
      }
      
      // Some other error
      throw error;
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    );
  }
}