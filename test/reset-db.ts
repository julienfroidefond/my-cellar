/** Vide toutes les tables en respectant l'ordre des dépendances. */
export async function resetDatabase() {
  const { prisma } = await import("@/lib/db");
  await prisma.wineVintageSlot.deleteMany();
  await prisma.wineVintage.deleteMany();
  await prisma.wine.deleteMany();
  await prisma.rack.deleteMany();
  await prisma.wineHistory.deleteMany();
  await prisma.apiToken.deleteMany();
}
