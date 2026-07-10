import { prisma } from "../lib/db";
import { normalizeWineImageUrl } from "../lib/wine-images";

async function main() {
  const wines = await prisma.wine.findMany({
    where: { imageUrl: { startsWith: "/wines/" } },
    select: { id: true, imageUrl: true },
  });

  const historyEntries = await prisma.wineHistory.findMany({
    where: { imageUrl: { startsWith: "/wines/" } },
    select: { id: true, imageUrl: true },
  });

  for (const wine of wines) {
    await prisma.wine.update({
      where: { id: wine.id },
      data: { imageUrl: normalizeWineImageUrl(wine.imageUrl) },
    });
  }

  for (const entry of historyEntries) {
    await prisma.wineHistory.update({
      where: { id: entry.id },
      data: { imageUrl: normalizeWineImageUrl(entry.imageUrl) },
    });
  }

  console.log(`Migrated ${wines.length} wine image URLs and ${historyEntries.length} history image URLs.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
