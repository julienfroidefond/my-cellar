import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const history = await prisma.wineHistory.findMany({
    where: { action: "bu" },
    orderBy: { consumedAt: "desc" },
  });
  return NextResponse.json(history);
}
