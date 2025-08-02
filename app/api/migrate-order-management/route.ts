import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'prisma', 'migrations', 'add_comprehensive_order_management.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    const results = [];
    
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement + ';');
        results.push({ statement: statement.substring(0, 50) + '...', success: true });
      } catch (error: any) {
        // Some statements might fail if they already exist, that's ok
        results.push({ 
          statement: statement.substring(0, 50) + '...', 
          success: false,
          error: error.message 
        });
      }
    }
    
    return NextResponse.json({
      message: 'Order management migration completed',
      results,
      summary: {
        total: statements.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
}