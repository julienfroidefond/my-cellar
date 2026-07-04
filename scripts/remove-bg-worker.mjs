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

    // Add white padding around the image so the model can detect the full bottle,
    // including the base which often touches the edge and gets cut off.
    const { width, height } = await sharp(bytes).metadata();
    const pad = Math.round(Math.max(width, height) * 0.08);
    const padded = await sharp(bytes)
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 255, g: 255, b: 255 } })
      .toBuffer();

    const blob = await removeBackground(new Blob([padded], { type: "image/png" }));
    const outBuffer = Buffer.from(await blob.arrayBuffer());

    process.stdout.write(JSON.stringify({ ok: true, base64: outBuffer.toString("base64") }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
    process.exit(1);
  }
});
