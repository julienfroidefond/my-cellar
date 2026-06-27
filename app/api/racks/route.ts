import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const racks = await prisma.rack.findMany({
    include: {
      wines: { orderBy: { name: "asc" } },
    },
  });
  return NextResponse.json(racks);
}
