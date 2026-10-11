import { beforeEach, describe, expect, it, vi } from "vitest";
import { access } from "fs/promises";
import { join } from "path";

vi.mock("fs/promises", () => ({ access: vi.fn() }));

import {
  LEGACY_WINE_IMAGES_DIR,
  WINE_IMAGES_DIR,
  getLegacyWineImagePath,
  getWineImageContentType,
  getWineImagePath,
  getWineImageUrl,
  normalizeWineImageUrl,
  resolveServedWineImagePath,
} from "./wine-images";

const accessMock = vi.mocked(access);

describe("getWineImageUrl / chemins", () => {
  it("préfixe les URL servies", () => {
    expect(getWineImageUrl("abc.jpg")).toBe("/wine-images/abc.jpg");
  });

  it("résout les chemins disque (actuel et legacy)", () => {
    expect(getWineImagePath("abc.jpg")).toBe(join(WINE_IMAGES_DIR, "abc.jpg"));
    expect(getLegacyWineImagePath("abc.jpg")).toBe(join(LEGACY_WINE_IMAGES_DIR, "abc.jpg"));
  });
});

describe("getWineImageContentType", () => {
  it.each([
    ["a.jpg", "image/jpeg"],
    ["a.jpeg", "image/jpeg"],
    ["a.png", "image/png"],
    ["a.webp", "image/webp"],
    ["a.avif", "image/avif"],
    ["a.gif", "image/gif"],
    ["a.heic", "image/heic"],
    ["a.heif", "image/heif"],
  ])("associe %s au bon type MIME", (filename, expected) => {
    expect(getWineImageContentType(filename)).toBe(expected);
  });

  it("ignore la casse de l'extension", () => {
    expect(getWineImageContentType("PHOTO.JPG")).toBe("image/jpeg");
  });

  it("retombe sur un type générique pour une extension inconnue ou absente", () => {
    expect(getWineImageContentType("archive.zip")).toBe("application/octet-stream");
    expect(getWineImageContentType("sans-extension")).toBe("application/octet-stream");
  });
});

describe("normalizeWineImageUrl", () => {
  it("convertit l'ancien préfixe /wines/", () => {
    expect(normalizeWineImageUrl("/wines/abc.jpg")).toBe("/wine-images/abc.jpg");
  });

  it("conserve le query string", () => {
    expect(normalizeWineImageUrl("/wines/abc.jpg?v=2")).toBe("/wine-images/abc.jpg?v=2");
  });

  it("gère les sous-dossiers", () => {
    expect(normalizeWineImageUrl("/wines/2015/abc.png")).toBe("/wine-images/2015/abc.png");
  });

  it("laisse intactes les URL déjà normalisées ou externes", () => {
    expect(normalizeWineImageUrl("/wine-images/abc.jpg")).toBe("/wine-images/abc.jpg");
    expect(normalizeWineImageUrl("https://exemple.com/abc.jpg")).toBe("https://exemple.com/abc.jpg");
    expect(normalizeWineImageUrl("/wines")).toBe("/wines");
  });

  it("renvoie null pour une valeur absente", () => {
    expect(normalizeWineImageUrl(null)).toBeNull();
    expect(normalizeWineImageUrl(undefined)).toBeNull();
    expect(normalizeWineImageUrl("")).toBe("");
  });
});

describe("resolveServedWineImagePath", () => {
  beforeEach(() => {
    accessMock.mockReset();
  });

  it("renvoie le chemin actuel quand il existe", async () => {
    accessMock.mockResolvedValue(undefined);

    expect(await resolveServedWineImagePath("abc.jpg")).toBe(getWineImagePath("abc.jpg"));
    expect(accessMock).toHaveBeenCalledTimes(1);
    expect(accessMock).toHaveBeenCalledWith(getWineImagePath("abc.jpg"));
  });

  it("bascule sur le dossier legacy si le fichier actuel est absent", async () => {
    accessMock.mockRejectedValueOnce(new Error("absent")).mockResolvedValueOnce(undefined);

    expect(await resolveServedWineImagePath("abc.jpg")).toBe(getLegacyWineImagePath("abc.jpg"));
    expect(accessMock).toHaveBeenNthCalledWith(2, getLegacyWineImagePath("abc.jpg"));
  });

  it("renvoie null si aucun candidat n'existe", async () => {
    accessMock.mockRejectedValue(new Error("absent"));

    expect(await resolveServedWineImagePath("abc.jpg")).toBeNull();
  });
});
