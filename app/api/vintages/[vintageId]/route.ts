import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ vintageId: string }> }
) {
  const { vintageId } = await params;

  const existing = await prisma.wineVintage.findUnique({
    where: { id: vintageId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Vintage not found" }, { status: 404 });
  }

  const body = await request.json();

  const allowedFields = [
    "quantity",
    "volume",
    "purchasePrice",
    "marketPrice",
    "drinkFrom",
    "drinkUntil",
    "rackId",
    "rackRow",
    "rackCol",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      data[field] = body[field];
    }
  }

  const updated = await prisma.wineVintage.update({
    where: { id: vintageId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ vintageId: string }> }
) {
  const { vintageId } = await params;

  const vintage = await prisma.wineVintage.findUnique({
    where: { id: vintageId },
    include: { wine: true },
  });

  if (!vintage) {
    return NextResponse.json({ error: "Vintage not found" }, { status: 404 });
  }

  await prisma.wineHistory.create({
    data: {
      action: "retiré",
      wineName: vintage.wine.name,
      producer: vintage.wine.producer ?? null,
      vintage: vintage.vintage ?? null,
      color: vintage.wine.color ?? null,
      appellation: vintage.wine.appellation ?? null,
      region: vintage.wine.region ?? null,
      quantity: vintage.quantity,
      imageUrl: vintage.wine.imageUrl ?? null,
    },
  });

  await prisma.wineVintage.delete({
    where: { id: vintageId },
  });

  return NextResponse.json({ success: true });
}
