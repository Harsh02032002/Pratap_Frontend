import React, { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { useWebsiteLogin } from "../../hooks/useWebsiteLogin";
import { Mail, Lock, ArrowRight, ShieldCheck, UserCheck, Star, Eye, EyeOff } from "lucide-react";
import useSEO from "../../hooks/useSEO";

export default function WebsiteLogin() {
  useSEO({ 
    pageKey: 'login', 
    fallbackTitle: 'Login to Your Account | Tenant & Owner | Roomhy.com',
    fallbackDescription: 'Login to your Roomhy.com account to manage bookings, track live bids, connect directly with property owners, or access your owner dashboard.'
  });

  useEffect(() => {
    if (window.location.pathname !== '/login') {
      window.history.replaceState(null, '', '/login');
    }
  }, []);
  const {
    email,
    password,
    loading,
    error,
    setEmail,
    setPassword,
    handleSubmit,
    handleForgot
  } = useWebsiteLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <WebsiteNavbar />

      <main className="flex-grow flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden h-[calc(100vh-80px)]">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-50 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-gray-100 max-h-[90vh]">
          
          {/* Left Side: Branding & Info */}
          <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
            </div>
            
            <div className="relative">
              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy" className="h-8 w-auto mb-8 brightness-0 invert" />
              <h1 className="text-3xl font-extrabold tracking-tight mb-4 leading-tight">
                Your journey to a better <span className="text-teal-400">stay</span> starts here.
              </h1>
              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                Join thousands of students finding verified, broker-free accommodations across India.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                    <ShieldCheck className="text-teal-400 w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-200">100% Verified Listings</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <UserCheck className="text-blue-400 w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-200">Direct Owner Contact</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Star className="text-purple-400 w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-200">Exclusive Student Benefits</span>
                </div>
              </div>
            </div>

            <div className="relative mt-auto pt-10 border-t border-white/10">
               <div className="space-y-2">
                  <p className="text-xl font-serif italic text-teal-100 opacity-90 leading-relaxed">
                    "Finding a house is easy, but finding a <span className="text-teal-400">home</span> that understands your journey is where Roomhy begins."
                  </p>
                  <div className="w-10 h-1 bg-teal-500/30 rounded-full mt-4"></div>
               </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
              <p className="text-sm text-gray-500">Sign in to access your dashboard and bookings.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-medium animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none text-sm"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-semibold text-gray-700">Password</label>
                  <button type="button" onClick={handleForgot} className="text-[10px] font-bold text-teal-600 hover:text-teal-700 transition-colors uppercase tracking-wider">
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none text-sm"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-teal-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="group w-full py-3.5 px-6 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 transform hover:-translate-y-1 active:translate-y-0"
              >
                {loading ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center pt-2">
              <p className="text-xs text-gray-500">
                Don't have an account?
                <a href="/website/signup" className="ml-2 font-bold text-gray-900 hover:text-teal-600 transition-colors underline decoration-2 underline-offset-4 decoration-teal-500/30 hover:decoration-teal-500">
                  Create one for free
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}
