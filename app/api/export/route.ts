import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/db";
import { LEGACY_WINE_IMAGES_DIR, WINE_IMAGES_DIR } from "@/lib/wine-images";

async function readImagesAsBase64(): Promise<Record<string, string>> {
  const images = new Map<string, string>();

  for (const dir of [WINE_IMAGES_DIR, LEGACY_WINE_IMAGES_DIR]) {
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }

    const entries = await Promise.all(
      files.map(async (filename) => {
        const buf = await readFile(join(dir, filename));
        return [filename, buf.toString("base64")] as [string, string];
      })
    );

    for (const [filename, base64] of entries) {
      if (!images.has(filename)) {
        images.set(filename, base64);
      }
    }
  }

  return Object.fromEntries(images);
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
