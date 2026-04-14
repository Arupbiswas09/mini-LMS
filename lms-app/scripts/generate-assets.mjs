/**
 * generate-assets.mjs
 * Resizes and copies generated brand assets into the correct Expo asset paths.
 * Run: node scripts/generate-assets.mjs
 */

import { createCanvas, loadImage } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS_IMG = join(ROOT, 'assets', 'images');

// Source images (generated)
const SRC = {
  icon:         '/Users/arup/.gemini/antigravity/brain/3bbc70a0-eb73-496d-9c24-538538c5d404/lms_app_icon_1776149574632.png',
  favicon:      '/Users/arup/.gemini/antigravity/brain/3bbc70a0-eb73-496d-9c24-538538c5d404/lms_favicon_1776149750274.png',
  adaptive:     '/Users/arup/.gemini/antigravity/brain/3bbc70a0-eb73-496d-9c24-538538c5d404/lms_adaptive_icon_1776149810581.png',
  splash:       '/Users/arup/.gemini/antigravity/brain/3bbc70a0-eb73-496d-9c24-538538c5d404/lms_splash_icon_1776149846942.png',
};

// Target sizes
const TARGETS = [
  { src: 'icon',     dest: 'icon.png',          size: 1024 },
  { src: 'favicon',  dest: 'favicon.png',        size: 48   },
  { src: 'adaptive', dest: 'adaptive-icon.png',  size: 1024 },
  { src: 'splash',   dest: 'splash-icon.png',    size: 1024 },
];

async function resizeAndSave(srcPath, destPath, size) {
  const img = await loadImage(srcPath);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  const buf = canvas.toBuffer('image/png');
  writeFileSync(destPath, buf);
  console.log(`  ✓ ${destPath} (${size}x${size})`);
}

mkdirSync(ASSETS_IMG, { recursive: true });

console.log('\n🎨 Mini LMS — Asset Pipeline\n');
for (const t of TARGETS) {
  await resizeAndSave(SRC[t.src], join(ASSETS_IMG, t.dest), t.size);
}
console.log('\n✅ All assets written to assets/images/\n');
