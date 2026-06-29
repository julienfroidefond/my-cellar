import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function downloadExternalImage(imageUrl: string, wineId: string): Promise<string> {
  if (!imageUrl || !imageUrl.startsWith("http")) return imageUrl;

  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MyCellar/1.0)" },
    });
    if (!res.ok) return imageUrl;

    const contentType = res.headers.get("content-type") ?? "";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const filename = `${wineId}.${ext}`;
    const dir = join(process.cwd(), "public", "wines");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), Buffer.from(await res.arrayBuffer()));

    return `/wines/${filename}`;
  } catch {
    return imageUrl;
  }
}
