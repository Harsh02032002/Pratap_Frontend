import React, { useState, useCallback, useRef, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { setWebsiteSession, getWebsiteApiUrl } from "../../utils/websiteSession";
import { User, Mail, Phone, Lock, ArrowRight, CheckCircle2, Sparkles, Building2, Wallet, Eye, EyeOff } from "lucide-react";
import useSEO from "../../hooks/useSEO";

export default function WebsiteSignup() {
  useSEO({ pageKey: 'register', fallbackTitle: 'Create Roomhy Account - Sign Up Free' });
  const apiUrl = getWebsiteApiUrl();
  const [signupMode, setSignupMode] = useState(true);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [loginCodeSent, setLoginCodeSent] = useState(false);
  const [loadingLoginSend, setLoadingLoginSend] = useState(false);
  const [loadingLoginVerify, setLoadingLoginVerify] = useState(false);
  
  // Signup state
  const [signup, setSignup] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: ""
  });
  const [otp, setOtp] = useState("");
  const [pendingPayload, setPendingPayload] = useState(null);
  const [verificationVisible, setVerificationVisible] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [signupDelivery, setSignupDelivery] = useState({ email: true, whatsapp: false, sms: false, demoOtp: "" });

  // OTP Cooldown rate limiter state
  const [cooldownExpiry, setCooldownExpiry] = useState(() => {
    const stored = localStorage.getItem("signup_otp_cooldown_expiry");
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed > Date.now()) {
        return parsed;
      }
    }
    return 0;
  });

  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!cooldownExpiry) {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.ceil((cooldownExpiry - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) {
        localStorage.removeItem("signup_otp_cooldown_expiry");
        setCooldownExpiry(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cooldownExpiry]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const handleLoginRequestCode = useCallback(async (e) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    setLoadingLoginSend(true);
    try {
      const response = await fetch(`${apiUrl}/api/kyc/login/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429 || (data.message && data.message.toLowerCase().includes("too many"))) {
          const expiry = Date.now() + 10 * 60 * 1000;
          localStorage.setItem("signup_otp_cooldown_expiry", expiry.toString());
          setCooldownExpiry(expiry);
        }
        showToast(data.message || "Unable to send login code", "error");
        return;
      }
      setLoginCodeSent(true);
      showToast(data.message || "Verification code sent", "success");
    } catch (err) {
      showToast("Unable to send code. Please try again.", "error");
    } finally {
      setLoadingLoginSend(false);
    }
  }, [apiUrl, loginEmail, showToast, setCooldownExpiry]);

  const handleLoginVerify = useCallback(async (e) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    const otpValue = loginOtp.trim();
    if (!/^\d{6}$/.test(otpValue)) {
      showToast("Enter a valid 6-digit code", "error");
      return;
    }
    setLoadingLoginVerify(true);
    try {
      const response = await fetch(`${apiUrl}/api/kyc/login/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token || !data.user) {
        showToast(data.message || "Invalid code", "error");
        return;
      }
      setWebsiteSession(data.user, data.token);
      showToast("Login successful!", "success");
      setTimeout(() => {
        window.location.href = "/website/index";
      }, 800);
    } catch (err) {
      showToast("Login failed. Please try again.", "error");
    } finally {
      setLoadingLoginVerify(false);
    }
  }, [apiUrl, loginEmail, loginOtp, showToast]);

  const handleSignupSubmit = useCallback(async (e) => {
    e.preventDefault();
    const payload = {
      firstName: signup.firstName.trim(),
      lastName: signup.lastName.trim(),
      email: signup.email.trim().toLowerCase(),
      phone: signup.phone.trim(),
      password: signup.password
    };
    if (!payload.firstName || !payload.email || !payload.phone || !payload.password) {
      showToast("Please fill all required fields", "error");
      return;
    }
    if (!/^\d{10}$/.test(payload.phone)) {
      showToast("Enter a valid 10-digit 8764425030", "error");
      return;
    }
    setLoadingCreate(true);
    try {
      const res = await fetch(`${apiUrl}/api/kyc/signup/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429 || (data.message && data.message.toLowerCase().includes("too many"))) {
          const expiry = Date.now() + 10 * 60 * 1000;
          localStorage.setItem("signup_otp_cooldown_expiry", expiry.toString());
          setCooldownExpiry(expiry);
        }
        throw new Error(data.message || "Unable to send verification code");
      }
      setPendingPayload(payload);
      setVerificationVisible(true);
      setSignupDelivery({
        email: data?.channels?.email !== false,
        whatsapp: Boolean(data?.channels?.whatsapp),
        sms: Boolean(data?.channels?.sms),
        demoOtp: data?.demoOtp || ""
      });
      showToast(data.message || "Verification code sent", "success");
    } catch (err) {
      showToast(err.message || "Cannot create account now", "error");
    } finally {
      setLoadingCreate(false);
    }
  }, [apiUrl, signup, showToast, setCooldownExpiry]);

  const handleVerify = useCallback(async () => {
    if (!pendingPayload) {
      showToast("Please submit the form first", "error");
      return;
    }
    const otpValue = otp.trim();
    if (!/^\d{6}$/.test(otpValue)) {
      showToast("Enter a valid 6-digit code", "error");
      return;
    }
    setLoadingVerify(true);
    try {
      const res = await fetch(`${apiUrl}/api/kyc/signup/verify-and-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingPayload, otp: otpValue })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }
      if (data.user && data.token) {
        setWebsiteSession(data.user, data.token);
      }
      showToast("Account created successfully!", "success");
      setTimeout(() => {
        window.location.href = "/website/index";
      }, 900);
    } catch (err) {
      showToast(err.message || "Verification failed", "error");
    } finally {
      setLoadingVerify(false);
    }
  }, [apiUrl, otp, pendingPayload, showToast]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      <WebsiteNavbar />

      <main className="flex-grow flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-[calc(100vh-80px)]">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-teal-50 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-rose-50 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-gray-100 my-auto">
          
          {/* Left Side: Marketing & Benefits */}
          <div className="hidden lg:flex flex-col justify-between p-8 lg:p-10 bg-gradient-to-br from-teal-900 to-gray-900 text-white relative">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
            </div>
            
            <div className="relative">
              <h1 className="text-3xl font-extrabold tracking-tight mb-4 leading-tight mt-4">
                Join the <span className="text-teal-400">future</span> of student housing in India.
              </h1>
              
              <div className="space-y-6 mt-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Building2 className="text-teal-400 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Verified Properties</h3>
                    <p className="text-xs text-gray-400">Browse thousands of rooms verified by our team for safety.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Wallet className="text-blue-400 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Smart Bidding</h3>
                    <p className="text-xs text-gray-400">Negotiate rent directly with owners and get the best deal.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-rose-400 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Instant Booking</h3>
                    <p className="text-xs text-gray-400">Lock your room in minutes with zero brokerage.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-auto pt-10 border-t border-white/10">
               <div className="space-y-2">
                  <p className="text-xl font-serif italic text-teal-100 opacity-90 leading-relaxed">
                    "Your study years are for building a <span className="text-teal-400">future</span>. Let us handle building you a home."
                  </p>
                  <div className="w-10 h-1 bg-teal-500/30 rounded-full mt-4"></div>
               </div>
            </div>
          </div>

          {/* Right Side: Auth Forms */}
          <div className="p-6 sm:p-8 lg:p-9 flex flex-col justify-center bg-white">
            <div className="mb-5 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {signupMode ? "Create Account" : "Sign In"}
              </h2>
              <p className="text-sm text-gray-500">
                {signupMode ? "Take control of your life today." : "Access your bookings and messages."}
              </p>
            </div>

            {signupMode ? (
              // SIGNUP FORM
              <form onSubmit={handleSignupSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">First Name</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                        <input
                          type="text"
                          required
                          className="block w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none"
                          placeholder="Harsh"
                          value={signup.firstName}
                          onChange={(e) => setSignup({ ...signup, firstName: e.target.value })}
                        />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Last Name</label>
                      <input
                        type="text"
                        className="block w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none"
                        placeholder="Kaur"
                        value={signup.lastName}
                        onChange={(e) => setSignup({ ...signup, lastName: e.target.value })}
                      />
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none"
                      placeholder="hello@roomhy.com"
                      value={signup.email}
                      onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">8764425030</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength="10"
                      className="block w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none"
                      placeholder="9876543210"
                      value={signup.phone}
                      onChange={(e) => setSignup({ ...signup, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="block w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none"
                      placeholder="••••••••"
                      value={signup.password}
                      onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-teal-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {verificationVisible && (
                  <div className="space-y-2.5 p-3 bg-teal-50 rounded-2xl border border-teal-100 animate-in fade-in zoom-in-95">
                    <p className="text-[10px] text-teal-800 font-medium text-center">
                       Code sent to your email 
                       {signupDelivery.whatsapp ? " & WhatsApp" : signupDelivery.sms ? " & SMS" : ""}.
                    </p>
                    <input
                      type="text"
                      placeholder="6-digit code"
                      maxLength="6"
                      className="block w-full px-4 py-2 bg-white border border-teal-200 rounded-xl text-center text-base font-bold tracking-[0.5em] outline-none focus:ring-2 focus:ring-teal-500/20"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={loadingVerify}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-bold transition-all text-sm shadow-md"
                    >
                      {loadingVerify ? "Verifying..." : "Verify & Create"}
                    </button>
                  </div>
                )}

                {secondsLeft > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold">Rate Limit Exceeded</p>
                      <p className="text-[11px] text-rose-600">Please wait {formatTime(secondsLeft)} before requesting a new OTP.</p>
                    </div>
                  </div>
                )}

                {!verificationVisible && (
                    <button
                      type="submit"
                      disabled={loadingCreate || secondsLeft > 0}
                      className="group w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-400 text-sm mt-1"
                    >
                      {secondsLeft > 0 ? (
                        `Locked (Wait ${formatTime(secondsLeft)})`
                      ) : loadingCreate ? (
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          Create My Account
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                )}

                <p className="text-center mt-3 pt-1 text-xs text-gray-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setSignupMode(false)}
                    className="font-bold text-gray-900 hover:text-teal-600 transition-colors underline decoration-2 underline-offset-4 decoration-teal-500/30 hover:decoration-teal-500 ml-1"
                  >
                    Log in
                  </button>
                </p>
              </form>
            ) : (
              // LOGIN FORM (Simplified for Signup page toggle)
              <form onSubmit={loginCodeSent ? handleLoginVerify : handleLoginRequestCode} className="space-y-6">
                 <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none"
                      placeholder="hello@roomhy.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                {loginCodeSent && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Verification Code</label>
                    <input
                      type="text"
                      maxLength="6"
                      className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-center text-lg font-bold tracking-[0.5em] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </div>
                )}

                {secondsLeft > 0 && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-rose-600 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold">Rate Limit Exceeded</p>
                      <p className="text-[11px] text-rose-600">Please wait {formatTime(secondsLeft)} before requesting a new OTP.</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginCodeSent ? loadingLoginVerify : (loadingLoginSend || secondsLeft > 0)}
                  className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 transform hover:-translate-y-1 active:translate-y-0 disabled:bg-gray-400"
                >
                  {loginCodeSent
                    ? (loadingLoginVerify ? "Verifying..." : "Verify & Login")
                    : secondsLeft > 0
                    ? `Locked (Wait ${formatTime(secondsLeft)})`
                    : (loadingLoginSend ? "Sending Code..." : "Send Login Code")}
                </button>
                
                <p className="text-center mt-6 text-xs text-gray-500">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setSignupMode(true)}
                    className="font-bold text-gray-900 hover:text-teal-600 transition-colors underline decoration-2 underline-offset-4 decoration-teal-500/30 hover:decoration-teal-500"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <WebsiteFooter />
      <MobileBottomNav />

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl animate-in slide-in-from-top-4"
          style={{
            background:
              toast.type === "error"
                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                : toast.type === "success"
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

