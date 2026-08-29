import Tesseract from "tesseract.js";
import { verhoeffCheck } from "../pages/digital-checkin/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Aadhaar document verification (OCR + Verhoeff)
//
// This module answers one question only: "is the uploaded image actually an
// Aadhaar card, and if so what is the number?" It is deliberately separate from
// field extraction consumers so the accept/reject decision lives in exactly one
// place.
//
// The decision rule is an AND, not an OR:
//
//   verified  = Aadhaar-specific card markers present AND a 12-digit number that
//               passes the Verhoeff checksum
//   unreadable= one half of that holds (markers but no clean number, or a valid
//               number with no card markers) — genuine card, bad photo, retry
//   rejected  = neither — this is not an Aadhaar card
//
// Verhoeff alone is NOT a document classifier. It is a typo checksum: roughly
// 1 in 10 random 12-digit numbers passes it. So a number on its own can never
// promote a document to "verified" — that was the hole that let a college
// group-members sheet through as an Aadhaar card.
// ─────────────────────────────────────────────────────────────────────────────

export const AADHAAR_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// ── number helpers ───────────────────────────────────────────────────────────

export const normalizeAadhaarNumber = (value) =>
  String(value || "").replace(/\D/g, "").slice(0, 12);

// UIDAI never issues a number starting with 0 or 1, and every number carries a
// Verhoeff check digit.
export const isValidAadhaarNumber = (value) => {
  const digits = normalizeAadhaarNumber(value);
  return digits.length === 12 && /^[2-9]/.test(digits) && verhoeffCheck(digits);
};

export const formatAadhaarGroups = (value) => {
  const d = normalizeAadhaarNumber(value);
  return [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12)].filter(Boolean).join(" ");
};

// An Aadhaar card also prints a 16-digit VID and a 28-digit enrolment number, and
// the back carries a 6-digit PIN. Matching "any 12 consecutive digits" happily
// grabs a slice out of the middle of those. So instead of a sliding window we
// walk whole digit runs and only consider a run that is *exactly* 12 digits long.
export const extractAadhaarNumber = (text) => {
  const lines = String(text || "").split(/\r?\n/);
  for (const line of lines) {
    const runs = line.match(/\d[\d\s-]*\d/g) || [];
    for (const run of runs) {
      const digits = run.replace(/\D/g, "");
      if (digits.length !== 12) continue;
      if (!/^[2-9]/.test(digits)) continue;
      if (verhoeffCheck(digits)) return digits;
    }
  }
  return "";
};

// ── card marker detection ────────────────────────────────────────────────────

// OCR routinely reads O as 0, I/l as 1, S as 5, B as 8. Fold those back before
// matching words so "U1DA1" and "G0VERNMENT" still hit.
const normalizeForMarkers = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[|!]/g, "i")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/5/g, "s")
    .replace(/8/g, "b")
    .replace(/[^a-z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Tesseract inserts and drops spaces constantly, so "Govern ment of Ind ia" is a
// routine read of the header. Long phrases are therefore matched a second time
// against a space-stripped copy of the text. Short tokens stay on the spaced
// copy where word boundaries still protect them.
//   norm      – tested against the spaced text (use \b freely)
//   collapsed – tested against the space-stripped text (no boundaries exist)
const STRONG_MARKERS = [
  { id: "uidai", norm: /\buidai\b/, collapsed: /uidai(gov|help|www)/ },
  { id: "uid-authority", collapsed: /uniqueidentificationauthority/ },
  { id: "aadhaar-word", norm: /\baadh?a+r\b|\badhaa?r\b/, collapsed: /aadhaar|aadhar\b/ },
  { id: "uidai-site", collapsed: /(www)?uidaigovin/ },
  { id: "tagline-pehchan", collapsed: /aadh?a+rmeripehchan/ },
  { id: "tagline-adhikar", collapsed: /aamaadmikaadhikar/ },
];

// Present on an Aadhaar card but NOT unique to it — "Government of India" is
// printed on PAN cards and passports too, so on its own it can never qualify a
// document.
const MEDIUM_MARKERS = [
  { id: "govt-india", norm: /\b(government|govt)\s*of\s*india\b/, collapsed: /(government|govt)ofindia/ },
  { id: "vid", norm: /\bvid\b/ },
  { id: "enrolment", norm: /enrol?l?ment\s*(no|number)/, collapsed: /enrol?l?ment(no|number)/ },
  { id: "your-aadhaar", collapsed: /youraadh?a+r(no|number)/ },
  { id: "issue-date", norm: /(issue|download)\s*date/ },
];

// Generic identity-document traits. Scored, but far too common to qualify
// anything by themselves.
const WEAK_MARKERS = [
  { id: "dob", norm: /\b(dob|date\s*of\s*birth|year\s*of\s*birth|yob)\b/ },
  { id: "gender", norm: /\b(male|female|transgender)\b/ },
  { id: "guardian", norm: /\b(s\s*o|d\s*o|w\s*o|c\s*o|father|husband)\b/ },
];

// Devanagari never survives an English-only Tesseract pass, so these are a bonus
// that fires only if a Hindi traineddata is ever wired in.
const DEVANAGARI_MARKERS = [
  { id: "aadhaar-hi", raw: /आधार/ },
  { id: "bharat-sarkar", raw: /भारत\s*सरकार/ },
];

export const scanAadhaarMarkers = (text) => {
  const raw = String(text || "");
  const norm = normalizeForMarkers(raw);
  const collapsed = norm.replace(/\s+/g, "");

  const hits = (list) =>
    list
      .filter((m) => (m.norm && m.norm.test(norm)) || (m.collapsed && m.collapsed.test(collapsed)) || (m.raw && m.raw.test(raw)))
      .map((m) => m.id);

  return {
    strong: [...hits(STRONG_MARKERS), ...hits(DEVANAGARI_MARKERS)],
    medium: hits(MEDIUM_MARKERS),
    weak: hits(WEAK_MARKERS),
  };
};

// Aadhaar prints its number as three groups of four. Combined with a passing
// Verhoeff digit that grouping is strong structural evidence — no other Indian
// ID uses a 12-digit all-numeric identifier in that layout.
const isGroupedInText = (text, digits) => {
  if (!digits) return false;
  const pattern = new RegExp(`${digits.slice(0, 4)}[\\s-]+${digits.slice(4, 8)}[\\s-]+${digits.slice(8)}`);
  return pattern.test(String(text || ""));
};

const hasAddressBlock = (text) => {
  const t = String(text || "");
  return /\b\d{6}\b/.test(t) && /(address|पता|s\/o|d\/o|w\/o|c\/o)/i.test(t);
};

// Minimum evidence for "this is an Aadhaar card". Calibrated against the real
// documents this form sees:
//
//   Aadhaar front, header read cleanly   govt-india 2 + grouped 3 + dob 1 + gender 1 = 7
//   Aadhaar front, header mangled                    grouped 3 + dob 1 + gender 1 = 5
//   Aadhaar back                            uidai-site 4 + grouped 3 + address 2 = 9
//   PAN card                                          govt-india 2 + dob 1       = 3
//   Driving licence                                   govt-india 2 + dob 1 + gender 1 = 4
//   Voter ID                                                      dob 1 + gender 1 = 2
//   Invoice carrying a 12-digit reference                                  plain 1 = 1
//   The group-members sheet from the bug report                                    = 0
export const AADHAAR_EVIDENCE_THRESHOLD = 5;

export const evaluateAadhaarEvidence = (text, side = "front") => {
  const markers = scanAadhaarMarkers(text);
  const aadhaarNumber = extractAadhaarNumber(text);
  const numberOk = isValidAadhaarNumber(aadhaarNumber);
  const grouped = numberOk && isGroupedInText(text, aadhaarNumber);
  const hasDob = Boolean(extractAadhaarDob(text) || extractAadhaarBirthYear(text));
  const hasGender = Boolean(extractAadhaarGender(text));
  const addressBlock = side === "back" && hasAddressBlock(text);

  let score = markers.strong.length * 4 + markers.medium.length * 2;
  if (numberOk) score += grouped ? 3 : 1;
  if (hasDob) score += 1;
  if (hasGender) score += 1;
  if (addressBlock) score += 2;

  return {
    markers,
    aadhaarNumber,
    numberOk,
    grouped,
    hasDob,
    hasGender,
    addressBlock,
    score,
    isAadhaar: score >= AADHAAR_EVIDENCE_THRESHOLD,
  };
};

// ── field extraction (only ever runs on a document that passed the gate) ──────

const NAME_STOPWORDS =
  /government|govt|india|uidai|unique|identification|authority|aadhaar|aadhar|card|male|female|transgender|address|dob|date|birth|year|father|mother|husband|guardian|enrol|issue|download|help|www|gov\.in|vid|pin|district|state|post|village|city/i;

const looksLikeName = (value) => {
  const clean = String(value || "").trim();
  if (clean.length < 3 || clean.length > 48) return false;
  if (/\d/.test(clean)) return false;
  if (!/^[A-Za-z][A-Za-z.\s]*[A-Za-z.]$/.test(clean)) return false;
  if (NAME_STOPWORDS.test(clean)) return false;
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 5) return false;
  return words.some((w) => w.replace(/\./g, "").length >= 3);
};

const titleCase = (value) =>
  String(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// Two strategies only, both anchored. The old "take the first line that isn't
// blacklisted" fallback is gone — it matched a table header on a college sheet.
export const extractAadhaarName = (text) => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const labeled = line.match(/^(?:name|naam)\s*[:\-]\s*(.+)$/i);
    if (labeled) {
      const candidate = labeled[1].replace(/[^A-Za-z.\s]/g, " ").replace(/\s+/g, " ").trim();
      if (looksLikeName(candidate)) return titleCase(candidate);
    }
  }

  // On an Aadhaar front the holder's name sits directly above the DOB/gender row.
  const anchor = lines.findIndex((l) =>
    /\b(dob|date\s*of\s*birth|year\s*of\s*birth|male|female|transgender)\b/i.test(l)
  );
  if (anchor > 0) {
    for (let i = anchor - 1; i >= Math.max(0, anchor - 3); i--) {
      const candidate = lines[i].replace(/[^A-Za-z.\s]/g, " ").replace(/\s+/g, " ").trim();
      if (looksLikeName(candidate)) return titleCase(candidate);
    }
  }

  return "";
};

const isRealDate = (d, m, y) => {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

// Returns yyyy-mm-dd (the form's input format) or "".
// A plausibility window replaces the old "any dd-mm-yyyy on the page" rule that
// turned a "Date of Submission: 28-08-2026" stamp into a date of birth.
export const extractAadhaarDob = (text) => {
  const clean = String(text || "");
  const now = new Date();
  const minYear = now.getFullYear() - 110;
  const maxYear = now.getFullYear() - 10;

  const accept = (dd, mm, yyyy) => {
    const d = Number(dd);
    const m = Number(mm);
    const y = Number(yyyy);
    if (y < minYear || y > maxYear) return "";
    if (!isRealDate(d, m, y)) return "";
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (new Date(iso) > now) return "";
    return iso;
  };

  const labeled = clean.match(
    /(?:dob|d\.?\s*o\.?\s*b\.?|date\s*of\s*birth|जन्म\s*तिथि)\s*[:\-]?\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/i
  );
  if (labeled) {
    const iso = accept(labeled[1], labeled[2], labeled[3]);
    if (iso) return iso;
  }

  for (const m of clean.matchAll(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/g)) {
    const iso = accept(m[1], m[2], m[3]);
    if (iso) return iso;
  }

  return "";
};

// Many Aadhaar cards print only "Year of Birth: 1994". Reporting that separately
// lets the UI ask for the exact date instead of inventing 1st January.
export const extractAadhaarBirthYear = (text) => {
  const m = String(text || "").match(/(?:year\s*of\s*birth|yob)\s*[:\-]?\s*(\d{4})/i);
  if (!m) return "";
  const y = Number(m[1]);
  const now = new Date().getFullYear();
  return y >= now - 110 && y <= now - 10 ? String(y) : "";
};

export const extractAadhaarGender = (text) => {
  const t = String(text || "");
  if (/\b(female|महिला)\b/i.test(t)) return "Female";
  if (/\b(male|पुरुष)\b/i.test(t)) return "Male";
  if (/\b(transgender|अन्य)\b/i.test(t)) return "Other";
  return "";
};

export const extractAadhaarGuardian = (text) => {
  const m = String(text || "").match(
    /(?:s\/o|d\/o|w\/o|c\/o|son\s+of|daughter\s+of|wife\s+of|care\s+of|father(?:'?s)?\s*name|पिता)\s*[:\s]\s*([A-Za-z.\s]{3,40})/i
  );
  if (!m) return { name: "", relation: "" };

  const name = m[1]
    .split(/,|\n|\/|\bhouse\b|\bno\b|\bnear\b|\bsector\b|\broad\b|\bdist\b|\bdistrict\b|\bpin\b|\bvill\b/i)[0]
    .replace(/[^A-Za-z.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!looksLikeName(name)) return { name: "", relation: "" };

  const tag = m[0].toLowerCase();
  let relation = "Father";
  if (tag.includes("w/o") || tag.includes("wife")) relation = "Spouse";
  else if (tag.includes("c/o") || tag.includes("care")) relation = "Guardian";

  return { name: titleCase(name), relation };
};

// The back of the card is the address side. An address is only accepted when it
// terminates in a 6-digit PIN — that is what separates a real address block from
// a random paragraph of OCR noise.
export const extractAadhaarAddress = (text) => {
  const clean = String(text || "");
  const pin = clean.match(/\b(\d{6})\b/);
  if (!pin) return "";

  const pinIdx = clean.indexOf(pin[0]);
  const labelIdx = clean.search(/(?:address|पता|s\/o|d\/o|w\/o|c\/o)\s*[:\s]/i);
  const start = labelIdx !== -1 && labelIdx < pinIdx ? labelIdx : Math.max(0, pinIdx - 220);

  const parts = clean
    .slice(start, pinIdx + 6)
    .replace(/(?:s\/o|d\/o|w\/o|c\/o|son\s+of|daughter\s+of|wife\s+of|care\s+of)\s*[:\s][A-Za-z.\s]{3,40}(?:,|\n|$)/gi, "")
    .replace(/\b(?:address|पता|addr)\s*[:\s,.-]*/gi, "")
    .replace(/[^A-Za-z0-9\s#\/,.-]/g, " ")
    .split(/[,\n]/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 3 && !/^(india|govt|government|unique|aadhaar|help|uidai)$/i.test(p));

  const seen = new Set();
  const unique = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }

  if (unique.length < 2) return "";
  return unique.join(", ");
};

// ── OCR ──────────────────────────────────────────────────────────────────────

const MAX_OCR_DIM = 2400;
const MIN_OCR_DIM = 1000;

const loadBitmap = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch (_) {
      // fall through to the <img> path
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

// Grayscale + contrast stretch + sane resize. Phone photos of Aadhaar cards are
// the worst case for Tesseract; this is what turns "unreadable" into a hit.
// Falls back to the raw file if anything about the canvas path fails.
const preprocessForOcr = async (file) => {
  try {
    const bitmap = await loadBitmap(file);
    const srcW = bitmap.width || bitmap.naturalWidth;
    const srcH = bitmap.height || bitmap.naturalHeight;
    if (!srcW || !srcH) return file;

    const longest = Math.max(srcW, srcH);
    const factor =
      longest > MAX_OCR_DIM ? MAX_OCR_DIM / longest
        : longest < MIN_OCR_DIM ? Math.min(2, MIN_OCR_DIM / longest)
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

// `raw: true` skips preprocessing. The two passes binarise differently and so
// misread different things — running both and merging recovers headers that one
// pass alone drops.
export const readTextFromImage = async (file, { raw = false } = {}) => {
  const source = raw ? file : await preprocessForOcr(file);
  const result = await Tesseract.recognize(source, "eng");
  return result?.data?.text || "";
};

// ── the gate ─────────────────────────────────────────────────────────────────

const rejection = (message) => ({
  verdict: "rejected",
  message,
  aadhaarNumber: "",
  confidence: 0,
  markers: { strong: [], medium: [], weak: [] },
  fields: {},
  text: "",
});

/**
 * Verify that an uploaded file is an Aadhaar card.
 *
 * @param {File} file
 * @param {{ side?: "front"|"back", expectedNumber?: string }} options
 *   side           – "back" scores an address block as supporting evidence and
 *                    doesn't insist on a readable number (the address side does
 *                    not always repeat it).
 *   expectedNumber – when the other side already produced a number, a number
 *                    read here must match it. Two halves of two different cards
 *                    is a rejection, not a pass.
 *
 * @returns {Promise<{verdict:"verified"|"unreadable"|"rejected"|"error", message:string,
 *   aadhaarNumber:string, confidence:number, evidence:object, fields:object, text:string}>}
 */
export const verifyAadhaarImage = async (file, options = {}) => {
  const { side = "front", expectedNumber = "" } = options;

  if (!file) return rejection("No file selected.");

  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name || "")) {
    return rejection("PDF can't be scanned. Upload a clear photo (JPG or PNG) of the Aadhaar card.");
  }
  if (file.type && !file.type.startsWith("image/")) {
    return rejection("Unsupported file. Upload a photo (JPG or PNG) of the Aadhaar card.");
  }
  if (file.size > AADHAAR_MAX_UPLOAD_BYTES) {
    return rejection("Image is larger than 5MB. Upload a smaller photo.");
  }

  let text = "";
  let evidence;
  try {
    text = await readTextFromImage(file);
    evidence = evaluateAadhaarEvidence(text, side);

    // Second look at the untouched image whenever the first pass falls short.
    // Aadhaar's header is small and low-contrast; whether it survives depends on
    // the binarisation, so the two passes routinely disagree about it.
    if (!evidence.isAadhaar || !evidence.numberOk) {
      const rawText = await readTextFromImage(file, { raw: true });
      const merged = `${text}\n${rawText}`;
      const mergedEvidence = evaluateAadhaarEvidence(merged, side);
      if (mergedEvidence.score > evidence.score) {
        text = merged;
        evidence = mergedEvidence;
      }
    }
  } catch (err) {
    console.error("Aadhaar OCR failed:", err);
    return { ...rejection(""), verdict: "error", message: "Could not scan the image. Please try again." };
  }

  // Leaves a trail for diagnosing a card that should have passed but didn't.
  console.debug("[aadhaar-scan]", side, {
    score: evidence.score,
    threshold: AADHAAR_EVIDENCE_THRESHOLD,
    markers: evidence.markers,
    numberOk: evidence.numberOk,
    grouped: evidence.grouped,
  });

  const { markers, numberOk, aadhaarNumber } = evidence;
  const confidence = Math.min(100, Math.round((evidence.score / 10) * 100));
  const base = { markers, evidence, confidence, text, aadhaarNumber: numberOk ? aadhaarNumber : "" };

  // Two halves of two different cards.
  if (numberOk && expectedNumber && normalizeAadhaarNumber(expectedNumber) !== aadhaarNumber) {
    return {
      ...base,
      verdict: "rejected",
      message: "This card's number doesn't match the other side. Upload both sides of the same Aadhaar card.",
      fields: {},
    };
  }

  if (!evidence.isAadhaar) {
    // Enough of a signal that this is probably a card the camera didn't capture
    // well — worth a retake rather than a flat rejection.
    const nearMiss = numberOk || markers.strong.length > 0 || markers.medium.length > 0;
    if (nearMiss) {
      return {
        ...base,
        verdict: "unreadable",
        message: "Card text is too blurry to confirm. Retake the photo in better light, filling the frame with the card.",
        fields: {},
      };
    }
    return {
      ...base,
      verdict: "rejected",
      message: "This doesn't look like an Aadhaar card. Upload the Aadhaar card, or tick the no-Aadhaar option above.",
      fields: {},
    };
  }

  if (side === "front" && !numberOk) {
    return {
      ...base,
      verdict: "unreadable",
      message: "Aadhaar detected but the 12-digit number is unclear. Retake the photo in better light.",
      fields: {},
    };
  }

  const guardian = extractAadhaarGuardian(text);
  const fields =
    side === "front"
      ? {
        name: extractAadhaarName(text),
        dob: extractAadhaarDob(text),
        birthYear: extractAadhaarBirthYear(text),
        gender: extractAadhaarGender(text),
      }
      : {
        address: extractAadhaarAddress(text),
        guardianName: guardian.name,
        guardianRelation: guardian.relation,
      };

  return {
    ...base,
    verdict: "verified",
    message: side === "front" ? "Aadhaar verified." : "Aadhaar back verified.",
    fields,
  };
};
