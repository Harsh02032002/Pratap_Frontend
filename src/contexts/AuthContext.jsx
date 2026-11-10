import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getScopedAuthToken,
  getScopedStoredUser,
  clearScopedSession,
  hasFabricatedSession,
  isWebsiteRoute,
  isAdminRole,
  getAuthSession,
  invalidateAuthSession,
  onAuthSessionChange
} from '../utils/authScope';
import { fetchJson } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [panelUser, setPanelUser] = useState(null);
  const [websiteUser, setWebsiteUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [pathname, setPathname] = useState(() => {
    try { return window.location.pathname || "/"; } catch { return "/"; }
  });

  useEffect(() => onAuthSessionChange(() => {
    setPanelUser(null);
    setWebsiteUser(null);
    setLoading(true);
    setSessionVersion((version) => version + 1);
  }), []);

  useEffect(() => {
    const syncPath = () => {
      getAuthSession();
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
    getAuthSession();
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

    let active = true;
    fetchJson('/api/auth/me')
      .then((data) => {
        if (active && data) {
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
        if (active && err?.name !== 'AbortError') console.warn("[AuthContext] Auth verify warning:", err?.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [pathname, sessionVersion]);

  const onWebsiteNow = isWebsiteRoute(pathname);
  const user = onWebsiteNow ? websiteUser : panelUser;

  const login = (userData, token) => {
    if (isWebsiteRoute()) {
      if (!isAdminRole(userData?.role) && !userData?.team) {
        localStorage.setItem('website_token', token);
        sessionStorage.setItem('website_token', token);
        localStorage.setItem('website_user', JSON.stringify(userData));
        sessionStorage.setItem('website_user', JSON.stringify(userData));
        invalidateAuthSession();
        setWebsiteUser(userData);
      }
    } else {
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userData', JSON.stringify(userData));
      invalidateAuthSession();
      setPanelUser(userData);
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
    ["staff_token", "managerToken", "accessToken", "adminToken"].forEach((key) => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  } catch (_) {}
  invalidateAuthSession();
};
