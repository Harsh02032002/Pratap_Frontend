import { useCallback, useState } from "react";
import { postExpectSuccess } from "./utils";
import { recognizeOcrText } from "../../utils/tesseractOcr";
import {
  extractAadhaarFromText,
  hasAadhaarKeywords,
  hasAadhaarSecondaryMarkers,
  verhoeffCheck
} from "./utils";

// Two-layer Aadhaar image verification — same pattern as useOwnerProfile.js
//   Layer 1: Cashfree OCR via backend (non-sandbox env)
//   Layer 2: Tesseract.js browser OCR (sandbox fallback or Cashfree unavailable)
// Works for both owner and tenant — pass role="owner" or role="tenant".
export const useAadhaarOcr = (apiBases, role = "tenant") => {
  const [frontOcr, setFrontOcr] = useState({ status: "idle" });
  const [backOcr, setBackOcr]   = useState({ status: "idle" });

  const checkImage = useCallback(
    async (fileOrBase64, side) => {
      if (!fileOrBase64) return null;
      const setter = side === "front" ? setFrontOcr : setBackOcr;
      setter({ status: "loading" });

      // Normalise: backend needs base64-only string; Tesseract can accept File or data URL
      const isFile = fileOrBase64 instanceof File;
      const tesseractSrc = fileOrBase64; // File or data URL — both work with Tesseract
      const base64Only = isFile
        ? null // skip backend OCR when only File is available (no base64 strip needed)
        : fileOrBase64.replace(/^data:[^;]+;base64,/, "");

      // Layer 1 — Cashfree OCR via backend (needs base64 string)
      let cashfreeDone = false;
      if (base64Only) {
        try {
          const data = await postExpectSuccess(
            `/api/checkin/${role}/aadhaar/ocr`,
            { image: base64Only },
            apiBases
          );
          if (data.verdict === "verified") {
            setter({ status: "verified", aadhaarNumber: data.aadhaarNumber || "" });
            cashfreeDone = true;
            return data.aadhaarNumber || null;
          } else if (data.verdict === "checksum_failed" || data.verdict === "unreadable") {
            setter({ status: "unreadable" });
            cashfreeDone = true;
            return null;
          } else if (data.verdict === "invalid") {
            setter({ status: "rejected", message: "This doesn't appear to be an Aadhaar card." });
            cashfreeDone = true;
            return null;
          }
          // verdict === "sandbox" → fall through to Tesseract
        } catch (_) {
          // Backend unreachable → fall through to Tesseract
        }
      }

      if (cashfreeDone) return null;

      // Layer 2 — Tesseract.js browser OCR (sandbox fallback or File-only input)
      try {
        setter({ status: "loading", message: "Reading card with OCR…" });
        let text = await recognizeOcrText(tesseractSrc, { apiBases });
        let candidate = extractAadhaarFromText(text);
        if ((!candidate || !verhoeffCheck(candidate)) && tesseractSrc instanceof Blob) {
          try {
            const rawText = await recognizeOcrText(tesseractSrc, { raw: true, apiBases });
            const merged = text + "\n" + rawText;
            const mergedCandidate = extractAadhaarFromText(merged);
            if (mergedCandidate && (verhoeffCheck(mergedCandidate) || !candidate)) {
              candidate = mergedCandidate;
            }
            text = merged;
          } catch (_) {}
        }
        const hasKeywords = hasAadhaarKeywords(text) || hasAadhaarSecondaryMarkers(text);

        if (candidate && verhoeffCheck(candidate)) {
          setter({ status: "verified", aadhaarNumber: candidate });
          return candidate;
        } else if (candidate) {
          setter({ status: "unreadable", message: "Card detected but number unclear — try a clearer photo." });
        } else if (hasKeywords) {
          setter({ status: "unreadable", message: "Aadhaar detected but unreadable — try a clearer photo." });
        } else {
          setter({ status: "rejected", message: "This doesn't appear to be an Aadhaar card." });
        }
      } catch (err) {
        setter({ status: "error", message: "Verification failed. Please try again." });
      }
      return null;
    },
    [apiBases, role]
  );

  const resetOcr = useCallback((side) => {
    if (!side || side === "front") setFrontOcr({ status: "idle" });
    if (!side || side === "back")  setBackOcr({ status: "idle" });
  }, []);

  return { frontOcr, backOcr, checkImage, resetOcr };
};
