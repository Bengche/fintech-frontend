/**
 * generate-pwa-icons.mjs
 * Regenerates all PWA PNG icons from the FonlokLogo SVG mark.
 *
 * Run:  node generate-pwa-icons.mjs
 */

import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "public", "icons");

// ── Logo SVG (regular — viewBox 48×48, content fills full square) ─────────────
const logoSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 48 48"
     xmlns="http://www.w3.org/2000/svg">
  <!-- Navy background -->
  <rect width="48" height="48" rx="11" fill="#0F1F3D"/>
  <!-- Amber top crossbar -->
  <rect x="12.5" y="10"   width="22.5" height="7.5"  rx="3.75" fill="#F59E0B"/>
  <!-- White middle crossbar -->
  <rect x="12.5" y="21.5" width="15"   height="5.5"  rx="2.75" fill="#FFFFFF"/>
  <!-- White vertical stroke -->
  <rect x="12.5" y="10"   width="6.5"  height="27.5" rx="3"    fill="#FFFFFF"/>
</svg>`;

// ── Maskable SVG — icon centred inside the 80 % safe zone ────────────────────
// ViewBox 60×60: content occupies 48×48 starting at (6,6) = 10 % padding each side.
// Background fills entire square (no rx — OS masks it to a circle/squircle anyway).
const maskableSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 60 60"
     xmlns="http://www.w3.org/2000/svg">
  <!-- Full-bleed navy background -->
  <rect width="60" height="60" fill="#0F1F3D"/>
  <!-- Amber top crossbar (shifted +6,+6) -->
  <rect x="18.5" y="16"   width="22.5" height="7.5"  rx="3.75" fill="#F59E0B"/>
  <!-- White middle crossbar (shifted +6,+6) -->
  <rect x="18.5" y="27.5" width="15"   height="5.5"  rx="2.75" fill="#FFFFFF"/>
  <!-- White vertical stroke (shifted +6,+6) -->
  <rect x="18.5" y="16"   width="6.5"  height="27.5" rx="3"    fill="#FFFFFF"/>
</svg>`;

// ── Sizes to generate ─────────────────────────────────────────────────────────
const regular = [
  16, 32, 48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 384, 512,
];
const maskable = [192, 512];

async function make(svgString, outputPath, size) {
  await sharp(Buffer.from(svgString))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`✓  ${outputPath.replace(__dirname, ".")}`);
}

console.log("\n🎨  Generating Fonlok PWA icons from SVG logo...\n");

await Promise.all([
  ...regular.map((s) => make(logoSvg(s), join(OUT, `icon-${s}.png`), s)),
  ...maskable.map((s) =>
    make(maskableSvg(s), join(OUT, `icon-maskable-${s}.png`), s),
  ),
  // Apple touch / ms tile aliases
  make(logoSvg(144), join(OUT, "ms-icon-144.png"), 144),
]);

console.log("\n✅  All icons generated successfully.\n");
