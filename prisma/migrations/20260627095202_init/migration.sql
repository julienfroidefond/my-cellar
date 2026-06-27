-- CreateTable
CREATE TABLE "Wine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "producer" TEXT,
    "vintage" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "volume" INTEGER NOT NULL DEFAULT 75,
    "color" TEXT,
    "region" TEXT,
    "appellation" TEXT,
    "grapeVarieties" TEXT,
    "country" TEXT DEFAULT 'France',
    "purchasePrice" REAL,
    "marketPrice" REAL,
    "notes" TEXT,
    "rackId" TEXT,
    "rackRow" INTEGER,
    "rackCol" INTEGER,
    "drinkFrom" INTEGER,
    "drinkUntil" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wine_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rows" INTEGER NOT NULL DEFAULT 6,
    "cols" INTEGER NOT NULL DEFAULT 12
);
