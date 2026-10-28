import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Toutes les routes d'images écrivent dans `public/wines`. On redirige ce
 * dossier vers un répertoire temporaire pour ne jamais toucher au dépôt.
 */
const IMAGES_DIR = join(tmpdir(), "my-cellar-images-test");
const LEGACY_DIR = join(IMAGES_DIR, "legacy");

vi.mock("@/lib/wine-images", () => {
  const CONTENT_TYPES: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };

  return {
    WINE_IMAGES_DIR: IMAGES_DIR,
    LEGACY_WINE_IMAGES_DIR: LEGACY_DIR,
    WINE_IMAGES_URL_PREFIX: "/wine-images",
    getWineImageUrl: (filename: string) => `/wine-images/${filename}`,
    getWineImagePath: (filename: string) => `${IMAGES_DIR}/${filename}`,
    getLegacyWineImagePath: (filename: string) => `${LEGACY_DIR}/${filename}`,
    resolveServedWineImagePath: async (filename: string) => {
      for (const candidate of [`${IMAGES_DIR}/${filename}`, `${LEGACY_DIR}/${filename}`]) {
        if (existsSync(candidate)) return candidate;
      }
      return null;
    },
    getWineImageContentType: (filename: string) => {
      const ext = filename.split(".").pop()?.toLowerCase() ?? "";
      return CONTENT_TYPES[ext] ?? "application/octet-stream";
    },
    normalizeWineImageUrl: (imageUrl: string | null | undefined) => imageUrl ?? null,
  };
});

/**
 * Le détourage réel tourne dans un process enfant (onnxruntime). On simule ce
 * worker pour tester le protocole d'échange sans charger de modèle.
 */
const worker = vi.hoisted(() => ({
  stdout: "",
  stderr: "",
  exitCode: 0 as number | null,
  signal: null as string | null,
  spawnError: "",
  stdinPayload: "",
  spawns: 0,
}));

vi.mock("child_process", async () => {
  const { EventEmitter: EmitterClass } = await import("node:events");

  const createChild = () => {
    type Emitter = InstanceType<typeof EmitterClass>;
    const child = new EmitterClass() as Emitter & {
      stdout: Emitter;
      stderr: Emitter;
      stdin: { write: (chunk: string) => void; end: () => void };
      kill: () => void;
    };
    child.stdout = new EmitterClass();
    child.stderr = new EmitterClass();
    child.stdin = {
      write: (chunk: string) => {
        worker.stdinPayload += chunk;
      },
      end: () => {
        setImmediate(() => {
          if (worker.spawnError) {
            child.emit("error", new Error(worker.spawnError));
            return;
          }
          if (worker.stdout) child.stdout.emit("data", Buffer.from(worker.stdout));
          if (worker.stderr) child.stderr.emit("data", Buffer.from(worker.stderr));
          child.emit("close", worker.exitCode, worker.signal);
        });
      },
    };
    child.kill = () => {};
    return child;
  };

  return {
    spawn: () => {
      worker.spawns++;
      return createChild();
    },
  };
});

const { POST: UPLOAD_IMAGE } = await import("@/app/api/wines/upload-image/route");
const { POST: REMOVE_BACKGROUND } = await import("@/app/api/wines/remove-background/route");
const { POST: IMPORT_IMAGES } = await import("@/app/api/import/images/route");
const { GET: SERVE_WINE_IMAGE } = await import("@/app/wine-images/[...slug]/route");

const jsonRequest = (body: unknown) =>
  new NextRequest("http://test/api/images", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

const rawRequest = (body: string) =>
  new NextRequest("http://test/api/images", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });

const formRequest = (entries: Record<string, string | File>) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) form.set(key, value);
  return new NextRequest("http://test/api/wines/upload-image", { method: "POST", body: form });
};

const serveRequest = (slug: string[]) =>
  SERVE_WINE_IMAGE(new Request("http://test/wine-images"), { params: Promise.resolve({ slug }) });

/** Le worker répond normalement avec un PNG détouré encodé en base64. */
const CUTOUT = Buffer.from("png-detoure");

beforeEach(() => {
  rmSync(IMAGES_DIR, { recursive: true, force: true });
  mkdirSync(IMAGES_DIR, { recursive: true });

  worker.stdout = JSON.stringify({ ok: true, base64: CUTOUT.toString("base64") });
  worker.stderr = "";
  worker.exitCode = 0;
  worker.signal = null;
  worker.spawnError = "";
  worker.stdinPayload = "";
  worker.spawns = 0;

  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/wines/upload-image", () => {
  it("exige un fichier et un identifiant", async () => {
    const res = await UPLOAD_IMAGE(formRequest({ id: "w1" }));
    expect(res.status).toBe(400);
  });

  it("enregistre le fichier sous l'extension de son nom", async () => {
    const file = new File([CUTOUT], "bouteille.png", { type: "image/png" });
    const res = await UPLOAD_IMAGE(formRequest({ id: "w1", file }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "/wine-images/w1.png" });
    expect(readFileSync(`${IMAGES_DIR}/w1.png`)).toEqual(CUTOUT);
  });

  it("déduit l'extension du type MIME quand le nom n'en a pas", async () => {
    const file = new File([CUTOUT], "photo", { type: "image/webp" });
    const res = await UPLOAD_IMAGE(formRequest({ id: "w2", file }));

    expect(await res.json()).toEqual({ url: "/wine-images/w2.webp" });
  });

  it("retombe sur jpg quand ni le nom ni le type ne donnent d'extension", async () => {
    const file = new File([CUTOUT], "photo", { type: "application/octet-stream" });
    const res = await UPLOAD_IMAGE(formRequest({ id: "w3", file }));

    expect(await res.json()).toEqual({ url: "/wine-images/w3.jpg" });
  });

  it("ignore une extension de nom invraisemblable", async () => {
    const file = new File([CUTOUT], "bouteille.imagejpeg", { type: "image/png" });
    const res = await UPLOAD_IMAGE(formRequest({ id: "w4", file }));

    expect(await res.json()).toEqual({ url: "/wine-images/w4.png" });
  });
});

describe("POST /api/import/images", () => {
  it("refuse un JSON invalide", async () => {
    const res = await IMPORT_IMAGES(rawRequest("{pas du json"));
    expect(res.status).toBe(400);
  });

  it("refuse un corps sans champ images", async () => {
    const res = await IMPORT_IMAGES(jsonRequest({ foo: 1 }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Champ images manquant" });
  });

  it("écrit toutes les images fournies", async () => {
    const res = await IMPORT_IMAGES(
      jsonRequest({
        images: {
          "a.png": Buffer.from("aaa").toString("base64"),
          "b.png": Buffer.from("bbb").toString("base64"),
        },
      }),
    );

    expect(await res.json()).toEqual({ ok: true, images: 2, errors: [] });
    expect(readFileSync(`${IMAGES_DIR}/a.png`).toString()).toBe("aaa");
    expect(readFileSync(`${IMAGES_DIR}/b.png`).toString()).toBe("bbb");
  });

  it("rapporte les fichiers non écrivables sans faire échouer le lot", async () => {
    const res = await IMPORT_IMAGES(
      jsonRequest({
        images: {
          "ok.png": Buffer.from("ok").toString("base64"),
          "sous-dossier/ko.png": Buffer.from("ko").toString("base64"),
        },
      }),
    );

    const body = await res.json();
    expect(body.images).toBe(1);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0]).toMatch(/^sous-dossier\/ko\.png: /);
  });
});

describe("POST /api/wines/remove-background", () => {
  it("refuse un JSON invalide", async () => {
    const res = await REMOVE_BACKGROUND(rawRequest("{pas du json"));
    expect(res.status).toBe(400);
  });

  it("exige id et imageUrl", async () => {
    const res = await REMOVE_BACKGROUND(jsonRequest({ id: "w1" }));
    expect(res.status).toBe(400);
  });

  it("renvoie 404 quand l'image locale n'existe pas", async () => {
    const res = await REMOVE_BACKGROUND(
      jsonRequest({ id: "w1", imageUrl: "/wine-images/absente.png" }),
    );
    expect(res.status).toBe(404);
    expect(worker.spawns).toBe(0);
  });

  it("détoure une image locale et enregistre le résultat", async () => {
    writeFileSync(`${IMAGES_DIR}/source.png`, Buffer.from("source"));

    const res = await REMOVE_BACKGROUND(
      jsonRequest({ id: "w1", imageUrl: "/wine-images/source.png?cache=1" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "/wine-images/w1-cutout.png" });
    expect(readFileSync(`${IMAGES_DIR}/w1-cutout.png`)).toEqual(CUTOUT);

    const payload = JSON.parse(worker.stdinPayload);
    expect(payload).toEqual({
      imageBase64: Buffer.from("source").toString("base64"),
      mimeType: "image/png",
    });
  });

  it("télécharge une image distante avant de la détourer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(CUTOUT, { headers: { "content-type": "image/jpeg; charset=binary" } })),
    );

    const res = await REMOVE_BACKGROUND(
      jsonRequest({ id: "w2", imageUrl: "https://exemple.test/vin.jpg" }),
    );

    expect(res.status).toBe(200);
    expect(JSON.parse(worker.stdinPayload)).toMatchObject({ mimeType: "image/jpeg" });
    vi.unstubAllGlobals();
  });

  it("échoue si l'image distante ne se télécharge pas", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 403 })));

    const res = await REMOVE_BACKGROUND(
      jsonRequest({ id: "w3", imageUrl: "https://exemple.test/403.jpg" }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Impossible de récupérer l'image (403)" });
    vi.unstubAllGlobals();
  });

  it("remonte un échec du worker", async () => {
    writeFileSync(`${IMAGES_DIR}/source.png`, CUTOUT);
    worker.stdout = JSON.stringify({ ok: false, error: "modèle indisponible" });

    const res = await REMOVE_BACKGROUND(
      jsonRequest({ id: "w4", imageUrl: "/wine-images/source.png" }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Détourage échoué : modèle indisponible" });
  });

  it("remonte un crash du worker", async () => {
    writeFileSync(`${IMAGES_DIR}/source.png`, CUTOUT);
    worker.stdout = "";
    worker.stderr = "onnxruntime a explosé";
    worker.exitCode = 1;

    const res = await REMOVE_BACKGROUND(
      jsonRequest({ id: "w5", imageUrl: "/wine-images/source.png" }),
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe(
      "Détourage échoué : Worker crash (exit 1) — onnxruntime a explosé",
    );
  });

  it("remonte une réponse worker illisible", async () => {
    writeFileSync(`${IMAGES_DIR}/source.png`, CUTOUT);
    worker.stdout = "pas du json";

    const res = await REMOVE_BACKGROUND(
      jsonRequest({ id: "w6", imageUrl: "/wine-images/source.png" }),
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/^Détourage échoué : Réponse worker invalide \(exit 0\)/);
  });
});

describe("GET /wine-images/[...slug]", () => {
  it("renvoie 404 sans segment", async () => {
    expect((await serveRequest([])).status).toBe(404);
  });

  it("refuse la remontée de répertoire", async () => {
    expect((await serveRequest(["..", "cellar.db"])).status).toBe(404);
  });

  it("renvoie 404 pour une image absente", async () => {
    expect((await serveRequest(["absente.png"])).status).toBe(404);
  });

  it("sert l'image avec un cache immuable et le bon type", async () => {
    writeFileSync(`${IMAGES_DIR}/bouteille.png`, CUTOUT);

    const res = await serveRequest(["bouteille.png"]);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(Buffer.from(await res.arrayBuffer())).toEqual(CUTOUT);
  });

  it("sert aussi les images de l'ancien dossier", async () => {
    mkdirSync(LEGACY_DIR, { recursive: true });
    writeFileSync(`${LEGACY_DIR}/ancienne.jpg`, CUTOUT);

    const res = await serveRequest(["ancienne.jpg"]);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
  });
});
