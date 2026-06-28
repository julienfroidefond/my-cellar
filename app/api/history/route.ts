import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const history = await prisma.wineHistory.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(history);
}
