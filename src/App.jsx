import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TranslationProvider } from './contexts/TranslationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import routes from "./routes";
import { getOwnerSession } from "./utils/ownerSession";
import SharedShell from "./components/SharedShell";
import { OwnerPanelShell } from "./components/propertyowner/OwnerPanelErrorBoundary";
import TenantProtectedRoute from "./pages/tenant/TenantProtectedRoute";
import { getStaffSession, setStaffSession, clearStaffSession, canAccessOwnerPathAsStaff, STAFF_HOME_PATH, UNIFIED_LOGIN_PATH } from "./utils/staffAccess";
import { fetchJson } from "./utils/api";
import { hasEmployeePermission, getFirstAllowedEmployeeRoute } from "./utils/employeePermissions";
import { Toaster } from "react-hot-toast";
import InstallPWA from "./components/InstallPWA";

// Routes that require the user to be an authenticated tenant.
// /tenant/tenantlogin and /visitor-verify are deliberately excluded (public).
const PROTECTED_TENANT_PATHS = new Set([
  "/tenant/tenantdashboard",
  "/tenant/tenantcomplints",
  "/tenant/tenantchat",
  "/tenant/tenantagreement",
]);

const PageLoader = () => (
  <div className="min-h-[40vh] flex items-center justify-center px-4 py-12 text-sm text-slate-500">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      <p className="font-bold tracking-widest uppercase text-[10px]">Loading Roomhy...</p>
    </div>
  </div>
);

const resolveHostHome = () => {
  if (typeof window === "undefined") return "/website/index";
  const host = (window.location.hostname || "").toLowerCase();

  const readStoredUser = () => {
    const keys = ["user", "staff_user", "manager_user"];
    for (const key of keys) {
      try {
        const sessionValue = sessionStorage.getItem(key);
        if (sessionValue) return JSON.parse(sessionValue);
      } catch (_) {
        // ignore bad storage values
      }
      try {
        const localValue = localStorage.getItem(key);
        if (localValue) return JSON.parse(localValue);
      } catch (_) {
        // ignore bad storage values
      }
    }
    return null;
  };

  const staffUser = readStoredUser();
  const role = String(staffUser?.role || "").toLowerCase();
  const owner = getOwnerSession();
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1") || !host.includes(".");

  if (role === "tenant" || String(staffUser?.loginId || "").toUpperCase().startsWith("ROOMHYTNT")) {
    return "/tenant/tenantdashboard";
  }

  // Staff (owner-scoped employees, including wardens) live in `staff_session`,
  // not any of the keys readStoredUser()/getOwnerSession() check — without this,
  // any redirect to "/" bounces a logged-in staff member to the public website
  // instead of back into their dashboard.
  const staffSession = getStaffSession();
  if (staffSession?.loginId && !owner?.loginId) {
    return STAFF_HOME_PATH;
  }

  if (host === "admin.roomhy.com" || host === "www.admin.roomhy.com") {
    if (role === "superadmin" || role === "admin") return "/superadmin/superadmin";
    if (role === "manager") {
      const hasManagerSession =
        !!sessionStorage.getItem("managerToken") ||
        !!localStorage.getItem("managerToken") ||
        !!localStorage.getItem("managerData");
      if (hasManagerSession) return "/propertyowner/admin";
    }
    if (role === "areamanager" || role === "employee") return "/employee/areaadmin";
    return "/superadmin/index";
  }
  if (host === "app.roomhy.com" || host === "www.app.roomhy.com") {
    if (owner?.loginId) return "/propertyowner/admin";
    return "/propertyowner/index";
  }

  // On localhost — default to website homepage for normal users/visitors
  if (isLocalhost) {
    if (role === "superadmin" || role === "admin") return "/superadmin/superadmin";
    if (role === "manager") {
      const hasManagerSession =
        !!sessionStorage.getItem("managerToken") ||
        !!localStorage.getItem("managerToken") ||
        !!localStorage.getItem("managerData");
      if (hasManagerSession) return "/propertyowner/admin";
    }
    if (role === "areamanager" || role === "employee") return "/employee/areaadmin";
    if (owner?.loginId) return "/propertyowner/admin";
    return "/";
  }

  return "/";
};

const HtmlRedirectOrHome = () => {
  const location = useLocation();
  const path = location.pathname || "";
  if (path.endsWith(".html")) {
    const clean = path.replace(/\.html$/i, "");
    return <Navigate to={clean || "/"} replace />;
  }
  return <Navigate to={resolveHostHome()} replace />;
};

const ManagerRouteGuard = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const getActiveRole = () => {
      const keys = ["user", "staff_user", "manager_user", "managerData"];
      for (const key of keys) {
        try {
          const val = sessionStorage.getItem(key) || localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && parsed.role) return String(parsed.role).toLowerCase();
          }
        } catch (_) { }
      }
      return "";
    };

    const activeRole = getActiveRole();
    if (activeRole !== "manager") return;

    const currentPath = location.pathname || "";
    const blockedPrefixes = ["/superadmin/", "/staff"];
    const isBlockedRoute = blockedPrefixes.some((prefix) => currentPath.startsWith(prefix)) &&
      !["/superadmin", "/superadmin/", "/superadmin/index"].includes(currentPath);

    if (isBlockedRoute) {
      window.location.replace("/propertyowner/admin");
    }
  }, [location.pathname]);

  return null;
};

const RouteRoleGuard = () => {
  const location = useLocation();
  const { user: authUser, loading } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loading) return;

    const path = location.pathname || '';

    // Only guard admin/employee routes
    const isAdminRoute = path.startsWith('/superadmin/') && path !== '/superadmin/index';
    const isEmployeeRoute = path.startsWith('/employee/');
    if (!isAdminRoute && !isEmployeeRoute) return;

    const getStoredUserObj = () => {
      const keys = ["staff_user", "user", "manager_user"];
      for (const k of keys) {
        try {
          const val = sessionStorage.getItem(k) || localStorage.getItem(k);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && parsed.role) return parsed;
          }
        } catch (_) {}
      }
      return authUser || null;
    };

    const userObj = getStoredUserObj();
    const role = String(userObj?.role || "").toLowerCase();

    // Owner session must not access admin panels unless they are logged in as superadmin/admin
    const owner = getOwnerSession();
    if (owner?.loginId && role !== 'superadmin' && role !== 'admin') {
      window.location.replace('/propertyowner/admin');
      return;
    }

    if (role === 'areamanager' || role === 'employee' || role === 'manager') {
      if (isAdminRoute) {
        const empPath = path.replace('/superadmin/', '/employee/');
        window.location.replace(empPath);
        return;
      }

      if (isEmployeeRoute && path !== '/employee/index') {
        if (!hasEmployeePermission(userObj, path)) {
          const fallback = getFirstAllowedEmployeeRoute(userObj);
          if (fallback && fallback !== path) {
            window.location.replace(fallback);
          } else if (path !== '/employee/areaadmin') {
            window.location.replace('/employee/areaadmin');
          }
        }
      }
      return;
    }

    if (isAdminRoute && role !== 'superadmin' && role !== 'admin') {
      window.location.replace('/superadmin/index');
      return;
    }

    if (isEmployeeRoute && role !== 'areamanager' && role !== 'employee' && role !== 'manager' && role !== 'superadmin' && role !== 'admin') {
      window.location.replace('/superadmin/index');
    }
  }, [location.pathname, authUser, loading]);

  return null;
};

// Keeps a logged-in staff member's cached session in sync with the backend so
// permission changes the owner makes take effect. Without this, the sidebar
// filters against the permissions captured at login time and shows stale menus.
// Runs once per load; only reloads if the permissions/active state actually
// changed (so no reload loop).
const StaffSessionSync = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = getStaffSession();
    if (!session?.loginId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchJson(`/api/employees/${session.loginId}`);
        const emp = res?.data;
        if (!emp || cancelled) return;

        if (emp.isActive === false) {
          clearStaffSession();
          window.location.replace(`${UNIFIED_LOGIN_PATH}?expired=1`);
          return;
        }

        const nextPerms = Array.isArray(emp.permissions) ? emp.permissions : [];
        const prevPerms = Array.isArray(session.permissions) ? session.permissions : [];
        const changed =
          JSON.stringify([...nextPerms].sort()) !== JSON.stringify([...prevPerms].sort()) ||
          (emp.role || "") !== (session.role || "");

        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        setStaffSession(emp, token);
        if (changed) window.location.reload();
      } catch (_) {
        // Best-effort — keep the existing session if the record can't be fetched.
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return null;
};

// There is ONE panel. Staff share the Property Owner Panel via a staff-proxy
// session and may only open the owner pages their permissions map to (see
// canAccessOwnerPathAsStaff). Real owners (with an owner session) and everyone
// else are left untouched — this guard only constrains staff proxies.
const StaffRouteGuard = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = location.pathname || "";
    if (!path.startsWith("/propertyowner")) return;

    const owner = getOwnerSession();
    if (owner?.loginId) return; // genuine owner session — full access

    const session = getStaffSession();
    if (!session?.loginId) return; // not a staff proxy — page handles its own auth

    if (!canAccessOwnerPathAsStaff(session, path)) {
      window.location.replace(STAFF_HOME_PATH);
    }
  }, [location.pathname]);

  return null;
};

const DomainGuard = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const host = (window.location.hostname || "").toLowerCase();

    // Allow all paths on localhost/127.0.0.1 for local development ease
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1") || !host.includes(".");
    if (isLocalhost) return;

    const path = location.pathname || "";

    // ─── Forward checkout & payment status routes to main domain roomhy.com ───
    if ((host.includes("admin.roomhy.com") || host.includes("app.roomhy.com")) &&
        (path.startsWith("/payment-status") || path.startsWith("/website/pay"))) {
      window.location.replace(`https://roomhy.com${location.pathname}${location.search}`);
      return;
    }

    const isPublicTokenRoute =
      path.startsWith("/payment") ||
      path.startsWith("/visitor-verify") ||
      path.startsWith("/digital-checkin") ||
      path.startsWith("/website");
    if (isPublicTokenRoute) return;

    // 1. Admin / Superadmin Domain
    const isAdminDomain = host === "admin.roomhy.com" || host === "www.admin.roomhy.com";
    if (isAdminDomain) {
      if (path === "/") {
        window.location.replace(resolveHostHome());
        return;
      }
      const isAllowed = path.startsWith("/superadmin") || path.startsWith("/employee") || path.startsWith("/staff") || path.startsWith("/digital-checkin") || path.startsWith("/website");
      if (!isAllowed) {
        window.location.replace("/superadmin/index");
      }
      return;
    }

    // 2. Property Owner / Tenant App Domain
    const isAppDomain = host === "app.roomhy.com" || host === "www.app.roomhy.com";
    if (isAppDomain) {
      if (path === "/") {
        window.location.replace(resolveHostHome());
        return;
      }
      const isAllowed = path.startsWith("/propertyowner") || path.startsWith("/tenant") || path.startsWith("/digital-checkin") || path.startsWith("/manager") || path.startsWith("/staff") || path.startsWith("/payment") || path.startsWith("/website");
      if (!isAllowed) {
        window.location.replace("/propertyowner/index");
      }
      return;
    }

    // 3. Fallback for main website domain (roomhy.com) and others
    const allowedWebsiteRoutes = [
      "/website",
      "/website-editor",
      "/about-us",
      "/contact-us",
      "/list-property",
      "/login",
      "/register",
      "/faq",
      "/privacy-policy",
      "/terms-and-conditions",
      "/pg",
      "/hostels",
      "/co-living",
      "/apartments",
      "/property",
      "/payment",           // ← FIXED: tokenized payment gateway from onboarding email
      "/visitor-verify",   // ← FIXED: visitor pass verification QR links
      "/digital-checkin",  // ← FIXED: tenant onboarding checkin flow
      "/admin"
    ];

    if (!allowedWebsiteRoutes.some(route => path.startsWith(route))) {
      if (path === "/" || path === "") {
        // Root — let the router handle it (shows HomePage)
        return;
      }
    }
  }, [location.pathname]);

  return null;
};

const RouteChromeCleanup = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname || "";
    if (!path.startsWith("/tenant/")) return;

    const cleanup = () => {
      document.querySelectorAll(".shared-shell").forEach((shell) => {
        shell.querySelectorAll(".shared-sidebar, .shared-header").forEach((node) => node.remove());

        const content = shell.querySelector(".shared-content");
        if (content) {
          content.style.padding = "0";
          content.style.minHeight = "100vh";
        }

        shell.setAttribute("data-tenant-cleanup", "1");
        shell.style.display = "block";
        shell.style.background = "transparent";
        shell.style.minHeight = "auto";
      });
    };

    cleanup();
    const timer = window.setTimeout(cleanup, 50);
    const observer = new MutationObserver(() => cleanup());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [location.pathname]);

  return null;
};

// Admin panel loader — when React Router intercepts /admin* routes,
// force a hard browser navigation so admin.html (TanStack Router app) loads.
// This only triggers on SPA-link clicks; direct URL navigation is handled by
// the dev server (admin.html entry) or Vercel rewrites in production.
const AdminPanelLoader = () => {
  React.useEffect(() => {
    // Sirf ek baar redirect — loop rokne ke liye sessionStorage use karo
    const key = 'admin_redirect_attempted';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      window.location.replace(window.location.href);
    }
    // Cleanup when admin loads successfully
    return () => sessionStorage.removeItem(key);
  }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '4px solid #e2e8f0', borderTop: '4px solid #0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading Admin Panel…</p>
      </div>
    </div>
  );
};


export default function App() {
  // Categorize routes for nested layout
  const shellRoutes = routes.filter(r => {
    const isSuperadmin = r.path.startsWith("/superadmin/") && r.path !== "/superadmin/index";
    const isEmployee = r.path.startsWith("/employee/") && r.path !== "/employee/index";
    // Employees and Superadmins use the same shared shell layout
    return isSuperadmin || isEmployee;
  });

  const standaloneRoutes = routes.filter(r => !shellRoutes.find(sr => sr.path === r.path));
  const ownerRoutes = standaloneRoutes.filter(r => r.path.startsWith("/propertyowner/"));
  const otherStandaloneRoutes = standaloneRoutes.filter(r => !r.path.startsWith("/propertyowner/"));

  return (
    <AuthProvider>
      <TranslationProvider>
        <ThemeProvider>
          <Router>
            <Toaster position="top-right" reverseOrder={false} />
            <DomainGuard />
            <InstallPWA />
            <ManagerRouteGuard />
            <RouteRoleGuard />
            <StaffSessionSync />
            <StaffRouteGuard />
            <RouteChromeCleanup />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Routes wrapped in SharedShell Layout */}
                <Route element={<SharedShell />}>
                  {shellRoutes.map(route => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                </Route>

                {/* Owner Panel routes — wrapped in ErrorBoundary */}
                <Route element={<OwnerPanelShell />}>
                  {ownerRoutes.map(route => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                </Route>

                {/* Other standalone routes (tenant, website, staff, etc.) */}
                {otherStandaloneRoutes.map(route => {
                  if (PROTECTED_TENANT_PATHS.has(route.path)) {
                    return (
                      <Route
                        key={route.path}
                        path={route.path}
                        element={
                          <TenantProtectedRoute>
                            {route.element}
                          </TenantProtectedRoute>
                        }
                      />
                    );
                  }
                  return (
                    <Route key={route.path} path={route.path} element={route.element} />
                  );
                })}

                <Route path="/" element={<React.Suspense fallback={<PageLoader />}>{React.createElement(lazy(() => import('./HomePage.jsx')))}</React.Suspense>} />
                <Route path="/superadmin" element={<Navigate to="/superadmin/index" replace />} />
                <Route path="/employee" element={<Navigate to="/employee/areaadmin" replace />} />
                <Route path="/propertyowner" element={<Navigate to="/propertyowner/index" replace />} />
                {/* The standalone Staff Panel is gone — old links fold into the one panel */}
                <Route path="/staff/login" element={<Navigate to={UNIFIED_LOGIN_PATH} replace />} />
                <Route path="/staff" element={<Navigate to={STAFF_HOME_PATH} replace />} />
                <Route path="/staff/*" element={<Navigate to={STAFF_HOME_PATH} replace />} />
                <Route path="/website" element={<Navigate to="/website/index" replace />} />
                {/* Admin panel — force hard browser navigation so TanStack Router (admin) takes over */}
                <Route path="/admin" element={<AdminPanelLoader />} />
                <Route path="/admin/*" element={<AdminPanelLoader />} />
                <Route path="*" element={<HtmlRedirectOrHome />} />
              </Routes>
            </Suspense>
          </Router>
        </ThemeProvider>
      </TranslationProvider>
    </AuthProvider>
  );
}
