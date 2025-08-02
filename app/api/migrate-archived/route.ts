import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Read the migration SQL
    const migrationPath = path.join(process.cwd(), 'prisma', 'migrations', 'add_merch_archived.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }

    // Verify the columns were added
    const merchColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Merch' AND column_name = 'archived'
    `;
    
    const gameColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Game' AND column_name = 'archived'
    `;

    return NextResponse.json({
      success: true,
      message: 'Archive fields added successfully',
      merchArchived: (merchColumns as any[]).length > 0,
      gameArchived: (gameColumns as any[]).length > 0
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}