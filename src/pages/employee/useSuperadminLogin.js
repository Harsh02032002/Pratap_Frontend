import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : window.location.origin);

const clearAllAuthStorage = () => {
  const keys = [
    "token", "staff_token", "user", "staff_user", "manager_user",
    "owner_user", "owner_session", "tenant_user", "website_token",
    "website_user", "accessToken", "userData", "staff_session", "employee_session"
  ];
  keys.forEach((k) => {
    try { localStorage.removeItem(k); } catch (_) {}
    try { sessionStorage.removeItem(k); } catch (_) {}
  });
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

const resolvePanelPath = (folder, fileName) => {
  const pathName = (window.location.pathname || "").toLowerCase();
  if (pathName.includes(`/${folder}/`)) {
    return `/${folder}/${fileName.replace(/\\$/i, "")}`;
  }
    return `/${fileName.replace(/\\$/i, "")}`;
};

const sanitizeUser = (u) => {
  if (!u || typeof u !== "object") return u;
  const { password: _pw, hashedPassword: _hp, tempPassword: _tp, otp: _otp, resetToken: _rt, secret: _sec, ...safe } = u;
  return safe;
};

export const useSuperadminLogin = () => {
  const apiUrl = useMemo(() => getApiUrl(), []);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotErrors, setForgotErrors] = useState({});

  const forgotStateRef = useRef({
    email: "",
    otp: "",
    token: "",
    source: ""
  });

  useEffect(() => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      loadScript("/seeder.js").catch(() => null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => { if (res.status === 401 || res.status === 403) clearAllAuthStorage(); })
      .catch(() => {});
  }, [apiUrl]);

  const showLoginError = useCallback((message) => {
    setLoginError(message || "");
  }, []);

  const clearForgotErrors = useCallback(() => {
    setForgotErrors({});
  }, []);

  const resetForgotModal = useCallback(() => {
    setForgotStep("email");
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    clearForgotErrors();
    forgotStateRef.current = { email: "", otp: "", token: "", source: "" };
  }, [clearForgotErrors]);

  const openForgotModal = useCallback(() => {
    setForgotOpen(true);
    resetForgotModal();
  }, [resetForgotModal]);

  const closeForgotModal = useCallback(() => {
    setForgotOpen(false);
    resetForgotModal();
  }, [resetForgotModal]);

  const loginSuperAdmin = useCallback(
    async (email, pwd) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password: pwd }),
          credentials: "include",
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.token && data.user) {
            const safeUser = sanitizeUser(data.user);
            localStorage.setItem("staff_user", JSON.stringify(safeUser));
            sessionStorage.setItem("user", JSON.stringify(safeUser));
            localStorage.setItem("user", JSON.stringify(safeUser));
            localStorage.setItem("token", data.token);
            sessionStorage.setItem("token", data.token);
            sessionStorage.removeItem("owner_session");
            localStorage.removeItem("owner_user");
            window.location.href = resolvePanelPath("superadmin", "superadmin");
            return;
          }
        }
      } catch (err) {
        console.warn("[Staff Login] Backend API unavailable or slow:", err?.message);
      }

      showLoginError("Invalid credentials.");
    },
    [apiUrl, showLoginError]
  );

  const loginOwner = useCallback(
    async (ownerId, pwd) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: ownerId, password: pwd }),
          credentials: "include",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          if (data.token && data.user) {
            sessionStorage.removeItem("manager_user");
            sessionStorage.removeItem("user");
            localStorage.removeItem("staff_user");
            localStorage.removeItem("staff_token");
            const sessionUser = {
              ...sanitizeUser(data.user),
              loginId: data.user.loginId || ownerId,
              role: "owner",
              ownerId: data.user.ownerId || ownerId
            };
            sessionStorage.setItem("owner_session", JSON.stringify(sessionUser));
            localStorage.setItem("owner_user", JSON.stringify(sessionUser));
            localStorage.setItem("token", data.token);
            sessionStorage.setItem("token", data.token);
            window.location.href = resolvePanelPath("propertyowner", "admin");
            return;
          }
        }
      } catch (err) {
        console.warn("[Owner Login] Backend error:", err?.message);
      }
      showLoginError("Invalid credentials.");
    },
    [apiUrl, showLoginError]
  );

  const loginAreaManager = useCallback(
    async (id, pwd) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: id, password: pwd }),
          credentials: "include",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          if (data.token && data.user) {
            const user = {
              ...sanitizeUser(data.user),
              role: "areamanager",
              areaCode: data.user.areaCode || data.user.area || data.user.areaName || "",
              areaName: data.user.areaName || data.user.area || ""
            };
            sessionStorage.setItem("manager_user", JSON.stringify(user));
            sessionStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("staff_user", JSON.stringify(user));
            localStorage.setItem("token", data.token);
            sessionStorage.setItem("token", data.token);
            sessionStorage.removeItem("owner_session");
            localStorage.removeItem("owner_user");
            window.location.href = resolvePanelPath("employee", "areaadmin");
            return;
          }
        }
      } catch (err) {
        console.warn("[Area Manager Login] Backend error:", err?.message);
      }
      showLoginError("Invalid credentials.");
    },
    [apiUrl, showLoginError]
  );

  const loginEmployee = useCallback(
    async (id, pwd) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: id, password: pwd }),
          credentials: "include",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          if (data.token && data.user) {
            const user = { ...sanitizeUser(data.user), role: "employee" };
            sessionStorage.setItem("manager_user", JSON.stringify(user));
            sessionStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("staff_user", JSON.stringify(user));
            localStorage.setItem("token", data.token);
            sessionStorage.setItem("token", data.token);
            sessionStorage.removeItem("owner_session");
            localStorage.removeItem("owner_user");
            window.location.href = resolvePanelPath("employee", "areaadmin");
            return;
          }
        }
      } catch (err) {
        console.warn("[Employee Login] Backend error:", err?.message);
      }
      showLoginError("Invalid credentials.");
    },
    [apiUrl, showLoginError]
  );

  const loginTenant = useCallback(
    async (id, pwd) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: id, password: pwd }),
          credentials: "include",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          if (data.requireReset) {
            showLoginError("First-time login detected. Please use 'Forgot Password' to set your password.");
            return;
          }
          if (data.token && data.user) {
            sessionStorage.removeItem("manager_user");
            sessionStorage.removeItem("user");
            localStorage.removeItem("staff_user");
            localStorage.removeItem("staff_token");
            sessionStorage.removeItem("owner_session");
            localStorage.removeItem("owner_user");
            const tenantUser = {
              ...sanitizeUser(data.user),
              role: "tenant",
              loginId: data.user.loginId || id,
              tenantId: data.user.tenantId || data.user._id || data.user.id || id,
              passwordSet: true
            };
            localStorage.setItem("tenant_user", JSON.stringify(tenantUser));
            localStorage.setItem("user", JSON.stringify(tenantUser));
            localStorage.setItem("token", data.token);
            sessionStorage.setItem("token", data.token);
            window.location.href = resolvePanelPath("tenant", "tenantdashboard");
            return;
          }
        }
      } catch (err) {
        console.warn("[Tenant Login] Backend error:", err?.message);
      }
      showLoginError("Invalid credentials.");
    },
    [apiUrl, showLoginError]
  );

  const handleUnifiedLogin = useCallback(
    async (event) => {
      event?.preventDefault?.();
      const trimmedLogin = loginId.trim();
      const trimmedPassword = password.trim();

      setLoginError("");

      if (!trimmedLogin || !trimmedPassword) {
        showLoginError("Please fill in all fields.");
        return;
      }

      sessionStorage.removeItem("manager_user");
      sessionStorage.removeItem("user");
      localStorage.removeItem("owner_user");

      const up = trimmedLogin.toUpperCase();

      if (trimmedLogin.includes("@")) {
        await loginSuperAdmin(trimmedLogin, trimmedPassword);
        return;
      }
      if (up.startsWith("MGR")) {
        await loginAreaManager(trimmedLogin, trimmedPassword);
        return;
      }
      if (up.startsWith("RY") || up.startsWith("EMP")) {
        await loginEmployee(trimmedLogin, trimmedPassword);
        return;
      }
      if (up.startsWith("ROOMHYTNT") || up.startsWith("TNT")) {
        await loginTenant(trimmedLogin, trimmedPassword);
        return;
      }
      if (up.startsWith("ROOMHY")) {
        await loginOwner(trimmedLogin, trimmedPassword);
        return;
      }

      showLoginError("Login ID format not recognized.");
    },
    [
      loginId,
      password,
      loginAreaManager,
      loginEmployee,
      loginOwner,
      loginTenant,
      loginSuperAdmin,
      showLoginError
    ]
  );

  const sendOtp = useCallback(async () => {
    clearForgotErrors();

    const email = forgotEmail.trim();
    if (!email) {
      setForgotErrors({ email: "Please enter your email address" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setForgotErrors({ email: "Please enter a valid email address" });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotErrors({ email: data.message || "Email not found. Please check and try again." });
        return;
      }

      forgotStateRef.current.email = email;
      setForgotStep("otp");
    } catch (err) {
      setForgotErrors({ email: "Failed to connect. Please try again." });
    }
  }, [apiUrl, clearForgotErrors, forgotEmail]);

  const verifyOtp = useCallback(async () => {
    clearForgotErrors();

    const otp = forgotOtp.trim();
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setForgotErrors({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotStateRef.current.email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotErrors({ otp: data.message || "Invalid OTP. Please try again." });
        return;
      }

      forgotStateRef.current.otp = otp;
      forgotStateRef.current.token = data.token;
      setForgotStep("password");
    } catch (err) {
      setForgotErrors({ otp: "Failed to verify OTP. Please try again." });
    }
  }, [apiUrl, clearForgotErrors, forgotOtp]);

  const resetPassword = useCallback(async () => {
    clearForgotErrors();

    if (!forgotNewPassword) {
      setForgotErrors({ password: "Please enter a new password" });
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotErrors({ password: "Password must be at least 6 characters" });
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotErrors({ confirm: "Passwords do not match" });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/forgot-password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotStateRef.current.email,
          otp: forgotStateRef.current.otp,
          newPassword: forgotNewPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotErrors({ password: data.message || "Failed to reset password. Please try again." });
        return;
      }

      alert("Password reset successful! You can now login with your new password.");
      closeForgotModal();
    } catch (err) {
      setForgotErrors({ password: "Failed to reset password. Please try again." });
    }
  }, [
    apiUrl,
    clearForgotErrors,
    closeForgotModal,
    forgotConfirmPassword,
    forgotNewPassword
  ]);

  const logout = useCallback(async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    clearAllAuthStorage();
    if (token) {
      try {
        await fetch(`${apiUrl}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (_) {}
    }
    window.location.href = "/";
  }, [apiUrl]);

  const backToEmail = useCallback(() => {
    resetForgotModal();
  }, [resetForgotModal]);

  return {
    apiUrl,
    loginId,
    password,
    loginError,
    setLoginId,
    setPassword,
    handleUnifiedLogin,
    forgotOpen,
    openForgotModal,
    closeForgotModal,
    forgotStep,
    forgotEmail,
    forgotOtp,
    forgotNewPassword,
    forgotConfirmPassword,
    forgotErrors,
    setForgotEmail,
    setForgotOtp,
    setForgotNewPassword,
    setForgotConfirmPassword,
    sendOtp,
    verifyOtp,
    resetPassword,
    backToEmail,
    logout
  };
};



