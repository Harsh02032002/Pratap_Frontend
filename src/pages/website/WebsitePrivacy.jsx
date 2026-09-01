import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Shield, Eye, Lock, Database, UserCheck, Mail, Phone, MapPin, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
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

  useEffect(() => {
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
      items: [
        "Personal Information: Name, email address, phone number, date of birth, profile picture, and identity verification details.",
        "Property Information: Contact details, property location, rental prices, photos, and ownership documents (for property owners).",
        "Usage Information: IP address, device type, browser type, pages visited, and browsing patterns.",
        "Payment Information: Payment method, transaction history, and billing addresses (processed securely via encrypted payment gateways)."
      ]
    },
    {
      id: "use",
      icon: Eye,
      title: "2. How We Use Your Information",
      items: [
        "To facilitate student accommodation listings, direct bidding, and verified bookings.",
        "To process token deposits and instant refunds seamlessly.",
        "To verify identity, prevent middleman fraud, and maintain broker-free safety.",
        "To send automated booking updates, landlord counter-offers, and status notifications.",
        "To continuously optimize platform speed, UI accessibility, and student experience.",
        "To satisfy legal and statutory compliance obligations under Indian laws."
      ]
    },
    {
      id: "security",
      icon: Lock,
      title: "3. Data Security & Encryption",
      items: [
        "We enforce industry-standard security protocols including 256-bit SSL encryption, automated firewalls, and isolated secure cloud servers to protect your personal information against unauthorized access, loss, or alteration."
      ]
    },
    {
      id: "rights",
      icon: UserCheck,
      title: "4. Your Rights & Data Choices",
      items: [
        "Right to access your stored profile and booking history anytime.",
        "Right to request account deletion or data anonymization (subject to active lease/refund records).",
        "Right to opt out of promotional communications with 1-click.",
        "Right to request data portability of your verified user documents."
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8FBFA] text-slate-900 selection:bg-teal-500 selection:text-white">
      <WebsiteNavbar />

      <main className="flex-grow">
        {/* --- HERO BANNER --- */}
        <section className="relative border-b border-[#DCE7EF]/80 text-slate-900 py-8 md:py-10 px-4 md:px-8 overflow-hidden bg-gradient-to-r from-slate-50 via-white to-teal-50/40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex-1 text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50/90 border border-teal-200/90 text-[#0FA596] text-xs font-extrabold mb-2 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-[#0FA596]" />
                <span>Data Protection &amp; Privacy Standard</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-1.5 leading-tight">
                Privacy <span className="bg-gradient-to-r from-[#0FA596] to-emerald-500 bg-clip-text text-transparent">Policy</span>
              </h1>

              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                We are committed to protecting your personal data, booking details, and privacy with enterprise-grade security.
              </p>
            </div>

            <div className="relative w-full md:w-[340px] h-32 md:h-36 rounded-2xl overflow-hidden shadow-md border border-slate-200/90 shrink-0 my-auto group">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop"
                alt="Data Security &amp; Privacy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-white/50 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black text-slate-900">Encrypted &amp; Secure</div>
                  <div className="text-[9px] font-bold text-slate-500">100% User Privacy</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold border border-emerald-200">
                  Protected
                </span>
              </div>
            </div>
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
                        const el = document.getElementById(sec.id);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

            {/* Right Detailed Section Cards (Fixed Portion Scrollable) */}
            <div className="lg:col-span-8 space-y-6 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-3 no-scrollbar scroll-smooth">
              
              {/* Introduction Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 border-l-4 border-l-[#0FA596] shadow-2xs space-y-2">
                <h2 className="text-lg font-extrabold text-slate-950">Introduction</h2>
                <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                  Roomhy is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our web platform and digital services provided by <strong>ROOMHY TECHNOLOGY</strong>.
                </p>
              </div>

              {/* Policy Category Sections */}
              {staticSections.map((section) => {
                const IconComp = section.icon;
                return (
                  <div
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-24 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 border-l-4 border-l-[#0FA596] shadow-2xs hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0FA596] flex items-center justify-center font-bold shrink-0">
                        <IconComp className="w-5 h-5 text-[#0FA596]" />
                      </div>
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-950">{section.title}</h2>
                    </div>

                    <div className="space-y-3 pt-1">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
                          <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Corporate Contact Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-base font-extrabold text-slate-950">Corporate Privacy &amp; Legal Entity</h3>
                
                <div className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
                  <div className="font-black text-slate-900 text-sm">ROOMHY TECHNOLOGY</div>
                  
                  <div className="flex items-start gap-2.5 text-slate-600">
                    <MapPin className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
                    <span>847, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India</span>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <a href="mailto:team@roomhy.com" className="inline-flex items-center gap-2 text-xs font-bold text-[#0FA596] hover:text-teal-700">
                      <Mail className="w-4 h-4" /> team@roomhy.com
                    </a>
                    <a href="tel:+918764425030" className="inline-flex items-center gap-2 text-xs font-bold text-[#0FA596] hover:text-teal-700">
                      <Phone className="w-4 h-4" /> +91 8764425030
                    </a>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>
      </main>

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}
