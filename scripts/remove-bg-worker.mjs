// Runs in a child process — if onnxruntime crashes, only this process dies.
// Input (stdin): JSON { imageBase64: string, mimeType: string }
// Output (stdout): JSON { ok: true, base64: string } | { ok: false, error: string }
import { removeBackground } from "@imgly/background-removal-node";
import { PNG } from "pngjs";

const ALPHA_THRESHOLD = 18;

function isWhiteBackgroundPixel(data, offset) {
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  return Math.min(red, green, blue) > 215 && Math.max(red, green, blue) - Math.min(red, green, blue) < 45;
}

function clearWhiteBackgroundConnectedToEdges(data, width, height) {
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    const index = y * width + x;
    if (visited[index]) return;
    const offset = index * 4;
    if (!isWhiteBackgroundPixel(data, offset)) return;
    visited[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const index = queue[head++];
    data[index * 4 + 3] = 0;
    const x = index % width;
    const y = Math.floor(index / width);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nextX = x + dx;
        const nextY = y + dy;
        if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) enqueue(nextX, nextY);
      }
    }
  }
}

function clearWhitePixelsOutsideBottle(data, width, height) {
  for (let y = 0; y < height; y++) {
    let leftBottlePixel = width;
    let rightBottlePixel = -1;

    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      if (data[offset + 3] > ALPHA_THRESHOLD && !isWhiteBackgroundPixel(data, offset)) {
        leftBottlePixel = Math.min(leftBottlePixel, x);
        rightBottlePixel = Math.max(rightBottlePixel, x);
      }
    }

    if (rightBottlePixel < leftBottlePixel) continue;
    for (let x = 0; x < width; x++) {
      if (x >= leftBottlePixel - 2 && x <= rightBottlePixel + 2) continue;
      const offset = (y * width + x) * 4;
      if (isWhiteBackgroundPixel(data, offset)) data[offset + 3] = 0;
    }
  }
}

function keepMainForegroundComponent(data, width, height) {
  const pixelCount = width * height;
  const component = new Int32Array(pixelCount);
  const sizes = [0];
  const queue = new Int32Array(pixelCount);
  let componentId = 0;
  let largestComponent = 0;

  for (let start = 0; start < pixelCount; start++) {
    if (component[start] || data[start * 4 + 3] <= ALPHA_THRESHOLD) continue;

    componentId++;
    let head = 0;
    let tail = 0;
    component[start] = componentId;
    queue[tail++] = start;

    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nextX = x + dx;
          const nextY = y + dy;
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
          const nextIndex = nextY * width + nextX;
          if (component[nextIndex] || data[nextIndex * 4 + 3] <= ALPHA_THRESHOLD) continue;
          component[nextIndex] = componentId;
          queue[tail++] = nextIndex;
        }
      }
    }

    sizes[componentId] = tail;
    if (sizes[componentId] > sizes[largestComponent]) largestComponent = componentId;
  }

  for (let index = 0; index < pixelCount; index++) {
    if (component[index] && component[index] !== largestComponent) data[index * 4 + 3] = 0;
  }
}

function cleanAndCropPng(buffer) {
  const source = PNG.sync.read(buffer);
  const { width, height, data } = source;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  // Only remove white that is connected to the image edge. White details inside
  // the bottle (notably labels) remain intact, unlike a global white-pixel mask.
  clearWhiteBackgroundConnectedToEdges(data, width, height);
  // The model can leave isolated white fragments outside the bottle silhouette.
  clearWhitePixelsOutsideBottle(data, width, height);
  // Keep the bottle silhouette and discard detached segmentation artefacts.
  keepMainForegroundComponent(data, width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      let alpha = data[offset + 3];
      const minimumChannel = Math.min(data[offset], data[offset + 1], data[offset + 2]);
      const maximumChannel = Math.max(data[offset], data[offset + 1], data[offset + 2]);
      const brightness = (data[offset] + data[offset + 1] + data[offset + 2]) / 3;

      // The segmentation model sometimes leaves a nearly-white translucent halo.
      // Fade it more strongly without affecting coloured or opaque bottle details.
      if (alpha < 230 && minimumChannel > 220) {
        const whiteness = (minimumChannel - 220) / 35;
        alpha = Math.round(alpha * (1 - 0.65 * whiteness));
      }
      // A white backdrop also bleeds into semi-opaque edge pixels as a pale
      // grey. Despill these pixels while leaving opaque white labels untouched.
      if (alpha < 240 && brightness > 150 && maximumChannel - minimumChannel < 35) {
        const spill = (brightness - 150) / 105;
        alpha = Math.round(alpha * (1 - 0.75 * spill));
      }
      if (alpha <= ALPHA_THRESHOLD) alpha = 0;
      data[offset + 3] = alpha;

      if (alpha > ALPHA_THRESHOLD) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  // Keep a small breathing space around the bottle instead of cropping flush.
  if (right < left || bottom < top) return buffer;
  const padding = Math.min(24, Math.max(8, Math.round(Math.min(width, height) * 0.015)));
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(width - 1, right + padding);
  bottom = Math.min(height - 1, bottom + padding);

  const croppedWidth = right - left + 1;
  const croppedHeight = bottom - top + 1;
  const cropped = new PNG({ width: croppedWidth, height: croppedHeight });
  for (let y = 0; y < croppedHeight; y++) {
    const sourceStart = ((top + y) * width + left) * 4;
    const targetStart = y * croppedWidth * 4;
    data.copy(cropped.data, targetStart, sourceStart, sourceStart + croppedWidth * 4);
  }

  return PNG.sync.write(cropped);
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", async () => {
  try {
    const { imageBase64, mimeType } = JSON.parse(raw);
    const bytes = Buffer.from(imageBase64, "base64");
    const blob = await removeBackground(new Blob([bytes], { type: mimeType || "image/png" }), {
      model: "small",
    });
    const outBuffer = cleanAndCropPng(Buffer.from(await blob.arrayBuffer()));

    process.stdout.write(JSON.stringify({ ok: true, base64: outBuffer.toString("base64") }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
    process.exit(1);
  }
});
