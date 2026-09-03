import { useState, useEffect, useRef } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Shield, Eye, Lock, Database, UserCheck, Mail, Phone, MapPin, CheckCircle2, ChevronRight, Sparkles, ShieldCheck, PhoneCall } from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

export default function WebsitePrivacy() {
  useSEO({ 
    pageKey: 'privacy', 
    fallbackTitle: 'Privacy Policy | User Data Protection | Roomhy.com',
    fallbackDescription: "Read Roomhy.com's privacy policy to understand how we collect, use, and protect your personal data, booking details, and browsing information securely."
  });

  const [layoutSections, setLayoutSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const rightContainerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.location.pathname !== '/privacy-policy') {
      window.history.replaceState(null, '', '/privacy-policy');
    }
  }, []);

  useEffect(() => {
    const fetchLayout = async () => {
      let resolved = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          if (!resolved) {
            resolve({ success: false, timeout: true });
          }
        }, 3000);
      });

      try {
        const apiPromise = fetchJson('/api/page-layouts/privacy');
        const res = await Promise.race([apiPromise, timeoutPromise]);
        resolved = true;
        if (res && res.success && res.data && res.data.sections) {
          const sorted = res.data.sections.sort((a, b) => a.order - b.order);
          setLayoutSections(sorted);
        }
      } catch (err) {
        // silent fallback
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, []);

  const staticSections = [
    {
      id: "collect",
      icon: Database,
      title: "1. Information We Collect",
      badge: "DATA COLLECTION",
      content: (
        <div className="space-y-4">
          <p className="text-xs md:text-sm leading-relaxed text-slate-700 font-medium">
            We collect personal information that you voluntarily provide to us when registering on Roomhy.com, submitting property enquiries, bidding on room rentals, or communicating with us.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100/90 space-y-1">
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#0FA596]" />
                <span>Personal Identity</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Name, email, phone number, college/workplace details, and profile photo.</p>
            </div>
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100/90 space-y-1">
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#0FA596]" />
                <span>Verification Data</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Government ID proofs for owner listings and tenant safety verification.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "usage",
      icon: Eye,
      title: "2. How We Use Your Information",
      badge: "DATA UTILIZATION",
      content: (
        <div className="space-y-4">
          <p className="text-xs md:text-sm leading-relaxed text-slate-700 font-medium">
            Roomhy uses your information strictly to facilitate direct connections between tenants and verified property owners, process custom bids, and ensure platform safety.
          </p>
          <ul className="space-y-2 text-xs md:text-sm text-slate-700 font-medium">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
              <span>To match student housing requirements with available verified PGs, Hostels, and Apartments.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
              <span>To facilitate direct owner-tenant in-app communication without broker interference.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
              <span>To process token deposits, bid acceptances, and fast refund requests safely.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "security",
      icon: Lock,
      title: "3. Data Security & Storage",
      badge: "SECURITY PROTOCOLS",
      content: (
        <div className="space-y-4">
          <p className="text-xs md:text-sm leading-relaxed text-slate-700 font-medium">
            We implement industry-standard 256-bit SSL encryption, secure database access protocols, and regular security audits to protect your data against unauthorized access.
          </p>
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 shadow-sm">
            <div className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Zero Selling Policy</span>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Roomhy Technology NEVER sells, rents, or trades your personal phone numbers or email addresses to third-party telemarketers or external broker agencies.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "cookies",
      icon: Database,
      title: "4. Cookies & Analytics",
      badge: "COOKIE POLICY",
      content: (
        <div className="space-y-4">
          <p className="text-xs md:text-sm leading-relaxed text-slate-700 font-medium">
            We use essential session cookies and performance analytics to store your search preferences (e.g. city, room type, budget) and deliver a smooth browsing experience.
          </p>
        </div>
      )
    },
    {
      id: "contact",
      icon: Mail,
      title: "5. Privacy Contact Officer",
      badge: "GET IN TOUCH",
      content: (
        <div className="space-y-4">
          <p className="text-xs md:text-sm leading-relaxed text-slate-700 font-medium">
            If you have questions, concerns, or data deletion requests regarding this Privacy Policy, please contact our privacy compliance team directly:
          </p>
          <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/90 space-y-2 text-xs md:text-sm font-semibold text-slate-800">
            <div className="flex items-center gap-2 text-slate-900 font-black">
              <Mail className="w-4 h-4 text-[#0FA596]" />
              <span>Email: team@roomhy.com</span>
            </div>
            <div className="flex items-center gap-2 text-slate-900 font-black">
              <Phone className="w-4 h-4 text-[#0FA596]" />
              <span>Phone: +91 8764425030</span>
            </div>
            <div className="flex items-center gap-2 text-slate-900 font-black">
              <MapPin className="w-4 h-4 text-[#0FA596]" />
              <span>Address: 847, Balaji Nagar, Rangbari, Kota, Rajasthan 324005, India</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F4F7F6] text-slate-900 selection:bg-teal-500 selection:text-white">
      <WebsiteNavbar />

      <main className="flex-grow">
        
        {/* ================================================================
         * 1. HERO — FULL SECTION BACKGROUND PHOTO (EDGE-TO-EDGE WITH SOFT LEFT OVERLAY)
         * ================================================================ */}
        <section className="relative border-b border-slate-200/80 text-slate-900 py-8 sm:py-10 px-4 sm:px-8 lg:px-14 overflow-hidden bg-slate-900 flex items-center min-h-[380px]">
          
          {/* Full Width Background Photo Layer (Edge-to-Edge Across 100% Section) */}
          <div 
            className="absolute inset-0 bg-cover bg-center md:bg-[center_right] opacity-100 z-0 brightness-105"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1980&auto=format&fit=crop')` }}
          />

          {/* Rich White Opacity Overlay for 100% text readability & background visibility */}
          <div 
            className="absolute inset-0 z-0"
            style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.90) 50%, rgba(255,255,255,0.35) 100%)' }}
          ></div>

          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            
            {/* Left Column: Direct Dark Typography */}
            <div className="w-full md:max-w-[500px] lg:max-w-[540px] text-left space-y-3.5 text-slate-900">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-teal-200 text-[#0FA596] text-[10px] sm:text-xs font-black tracking-wide shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#0FA596] animate-pulse" />
                <span className="uppercase tracking-wider">Data Protection &amp; Privacy Standard</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Privacy Policy &amp; <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  User Data Security.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                We are committed to protecting your personal information, booking details, and browsing privacy with enterprise-grade SSL encryption and zero third-party data selling.
              </p>

              {/* Trust Indicators Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-300/80 text-[11px] font-black text-slate-800 tracking-wide uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-[#0FA596]" />
                  </div>
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span>100% User Privacy</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <span>Zero Data Sharing</span>
                </div>
              </div>
            </div>

            {/* Right Column: Open space */}
            <div className="hidden md:block w-full md:w-1/2"></div>

          </div>
        </section>

        {/* --- MAIN CONTENT & STICKY NAV GRID --- */}
        <section className="py-8 md:py-14 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Quick Navigation Index */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-3">
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-2">Table of Contents</div>
                <div className="space-y-1">
                  {staticSections.map((sec, i) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab(i);
                        const targetEl = document.getElementById(sec.id);
                        const containerEl = rightContainerRef.current;
                        if (targetEl && containerEl) {
                          const targetTop = targetEl.offsetTop - containerEl.offsetTop;
                          containerEl.scrollTo({ top: targetTop, behavior: 'smooth' });
                        }
                      }}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        activeTab === i
                          ? "bg-gradient-to-r from-[#0FA596] to-teal-500 text-white shadow-md shadow-teal-500/20"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{sec.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Support Card */}
              <div className="bg-gradient-to-br from-[#EEF8F6] via-white to-emerald-50/60 rounded-3xl p-5 border border-teal-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-[#0FA596] font-extrabold text-xs">
                  <Sparkles className="w-4 h-4 text-[#0FA596]" />
                  <span>Privacy Queries?</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Have questions about how your data is handled? Reach out to our privacy compliance officer anytime.
                </p>
                <a
                  href="mailto:team@roomhy.com"
                  className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0FA596] bg-white hover:bg-teal-50 border border-teal-200/80 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
                >
                  <Mail className="w-3.5 h-3.5 text-[#0FA596]" />
                  <span>team@roomhy.com</span>
                </a>
              </div>
            </div>

            {/* Right Detailed Section Cards */}
            <div ref={rightContainerRef} className="lg:col-span-8 space-y-6">
              {staticSections.map((sec, idx) => {
                const IconComp = sec.icon;
                return (
                  <div
                    key={sec.id}
                    id={sec.id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4 hover:border-teal-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0FA596] border border-teal-100 flex items-center justify-center shrink-0">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
                          {sec.title}
                        </h2>
                      </div>
                      <span className="text-[10px] font-black tracking-widest text-[#0FA596] bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase">
                        {sec.badge}
                      </span>
                    </div>

                    <div>{sec.content}</div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      </main>

      <WebsiteFooter />

      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
