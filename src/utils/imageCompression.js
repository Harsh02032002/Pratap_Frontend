/**
 * imageCompression.js — the single client-side image optimiser.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Most upload flows sent the camera original straight to /api/upload:
 *
 *     const data = new FormData();
 *     data.append('image', file);        // 3-12 MB from a modern phone
 *
 * On mobile data that is a slow, expensive upload for an image that gets
 * displayed at a fraction of its resolution.
 *
 * ORIGIN
 * ──────
 * This is the compression from `pages/propertyowner/rooms.jsx` (duplicated
 * byte-for-byte in `pages/superadmin/rooms.jsx`), extracted and hardened. Its
 * defaults are preserved so existing room uploads produce the same output —
 * see PRESETS.PHOTO.
 *
 * DEFECTS FIXED WHILE EXTRACTING (all present in the original)
 * ───────────────────────────────────────────────────────────
 * 1. Only the WIDTH was capped (`scale = min(1, maxWidth / img.width)`), so a
 *    tall narrow image — 800x6000 — passed through untouched at 4.8 megapixels.
 *    Both axes are now capped. For ordinary 3:4 and 4:3 phone photos the chosen
 *    limits produce the SAME scale factor as before, so normal output is
 *    unchanged (see computeTargetSize).
 * 2. `canvas.toBlob` returning null (memory pressure, tainted canvas) hit
 *    `new File([null], …)`, which throws inside the callback — the promise then
 *    never settled and the upload hung forever. Now handled explicitly.
 * 3. Canvas dimensions could be fractional; they are rounded and floored at 1px.
 * 4. Every PNG was re-encoded as JPEG, turning transparency black. Alpha is now
 *    detected and preserved.
 * 5. The filename kept its old extension while the bytes changed format
 *    ("logo.png" containing JPEG). The extension now follows the real type.
 * 6. `img.onerror` resolved without revoking the object URL — a leak on every
 *    failed decode. All paths revoke now.
 * 7. Images already small enough were still re-encoded, losing quality for no
 *    saving. Those are returned untouched.
 *
 * NOT A SECURITY CONTROL
 * ──────────────────────
 * This is a bandwidth optimisation only. The backend still validates type,
 * size and image validity — none of that was weakened, and none of it should
 * ever be relaxed because this exists.
 */

/**
 * Tuned presets. Pick by what the image is FOR, not by how small it can get —
 * over-compression is a bug, not a win.
 */
export const PRESETS = {
  /**
   * Property, room and listing photos. Values carried over from rooms.jsx.
   *
   * maxWidth 1200 / maxHeight 1600 is deliberate: for a 3:4 portrait phone
   * photo (3024x4032) the binding limit is 1600/4032 = 0.397, exactly what
   * 1200/3024 produced before. For 4:3 landscape (4032x3024) it is
   * 1200/4032 = 0.298, again unchanged. Ordinary photos therefore compress
   * exactly as they did; only degenerate aspect ratios behave differently.
   */
  PHOTO: { maxWidth: 1200, maxHeight: 1600, quality: 0.75 },

  /** Profile pictures and avatars — displayed small, so a tighter budget. */
  AVATAR: { maxWidth: 512, maxHeight: 512, quality: 0.82 },

  /**
   * Scanned documents and ID cards. Generous on both axes and near-lossless,
   * because these are read by OCR rather than looked at. Provided for a future
   * OCR-verified rollout — no flow uses it yet (see the exception list in the
   * task report).
   */
  DOCUMENT: { maxWidth: 2400, maxHeight: 2400, quality: 0.92 },
};

/** Below this, re-encoding costs quality and saves almost nothing. */
const SKIP_UNDER_BYTES = 200 * 1024;

/** Refuse to allocate a canvas beyond this; browsers fail unpredictably above it. */
const MAX_SOURCE_PIXELS = 50 * 1024 * 1024; // 50 MP

/** Formats we can safely decode and re-encode. */
const COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

/**
 * Longest-edge-aware scale that respects BOTH limits and never upscales.
 * Exported for testing — this is the core arithmetic.
 *
 * @param {number} width
 * @param {number} height
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @returns {{width:number, height:number, scale:number}}
 */
export function computeTargetSize(width, height, maxWidth, maxHeight) {
  if (!width || !height || width <= 0 || height <= 0) {
    return { width: 0, height: 0, scale: 1 };
  }
  // `1` in the min() is what stops a small image being blown up.
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  };
}

/**
 * True when compressing would cost quality without a worthwhile saving:
 * the file is already small AND already within the dimension budget.
 *
 * @param {{size:number}} file
 * @param {number} width
 * @param {number} height
 * @param {{maxWidth:number, maxHeight:number}} opts
 */
export function shouldSkipCompression(file, width, height, opts) {
  const withinBytes = file.size <= SKIP_UNDER_BYTES;
  const withinDimensions = width <= opts.maxWidth && height <= opts.maxHeight;
  return withinBytes && withinDimensions;
}

/**
 * Output MIME type. PNGs that may carry transparency stay PNG — re-encoding
 * them as JPEG turns transparent pixels black. Everything else becomes JPEG,
 * which is far smaller for photographic content.
 *
 * @param {string} sourceType
 * @param {boolean} hasAlpha
 */
export function outputTypeFor(sourceType, hasAlpha) {
  if (hasAlpha) return 'image/png';
  if (sourceType === 'image/png') return 'image/png';
  return 'image/jpeg';
}

/**
 * Give the filename an extension matching the bytes, so the stored asset is
 * not "photo.png" containing JPEG.
 *
 * @param {string} name
 * @param {string} mimeType
 */
export function renameForType(name, mimeType) {
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const base = String(name || 'image').replace(/\.[^.]+$/, '');
  return `${base}.${ext}`;
}

/** Whether this file is worth handing to the canvas at all. */
export function isCompressibleImage(file) {
  return Boolean(file && typeof file.type === 'string' && COMPRESSIBLE_TYPES.has(file.type.toLowerCase()));
}

/**
 * Decode a file into something drawable.
 *
 * `createImageBitmap` with `imageOrientation: 'from-image'` is preferred: it
 * applies EXIF orientation explicitly rather than relying on the browser's
 * default `<img>` behaviour, which differs between engines and versions — the
 * usual cause of iPhone photos uploading sideways. Falls back to `<img>`,
 * where modern browsers apply EXIF themselves.
 */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close?.() };
    } catch (_) {
      // Older Safari rejects the options bag — fall through to <img>.
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        release: () => URL.revokeObjectURL(url),
      });
    };
    // Revoke on the failure path too — the original leaked here on every
    // corrupt or unsupported file.
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image could not be decoded'));
    };
    img.src = url;
  });
}

/** Does this source have any non-opaque pixel? Sampled, not exhaustive. */
function detectAlpha(ctx, width, height) {
  try {
    const step = Math.max(1, Math.floor(Math.min(width, height) / 64));
    const { data } = ctx.getImageData(0, 0, width, height);
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if (data[(y * width + x) * 4 + 3] < 255) return true;
      }
    }
  } catch (_) {
    // getImageData can throw on a tainted canvas — assume opaque.
  }
  return false;
}

/**
 * Compress an image for upload.
 *
 * Always resolves with something uploadable. A file that cannot be compressed
 * — wrong type, corrupt, canvas unavailable, out of memory — is returned
 * UNCHANGED rather than dropped, so the user never silently loses their
 * selection. The backend's own size and type validation still applies to it.
 *
 * @param {File} file
 * @param {{maxWidth?:number, maxHeight?:number, quality?:number}} [options] defaults to PRESETS.PHOTO
 * @returns {Promise<File>} the optimised file, or the original on any failure
 */
export async function compressImage(file, options = {}) {
  const opts = { ...PRESETS.PHOTO, ...options };

  if (!file || !isCompressibleImage(file)) return file;

  let decoded;
  try {
    decoded = await decode(file);
  } catch (_) {
    return file; // corrupt or unsupported — let the backend reject it
  }

  try {
    const { source, width, height } = decoded;

    if (!width || !height) return file;
    // Guard before allocating: a canvas this large fails unpredictably and can
    // take the tab with it on a low-end phone.
    if (width * height > MAX_SOURCE_PIXELS) return file;
    if (shouldSkipCompression(file, width, height, opts)) return file;

    const target = computeTargetSize(width, height, opts.maxWidth, opts.maxHeight);

    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file; // no 2d context (very old or locked-down browser)

    ctx.drawImage(source, 0, 0, target.width, target.height);

    const hasAlpha = file.type.toLowerCase() === 'image/png'
      && detectAlpha(ctx, target.width, target.height);
    const outputType = outputTypeFor(file.type.toLowerCase(), hasAlpha);

    const blob = await new Promise((resolve) => {
      try {
        // PNG ignores the quality argument; passing it is harmless.
        canvas.toBlob(resolve, outputType, opts.quality);
      } catch (_) {
        resolve(null);
      }
    });

    // toBlob yields null under memory pressure. The original threw here and
    // left the promise pending forever — the upload button just spun.
    if (!blob || blob.size === 0) return file;

    // Re-encoding does not always shrink things: small PNGs and already-
    // optimised JPEGs can grow. Keep whichever is smaller.
    if (blob.size >= file.size) return file;

    return new File([blob], renameForType(file.name, outputType), {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch (_) {
    return file;
  } finally {
    // Bitmap closed / object URL revoked on every path, including throws.
    decoded.release?.();
  }
}

/**
 * Compress several files with bounded concurrency.
 *
 * Decoding is memory-hungry: mapping compressImage over 20 phone photos at
 * once can hold hundreds of megabytes of decoded bitmaps and crash a mobile
 * tab. Two at a time keeps memory flat while still overlapping work.
 *
 * @param {File[]} files
 * @param {object} [options]
 * @param {number} [concurrency=2]
 * @returns {Promise<File[]>} same order as the input
 */
export async function compressImages(files, options = {}, concurrency = 2) {
  const list = Array.from(files || []);
  const out = new Array(list.length);
  let next = 0;

  const worker = async () => {
    while (next < list.length) {
      const i = next++;
      out[i] = await compressImage(list[i], options);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));
  return out;
}

export default compressImage;
