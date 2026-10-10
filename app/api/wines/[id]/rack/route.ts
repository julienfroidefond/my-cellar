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

  // Un emplacement physique ne peut contenir qu'un seul slot : sans ce garde-fou,
  // deux placements rapprochés créaient des doublons qui masquaient des bouteilles
  // dans la vue cave (une seule entrée était affichée par position).
  const occupied = await prisma.wineVintageSlot.findFirst({
    where: { rackId, rackRow, rackCol },
    select: { id: true },
  });
  if (occupied) {
    return NextResponse.json({ error: "Emplacement déjà occupé" }, { status: 409 });
  }

  const totalRacked = vintage.slots.reduce((s, slot) => s + slot.quantity, 0);
  const maxAddable = vintage.quantity - totalRacked;
  const toRack = Math.min(quantity ?? 1, maxAddable);

  if (toRack <= 0) {
    return NextResponse.json({ error: "No bottles available to rack" }, { status: 400 });
  }

  try {
    const slot = await prisma.wineVintageSlot.create({
      data: { vintageId: id, rackId, rackRow, rackCol, quantity: toRack },
    });

    return NextResponse.json(slot);
  } catch (err) {
    // Contrainte d'unicité (rackId, rackRow, rackCol) : course entre deux placements.
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Emplacement déjà occupé" }, { status: 409 });
    }
    throw err;
  }
}
