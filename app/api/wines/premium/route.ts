import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_PAGES = 3;
const PAGE_SIZE = 6;
const MAX_TOTAL = MAX_PAGES * PAGE_SIZE; // 18

/** Lit un entier de query string en retombant sur une valeur sûre. */
function toInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skip = Math.max(0, toInt(searchParams.get("skip"), 0));
  const take = Math.min(PAGE_SIZE, Math.max(1, toInt(searchParams.get("take"), PAGE_SIZE)));

  // Find vintages with a market price, ordered desc, include wine info
  const vintages = await prisma.wineVintage.findMany({
    where: { marketPrice: { not: null }, quantity: { gt: 0 } },
    orderBy: { marketPrice: "desc" },
    skip,
    take,
    include: { wine: true },
  });

  const wines = vintages.map((v) => ({
    id: v.wine.id,
    name: v.wine.name,
    producer: v.wine.producer,
    vintage: v.vintage,
    color: v.wine.color,
    appellation: v.wine.appellation,
    marketPrice: v.marketPrice,
    imageUrl: v.wine.imageUrl,
  }));

  const rawTotal = await prisma.wineVintage.count({
    where: { marketPrice: { not: null }, quantity: { gt: 0 } },
  });

  return NextResponse.json({ wines, total: Math.min(rawTotal, MAX_TOTAL) });
}
