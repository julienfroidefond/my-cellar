ALTER TABLE "WineVintage" ADD COLUMN "rackedQuantity" INTEGER NOT NULL DEFAULT 0;
UPDATE "WineVintage" SET "rackedQuantity" = quantity WHERE "rackId" IS NOT NULL;
