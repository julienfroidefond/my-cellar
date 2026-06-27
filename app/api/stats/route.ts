import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const wines = await prisma.wine.findMany();

  const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0);
  const totalMarketValue = wines.reduce((sum, w) => sum + (w.marketPrice ?? 0) * w.quantity, 0);
  const byColor = wines.reduce<Record<string, number>>((acc, w) => {
    const color = w.color ?? "inconnu";
    acc[color] = (acc[color] ?? 0) + w.quantity;
    return acc;
  }, {});
  const byRegion = wines.reduce<Record<string, number>>((acc, w) => {
    const region = w.region ?? "inconnu";
    acc[region] = (acc[region] ?? 0) + w.quantity;
    return acc;
  }, {});

  const vintages = wines.filter((w) => w.vintage).map((w) => w.vintage!);
  const oldestVintage = vintages.length ? Math.min(...vintages) : null;
  const newestVintage = vintages.length ? Math.max(...vintages) : null;

  return NextResponse.json({
    totalBottles,
    totalWines: wines.length,
    totalMarketValue,
    byColor,
    byRegion,
    oldestVintage,
    newestVintage,
  });
}
