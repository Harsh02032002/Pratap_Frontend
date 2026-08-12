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
  "/digital-checkin"
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

// Sessions the website login used to fabricate when the backend REJECTED the
// credentials ("demo_token_<timestamp>"). They are not JWTs, so every request
// made with one fails — the page then looks signed in but silently renders
// nothing. The login no longer creates these, but they persist in the
// localStorage of anyone who hit the old code, so treat them as absent.
const isFabricatedToken = (token) => /^demo_token_/i.test(String(token || ""));

// The JWT that is valid for the current route, or null.
export const getScopedAuthToken = (pathname = currentPath()) => {
  const token = isWebsiteRoute(pathname)
    ? // Website: its own token only — never the panel `token`.
      read("website_token") || read("accessToken")
    : // Panels: sessionStorage first so an owner (tab A) and their staff (tab B)
      // can stay signed in at the same time in one browser.
      read("token") || read("accessToken");

  if (!token || isFabricatedToken(token)) return null;
  return token;
};

// True when storage holds a session that can never authenticate, so the caller
// can clear it and show a signed-out state instead of a broken signed-in one.
export const hasFabricatedSession = (pathname = currentPath()) => {
  const raw = isWebsiteRoute(pathname)
    ? read("website_token") || read("accessToken")
    : read("token") || read("accessToken");
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
    return JSON.parse(raw);
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
  "employee",
  "manager",
  "owner"
]);

export const isAdminRole = (role) => ADMIN_ROLES.has(String(role || "").toLowerCase());

export const clearScopedSession = (pathname = currentPath()) => {
  const keys = isWebsiteRoute(pathname)
    ? ["website_token", "website_user", "accessToken"]
    : ["token", "user", "staff_user"];

  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
};
