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

// A generation identifies a session without putting its credential in cache keys.
// All shared HTTP clients register their controllers here so a session change
// cancels requests across clients, including requests whose bodies are parsing.
let sessionGeneration = 0;
let sessionIdentity = null;
const sessionControllers = new Set();
const sessionListeners = new Set();

const readSessionIdentity = () => ({
  scope: isPanelRoute() ? "panel" : "website",
  token: getScopedAuthToken(),
});

const sessionChangedError = () => {
  const error = new Error("Authentication session changed. Request cancelled.");
  error.name = "AbortError";
  error.code = "AUTH_SESSION_CHANGED";
  return error;
};

export const onAuthSessionChange = (listener) => {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
};

// Call after login/logout storage writes, even when a login reuses its token.
export const invalidateAuthSession = () => {
  sessionIdentity = readSessionIdentity();
  sessionGeneration += 1;
  const controllers = [...sessionControllers];
  sessionControllers.clear();
  controllers.forEach((controller) => controller.abort(sessionChangedError()));
  sessionListeners.forEach((listener) => {
    try { listener(); } catch (_) { /* one subscriber must not prevent cancellation */ }
  });
};

export const getAuthSession = () => {
  const identity = readSessionIdentity();
  // Also detect legacy storage writes and route-scope switches before a request
  // is reused or a response is accepted. Cache keys only need the generation.
  if (!sessionIdentity) sessionIdentity = identity;
  else if (identity.scope !== sessionIdentity.scope || identity.token !== sessionIdentity.token) {
    invalidateAuthSession();
  }
  return { generation: sessionGeneration, token: sessionIdentity.token };
};

export const createAuthRequest = (session, callerSignal) => {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(callerSignal.reason);
  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  sessionControllers.add(controller);

  return {
    controller,
    assertCurrent() {
      if (getAuthSession().generation !== session.generation) throw sessionChangedError();
      if (controller.signal.aborted) {
        throw controller.signal.reason || new DOMException("Request cancelled.", "AbortError");
      }
    },
    release() {
      sessionControllers.delete(controller);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    },
  };
};

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  // Storage events fire in OTHER tabs. Comparing the effective scoped token
  // preserves sessionStorage precedence when another panel tab signs in.
  window.addEventListener("storage", () => { getAuthSession(); });
  window.addEventListener("pagehide", invalidateAuthSession);
}

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
    : ["token", "staff_token", "managerToken", "accessToken", "adminToken", "user", "staff_user", "owner_session", "owner_user", "tenant_user"];

  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
  invalidateAuthSession();
};
