import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join, extname } from "path";
import { removeBackground } from "@imgly/background-removal-node";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// POST /api/wines/remove-background — détoure automatiquement l'image d'un vin
// body JSON: { id: string, imageUrl: string }
export async function POST(req: NextRequest) {
  let id: string, imageUrl: string;
  try {
    ({ id, imageUrl } = await req.json());
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!id || !imageUrl) {
    return NextResponse.json({ error: "id and imageUrl required" }, { status: 400 });
  }

  let bytes: ArrayBuffer;
  let mimeType: string;

  try {
    if (imageUrl.startsWith("/")) {
      const filePath = join(process.cwd(), "public", imageUrl);
      const buffer = await readFile(filePath);
      bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      mimeType = MIME_BY_EXT[extname(filePath).toLowerCase()] ?? "image/jpeg";
    } else {
      const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        return NextResponse.json({ error: `Impossible de récupérer l'image (${res.status})` }, { status: 400 });
      }
      bytes = await res.arrayBuffer();
      mimeType = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur lors du chargement de l'image : ${msg}` }, { status: 400 });
  }

  let blob: Blob;
  try {
    blob = await removeBackground(new Blob([bytes], { type: mimeType }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("removeBackground failed:", err);
    return NextResponse.json({ error: `Détourage échoué : ${msg}` }, { status: 500 });
  }

  try {
    const buffer = Buffer.from(await blob.arrayBuffer());
    const name = `${id}-cutout.png`;
    await writeFile(join(process.cwd(), "public", "wines", name), buffer);
    return NextResponse.json({ url: `/wines/${name}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur lors de la sauvegarde : ${msg}` }, { status: 500 });
  }
}
