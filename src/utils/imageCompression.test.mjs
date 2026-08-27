/**
 * Tests for the shared image-compression utility.
 *
 * SCOPE — read this before trusting the results
 * ─────────────────────────────────────────────
 * This repo has no frontend test framework (no vitest/jest/jsdom in
 * devDependencies), and the task says not to introduce one unless necessary.
 * These run on `node --test`, which ships with Node — no new dependency.
 *
 * That means the canvas encode path is NOT executed here: `canvas.toBlob`
 * needs a real browser (or the native `canvas` package, which is not
 * installed). What IS covered is every pure decision the utility makes —
 * the resize arithmetic, skip thresholds, format selection, filename
 * handling and type gating — which is where the bugs in the original lived.
 *
 * End-to-end encode behaviour and real before/after sizes are produced by
 * scripts/measure-image-compression.html, which runs in a browser.
 *
 *   node --test src/utils/imageCompression.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import {
  computeTargetSize,
  shouldSkipCompression,
  outputTypeFor,
  renameForType,
  isCompressibleImage,
  PRESETS,
} from './imageCompression.js';

const SRC = path.resolve(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// Resize arithmetic — aspect ratio and dimension caps
// ─────────────────────────────────────────────────────────────────────────────

const { maxWidth: MW, maxHeight: MH } = PRESETS.PHOTO;

test('BEHAVIOUR PRESERVED: 3:4 portrait phone photo scales exactly as the old code did', () => {
  // Old: scale = 1200 / 3024 = 0.3968…  →  1200x1600
  const r = computeTargetSize(3024, 4032, MW, MH);
  assert.strictEqual(r.width, 1200);
  assert.strictEqual(r.height, 1600);
});

test('BEHAVIOUR PRESERVED: 4:3 landscape phone photo scales exactly as the old code did', () => {
  // Old: scale = 1200 / 4032 = 0.2976…  →  1200x900
  const r = computeTargetSize(4032, 3024, MW, MH);
  assert.strictEqual(r.width, 1200);
  assert.strictEqual(r.height, 900);
});

test('BUG FIXED: a tall narrow image is now capped (the old code let it through untouched)', () => {
  // Old: width 800 < maxWidth 1200 → scale 1 → 800x6000 kept, 4.8 megapixels.
  const r = computeTargetSize(800, 6000, MW, MH);
  assert.ok(r.height <= MH, `height ${r.height} must respect the cap`);
  assert.strictEqual(r.height, 1600);
  assert.strictEqual(r.width, 213);
});

test('a wide panorama is capped on width', () => {
  const r = computeTargetSize(8000, 1000, MW, MH);
  assert.strictEqual(r.width, 1200);
  assert.strictEqual(r.height, 150);
});

test('aspect ratio is preserved within a pixel of rounding', () => {
  for (const [w, h] of [[4032, 3024], [3024, 4032], [1920, 1080], [1000, 1000], [2500, 1600]]) {
    const r = computeTargetSize(w, h, MW, MH);
    assert.ok(Math.abs((w / h) - (r.width / r.height)) < 0.01,
      `aspect drift for ${w}x${h} → ${r.width}x${r.height}`);
  }
});

test('small images are never upscaled', () => {
  const r = computeTargetSize(400, 300, MW, MH);
  assert.strictEqual(r.width, 400);
  assert.strictEqual(r.height, 300);
  assert.strictEqual(r.scale, 1);
});

test('an image exactly at the limit is left alone', () => {
  const r = computeTargetSize(1200, 1600, MW, MH);
  assert.strictEqual(r.scale, 1);
});

test('BUG FIXED: dimensions are integers, never fractional', () => {
  for (const [w, h] of [[3023, 4031], [1337, 999], [777, 1234]]) {
    const r = computeTargetSize(w, h, MW, MH);
    assert.ok(Number.isInteger(r.width) && Number.isInteger(r.height),
      `${w}x${h} produced ${r.width}x${r.height}`);
  }
});

test('an extreme ratio still yields at least 1px, never 0', () => {
  const r = computeTargetSize(20000, 5, MW, MH);
  assert.ok(r.width >= 1 && r.height >= 1);
});

test('zero or invalid dimensions do not throw', () => {
  assert.deepStrictEqual(computeTargetSize(0, 0, MW, MH), { width: 0, height: 0, scale: 1 });
  assert.deepStrictEqual(computeTargetSize(-5, 100, MW, MH), { width: 0, height: 0, scale: 1 });
});

test('the AVATAR preset is tighter than PHOTO, and DOCUMENT is more generous', () => {
  assert.ok(PRESETS.AVATAR.maxWidth < PRESETS.PHOTO.maxWidth);
  assert.ok(PRESETS.DOCUMENT.maxWidth > PRESETS.PHOTO.maxWidth);
  assert.ok(PRESETS.DOCUMENT.quality > PRESETS.PHOTO.quality,
    'documents are OCR-read, so they keep more quality than photos');
});

// ─────────────────────────────────────────────────────────────────────────────
// Skip logic — do not degrade what is already small
// ─────────────────────────────────────────────────────────────────────────────

test('BUG FIXED: a small in-budget image is skipped instead of re-encoded', () => {
  assert.strictEqual(shouldSkipCompression({ size: 150 * 1024 }, 800, 600, PRESETS.PHOTO), true);
});

test('a small file with huge dimensions is NOT skipped', () => {
  assert.strictEqual(shouldSkipCompression({ size: 50 * 1024 }, 4000, 3000, PRESETS.PHOTO), false);
});

test('a large file within the dimension budget is NOT skipped', () => {
  assert.strictEqual(shouldSkipCompression({ size: 5 * 1024 * 1024 }, 1000, 1000, PRESETS.PHOTO), false);
});

test('a typical 8MB phone photo is never skipped', () => {
  assert.strictEqual(shouldSkipCompression({ size: 8 * 1024 * 1024 }, 4032, 3024, PRESETS.PHOTO), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Output format — transparency must survive
// ─────────────────────────────────────────────────────────────────────────────

test('BUG FIXED: a PNG with alpha stays PNG (the old code blackened transparency)', () => {
  assert.strictEqual(outputTypeFor('image/png', true), 'image/png');
});

test('an opaque PNG stays PNG', () => {
  assert.strictEqual(outputTypeFor('image/png', false), 'image/png');
});

test('JPEG and WebP photos encode as JPEG', () => {
  assert.strictEqual(outputTypeFor('image/jpeg', false), 'image/jpeg');
  assert.strictEqual(outputTypeFor('image/webp', false), 'image/jpeg');
});

test('anything flagged as having alpha is protected regardless of source type', () => {
  assert.strictEqual(outputTypeFor('image/webp', true), 'image/png');
});

// ─────────────────────────────────────────────────────────────────────────────
// Filename handling
// ─────────────────────────────────────────────────────────────────────────────

test('BUG FIXED: the extension follows the real output type', () => {
  assert.strictEqual(renameForType('photo.png', 'image/jpeg'), 'photo.jpg');
  assert.strictEqual(renameForType('logo.jpg', 'image/png'), 'logo.png');
});

test('dots inside the filename are preserved', () => {
  assert.strictEqual(renameForType('my.holiday.photo.HEIC', 'image/jpeg'), 'my.holiday.photo.jpg');
});

test('a missing or extensionless name still produces something valid', () => {
  assert.strictEqual(renameForType('', 'image/jpeg'), 'image.jpg');
  assert.strictEqual(renameForType(undefined, 'image/jpeg'), 'image.jpg');
  assert.strictEqual(renameForType('scan', 'image/png'), 'scan.png');
});

// ─────────────────────────────────────────────────────────────────────────────
// Type gating
// ─────────────────────────────────────────────────────────────────────────────

test('supported raster formats are accepted', () => {
  for (const type of ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'IMAGE/JPEG']) {
    assert.strictEqual(isCompressibleImage({ type }), true, type);
  }
});

test('non-images and unsupported formats pass through untouched', () => {
  for (const type of ['application/pdf', 'video/mp4', 'image/svg+xml', 'image/gif', 'text/plain', '']) {
    assert.strictEqual(isCompressibleImage({ type }), false, type);
  }
});

test('null/undefined input does not throw', () => {
  assert.strictEqual(isCompressibleImage(null), false);
  assert.strictEqual(isCompressibleImage(undefined), false);
  assert.strictEqual(isCompressibleImage({}), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration — call sites and API contract
// ─────────────────────────────────────────────────────────────────────────────

test('there is exactly ONE compression implementation', () => {
  const dup = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(full); continue; }
      if (!/\.(jsx?|tsx?)$/.test(e.name)) continue;
      if (full.endsWith('utils/imageCompression.js')) continue;
      if (/const compressImage\s*=/.test(fs.readFileSync(full, 'utf8'))) {
        dup.push(path.relative(SRC, full));
      }
    }
  };
  walk(SRC);
  assert.deepStrictEqual(dup, [], 'compression logic must not be redefined outside the shared utility');
});

test('the rooms.jsx duplicates now import the shared utility', () => {
  for (const rel of ['pages/propertyowner/rooms.jsx', 'pages/superadmin/rooms.jsx']) {
    const src = read(rel);
    assert.match(src, /import \{ compressImage \} from ".*utils\/imageCompression"/, rel);
    assert.match(src, /compressImage\(/, `${rel} must still call it`);
  }
});

test('API CONTRACT: FormData field names are unchanged', () => {
  // The backend reads "image" (and "profilePhoto" for avatars). If these drift,
  // uploads break silently — multer just sees no file.
  const cases = [
    ['pages/propertyowner/AddPropertyWizard.jsx', /\.append\('image',\s*optimizedFile\)/],
    ['pages/propertyowner/properties.jsx', /\.append\("image",\s*optimizedFile\)/],
    ['pages/superadmin/AddPropertyWizard.jsx', /\.append\("image",\s*optimizedFile\)/],
    ['pages/superadmin/properties.jsx', /\.append\("image",\s*optimizedFile\)/],
    ['pages/superadmin/WebsiteEditor.jsx', /\.append\("image",\s*optimizedFile\)/],
    ['pages/superadmin/manager.jsx', /\.append\("profilePhoto",\s*optimizedFile\)/],
    ['pages/superadmin/RolesPermissions.jsx', /\.append\("profilePhoto",\s*optimizedFile\)/],
  ];
  for (const [rel, pattern] of cases) {
    assert.match(read(rel), pattern, `${rel} field name or optimised variable changed`);
  }
});

test('API CONTRACT: upload endpoints are unchanged', () => {
  for (const rel of ['pages/propertyowner/properties.jsx', 'pages/superadmin/properties.jsx']) {
    assert.match(read(rel), /\/api\/upload/, `${rel} endpoint changed`);
  }
  for (const rel of ['pages/superadmin/manager.jsx', 'pages/superadmin/RolesPermissions.jsx']) {
    assert.match(read(rel), /\/api\/upload-profile-photo/, `${rel} endpoint changed`);
  }
});

test('compression is awaited before the FormData is built', () => {
  // If the await were missing, a Promise would be appended and the upload
  // would post "[object Promise]".
  for (const rel of ['pages/propertyowner/properties.jsx', 'pages/superadmin/WebsiteEditor.jsx']) {
    assert.match(read(rel), /await compressImage\(/, `${rel} must await compression`);
  }
});

test('OCR/KYC document uploads are deliberately left uncompressed', () => {
  // Tesseract reads these client-side and server-side; downscaling risks KYC
  // accuracy. Documented in scripts/scanRawImageUploads.mjs.
  const src = read('pages/propertyowner/tenantrec.jsx');
  assert.match(src, /data\.append\("image", file\)/,
    'Aadhaar/ID uploads must keep the original bytes until OCR accuracy is measured');
  assert.ok(!/compressImage/.test(src), 'tenantrec must not compress OCR inputs');
});

test('the video upload is not routed through image compression', () => {
  const src = read('pages/superadmin/AddPropertyWizard.jsx');
  assert.match(src, /Video, not an image — deliberately NOT passed through compressImage/);
});
