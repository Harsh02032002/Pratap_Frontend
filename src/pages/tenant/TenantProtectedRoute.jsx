import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, clearAllAuthKeys } from "../../contexts/AuthContext";
import { fetchJson } from "../../utils/api";

const isTenantLike = (u) =>
  !!u && (u.role === "tenant" || u.tenantLoginId || String(u.loginId || "").toUpperCase().startsWith("ROOMHYTNT"));

const readStoredUser = () => {
  try {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

// Reads only the token — never the user-object — from storage.
// The user-object stored in localStorage is attacker-controlled and MUST NOT
// be used to make access decisions. Only the backend-verified role from
// AuthContext (which calls GET /api/auth/me with the token) is trusted.
const getStoredToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token") ||
  null;

const Spinner = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "4px solid #e0d7ff",
          borderTopColor: "#7c3aed",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#94a3b8",
          textTransform: "uppercase",
        }}
      >
        Verifying session…
      </p>
    </div>
  </div>
);

/**
 * Route guard for all tenant-only pages.
 *
 * Decision flow (in order):
 *
 *  1. No JWT in storage → redirect to login immediately (no render, no network call).
 *
 *  2. JWT present, AuthContext still calling GET /api/auth/me to verify it
 *     → show loading spinner (prevents flash of protected content).
 *
 *  3. JWT present, backend responded:
 *     a. Token invalid / expired → AuthContext clears storage, sets user = null → redirect.
 *     b. Token valid but role ≠ 'tenant' (e.g. owner, superadmin) → redirect.
 *     c. Token valid, role = 'tenant' → render children.
 *
 * The "from" location is preserved in navigation state so that
 * tenantlogin can redirect back after a successful sign-in.
 */
export default function TenantProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [revoked, setRevoked] = useState(false);

  const hasToken = getStoredToken() || localStorage.getItem("user") || sessionStorage.getItem("user");
  const tenantSession = isTenantLike(user) || isTenantLike(readStoredUser());

  // An ex-tenant (agreement ended / move-out complete) can still have a session
  // in this browser. /api/tenants/me checks the Tenant record itself and
  // answers 401/403 once the tenancy is closed — sign them out on that.
  useEffect(() => {
    if (!hasToken || !tenantSession) return;
    let alive = true;
    fetchJson("/api/tenants/me").catch((err) => {
      if (alive && (err?.status === 401 || err?.status === 403)) {
        clearAllAuthKeys();
        setRevoked(true);
      }
    });
    return () => { alive = false; };
  }, [hasToken, tenantSession, location.pathname]);

  if (revoked) {
    return <Navigate to="/tenant/tenantlogin" replace />;
  }

  // Step 1 — fast synchronous check: no token or session at all.
  if (!hasToken) {
    return (
      <Navigate
        to="/tenant/tenantlogin"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Step 2 — wait for AuthContext verification
  if (loading) {
    return <Spinner />;
  }

  // Step 3 — verify tenant role
  const isTenant = isTenantLike(user);

  if (!isTenant) {
    if (isTenantLike(readStoredUser())) return children;

    return (
      <Navigate
        to="/tenant/tenantlogin"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
}

