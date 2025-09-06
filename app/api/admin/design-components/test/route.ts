import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test endpoint - remove after debugging
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {}
  };

  try {
    // Test 1: Basic database connection
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      results.tests.dbConnection = 'PASS';
    } catch (e: any) {
      results.tests.dbConnection = `FAIL: ${e.message}`;
    }

    // Test 2: Check if DesignComponent table exists
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'DesignComponent'
        ) as exists;
      `;
      results.tests.tableExists = tableCheck;
    } catch (e: any) {
      results.tests.tableExists = `FAIL: ${e.message}`;
    }

    // Test 3: Try to count records
    try {
      const count = await prisma.designComponent.count();
      results.tests.recordCount = count;
    } catch (e: any) {
      results.tests.recordCount = `FAIL: ${e.message}`;
    }

    // Test 4: Check if Prisma client knows about the model
    results.tests.modelAvailable = typeof prisma.designComponent !== 'undefined';

    // Test 5: List all Prisma models
    try {
      const models = Object.keys(prisma).filter(key => 
        !key.startsWith('$') && 
        !key.startsWith('_') && 
        typeof (prisma as any)[key] === 'object'
      );
      results.tests.availableModels = models.slice(0, 10); // First 10 models
    } catch (e: any) {
      results.tests.availableModels = `FAIL: ${e.message}`;
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      ...results,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}