import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight, X, Mail, Eye, EyeOff } from "lucide-react";
import { useHeadAssets } from "../../utils/useHeadAssets.js";
import { getApiBase } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";

const title = "RoomHy - Superadmin Login";

export default function SuperadminIndexPage() {
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();
    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: Password
    const [forgotEmail, setForgotEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [requireReset, setRequireReset] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [forgotError, setForgotError] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [resetToken, setResetToken] = useState("");

    useHeadAssets({ 
        title, 
        disableMobileSidebar: true,
        links: [
            { rel: "stylesheet", href: "/superadmin/assets/css/index.css" }
        ]
    });

    useEffect(() => {
        // Lucide icons are handled by React components now, 
        // but some legacy CSS might expect data-lucide.
        // We'll use Lucide React components for the new UI.
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        // Read directly from form elements as fallback for browser autofill edge cases
        const formEl = e.target;
        const identifierVal = loginId || (formEl.elements['identifier']?.value || "").trim();
        const passwordVal = password || (formEl.elements['password']?.value || "").trim();

        if (!identifierVal || !passwordVal) {
            setError("Please enter your email/ID and password.");
            return;
        }

        const API_URL = getApiBase();

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: identifierVal, password: passwordVal })
            });
            const data = await res.json();

            if (res.ok && data.requireReset) {
                setRequireReset(true);
                return;
            }

            if (res.ok && data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("staff_token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("staff_user", JSON.stringify(data.user));
                sessionStorage.setItem("token", data.token);
                sessionStorage.setItem("staff_token", data.token);
                sessionStorage.setItem("user", JSON.stringify(data.user));
                sessionStorage.setItem("staff_user", JSON.stringify(data.user));
                sessionStorage.setItem("manager_user", JSON.stringify(data.user));

                // Update AuthContext so RouteRoleGuard sees the user immediately
                authLogin(data.user, data.token);

                const role = data.user.role;
                if (role === 'superadmin' || role === 'admin') {
                    navigate("/superadmin/superadmin");
                } else if (role === 'manager') {
                    localStorage.setItem("managerToken", data.token);
                    localStorage.setItem("managerData", JSON.stringify(data.user));
                    navigate("/manager/dashboard");
                } else if (role === 'areamanager' || role === 'employee') {
                    navigate("/employee/areaadmin");
                } else {
                    navigate("/employee/areaadmin");
                }
            } else {
                setError(data.message || "Invalid credentials");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        }
    };

    const handleResetInitialPassword = async (e) => {
        e.preventDefault();
        setError("");
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        const API_URL = getApiBase();
        try {
            const res = await fetch(`${API_URL}/api/auth/reset-initial-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    loginId,
                    oldPassword: password,
                    newPassword
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setRequireReset(false);
                setPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setError("");
                alert("Password reset successfully! Please login with your new password.");
            } else {
                setError(data.message || "Failed to reset password");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        }
    };

    const handleCloseForgotModal = () => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setForgotError("");
        setResetToken("");
    };

    const handleSendOtp = async () => {
        setForgotError("");
        if (!forgotEmail.trim()) {
            setForgotError("Email address is required.");
            return;
        }
        setForgotLoading(true);
        const API_URL = getApiBase();
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/request-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setForgotStep(2);
            } else {
                setForgotError(data.message || "Email address not found.");
            }
        } catch (err) {
            setForgotError("Connection error. Please try again.");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setForgotError("");
        if (!otp.trim() || otp.trim().length !== 6) {
            setForgotError("Please enter a valid 6-digit OTP.");
            return;
        }
        setForgotLoading(true);
        const API_URL = getApiBase();
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail.trim(), otp: otp.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setResetToken(data.token);
                setForgotStep(3);
            } else {
                setForgotError(data.message || "Invalid OTP code.");
            }
        } catch (err) {
            setForgotError("Failed to verify OTP. Please try again.");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setForgotError("");
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
        setForgotLoading(true);
        const API_URL = getApiBase();
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: forgotEmail.trim(),
                    token: resetToken,
                    newPassword
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert("Password reset successful! You can now login with your new password.");
                setShowForgotModal(false);
                setForgotStep(1);
                setForgotEmail("");
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
                setResetToken("");
            } else {
                setForgotError(data.message || "Failed to reset password.");
            }
        } catch (err) {
            setForgotError("Failed to reset password. Please try again.");
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 fade-in">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-6">
                        <img
                            src="/website/roomhy_logo.jpeg"
                            alt="Roomhy Logo"
                            className="h-12 w-auto object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Superadmin Login</h1>
                    <p className="text-slate-500 text-sm">Enter your credentials to access Roomhy</p>
                </div>

                {requireReset ? (
                    <form onSubmit={handleResetInitialPassword} className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Set New Password</h2>
                            <p className="text-slate-500 text-xs mt-1">This is your first login. Please set a new password.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                            <div className="relative">
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none" 
                                    placeholder="New Password" 
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(prev => !prev)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none" 
                                    placeholder="Confirm Password" 
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(prev => !prev)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        {error && (
                            <div className="text-rose-500 text-xs font-bold flex items-center gap-1 animate-shake">
                                <X size={14} /> {error}
                            </div>
                        )}
                        <button 
                            type="submit" 
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all"
                        >
                            Reset Password
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Login ID</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                                    <User size={20} />
                                </span>
                                <input 
                                    type="text"
                                    name="identifier"
                                    autoComplete="username"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    onBlur={(e) => setLoginId(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none text-slate-800 placeholder:text-slate-400" 
                                    placeholder="Enter your ID..." 
                                    required
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 ml-1 uppercase font-bold tracking-wider">Email or Employee ID</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                                    <Lock size={20} />
                                </span>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none text-slate-800 placeholder:text-slate-400" 
                                    placeholder="••••••••" 
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {error && (
                                <div className="mt-3 text-rose-500 text-xs font-bold flex items-center gap-1 animate-shake">
                                    <X size={14} /> {error}
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center gap-2 group shadow-lg shadow-slate-900/10 active:scale-[0.98]"
                        >
                            Login 
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                )}
                
                <div className="mt-8 text-center pt-6 border-t border-slate-50">
                    <button 
                        type="button" 
                        className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors"
                        onClick={() => { handleCloseForgotModal(); setShowForgotModal(true); }}
                    >
                        Forgot Password?
                    </button>
                </div>
            </div>

            {showForgotModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-100 fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-extrabold text-slate-900">Reset Password</h2>
                            <button onClick={handleCloseForgotModal} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        {forgotError && (
                            <div className="mb-4 text-rose-500 text-xs font-bold flex items-center gap-1 animate-shake">
                                <X size={14} /> {forgotError}
                            </div>
                        )}

                        {forgotStep === 1 && (
                            <div className="space-y-6">
                                <p className="text-slate-500 text-sm">Enter your registered email address to receive an OTP.</p>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                                            <Mail size={20} />
                                        </span>
                                        <input 
                                            type="email" 
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none" 
                                            placeholder="your@email.com" 
                                            disabled={forgotLoading}
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSendOtp}
                                    disabled={forgotLoading}
                                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-purple-600/20"
                                >
                                    {forgotLoading ? "Sending OTP..." : "Send OTP"}
                                </button>
                            </div>
                        )}

                        {forgotStep === 2 && (
                            <div className="space-y-6 text-center">
                                <p className="text-slate-500 text-sm">A 6-digit code has been sent to your email.</p>
                                <input 
                                    type="text" 
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none text-center text-3xl font-bold tracking-[0.5em]" 
                                    placeholder="000000" 
                                    maxLength={6}
                                    disabled={forgotLoading}
                                />
                                <button 
                                    onClick={handleVerifyOtp}
                                    disabled={forgotLoading}
                                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-purple-600/20"
                                >
                                    {forgotLoading ? "Verifying..." : "Verify OTP"}
                                </button>
                                <button onClick={() => { setForgotStep(1); setForgotError(""); }} className="text-slate-400 text-sm font-bold hover:text-slate-600">Back</button>
                            </div>
                        )}

                        {forgotStep === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showNewPassword ? "text" : "password"} 
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none" 
                                            placeholder="New Password" 
                                            disabled={forgotLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(prev => !prev)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none" 
                                            placeholder="Confirm Password" 
                                            disabled={forgotLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(prev => !prev)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-purple-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleResetPassword}
                                    disabled={forgotLoading}
                                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-purple-600/20"
                                >
                                    {forgotLoading ? "Resetting..." : "Update Password"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
