import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({ where: { id }, include: { rack: true } });
  if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(wine);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const wine = await prisma.wine.update({ where: { id }, data: body });
  return NextResponse.json(wine);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.wine.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
