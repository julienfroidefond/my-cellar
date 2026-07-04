// Runs in a child process — if onnxruntime crashes, only this process dies.
// Input (stdin): JSON { imageBase64: string, mimeType: string }
// Output (stdout): JSON { ok: true, base64: string } | { ok: false, error: string }
import { removeBackground } from "@imgly/background-removal-node";

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", async () => {
  try {
    const { imageBase64, mimeType } = JSON.parse(raw);
    const bytes = Buffer.from(imageBase64, "base64");
    const blob = await removeBackground(new Blob([bytes], { type: mimeType }));
    const out = Buffer.from(await blob.arrayBuffer()).toString("base64");
    process.stdout.write(JSON.stringify({ ok: true, base64: out }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
    process.exit(1);
  }
});
