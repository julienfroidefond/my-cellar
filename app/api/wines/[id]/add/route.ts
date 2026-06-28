import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const vintage = typeof body.vintage === "number" ? body.vintage : undefined;

  const wine = await prisma.wine.update({
    where: { id },
    data: {
      quantity: { increment: 1 },
      ...(vintage !== undefined && { vintage }),
    },
  });

  return NextResponse.json(wine);
}
