import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "roomhy_admin_jwt";
const TOKEN_KEY = "roomhy_admin_token";
const DEMO_EMAIL = "admin@roomhy.com";
const DEMO_PASSWORD = "Admin@Roomhy2025";

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  initials: string;
  loginId?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function apiRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed: ${res.status}`);
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      }
    } catch {}
    setIsReady(true);
  }, []);

  const login: AuthContextValue["login"] = async (email, password) => {
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: email, password }),
      });

      const token = data.token;
      if (!token) {
        return { ok: false, error: 'No token received from server.' };
      }

      const namePart = email.split("@")[0] || "User";
      const name = email.toLowerCase() === DEMO_EMAIL ? "Super Admin" : namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const initials = name.slice(0, 2).toUpperCase();

      // This is the admin panel — treat all logged-in users as superadmin
      // Backend authorizes 'superadmin' for all admin panel routes
      const backendRole = data.user?.role || '';
      const role = backendRole === 'superadmin' ? 'superadmin' : 'superadmin'; // Always superadmin in admin panel

      const u: AuthUser = {
        name,
        email,
        role,
        initials,
        loginId: data.user?.loginId,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      localStorage.setItem(TOKEN_KEY, token);
      setUser(u);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isReady, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const DEMO_CREDENTIALS = { email: DEMO_EMAIL, password: DEMO_PASSWORD };