import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { getWineImagePath, WINE_IMAGES_DIR } from "@/lib/wine-images";

export async function POST(req: NextRequest) {
  let body: { images?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const images = body.images;
  if (!images || typeof images !== "object") {
    return NextResponse.json({ error: "Champ images manquant" }, { status: 400 });
  }

  await mkdir(WINE_IMAGES_DIR, { recursive: true });

  const errors: string[] = [];
  let count = 0;

  await Promise.all(
    Object.entries(images).map(async ([filename, b64]) => {
      try {
        await writeFile(getWineImagePath(filename), Buffer.from(b64, "base64"));
        count++;
      } catch (err) {
        errors.push(`${filename}: ${err instanceof Error ? err.message : String(err)}`);
      }
    })
  );

  return NextResponse.json({ ok: true, images: count, errors });
}
