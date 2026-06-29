import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/db";

async function readImagesAsBase64(): Promise<Record<string, string>> {
  const dir = join(process.cwd(), "public", "wines");
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return {};
  }
  const entries = await Promise.all(
    files.map(async (filename) => {
      const buf = await readFile(join(dir, filename));
      return [filename, buf.toString("base64")] as [string, string];
    })
  );
  return Object.fromEntries(entries);
}

export async function GET() {
  const [[wines, wineVintages, wineVintageSlots, racks, wineHistory], images] = await Promise.all([
    Promise.all([
      prisma.wine.findMany(),
      prisma.wineVintage.findMany(),
      prisma.wineVintageSlot.findMany(),
      prisma.rack.findMany(),
      prisma.wineHistory.findMany(),
    ]),
    readImagesAsBase64(),
  ]);

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    wines,
    wineVintages,
    wineVintageSlots,
    racks,
    wineHistory,
    images,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cellar-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
