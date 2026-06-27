/**
 * fix-positions.mjs
 * Recalcule rackRow/rackCol pour chaque vin dans un casier,
 * en avançant le curseur de `quantity` slots (et non 1 slot par vin).
 * Après ce script, les slots sont non-chevauchants et la visu positionnelle est correcte.
 */
import Database from "better-sqlite3";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(resolve(__dirname, "../cellar.db"));
db.pragma("journal_mode = WAL");

const NUM_COLS = { "1A": 4, "2A": 4, "3A": 4, "4A": 4, "5A": 6 };

const racks = db.prepare("SELECT id, name FROM Rack ORDER BY name").all();
const update = db.prepare(
  "UPDATE Wine SET rackRow = ?, rackCol = ? WHERE id = ?"
);

for (const rack of racks) {
  const numCols = NUM_COLS[rack.name] ?? 4;
  const wines = db
    .prepare(
      "SELECT id, quantity FROM Wine WHERE rackId = ? ORDER BY rackRow ASC, rackCol ASC"
    )
    .all(rack.id);

  let cursor = 0;
  for (const wine of wines) {
    const row = Math.floor(cursor / numCols);
    const col = cursor % numCols;
    update.run(row, col, wine.id);
    cursor += wine.quantity;
  }

  console.log(
    `Rack ${rack.name}: ${wines.length} vins, ${cursor} slots utilisés (numCols=${numCols})`
  );
}

db.close();
console.log("✓ Positions corrigées");
