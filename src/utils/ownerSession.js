const OWNER_LOGIN_ID_REGEX = /^(ROOMHY\d+|\d{10}|\d{3,6}|[a-zA-Z0-9_\-\.]+)/i;

// Roles that must never resolve to an Owner Panel session, even if a session
// object carrying one is present in storage. `manager` is intentionally absent
// from this list: pages/manager/login.jsx deliberately writes owner_session
// with role "manager" to act on behalf of its parent owner.
//
// Defence-in-depth only. Storage is attacker-controlled, so this cannot be the
// real access decision — the login gate in ownerlogin.jsx checks the role the
// backend returned, and the API enforces scope per request.
const NON_OWNER_PANEL_ROLES = new Set(["tenant", "employee", "superadmin", "admin", "areamanager"]);

const normalizeOwnerSession = (value) => {
  if (!value || typeof value !== "object") return null;
  const loginId = String(value.loginId || value.ownerLoginId || value.phone || "").trim().toUpperCase();
  if (!loginId) return null;
  const role = String(value.role || "").trim().toLowerCase();
  if (NON_OWNER_PANEL_ROLES.has(role)) return null;
  return {
    ...value,
    loginId
  };
};

export const getOwnerSession = () => {
  if (typeof window === "undefined") return null;

  // ONLY read from owner-specific keys — NOT "user" (superadmin key)
  const keys = [
    () => sessionStorage.getItem("owner_session"),
    () => localStorage.getItem("owner_session"),
  ];

  for (const read of keys) {
    try {
      const raw = read();
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const normalized = normalizeOwnerSession(parsed);
      if (normalized) return normalized;
    } catch (_) {
      // ignore bad storage values
    }
  }

  return null;
};

export const requireOwnerSession = () => {
  const owner = getOwnerSession();
  if (!owner || !owner.loginId) {
    if (typeof window !== "undefined") {
      window.location.href = "/propertyowner/ownerlogin";
    }
    return null;
  }
  return owner;
};

