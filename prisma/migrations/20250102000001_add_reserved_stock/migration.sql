-- AddColumn (if not exists)
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "reservedStock" INTEGER NOT NULL DEFAULT 0;
