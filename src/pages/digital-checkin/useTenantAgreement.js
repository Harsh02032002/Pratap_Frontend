import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBases, getWithFallback, postExpectSuccess } from "./utils";

export const useTenantAgreement = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const [loginId, setLoginId] = useState("");
  const [eSignName, setESignName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [tenantData, setTenantData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("loginId")) setLoginId(params.get("loginId"));
  }, []);

  useEffect(() => {
    if (!loginId.trim()) return;
    setLoadingData(true);
    getWithFallback(`/api/checkin/tenant/profile/${encodeURIComponent(loginId.trim())}`, apiBases)
      .then((data) => setTenantData(data?.tenant || data || null))
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [loginId, apiBases]);

  const handleSubmit = useCallback(async (signatureDataUrl = "") => {
    setError("");
    if (!loginId.trim() || !eSignName.trim() || !accepted) {
      setError("Login ID, e-sign name and acceptance are required");
      return;
    }
    if (!signatureDataUrl) {
      setError("Please draw your signature before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const agreementResp = await postExpectSuccess(
        "/api/checkin/tenant/agreement",
        {
          loginId: loginId.trim(),
          eSignName: eSignName.trim(),
          accepted: true,
          signatureDataUrl,
          frontendUrl: window.location.origin,
          frontendHost: window.location.host,
          origin: window.location.origin
        },
        apiBases
      );
      let nextUrl = agreementResp?.nextUrl ||
        `/digital-checkin/tenant-confirmation?loginId=${encodeURIComponent(loginId.trim())}`;
      try {
        const u = new URL(nextUrl, window.location.origin);
        nextUrl = u.pathname + u.search;
      } catch (_) { }
      window.location.href = nextUrl;
    } catch (err) {
      setError(err.message || "Unable to submit tenant agreement");
    } finally {
      setSubmitting(false);
    }
  }, [accepted, apiBases, eSignName, loginId]);

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
    tenantData,
    handleSubmit
  };
};
