import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseRackInput } from "@/lib/racks";

const levelOrder = { position: "asc" as const };

export async function GET() {
  const racks = await prisma.rack.findMany({
    include: {
      levels: { orderBy: levelOrder },
      slots: { orderBy: [{ rackRow: "asc" }, { rackCol: "asc" }] },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(racks);
}

// POST /api/racks — crée un casier et ses étagères.
// body: { name, layout: [{ front, back }, …] }
//       ou { name, levels, cols, depth } (ancienne forme régulière)
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = parseRackInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, levels, cols } = parsed.value;
  const rack = await prisma.rack.create({
    data: {
      name,
      rows: levels,
      cols,
      levels: {
        create: parsed.config.levels.map((level, position) => ({ position, ...level })),
      },
    },
    include: { levels: { orderBy: levelOrder } },
  });

  return NextResponse.json(rack, { status: 201 });
}
