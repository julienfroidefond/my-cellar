import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getWineImageContentType, resolveServedWineImagePath } from "@/lib/wine-images";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;

  if (slug.length === 0 || slug.some((segment) => segment === "." || segment === "..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filename = slug.join("/");
  const filePath = await resolveServedWineImagePath(filename);

  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await readFile(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": getWineImageContentType(filename),
    },
  });
}
