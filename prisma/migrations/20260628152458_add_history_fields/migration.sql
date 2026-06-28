-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WineHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "wineName" TEXT NOT NULL,
    "producer" TEXT,
    "vintage" INTEGER,
    "color" TEXT,
    "appellation" TEXT,
    "region" TEXT,
    "country" TEXT,
    "volume" INTEGER NOT NULL DEFAULT 75,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "rating" REAL,
    "imageUrl" TEXT,
    "consumedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_WineHistory" ("action", "appellation", "color", "createdAt", "id", "imageUrl", "producer", "quantity", "region", "vintage", "wineName") SELECT "action", "appellation", "color", "createdAt", "id", "imageUrl", "producer", "quantity", "region", "vintage", "wineName" FROM "WineHistory";
DROP TABLE "WineHistory";
ALTER TABLE "new_WineHistory" RENAME TO "WineHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
