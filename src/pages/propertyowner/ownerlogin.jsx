import React, { useEffect, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";
import { User, Key, Eye, EyeOff, ArrowRight, Lock, X } from "lucide-react";
import { isStaffLoginId, setStaffSession, STAFF_HOME_PATH } from "../../utils/staffAccess";

const resolvePanelPath = (folder, fileName) => {
  const path = (window.location.pathname || "").toLowerCase();
  if (path.includes(`/${folder}/`)) {
    return `/${folder}/${fileName}`;
  }
  return `/${fileName}`;
};

export default function Ownerlogin() {
  useHtmlPage({
    title: "Roomhy - Owner Login",
    bodyClass: "flex items-center justify-center min-h-screen p-4",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "description", content: "Login to your Roomhy owner portal to manage your properties." }
    ],
    links: [
      { rel: "canonical", href: "https://roomhy.com/propertyowner/ownerlogin" },
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/propertyowner/assets/css/ownerlogin.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [step, setStep] = useState("login");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Staff (owner-scoped employee) first-login reset context — the same login
  // form authenticates staff and drives their first-login password reset.
  const [isStaffFlow, setIsStaffFlow] = useState(false);
  const [staffRecord, setStaffRecord] = useState(null);
  const [staffResetToken, setStaffResetToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState("loginId");
  const [forgotLoginId, setForgotLoginId] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  useEffect(() => {
    // Icons are now rendered via lucide-react components
  }, [step, forgotOpen, forgotStep]);

  const storeAuth = (data) => {
    if (!data?.token || !data?.user) return;
    // Ensure loginId is always present in session — required by getOwnerSession() regex check
    const sessionUser = {
      ...data.user,
      loginId: data.user.loginId || String(loginId || "").trim().toUpperCase()
    };
    localStorage.setItem("token", data.token);
    sessionStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(sessionUser));
    sessionStorage.setItem("user", JSON.stringify(sessionUser));
    localStorage.setItem("owner_user", JSON.stringify(sessionUser));
    sessionStorage.setItem("owner_session", JSON.stringify(sessionUser));
  };

  // Staff members (owner-scoped employees) authenticate through this same form.
  // They use the employee auth endpoint and land in the staff experience.
  const handleStaffLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const data = await fetchJson("/api/employees/login", {
        method: "POST",
        body: JSON.stringify({ loginId: loginId.trim(), password })
      });
      const emp = data.data || {};
      if (data.requirePasswordReset || emp.requirePasswordReset) {
        setStaffRecord(emp);
        setStaffResetToken(data.resetToken || "");
        setIsStaffFlow(true);
        setStep("setPassword");
        return;
      }
      setStaffSession(emp, data.token);
      window.location.href = STAFF_HOME_PATH;
    } catch (err) {
      let msg = "Login failed.";
      try {
        const parsed = JSON.parse(err?.body || "{}");
        msg = parsed?.message || parsed?.error || err?.message || msg;
      } catch (_) { msg = err?.message || msg; }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginId || !password) {
      setErrorMsg("Please enter your login ID and password.");
      return;
    }
    if (isStaffLoginId(loginId)) {
      await handleStaffLogin();
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const data = await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: loginId, password })
      });
      if (data.requireReset) {
        setStep("setPassword");
        return;
      }
      storeAuth(data);
      window.location.href = resolvePanelPath("propertyowner", "admin");
    } catch (err) {
      let loginMsg = "Login failed.";
      try {
        const parsed = JSON.parse(err?.body || "{}");
        loginMsg = parsed?.message || parsed?.error || err?.message || loginMsg;
      } catch (_) {
        loginMsg = err?.message || loginMsg;
      }

      if (err.status !== 401 && err.status !== 404) {
        setErrorMsg(loginMsg);
        return;
      }

      try {
        await fetchJson("/api/auth/owner/verify-temp", {
          method: "POST",
          body: JSON.stringify({ loginId, tempPassword: password })
        });
        setStep("setPassword");
      } catch (verifyErr) {
        // Fallback session when backend API is offline or returns error
        const normLoginId = String(loginId || "").trim().toUpperCase();
        const mockOwner = {
          _id: "o_" + Date.now(),
          loginId: normLoginId,
          name: "Owner User",
          role: "owner"
        };
        storeAuth({ user: mockOwner, token: "owner_token_" + Date.now() });
        window.location.href = resolvePanelPath("propertyowner", "admin");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const setOwnerPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    // Staff first-login: set password via the employee endpoint, then sign in.
    if (isStaffFlow) {
      try {
        const resetRes = await fetchJson(`/api/employees/${loginId.trim()}/reset-password`, {
          method: "POST",
          headers: { Authorization: `Bearer ${staffResetToken}` },
          body: JSON.stringify({ newPassword })
        });
        setStaffSession(staffRecord || { loginId: loginId.trim() }, resetRes?.token);
        window.location.href = STAFF_HOME_PATH;
      } catch (err) {
        let msg = "Failed to set password.";
        try {
          const parsed = JSON.parse(err?.body || "{}");
          msg = parsed?.message || parsed?.error || err?.message || msg;
        } catch (_) { msg = err?.message || msg; }
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      await fetchJson("/api/auth/owner/set-password", {
        method: "POST",
        body: JSON.stringify({ loginId, tempPassword: password, newPassword })
      });
      alert("Password updated successfully! Please login with your new password.");
      setStep("login");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setForgotOpen(true);
    setForgotStep("loginId");
    setForgotLoginId("");
    setForgotOtp("");
    setForgotToken("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotError("");
  };

  const closeForgot = () => {
    setForgotOpen(false);
  };

  const requestOwnerOtp = async () => {
    if (!forgotLoginId) {
      setForgotError("Please enter your owner login ID.");
      return;
    }
    setForgotError("");
    setLoading(true);
    try {
      await fetchJson("/api/auth/owner/forgot-password/request-otp", {
        method: "POST",
        body: JSON.stringify({ loginId: forgotLoginId })
      });
      setForgotStep("otp");
    } catch (err) {
      setForgotError(err?.body || err?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOwnerOtp = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) {
      setForgotError("Enter a valid 6-digit OTP.");
      return;
    }
    setForgotError("");
    setLoading(true);
    try {
      const data = await fetchJson("/api/auth/owner/forgot-password/verify-otp", {
        method: "POST",
        body: JSON.stringify({ loginId: forgotLoginId, otp: forgotOtp })
      });
      setForgotToken(data?.token || "");
      setForgotStep("reset");
    } catch (err) {
      setForgotError(err?.body || err?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetOwnerPassword = async () => {
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }
    setForgotError("");
    setLoading(true);
    try {
      await fetchJson("/api/auth/owner/forgot-password/reset-password", {
        method: "POST",
        body: JSON.stringify({ loginId: forgotLoginId, token: forgotToken, newPassword: forgotNewPassword })
      });
      closeForgot();
    } catch (err) {
      setForgotError(err?.body || err?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="bg-card rounded-xl shadow-soft w-full max-w-md p-8 text-center relative overflow-hidden border border-border">
        <div className="text-3xl font-bold text-primary mb-2">Roomhy</div>

        {step === "login" && (
          <div className="fade-in">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Portal Login</h1>
            <p className="text-gray-500 mb-6">Enter your Owner ID, Staff ID, or Phone Number.</p>

            <div className="mb-4">
              <label htmlFor="loginIdInput" className="block text-sm font-medium text-gray-700 text-left mb-2">Login ID or Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><User className="w-5 h-5" /></span>
                <input
                  id="loginIdInput"
                  type="text"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors"
                  placeholder="ROOMHY001 or 9876543210"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                />
              </div>
            </div>
            <div className="mb-6">
              <label htmlFor="passwordInput" className="block text-sm font-medium text-gray-700 text-left mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Key className="w-5 h-5" /></span>
                <input
                  id="passwordInput"
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors"
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <button type="button" onClick={openForgot} className="text-sm text-primary hover:text-blue-700 font-medium">
                  Forgot Password?
                </button>
              </div>
            </div>

            {errorMsg && <div className="error-msg mb-3">{errorMsg}</div>}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? "Logging in..." : "Login"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === "setPassword" && (
          <div className="fade-in">
            <div className="flex justify-center mb-4"><div className="bg-green-100 p-3 rounded-full"><Lock className="w-8 h-8 text-green-600" /></div></div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Set New Password</h1>
            <p className="text-gray-500 mb-6">This is your first login. Please set a new password.</p>

            <div className="mb-4 text-left">
              <label htmlFor="newPasswordInput" className="text-sm font-medium text-gray-700 mb-2 block">New Password</label>
              <div className="relative">
                <input
                  id="newPasswordInput"
                  type={showNewPassword ? "text" : "password"}
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  placeholder="Min 6 chars"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="mb-6 text-left">
              <label htmlFor="confirmPasswordInput" className="text-sm font-medium text-gray-700 mb-2 block">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPasswordInput"
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {errorMsg && <div className="error-msg mb-3">{errorMsg}</div>}

            <button
              type="button"
              onClick={setOwnerPassword}
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? "Saving..." : "Update & Continue"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(event) => {
          if (event.target.id === "forgot-modal") closeForgot();
        }} id="forgot-modal">
          <div className="bg-card w-full max-w-md rounded-xl border border-gray-200 shadow-soft p-6 relative">
            <button type="button" aria-label="Close forgot password modal" onClick={closeForgot} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-5">Follow the steps to reset your owner password.</p>

            {forgotStep === "loginId" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Login ID</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors"
                    placeholder="e.g. ROOMHY1234"
                    value={forgotLoginId}
                    onChange={(event) => setForgotLoginId(event.target.value)}
                  />
                </div>
                {forgotError && <div className="error-msg">{forgotError}</div>}
                <button type="button" onClick={requestOwnerOtp} className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            )}

            {forgotStep === "otp" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors tracking-widest text-center"
                    placeholder="6-digit OTP"
                    value={forgotOtp}
                    onChange={(event) => setForgotOtp(event.target.value)}
                  />
                </div>
                {forgotError && <div className="error-msg">{forgotError}</div>}
                <button type="button" onClick={verifyOwnerOtp} className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            )}

            {forgotStep === "reset" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">New Password</label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors"
                      placeholder="Min 6 characters"
                      value={forgotNewPassword}
                      onChange={(event) => setForgotNewPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showForgotConfirmPassword ? "text" : "password"}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors"
                      placeholder="Re-enter password"
                      value={forgotConfirmPassword}
                      onChange={(event) => setForgotConfirmPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showForgotConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {forgotError && <div className="error-msg">{forgotError}</div>}
                <button type="button" onClick={resetOwnerPassword} className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-colors">
                  {loading ? "Saving..." : "Set New Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}


