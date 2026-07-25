import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";
import { getFirstAllowedEmployeeRoute } from "../../utils/employeePermissions";

const WINDOW_NAME_SESSION_PREFIX = "__ROOMHY_STAFF_SESSION__:";

const resolvePanelPath = (folder, fileName) => {
  return `/${folder}/${fileName}`;
};

export default function Index() {
  const navigate = useNavigate();
  useHtmlPage({
    title: "RoomHy - Staff Login",
    bodyClass: "flex items-center justify-center p-4",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/superadmin/assets/css/index.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [requireReset, setRequireReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [forgotOpen, forgotStep]);

  const safeLocalStorageGet = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  };

  const setStaffSession = (user, tokenValue) => {
    sessionStorage.setItem("manager_user", JSON.stringify(user));
    sessionStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("staff_user", JSON.stringify(user));
    localStorage.setItem("staff_token", tokenValue);
    try {
      window.name = `${WINDOW_NAME_SESSION_PREFIX}${encodeURIComponent(JSON.stringify(user || {}))}`;
    } catch (_) {}
    localStorage.setItem("token", tokenValue);
    sessionStorage.removeItem("owner_session");
    localStorage.removeItem("owner_user");
  };

  const handleSuperAdminLogin = async (identifier, pass) => {
    try {
      const data = await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password: pass })
      });
      if (data?.token && data?.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("staff_user", JSON.stringify(data.user));
        localStorage.setItem("staff_token", data.token);
        sessionStorage.removeItem("owner_session");
        localStorage.removeItem("owner_user");
        navigate(resolvePanelPath("superadmin", "superadmin"));
        return true;
      }
    } catch (_) {}
    return false;
  };


  const handleLogin = async () => {
    if (!loginId || !password) {
      setLoginError("Please fill in all fields.");
      return;
    }
    setLoginError("");
    setLoginLoading(true);
    try {
      sessionStorage.removeItem("manager_user");
      sessionStorage.removeItem("user");
      localStorage.removeItem("owner_user");

      if (loginId.includes("@")) {
        if (await handleSuperAdminLogin(loginId, password)) return;
        setLoginError("Invalid credentials.");
        return;
      }

      const data = await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: loginId, password })
      });
      if (data?.requireReset) {
        setRequireReset(true);
        setForgotOpen(true);
        setForgotStep("password");
        setForgotEmail(data.email || ""); // fallback if missing
        // For staff reset we can reuse forgot token, but here we can't easily without OTP verification.
        // Wait, the manager login reset uses /api/auth/reset-initial-password which takes oldPassword!
        // We need to implement reset-initial-password in Employee UI.
        setForgotToken("initial_reset"); // flag for initial reset
        setForgotError("Please set a new password to continue.");
        return;
      }
      if (data?.token && data?.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        const role = data.user.role;
        if (role === "superadmin" || role === "admin") {
          navigate(resolvePanelPath("superadmin", "superadmin"));
        } else if (role === "manager") {
          localStorage.setItem("managerToken", data.token);
          localStorage.setItem("managerData", JSON.stringify(data.user));
          navigate(resolvePanelPath("manager", "dashboard"));
        } else if (role === "areamanager" || role === "employee") {
          navigate(getFirstAllowedEmployeeRoute(data.user));
        } else if (role === "owner") {
          navigate(resolvePanelPath("propertyowner", "admin"));
        } else if (role === "tenant") {
          navigate(resolvePanelPath("tenant", "tenantdashboard"));
        } else {
          navigate(resolvePanelPath("superadmin", "superadmin"));
        }
        return;
      }
      setLoginError("Invalid credentials.");
    } catch (err) {
      setLoginError(err?.body || err?.message || "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const resetForgotModal = () => {
    setForgotStep("email");
    setForgotEmail("");
    setForgotOtp("");
    setForgotToken("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError("");
  };

  const openForgotModal = () => {
    resetForgotModal();
    setForgotOpen(true);
  };

  const closeForgotModal = () => {
    setForgotOpen(false);
    resetForgotModal();
  };

  const sendOtp = async () => {
    if (!forgotEmail) {
      setForgotError("Please enter your email address.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      await fetchJson("/api/auth/forgot-password/request-otp", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail })
      });
      setForgotStep("otp");
    } catch (err) {
      setForgotError(err?.body || err?.message || "Failed to send OTP.");
    } finally {
      setForgotLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) {
      setForgotError("Please enter a valid 6-digit OTP.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      const data = await fetchJson("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp })
      });
      setForgotToken(data?.token || "");
      setForgotStep("password");
    } catch (err) {
      setForgotError(err?.body || err?.message || "Invalid OTP.");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword) {
      setForgotError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      if (forgotToken === "initial_reset") {
        await fetchJson("/api/auth/reset-initial-password", {
          method: "POST",
          body: JSON.stringify({ loginId, oldPassword: password, newPassword })
        });
        closeForgotModal();
        handleLogin(); // auto login
      } else {
        await fetchJson("/api/auth/forgot-password/reset-password", {
          method: "POST",
          body: JSON.stringify({ email: forgotEmail, token: forgotToken, newPassword })
        });
        closeForgotModal();
      }
    } catch (err) {
      setForgotError(err?.body || err?.message || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="html-page">
      <div className="card-light w-full max-w-md p-8" id="login-container">
        <div className="text-center mb-8">
          <a href="../website//website/index" className="inline-flex items-center justify-center mb-4">
            <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-auto" />
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Staff Login</h1>
          <p className="text-gray-500 text-sm">Enter your credentials to access Roomhy</p>
        </div>

        <div id="login-form" className="fade-in">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Login ID</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <i data-lucide="user" className="w-5 h-5"></i>
              </span>
              <input
                type="text"
                className="input-focus w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none"
                id="login-id"
                placeholder="Enter your ID..."
                autoComplete="off"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email, ID code, or account number</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <i data-lucide="lock" className="w-5 h-5"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="input-focus w-full pl-10 pr-10 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none"
                id="login-password"
                placeholder="********"
                autoComplete="off"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {loginError && <div id="error-msg" className="error-msg mt-2">{loginError}</div>}
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loginLoading}
            className="btn-primary w-full text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2"
          >
            {loginLoading ? "Logging in..." : "Login"} <i data-lucide="arrow-right" className="w-4 h-4"></i>
          </button>

          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-800" onClick={openForgotModal}>
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {forgotOpen && (
        <div id="forgot-password-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(event) => {
          if (event.target.id === "forgot-password-modal") closeForgotModal();
        }}>
          <div className="card-light w-full max-w-md p-8 mx-4 fade-in">
            <div className="text-center mb-6">
              <button type="button" className="float-right text-gray-400 hover:text-gray-600" onClick={closeForgotModal}>
                <i data-lucide="x" className="w-5 h-5"></i>
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your email to receive an OTP</p>
            </div>

            {forgotStep === "email" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    className="input-focus w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none"
                    placeholder="Enter your email..."
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                  />
                </div>
                {forgotError && <div className="error-msg">{forgotError}</div>}
                <button type="button" className="btn-primary w-full text-white font-bold py-3 rounded-lg transition-all" onClick={sendOtp} disabled={forgotLoading}>
                  {forgotLoading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            )}

            {forgotStep === "otp" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                  <p className="text-xs text-gray-400 mb-3">6-digit OTP sent to {forgotEmail}</p>
                  <input
                    type="text"
                    className="input-focus w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(event) => setForgotOtp(event.target.value)}
                  />
                </div>
                {forgotError && <div className="error-msg">{forgotError}</div>}
                <button type="button" className="btn-primary w-full text-white font-bold py-3 rounded-lg transition-all" onClick={verifyOtp} disabled={forgotLoading}>
                  {forgotLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <button type="button" className="w-full text-indigo-600 font-medium py-2 hover:text-indigo-800" onClick={() => setForgotStep("email")}>
                  Back
                </button>
              </div>
            )}

            {forgotStep === "password" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="input-focus w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none"
                      placeholder="Enter new password..."
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="input-focus w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none"
                      placeholder="Confirm your password..."
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {forgotError && <div className="error-msg">{forgotError}</div>}
                <button type="button" className="btn-primary w-full text-white font-bold py-3 rounded-lg transition-all" onClick={resetPassword} disabled={forgotLoading}>
                  {forgotLoading ? "Saving..." : "Reset Password"}
                </button>
                <button type="button" className="w-full text-indigo-600 font-medium py-2 hover:text-indigo-800" onClick={() => setForgotStep("email")}>
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




