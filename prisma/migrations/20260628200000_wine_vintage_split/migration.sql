-- Migration: Wine + WineVintage split
-- Step 1: Create WineVintage table (references old Wine.id as wineId)
CREATE TABLE "WineVintage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wineId" TEXT NOT NULL,
    "vintage" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "volume" INTEGER NOT NULL DEFAULT 75,
    "purchasePrice" REAL,
    "marketPrice" REAL,
    "drinkFrom" INTEGER,
    "drinkUntil" INTEGER,
    "rackId" TEXT,
    "rackRow" INTEGER,
    "rackCol" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WineVintage_wineId_fkey" FOREIGN KEY ("wineId") REFERENCES "Wine" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WineVintage_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Step 2: Populate WineVintage 1-to-1 from existing Wine records
INSERT INTO "WineVintage" ("id", "wineId", "vintage", "quantity", "volume", "purchasePrice", "marketPrice", "drinkFrom", "drinkUntil", "rackId", "rackRow", "rackCol", "createdAt", "updatedAt")
SELECT 
    'wv' || substr("id", 2),
    "id",
    "vintage",
    "quantity",
    "volume",
    "purchasePrice",
    "marketPrice",
    "drinkFrom",
    "drinkUntil",
    "rackId",
    "rackRow",
    "rackCol",
    "createdAt",
    "updatedAt"
FROM "Wine";

-- Step 3: Create slimmed-down Wine table
CREATE TABLE "new_Wine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "producer" TEXT,
    "color" TEXT,
    "region" TEXT,
    "appellation" TEXT,
    "grapeVarieties" TEXT,
    "country" TEXT DEFAULT 'France',
    "notes" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Copy wine-level data (one row per existing Wine record — dedup happens post-migration)
INSERT INTO "new_Wine" ("id", "name", "producer", "color", "region", "appellation", "grapeVarieties", "country", "notes", "imageUrl", "createdAt", "updatedAt")
SELECT "id", "name", "producer", "color", "region", "appellation", "grapeVarieties", "country", "notes", "imageUrl", "createdAt", "updatedAt"
FROM "Wine";

-- Step 5: Replace Wine table
DROP TABLE "Wine";
ALTER TABLE "new_Wine" RENAME TO "Wine";

-- Step 6: Drop old Rack.wines relation (Rack had wines, now has vintages)
CREATE TABLE "new_Rack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rows" INTEGER NOT NULL DEFAULT 6,
    "cols" INTEGER NOT NULL DEFAULT 12
);
INSERT INTO "new_Rack" SELECT "id", "name", "rows", "cols" FROM "Rack";
DROP TABLE "Rack";
ALTER TABLE "new_Rack" RENAME TO "Rack";

-- Step 7: Indexes
CREATE INDEX "WineVintage_wineId_idx" ON "WineVintage"("wineId");
CREATE INDEX "WineVintage_rackId_idx" ON "WineVintage"("rackId");
