-- CreateTable
CREATE TABLE "WineHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "wineName" TEXT NOT NULL,
    "producer" TEXT,
    "vintage" INTEGER,
    "color" TEXT,
    "appellation" TEXT,
    "region" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
