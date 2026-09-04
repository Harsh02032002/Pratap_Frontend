import React, { useEffect, useState } from "react";
import PropertyOwnerLayout from "./propertyowner/PropertyOwnerLayout";
import { getStaffSession, setStaffSession, clearStaffSession, UNIFIED_LOGIN_PATH } from "../utils/staffAccess";
import { getOwnerRuntimeSession } from "../utils/propertyowner";
import { fetchJson } from "../utils/api";

// There is ONE panel — the Property Owner Panel. `StaffLayout` is now just a thin
// wrapper that renders the staff self-service pages (Dashboard, Attendance, Daily
// Tasks) inside that same panel, using the staff-proxy session so the sidebar is
// automatically permission-filtered. The old standalone dark staff shell is gone.

// Decodes a JWT's exp claim (seconds since epoch) into a ms timestamp.
function getTokenExpiryMs(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp ? payload.exp * 1000 : null;
  } catch (_) {
    return null;
  }
}

function forceSessionExpiredLogout() {
  clearStaffSession();
  window.location.href = `${UNIFIED_LOGIN_PATH}?expired=1`;
}

export default function StaffLayout({ children, title }) {
  const [ready, setReady] = useState(false);
  // Bumped after a session refresh so the header re-reads the updated record.
  const [sessionVersion, setSessionVersion] = useState(0);

  useEffect(() => {
    const session = getStaffSession();
    if (!session?.loginId) {
      window.location.href = UNIFIED_LOGIN_PATH;
      return;
    }
    setReady(true);
  }, []);

  // The staff session is a snapshot taken at login. A photo, name or permission
  // the owner changes afterwards never reaches a staff member who is already
  // signed in — which is why an uploaded profile photo kept showing as an
  // initial until they happened to log in again. Re-hydrate from the server on
  // mount so the header reflects the current record.
  useEffect(() => {
    let cancelled = false;
    if (!ready) return;
    // StaffLayout remounts on every staff page, and the photo is a ~125KB base64
    // data URL, so refetching per navigation would be pure waste. Once per tab
    // is enough to pick up a change the owner made since login.
    try {
      if (sessionStorage.getItem("staff_session_refreshed") === "1") return;
      sessionStorage.setItem("staff_session_refreshed", "1");
    } catch (_) { /* storage unavailable — fall through and refresh once */ }
    (async () => {
      try {
        const res = await fetchJson("/api/employees/me");
        const fresh = res?.data;
        if (cancelled || !fresh?.loginId) return;
        const current = getStaffSession() || {};
        setStaffSession(fresh);
        // Only re-render when something the UI shows actually moved.
        if (current.photoDataUrl !== fresh.photoDataUrl || current.name !== fresh.name) {
          setSessionVersion((v) => v + 1);
        }
      } catch (_) {
        // Offline or endpoint unavailable — keep using the stored session.
      }
    })();
    return () => { cancelled = true; };
  }, [ready]);

  // Proactively log the staff member out the moment their JWT expires.
  useEffect(() => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) return;
    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) return;
    const msLeft = expiryMs - Date.now();
    if (msLeft <= 0) { forceSessionExpiredLogout(); return; }
    const timer = setTimeout(forceSessionExpiredLogout, msLeft);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;

  // sessionVersion is read here so a refreshed session re-resolves the proxy.
  void sessionVersion;
  const owner = getOwnerRuntimeSession();

  return (
    <PropertyOwnerLayout
      owner={owner}
      title={title}
      onLogout={() => { clearStaffSession(); window.location.href = UNIFIED_LOGIN_PATH; }}
    >
      {children}
    </PropertyOwnerLayout>
  );
}
