import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getScopedAuthToken,
  getScopedStoredUser,
  clearScopedSession,
  hasFabricatedSession,
  isWebsiteRoute,
  isAdminRole
} from '../utils/authScope';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const getAuthApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : window.location.origin);

export const AuthProvider = ({ children }) => {
  const [panelUser, setPanelUser] = useState(null);
  const [websiteUser, setWebsiteUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pathname, setPathname] = useState(() => {
    try { return window.location.pathname || "/"; } catch { return "/"; }
  });

  useEffect(() => {
    const syncPath = () => {
      try { setPathname(window.location.pathname || "/"); } catch (_) {}
    };
    window.addEventListener("popstate", syncPath);
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    window.history.pushState = function (...args) {
      const ret = origPush.apply(this, args);
      syncPath();
      return ret;
    };
    window.history.replaceState = function (...args) {
      const ret = origReplace.apply(this, args);
      syncPath();
      return ret;
    };
    return () => {
      window.removeEventListener("popstate", syncPath);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, []);

  useEffect(() => {
    const onWebsite = isWebsiteRoute(pathname);

    if (hasFabricatedSession(pathname)) {
      clearScopedSession(pathname);
      if (onWebsite) setWebsiteUser(null);
      else setPanelUser(null);
      setLoading(false);
      return;
    }

    const token = getScopedAuthToken(pathname);
    const parsedUser = getScopedStoredUser(pathname);

    if (!token || !parsedUser) {
      if (onWebsite) setWebsiteUser(null);
      else setPanelUser(null);
      setLoading(false);
      return;
    }

    if (onWebsite && (isAdminRole(parsedUser.role) || parsedUser.team || /^RY[A-Z0-9]+/i.test(String(parsedUser.loginId || "")))) {
      setWebsiteUser(null);
      setLoading(false);
      return;
    }

    if (onWebsite) setWebsiteUser(parsedUser);
    else setPanelUser(parsedUser);

    fetch(`${getAuthApiUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const backendUser = (data?.user && typeof data.user === "object") ? data.user : data;
          if (backendUser && typeof backendUser === "object" && backendUser.role) {
            if (onWebsite && (isAdminRole(backendUser.role) || backendUser.team || /^RY[A-Z0-9]+/i.test(String(backendUser.loginId || "")))) {
              setWebsiteUser(null);
              clearScopedSession(pathname);
              return;
            }
            if (onWebsite) setWebsiteUser(backendUser);
            else setPanelUser(backendUser);
          }
        }
      })
      .catch((err) => {
        console.warn("[AuthContext] Auth verify warning:", err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pathname]);

  const onWebsiteNow = isWebsiteRoute(pathname);
  const user = onWebsiteNow ? websiteUser : panelUser;

  const login = (userData, token) => {
    if (isWebsiteRoute()) {
      if (!isAdminRole(userData?.role) && !userData?.team) {
        setWebsiteUser(userData);
        localStorage.setItem('website_token', token);
        sessionStorage.setItem('website_token', token);
        localStorage.setItem('website_user', JSON.stringify(userData));
        sessionStorage.setItem('website_user', JSON.stringify(userData));
      }
    } else {
      setPanelUser(userData);
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  };

  const logout = () => {
    if (isWebsiteRoute()) {
      setWebsiteUser(null);
    } else {
      setPanelUser(null);
    }
    clearScopedSession();
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const clearAllAuthKeys = () => {
  try {
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    sessionStorage.removeItem("tenant");
    localStorage.removeItem("tenant");
    sessionStorage.removeItem("staff_user");
    localStorage.removeItem("staff_user");
    sessionStorage.removeItem("owner_session");
    localStorage.removeItem("owner_session");
    sessionStorage.removeItem("website_token");
    localStorage.removeItem("website_token");
    sessionStorage.removeItem("website_user");
    localStorage.removeItem("website_user");
  } catch (_) {}
};
