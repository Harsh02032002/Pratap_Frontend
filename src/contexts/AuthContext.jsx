import React, { createContext, useContext, useState, useEffect } from 'react';

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
    : "https://api.roomhy.com");

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      sessionStorage.getItem("token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("website_token");

    const rawUserStr =
      sessionStorage.getItem("user") ||
      sessionStorage.getItem("staff_user") ||
      localStorage.getItem("staff_user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("website_user");

    if (!token || !rawUserStr) {
      setLoading(false);
      return;
    }

    let parsedUser = null;
    try {
      parsedUser = JSON.parse(rawUserStr);
    } catch (_) {}

    if (parsedUser) {
      setUser(parsedUser);
    }

    fetch(`${getAuthApiUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const backendUser = (data?.user && typeof data.user === "object") ? data.user : data;
          if (backendUser && typeof backendUser === "object" && backendUser.role) {
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
    try {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    } catch (_) {}
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

