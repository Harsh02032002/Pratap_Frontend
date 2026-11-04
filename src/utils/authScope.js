// Auth scoping between the staff/owner panels and the public website.
//
// Every panel login (superadmin, owner, employee, manager, tenant panel) stores
// its JWT under the shared `token` key. The public website stores its tenant
// session under `website_token` / `website_user` instead.
//
// Because localStorage is shared across tabs, a panel token outlives the tab it
// was created in. Any code that reads `token` first — and falls back to the
// website keys only when it is missing — will therefore authenticate website
// visitors as whoever last signed into a panel on that browser. That is exactly
// how a website login ended up showing "Super Admin".
//
// The rule: the route decides which credential is in scope, and the website
// NEVER falls back to a panel token.

const PANEL_ROUTE_PREFIXES = [
  "/superadmin",
  "/employee",
  "/propertyowner",
  "/owner-panel",
  "/staff-panel",
  "/staff",
  "/manager",
  "/tenant",
  "/admin",
  "/digital-checkin",
  "/visit",
  "/visits",
  "/areaadmin",
  "/attendance",
  "/dashboard"
];

const currentPath = () => {
  try {
    return window.location.pathname || "/";
  } catch {
    return "/";
  }
};

// Segment-aware so "/staff-panel" does not match the "/staff" prefix.
export const isPanelRoute = (pathname = currentPath()) => {
  const path = String(pathname || "/").toLowerCase();
  return PANEL_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
};

export const isWebsiteRoute = (pathname = currentPath()) => !isPanelRoute(pathname);

const read = (key) => {
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
  } catch {
    return null;
  }
};

const readPanelToken = () => {
  return (
    read("token") ||
    read("staff_token") ||
    read("managerToken") ||
    read("accessToken") ||
    read("adminToken")
  );
};

// Sessions the website/tenant/owner logins used to fabricate client-side when
// the real login AND the temp-password retry both failed ("demo_token_...",
// "tenant_token_...", "owner_token_..." followed by Date.now()). None of these
// are real JWTs, so every request made with one fails — the page then looks
// signed in but silently renders nothing, and (for tenant/owner) the forced
// password-change step never ran. The logins no longer create these, but they
// persist in the localStorage of anyone who hit the old code, so treat them
// as absent and force those sessions to sign in again for real.
const isFabricatedToken = (token) => /^(demo|tenant|owner)_token_\d+$/i.test(String(token || ""));

// The JWT that is valid for the current route, or null.
export const getScopedAuthToken = (pathname = currentPath()) => {
  let token = null;

  if (isPanelRoute(pathname)) {
    token = readPanelToken();
  } else {
    // Website route: ONLY read website_token, NEVER fallback to panel tokens (token / staff_token / accessToken)
    token = read("website_token");
  }

  if (!token || isFabricatedToken(token)) return null;
  return token;
};

// True when storage holds a session that can never authenticate, so the caller
// can clear it and show a signed-out state instead of a broken signed-in one.
export const hasFabricatedSession = (pathname = currentPath()) => {
  const raw = isWebsiteRoute(pathname)
    ? read("website_token")
    : readPanelToken();
  return isFabricatedToken(raw);
};

// The stored user object for the current route, or null. Never use this for
// access decisions — it is attacker-controlled. Roles must come from the
// backend via GET /api/auth/me.
export const getScopedStoredUser = (pathname = currentPath()) => {
  const raw = isWebsiteRoute(pathname)
    ? read("website_user")
    : read("user") || read("staff_user");

  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (isWebsiteRoute(pathname) && parsed) {
      if (isAdminRole(parsed.role) || parsed.team || /^RY[A-Z0-9]+/i.test(String(parsed.loginId || ""))) {
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
};

// Roles that must never be presented as a website (tenant) identity, even if a
// panel token somehow resolves on a website route.
const ADMIN_ROLES = new Set([
  "superadmin",
  "admin",
  "areamanager",
  "area_manager",
  "employee",
  "staff",
  "manager",
  "owner",
  "propertyowner",
  "field_executive",
  "field executive",
  "field_agent",
  "field agent",
  "accountant",
  "support_agent",
  "support agent"
]);

export const isAdminRole = (role) => ADMIN_ROLES.has(String(role || "").trim().toLowerCase());

export const clearScopedSession = (pathname = currentPath()) => {
  // Panel logins also mirror the session into role-specific keys read
  // directly by getOwnerSession()/getOwnerRuntimeSession() and similar
  // helpers (owner_session, owner_user, tenant_user) — those must be purged
  // too, or a stale fabricated session on those keys would survive even
  // after the generic token/user keys are cleared.
  const keys = isWebsiteRoute(pathname)
    ? ["website_token", "website_user", "accessToken"]
    : ["token", "user", "staff_user", "owner_session", "owner_user", "tenant_user"];

  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
};
