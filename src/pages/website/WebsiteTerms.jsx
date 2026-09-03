import { useState, useEffect, useRef } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { FileText, Shield, Users, Building2, AlertCircle, CreditCard, RefreshCw, Scale, ShieldAlert, Mail, Phone, MapPin, CheckCircle2, ChevronRight, Sparkles, ShieldCheck, PhoneCall } from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

export default function WebsiteTerms() {
  useSEO({ 
    pageKey: 'terms', 
    fallbackTitle: 'Terms and Conditions | User Agreement | Roomhy.com',
    fallbackDescription: "Review Roomhy.com's terms and conditions covering platform usage, booking rules, bidding policies, payments, and tenant-owner guidelines."
  });

  const [layoutSections, setLayoutSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const rightContainerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.location.pathname !== '/terms-and-conditions') {
      window.history.replaceState(null, '', '/terms-and-conditions');
    }
  }, []);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await fetchJson('/api/page-layouts/terms');
        if (res.success && res.data && res.data.sections) {
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
      id: "definitions",
      icon: Users,
      title: "1. Definitions",
      content: [
        '"Roomhy", "Company", "We", "Us", or "Our" refers to ROOMHY TECHNOLOGY, a company incorporated under the laws of India, having its registered office at 847, Balaji Nagar, Rangbari, Kota, Rajasthan - 324005.',
        '"User", "You", or "Your" refers to any individual or entity using the platform, including students, tenants, property owners, and hosts.',
        '"Platform" refers to Roomhy\'s website, mobile application, and related smart bidding services.'
      ]
    },
    {
      id: "scope",
      icon: Building2,
      title: "2. Scope of Services",
      content: [
        'Roomhy provides an online marketplace that enables students and tenants to discover verified accommodations (PGs, Hostels, Co-living spaces, Apartments) and connect directly with property owners.',
        'Roomhy operates on a 100% Zero Brokerage model. We do not act as real estate brokers or property managers; we are a technology platform connecting users directly.'
      ]
    },
    {
      id: "bidding",
      icon: Scale,
      title: "3. Smart Bidding & Pricing Rules",
      content: [
        'Users can submit custom monthly rent bids for listed properties based on their budget.',
        'Property owners retain sole discretion to accept, reject, or counter-offer any bid placed by a user.',
        'A bid acceptance creates a mutual commitment between the tenant and property owner to proceed with physical verification and booking.'
      ]
    },
    {
      id: "token",
      icon: CreditCard,
      title: "4. Token Amount & Booking Policy",
      content: [
        'To reserve a property upon bid acceptance, users pay a small token booking amount (typically ₹500).',
        'The token amount holds the property reservation for the agreed move-in window.',
        'If the user visits the property and finds that it does not match the online verified listing, the token amount is 100% fully refundable under our Refund Policy.'
      ]
    },
    {
      id: "responsibilities",
      icon: ShieldAlert,
      title: "5. User Responsibilities",
      content: [
        'Users agree to provide accurate and truthful information during registration, bidding, and verification.',
        'Property owners warrant that listed properties possess all necessary local municipal approvals, safety certifications, and basic amenities as advertised.',
        'Any fraudulent activity, fake listings, or abusive communication will result in immediate permanent suspension.'
      ]
    },
    {
      id: "liability",
      icon: AlertCircle,
      title: "6. Limitation of Liability",
      content: [
        'Roomhy conducts physical verification of listed properties; however, final tenancy contracts and rent payments are directly between tenant and owner.',
        'Roomhy is not liable for personal disputes, theft, property damage, or contractual breaches arising between property owners and tenants during residency.'
      ]
    },
    {
      id: "contact",
      icon: Mail,
      title: "7. Contact & Legal Notices",
      content: [
        'For legal notices, policy inquiries, or terms compliance, please contact:',
        'Email: team@roomhy.com | Phone: +91 8764425030',
        'Registered Address: 847, Balaji Nagar, Rangbari, Kota, Rajasthan 324005, India'
      ]
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
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=1980&auto=format&fit=crop')` }}
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
                <span className="uppercase tracking-wider">Legal Framework &amp; Guidelines</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Terms &amp; Conditions <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  &amp; User Agreement.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                Please review these terms and conditions carefully covering Roomhy platform usage, smart bidding rules, zero brokerage policy, and booking guidelines.
              </p>

              {/* Trust Indicators Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-300/80 text-[11px] font-black text-slate-800 tracking-wide uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-[#0FA596]" />
                  </div>
                  <span>100% Zero Brokerage</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span>Fair Bidding Rules</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <span>Direct Connect</span>
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
                  <span>Terms Inquiries?</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Need clarification on user agreement, bidding rules, or owner listing policies? Contact our legal team.
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
                    </div>

                    <div className="space-y-3">
                      {sec.content.map((p, pIdx) => (
                        <p key={pIdx} className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
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
