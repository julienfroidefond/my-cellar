import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/wines/[id]/remove — [id] = WineVintage.id
// Decrements vintage.quantity by 1 and logs action "retiré" in history.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const vintage = await prisma.wineVintage.findUnique({
    where: { id },
    include: { wine: true },
  });

  if (!vintage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newQuantity = Math.max(0, vintage.quantity - 1);

  await prisma.$transaction([
    prisma.wineVintage.update({ where: { id }, data: { quantity: newQuantity } }),
    prisma.wineHistory.create({
      data: {
        action: "retiré",
        wineName: vintage.wine.name,
        producer: vintage.wine.producer,
        vintage: vintage.vintage,
        color: vintage.wine.color,
        appellation: vintage.wine.appellation,
        region: vintage.wine.region,
        quantity: 1,
        imageUrl: vintage.wine.imageUrl,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
