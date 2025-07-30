-- Add missing fields to Game table
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "tags" TEXT;

-- Update existing games with slugs based on titles
UPDATE "Game" 
SET "slug" = LOWER(
    REPLACE(
        REPLACE(
            REPLACE("title", ' ', '-'),
            '''', ''
        ),
        '"', ''
    )
)
WHERE "slug" IS NULL;

-- Make slug unique and not null after populating
ALTER TABLE "Game" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Game_slug_key" ON "Game"("slug");

-- Add tags column to Merch if missing
ALTER TABLE "Merch" ADD COLUMN IF NOT EXISTS "tags" TEXT;

-- Create GameImage table
CREATE TABLE IF NOT EXISTS "GameImage" (
    "id" SERIAL PRIMARY KEY,
    "gameId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "GameImage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create MerchImage table
CREATE TABLE IF NOT EXISTS "MerchImage" (
    "id" SERIAL PRIMARY KEY,
    "merchId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "MerchImage_merchId_fkey" FOREIGN KEY ("merchId") REFERENCES "Merch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);