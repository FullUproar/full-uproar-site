-- Add Printify fields to Merch table
ALTER TABLE "Merch" 
ADD COLUMN IF NOT EXISTS "printifyId" TEXT,
ADD COLUMN IF NOT EXISTS "blueprintId" INTEGER,
ADD COLUMN IF NOT EXISTS "printProviderId" INTEGER,
ADD COLUMN IF NOT EXISTS "variantMapping" TEXT,
ADD COLUMN IF NOT EXISTS "isPrintify" BOOLEAN DEFAULT false;

-- Create Settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Settings" (
    "id" SERIAL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on Settings key
CREATE INDEX IF NOT EXISTS "Settings_key_idx" ON "Settings"("key");