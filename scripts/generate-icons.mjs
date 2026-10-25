#!/usr/bin/env node
/**
 * Génère les icônes du site et de la PWA à partir de l'illustration source.
 *
 *   node scripts/generate-icons.mjs
 *
 * Sorties :
 *   app/favicon.ico              → onglet navigateur (16 / 32 / 48)
 *   app/icon.png                 → <link rel="icon"> (256)
 *   app/apple-icon.png           → <link rel="apple-touch-icon"> (180)
 *   public/icons/icon-*.png      → manifest PWA (192 / 512)
 *   public/icons/icon-maskable-* → manifest PWA, zone de sécurité maskable
 *   public/icons/logo-mark.png   → vignette de la marque dans la navigation
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "assets", "icon-source.png");

/** Illustration pleine page, telle quelle. */
function square(size, { palette = true } = {}) {
  return sharp(SOURCE)
    .resize(size, size, { fit: "cover" })
    .ensureAlpha()
    .png(
      palette
        ? { compressionLevel: 9, palette: true, quality: 92 }
        : { compressionLevel: 9 },
    );
}

/** Cadrage légèrement resserré sur la bouteille et le verre (sans rien couper). */
const MARK_CROP = { left: 130, top: 80, width: 1050, height: 1050 };

function mark(size) {
  return sharp(SOURCE)
    .extract(MARK_CROP)
    .resize(size, size)
    .ensureAlpha()
    .png({ compressionLevel: 9, palette: true, quality: 92 });
}

/**
 * Version maskable : l'illustration est réduite à 80 % de la surface pour
 * rester dans la zone de sécurité (cercle de 80 % de diamètre) des masques
 * Android/iOS. Le fond est un flou de l'image elle-même, ce qui évite une
 * bordure nette quand le masque ne rogne pas les bords.
 */
async function maskable(size) {
  const inner = Math.round(size * 0.8);
  const offset = Math.round((size - inner) / 2);

  const background = await sharp(SOURCE)
    .resize(size, size, { fit: "cover" })
    .blur(Math.max(8, Math.round(size / 24)))
    .modulate({ brightness: 0.92 })
    .toBuffer();

  const foreground = await square(inner).toBuffer();

  return sharp(background)
    .composite([{ input: foreground, top: offset, left: offset }])
    .png({ compressionLevel: 9 });
}

/** Construit un .ico contenant des PNG (supporté par tous les navigateurs modernes). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // réservé
  header.writeUInt16LE(1, 2); // type : icône
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + pngs.length * 16;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // largeur
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // hauteur
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // réservé
    entry.writeUInt16LE(1, 4); // plans
    entry.writeUInt16LE(32, 6); // bits par pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
  await mkdir(path.join(ROOT, "public", "icons"), { recursive: true });

  const targets = [
    { file: "app/icon.png", size: 256, pipeline: square },
    { file: "app/apple-icon.png", size: 180, pipeline: square },
    { file: "public/icons/icon-192.png", size: 192, pipeline: square },
    { file: "public/icons/icon-512.png", size: 512, pipeline: square },
    { file: "public/icons/icon-maskable-192.png", size: 192, pipeline: maskable },
    { file: "public/icons/icon-maskable-512.png", size: 512, pipeline: maskable },
    { file: "public/icons/logo-mark.png", size: 144, pipeline: mark },
  ];

  for (const { file, size, pipeline } of targets) {
    const buffer = await (await pipeline(size)).toBuffer();
    await writeFile(path.join(ROOT, file), buffer);
    console.log(`✓ ${file} (${size}×${size})`);
  }

  const faviconSizes = [16, 32, 48];
  const faviconPngs = await Promise.all(
    faviconSizes.map(async (size) => ({
      size,
      // PNG truecolor + alpha : Next.js refuse les PNG indexés dans un .ico.
      data: await square(size, { palette: false }).toBuffer(),
    })),
  );
  await writeFile(path.join(ROOT, "app", "favicon.ico"), ico(faviconPngs));
  console.log(`✓ app/favicon.ico (${faviconSizes.join(" / ")})`);
}

await main();
