-- Add new fields to Game table
ALTER TABLE "Game" 
ADD COLUMN IF NOT EXISTS "howToPlay" TEXT,
ADD COLUMN IF NOT EXISTS "components" TEXT,
ADD COLUMN IF NOT EXISTS "videoUrl" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create Review table
CREATE TABLE IF NOT EXISTS "Review" (
  "id" SERIAL PRIMARY KEY,
  "gameId" INTEGER,
  "merchId" INTEGER,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "comment" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "helpful" INTEGER NOT NULL DEFAULT 0,
  "unhelpful" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "Review_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Review_merchId_fkey" FOREIGN KEY ("merchId") REFERENCES "Merch"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for Review
CREATE INDEX IF NOT EXISTS "Review_gameId_idx" ON "Review"("gameId");
CREATE INDEX IF NOT EXISTS "Review_merchId_idx" ON "Review"("merchId");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");

-- Create ProductView table
CREATE TABLE IF NOT EXISTS "ProductView" (
  "id" SERIAL PRIMARY KEY,
  "productType" TEXT NOT NULL,
  "productId" INTEGER NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for ProductView
CREATE INDEX IF NOT EXISTS "ProductView_productType_productId_idx" ON "ProductView"("productType", "productId");
CREATE INDEX IF NOT EXISTS "ProductView_userId_idx" ON "ProductView"("userId");
CREATE INDEX IF NOT EXISTS "ProductView_sessionId_idx" ON "ProductView"("sessionId");
CREATE INDEX IF NOT EXISTS "ProductView_createdAt_idx" ON "ProductView"("createdAt");

-- Create UserActivity table
CREATE TABLE IF NOT EXISTS "UserActivity" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" INTEGER NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for UserActivity
CREATE INDEX IF NOT EXISTS "UserActivity_userId_idx" ON "UserActivity"("userId");
CREATE INDEX IF NOT EXISTS "UserActivity_action_idx" ON "UserActivity"("action");
CREATE INDEX IF NOT EXISTS "UserActivity_targetType_targetId_idx" ON "UserActivity"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "UserActivity_createdAt_idx" ON "UserActivity"("createdAt");