import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [wines, wineVintages, wineVintageSlots, racks, wineHistory] = await Promise.all([
    prisma.wine.findMany(),
    prisma.wineVintage.findMany(),
    prisma.wineVintageSlot.findMany(),
    prisma.rack.findMany(),
    prisma.wineHistory.findMany(),
  ]);

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    wines,
    wineVintages,
    wineVintageSlots,
    racks,
    wineHistory,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cellar-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
