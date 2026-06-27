import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/wines/[id]/unrack — retire une bouteille du casier, elle passe en "À ranger"
// quantity > 1 : split (source quantity-1 garde sa position, nouveau record qty=1 non rangé)
// quantity = 1 : simple désassociation du casier
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (wine.quantity <= 1) {
    // Dernière bouteille : elle passe en "À ranger"
    await prisma.wine.update({
      where: { id },
      data: { rackId: null, rackRow: null, rackCol: null },
    });
  } else {
    // Split : les bouteilles restantes gardent leur emplacement exact
    await prisma.$transaction([
      prisma.wine.update({
        where: { id },
        data: { quantity: { decrement: 1 } },
      }),
      prisma.wine.create({
        data: {
          name:           wine.name,
          producer:       wine.producer,
          vintage:        wine.vintage,
          quantity:       1,
          volume:         wine.volume,
          color:          wine.color,
          region:         wine.region,
          appellation:    wine.appellation,
          grapeVarieties: wine.grapeVarieties,
          country:        wine.country,
          purchasePrice:  wine.purchasePrice,
          marketPrice:    wine.marketPrice,
          notes:          wine.notes,
          drinkFrom:      wine.drinkFrom,
          drinkUntil:     wine.drinkUntil,
          rackId:         null,
          rackRow:        null,
          rackCol:        null,
        },
      }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
