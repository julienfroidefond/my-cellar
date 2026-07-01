import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateApiToken, hashApiToken } from "@/lib/api-token";

export async function GET() {
  const existing = await prisma.apiToken.findFirst({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    exists: !!existing,
    createdAt: existing?.createdAt ?? null,
    lastUsedAt: existing?.lastUsedAt ?? null,
  });
}

// POST — génère un nouveau token, invalide l'ancien. Le token en clair
// n'est renvoyé qu'ici, une seule fois : seul le hash est conservé.
export async function POST() {
  const token = generateApiToken();
  const tokenHash = hashApiToken(token);

  await prisma.apiToken.deleteMany({});
  const created = await prisma.apiToken.create({ data: { tokenHash } });

  return NextResponse.json({ token, createdAt: created.createdAt });
}

export async function DELETE() {
  await prisma.apiToken.deleteMany({});
  return NextResponse.json({ ok: true });
}
