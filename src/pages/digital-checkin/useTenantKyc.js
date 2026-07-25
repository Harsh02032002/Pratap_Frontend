import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBases, getWithFallback, postExpectSuccess, postWithFallback } from "./utils";
import { useAadhaarOcr } from "./useAadhaarOcr";

const TENANT_KYC_STATE_KEY = "roomhy_tenant_kyc_state";

export const useTenantKyc = () => {
  const apiBases = useMemo(() => getApiBases(), []);

  const [loginId, setLoginId]                       = useState("");
  const [aadhaarNumber, setAadhaarNumber]           = useState("");
  const [aadhaarLinkedPhone, setAadhaarLinkedPhone] = useState("");
  const [tenantPhone, setTenantPhone]               = useState(""); // read-only, from DB
  const [tenantProfile, setTenantProfile]           = useState(null); // full pre-filled profile
  const [otp, setOtp]                               = useState("");
  const [otpMsg, setOtpMsg]                         = useState("");
  const [nextVisible, setNextVisible]               = useState(false);
  const [otpSent, setOtpSent]                       = useState(false);
  const [otpLoading, setOtpLoading]                 = useState(false); // prevents double-submit
  const [uploading, setUploading]                   = useState(false);
  const [uploadedUrls, setUploadedUrls]             = useState({});
  const [fetchingProfile, setFetchingProfile]       = useState(false);
  const [errors, setErrors]                         = useState({});
  const [mismatchDetails, setMismatchDetails]       = useState("");

  const { frontOcr, backOcr, checkImage, resetOcr } = useAadhaarOcr(apiBases, "tenant");

  // Read loginId from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("loginId");
    if (id) setLoginId(id);
  }, []);

  // Fetch full tenant profile to auto-fill ALL fields
  useEffect(() => {
    if (!loginId) return;
    const load = async () => {
      setFetchingProfile(true);
      try {
        const data = await getWithFallback(
          `/api/checkin/tenant/profile/${encodeURIComponent(loginId.trim().toUpperCase())}`,
          apiBases
        );
        const t = data?.tenant || data;
        if (t) {
          setTenantProfile(t);
          const phone = t.phone || t.guardianNumber || "";
          if (phone) {
            setTenantPhone(phone);
            setAadhaarLinkedPhone(phone);
          }
          // Prefill Aadhaar number if owner entered or if existing
          const existingAadhaar = (
            t.aadhaarNumber ||
            t.idProofNumber ||
            t.kyc?.aadhaarNumber ||
            t.kycVerificationData?.adminEnteredAadhaar ||
            t.aadhar ||
            ""
          ).replace(/\D/g, "");
          if (existingAadhaar) {
            setAadhaarNumber(existingAadhaar);
          }

          // Prefill existing uploaded documents so tenant can view/remove/replace them
          const existingFront = t.digitalCheckin?.documents?.aadhaarFrontUrl || t.kyc?.aadhaarFront || t.aadhaarFront || "";
          const existingBack = t.digitalCheckin?.documents?.aadhaarBackUrl || t.kyc?.aadhaarBack || t.aadhaarBack || "";
          const existingPhoto = t.digitalCheckin?.documents?.tenantPhotoUrl || t.kyc?.tenantPhoto || t.photo || "";
          
          if (existingFront || existingBack || existingPhoto) {
            setUploadedUrls((prev) => ({
              ...prev,
              ...(existingFront ? { aadhaarFrontUrl: existingFront } : {}),
              ...(existingBack ? { aadhaarBackUrl: existingBack } : {}),
              ...(existingPhoto ? { tenantPhotoUrl: existingPhoto } : {})
            }));
          }
        }

      } catch (_) {
        // Non-blocking — phone may be entered manually if fetch fails
      } finally {
        setFetchingProfile(false);
      }
    };
    load();
  }, [loginId, apiBases]);


  const saveKycState = useCallback(
    (extra = {}) => {
      try {
        sessionStorage.setItem(TENANT_KYC_STATE_KEY, JSON.stringify({
          loginId: loginId.trim(),
          aadhaarNumber: aadhaarNumber.trim().replace(/\D/g, ""),
          aadhaarLinkedPhone: aadhaarLinkedPhone.trim(),
          otpSent,
          ...extra
        }));
      } catch (_) {}
    },
    [aadhaarLinkedPhone, aadhaarNumber, loginId, otpSent]
  );

  useEffect(() => {
    try {
      const state = JSON.parse(sessionStorage.getItem(TENANT_KYC_STATE_KEY) || "{}");
      if (!state || typeof state !== "object") return;
      if (!loginId && state.loginId) setLoginId(state.loginId);
      if (state.otpSent) setOtpSent(true);
    } catch (_) {}
  }, [loginId]);

  // Validate all required fields + uploads; returns error map (empty = valid)
  const validate = useCallback(
    (aadhaarFront, aadhaarBack) => {
      const errs = {};
      const aadhaarRaw = aadhaarNumber.trim().replace(/\D/g, "");
      if (!aadhaarRaw) {
        errs.aadhaarNumber = "Aadhaar number is required";
      } else if (!/^\d{12}$/.test(aadhaarRaw)) {
        errs.aadhaarNumber = "Aadhaar number must be exactly 12 digits";
      } else if (!/^[2-9]/.test(aadhaarRaw)) {
        errs.aadhaarNumber = "Invalid Aadhaar number (must start with 2–9)";
      }
      if (!aadhaarLinkedPhone.trim()) {
        errs.aadhaarLinkedPhone = "Mobile number is required — please contact your owner if missing";
      }
      if (!aadhaarFront) {
        errs.aadhaarFront = "Please upload the front side of your Aadhaar card";
      }
      if (!aadhaarBack) {
        errs.aadhaarBack = "Please upload the back side of your Aadhaar card";
      }
      // OCR mismatch — only block if OCR actually read a number and it doesn't match
      if (
        frontOcr.status === "verified" &&
        frontOcr.aadhaarNumber &&
        aadhaarRaw &&
        frontOcr.aadhaarNumber !== aadhaarRaw
      ) {
        errs.aadhaarNumber = `Number doesn't match image (image shows ${frontOcr.aadhaarNumber.slice(0,4)} **** ${frontOcr.aadhaarNumber.slice(-4)})`;
      }
      return errs;
    },
    [aadhaarLinkedPhone, aadhaarNumber, frontOcr]
  );

  // Called when an image is selected — runs OCR; auto-fills Aadhaar number directly from card image
  const handleImageOcr = useCallback(
    async (fileOrBase64, side) => {
      if (!fileOrBase64) { resetOcr(side); return; }
      setErrors((prev) => ({ ...prev, [side === "front" ? "aadhaarFront" : "aadhaarBack"]: "" }));
      const extractedNum = await checkImage(fileOrBase64, side);
      if (extractedNum) {
        setAadhaarNumber(extractedNum);
      }
    },
    [checkImage, resetOcr]
  );


  // Uploads all provided images to Cloudinary via tenant/documents endpoint
  const uploadDocuments = useCallback(
    async (aadhaarFront, aadhaarBack, tenantPhoto) => {
      const hasAny = aadhaarFront || aadhaarBack || tenantPhoto;
      if (!hasAny || !loginId.trim()) return {};
      setUploading(true);
      try {
        const data = await postWithFallback(
          "/api/checkin/tenant/documents",
          { loginId: loginId.trim(), aadhaarFront, aadhaarBack, tenantPhoto },
          apiBases
        );
        const urls = {
          aadhaarFrontUrl:     data?.aadhaarFrontUrl     || "",
          aadhaarBackUrl:      data?.aadhaarBackUrl      || "",
          tenantPhotoUrl:      data?.tenantPhotoUrl      || "",
          ocrExtractedAadhaar: data?.ocrExtractedAadhaar || ""
        };
        setUploadedUrls(urls);
        return urls;
      } catch (err) {
        console.warn("[useTenantKyc] Document upload failed (non-blocking):", err.message);
        return {};
      } finally {
        setUploading(false);
      }
    },
    [apiBases, loginId]
  );

  const handleStart = useCallback(
    async (aadhaarFront = "", aadhaarBack = "", tenantPhoto = "") => {
      // Validate everything before touching the API
      const errs = validate(aadhaarFront, aadhaarBack);
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setOtpLoading(true);
      setOtpMsg("");
      try {
        const aadhaarRaw = aadhaarNumber.trim().replace(/\D/g, "");

        // Upload documents in parallel with OTP request
        const uploadPromise = uploadDocuments(aadhaarFront, aadhaarBack, tenantPhoto);

        const data = await postExpectSuccess(
          "/api/checkin/tenant/kyc/send-otp",
          {
            loginId:            loginId.trim(),
            aadhaarNumber:      aadhaarRaw,
            aadhaarLinkedPhone: aadhaarLinkedPhone.trim()
            // Images are NOT sent here — they go to tenant/documents (Cloudinary) separately
          },
          apiBases
        );

        await uploadPromise;

        setOtpSent(true);
        saveKycState({ otpSent: true });
        setOtpMsg(
          data?.mockOtp
            ? `OTP sent. Sandbox mock OTP: ${data.mockOtp}`
            : `OTP sent to ${aadhaarLinkedPhone.trim()}. Enter it below to complete verification.`
        );
      } catch (err) {
        setOtpMsg(`Failed to send OTP: ${err.message}`);
      } finally {
        setOtpLoading(false);
      }
    },
    [aadhaarLinkedPhone, aadhaarNumber, apiBases, loginId, saveKycState, uploadDocuments, validate]
  );

  const handleComplete = useCallback(
    async (aadhaarFront = "", aadhaarBack = "", tenantPhoto = "") => {
      const aadhaarRaw = aadhaarNumber.trim().replace(/\D/g, "");
      if (!/^\d{12}$/.test(aadhaarRaw)) return setOtpMsg("Aadhaar number must be 12 digits");
      if (!otp.trim()) return setOtpMsg("Please enter the OTP");

      // Compute Aadhaar OCR Mismatch against Owner's Pre-filled Record
      const ownerExpectedAadhaar = (
        tenantProfile?.idProofNumber ||
        tenantProfile?.aadhaarNumber ||
        tenantProfile?.kyc?.aadhaarNumber ||
        tenantProfile?.kyc?.aadhar ||
        tenantProfile?.kycVerificationData?.adminEnteredAadhaar ||
        tenantProfile?.idProof?.number ||
        ""
      ).replace(/\D/g, "");

      const scannedCardAadhaar = (frontOcr?.aadhaarNumber || "").replace(/\D/g, "");

      const isAadhaarMatch = (expected, scanned) => {
        if (!expected || !scanned) return true;
        const expClean = String(expected).replace(/\D/g, "");
        const scnClean = String(scanned).replace(/\D/g, "");
        if (!expClean || !scnClean) return true;
        if (expClean === scnClean) return true;
        if (scnClean.length === 8 && expClean.length === 12) {
          return expClean.startsWith(scnClean.slice(0, 4)) && expClean.endsWith(scnClean.slice(4, 8));
        }
        if (expClean.length === 8 && scnClean.length === 12) {
          return scnClean.startsWith(expClean.slice(0, 4)) && scnClean.endsWith(expClean.slice(4, 8));
        }
        return false;
      };

      const mismatchReasons = [];

      // Check 1: Uploaded Card vs Owner Record
      if (ownerExpectedAadhaar && scannedCardAadhaar && !isAadhaarMatch(ownerExpectedAadhaar, scannedCardAadhaar)) {
        mismatchReasons.push(`Aadhaar Card image mismatch: Owner Record (${ownerExpectedAadhaar}) vs Scanned Card Image (${scannedCardAadhaar})`);
      }
      // Check 2: Entered Number vs Owner Record
      if (ownerExpectedAadhaar && aadhaarRaw && !isAadhaarMatch(ownerExpectedAadhaar, aadhaarRaw)) {
        mismatchReasons.push(`Aadhaar Number mismatch: Owner Record (${ownerExpectedAadhaar}) vs Submitted Number (${aadhaarRaw})`);
      }

      const isMismatch = mismatchReasons.length > 0;
      const targetKycStatus = isMismatch ? "mismatch_review" : "audit_pending";
      setMismatchDetails(mismatchReasons.join("; "));



      try {
        const payload = {
          loginId:         loginId.trim(),
          aadhaarNumber:   aadhaarRaw,
          otp:             otp.trim(),
          aadhaarFront:    uploadedUrls.aadhaarFrontUrl || aadhaarFront,
          aadhaarBack:     uploadedUrls.aadhaarBackUrl  || aadhaarBack,
          tenantPhoto:     uploadedUrls.tenantPhotoUrl  || tenantPhoto,
          kycStatus:       targetKycStatus,
          mismatchReasons: mismatchReasons.join("; ")
        };
        saveKycState({ otpSent: true });
        await postExpectSuccess("/api/checkin/tenant/kyc/verify-otp", payload, apiBases);

        // Update local cache
        try {
          const upperLogin = String(payload.loginId || "").toUpperCase();
          const tenants = JSON.parse(localStorage.getItem("roomhy_tenants") || "[]");
          const idx = tenants.findIndex((t) => String(t.loginId || "").toUpperCase() === upperLogin);
          if (idx > -1) {
            tenants[idx].kycStatus = targetKycStatus;
            tenants[idx].kyc = {
              ...(tenants[idx].kyc || {}),
              aadhaarNumber:   payload.aadhaarNumber,
              aadhar:          payload.aadhaarNumber,
              aadhaarFront:    payload.aadhaarFront,
              aadhaarBack:     payload.aadhaarBack,
              otpVerified:     true,
              otpVerifiedAt:   new Date().toISOString(),
              mismatchReasons: payload.mismatchReasons
            };
            if (payload.tenantPhoto) tenants[idx].photo = payload.tenantPhoto;
            localStorage.setItem("roomhy_tenants", JSON.stringify(tenants));
          }
        } catch (_) {}

        if (isMismatch) {
          setOtpMsg("KYC Submitted! Mismatch detected between entered details and Aadhaar image. Owner will review and verify your onboarding.");
        } else {
          setOtpMsg("KYC verification completed successfully!");
        }
        setNextVisible(true);
      } catch (err) {
        setOtpMsg(`Verification failed: ${err.message}`);
      }
    },
    [aadhaarNumber, apiBases, frontOcr, loginId, otp, saveKycState, uploadedUrls]
  );


  const handleNext = useCallback(() => {
    window.location.href = `/digital-checkin/tenantagreement?loginId=${encodeURIComponent(loginId.trim())}`;
  }, [loginId]);

  return {
    loginId, setLoginId,
    aadhaarNumber, setAadhaarNumber,
    aadhaarLinkedPhone,           // read-only, from DB — do NOT expose setter to UI
    tenantPhone,                  // original value from DB
    tenantProfile,
    fetchingProfile,
    otp, setOtp,
    otpMsg, nextVisible, otpSent, otpLoading, uploading,
    uploadedUrls, setUploadedUrls, mismatchDetails,
    frontOcr, backOcr, handleImageOcr,
    errors, setErrors,
    handleStart, handleComplete, handleNext
  };
};

