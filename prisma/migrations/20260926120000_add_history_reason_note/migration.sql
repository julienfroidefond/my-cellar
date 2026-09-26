-- Add reason + note to WineHistory to record why a bottle left the stock
-- (offert / régularisation) and an optional free-form note.
ALTER TABLE "WineHistory" ADD COLUMN "reason" TEXT;
ALTER TABLE "WineHistory" ADD COLUMN "note" TEXT;
