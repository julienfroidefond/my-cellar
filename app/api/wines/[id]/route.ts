import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { downloadExternalImage } from "@/lib/images";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({
    where: { id },
    include: { vintages: { orderBy: { vintage: "desc" } } },
  });
  if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(wine);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.wine.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, producer, color, region, appellation, grapeVarieties, country, notes, imageUrl } =
    body;

  const resolvedImageUrl = imageUrl ? await downloadExternalImage(imageUrl, id) : imageUrl;

  const wine = await prisma.wine.update({
    where: { id },
    data: { name, producer, color, region, appellation, grapeVarieties, country, notes, imageUrl: resolvedImageUrl },
    include: { vintages: { orderBy: { vintage: "desc" } } },
  });

  return NextResponse.json(wine);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({
    where: { id },
    include: { vintages: true },
  });
  if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const historyRecords = wine.vintages
    .filter((v) => v.quantity > 0)
    .map((v) =>
      prisma.wineHistory.create({
        data: {
          action: "retiré",
          wineName: wine.name,
          producer: wine.producer,
          vintage: v.vintage,
          color: wine.color,
          appellation: wine.appellation,
          region: wine.region,
          country: wine.country,
          volume: v.volume,
          quantity: v.quantity,
          imageUrl: wine.imageUrl,
        },
      })
    );

  await prisma.$transaction([...historyRecords, prisma.wine.delete({ where: { id } })]);

  return NextResponse.json({ success: true });
}
