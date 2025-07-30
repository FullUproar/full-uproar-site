-- Create GameInventory table
CREATE TABLE IF NOT EXISTS "GameInventory" (
    "id" SERIAL PRIMARY KEY,
    "gameId" INTEGER NOT NULL UNIQUE,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE
);

-- Migrate existing stock data from Game table to GameInventory
INSERT INTO "GameInventory" ("gameId", "quantity", "reserved")
SELECT "id", "stock", 0
FROM "Game"
WHERE NOT EXISTS (
    SELECT 1 FROM "GameInventory" WHERE "GameInventory"."gameId" = "Game"."id"
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "GameInventory_gameId_idx" ON "GameInventory"("gameId");