import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/wines/[id]/drink → décrémente quantity de 1 et log l'historique
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    wine.quantity <= 1
      ? prisma.wine.update({
          where: { id },
          data: { quantity: 0, rackId: null, rackRow: null, rackCol: null },
        })
      : prisma.wine.update({
          where: { id },
          data: { quantity: { decrement: 1 } },
        }),
    prisma.wineHistory.create({
      data: {
        action: "bu",
        wineName: wine.name,
        producer: wine.producer,
        vintage: wine.vintage,
        color: wine.color,
        appellation: wine.appellation,
        region: wine.region,
        quantity: 1,
        imageUrl: wine.imageUrl,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
