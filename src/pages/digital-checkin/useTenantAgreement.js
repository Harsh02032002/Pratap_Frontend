import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBases, getWithFallback, postExpectSuccess } from "./utils";

// GET for the extension endpoint. Unlike getWithFallback, a backend answer of
// { success:false, message } (e.g. 400/403/410) is final and its message is kept,
// instead of being overwritten by the next base's failure. Only an unreachable
// base or a bare 404 (route missing on that deployment) moves on to the next base.
const getExtensionJson = async (path, bases) => {
  let lastErr = null;
  for (const base of bases) {
    let res;
    try {
      res = await fetch(`${base}${path}`);
    } catch (err) {
      lastErr = err;
      continue;
    }
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) return data;
    const err = new Error(data?.message || `HTTP ${res.status}`);
    if (data?.message || res.status !== 404) throw err;
    lastErr = err;
  }
  throw lastErr || new Error("Request failed");
};

export const useTenantAgreement = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const [loginId, setLoginId] = useState("");
  const [eSignName, setESignName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [tenantData, setTenantData] = useState(null);
  // Agreement-extension mode: ?ext=<signedToken> from the extension email link.
  const [extToken] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("ext") || ""; } catch (_) { return ""; }
  });
  const [extension, setExtension] = useState(null);
  const [extensionError, setExtensionError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("loginId")) setLoginId(params.get("loginId"));
  }, []);

  useEffect(() => {
    if (!loginId.trim()) return;
    if (extToken) {
      setLoadingData(true);
      setExtensionError("");
      getExtensionJson(
        `/api/checkin/tenant/extension?token=${encodeURIComponent(extToken)}&loginId=${encodeURIComponent(loginId.trim())}`,
        apiBases
      )
        .then((data) => {
          setExtension(data?.extension || null);
          const t = data?.tenant || {};
          setTenantData({
            ...t,
            digitalCheckin: { agreementDetails: data?.agreementDetails || {} }
          });
        })
        .catch((err) => setExtensionError(err.message || "Unable to load extension details"))
        .finally(() => setLoadingData(false));
      return;
    }
    setLoadingData(true);
    getWithFallback(`/api/checkin/tenant/profile/${encodeURIComponent(loginId.trim())}`, apiBases)
      .then((data) => setTenantData(data?.tenant || data || null))
      .catch(() => { })
      .finally(() => setLoadingData(false));
  }, [loginId, apiBases, extToken]);

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
    if (extToken) {
      try {
        await postExpectSuccess(
          "/api/checkin/tenant/extension/sign",
          {
            token: extToken,
            loginId: loginId.trim(),
            eSignName: eSignName.trim(),
            accepted: true,
            signatureDataUrl
          },
          apiBases
        );
        window.location.href =
          `/digital-checkin/tenant-confirmation?loginId=${encodeURIComponent(loginId.trim())}` +
          `&extension=${encodeURIComponent(extension?.number ?? "")}`;
      } catch (err) {
        setError(err.message || "Unable to sign agreement extension");
      } finally {
        setSubmitting(false);
      }
      return;
    }
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
  }, [accepted, apiBases, eSignName, extToken, extension, loginId]);

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
    handleSubmit,
    extToken,
    extension,
    extensionError
  };
};
