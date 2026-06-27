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
    include: { rack: true },
  });

  return NextResponse.json(wines);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const wine = await prisma.wine.create({ data: body });
  return NextResponse.json(wine, { status: 201 });
}
