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

  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const name = `${id}.${ext}`;
  const path = join(process.cwd(), "public", "wines", name);

  const bytes  = await file.arrayBuffer();
  await writeFile(path, Buffer.from(bytes));

  return NextResponse.json({ url: `/wines/${name}` });
}
