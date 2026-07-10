import { access } from "fs/promises";
import { join } from "path";

export const WINE_IMAGES_DIR = join(process.cwd(), "public", "wines");
export const LEGACY_WINE_IMAGES_DIR = join(process.cwd(), "public", "wine-images");
export const WINE_IMAGES_URL_PREFIX = "/wine-images";

const MIME_BY_EXT: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function getWineImageUrl(filename: string) {
  return `${WINE_IMAGES_URL_PREFIX}/${filename}`;
}

export function getWineImagePath(filename: string) {
  return join(WINE_IMAGES_DIR, filename);
}

export function getLegacyWineImagePath(filename: string) {
  return join(LEGACY_WINE_IMAGES_DIR, filename);
}

export async function resolveServedWineImagePath(filename: string) {
  const candidates = [getWineImagePath(filename), getLegacyWineImagePath(filename)];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

export function getWineImageContentType(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export function normalizeWineImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return imageUrl ?? null;

  const [pathname, search = ""] = imageUrl.split("?");
  if (!pathname.startsWith("/wines/")) {
    return imageUrl;
  }

  return `${WINE_IMAGES_URL_PREFIX}${pathname.slice("/wines".length)}${search ? `?${search}` : ""}`;
}
