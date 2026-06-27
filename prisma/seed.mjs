import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../cellar.db");

const { PrismaClient } = await import("../app/generated/prisma/client.ts");
const database = new Database(dbPath);
const adapter = new PrismaBetterSqlite3(database);
const prisma = new PrismaClient({ adapter });

const wines = [
  { name: "La Grande Cuvée de Dourthe Bordeaux Rosé", producer: "Dourthe", vintage: 2023, quantity: 1, volume: 75, color: "rosé", region: "Bordeaux", appellation: "Bordeaux", country: "France", marketPrice: 7.24 },
  { name: "Château Desmirail Margaux Grand Cru Classé", producer: "Château Desmirail", vintage: 2021, quantity: 3, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Margaux", country: "France", marketPrice: 39.60 },
  { name: "Paul Jaboulet Aîné Parallèle 45", producer: "Paul Jaboulet Aîné", vintage: 2024, quantity: 12, volume: 75, color: "rouge", region: "Rhône", appellation: "Côtes du Rhône", country: "France", marketPrice: 9.60 },
  { name: "Tushpa Haghtanak", producer: "Tushpa", vintage: 2021, quantity: 2, volume: 75, color: "rouge", region: "Arménie", appellation: "Arménie", country: "Arménie", purchasePrice: 25.00, marketPrice: 22.80 },
  { name: "Domaine du Clos des Fées Les Sorcières", producer: "Domaine du Clos des Fées", vintage: 2023, quantity: 1, volume: 75, color: "rouge", region: "Roussillon", appellation: "Côtes Catalanes", country: "France", marketPrice: 15.60 },
  { name: "Alta Vista Classic Reserva Malbec", producer: "Alta Vista", vintage: 2017, quantity: 1, volume: 75, color: "rouge", region: "Mendoza", appellation: "Mendoza", country: "Argentine", marketPrice: 13.20 },
  { name: "Scea Château D'Ardennes", producer: "Château D'Ardennes", vintage: 2019, quantity: 1, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Bordeaux", country: "France" },
  { name: "Château Carbonnieux L'Enclos De Carbonnieux Pessac-Léognan Rouge", producer: "Château Carbonnieux", vintage: 2021, quantity: 1, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Pessac-Léognan", country: "France", marketPrice: 19.20 },
  { name: "Robert & Bernard Plageoles Mauzac Roux", producer: "Domaine Plageoles", vintage: 2010, quantity: 1, volume: 75, color: "blanc", region: "Sud-Ouest", appellation: "Gaillac", country: "France", marketPrice: 19.20 },
  { name: "Château de Berne Terres de Berne Blanc", producer: "Château de Berne", vintage: 2023, quantity: 6, volume: 75, color: "blanc", region: "Provence", appellation: "Côtes de Provence", country: "France", marketPrice: 19.20 },
  { name: "Château Olivier Pessac-Léognan Grand Cru Classé", producer: "Château Olivier", vintage: 2014, quantity: 2, volume: 75, color: "blanc", region: "Bordeaux", appellation: "Pessac-Léognan", country: "France", marketPrice: 37.20 },
  { name: "Domaine Bardi D'Alquier Les Pierres Blanches", producer: "Domaine Bardi D'Alquier", vintage: 2025, quantity: 6, volume: 75, color: "blanc", region: "Languedoc", appellation: "Faugères", country: "France" },
  { name: "Château Pipeau Château Joinin Bordeaux", producer: "Château Pipeau", vintage: 2024, quantity: 6, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Bordeaux", country: "France", marketPrice: 7.20 },
  { name: "Lysiane Guy & Wilfried Mabileau Vieilles Vignes", producer: "Mabileau", vintage: 2023, quantity: 1, volume: 75, color: "rouge", region: "Loire", appellation: "Saint-Nicolas-de-Bourgueil", country: "France" },
  { name: "Château Sainte-Marie Vieilles Vignes Entre-deux-Mers", producer: "Château Sainte-Marie", vintage: 2024, quantity: 2, volume: 75, color: "blanc", region: "Bordeaux", appellation: "Entre-deux-Mers", country: "France", marketPrice: 12.00 },
  { name: "Finca Rio Negro Meraven", producer: "Finca Rio Negro", vintage: 2020, quantity: 1, volume: 75, color: "rouge", region: "Patagonie", appellation: "Patagonie", country: "Argentine", marketPrice: 16.80 },
  { name: "Lionel Carreau Rosé Brut", producer: "Lionel Carreau", vintage: 2024, quantity: 2, volume: 75, color: "rosé", region: "Loire", appellation: "Crémant de Loire", country: "France" },
  { name: "Château Talbot Connétable", producer: "Château Talbot", vintage: 2019, quantity: 6, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Saint-Julien", country: "France", marketPrice: 36.00 },
  { name: "Julien Cécillon Les Graviers Syrah", producer: "Julien Cécillon", vintage: 2023, quantity: 1, volume: 75, color: "rouge", region: "Rhône", appellation: "Saint-Joseph", country: "France", marketPrice: 12.00 },
  { name: "Château Olivier Le Dauphin d'Olivier Pessac-Léognan", producer: "Château Olivier", vintage: 2014, quantity: 1, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Pessac-Léognan", country: "France", marketPrice: 16.80 },
  { name: "Château Batailley Lions de Batailley", producer: "Château Batailley", vintage: 2020, quantity: 1, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Pauillac", country: "France", marketPrice: 48.00 },
  { name: "Château La Lagune Moulin du Château La Lagune", producer: "Château La Lagune", vintage: 2019, quantity: 2, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Haut-Médoc", country: "France", marketPrice: 24.60 },
  { name: "Château Penin Grande Sélection", producer: "Château Penin", vintage: 2020, quantity: 6, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Bordeaux Supérieur", country: "France" },
  { name: "Château de Cazeneuve Cynarah Pic Saint Loup", producer: "Château de Cazeneuve", vintage: 2023, quantity: 1, volume: 75, color: "rouge", region: "Languedoc", appellation: "Pic Saint Loup", country: "France", marketPrice: 14.40 },
  { name: "Château de Rochemorin Pessac-Léognan Blanc", producer: "Château de Rochemorin", vintage: 2020, quantity: 3, volume: 75, color: "blanc", region: "Bordeaux", appellation: "Pessac-Léognan", country: "France", marketPrice: 20.40 },
  { name: "Château Haut-Batailley Verso Pauillac", producer: "Château Haut-Batailley", vintage: 2019, quantity: 3, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Pauillac", country: "France", marketPrice: 28.80 },
  { name: "Tertre Les Hauts Du Tertre", producer: "Château du Tertre", vintage: 2019, quantity: 4, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Margaux", country: "France", marketPrice: 25.20 },
  { name: "Château Carbon d'Artigues Graves Blanc", producer: "Château Carbon d'Artigues", vintage: 2024, quantity: 6, volume: 75, color: "blanc", region: "Bordeaux", appellation: "Graves", country: "France", marketPrice: 16.80 },
  { name: "Château l'Orial Bordeaux", producer: "Château l'Orial", vintage: 2020, quantity: 1, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Bordeaux", country: "France", purchasePrice: 0 },
  { name: "Château du Glana", producer: "Château du Glana", vintage: 2017, quantity: 1, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Saint-Julien", country: "France", marketPrice: 27.60 },
  { name: "Château Giscours La Sirène de Giscours Margaux", producer: "Château Giscours", vintage: 2017, quantity: 1, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Margaux", country: "France", marketPrice: 34.80 },
  { name: "Château Gloria Saint-Julien", producer: "Château Gloria", vintage: 2012, quantity: 2, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Saint-Julien", country: "France", marketPrice: 56.40 },
  { name: "François Villard L'appel Des Sereines", producer: "François Villard", vintage: 2022, quantity: 1, volume: 75, color: "blanc", region: "Rhône", appellation: "Condrieu", country: "France", marketPrice: 13.20 },
  { name: "Château Soleil Puisseguin-Saint-Émilion", producer: "Château Soleil", vintage: 2015, quantity: 3, volume: 75, color: "rouge", region: "Bordeaux", appellation: "Puisseguin-Saint-Émilion", country: "France", marketPrice: 28.45 },
];

async function main() {
  const rack = await prisma.rack.upsert({
    where: { id: "default-rack" },
    update: {},
    create: {
      id: "default-rack",
      name: "Cave principale",
      rows: 8,
      cols: 12,
    },
  });

  await prisma.wine.deleteMany();

  let position = 0;
  for (const wine of wines) {
    const row = Math.floor(position / rack.cols);
    const col = position % rack.cols;
    await prisma.wine.create({
      data: {
        ...wine,
        rackId: rack.id,
        rackRow: row < rack.rows ? row : undefined,
        rackCol: row < rack.rows ? col : undefined,
      },
    });
    position += wine.quantity;
  }

  console.log(`Seeded ${wines.length} wines`);
  await prisma.$disconnect();
}

main().catch(console.error);
