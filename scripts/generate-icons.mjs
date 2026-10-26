#!/usr/bin/env node
/**
 * Génère les icônes du site et de la PWA à partir de la marque vectorielle.
 *
 *   node scripts/generate-icons.mjs
 *
 * Source : assets/logo-mark.svg (groupes #background et #drawing).
 *
 * Sorties :
 *   app/favicon.ico              → onglet navigateur (16 / 32 / 48), coins arrondis
 *   app/icon.png                 → <link rel="icon"> (256), coins arrondis
 *   app/apple-icon.png           → <link rel="apple-touch-icon"> (180), plein cadre
 *   public/icons/icon-*.png      → manifest PWA (192 / 512), plein cadre
 *   public/icons/icon-maskable-* → manifest PWA, dessin dans la zone de sécurité
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = await readFile(path.join(ROOT, "assets", "logo-mark.svg"), "utf8");

function group(id) {
  const match = SOURCE.match(new RegExp(`<g id="${id}">([\\s\\S]*?)</g>`));
  if (!match) throw new Error(`Groupe #${id} introuvable dans logo-mark.svg`);
  return match[1];
}

const BACKGROUND = group("background");
const DRAWING = group("drawing");

/**
 * @param {object} options
 * @param {number} options.radius  Rayon des coins (0 = plein cadre, laissé à l'OS).
 * @param {number} options.scale   Échelle du dessin autour du centre (maskable : 0.78).
 */
function svg({ radius = 0, scale = 1 } = {}) {
  const offset = (64 - 64 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs><clipPath id="c"><rect width="64" height="64" rx="${radius}"/></clipPath></defs>
    <g clip-path="url(#c)">
      ${BACKGROUND}
      <g transform="translate(${offset} ${offset}) scale(${scale})">${DRAWING}</g>
    </g>
  </svg>`;
}

function render(size, options) {
  return sharp(Buffer.from(svg(options)), { density: Math.max(72, (size / 64) * 72 * 2) })
    .resize(size, size)
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

  const rounded = { radius: 14 };
  const fullBleed = { radius: 0 };
  const maskable = { radius: 0, scale: 0.78 };

  const targets = [
    { file: "app/icon.png", size: 256, options: rounded },
    { file: "app/apple-icon.png", size: 180, options: fullBleed },
    { file: "public/icons/icon-192.png", size: 192, options: fullBleed },
    { file: "public/icons/icon-512.png", size: 512, options: fullBleed },
    { file: "public/icons/icon-maskable-192.png", size: 192, options: maskable },
    { file: "public/icons/icon-maskable-512.png", size: 512, options: maskable },
  ];

  for (const { file, size, options } of targets) {
    await writeFile(path.join(ROOT, file), await render(size, options).toBuffer());
    console.log(`✓ ${file} (${size}×${size})`);
  }

  const faviconSizes = [16, 32, 48];
  const faviconPngs = await Promise.all(
    faviconSizes.map(async (size) => ({
      size,
      data: await render(size, rounded).toBuffer(),
    })),
  );
  await writeFile(path.join(ROOT, "app", "favicon.ico"), ico(faviconPngs));
  console.log(`✓ app/favicon.ico (${faviconSizes.join(" / ")})`);
}

await main();
