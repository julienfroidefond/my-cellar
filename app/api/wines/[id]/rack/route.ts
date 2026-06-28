import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/wines/[id]/rack — [id] = WineVintage.id
// body: { rackId, rackRow, rackCol, quantity? }
// Creates a new WineVintageSlot at the exact position.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { rackId, rackRow, rackCol, quantity } = await req.json();

  const vintage = await prisma.wineVintage.findUnique({
    where: { id },
    include: { slots: { select: { quantity: true } } },
  });
  if (!vintage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalRacked = vintage.slots.reduce((s, slot) => s + slot.quantity, 0);
  const maxAddable = vintage.quantity - totalRacked;
  const toRack = Math.min(quantity ?? 1, maxAddable);

  if (toRack <= 0) {
    return NextResponse.json({ error: "No bottles available to rack" }, { status: 400 });
  }

  const slot = await prisma.wineVintageSlot.create({
    data: { vintageId: id, rackId, rackRow, rackCol, quantity: toRack },
  });

  return NextResponse.json(slot);
}
