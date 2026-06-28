import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const vintage: number | null = typeof body.vintage === "number" ? body.vintage : null;

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
      data: { quantity: { increment: 1 } },
    });
  } else {
    await prisma.wineVintage.create({
      data: {
        wineId: id,
        vintage,
        quantity: 1,
      },
    });
  }

  const updatedWine = await prisma.wine.findUnique({
    where: { id },
    include: { vintages: true },
  });

  return NextResponse.json(updatedWine);
}
