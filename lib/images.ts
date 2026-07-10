import { mkdir, writeFile } from "fs/promises";
import { WINE_IMAGES_DIR, getWineImagePath, getWineImageUrl } from "@/lib/wine-images";

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
    await mkdir(WINE_IMAGES_DIR, { recursive: true });
    await writeFile(getWineImagePath(filename), Buffer.from(await res.arrayBuffer()));

    return getWineImageUrl(filename);
  } catch {
    return imageUrl;
  }
}
