import { beforeEach, describe, expect, it, vi } from "vitest";
import { mkdir, writeFile } from "fs/promises";

vi.mock("fs/promises", () => ({ mkdir: vi.fn(), writeFile: vi.fn() }));

import { downloadExternalImage } from "./images";
import { WINE_IMAGES_DIR, getWineImagePath } from "./wine-images";

const mkdirMock = vi.mocked(mkdir);
const writeFileMock = vi.mocked(writeFile);
const fetchMock = vi.fn();

/** Réponse fetch minimale pour une image téléchargeable. */
function imageResponse(contentType: string | null) {
  return {
    ok: true,
    headers: { get: (header: string) => (header.toLowerCase() === "content-type" ? contentType : null) },
    arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
  } as unknown as Response;
}

describe("downloadExternalImage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    mkdirMock.mockReset();
    writeFileMock.mockReset();
  });

  it("renvoie tel quel ce qui n'est pas une URL http", async () => {
    expect(await downloadExternalImage("/wines/abc.jpg", "w1")).toBe("/wines/abc.jpg");
    expect(await downloadExternalImage("", "w1")).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renvoie l'URL d'origine quand le téléchargement échoue", async () => {
    fetchMock.mockResolvedValue({ ok: false } as Response);

    expect(await downloadExternalImage("https://exemple.com/abc.jpg", "w1")).toBe(
      "https://exemple.com/abc.jpg",
    );
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("télécharge un PNG et renvoie son URL servie", async () => {
    fetchMock.mockResolvedValue(imageResponse("image/png"));

    expect(await downloadExternalImage("https://exemple.com/abc", "w1")).toBe("/wine-images/w1.png");
    expect(mkdirMock).toHaveBeenCalledWith(WINE_IMAGES_DIR, { recursive: true });
    expect(writeFileMock).toHaveBeenCalledWith(getWineImagePath("w1.png"), expect.any(Buffer));
  });

  it("utilise l'extension .jpg pour les autres types d'image", async () => {
    fetchMock.mockResolvedValue(imageResponse("image/jpeg"));
    expect(await downloadExternalImage("https://exemple.com/abc", "w2")).toBe("/wine-images/w2.jpg");
  });

  it("retombe sur .jpg quand le content-type est absent", async () => {
    fetchMock.mockResolvedValue(imageResponse(null));
    expect(await downloadExternalImage("https://exemple.com/abc", "w3")).toBe("/wine-images/w3.jpg");
  });

  it("renvoie l'URL d'origine quand la requête lève", async () => {
    fetchMock.mockRejectedValue(new Error("réseau indisponible"));

    expect(await downloadExternalImage("https://exemple.com/abc", "w4")).toBe("https://exemple.com/abc");
  });

  it("renvoie l'URL d'origine quand l'écriture du fichier échoue", async () => {
    fetchMock.mockResolvedValue(imageResponse("image/png"));
    writeFileMock.mockRejectedValue(new Error("disque plein"));

    expect(await downloadExternalImage("https://exemple.com/abc", "w5")).toBe("https://exemple.com/abc");
  });
});
