-- Create tables for Full Uproar e-commerce
-- Run this in your Vercel PostgreSQL database

-- Product table (might already exist)
CREATE TABLE IF NOT EXISTS "Product" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "stock" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Game table
CREATE TABLE IF NOT EXISTS "Game" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "tagline" TEXT,
  "description" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "players" TEXT NOT NULL,
  "timeToPlay" TEXT NOT NULL,
  "ageRating" TEXT NOT NULL,
  "imageUrl" TEXT,
  "isBundle" BOOLEAN DEFAULT false NOT NULL,
  "isPreorder" BOOLEAN DEFAULT true NOT NULL,
  "featured" BOOLEAN DEFAULT false NOT NULL,
  "bundleInfo" TEXT,
  "stock" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Comic table
CREATE TABLE IF NOT EXISTS "Comic" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "episode" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- NewsPost table
CREATE TABLE IF NOT EXISTS "NewsPost" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "content" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- EmailSubscriber table
CREATE TABLE IF NOT EXISTS "EmailSubscriber" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Artwork table
CREATE TABLE IF NOT EXISTS "Artwork" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "largeUrl" TEXT,
  "category" TEXT NOT NULL,
  "tags" TEXT,
  "chaosMode" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Merch table
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
);

-- Inventory table
CREATE TABLE IF NOT EXISTS "Inventory" (
  "id" SERIAL PRIMARY KEY,
  "merchId" INTEGER NOT NULL,
  "size" TEXT,
  "quantity" INTEGER DEFAULT 0 NOT NULL,
  "reserved" INTEGER DEFAULT 0 NOT NULL,
  CONSTRAINT "Inventory_merchId_fkey" FOREIGN KEY ("merchId") REFERENCES "Merch"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create unique index for Inventory
CREATE UNIQUE INDEX IF NOT EXISTS "Inventory_merchId_size_key" ON "Inventory"("merchId", "size");

-- Order table
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
);

-- OrderItem table
CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" SERIAL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "gameId" INTEGER,
  "merchId" INTEGER,
  "merchSize" TEXT,
  "quantity" INTEGER NOT NULL,
  "priceCents" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OrderItem_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "OrderItem_merchId_fkey" FOREIGN KEY ("merchId") REFERENCES "Merch"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- OrderStatusHistory table
CREATE TABLE IF NOT EXISTS "OrderStatusHistory" (
  "id" SERIAL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Order_customerEmail_idx" ON "Order"("customerEmail");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");