import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/wines/[id]/unrack — [id] = WineVintageSlot.id
// Decrements slot.quantity by 1. Deletes slot if quantity reaches 0.
// Does NOT change vintage.quantity (bottle goes back to unracked inventory).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const slot = await prisma.wineVintageSlot.findUnique({ where: { id } });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (slot.quantity <= 1) {
    await prisma.wineVintageSlot.delete({ where: { id } });
  } else {
    await prisma.wineVintageSlot.update({
      where: { id },
      data: { quantity: { decrement: 1 } },
    });
  }

  return NextResponse.json({ ok: true });
}
