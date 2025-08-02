-- Add archived field to Merch table
ALTER TABLE "Merch" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN DEFAULT false;

-- Add archived field to Game table
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN DEFAULT false;

-- Add indexes for better query performance when filtering by archived status
CREATE INDEX IF NOT EXISTS "Merch_archived_idx" ON "Merch"("archived");
CREATE INDEX IF NOT EXISTS "Game_archived_idx" ON "Game"("archived");