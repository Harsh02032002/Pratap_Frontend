import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatAadhaarWithSpaces,
  getApiBases,
  getParamValue,
  getWithFallback,
  postExpectSuccess,
  postWithFallback
} from "./utils";
import { broadcastStatusChange } from "../../utils/liveStatusSync";

const OWNER_KYC_STATE_KEY = "roomhy_owner_kyc_state";

export const useOwnerKyc = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const [loginId, setLoginId] = useState("");
  const [aadhaarLinkedPhone, setAadhaarLinkedPhone] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [digilockerRef, setDigilockerRef] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [otpMsg, setOtpMsg] = useState({ type: "", text: "" });
  const [nextVisible, setNextVisible] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [lastRefId, setLastRefId] = useState("");

  useEffect(() => {
    const initialLoginId = getParamValue(["loginId", "loginid", "staffId"]);
    const initialEmail = getParamValue(["email", "ownerEmail", "mail"]);
    if (initialLoginId) setLoginId(initialLoginId);
    if (initialEmail) setOwnerEmail(initialEmail);
  }, []);

  useEffect(() => {
    try {
      const state = JSON.parse(sessionStorage.getItem(OWNER_KYC_STATE_KEY) || "{}");
      if (!state || typeof state !== "object") return;
      if (!loginId && state.loginId) setLoginId(state.loginId);
      if (state.aadhaarLinkedPhone) setAadhaarLinkedPhone(state.aadhaarLinkedPhone);
      if (state.aadhaarNumber) setAadhaarNumber(state.aadhaarNumber);
      if (state.referenceId) {
        setDigilockerRef(state.referenceId);
        setLastRefId(state.referenceId);
      }
      if (!ownerEmail && state.ownerEmail) setOwnerEmail(state.ownerEmail);
    } catch (_) {}
  }, [loginId, ownerEmail]);

  const saveKycState = useCallback(
    (extra = {}) => {
      try {
        const payload = {
          loginId: loginId.trim(),
          aadhaarLinkedPhone: aadhaarLinkedPhone.trim(),
          aadhaarNumber: aadhaarNumber.trim().replace(/\D/g, ""),
          ownerEmail,
          referenceId: digilockerRef.trim() || lastRefId || "",
          ...extra
        };
        sessionStorage.setItem(OWNER_KYC_STATE_KEY, JSON.stringify(payload));
      } catch (_) {}
    },
    [aadhaarLinkedPhone, aadhaarNumber, digilockerRef, lastRefId, loginId, ownerEmail]
  );

  useEffect(() => {
    const referenceFromCallback = getParamValue(["reference_id", "ref_id", "referenceId"]);
    const verificationFromCallback = getParamValue(["verification_id", "verificationId"]);
    if (referenceFromCallback) {
      setDigilockerRef(referenceFromCallback);
      setLastRefId(referenceFromCallback);
      saveKycState({ referenceId: referenceFromCallback, verificationId: verificationFromCallback || "" });
      setOtpMsg({ type: "success", text: "DigiLocker callback received. Click Complete Verification." });
    }
  }, [saveKycState]);

  useEffect(() => {
    const hydrateOwnerEmail = async () => {
      if (!loginId || ownerEmail) return;
      try {
        const owner = await getWithFallback(`/api/owners/${encodeURIComponent(loginId)}`, apiBases);
        const email = (owner?.email || owner?.profile?.email || owner?.checkinEmail || "").trim();
        if (email) setOwnerEmail(email);
      } catch (_) {}
    };
    hydrateOwnerEmail();
  }, [apiBases, loginId, ownerEmail]);

  const handleAadhaarChange = useCallback((value) => {
    setAadhaarNumber(formatAadhaarWithSpaces(value));
  }, []);

  const handleStart = useCallback(async () => {
    const trimmedLogin = loginId.trim();
    const aadhaarRaw = aadhaarNumber.trim().replace(/\s/g, "");
    if (!trimmedLogin) return alert("Login ID is missing. Please check the URL.");
    if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");

    try {
      setLoadingStart(true);
      const emailPart = ownerEmail ? `&email=${encodeURIComponent(ownerEmail)}` : "";
      const redirectUrl = `${window.location.origin}${window.location.pathname}?loginId=${encodeURIComponent(
        trimmedLogin
      )}${emailPart}`;
      const data = await postExpectSuccess(
        "/api/checkin/owner/kyc/digilocker/start",
        {
          loginId: trimmedLogin,
          aadhaarLinkedPhone: aadhaarLinkedPhone.trim(),
          aadhaarNumber: aadhaarRaw,
          email: ownerEmail,
          redirectUrl
        },
        apiBases
      );

      const referenceId = data.referenceId || "";
      setLastRefId(referenceId);
      setDigilockerRef(referenceId);
      saveKycState({ referenceId, verificationId: data.verificationId || "" });
      setOtpMsg({
        type: "success",
        text: "DigiLocker verification initiated. Complete it and click Complete Verification."
      });
      if (data.verifyUrl) {
        window.location.href = data.verifyUrl;
      }
    } catch (err) {
      setOtpMsg({ type: "error", text: `Error: ${err.message}` });
      setLoadingStart(false);
    }
  }, [aadhaarLinkedPhone, aadhaarNumber, apiBases, loginId, ownerEmail, saveKycState]);

  const handleComplete = useCallback(async () => {
    const trimmedLogin = loginId.trim();
    const aadhaarRaw = aadhaarNumber.trim().replace(/\s/g, "");
    const referenceId = digilockerRef.trim() || lastRefId;

    if (!trimmedLogin) return alert("Login ID is missing");
    if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");
    if (!referenceId) return alert("DigiLocker reference ID is required");

    try {
      saveKycState({ referenceId });
      setLoadingComplete(true);
      await postExpectSuccess(
        "/api/checkin/owner/kyc/digilocker/complete",
        { loginId: trimmedLogin, aadhaarNumber: aadhaarRaw, referenceId },
        apiBases
      );
      broadcastStatusChange({ type: "kyc", loginId: trimmedLogin, kycStatus: "completed" });
      setOtpMsg({ type: "success", text: "DigiLocker verification completed successfully." });
      setNextVisible(true);
    } catch (err) {
      setOtpMsg({ type: "error", text: `Error: ${err.message}` });
      setLoadingComplete(false);
    }
  }, [aadhaarNumber, apiBases, digilockerRef, lastRefId, loginId, saveKycState]);

  const handleNext = useCallback(() => {
    const emailPart = ownerEmail ? `&email=${encodeURIComponent(ownerEmail)}` : "";
    window.location.href = `/digital-checkin/ownerterms?loginId=${encodeURIComponent(loginId.trim())}${emailPart}`;
  }, [loginId, ownerEmail]);

  return {
    loginId,
    setLoginId,
    ownerEmail,
    aadhaarLinkedPhone,
    setAadhaarLinkedPhone,
    aadhaarNumber,
    handleAadhaarChange,
    digilockerRef,
    setDigilockerRef,
    otpMsg,
    nextVisible,
    loadingStart,
    loadingComplete,
    handleStart,
    handleComplete,
    handleNext
  };
};

