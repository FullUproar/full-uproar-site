-- Add category column to Game table
ALTER TABLE "Game" 
ADD COLUMN IF NOT EXISTS "category" VARCHAR(10) DEFAULT 'game';

-- Update any existing games without category
UPDATE "Game" 
SET "category" = 'game' 
WHERE "category" IS NULL;