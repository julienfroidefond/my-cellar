import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const vintage: number | null = typeof body.vintage === "number" ? body.vintage : null;
  const quantity: number = typeof body.quantity === "number" ? body.quantity : 1;
  const volume: number | undefined = typeof body.volume === "number" ? body.volume : undefined;
  const purchasePrice: number | null | undefined = typeof body.purchasePrice === "number" ? body.purchasePrice : undefined;
  const marketPrice: number | null | undefined = typeof body.marketPrice === "number" ? body.marketPrice : undefined;
  const drinkFrom: number | null | undefined = typeof body.drinkFrom === "number" ? body.drinkFrom : undefined;
  const drinkUntil: number | null | undefined = typeof body.drinkUntil === "number" ? body.drinkUntil : undefined;

  const wine = await prisma.wine.findUnique({
    where: { id },
    include: { vintages: true },
  });

  if (!wine) {
    return NextResponse.json({ error: "Wine not found" }, { status: 404 });
  }

  const existingVintage = wine.vintages.find((v) => v.vintage === vintage);

  if (existingVintage) {
    await prisma.wineVintage.update({
      where: { id: existingVintage.id },
      data: { quantity: { increment: quantity } },
    });
  } else {
    await prisma.wineVintage.create({
      data: {
        wineId: id,
        vintage,
        quantity,
        ...(volume !== undefined ? { volume } : {}),
        ...(purchasePrice !== undefined ? { purchasePrice } : {}),
        ...(marketPrice !== undefined ? { marketPrice } : {}),
        ...(drinkFrom !== undefined ? { drinkFrom } : {}),
        ...(drinkUntil !== undefined ? { drinkUntil } : {}),
      },
    });
  }

  const updatedWine = await prisma.wine.findUnique({
    where: { id },
    include: { vintages: true },
  });

  return NextResponse.json(updatedWine);
}
