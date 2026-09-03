export const isLocalHost = () =>
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const getApiBases = () => (import.meta.env?.VITE_API_URL ? [import.meta.env.VITE_API_URL, ""] : (isLocalHost() ? ["http://localhost:5000", ""] : ["https://roohmy-backend-xwa9.vercel.app", ""]));

export const getParamValue = (names) => {
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash && window.location.hash.includes("?")
    ? new URLSearchParams(window.location.hash.split("?")[1])
    : new URLSearchParams("");
  const allEntries = [...params.entries(), ...hashQuery.entries()];

  for (const key of names) {
    const direct = params.get(key) || hashQuery.get(key);
    if (direct) return direct.trim();
    const ciMatch = allEntries.find(([k, v]) => k.toLowerCase() === key.toLowerCase() && v);
    if (ciMatch && ciMatch[1]) return ciMatch[1].trim();
  }
  return "";
};

/**
 * Whether a base that answered with `status` is worth abandoning for the next one.
 *
 * The base list exists to find a reachable backend, not to retry work. These
 * are POSTs: once a server has answered, it has RECEIVED and acted on the body,
 * and re-sending it to another base repeats whatever it already did. That is
 * how one "Upload Documents" click became two full Cloudinary uploads of the
 * same photos — the first base answered 5xx, and the loop dutifully uploaded
 * everything again to the second.
 *
 * A 404 is the exception worth keeping: it means this base has no such route
 * (a stale or wrong deployment), so nothing was acted on and the next base is
 * the whole point.
 */
const shouldTryNextBase = (status) => status === 404;

const postJson = async (path, payload, bases, requireSuccessFlag) => {
  let lastErr = null;
  for (const base of bases) {
    let res;
    try {
      res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // No HTTP response at all — unreachable base, so the next one is fair game.
      lastErr = err;
      continue;
    }

    const data = await res.json().catch(() => ({}));
    if (res.ok && (!requireSuccessFlag || data?.success)) return data;

    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    if (!shouldTryNextBase(res.status)) throw err;
    lastErr = err;
  }
  throw lastErr || new Error("Request failed");
};

export const postWithFallback = (path, payload, bases = getApiBases()) =>
  postJson(path, payload, bases, false);

export const postExpectSuccess = (path, payload, bases = getApiBases()) =>
  postJson(path, payload, bases, true);

export const getWithFallback = async (path, bases = getApiBases()) => {
  let lastErr = null;
  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`);
      if (res.ok) return res.json();
      const data = await res.json().catch(() => ({}));
      lastErr = new Error(data.message || `HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Request failed");
};

export const cleanPropertyName = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  if (
    lower === "new" ||
    lower === "new property" ||
    lower === "undefined" ||
    lower === "null" ||
    /^new\s*(\(.+\))?$/.test(lower)
  ) {
    return "";
  }
  return text;
};

export const formatAadhaarWithSpaces = (value) => {
  let val = String(value || "").replace(/\D/g, "");
  if (val.length > 12) val = val.substring(0, 12);
  if (val.length > 8) return `${val.substring(0, 4)} ${val.substring(4, 8)} ${val.substring(8)}`;
  if (val.length > 4) return `${val.substring(0, 4)} ${val.substring(4)}`;
  return val;
};

export const maskAadhaar = (aadhaar) => {
  const clean = String(aadhaar || "").replace(/\D/g, "");
  if (clean.length !== 12) return aadhaar || "-";
  return `XXXX XXXX ${clean.slice(-4)}`;
};

// Verhoeff checksum — UIDAI uses this for all 12-digit Aadhaar numbers
const _VD = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,2,3,4,0,6,7,8,9,5],
  [2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],
  [4,0,1,2,3,9,5,6,7,8],
  [5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],
  [7,6,5,9,8,2,1,0,4,3],
  [8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0]
];
const _VP = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,5,7,6,2,8,3,0,9,4],
  [5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0],
  [4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],
  [7,0,4,6,9,1,3,2,5,8]
];

export function verhoeffCheck(number) {
  const digits = String(number).replace(/\D/g, "").split("").reverse().map(Number);
  if (digits.length !== 12) return false;
  let c = 0;
  for (let i = 0; i < digits.length; i++) c = _VD[c][_VP[i % 8][digits[i]]];
  return c === 0;
}

export function hasAadhaarKeywords(text) {
  const t = String(text || "").toLowerCase();
  return (
    /aa?dh?[ao]a?r/i.test(t) ||
    /u[il1][do][ai4][il1]/i.test(t) ||
    t.includes("आधार") ||
    t.includes("भारत") ||
    (/gov/i.test(t) && /india/i.test(t)) ||
    (t.includes("unique") && t.includes("ident"))
  );
}

export function hasAadhaarSecondaryMarkers(text) {
  const t = String(text || "").toLowerCase();
  return (
    /\b(male|female|पुरुष|महिला)\b/.test(t) ||
    /\bd\.?\s*o\.?\s*b\.?\b/.test(t) ||
    t.includes("date of birth") ||
    t.includes("जन्म")
  );
}

export function extractAadhaarFromText(text) {
  const clean = String(text || "");
  const grouped = clean.match(/[2-9]\d{3}[\s\-]?\d{4}[\s\-]?\d{4}/g);
  if (grouped && grouped.length > 0) return grouped[0].replace(/[\s\-]/g, "");
  const plain = clean.replace(/[\s\-]/g, "").match(/[2-9]\d{11}/g);
  if (plain && plain.length > 0) return plain[0];
  return null;
}

export function extractDobFromText(text) {
  const clean = String(text || "");
  const labeled = clean.match(/(?:dob|date\s*of\s*birth|d\.?\s*o\.?\s*b\.?)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
  if (labeled) {
    const parts = labeled[1].match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (parts) {
      const [, dd, mm, yyyy] = parts;
      if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31 && +yyyy >= 1940 && +yyyy <= 2006)
        return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
    }
  }
  const all = [...clean.matchAll(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/g)];
  for (const m of all) {
    const [, dd, mm, yyyy] = m;
    if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31 && +yyyy >= 1940 && +yyyy <= 2006)
      return `${dd}/${mm}/${yyyy}`;
  }
  return null;
}

export function dobToInputFormat(dob) {
  const clean = String(dob || "").trim();
  if (!clean) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const ymd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
  return "";
}

const _NAME_SKIP = /government|india|uidai|unique|identification|authority|male|female|address|dob|date|birth|year|village|post|dist|state|pin|s\/o|d\/o|w\/o|c\/o|आधार|भारत|सरकार/i;

export function extractNameFromText(text) {
  const lines = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^(?:name|नाम)[:\s]+(.+)/i);
    if (match) {
      const name = match[1].trim().replace(/\s+/g, " ");
      if (name.length >= 3 && name.length <= 60 && /^[a-zA-Z\s.]+$/.test(name))
        return name.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  for (const line of lines) {
    if (/\d/.test(line)) continue;
    if (line.length < 5 || line.length > 60) continue;
    if (_NAME_SKIP.test(line)) continue;
    if (/^[A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){1,3}$/.test(line))
      return line.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
}

