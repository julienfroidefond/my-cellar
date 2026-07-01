-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Wine" ("appellation", "color", "country", "createdAt", "grapeVarieties", "id", "imageUrl", "name", "notes", "producer", "region", "updatedAt") SELECT "appellation", "color", "country", "createdAt", "grapeVarieties", "id", "imageUrl", "name", "notes", "producer", "region", "updatedAt" FROM "Wine";
DROP TABLE "Wine";
ALTER TABLE "new_Wine" RENAME TO "Wine";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
