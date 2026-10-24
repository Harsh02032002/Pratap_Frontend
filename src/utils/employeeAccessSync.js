import { fetchJson, getApiBase, getScopedAuthToken } from "./api";
import { getFirstAllowedEmployeeRoute, hasEmployeePermission } from "./employeePermissions";

export const ACCESS_UPDATED_EVENT = "roomhy-access-updated";

export function readPanelUser() {
  const keys = ["manager_user", "user", "staff_user"];
  for (const key of keys) {
    try {
      const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.role || parsed.loginId)) return parsed;
      }
    } catch (_) { /* ignore */ }
  }
  return null;
}

function writePanelUser(user) {
  const raw = JSON.stringify(user);
  ["user", "staff_user"].forEach((key) => {
    try { sessionStorage.setItem(key, raw); } catch (_) { /* ignore */ }
    try { localStorage.setItem(key, raw); } catch (_) { /* ignore */ }
  });
  try { sessionStorage.setItem("manager_user", raw); } catch (_) { /* ignore */ }
}

const sameAccess = (prev, next) => {
  const list = (v) => JSON.stringify([...(Array.isArray(v) ? v : [])].map(String).sort());
  const actionsStr = (a) => JSON.stringify(a || null);
  return list(prev?.permissions) === list(next?.permissions)
    && list(prev?.restrictedModules) === list(next?.restrictedModules)
    && actionsStr(prev?.actions) === actionsStr(next?.actions)
    && String(prev?.team || "") === String(next?.team || "")
    && String(prev?.permissionSource || "") === String(next?.permissionSource || "");
};

/**
 * Pull the latest role matrix into the open employee session and tell the
 * sidebar to redraw. Does not log the employee out.
 * Returns the merged user, or null when nothing changed.
 */
export async function refreshEmployeeAccess() {
  const prev = readPanelUser();
  const role = String(prev?.role || "").toLowerCase();
  if (!prev?.loginId || !["employee", "areamanager"].includes(role)) return null;

  const res = await fetchJson("/api/auth/me");
  const next = res?.user;
  if (!next) return null;

  if (next.isActive === false) {
    try { sessionStorage.clear(); localStorage.clear(); } catch (_) { /* ignore */ }
    window.location.replace("/employee/index?expired=1");
    return null;
  }

  if (sameAccess(prev, next)) return null;

  const merged = { ...prev, ...next, role: prev.role || next.role };
  writePanelUser(merged);
  window.dispatchEvent(new CustomEvent(ACCESS_UPDATED_EVENT, { detail: merged }));
  return merged;
}

/**
 * Socket room is the employee loginId (see chatSocket join_room). Superadmin
 * role edits emit `staff_access_updated` into that room. A slow poll covers a
 * missed socket.
 */
export function subscribeEmployeeAccess(onChange) {
  const user = readPanelUser();
  const role = String(user?.role || "").toLowerCase();
  if (!user?.loginId || !["employee", "areamanager"].includes(role)) return () => {};

  let cancelled = false;
  let socket = null;

  const pull = async () => {
    try {
      const merged = await refreshEmployeeAccess();
      if (!cancelled && merged && onChange) onChange(merged);
    } catch (_) { /* keep the current session */ }
  };

  import("socket.io-client").then(({ io }) => {
    if (cancelled) return;
    // The socket server rejects an unauthenticated handshake (socket/socketAuth.js), so without
    // the token `staff_access_updated` never arrived and only the 20 s poll refreshed access.
    socket = io(getApiBase(), {
      transports: ["websocket", "polling"],
      reconnection: true,
      auth: { token: getScopedAuthToken() },
    });
    const join = () => socket.emit("join_room", {
      login_id: user.loginId,
      role: "employee",
      name: user.name || user.loginId,
    });
    socket.on("connect", join);
    socket.on("staff_access_updated", pull);
    if (socket.connected) join();
  }).catch(() => {});

  // Also refresh the moment the tab becomes visible again (laptop sleep, tab switch).
  const onVisible = () => { if (document.visibilityState === "visible") pull(); };
  document.addEventListener("visibilitychange", onVisible);

  pull();
  const timer = setInterval(pull, 20000);
  return () => {
    cancelled = true;
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
    try { socket?.disconnect(); } catch (_) { /* ignore */ }
  };
}

export function redirectIfAccessRevoked(user, pathname, navigate) {
  const path = pathname || window.location.pathname;
  if (!path.startsWith("/employee/") || path === "/employee/index") return;
  if (hasEmployeePermission(user, path)) return;
  const dest = getFirstAllowedEmployeeRoute(user);
  if (dest && dest !== path) navigate(dest, { replace: true });
}
