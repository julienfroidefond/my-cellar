import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/wines/[id]/drink — [id] = WineVintage.id
// body: { slotId? } — when called from cave, slotId is the WineVintageSlot.id to decrement
// Decrements vintage.quantity by 1.
// If slotId is provided: decrements slot.quantity by 1 (deletes slot if it reaches 0).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const slotId = (body as Record<string, unknown>).slotId as string | undefined;
  const rating = (body as Record<string, unknown>).rating as number | null | undefined;

  const vintage = await prisma.wineVintage.findUnique({
    where: { id },
    include: { wine: true },
  });

  if (!vintage) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newQuantity = Math.max(0, vintage.quantity - 1);

  await prisma.$transaction(async (tx) => {
    await tx.wineVintage.update({ where: { id }, data: { quantity: newQuantity } });

    // Si aucun slot n'est fourni (ex. « Boire » depuis la fiche vin), on retire
    // quand même un emplacement pour préserver l'invariant « rangé <= stock ».
    let effectiveSlotId = slotId;
    if (!effectiveSlotId) {
      const firstSlot = await tx.wineVintageSlot.findFirst({
        where: { vintageId: id },
        select: { id: true },
      });
      effectiveSlotId = firstSlot?.id;
    }

    if (effectiveSlotId) {
      const slot = await tx.wineVintageSlot.findUnique({ where: { id: effectiveSlotId } });
      if (slot) {
        if (slot.quantity <= 1) {
          await tx.wineVintageSlot.delete({ where: { id: effectiveSlotId } });
        } else {
          await tx.wineVintageSlot.update({
            where: { id: effectiveSlotId },
            data: { quantity: { decrement: 1 } },
          });
        }
      }
    }

    await tx.wineHistory.create({
      data: {
        action: "bu",
        wineName: vintage.wine.name,
        producer: vintage.wine.producer,
        vintage: vintage.vintage,
        color: vintage.wine.color,
        appellation: vintage.wine.appellation,
        region: vintage.wine.region,
        quantity: 1,
        rating: rating ?? null,
        imageUrl: vintage.wine.imageUrl,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
