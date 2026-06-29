import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/db";

interface ExportData {
  version: number;
  wines: Record<string, unknown>[];
  wineVintages: Record<string, unknown>[];
  wineVintageSlots: Record<string, unknown>[];
  racks: Record<string, unknown>[];
  wineHistory: Record<string, unknown>[];
  images?: Record<string, string>;
}

export async function POST(req: NextRequest) {
  let data: ExportData;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!data.version || !Array.isArray(data.wines)) {
    return NextResponse.json({ error: "Format d'export invalide" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    // Delete in reverse dependency order
    await tx.wineVintageSlot.deleteMany();
    await tx.wineVintage.deleteMany();
    await tx.wine.deleteMany();
    await tx.rack.deleteMany();
    await tx.wineHistory.deleteMany();

    // Re-insert in dependency order
    for (const rack of data.racks) {
      await tx.rack.create({ data: rack as Parameters<typeof tx.rack.create>[0]["data"] });
    }
    for (const wine of data.wines) {
      await tx.wine.create({ data: wine as Parameters<typeof tx.wine.create>[0]["data"] });
    }
    for (const vintage of data.wineVintages) {
      await tx.wineVintage.create({ data: vintage as Parameters<typeof tx.wineVintage.create>[0]["data"] });
    }
    for (const slot of data.wineVintageSlots) {
      await tx.wineVintageSlot.create({ data: slot as Parameters<typeof tx.wineVintageSlot.create>[0]["data"] });
    }
    for (const entry of data.wineHistory) {
      await tx.wineHistory.create({ data: entry as Parameters<typeof tx.wineHistory.create>[0]["data"] });
    }
  });

  // Write images to public/wines/
  let imageCount = 0;
  if (data.images && typeof data.images === "object") {
    const dir = join(process.cwd(), "public", "wines");
    await mkdir(dir, { recursive: true });
    await Promise.all(
      Object.entries(data.images).map(async ([filename, b64]) => {
        await writeFile(join(dir, filename), Buffer.from(b64, "base64"));
        imageCount++;
      })
    );
  }

  return NextResponse.json({
    ok: true,
    imported: {
      wines: data.wines.length,
      vintages: data.wineVintages.length,
      slots: data.wineVintageSlots.length,
      racks: data.racks.length,
      history: data.wineHistory.length,
      images: imageCount,
    },
  });
}
