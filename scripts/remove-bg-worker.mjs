// Runs in a child process — if onnxruntime crashes, only this process dies.
// Input (stdin): JSON { imageBase64: string, mimeType: string }
// Output (stdout): JSON { ok: true, base64: string } | { ok: false, error: string }
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", async () => {
  try {
    const { imageBase64, mimeType } = JSON.parse(raw);
    const bytes = Buffer.from(imageBase64, "base64");

    // Step 1 — crop solid background border BEFORE the model.
    // A 4800×4800 square with white bg wastes the model's resolution budget on empty space.
    // Trimming first means the model works on the bottle at full effective resolution.
    let prepped;
    try {
      prepped = await sharp(bytes).trim().toBuffer();
    } catch {
      prepped = bytes;
    }

    // Step 2 — add white padding so the model can detect the full bottle base.
    const { width, height } = await sharp(prepped).metadata();
    const pad = Math.round(Math.max(width, height) * 0.08);
    const padded = await sharp(prepped)
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 255, g: 255, b: 255 } })
      .toBuffer();

    // Step 3 — remove background.
    const blob = await removeBackground(new Blob([padded], { type: "image/png" }));
    const outBuffer = Buffer.from(await blob.arrayBuffer());

    // Step 4 — trim transparent border, add small padding back.
    const cropped = await sharp(outBuffer)
      .trim({ threshold: 0 })
      .extend({ top: 20, bottom: 60, left: 20, right: 20, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    process.stdout.write(JSON.stringify({ ok: true, base64: cropped.toString("base64") }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
    process.exit(1);
  }
});
