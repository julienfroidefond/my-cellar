import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_PAGES = 3;
const PAGE_SIZE = 6;
const MAX_TOTAL = MAX_PAGES * PAGE_SIZE; // 18

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0"));
  const take = Math.min(PAGE_SIZE, Math.max(1, parseInt(searchParams.get("take") ?? String(PAGE_SIZE))));

  const where = { marketPrice: { not: null } };

  const [wines, rawTotal] = await Promise.all([
    prisma.wine.findMany({
      where,
      orderBy: { marketPrice: "desc" },
      skip,
      take,
    }),
    prisma.wine.count({ where }),
  ]);

  return NextResponse.json({ wines, total: Math.min(rawTotal, MAX_TOTAL) });
}
