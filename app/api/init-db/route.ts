import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DANGER: This endpoint creates tables directly
// Only use this if migrations aren't working
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Require authentication
    if (secret !== process.env.INIT_SECRET && secret !== 'emergency-init-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const results = [];
    
    // Create tables one by one
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Merch" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "slug" TEXT UNIQUE NOT NULL,
          "description" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "priceCents" INTEGER NOT NULL,
          "imageUrl" TEXT,
          "sizes" TEXT,
          "featured" BOOLEAN DEFAULT false NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;
      results.push('Merch table created');
    } catch (e) {
      results.push(`Merch table error: ${e}`);
    }
    
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Inventory" (
          "id" SERIAL PRIMARY KEY,
          "merchId" INTEGER NOT NULL,
          "size" TEXT,
          "quantity" INTEGER DEFAULT 0 NOT NULL,
          "reserved" INTEGER DEFAULT 0 NOT NULL,
          CONSTRAINT "Inventory_merchId_fkey" FOREIGN KEY ("merchId") REFERENCES "Merch"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `;
      results.push('Inventory table created');
    } catch (e) {
      results.push(`Inventory table error: ${e}`);
    }
    
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Order" (
          "id" TEXT PRIMARY KEY,
          "customerEmail" TEXT NOT NULL,
          "customerName" TEXT NOT NULL,
          "shippingAddress" TEXT NOT NULL,
          "billingAddress" TEXT,
          "status" TEXT DEFAULT 'pending' NOT NULL,
          "totalCents" INTEGER NOT NULL,
          "shippingCents" INTEGER DEFAULT 0 NOT NULL,
          "taxCents" INTEGER DEFAULT 0 NOT NULL,
          "trackingNumber" TEXT,
          "notes" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;
      results.push('Order table created');
    } catch (e) {
      results.push(`Order table error: ${e}`);
    }
    
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "OrderItem" (
          "id" SERIAL PRIMARY KEY,
          "orderId" TEXT NOT NULL,
          "itemType" TEXT NOT NULL,
          "gameId" INTEGER,
          "merchId" INTEGER,
          "merchSize" TEXT,
          "quantity" INTEGER NOT NULL,
          "priceCents" INTEGER NOT NULL,
          CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `;
      results.push('OrderItem table created');
    } catch (e) {
      results.push(`OrderItem table error: ${e}`);
    }
    
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "OrderStatusHistory" (
          "id" SERIAL PRIMARY KEY,
          "orderId" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "note" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `;
      results.push('OrderStatusHistory table created');
    } catch (e) {
      results.push(`OrderStatusHistory table error: ${e}`);
    }
    
    // Add stock column to Game if missing
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "stock" INTEGER DEFAULT 0 NOT NULL
      `;
      results.push('Game stock column added');
    } catch (e) {
      results.push(`Game stock column error: ${e}`);
    }
    
    return NextResponse.json({
      success: true,
      results,
      message: 'Database initialization attempted. Check /api/health for status.'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}