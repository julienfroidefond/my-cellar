import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

// POST /api/wines/upload-image — reçoit un fichier image et le stocke dans /public/wines/
// body: FormData avec un champ "file" et un champ "id" (wineId)
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const id   = form.get("id") as string | null;

  if (!file || !id) {
    return NextResponse.json({ error: "file and id required" }, { status: 400 });
  }

  const EXT_BY_MIME: Record<string, string> = {
    "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
    "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
    "image/heic": "heic", "image/heif": "heif",
  };
  const nameParts = file.name.split(".");
  const extFromName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : null;
  const extFromMime = EXT_BY_MIME[file.type.split(";")[0].toLowerCase()] ?? null;
  const ext = extFromName && extFromName.length <= 5 ? extFromName : (extFromMime ?? "jpg");
  const name = `${id}.${ext}`;
  const path = join(process.cwd(), "public", "wines", name);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path, bytes);

  return NextResponse.json({ url: `/wines/${name}` });
}
