import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // This is a temporary debug endpoint
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  };

  // Test basic database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.checks.databaseConnection = 'OK';
  } catch (error: any) {
    diagnostics.checks.databaseConnection = `FAILED: ${error.message}`;
  }

  // Test if DesignComponent table exists
  try {
    const result: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'DesignComponent'
      LIMIT 1
    `;
    diagnostics.checks.designComponentTable = result.length > 0 ? 'EXISTS' : 'NOT FOUND';
  } catch (error: any) {
    diagnostics.checks.designComponentTable = `ERROR: ${error.message}`;
  }

  // Test if Prisma knows about designComponent model
  try {
    const hasModel = typeof (prisma as any).designComponent !== 'undefined';
    diagnostics.checks.prismaModel = hasModel ? 'AVAILABLE' : 'NOT FOUND';
    
    if (hasModel) {
      try {
        const count = await prisma.designComponent.count();
        diagnostics.checks.recordCount = count;
      } catch (error: any) {
        diagnostics.checks.queryError = error.message;
      }
    }
  } catch (error: any) {
    diagnostics.checks.prismaModel = `ERROR: ${error.message}`;
  }

  // List available Prisma models
  try {
    const models = Object.keys(prisma).filter(key => 
      !key.startsWith('$') && 
      !key.startsWith('_') && 
      typeof (prisma as any)[key] === 'object'
    );
    diagnostics.availableModels = models;
  } catch (error: any) {
    diagnostics.availableModels = `ERROR: ${error.message}`;
  }

  return NextResponse.json(diagnostics);
}