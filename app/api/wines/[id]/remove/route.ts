import { NextResponse } from "next/server";
import { removeBottlesFromStock } from "@/lib/removals";

// POST /api/wines/[id]/remove — [id] = WineVintage.id
// body: { quantity?, reason?, note?, slotId? }
// reason: "offert" | "regul" | "suppression" (défaut "regul" pour compat API)
// slotId: WineVintageSlot.id à décrémenter en priorité (appel depuis la cave)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const result = await removeBottlesFromStock({
    vintageId: id,
    quantity: Number(body.quantity ?? 1),
    reason: body.reason ?? "regul",
    note: body.note,
    slotId: typeof body.slotId === "string" ? body.slotId : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
