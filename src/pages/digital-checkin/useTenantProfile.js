import { useCallback, useEffect, useMemo, useState } from "react";
import { cleanPropertyName, getApiBases, getWithFallback, isLocalHost } from "./utils";

const EMPTY = {
  loginId: "",
  // personal — tenant fills
  name: "", email: "", phone: "", dob: "",
  permanentAddress: "", guardianNumber: "", backupEmail: "",
  // property — owner-locked if set
  propertyName: "", propertyAddress: "", roomNo: "", accommodationType: "",
  // financial — owner-locked if set
  agreedRent: "", securityDeposit: "", moveInDate: "",
  licenseDuration: "", licenseEndDate: "",
  licenseFeeDueDate: "5", moveOutCharges: "0", noticePeriodCharges: "0",
  inclusions: "", minimumStayDuration: "3 Months", gstCharges: "0",
  propertyAddress: "", permanentAddress: ""
};

function calcEndDate(startDate, durationStr) {
  if (!startDate || !durationStr) return "";
  // Extract the first number from strings like "3 months", "11 Months", "4"
  const match = String(durationStr).match(/(\d+)/);
  const months = match ? parseInt(match[1], 10) : NaN;
  if (!months || isNaN(months)) return "";
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// All fields except backupEmail are locked — tenant cannot change what the owner set
const OWNER_FIELDS = [
  "name", "email", "phone", "dob", "permanentAddress", "guardianNumber",
  "propertyName", "roomNo", "agreedRent", "moveInDate",
  "accommodationType", "securityDeposit", "minimumStayDuration", "licenseFeeDueDate",
  "licenseDuration", "moveOutCharges", "noticePeriodCharges", "inclusions", "gstCharges",
  "propertyAddress", "licenseEndDate"
];

export const useTenantProfile = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const apiBase = useMemo(
    () => (import.meta.env?.VITE_API_URL || (isLocalHost() ? "http://localhost:5001" : "https://roohmy-backend-xwa9.vercel.app")),
    []
  );
  const [form, setForm] = useState(EMPTY);
  const [locked, setLocked] = useState({});        // { fieldName: true } for owner-set fields
  const [loading, setLoading] = useState(false);

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  // Read loginId from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("loginId");
    if (id) updateForm({ loginId: id.toUpperCase() });
  }, [updateForm]);

  // Prefill from backend when loginId is known
  useEffect(() => {
    const loginId = (form.loginId || "").trim().toUpperCase();
    if (!loginId) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      let tenant = null;
      let cachedTenant = null;

      // 1. Try local cache FIRST for owner-submitted tenant profile
      try {
        const cachedList = JSON.parse(localStorage.getItem("roomhy_tenants") || "[]");
        cachedTenant = cachedList.find((t) => String(t.loginId || "").toUpperCase() === loginId) || null;
      } catch (_) {}

      // 2. Try the dedicated profile GET endpoint
      try {
        const data = await getWithFallback(
          `/api/checkin/tenant/profile/${encodeURIComponent(loginId)}`,
          apiBases
        );
        tenant = data?.tenant || data || null;
      } catch (_) {}

      // 3. Fallback: /api/tenants
      if (!tenant && !cachedTenant) {
        try {
          const res = await fetch(`${apiBase}/api/tenants`);
          const data = await res.json().catch(() => ({}));
          const list = Array.isArray(data) ? data : Array.isArray(data.tenants) ? data.tenants : [];
          tenant = list.find((t) => String(t.loginId || "").toUpperCase() === loginId) || null;
        } catch (_) {}
      }

      // Merge cached tenant & fetched tenant cleanly so non-empty fields are preserved
      const cleanedCached = {};
      if (cachedTenant) {
        for (const [k, v] of Object.entries(cachedTenant)) {
          if (v !== "" && v !== null && v !== undefined) cleanedCached[k] = v;
        }
      }
      const cleanedFetched = {};
      if (tenant) {
        for (const [k, v] of Object.entries(tenant)) {
          if (v !== "" && v !== null && v !== undefined) cleanedFetched[k] = v;
        }
      }
      const merged = { ...(tenant || {}), ...(cachedTenant || {}), ...cleanedFetched, ...cleanedCached };

      if ((!tenant && !cachedTenant) || cancelled) { setLoading(false); return; }

      const profile   = merged.digitalCheckin?.profile  || {};
      const details   = merged.digitalCheckin?.agreementDetails || {};
      const kycData   = merged.kycVerificationData || {};
      const kycInfo   = merged.kyc || {};
      const emergency = merged.emergencyContact || {};

      // Resolve property name
      const rawPropName = merged.propertyTitle || profile.propertyName || merged.propertyName || merged.property?.name || merged.property?.title || "";
      let propertyName = cleanPropertyName(rawPropName);
      if (!propertyName && merged.propertyId) {
        try {
          const res = await fetch(`${apiBase}/api/properties`);
          if (res.ok) {
            const pd = await res.json().catch(() => ({}));
            const match = (Array.isArray(pd?.properties) ? pd.properties : [])
              .find((p) => String(p._id || p.id || "") === String(merged.propertyId));
            propertyName = cleanPropertyName(match && (match.title || match.name));
          }
        } catch (_) {}
      }

      const rentRaw   = merged.agreedRent || profile.agreedRent || merged.rent || merged.roomRent || "";
      const rentDisplay = rentRaw ? `INR ${rentRaw}` : "";

      const patch = {
        name:               merged.name || merged.fullName || profile.name || kycData.adminEnteredName || "",
        email:              merged.email || profile.email || "",
        phone:              merged.phone || merged.mobile || profile.phone || kycData.adminEnteredPhone || "",
        dob:                merged.dob || profile.dob || kycData.adminEnteredDob || "",
        guardianNumber:     merged.guardianNumber || profile.guardianNumber || merged.emergencyNumber || emergency.phone || merged.additionalDetails?.emergencyPhone || "",
        permanentAddress:   details.permanentAddress || profile.permanentAddress || merged.permanentAddress || merged.address || kycInfo.permanentAddress || kycData.adminEnteredAddress || merged.additionalDetails?.permanentAddress || "",
        backupEmail:        details.backupEmail || merged.backupEmail || "",
        propertyName:       propertyName || "Roomhy Stay",
        propertyAddress:    details.propertyAddress || merged.propertyAddress || merged.property?.address || "",
        roomNo:             merged.roomNo || merged.roomNumber || profile.roomNo || (merged.room?.number ? `Room ${merged.room.number}` : ""),
        accommodationType:  details.accommodationType || profile.accommodationType || merged.sharingType || merged.roomType || merged.room?.type || "Double Sharing",
        agreedRent:         rentDisplay,
        securityDeposit:    (details.securityDeposit != null && details.securityDeposit !== "" && details.securityDeposit !== "0")
          ? String(details.securityDeposit)
          : (merged.securityDepositTotal ? String(merged.securityDepositTotal) : (merged.deposit ? String(merged.deposit) : (merged.property?.pricing?.securityDeposit || merged.property?.securityDeposit || ""))),
        moveInDate:         merged.moveInDate ? String(merged.moveInDate).slice(0, 10) : (profile.moveInDate || new Date().toISOString().slice(0, 10)),
        licenseDuration:    details.licenseDuration || merged.licenseDuration || "11 Months",
        licenseEndDate:     details.licenseEndDate  || merged.licenseEndDate || "",
        licenseFeeDueDate:  details.licenseFeeDueDate || merged.licenseFeeDueDate || "5",
        moveOutCharges:     details.moveOutCharges  != null ? String(details.moveOutCharges)  : "0",
        noticePeriodCharges:details.noticePeriodCharges != null ? String(details.noticePeriodCharges) : "0",
        inclusions:         details.inclusions      || profile.inclusions      || merged.inclusions || "WiFi, Housekeeping",
        minimumStayDuration:details.minimumStayDuration|| merged.minimumStayDuration || "3 Months",
        gstCharges:         details.gstCharges      != null ? String(details.gstCharges) : "0"
      };
      if (!cancelled) {
        updateForm(patch);
        // All OWNER_FIELDS are always locked — tenant cannot edit anything the owner set
        const lockedMap = {};
        for (const f of OWNER_FIELDS) lockedMap[f] = true;
        setLocked(lockedMap);
        setLoading(false);
      }
    })();


    return () => { cancelled = true; };
  }, [form.loginId, apiBase, apiBases, updateForm]);

  // Auto-calculate licenseEndDate when moveInDate or licenseDuration changes
  useEffect(() => {
    if (!form.licenseDuration || !form.moveInDate) return;
    const computed = calcEndDate(form.moveInDate, form.licenseDuration);
    if (computed && computed !== form.licenseEndDate) {
      setForm((prev) => ({ ...prev, licenseEndDate: computed }));
    }
  }, [form.licenseDuration, form.moveInDate]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const rentRaw = (form.agreedRent || "").replace(/[^\d.]/g, "");
      const payload = {
        loginId:             form.loginId.trim().toUpperCase(),
        name:                form.name.trim(),
        email:               form.email.trim(),
        phone:               form.phone.trim(),
        dob:                 form.dob,
        guardianNumber:      form.guardianNumber.trim(),
        moveInDate:          form.moveInDate,
        permanentAddress:    form.permanentAddress.trim(),
        backupEmail:         form.backupEmail.trim(),
        accommodationType:   form.accommodationType.trim(),
        propertyAddress:     form.propertyAddress.trim(),
        securityDeposit:     form.securityDeposit.trim(),
        licenseDuration:     form.licenseDuration.trim(),
        licenseEndDate:      form.licenseEndDate.trim(),
        licenseFeeDueDate:   form.licenseFeeDueDate.trim() || "5",
        moveOutCharges:      form.moveOutCharges.trim(),
        noticePeriodCharges: form.noticePeriodCharges.trim(),
        inclusions:          form.inclusions.trim(),
        minimumStayDuration: form.minimumStayDuration.trim() || "3 Months",
        gstCharges:          form.gstCharges.trim() || "0",
        propertyName:        form.propertyName.trim(),
        roomNo:              form.roomNo.trim(),
        agreedRent:          rentRaw ? Number(rentRaw) : null
      };

      const res = await fetch(`${apiBase}/api/checkin/tenant/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) return alert(data.message || "Failed to save profile");

      window.location.href = `/digital-checkin/tenantkyc?loginId=${encodeURIComponent(payload.loginId)}`;
    },
    [apiBase, form]
  );

  return { form, updateForm, locked, loading, handleSubmit };
};
