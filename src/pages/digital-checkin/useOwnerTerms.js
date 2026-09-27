import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBases, getWithFallback, postWithFallback } from "./utils";

export const useOwnerTerms = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [loginId] = useState(query.get("loginId") || "");
  const [status, setStatus] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [finalConfirmation, setFinalConfirmation] = useState(null);

  useEffect(() => {
    if (!loginId) {
      setStatus("Missing loginId in URL.");
    }
  }, [loginId]);

  const handleSubmit = useCallback(async () => {
    if (!acceptTerms) return alert("Please accept terms first");
    try {
      const checkinResp = await getWithFallback(`/api/checkin/owner/${encodeURIComponent(loginId)}`, apiBases);
      const ownerResp = await getWithFallback(`/api/owners/${encodeURIComponent(loginId)}`, apiBases);
      const kyc = checkinResp?.record?.ownerKyc || {};
      const ownerKycStatus = ownerResp?.kyc?.status || "";
      const kycVerified = Boolean(kyc.otpVerified || kyc.digilockerVerified || ownerKycStatus === "submitted");
      if (!kycVerified) {
        return alert("Complete KYC verification first (OTP or DigiLocker), then submit.");
      }

      const acceptResp = await postWithFallback(
        "/api/checkin/owner/terms-accept",
        { loginId, accepted: true },
        apiBases
      );
      if (!acceptResp.success) return alert(acceptResp.message || "Failed to accept terms");

      // Redirect to Owner-Roomhy Agreement E-Sign page
      window.location.href = `/digital-checkin/owneragreement?loginId=${encodeURIComponent(loginId)}`;
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }, [acceptTerms, apiBases, loginId]);

  return {
    status,
    acceptTerms,
    setAcceptTerms,
    handleSubmit,
    finalConfirmation,
    loginId
  };
};

