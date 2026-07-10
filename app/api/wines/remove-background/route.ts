import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import { extname, join } from "path";
import { spawn } from "child_process";
import { WINE_IMAGES_DIR, getWineImagePath, getWineImageUrl, resolveServedWineImagePath } from "@/lib/wine-images";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const WORKER = join(process.cwd(), "scripts/remove-bg-worker.mjs");
const TIMEOUT_MS = 120_000;

function runWorker(imageBase64: string, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WORKER], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (fn: typeof resolve | typeof reject, value: string | Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value as never);
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(reject, new Error("Timeout — détourage trop long (>2min)"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    child.on("error", (err) => {
      finish(reject, new Error(`Impossible de lancer le worker: ${err.message}`));
    });

    child.on("close", (code, signal) => {
      if (!stdout) {
        const suffix = stderr ? ` — ${stderr.slice(0, 300)}` : "";
        const reason = signal ? `signal ${signal}` : `exit ${code}`;
        finish(reject, new Error(`Worker crash (${reason})${suffix}`));
        return;
      }
      try {
        const result = JSON.parse(stdout);
        if (result.ok) finish(resolve, result.base64);
        else finish(reject, new Error(result.error));
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        const suffix = stderr ? ` — ${stderr.slice(0, 300)}` : "";
        finish(reject, new Error(`Réponse worker invalide (${signal ? `signal ${signal}` : `exit ${code}`}) — ${detail}${suffix}`));
      }
    });

    child.stdin.write(JSON.stringify({ imageBase64, mimeType }));
    child.stdin.end();
  });
}

// POST /api/wines/remove-background — détoure automatiquement l'image d'un vin
// body JSON: { id: string, imageUrl: string }
export async function POST(req: NextRequest) {
  let id: string, imageUrl: string;
  try {
    ({ id, imageUrl } = await req.json());
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!id || !imageUrl) {
    return NextResponse.json({ error: "id and imageUrl required" }, { status: 400 });
  }

  let imageBase64: string;
  let mimeType: string;

  try {
    if (imageUrl.startsWith("/")) {
      const filename = imageUrl.split("/").pop()?.split("?")[0];
      if (!filename) {
        return NextResponse.json({ error: "URL d'image locale invalide" }, { status: 400 });
      }

      const filePath = await resolveServedWineImagePath(filename);
      if (!filePath) {
        return NextResponse.json({ error: `Image introuvable sur le serveur: ${filename}` }, { status: 404 });
      }

      const buffer = await readFile(filePath);
      imageBase64 = buffer.toString("base64");
      mimeType = MIME_BY_EXT[extname(filePath).toLowerCase()] ?? "image/jpeg";
    } else {
      const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        return NextResponse.json({ error: `Impossible de récupérer l'image (${res.status})` }, { status: 400 });
      }
      imageBase64 = Buffer.from(await res.arrayBuffer()).toString("base64");
      mimeType = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur lors du chargement de l'image : ${msg}` }, { status: 400 });
  }

  let base64Result: string;
  try {
    const t0 = Date.now();
    base64Result = await runWorker(imageBase64, mimeType);
    console.log(`remove-background worker OK in ${Date.now() - t0}ms, output size=${base64Result.length}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("remove-background worker failed:", msg);
    return NextResponse.json({ error: `Détourage échoué : ${msg}` }, { status: 500 });
  }

  try {
    const buffer = Buffer.from(base64Result, "base64");
    const name = `${id}-cutout.png`;
    await mkdir(WINE_IMAGES_DIR, { recursive: true });
    await writeFile(getWineImagePath(name), buffer);
    return NextResponse.json({ url: getWineImageUrl(name) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur lors de la sauvegarde : ${msg}` }, { status: 500 });
  }
}
