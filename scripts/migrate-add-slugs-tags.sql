-- Migration script to add slugs and tags to existing tables

-- Add slug to Game table if it doesn't exist
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Generate slugs from existing titles
UPDATE "Game" 
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("title", '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE "slug" IS NULL;

-- Make slug NOT NULL and UNIQUE after populating
ALTER TABLE "Game" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Game" ADD CONSTRAINT "Game_slug_key" UNIQUE ("slug");

-- Add tags column
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "tags" TEXT;

-- Add tags to Merch table
ALTER TABLE "Merch" ADD COLUMN IF NOT EXISTS "tags" TEXT;

-- Create GameImage table if not exists
CREATE TABLE IF NOT EXISTS "GameImage" (
  "id" SERIAL PRIMARY KEY,
  "gameId" INTEGER NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "alt" TEXT,
  "isPrimary" BOOLEAN DEFAULT false NOT NULL,
  "sortOrder" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "GameImage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create MerchImage table if not exists
CREATE TABLE IF NOT EXISTS "MerchImage" (
  "id" SERIAL PRIMARY KEY,
  "merchId" INTEGER NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "alt" TEXT,
  "isPrimary" BOOLEAN DEFAULT false NOT NULL,
  "sortOrder" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "MerchImage_merchId_fkey" FOREIGN KEY ("merchId") REFERENCES "Merch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "GameImage_gameId_idx" ON "GameImage"("gameId");
CREATE INDEX IF NOT EXISTS "MerchImage_merchId_idx" ON "MerchImage"("merchId");

-- Migrate existing imageUrls to the new image tables
INSERT INTO "GameImage" ("gameId", "imageUrl", "isPrimary", "sortOrder")
SELECT "id", "imageUrl", true, 0
FROM "Game"
WHERE "imageUrl" IS NOT NULL AND "imageUrl" != ''
ON CONFLICT DO NOTHING;

INSERT INTO "MerchImage" ("merchId", "imageUrl", "isPrimary", "sortOrder")
SELECT "id", "imageUrl", true, 0
FROM "Merch"
WHERE "imageUrl" IS NOT NULL AND "imageUrl" != ''
ON CONFLICT DO NOTHING;