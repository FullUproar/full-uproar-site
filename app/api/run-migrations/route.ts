import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const results: any[] = [];

  try {
    // Check if columns already exist by querying information schema
    const existingColumns = await prisma.$queryRaw<Array<{column_name: string}>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('cultDevotion', 'cultLevel', 'cultLastVisit', 'achievementPoints', 'easterEggsFound')
    `;

    const existingColumnNames = existingColumns.map(col => col.column_name);
    results.push({ 
      step: 'Check existing columns', 
      existingColumns: existingColumnNames 
    });

    // Add missing columns one by one
    const columnsToAdd = [
      { name: 'cultDevotion', definition: 'INTEGER DEFAULT 0' },
      { name: 'cultLevel', definition: 'INTEGER DEFAULT 0' },
      { name: 'cultLastVisit', definition: 'TIMESTAMP(3)' },
      { name: 'achievementPoints', definition: 'INTEGER DEFAULT 0' },
      { name: 'easterEggsFound', definition: 'TEXT' }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumnNames.includes(column.name)) {
        try {
          await prisma.$executeRawUnsafe(
            `ALTER TABLE "User" ADD COLUMN "${column.name}" ${column.definition}`
          );
          results.push({ 
            step: `Add column ${column.name}`, 
            status: 'success' 
          });
        } catch (error) {
          results.push({ 
            step: `Add column ${column.name}`, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      } else {
        results.push({ 
          step: `Add column ${column.name}`, 
          status: 'skipped', 
          reason: 'Column already exists' 
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migrations completed',
      results 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : String(error),
      results 
    }, { status: 500 });
  }
}