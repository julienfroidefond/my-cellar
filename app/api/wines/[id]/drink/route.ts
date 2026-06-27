import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/wines/[id]/drink → décrémente quantity de 1
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (wine.quantity <= 1) {
    await prisma.wine.update({
      where: { id },
      data: { quantity: 0, rackId: null, rackRow: null, rackCol: null },
    });
  } else {
    await prisma.wine.update({
      where: { id },
      data: { quantity: { decrement: 1 } },
    });
  }
  return NextResponse.json({ ok: true });
}
