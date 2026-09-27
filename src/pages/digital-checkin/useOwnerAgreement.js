import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBases, getWithFallback, postWithFallback } from "./utils";

export const useOwnerAgreement = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [loginId, setLoginId] = useState(query.get("loginId") || "");

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ownerData, setOwnerData] = useState(null);

  const [eSignName, setESignName] = useState("");
  const [accepted, setAccepted] = useState(false);

  // Load owner agreement details
  const loadAgreementData = useCallback(async () => {
    if (!loginId) {
      setLoadingData(false);
      setError("Missing loginId in URL parameter.");
      return;
    }

    try {
      setLoadingData(true);
      setError("");
      const resp = await getWithFallback(
        `/api/checkin/owner/agreement/details/${encodeURIComponent(loginId)}`,
        apiBases
      );

      if (resp && resp.success) {
        setOwnerData(resp);
        if (resp.ownerName && !eSignName) {
          setESignName(resp.ownerName);
        }
      } else {
        setError(resp?.message || "Failed to load agreement data.");
      }
    } catch (err) {
      setError(`Error loading agreement data: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  }, [apiBases, loginId, eSignName]);

  useEffect(() => {
    loadAgreementData();
  }, [loadAgreementData]);

  // Submit owner e-signature
  const handleSubmit = useCallback(
    async (signatureDataUrl) => {
      if (!accepted) {
        alert("Please accept the terms of the Hostel Onboarding & Service Agreement.");
        return;
      }
      if (!eSignName.trim()) {
        alert("Please enter your full name as E-Sign.");
        return;
      }
      if (!signatureDataUrl) {
        alert("Please provide or type your signature on the pad.");
        return;
      }

      try {
        setSubmitting(true);
        setError("");

        const payload = {
          loginId,
          eSignName: eSignName.trim(),
          accepted: true,
          signatureDataUrl,
          hostelLegalName: ownerData?.hostelLegalName || "",
          tradeName: ownerData?.tradeName || "",
          propertyAddress: ownerData?.propertyAddress || "",
          panNumber: ownerData?.panNumber || "",
          gstinNumber: ownerData?.gstinNumber || "",
          representativeName: ownerData?.ownerName || eSignName.trim()
        };

        const resp = await postWithFallback(
          "/api/checkin/owner/agreement",
          payload,
          apiBases
        );

        if (!resp.success) {
          setError(resp.message || "Failed to submit owner agreement.");
          alert(resp.message || "Failed to submit owner agreement.");
          return;
        }

        const nextUrl = resp.nextUrl || `/digital-checkin/owner-success?loginId=${encodeURIComponent(loginId)}&agreementSigned=1`;
        window.location.href = nextUrl;
      } catch (err) {
        setError(`Submission error: ${err.message}`);
        alert(`Error: ${err.message}`);
      } finally {
        setSubmitting(false);
      }
    },
    [accepted, apiBases, eSignName, loginId, ownerData]
  );

  return {
    loginId,
    setLoginId,
    eSignName,
    setESignName,
    accepted,
    setAccepted,
    submitting,
    error,
    loadingData,
    ownerData,
    handleSubmit
  };
};
