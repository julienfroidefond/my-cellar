import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const color = searchParams.get("color");
  const region = searchParams.get("region");
  const search = searchParams.get("search");

  const wines = await prisma.wine.findMany({
    where: {
      ...(color ? { color } : {}),
      ...(region ? { region } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { producer: { contains: search } },
              { appellation: { contains: search } },
              { region: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      vintages: {
        include: { slots: { select: { id: true } } },
        orderBy: { vintage: "desc" },
      },
    },
  });

  return NextResponse.json(wines);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    name,
    producer,
    color,
    region,
    appellation,
    grapeVarieties,
    country,
    notes,
    imageUrl,
    vintage,
    quantity,
    volume,
    purchasePrice,
    marketPrice,
    drinkFrom,
    drinkUntil,
  } = body;

  const wine = await prisma.wine.create({
    data: {
      name,
      producer,
      color,
      region,
      appellation,
      grapeVarieties,
      country,
      notes,
      imageUrl,
      vintages: {
        create: {
          vintage: vintage ?? null,
          quantity: quantity ?? 1,
          volume: volume ?? 75,
          purchasePrice: purchasePrice ?? null,
          marketPrice: marketPrice ?? null,
          drinkFrom: drinkFrom ?? null,
          drinkUntil: drinkUntil ?? null,
        },
      },
    },
    include: {
      vintages: {
        orderBy: { vintage: "desc" },
      },
    },
  });

  return NextResponse.json(wine, { status: 201 });
}
