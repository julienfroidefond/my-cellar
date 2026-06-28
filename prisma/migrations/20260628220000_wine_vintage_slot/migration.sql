-- CreateTable: WineVintageSlot (one row per physical rack position)
CREATE TABLE IF NOT EXISTS "WineVintageSlot" (
  "id"        TEXT     NOT NULL PRIMARY KEY,
  "vintageId" TEXT     NOT NULL,
  "rackId"    TEXT     NOT NULL,
  "rackRow"   INTEGER  NOT NULL,
  "rackCol"   INTEGER  NOT NULL,
  "quantity"  INTEGER  NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("vintageId") REFERENCES "WineVintage"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("rackId")    REFERENCES "Rack"("id")        ON DELETE RESTRICT  ON UPDATE CASCADE
);

-- Migrate existing rack positions into slots (may produce 0 rows if no bottles were racked)
INSERT OR IGNORE INTO "WineVintageSlot" ("id","vintageId","rackId","rackRow","rackCol","quantity","createdAt")
SELECT 'vs'||substr("id",3),"id","rackId","rackRow","rackCol","rackedQuantity",CURRENT_TIMESTAMP
FROM "WineVintage" WHERE "rackId" IS NOT NULL AND "rackedQuantity" > 0;

-- Rebuild WineVintage without rack columns
CREATE TABLE "WineVintage_new" (
  "id"            TEXT     NOT NULL PRIMARY KEY,
  "wineId"        TEXT     NOT NULL,
  "vintage"       INTEGER,
  "quantity"      INTEGER  NOT NULL DEFAULT 1,
  "volume"        INTEGER  NOT NULL DEFAULT 75,
  "purchasePrice" REAL,
  "marketPrice"   REAL,
  "drinkFrom"     INTEGER,
  "drinkUntil"    INTEGER,
  "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     DATETIME NOT NULL,
  FOREIGN KEY ("wineId") REFERENCES "Wine"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "WineVintage_new"
  ("id","wineId","vintage","quantity","volume","purchasePrice","marketPrice","drinkFrom","drinkUntil","createdAt","updatedAt")
SELECT "id","wineId","vintage","quantity","volume","purchasePrice","marketPrice","drinkFrom","drinkUntil","createdAt","updatedAt"
FROM "WineVintage";

DROP TABLE "WineVintage";
ALTER TABLE "WineVintage_new" RENAME TO "WineVintage";
