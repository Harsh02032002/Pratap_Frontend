/**
 * scanRawImageUploads.mjs — static guard against raw image uploads.
 *
 *   node scripts/scanRawImageUploads.mjs
 *
 * Flags any `formData.append('image', <var>)` where <var> was not produced by
 * compressImage(). A camera original is 3-12MB; sending it straight to
 * /api/upload is slow on mobile data and wastes bandwidth and storage.
 *
 * Paths that must stay uncompressed carry an explicit allow-list entry below
 * with a reason, so an exception is a decision someone wrote down rather than
 * an oversight. Exits non-zero on anything unexplained.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');

/** Field names that carry image bytes. `file`/`files` are handled separately. */
const IMAGE_FIELDS = /\.append\(\s*['"](image|images|photo|photos|profilePhoto)['"]\s*,\s*([A-Za-z_$][\w$.]*)\s*\)/;

/**
 * Documented exceptions. Key is `relativePath:variableName`.
 * Every entry states why the original bytes are required.
 */
const ALLOWED = {
  // Read by Tesseract OCR both client-side (Tesseract.recognize(file)) and
  // server-side (backend utils/documentValidator.js). Downscaling or
  // re-encoding an Aadhaar/ID card risks KYC extraction accuracy, and that
  // has not been validated against real documents. Left at original quality
  // deliberately; revisit with PRESETS.DOCUMENT once OCR accuracy is measured.
  'pages/propertyowner/tenantrec.jsx:file': 'OCR/KYC — Aadhaar + ID proof, read by Tesseract',
  'pages/superadmin/AddTenant.jsx:file': 'OCR/KYC — tenant ID proof, read by Tesseract',

  // Not an image. The backend exposes a single upload field named "image",
  // so videos are posted through it too; compressImage would pass them
  // through untouched anyway, but the intent is recorded here.
  'pages/superadmin/AddPropertyWizard.jsx:file@video': 'video upload reusing the shared "image" field',
};

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
};

const findings = [];

for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).replace(/\\/g, '/');
  const lines = fs.readFileSync(file, 'utf8').split('\n');

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    const m = line.match(IMAGE_FIELDS);
    if (!m) return;

    const [, field, variable] = m;

    // Produced by the shared utility — either inline or assigned just above.
    const isOptimized =
      /optimi[sz]ed/i.test(variable) ||
      /compress/i.test(variable) ||
      lines.slice(Math.max(0, i - 6), i).some((l) => /compressImage\s*\(/.test(l));

    if (isOptimized) return;

    const key = `${rel}:${variable}`;
    const videoKey = `${rel}:${variable}@video`;
    if (ALLOWED[key] || ALLOWED[videoKey]) return;

    findings.push(`${rel}:${i + 1}  append('${field}', ${variable}) — raw image, not passed through compressImage()`);
  });
}

if (findings.length) {
  console.log('Unexplained raw image uploads:\n');
  for (const f of findings) console.log('  ' + f);
  console.log(`\n  ${findings.length} finding(s). Either compress the file, or add a documented`);
  console.log('  entry to ALLOWED in scripts/scanRawImageUploads.mjs explaining why not.');
  process.exit(1);
}

console.log('  no unexplained raw image uploads');
console.log(`  ${Object.keys(ALLOWED).length} documented exception(s):`);
for (const [k, why] of Object.entries(ALLOWED)) console.log(`    ${k} — ${why}`);
process.exit(0);
