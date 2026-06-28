import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({ where: { id }, include: { rack: true } });
  if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(wine);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const original = await prisma.wine.findUnique({ where: { id } });
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wine = await prisma.wine.update({ where: { id }, data: body });

  // Propagate descriptive fields to sibling records (same producer + vintage)
  // but not rack positions or per-bottle quantity
  if (original.producer !== null && original.vintage !== null) {
    const { quantity: _q, rackId: _r, rackRow: _rr, rackCol: _rc, ...sharedFields } = body;
    await prisma.wine.updateMany({
      where: {
        id: { not: id },
        producer: original.producer,
        vintage: original.vintage,
      },
      data: sharedFields,
    });
  }

  return NextResponse.json(wine);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.wineHistory.create({
      data: {
        action: "retiré",
        wineName: wine.name,
        producer: wine.producer,
        vintage: wine.vintage,
        color: wine.color,
        appellation: wine.appellation,
        region: wine.region,
        quantity: wine.quantity,
        imageUrl: wine.imageUrl,
      },
    }),
    prisma.wine.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
