import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "cellar.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

// Each entry: wine-level fields + vintages array
const wines = [
  {
    name: "La Grande Cuvée de Dourthe Bordeaux Rosé", producer: "Dourthe", color: "rosé", region: "Bordeaux", appellation: "Bordeaux", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/eN4eo8hTSbu5neOck2zQSg_pb_x960.png",
    vintages: [{ vintage: 2023, quantity: 1, volume: 75, marketPrice: 7.24 }],
  },
  {
    name: "Château Desmirail", producer: "Château Desmirail", color: "rouge", region: "Bordeaux", appellation: "Margaux", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/VQhyMDx1QzuiPbdMXXubKA_pb_x960.png",
    vintages: [{ vintage: 2021, quantity: 3, volume: 75, marketPrice: 39.60 }],
  },
  {
    name: "Parallèle 45", producer: "Paul Jaboulet Aîné", color: "rouge", region: "Rhône", appellation: "Côtes du Rhône", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/AWen2wn-Q1Ok9d2bSofHng_pb_x960.png",
    vintages: [{ vintage: 2024, quantity: 12, volume: 75, marketPrice: 9.60 }],
  },
  {
    name: "Haghtanak", producer: "Tushpa", color: "rouge", region: "Arménie", appellation: "Arménie", country: "Arménie",
    imageUrl: "https://images.vivino.com/thumbs/8YP82faGQZSXCfY_2H-Byw_pb_x960.png",
    vintages: [{ vintage: 2021, quantity: 2, volume: 75, purchasePrice: 25.00, marketPrice: 22.80 }],
  },
  {
    name: "Les Sorcières", producer: "Domaine du Clos des Fées", color: "rouge", region: "Roussillon", appellation: "Côtes Catalanes", country: "France",
    vintages: [{ vintage: 2023, quantity: 1, volume: 75, marketPrice: 15.60 }],
  },
  {
    name: "Classic Reserva Malbec", producer: "Alta Vista", color: "rouge", region: "Mendoza", appellation: "Mendoza", country: "Argentine",
    imageUrl: "https://images.vivino.com/thumbs/Kd0L8RYSQCmYpKjWywrTtA_pb_x960.png",
    vintages: [{ vintage: 2017, quantity: 1, volume: 75, marketPrice: 13.20 }],
  },
  {
    name: "Scea Château D'Ardennes", producer: "Château D'Ardennes", color: "rouge", region: "Bordeaux", appellation: "Bordeaux", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/oLwE_SldQ9iX2PO2lf1tkA_pb_x960.png",
    vintages: [{ vintage: 2019, quantity: 1, volume: 75 }],
  },
  {
    name: "L'Enclos de Carbonnieux", producer: "Château Carbonnieux", color: "rouge", region: "Bordeaux", appellation: "Pessac-Léognan", country: "France",
    vintages: [{ vintage: 2021, quantity: 1, volume: 75, marketPrice: 19.20 }],
  },
  {
    name: "Mauzac Roux", producer: "Domaine Plageoles", color: "blanc", region: "Sud-Ouest", appellation: "Gaillac", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/sYBSGw-uTzmvCPEq8w-Wwg_pb_x960.png",
    vintages: [{ vintage: 2010, quantity: 1, volume: 75, marketPrice: 19.20 }],
  },
  {
    name: "Terres de Berne Blanc", producer: "Château de Berne", color: "blanc", region: "Provence", appellation: "Côtes de Provence", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/QqWzlcnwSOe5GIhF6ByVYg_pb_x960.png",
    vintages: [{ vintage: 2023, quantity: 6, volume: 75, marketPrice: 19.20 }],
  },
  {
    name: "Château Olivier", producer: "Château Olivier", color: "blanc", region: "Bordeaux", appellation: "Pessac-Léognan", country: "France",
    vintages: [{ vintage: 2014, quantity: 2, volume: 75, marketPrice: 37.20 }],
  },
  {
    name: "Les Pierres Blanches", producer: "Domaine Bardi D'Alquier", color: "blanc", region: "Languedoc", appellation: "Faugères", country: "France",
    vintages: [{ vintage: 2025, quantity: 6, volume: 75 }],
  },
  {
    name: "Château Joinin", producer: "Château Pipeau", color: "rouge", region: "Bordeaux", appellation: "Bordeaux", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/aAhYUx61R76152ExRULkkw_pb_x960.png",
    vintages: [{ vintage: 2024, quantity: 6, volume: 75, marketPrice: 7.20 }],
  },
  {
    name: "Vieilles Vignes Bourgueil", producer: "Mabileau", color: "rouge", region: "Loire", appellation: "Saint-Nicolas-de-Bourgueil", country: "France",
    vintages: [{ vintage: 2023, quantity: 1, volume: 75 }],
  },
  {
    name: "Vieilles Vignes Entre-deux-Mers", producer: "Château Sainte-Marie", color: "blanc", region: "Bordeaux", appellation: "Entre-deux-Mers", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/M5-FbCErRPiuqJPoPj7-XA_pb_x960.png",
    vintages: [{ vintage: 2024, quantity: 2, volume: 75, marketPrice: 12.00 }],
  },
  {
    name: "Meraven", producer: "Finca Rio Negro", color: "rouge", region: "Patagonie", appellation: "Patagonie", country: "Argentine",
    imageUrl: "https://images.vivino.com/thumbs/PNPh24t9QvKvDGqDhDJL7g_pb_x960.png",
    vintages: [{ vintage: 2020, quantity: 1, volume: 75, marketPrice: 16.80 }],
  },
  {
    name: "Rosé Brut", producer: "Lionel Carreau", color: "rosé", region: "Loire", appellation: "Crémant de Loire", country: "France",
    vintages: [{ vintage: 2024, quantity: 2, volume: 75 }],
  },
  {
    name: "Connétable de Talbot", producer: "Château Talbot", color: "rouge", region: "Bordeaux", appellation: "Saint-Julien", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/RL-LE-8tR6CLk9nyncjDVw_pb_x960.png",
    vintages: [{ vintage: 2019, quantity: 6, volume: 75, marketPrice: 36.00 }],
  },
  {
    name: "Les Graviers", producer: "Julien Cécillon", color: "rouge", region: "Rhône", appellation: "Saint-Joseph", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/PBxZzk2dRIKwkbEuUoqWmw_pb_x960.png",
    vintages: [{ vintage: 2023, quantity: 1, volume: 75, marketPrice: 12.00 }],
  },
  {
    name: "Le Dauphin d'Olivier", producer: "Château Olivier", color: "rouge", region: "Bordeaux", appellation: "Pessac-Léognan", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/ypbM0w-bSFKcUXipRfhv1g_pb_x960.png",
    vintages: [{ vintage: 2014, quantity: 1, volume: 75, marketPrice: 16.80 }],
  },
  {
    name: "Lions de Batailley", producer: "Château Batailley", color: "rouge", region: "Bordeaux", appellation: "Pauillac", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/ADR3c7WMS42Q6YZLE3kf2Q_pb_x960.png",
    vintages: [{ vintage: 2020, quantity: 1, volume: 75, marketPrice: 48.00 }],
  },
  {
    name: "Moulin du Château La Lagune", producer: "Château La Lagune", color: "rouge", region: "Bordeaux", appellation: "Haut-Médoc", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/vKlXUK1MRb2QPuE2WHmwWA_pb_x960.png",
    vintages: [{ vintage: 2019, quantity: 2, volume: 75, marketPrice: 24.60 }],
  },
  {
    name: "Grande Sélection", producer: "Château Penin", color: "rouge", region: "Bordeaux", appellation: "Bordeaux Supérieur", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/w1LztGM_TG6teP3URZu8rA_pb_x960.png",
    vintages: [{ vintage: 2020, quantity: 6, volume: 75 }],
  },
  {
    name: "Cynarah", producer: "Château de Cazeneuve", color: "rouge", region: "Languedoc", appellation: "Pic Saint Loup", country: "France",
    vintages: [{ vintage: 2023, quantity: 1, volume: 75, marketPrice: 14.40 }],
  },
  {
    name: "Pessac-Léognan Blanc", producer: "Château de Rochemorin", color: "blanc", region: "Bordeaux", appellation: "Pessac-Léognan", country: "France",
    vintages: [{ vintage: 2020, quantity: 3, volume: 75, marketPrice: 20.40 }],
  },
  {
    name: "Verso", producer: "Château Haut-Batailley", color: "rouge", region: "Bordeaux", appellation: "Pauillac", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/tPDhEwk7QQ6vxfpc4XMd3A_pb_x960.png",
    vintages: [{ vintage: 2019, quantity: 3, volume: 75, marketPrice: 28.80 }],
  },
  {
    name: "Tertre Les Hauts Du Tertre", producer: "Château du Tertre", color: "rouge", region: "Bordeaux", appellation: "Margaux", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/E8XwgQx0TyeeXGo38_xNZQ_pb_x960.png",
    vintages: [{ vintage: 2019, quantity: 4, volume: 75, marketPrice: 25.20 }],
  },
  {
    name: "Graves Blanc", producer: "Château Carbon d'Artigues", color: "blanc", region: "Bordeaux", appellation: "Graves", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/iOe4KzRdTJaj9DfJQ4yW5Q_pb_x960.png",
    vintages: [{ vintage: 2024, quantity: 6, volume: 75, marketPrice: 16.80 }],
  },
  {
    name: "Bordeaux", producer: "Château l'Orial", color: "rouge", region: "Bordeaux", appellation: "Bordeaux", country: "France",
    vintages: [{ vintage: 2020, quantity: 1, volume: 75, purchasePrice: 0 }],
  },
  {
    name: "Château du Glana", producer: "Château du Glana", color: "rouge", region: "Bordeaux", appellation: "Saint-Julien", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/McOqUugtRdWLZpLoNtU0sw_pb_x960.png",
    vintages: [{ vintage: 2017, quantity: 1, volume: 75, marketPrice: 27.60 }],
  },
  {
    name: "La Sirène de Giscours", producer: "Château Giscours", color: "rouge", region: "Bordeaux", appellation: "Margaux", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/EcRoFzpiRZyeyYTZQEhvKA_pb_x960.png",
    vintages: [{ vintage: 2017, quantity: 1, volume: 75, marketPrice: 34.80 }],
  },
  {
    name: "Saint-Julien", producer: "Château Gloria", color: "rouge", region: "Bordeaux", appellation: "Saint-Julien", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/6KT2awLuSQW-BQIvA8hOrg_pb_x960.png",
    vintages: [{ vintage: 2012, quantity: 2, volume: 75, marketPrice: 56.40 }],
  },
  {
    name: "L'appel Des Sereines", producer: "François Villard", color: "blanc", region: "Rhône", appellation: "Condrieu", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/fLZoTrB_T6-JlQew-QUqAw_pb_x960.png",
    vintages: [{ vintage: 2022, quantity: 1, volume: 75, marketPrice: 13.20 }],
  },
  {
    name: "Puisseguin-Saint-Émilion", producer: "Château Soleil", color: "rouge", region: "Bordeaux", appellation: "Puisseguin-Saint-Émilion", country: "France",
    imageUrl: "https://images.vivino.com/thumbs/fJ5VGBUCTxugqAuku11fUg_pb_x960.png",
    vintages: [{ vintage: 2015, quantity: 3, volume: 75, marketPrice: 28.45 }],
  },
];

async function main() {
  await prisma.rack.upsert({
    where: { id: "default-rack" },
    update: {},
    create: { id: "default-rack", name: "Cave principale", rows: 8, cols: 12 },
  });

  let created = 0;
  let updated = 0;

  for (const entry of wines) {
    const { vintages: vintageData, ...wineFields } = entry;
    const existing = await prisma.wine.findFirst({
      where: { name: wineFields.name, producer: wineFields.producer },
      include: { vintages: true },
    });

    if (existing) {
      // Update wine-level fields, preserve imageUrl if already set
      await prisma.wine.update({
        where: { id: existing.id },
        data: {
          ...wineFields,
          imageUrl: existing.imageUrl ?? wineFields.imageUrl ?? null,
        },
      });

      // Upsert each vintage (by vintage year)
      for (const v of vintageData) {
        const existingVintage = existing.vintages.find(
          (ev) => ev.vintage === (v.vintage ?? null)
        );
        if (existingVintage) {
          // Update non-rack fields, keep rack positions
          const vAny = v as Record<string, unknown>;
          await prisma.wineVintage.update({
            where: { id: existingVintage.id },
            data: {
              quantity: v.quantity,
              volume: v.volume ?? 75,
              ...(vAny.purchasePrice !== undefined ? { purchasePrice: vAny.purchasePrice as number } : {}),
              ...(vAny.marketPrice !== undefined ? { marketPrice: vAny.marketPrice as number } : {}),
            },
          });
        } else {
          await prisma.wineVintage.create({
            data: { wineId: existing.id, ...v },
          });
        }
      }
      updated++;
    } else {
      await prisma.wine.create({
        data: {
          ...wineFields,
          vintages: { create: vintageData },
        },
      });
      created++;
    }
  }

  console.log(`Seed complete: ${created} created, ${updated} updated`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
