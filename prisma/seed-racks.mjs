/**
 * Seed: creates 5 named racks (1A-5A) and distributes all wines logically.
 * Each rack: 4 cols × 6 rows (rows 0-2 = level 0, rows 3-5 = level 1)
 */
import Database from "better-sqlite3";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(resolve(__dirname, "../cellar.db"));
db.pragma("journal_mode = WAL");

// Fetch existing wines
const wines = db.prepare("SELECT id, name, color, quantity FROM Wine ORDER BY color, name").all();

// Remove old racks
db.prepare("UPDATE Wine SET rackId = NULL, rackRow = NULL, rackCol = NULL").run();
db.prepare("DELETE FROM Rack").run();

// Create 5 racks — 4 cols × 6 rows (2 levels of 3 rows each)
const racks = [
  { id: "rack-1a", name: "1A", rows: 6, cols: 4 },
  { id: "rack-2a", name: "2A", rows: 6, cols: 4 },
  { id: "rack-3a", name: "3A", rows: 6, cols: 4 },
  { id: "rack-4a", name: "4A", rows: 6, cols: 4 },
  { id: "rack-5a", name: "5A", rows: 6, cols: 4 },
];
const insertRack = db.prepare("INSERT INTO Rack (id, name, rows, cols) VALUES (?, ?, ?, ?)");
for (const r of racks) insertRack.run(r.id, r.name, r.rows, r.cols);

// Distribution map: wine name → rack id
const RACK_MAP = {
  // 1A — Bordeaux premium rouge
  "Château Batailley Lions de Batailley":          "rack-1a",
  "Château Carbonnieux L'Enclos De Carbonnieux Pessac-Léognan Rouge": "rack-1a",
  "Château Desmirail Margaux Grand Cru Classé":    "rack-1a",
  "Château Giscours La Sirène de Giscours Margaux":"rack-1a",
  "Château Gloria Saint-Julien":                   "rack-1a",
  "Château Haut-Batailley Verso Pauillac":         "rack-1a",
  "Château La Lagune Moulin du Château La Lagune": "rack-1a",
  "Château Olivier Le Dauphin d'Olivier Pessac-Léognan": "rack-1a",

  // 2A — Bordeaux grands châteaux
  "Château Penin Grande Sélection":                "rack-2a",
  "Château Pipeau Château Joinin Bordeaux":        "rack-2a",
  "Château Soleil Puisseguin-Saint-Émilion":       "rack-2a",
  "Château Talbot Connétable":                     "rack-2a",

  // 3A — Rhône + divers rouge
  "Paul Jaboulet Aîné Parallèle 45":               "rack-3a",
  "Château de Cazeneuve Cynarah Pic Saint Loup":   "rack-3a",
  "Château du Glana":                              "rack-3a",
  "Château l'Orial Bordeaux":                      "rack-3a",
  "Domaine du Clos des Fées Les Sorcières":        "rack-3a",
  "Tertre Les Hauts Du Tertre":                    "rack-3a",
  "Julien Cécillon Les Graviers Syrah":            "rack-3a",

  // 4A — Monde + rosé
  "Alta Vista Classic Reserva Malbec":             "rack-4a",
  "Finca Rio Negro Meraven":                       "rack-4a",
  "Lysiane Guy & Wilfried Mabileau Vieilles Vignes":"rack-4a",
  "Scea Château D'Ardennes":                       "rack-4a",
  "Tushpa Haghtanak":                              "rack-4a",
  "La Grande Cuvée de Dourthe Bordeaux Rosé":      "rack-4a",
  "Lionel Carreau Rosé Brut":                      "rack-4a",

  // 5A — Blancs
  "Château Carbon d'Artigues Graves Blanc":        "rack-5a",
  "Château Olivier Pessac-Léognan Grand Cru Classé":"rack-5a",
  "Château Sainte-Marie Vieilles Vignes Entre-deux-Mers":"rack-5a",
  "Château de Berne Terres de Berne Blanc":        "rack-5a",
  "Château de Rochemorin Pessac-Léognan Blanc":    "rack-5a",
  "Domaine Bardi D'Alquier Les Pierres Blanches":  "rack-5a",
  "François Villard L'appel Des Sereines":         "rack-5a",
  "Robert & Bernard Plageoles Mauzac Roux":        "rack-5a",
};

// Track slot occupancy per rack: [row][col] = filled
const slotCursor = {}; // rackId → next slot index (row-major, 0..23)
for (const r of racks) slotCursor[r.id] = 0;

const updateWine = db.prepare(
  "UPDATE Wine SET rackId = ?, rackRow = ?, rackCol = ? WHERE id = ?"
);

for (const wine of wines) {
  const rackId = RACK_MAP[wine.name];
  if (!rackId) {
    console.warn("⚠ No rack mapping for:", wine.name);
    continue;
  }
  // Assign 1 slot per bottle (quantity wines take consecutive slots)
  const slot = slotCursor[rackId];
  const row = Math.floor(slot / 4); // 4 cols per row
  const col = slot % 4;
  if (row >= 6) {
    console.warn("⚠ Rack full for", rackId, "— wine:", wine.name);
    continue;
  }
  updateWine.run(rackId, row, col, wine.id);
  slotCursor[rackId] += 1; // one slot per reference (quantity shown on the bottle)
}

// Summary
for (const r of racks) {
  const count = db.prepare("SELECT COUNT(*) as n FROM Wine WHERE rackId = ?").get(r.id);
  const bottles = db.prepare("SELECT SUM(quantity) as s FROM Wine WHERE rackId = ?").get(r.id);
  console.log(`Rack ${r.name}: ${count.n} références, ${bottles.s} bouteilles (cursor: ${slotCursor[r.id]})`);
}

db.close();
console.log("✓ Racks seeded");
