import { prisma } from "../lib/db";
import { downloadExternalImage } from "../lib/images";

async function main() {
  const wines = await prisma.wine.findMany({
    where: { imageUrl: { startsWith: "http" } },
    select: { id: true, name: true, imageUrl: true },
  });

  console.log(`${wines.length} vins avec image externe à migrer`);

  for (const wine of wines) {
    const localUrl = await downloadExternalImage(wine.imageUrl!, wine.id);
    if (localUrl !== wine.imageUrl) {
      await prisma.wine.update({ where: { id: wine.id }, data: { imageUrl: localUrl } });
      console.log(`✓ ${wine.name} → ${localUrl}`);
    } else {
      console.log(`✗ ${wine.name} — échec ou déjà local`);
    }
  }

  await prisma.$disconnect();
}

main();
