import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/wines/[id]/rack — place une bouteille à un emplacement précis (bouteille par bouteille)
// body: { rackId, rackRow, rackCol }
// Si quantity > 1 : split (source - 1, nouveau record qty=1 à la position choisie)
// Si quantity = 1 : simple mise à jour
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { rackId, rackRow, rackCol } = await req.json();
  if (rackId == null || rackRow == null || rackCol == null) {
    return NextResponse.json({ error: "rackId, rackRow, rackCol required" }, { status: 400 });
  }

  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (wine.quantity <= 1) {
    const updated = await prisma.wine.update({
      where: { id },
      data: { rackId, rackRow, rackCol },
    });
    return NextResponse.json(updated);
  }

  const [, created] = await prisma.$transaction([
    prisma.wine.update({
      where: { id },
      data: { quantity: { decrement: 1 } },
    }),
    prisma.wine.create({
      data: {
        name:          wine.name,
        producer:      wine.producer,
        vintage:       wine.vintage,
        quantity:      1,
        volume:        wine.volume,
        color:         wine.color,
        region:        wine.region,
        appellation:   wine.appellation,
        grapeVarieties:wine.grapeVarieties,
        country:       wine.country,
        purchasePrice: wine.purchasePrice,
        marketPrice:   wine.marketPrice,
        notes:         wine.notes,
        drinkFrom:     wine.drinkFrom,
        drinkUntil:    wine.drinkUntil,
        rackId,
        rackRow,
        rackCol,
      },
    }),
  ]);

  return NextResponse.json(created);
}
