import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const vintages = await prisma.wineVintage.findMany({
    include: { wine: true },
  });

  const activeVintages = vintages.filter((v) => v.quantity > 0);

  const totalBottles = activeVintages.reduce((sum, v) => sum + v.quantity, 0);

  const distinctWineIds = new Set(activeVintages.map((v) => v.wineId));
  const totalWines = distinctWineIds.size;

  const totalMarketValue = activeVintages.reduce(
    (sum, v) => sum + (v.marketPrice ?? 0) * v.quantity,
    0
  );

  const byColor = activeVintages.reduce<Record<string, number>>((acc, v) => {
    const color = v.wine.color ?? "inconnu";
    acc[color] = (acc[color] ?? 0) + v.quantity;
    return acc;
  }, {});

  const byRegion = activeVintages.reduce<Record<string, number>>((acc, v) => {
    const region = v.wine.region ?? "inconnu";
    acc[region] = (acc[region] ?? 0) + v.quantity;
    return acc;
  }, {});

  const vintageyears = activeVintages
    .filter((v) => v.vintage != null)
    .map((v) => v.vintage as number);

  const oldestVintage = vintageyears.length ? Math.min(...vintageyears) : null;
  const newestVintage = vintageyears.length ? Math.max(...vintageyears) : null;

  return NextResponse.json({
    totalBottles,
    totalWines,
    totalMarketValue,
    byColor,
    byRegion,
    oldestVintage,
    newestVintage,
  });
}
