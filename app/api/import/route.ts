import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeWineImageUrl } from "@/lib/wine-images";

interface ExportData {
  version: number;
  wines: Record<string, unknown>[];
  wineVintages: Record<string, unknown>[];
  wineVintageSlots: Record<string, unknown>[];
  racks: Record<string, unknown>[];
  wineHistory: Record<string, unknown>[];
}

function normalizeImportedRecord(record: Record<string, unknown>) {
  if (typeof record.imageUrl !== "string") {
    return record;
  }

  return {
    ...record,
    imageUrl: normalizeWineImageUrl(record.imageUrl),
  };
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

  try {
    await prisma.$transaction(async (tx) => {
      // Delete in reverse dependency order
      await tx.wineVintageSlot.deleteMany();
      await tx.wineVintage.deleteMany();
      await tx.wine.deleteMany();
      await tx.rack.deleteMany();
      await tx.wineHistory.deleteMany();

      // Re-insert in dependency order
      for (const rack of data.racks ?? []) {
        await tx.rack.create({ data: rack as Parameters<typeof tx.rack.create>[0]["data"] });
      }
      for (const wine of data.wines ?? []) {
        await tx.wine.create({ data: normalizeImportedRecord(wine) as Parameters<typeof tx.wine.create>[0]["data"] });
      }
      for (const vintage of data.wineVintages ?? []) {
        await tx.wineVintage.create({ data: vintage as Parameters<typeof tx.wineVintage.create>[0]["data"] });
      }
      const seenPositions = new Set<string>();
      for (const slot of data.wineVintageSlots ?? []) {
        const record = slot as { rackId?: unknown; rackRow?: unknown; rackCol?: unknown };
        const positionKey = `${record.rackId}|${record.rackRow}|${record.rackCol}`;
        // Un emplacement physique ne peut contenir qu'un seul slot : on ignore les
        // doublons d'un ancien export (ils fausseraient la contrainte d'unicité).
        if (seenPositions.has(positionKey)) continue;
        seenPositions.add(positionKey);
        await tx.wineVintageSlot.create({ data: slot as Parameters<typeof tx.wineVintageSlot.create>[0]["data"] });
      }
      for (const entry of (data.wineHistory ?? [])) {
        await tx.wineHistory.create({ data: normalizeImportedRecord(entry) as Parameters<typeof tx.wineHistory.create>[0]["data"] });
      }
    });
  } catch (err) {
    console.error("Import transaction failed:", err);
    return NextResponse.json({ error: "Erreur lors de la transaction : " + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    imported: {
      wines: (data.wines ?? []).length,
      vintages: (data.wineVintages ?? []).length,
      slots: (data.wineVintageSlots ?? []).length,
      racks: (data.racks ?? []).length,
      history: (data.wineHistory ?? []).length,
    },
  });
}
