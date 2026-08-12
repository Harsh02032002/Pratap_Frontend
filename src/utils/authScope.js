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

// The JWT that is valid for the current route, or null.
export const getScopedAuthToken = (pathname = currentPath()) => {
  if (isWebsiteRoute(pathname)) {
    // Website: its own token only — never the panel `token`.
    return read("website_token") || read("accessToken") || null;
  }

  // Panels: sessionStorage first so an owner (tab A) and their staff (tab B)
  // can stay signed in at the same time in one browser.
  return read("token") || read("accessToken") || null;
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
