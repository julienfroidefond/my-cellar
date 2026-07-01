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
  const { id, imageUrl } = await req.json();

  if (!id || !imageUrl) {
    return NextResponse.json({ error: "id and imageUrl required" }, { status: 400 });
  }

  let bytes: ArrayBuffer;
  let mimeType: string;

  if (imageUrl.startsWith("/")) {
    const filePath = join(process.cwd(), "public", imageUrl);
    const buffer = await readFile(filePath);
    bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    mimeType = MIME_BY_EXT[extname(filePath).toLowerCase()] ?? "image/jpeg";
  } else {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "could not fetch imageUrl" }, { status: 400 });
    }
    bytes = await res.arrayBuffer();
    mimeType = res.headers.get("content-type") ?? "image/jpeg";
  }

  const blob = await removeBackground(new Blob([bytes], { type: mimeType }));
  const buffer = Buffer.from(await blob.arrayBuffer());

  const name = `${id}-cutout.png`;
  await writeFile(join(process.cwd(), "public", "wines", name), buffer);

  return NextResponse.json({ url: `/wines/${name}` });
}
