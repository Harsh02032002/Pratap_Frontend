import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatAadhaarWithSpaces,
  getApiBases,
  getParamValue,
  postExpectSuccess,
  verhoeffCheck,
  hasAadhaarKeywords,
  hasAadhaarSecondaryMarkers,
  extractAadhaarFromText
} from "./utils";
import { compressImage, PRESETS } from "../../utils/imageCompression";
import { captureOwnerOnboardingLink, loadOwnerOnboardingProfile, saveOwnerOnboardingProfile } from "../../utils/ownerOnboarding";

const emptyDoc = { file: null, preview: "", name: "", type: "", uploaded: false, url: "" };

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const emptyForm = {
  loginId: "",
  name: "",
  email: "",
  area: "",
  dob: "",
  phone: "",
  address: "",
  bankName: "",
  branchName: "",
  bankAccountNumber: "",
  ifscCode: "",
  accountHolderName: "",
  upiId: "",
  vacantRooms: 0,
  vacantBeds: 0,
  occupiedRooms: 0,
  occupiedBeds: 0,
  occupiedRoomBeds: [1],
  vacantRoomBeds: [1]
};

const OWNER_KYC_STATE_KEY = "roomhy_owner_kyc_state";

const distributeBeds = (totalBeds, roomCount) => {
  const safeRoomCount = Math.max(0, Number(roomCount || 0));
  if (safeRoomCount <= 0) return [];
  const safeBeds = Math.max(0, Number(totalBeds || 0));
  const base = Math.floor(safeBeds / safeRoomCount);
  let remainder = safeBeds % safeRoomCount;
  return Array.from({ length: safeRoomCount }, () => {
    const next = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    return Math.max(1, next);
  });
};

const normalizeBedsArray = (values, count) =>
  Array.from({ length: Math.max(0, Number(count || 0)) }, (_, index) => Math.max(1, Number(values?.[index] || 1)));

const toRoomBedArrays = (roomInventory = [], fallback = emptyForm) => {
  const occupiedRoomBeds = [];
  const vacantRoomBeds = [];

  (Array.isArray(roomInventory) ? roomInventory : []).forEach((room) => {
    const beds = Array.isArray(room?.beds) ? room.beds : [];
    const occupiedBeds = beds.filter((bed) => String(bed?.status || "").toLowerCase() === "occupied").length;
    const vacantBeds = Math.max(0, beds.length - occupiedBeds);
    if (occupiedBeds > 0) occupiedRoomBeds.push(occupiedBeds);
    if (vacantBeds > 0) vacantRoomBeds.push(vacantBeds);
  });

  return {
    occupiedRoomBeds: occupiedRoomBeds.length
      ? occupiedRoomBeds
      : distributeBeds(fallback.occupiedBeds, fallback.occupiedRooms),
    vacantRoomBeds: vacantRoomBeds.length
      ? vacantRoomBeds
      : distributeBeds(fallback.vacantBeds, fallback.vacantRooms)
  };
};

export const useOwnerProfile = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const [form, setForm] = useState(emptyForm);
  const [autoInfo, setAutoInfo] = useState({ email: "", area: "" });
  const [onboardingLink] = useState(() => captureOwnerOnboardingLink());
  const [profileAccess, setProfileAccess] = useState({ loading: true, error: "" });
  const [aadhaarLinkedPhone, setAadhaarLinkedPhone] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [kycStatus, setKycStatus] = useState({ type: "", text: "" });
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [ownerPhoto, setOwnerPhoto] = useState(emptyDoc);
  const [bankProof, setBankProof] = useState(emptyDoc);
  const [aadhaarDoc, setAadhaarDoc] = useState(emptyDoc);
  const [aadhaarOcrStatus, setAadhaarOcrStatus] = useState({ loading: false, text: "", type: "" });
  const [bankOcrStatus, setBankOcrStatus] = useState({ loading: false, text: "", type: "" });
  const [docUploading, setDocUploading] = useState(false);
  const [docStatus, setDocStatus] = useState({ type: "", text: "" });

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateRoomCount = useCallback((key, value) => {
    const safeCount = Math.max(0, Number(value || 0));
    setForm((prev) => {
      const bedsKey = key === "occupiedRooms" ? "occupiedRoomBeds" : "vacantRoomBeds";
      const nextBeds = normalizeBedsArray(prev[bedsKey], safeCount);
      const next = { ...prev, [key]: safeCount, [bedsKey]: nextBeds };
      next.occupiedBeds = next.occupiedRoomBeds.reduce((sum, item) => sum + Number(item || 0), 0);
      next.vacantBeds = next.vacantRoomBeds.reduce((sum, item) => sum + Number(item || 0), 0);
      return next;
    });
  }, []);

  const updateRoomBed = useCallback((group, index, value) => {
    setForm((prev) => {
      const key = group === "occupied" ? "occupiedRoomBeds" : "vacantRoomBeds";
      const nextBeds = [...prev[key]];
      nextBeds[index] = Math.max(1, Number(value || 1));
      const next = { ...prev, [key]: nextBeds };
      next.occupiedBeds = next.occupiedRoomBeds.reduce((sum, item) => sum + Number(item || 0), 0);
      next.vacantBeds = next.vacantRoomBeds.reduce((sum, item) => sum + Number(item || 0), 0);
      return next;
    });
  }, []);

  const saveProfile = useCallback(
    async (formValue, autoInfoValue) => {
      const loginIdValue = formValue.loginId.trim();
      const emailValue = autoInfoValue.email || formValue.email.trim();
      const areaValue = autoInfoValue.area || formValue.area.trim();

      if (!loginIdValue) throw new Error("Login ID is required");
      if (!emailValue) throw new Error("Email is required");
      if (!areaValue) throw new Error("Area is required");

      const payload = {
        loginId: loginIdValue,
        name: formValue.name.trim(),
        dob: formValue.dob,
        email: emailValue,
        phone: formValue.phone.trim(),
        address: formValue.address.trim(),
        area: areaValue,
        occupiedRooms: normalizeBedsArray(formValue.occupiedRoomBeds, formValue.occupiedRooms).length,
        occupiedBeds: normalizeBedsArray(formValue.occupiedRoomBeds, formValue.occupiedRooms).reduce((sum, v) => sum + Number(v || 0), 0),
        vacantRooms: normalizeBedsArray(formValue.vacantRoomBeds, formValue.vacantRooms).length,
        vacantBeds: normalizeBedsArray(formValue.vacantRoomBeds, formValue.vacantRooms).reduce((sum, v) => sum + Number(v || 0), 0),
        roomInventory: [
          ...normalizeBedsArray(formValue.occupiedRoomBeds, formValue.occupiedRooms).map((bedCount, i) => ({
            id: `OWNER-OCC-${loginIdValue}-${i + 1}`,
            number: `Occupied Room ${i + 1}`,
            roomNo: `Occupied Room ${i + 1}`,
            title: `Occupied Room ${i + 1}`,
            type: "Occupied",
            roomType: "Occupied",
            gender: "Co-Ed",
            beds: Array.from({ length: bedCount }, (_, bi) => ({
              status: "occupied",
              tenantId: `OCC-${i + 1}-${bi + 1}`,
              tenantName: "Occupied"
            }))
          })),
          ...normalizeBedsArray(formValue.vacantRoomBeds, formValue.vacantRooms).map((bedCount, i) => ({
            id: `OWNER-VAC-${loginIdValue}-${i + 1}`,
            number: `Vacant Room ${i + 1}`,
            roomNo: `Vacant Room ${i + 1}`,
            title: `Vacant Room ${i + 1}`,
            type: "Vacant",
            roomType: "Vacant",
            gender: "Co-Ed",
            beds: Array.from({ length: bedCount }, () => ({
              status: "available",
              tenantId: "",
              tenantName: ""
            }))
          }))
        ],
        payment: {
          bankName: formValue.bankName.trim(),
          branchName: formValue.branchName.trim(),
          bankAccountNumber: formValue.bankAccountNumber.trim(),
          ifscCode: formValue.ifscCode.trim(),
          accountHolderName: formValue.accountHolderName.trim(),
          upiId: formValue.upiId.trim()
        }
      };

      const data = await saveOwnerOnboardingProfile(loginIdValue, payload);
      if (!data.success) throw new Error(data.message || "Failed to save profile");
      return payload;
    },
    [apiBases]
  );

  const saveKycState = useCallback(
    (extra = {}) => {
      try {
        sessionStorage.setItem(
          OWNER_KYC_STATE_KEY,
          JSON.stringify({
            loginId: form.loginId.trim(),
            ownerEmail: autoInfo.email || form.email.trim(),
            aadhaarLinkedPhone: aadhaarLinkedPhone.trim(),
            aadhaarNumber: aadhaarNumber.trim().replace(/\D/g, ""),
            otpSent,
            ...extra
          })
        );
      } catch (_) {}
    },
    [aadhaarLinkedPhone, aadhaarNumber, autoInfo.email, form.email, form.loginId, otpSent]
  );

  // Read URL params on mount
  useEffect(() => {
    const loginId = getParamValue(["loginId", "loginid", "staffId"]);
    const email = getParamValue(["email", "ownerEmail", "mail"]);
    const area = getParamValue(["area", "assignedArea", "location"]);
    const phone = getParamValue(["phone", "ownerPhone", "mobile", "contact"]);

    if (loginId) updateForm({ loginId });
    if (email || area || phone) updateForm({ email, area, ...(phone ? { phone } : {}) });
    if (email || area) setAutoInfo({ email, area });
  }, [updateForm]);

  // Restore session state
  useEffect(() => {
    try {
      const state = JSON.parse(sessionStorage.getItem(OWNER_KYC_STATE_KEY) || "{}");
      if (!state || typeof state !== "object") return;
      if (state.aadhaarLinkedPhone) setAadhaarLinkedPhone(state.aadhaarLinkedPhone);
      if (state.aadhaarNumber) setAadhaarNumber(formatAadhaarWithSpaces(state.aadhaarNumber));
      if (state.otpSent) setOtpSent(true);
    } catch (_) {}
  }, []);

  // Hydrate from backend — runs once per loginId
  useEffect(() => {
    let active = true;
    const hydrateFromOwner = async () => {
      const id = form.loginId.trim();
      if (!id) {
        setProfileAccess({ loading: false, error: "Open the onboarding link sent by RoomHy to access your profile." });
        return;
      }
      setProfileAccess({ loading: true, error: "" });
      try {
        const res = await loadOwnerOnboardingProfile(id, onboardingLink);
        if (!active) return;
        const owner = res?.owner || res;
        if (!owner || typeof owner !== "object") throw new Error("Owner profile is unavailable. Request a new onboarding link.");

        const nextOccupiedRooms = Number(owner.occupiedRooms ?? 0);
        const nextOccupiedBeds = Number(owner.occupiedBeds ?? 0);
        const nextVacantRooms = Number(owner.vacantRooms ?? 0);
        const nextVacantBeds = Number(owner.vacantBeds ?? 0);

        setForm((prev) => ({
          ...prev,
          name: owner.name || owner.profile?.name || prev.name || "",
          email: owner.email || owner.profile?.email || owner.checkinEmail || prev.email || "",
          area: owner.checkinArea || owner.locationCode || owner.profile?.locationCode || prev.area || "",
          dob: owner.checkinDob || prev.dob || "",
          phone: owner.phone || owner.checkinPhone || owner.profile?.phone || prev.phone || "",
          address: owner.address || owner.checkinAddress || owner.profile?.address || prev.address || "",
          bankName: owner.checkinBankName || owner.bankName || owner.profile?.bankName || prev.bankName || "",
          branchName: owner.checkinBranchName || owner.branchName || owner.profile?.branchName || prev.branchName || "",
          bankAccountNumber: owner.checkinBankAccountNumber || owner.accountNumber || owner.profile?.accountNumber || prev.bankAccountNumber || "",
          ifscCode: owner.checkinIfscCode || owner.ifscCode || owner.profile?.ifscCode || prev.ifscCode || "",
          accountHolderName: owner.checkinAccountHolderName || owner.profile?.accountHolderName || prev.accountHolderName || "",
          upiId: owner.checkinUpiId || owner.profile?.upiId || prev.upiId || "",
          vacantRooms: nextVacantRooms,
          vacantBeds: nextVacantBeds,
          occupiedRooms: nextOccupiedRooms,
          occupiedBeds: nextOccupiedBeds,
          ...toRoomBedArrays(owner.roomInventory, {
            occupiedRooms: nextOccupiedRooms,
            occupiedBeds: nextOccupiedBeds,
            vacantRooms: nextVacantRooms,
            vacantBeds: nextVacantBeds
          })
        }));

        setAutoInfo((prev) => ({
          email: prev.email || owner.email || owner.profile?.email || owner.checkinEmail || "",
          area: prev.area || owner.checkinArea || owner.locationCode || owner.profile?.locationCode || ""
        }));

        const storedAadhaar = owner.checkinAadhaarNumber || owner.kyc?.aadharNumber || owner.kyc?.aadhaarNumber || "";
        const storedPhone = owner.checkinAadhaarLinkedPhone || owner.kyc?.aadhaarLinkedPhone || "";
        if (storedAadhaar) setAadhaarNumber((prev) => prev || formatAadhaarWithSpaces(storedAadhaar));
        if (storedPhone) setAadhaarLinkedPhone((prev) => prev || storedPhone);
        if (owner.kyc?.status === "submitted") {
          setKycStatus({ type: "success", text: "Aadhaar OTP verification already completed." });
        }

        if (owner.checkinOwnerPhoto) {
          setOwnerPhoto((prev) => prev.url ? prev : { ...emptyDoc, url: owner.checkinOwnerPhoto, preview: owner.checkinOwnerPhoto, name: "", uploaded: true });
        }
        if (owner.checkinBankProof) {
          setBankProof((prev) => prev.url ? prev : { ...emptyDoc, url: owner.checkinBankProof, preview: owner.checkinBankProof, name: "", uploaded: true });
        }
        if (owner.checkinAadhaarImage) {
          setAadhaarDoc((prev) => prev.url ? prev : { ...emptyDoc, url: owner.checkinAadhaarImage, preview: owner.checkinAadhaarImage, name: "", uploaded: true });
        }
        setProfileAccess({ loading: false, error: "" });
      } catch (err) {
        if (active) setProfileAccess({ loading: false, error: err?.message || "Request a new onboarding link from RoomHy." });
      }
    };

    hydrateFromOwner();
    return () => { active = false; };
  }, [form.loginId, onboardingLink]);

  const showAutoInfo = Boolean(autoInfo.email || autoInfo.area);

  const handleAadhaarChange = useCallback((value) => {
    setAadhaarNumber(formatAadhaarWithSpaces(value));
  }, []);

  // Two-layer Aadhaar image verification — fires on file select
  const handleAadhaarImagePick = useCallback(async (file) => {
    if (!file) return;
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setAadhaarDoc({ file, preview, name: file.name, type: file.type, uploaded: false, url: "" });
    setAadhaarOcrStatus({ loading: true, text: "Scanning Aadhaar card...", type: "scanning" });

    try {
      const dataUrl = await fileToDataUrl(file);
      const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");

      // Layer 1 — Cashfree OCR via backend
      let cashfreeDone = false;
      try {
        const data = await postExpectSuccess("/api/checkin/owner/aadhaar/ocr", { image: base64 }, apiBases);
        if (data.verdict === "verified") {
          if (data.aadhaarNumber) setAadhaarNumber(formatAadhaarWithSpaces(data.aadhaarNumber));
          setAadhaarOcrStatus({ loading: false, text: "Aadhaar verified — valid card detected.", type: "verified" });
          cashfreeDone = true;
        } else if (data.verdict === "checksum_failed") {
          setAadhaarOcrStatus({ loading: false, text: "Card detected but number unclear. Try a clearer photo.", type: "suspicious" });
          cashfreeDone = true;
        } else if (data.verdict === "unreadable") {
          setAadhaarOcrStatus({ loading: false, text: "Aadhaar card detected but unreadable. Try a clearer photo.", type: "suspicious" });
          cashfreeDone = true;
        } else if (data.verdict === "invalid") {
          setAadhaarOcrStatus({ loading: false, text: "This doesn't appear to be an Aadhaar card.", type: "rejected" });
          cashfreeDone = true;
        }
        // verdict === "sandbox" → fall through to Tesseract
      } catch (_) {
        // Cashfree unreachable → fall through to Tesseract
      }

      if (cashfreeDone) return;

      // Layer 2 — Tesseract.js browser OCR fallback
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const candidate = extractAadhaarFromText(text);
      const hasKeywords = hasAadhaarKeywords(text) || hasAadhaarSecondaryMarkers(text);

      if (candidate && verhoeffCheck(candidate)) {
        try {
          await postExpectSuccess("/api/checkin/owner/aadhaar/validate", { aadhaarNumber: candidate }, apiBases);
        } catch (_) {}
        setAadhaarNumber(formatAadhaarWithSpaces(candidate));
        setAadhaarOcrStatus({ loading: false, text: "Aadhaar verified — valid card detected.", type: "verified" });
      } else if (candidate) {
        setAadhaarOcrStatus({ loading: false, text: "Aadhaar card detected but number unclear. Try a clearer photo.", type: "suspicious" });
      } else if (hasKeywords) {
        setAadhaarOcrStatus({ loading: false, text: "Aadhaar card detected but unreadable. Try a clearer photo.", type: "suspicious" });
      } else {
        setAadhaarOcrStatus({ loading: false, text: "This doesn't appear to be an Aadhaar card.", type: "rejected" });
      }
    } catch (_) {
      setAadhaarOcrStatus({ loading: false, text: "Verification failed. Please try uploading again.", type: "error" });
    }
  }, [apiBases]);

  // Bank Proof OCR verification — checks that uploaded image is a real bank document matching owner bank details
  const handleBankProofImagePick = useCallback(async (file) => {
    if (!file) return;
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setBankProof({ file, preview, name: file.name, type: file.type, uploaded: false, url: "" });

    if (!file.type.startsWith("image/")) {
      setBankOcrStatus({ loading: false, text: "PDF selected — will be verified on upload.", type: "verified" });
      return;
    }

    setBankOcrStatus({ loading: true, text: "Scanning bank proof via OCR to verify bank details...", type: "scanning" });
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const rawText = String(text || "");
      const upper = rawText.toUpperCase();
      const compactUpper = upper.replace(/[\s\-:]/g, "");
      const digitsOnly = rawText.replace(/\D/g, "");

      const bankKeywords = [
        "BANK", "ACCOUNT", "A/C", "IFSC", "BRANCH", "CHEQUE", "PASSBOOK",
        "STATEMENT", "SAVINGS", "CURRENT", "HOLDER", "PAY", "RUPEES", "MICR",
        "SBI", "STATE BANK", "HDFC", "ICICI", "AXIS", "PNB", "PUNJAB NATIONAL",
        "BARODA", "KOTAK", "CANARA", "UNION BANK", "INDUSIND", "YES BANK", "AU SMALL", "PAYTM", "FEDERAL", "IDBI", "IDFC"
      ];
      const hasBankKeyword = bankKeywords.some((kw) => upper.includes(kw));
      const ifscMatch = compactUpper.match(/[A-Z]{4}0[A-Z0-9]{6}/);
      const acctMatch = rawText.match(/\b\d{9,18}\b/);

      const expectedAcct = String(form.bankAccountNumber || "").replace(/\D/g, "");
      const expectedIfsc = String(form.ifscCode || "").trim().toUpperCase();
      const expectedBank = String(form.bankName || "").trim().toUpperCase();

      const acctLast4 = expectedAcct.length >= 4 ? expectedAcct.slice(-4) : "";
      const ifscPrefix = expectedIfsc.length >= 4 ? expectedIfsc.slice(0, 4) : "";

      const matchedAcct = Boolean(acctLast4 && digitsOnly.includes(acctLast4));
      const matchedIfsc = Boolean(
        (expectedIfsc && compactUpper.includes(expectedIfsc)) ||
        (ifscPrefix && compactUpper.includes(ifscPrefix))
      );
      const matchedBankName = Boolean(
        expectedBank && expectedBank.split(/\s+/).filter(w => w.length >= 3).some(w => upper.includes(w))
      );

      if (!hasBankKeyword && !ifscMatch && !acctMatch && !matchedAcct && !matchedIfsc) {
        setBankOcrStatus({
          loading: false,
          text: "OCR Failed: This image does not appear to be a valid Bank Proof (Passbook / Cancelled Cheque / Statement).",
          type: "rejected"
        });
        return;
      }

      if (matchedAcct || matchedIfsc) {
        const matchedParts = [];
        if (matchedAcct) matchedParts.push(`A/C ending ${acctLast4}`);
        if (matchedIfsc) matchedParts.push(`IFSC ${expectedIfsc || ifscMatch?.[0] || ""}`);
        setBankOcrStatus({
          loading: false,
          text: `Bank Proof OCR Verified (${matchedParts.join(", ")} matched).`,
          type: "verified"
        });
      } else if (hasBankKeyword || ifscMatch || acctMatch || matchedBankName) {
        if ((expectedAcct || expectedIfsc) && ifscMatch && expectedIfsc && ifscMatch[0] !== expectedIfsc) {
          setBankOcrStatus({
            loading: false,
            text: `OCR Mismatch: Detected IFSC ${ifscMatch[0]} does not match entered IFSC ${expectedIfsc}.`,
            type: "rejected"
          });
        } else {
          setBankOcrStatus({
            loading: false,
            text: "Bank document detected via OCR — Account / IFSC details verified.",
            type: "verified"
          });
        }
      } else {
        setBankOcrStatus({
          loading: false,
          text: "Could not clearly read bank details. Please upload a clearer photo of your passbook or cancelled cheque.",
          type: "suspicious"
        });
      }
    } catch (_) {
      setBankOcrStatus({ loading: false, text: "Could not scan image automatically. Ensure bank details are clearly visible.", type: "suspicious" });
    }
  }, [form.bankAccountNumber, form.bankName, form.ifscCode]);

  const handleFileSelect = useCallback((docType, file) => {
    if (!file) {
      if (docType === "ownerPhoto") setOwnerPhoto(emptyDoc);
      else if (docType === "bankProof") {
        setBankProof(emptyDoc);
        setBankOcrStatus({ loading: false, text: "", type: "" });
      }
      else if (docType === "aadhaarDoc") {
        setAadhaarDoc(emptyDoc);
        setAadhaarOcrStatus({ loading: false, text: "", type: "" });
      }
      return;
    }
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    const doc = { file, preview, name: file.name, type: file.type, uploaded: false, url: "" };
    if (docType === "ownerPhoto") setOwnerPhoto(doc);
    else if (docType === "bankProof") handleBankProofImagePick(file);
    else if (docType === "aadhaarDoc") handleAadhaarImagePick(file);
  }, [handleAadhaarImagePick, handleBankProofImagePick]);

  const handleDocumentUpload = useCallback(async () => {
    const loginId = form.loginId.trim();
    if (!loginId) return alert("Save profile first (Login ID is required)");

    if (bankProof.file && bankOcrStatus.type === "rejected") {
      return alert(bankOcrStatus.text || "Please upload a valid Bank Proof image matching your bank details.");
    }
    const hasPending = [ownerPhoto, bankProof, aadhaarDoc].some((d) => d.file && !d.uploaded);
    if (!hasPending) return alert("No new documents selected to upload");

    try {
      setDocUploading(true);
      setDocStatus({ type: "", text: "" });

      // Shrink before encoding. These go up as base64 inside a JSON body, which
      // inflates the bytes by a third on top of whatever the camera or a
      // screenshot produced — a 4MB PNG becomes a 5.6MB request, and on a
      // domestic uplink that alone was enough to stall the upload out.
      // compressImage never throws: anything it cannot handle comes back
      // unchanged, so this can only make the payload smaller or leave it as-is.
      const toPayload = async (doc, preset) => {
        if (!doc.file) return null;
        const file = preset ? await compressImage(doc.file, preset) : doc.file;
        const dataUrl = await fileToDataUrl(file);
        return { dataUrl, name: doc.name, type: doc.type };
      };

      const [ownerPhotoPayload, bankProofPayload, aadhaarPayload] = await Promise.all([
        toPayload(ownerPhoto, PRESETS.PHOTO),
        // A bank statement has to stay readable, so near-lossless and generous
        // on both axes rather than the photo budget.
        toPayload(bankProof, PRESETS.DOCUMENT),
        // Deliberately NOT compressed: this image is fed to Aadhaar OCR on the
        // server, and re-encoding it has not been validated against real
        // documents. Same call the repo's raw-upload scanner already exempts
        // for the Tesseract paths — see scripts/scanRawImageUploads.mjs.
        toPayload(aadhaarDoc, null)
      ]);

      const payload = {
        loginId,
        ownerPhoto: ownerPhotoPayload,
        bankProof: bankProofPayload,
        aadhaarImage: aadhaarPayload
      };

      const data = await postExpectSuccess("/api/checkin/owner/documents", payload, apiBases);

      if (data.ownerPhotoUrl) setOwnerPhoto((prev) => ({ ...prev, url: data.ownerPhotoUrl, uploaded: true, file: null }));
      if (data.bankProofUrl) setBankProof((prev) => ({ ...prev, url: data.bankProofUrl, uploaded: true, file: null }));
      if (data.aadhaarImageUrl) {
        setAadhaarDoc((prev) => ({ ...prev, url: data.aadhaarImageUrl, uploaded: true, file: null }));
        if (data.ocrResult?.sandbox) {
          setAadhaarOcrStatus({ loading: false, text: "✓ Aadhaar image uploaded & saved successfully.", type: "verified" });
        } else if (data.ocrResult) {
          setAadhaarOcrStatus({ loading: false, text: "Aadhaar OCR verified successfully.", type: "verified" });
        } else if (data.ocrError) {
          setAadhaarOcrStatus({ loading: false, text: `OCR: ${data.ocrError}`, type: "error" });
        }
      }

      setDocStatus({ type: "success", text: "Documents uploaded successfully." });
    } catch (err) {
      setDocStatus({ type: "error", text: `Upload failed: ${err.message}` });
    } finally {
      setDocUploading(false);
    }
  }, [apiBases, aadhaarDoc, bankProof, form.loginId, ownerPhoto]);

  const handleStartVerification = useCallback(async () => {
    const trimmedLogin = form.loginId.trim();
    const aadhaarRaw = aadhaarNumber.trim().replace(/\s/g, "");
    if (!trimmedLogin) return alert("Login ID is required");
    if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");

    try {
      await saveProfile(form, autoInfo);
      setLoadingStart(true);
      const emailValue = autoInfo.email || form.email.trim();
      const data = await postExpectSuccess(
        "/api/checkin/owner/kyc/send-otp",
        { loginId: trimmedLogin, aadhaarLinkedPhone: aadhaarLinkedPhone.trim(), aadhaarNumber: aadhaarRaw, email: emailValue },
        apiBases
      );
      setOtpSent(true);
      saveKycState({ otpSent: true });
      setKycStatus({
        type: "success",
        text: "OTP sent to your WhatsApp number. Enter it below."
      });
      setLoadingStart(false);
    } catch (err) {
      setKycStatus({ type: "error", text: `Error: ${err.message}` });
      setLoadingStart(false);
    }
  }, [aadhaarLinkedPhone, aadhaarNumber, apiBases, autoInfo, form, saveKycState, saveProfile]);

  const handleCompleteVerification = useCallback(async () => {
    const trimmedLogin = form.loginId.trim();
    const aadhaarRaw = aadhaarNumber.trim().replace(/\s/g, "");

    if (!trimmedLogin) return alert("Login ID is required");
    if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");
    if (!otp.trim()) return alert("OTP is required");

    try {
      setLoadingComplete(true);
      const payload = await saveProfile(form, autoInfo);
      saveKycState({ otpSent: true });
      await postExpectSuccess(
        "/api/checkin/owner/kyc/verify-otp",
        { loginId: trimmedLogin, aadhaarNumber: aadhaarRaw, otp: otp.trim() },
        apiBases
      );
      window.location.href = `/digital-checkin/owneragreement?loginId=${encodeURIComponent(payload.loginId)}&email=${encodeURIComponent(payload.email)}`;
    } catch (err) {
      setKycStatus({ type: "error", text: `Error: ${err.message}` });
      setLoadingComplete(false);
    }
  }, [aadhaarNumber, apiBases, autoInfo, form, otp, saveKycState, saveProfile]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        await saveProfile(form, autoInfo);
        setKycStatus({
          type: "success",
          text: "Profile saved. Upload documents and complete Aadhaar verification below."
        });
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    },
    [autoInfo, form, saveProfile]
  );

  return {
    form,
    updateForm,
    updateRoomCount,
    updateRoomBed,
    autoInfo,
    profileAccess,
    showAutoInfo,
    aadhaarLinkedPhone,
    setAadhaarLinkedPhone,
    aadhaarNumber,
    handleAadhaarChange,
    otp,
    setOtp,
    otpSent,
    kycStatus,
    loadingStart,
    loadingComplete,
    handleStartVerification,
    handleCompleteVerification,
    handleSubmit,
    ownerPhoto,
    bankProof,
    bankOcrStatus,
    aadhaarDoc,
    aadhaarOcrStatus,
    docUploading,
    docStatus,
    handleFileSelect,
    handleDocumentUpload
  };
};
