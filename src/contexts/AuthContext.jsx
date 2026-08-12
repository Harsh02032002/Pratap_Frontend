import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getScopedAuthToken,
  getScopedStoredUser,
  clearScopedSession,
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Resolve the session that belongs to THIS route. On the public website the
    // panel `token` is out of scope — reading it here is what made the website
    // navbar show "Super Admin" for every visitor once a superadmin had signed
    // in on the same browser.
    const onWebsite = isWebsiteRoute();
    const token = getScopedAuthToken();
    const parsedUser = getScopedStoredUser();

    if (!token || !parsedUser) {
      setLoading(false);
      return;
    }

    // A panel identity is never a website identity, even if a stale website
    // token somehow resolves to one.
    if (onWebsite && isAdminRole(parsedUser.role)) {
      setLoading(false);
      return;
    }

    setUser(parsedUser);

    fetch(`${getAuthApiUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const backendUser = (data?.user && typeof data.user === "object") ? data.user : data;
          if (backendUser && typeof backendUser === "object" && backendUser.role) {
            if (onWebsite && isAdminRole(backendUser.role)) {
              setUser(null);
              return;
            }
            setUser(backendUser);
          }
        }
      })
      .catch((err) => {
        console.warn("[AuthContext] Auth verify warning:", err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    sessionStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    // Clears the keys for the current context: website routes drop the website
    // session, panel routes drop the panel session. Clearing only the panel
    // keys used to leave a website visitor still signed in.
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

