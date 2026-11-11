import { compressImage, PRESETS } from "./imageCompression";
import { getApiBase } from "./api";

const MAX_OCR_DIM = 2400;
const MIN_OCR_DIM = 1000;

const SELF_HOSTED_WORKER_OPTIONS = {
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract",
  langPath: "/tesseract",
  gzip: true,
  workerBlobURL: false,
};

const loadBitmap = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch (_) {
      // fall through to <img> decoding
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be decoded"));
    };
    img.src = url;
  });
};

export const preprocessImageForOcr = async (file) => {
  if (typeof document === "undefined" || !(file instanceof Blob)) return file;
  try {
    const bitmap = await loadBitmap(file);
    const srcW = bitmap.width || bitmap.naturalWidth;
    const srcH = bitmap.height || bitmap.naturalHeight;
    if (!srcW || !srcH) return file;

    const longest = Math.max(srcW, srcH);
    const factor =
      longest > MAX_OCR_DIM
        ? MAX_OCR_DIM / longest
        : longest < MIN_OCR_DIM
          ? Math.min(2, MIN_OCR_DIM / longest)
          : 1;

    const w = Math.round(srcW * factor);
    const h = Math.round(srcH * factor);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;
    let min = 255;
    let max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const g = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
      data[i] = data[i + 1] = data[i + 2] = g;
      if (g < min) min = g;
      if (g > max) max = g;
    }
    const range = max - min;
    if (range > 10 && range < 245) {
      for (let i = 0; i < data.length; i += 4) {
        const v = (((data[i] - min) * 255) / range) | 0;
        data[i] = data[i + 1] = data[i + 2] = v;
      }
    }
    ctx.putImageData(image, 0, 0);
    bitmap.close?.();
    return canvas;
  } catch (_) {
    return file;
  }
};

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const str = String(reader.result || "");
      resolve(str.replace(/^data:[^;]+;base64,/, ""));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const sourceToBase64 = async (source) => {
  if (typeof source === "string") {
    return source.replace(/^data:[^;]+;base64,/, "");
  }
  if (source instanceof File) {
    const optimized = await compressImage(source, PRESETS.DOCUMENT);
    return blobToBase64(optimized);
  }
  if (source instanceof Blob) {
    return blobToBase64(source);
  }
  if (typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement) {
    return source.toDataURL("image/jpeg", 0.9).replace(/^data:[^;]+;base64,/, "");
  }
  return "";
};

const recognizeViaBackendFallback = async (source, apiBases) => {
  const base64 = await sourceToBase64(source);
  if (!base64) throw new Error("Unable to encode image for OCR");

  const bases = Array.isArray(apiBases) && apiBases.length
    ? [...new Set(["", ...apiBases])]
    : [...new Set([getApiBase(), ""])];

  let lastErr = null;
  for (const base of bases) {
    try {
      const res = await fetch(`${base}/api/checkin/ocr/extract-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (res.status === 404) continue;
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        return String(data.text || "");
      }
      lastErr = new Error(data?.message || `HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("OCR fallback failed");
};

export const createOcrWorker = async (lang = "eng", options = {}) => {
  const mod = await import("tesseract.js");
  const createWorker = mod.createWorker || mod.default?.createWorker;
  if (typeof createWorker !== "function") {
    throw new Error("Tesseract createWorker is unavailable");
  }
  return createWorker(lang, 1, {
    ...SELF_HOSTED_WORKER_OPTIONS,
    ...options,
  });
};

export const recognizeOcrText = async (
  source,
  { raw = false, preprocess = true, apiBases = null, logger } = {}
) => {
  let worker = null;
  try {
    const target =
      !raw && preprocess && source instanceof Blob
        ? await preprocessImageForOcr(source)
        : source;
    worker = await createOcrWorker("eng", logger ? { logger } : {});
    const result = await worker.recognize(target);
    return String(result?.data?.text || "");
  } catch (workerErr) {
    return await recognizeViaBackendFallback(source, apiBases).catch(() => {
      throw workerErr;
    });
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_) {
        // ignore termination cleanup errors
      }
    }
  }
};
