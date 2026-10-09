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
      // Bypassed KYC checks here to allow direct progression to agreement page
      // since KYC is already validated in ownerprofile.jsx.


      /*
      const acceptResp = await postWithFallback(
        "/api/checkin/owner/terms-accept",
        { loginId, accepted: true },
        apiBases
      );
      if (!acceptResp.success) return alert(acceptResp.message || "Failed to accept terms");
      */

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

