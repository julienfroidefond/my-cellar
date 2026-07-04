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

    // Capture original dimensions before processing
    const { width, height } = await sharp(bytes).metadata();

    const blob = await removeBackground(new Blob([bytes], { type: mimeType }));
    let outBuffer = Buffer.from(await blob.arrayBuffer());

    // Resize back to original dimensions preserving aspect ratio
    if (width && height) {
      const { width: outW, height: outH } = await sharp(outBuffer).metadata();
      if (outW !== width || outH !== height) {
        outBuffer = await sharp(outBuffer)
          .resize(width, height, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
      }
    }

    process.stdout.write(JSON.stringify({ ok: true, base64: outBuffer.toString("base64") }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
    process.exit(1);
  }
});
