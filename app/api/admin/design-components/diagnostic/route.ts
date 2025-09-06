import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('products', 'read');

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        connected: false,
        tableExists: false,
        modelAvailable: false,
        error: null
      }
    };

    // Test basic database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      diagnostics.database.connected = true;
    } catch (error: any) {
      diagnostics.database.error = error.message;
    }

    // Test if table exists
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'DesignComponent'
        );
      `;
      diagnostics.database.tableExists = true;
    } catch (error: any) {
      diagnostics.database.tableError = error.message;
    }

    // Test if Prisma model is available
    try {
      // Try to access the model through Prisma client
      const modelCheck = typeof prisma.designComponent !== 'undefined';
      diagnostics.database.modelAvailable = modelCheck;
      
      // If model is available, try a simple query
      if (modelCheck) {
        const count = await prisma.designComponent.count();
        diagnostics.database.recordCount = count;
      }
    } catch (error: any) {
      diagnostics.database.modelError = error.message;
    }

    // List all available Prisma models
    try {
      const models = Object.keys(prisma).filter(key => 
        !key.startsWith('$') && 
        !key.startsWith('_') && 
        typeof (prisma as any)[key] === 'object'
      );
      diagnostics.availableModels = models;
    } catch (error: any) {
      diagnostics.modelsError = error.message;
    }

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    console.error('Diagnostic error:', error);
    return NextResponse.json(
      { 
        error: 'Diagnostic failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}