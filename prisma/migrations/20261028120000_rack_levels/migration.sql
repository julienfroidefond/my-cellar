-- Une étagère par ligne : la hauteur (nombre d'étagères), la largeur
-- (`front`) et la profondeur (`back`) deviennent des données éditables,
-- partagées par la vue plan et la vue 3D.
CREATE TABLE "RackLevel" (
  "id"       TEXT    NOT NULL PRIMARY KEY,
  "rackId"   TEXT    NOT NULL,
  "position" INTEGER NOT NULL,
  "front"    INTEGER NOT NULL,
  "back"     INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("rackId") REFERENCES "Rack"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RackLevel_rackId_position_key" ON "RackLevel"("rackId", "position");

-- Reprend la configuration qui était codée en dur dans `lib/rack-configs.ts`
-- pour que les bouteilles déjà rangées restent au même endroit.
-- 1A : 2 étagères dont la première sans profondeur.
-- 2A/3A/4A : 3 étagères de 4 + 4.
-- 5A : 4 étagères de 6, sans arrière.
-- Tout autre casier : 2 étagères de 4 + 4.
INSERT INTO "RackLevel" ("id", "rackId", "position", "front", "back")
SELECT
  'rl-' || r."id" || '-' || n.n,
  r."id",
  n.n,
  CASE WHEN r."name" = '5A' THEN 6 ELSE 4 END,
  CASE
    WHEN r."name" = '1A' AND n.n = 0 THEN 0
    WHEN r."name" = '5A' THEN 0
    ELSE 4
  END
FROM "Rack" r
JOIN (
  SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
) n
WHERE n.n < CASE
  WHEN r."name" = '1A' THEN 2
  WHEN r."name" IN ('2A', '3A', '4A') THEN 3
  WHEN r."name" = '5A' THEN 4
  ELSE 2
END;

-- Garde `rows` / `cols` cohérents pour les exports et les lectures legacy.
UPDATE "Rack"
SET
  "rows" = (SELECT COUNT(*) FROM "RackLevel" WHERE "rackId" = "Rack"."id"),
  "cols" = (SELECT MAX(MAX("front", "back")) FROM "RackLevel" WHERE "rackId" = "Rack"."id");
