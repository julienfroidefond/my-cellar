-- Un emplacement physique (rackId, rackRow, rackCol) ne doit contenir qu'un seul slot.
-- Des doublons masquaient des bouteilles dans la vue cave (buildSlotMap écrasait les
-- entrées à la même position). On nettoie les doublons existants en gardant le plus
-- ancien slot (plus petit id) par emplacement ; les bouteilles en trop redeviennent
-- automatiquement « à ranger » puisque le stock (WineVintage.quantity) n'est pas modifié.
DELETE FROM "WineVintageSlot"
WHERE "id" NOT IN (
  SELECT MIN("id")
  FROM "WineVintageSlot"
  GROUP BY "rackId", "rackRow", "rackCol"
);

CREATE UNIQUE INDEX IF NOT EXISTS "WineVintageSlot_rackId_rackRow_rackCol_key"
ON "WineVintageSlot"("rackId", "rackRow", "rackCol");
