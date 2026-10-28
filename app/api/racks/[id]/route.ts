import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { configFromLevels, defaultRackConfig } from "@/lib/rack-configs";
import { planRackSlotMoves, parseRackInput } from "@/lib/racks";

const levelOrder = { position: "asc" as const };

// PATCH /api/racks/[id] — renomme et/ou redimensionne un casier.
// body: { name, layout: [{ front, back }, …], unrackOverflow? }
//       ou { name, levels, cols, depth, unrackOverflow? } (ancienne forme régulière)
export async function PATCH(req: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = parseRackInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const rack = await prisma.rack.findUnique({
    where: { id },
    include: {
      levels: { orderBy: levelOrder },
      slots: { select: { id: true, rackRow: true, rackCol: true, quantity: true } },
    },
  });
  if (!rack) {
    return NextResponse.json({ error: "Casier introuvable" }, { status: 404 });
  }

  const oldConfig = rack.levels.length > 0 ? configFromLevels(rack.levels) : defaultRackConfig();
  const plan = planRackSlotMoves(oldConfig, parsed.config, rack.slots);
  const unrackOverflow = (body as { unrackOverflow?: unknown }).unrackOverflow === true;
  if (plan.overflow.length > 0 && !unrackOverflow) {
    return NextResponse.json(
      {
        error: "Des bouteilles occupent les emplacements retirés",
        overflow: plan.overflow.reduce((total, slot) => total + slot.quantity, 0),
      },
      { status: 409 },
    );
  }

  const { name, levels, cols } = parsed.value;
  const updated = await prisma.$transaction(async (tx) => {
    if (plan.overflow.length > 0) {
      await tx.wineVintageSlot.deleteMany({
        where: { id: { in: plan.overflow.map((slot) => slot.id) } },
      });
    }

    // Deux passes pour éviter les collisions avec la contrainte unique
    // [rackId, rackRow, rackCol] quand plusieurs bouteilles se déplacent.
    for (let index = 0; index < plan.moves.length; index++) {
      await tx.wineVintageSlot.update({
        where: { id: plan.moves[index].id },
        data: { rackRow: -(index + 1), rackCol: 0 },
      });
    }
    for (const move of plan.moves) {
      await tx.wineVintageSlot.update({
        where: { id: move.id },
        data: { rackRow: move.rackRow, rackCol: move.rackCol },
      });
    }

    return tx.rack.update({
      where: { id },
      data: {
        name,
        rows: levels,
        cols,
        levels: {
          deleteMany: {},
          create: parsed.config.levels.map((level, position) => ({ position, ...level })),
        },
      },
      include: { levels: { orderBy: levelOrder } },
    });
  });

  return NextResponse.json(updated);
}

// DELETE /api/racks/[id] — supprime le casier. Les bouteilles qui y étaient
// rangées repassent automatiquement « à ranger » (le stock n'est pas modifié).
export async function DELETE(_req: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;

  const rack = await prisma.rack.findUnique({
    where: { id },
    include: { slots: { select: { quantity: true } } },
  });
  if (!rack) {
    return NextResponse.json({ error: "Casier introuvable" }, { status: 404 });
  }

  const unracked = rack.slots.reduce((total, slot) => total + slot.quantity, 0);

  await prisma.$transaction(async (tx) => {
    await tx.wineVintageSlot.deleteMany({ where: { rackId: id } });
    await tx.rack.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true, unracked });
}
