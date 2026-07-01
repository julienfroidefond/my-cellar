import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/history/[id] — note a bouteille rétroactivement
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const rating = (body as Record<string, unknown>).rating as number | null | undefined;

  const entry = await prisma.wineHistory.update({
    where: { id },
    data: { rating: rating ?? null },
  });

  return NextResponse.json(entry);
}
