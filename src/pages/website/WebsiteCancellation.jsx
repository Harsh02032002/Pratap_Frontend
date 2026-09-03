import { useState, useEffect, useRef } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Ban, ShieldCheck, AlertTriangle, Users, Building2, Mail, Phone, MapPin, CheckCircle2, ChevronRight, Sparkles, PhoneCall } from 'lucide-react';
import useSEO from "../../hooks/useSEO";

export default function WebsiteCancellation() {
  useSEO({
    pageKey: 'cancellation',
    fallbackTitle: 'Cancellation Policy | Booking & Bid Rules | Roomhy.com',
    fallbackDescription: "Read Roomhy.com's transparent cancellation policy covering booking cancellations for students and property owners, fair use terms, and exceptional cases."
  });

  const [activeTab, setActiveTab] = useState(0);
  const rightContainerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.location.pathname !== '/cancellation-policy' && window.location.pathname !== '/cancellation') {
      window.history.replaceState(null, '', '/cancellation-policy');
    }
  }, []);

  const sections = [
    {
      id: "definitions",
      icon: Users,
      title: "1. Definitions & Scope",
      content: [
        '"Roomhy", "We", "Us", or "Our" refers to ROOMHY TECHNOLOGY and its associated services.',
        '"User", "You", or "Your" refers to any individual or entity using the platform.',
        '"Platform" refers to Roomhy\'s website, mobile application, and bidding software.'
      ]
    },
    {
      id: "student-cancellation",
      icon: Ban,
      title: "2. Cancellation by Students",
      content: [
        "You may cancel a bidding request at any time before the property owner confirms your offer — 100% penalty-free.",
        "If you cancel after owner confirmation, please notify the host promptly via the in-app chat. Token deposit refunds are governed by our Refund Policy."
      ]
    },
    {
      id: "owner-cancellation",
      icon: Building2,
      title: "3. Cancellation by Property Owners",
      content: [
        "Property owners may cancel or decline bids prior to accepting a tenant's offer.",
        "Once a bid is accepted, host cancellations without valid justification affect landlord badge ratings and visibility."
      ]
    },
    {
      id: "exceptional-cases",
      icon: AlertTriangle,
      title: "4. Exceptional Circumstances",
      content: [
        "Roomhy may unilaterally cancel or reverse a booking if fraudulent or misleading activity is detected.",
        "Bookings for listings violating physical safety or accuracy rules are immediately voided with 100% tenant deposit refund."
      ]
    },
    {
      id: "contact-support",
      icon: Mail,
      title: "5. Cancellation Support & Disputes",
      content: [
        "For immediate cancellation support, please email team@roomhy.com or call +91 8764425030.",
        "Registered Office: 847, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India."
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
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1980&auto=format&fit=crop')` }}
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
                <span className="uppercase tracking-wider">Transparent Cancellation Policy</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Cancellation Policy &amp; <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Booking Guidelines.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                Clear rules regarding booking cancellations, bid reversals, landlord commitments, and fair platform usage for students and hosts.
              </p>

              {/* Trust Indicators Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-300/80 text-[11px] font-black text-slate-800 tracking-wide uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-[#0FA596]" />
                  </div>
                  <span>Fair Bidding Terms</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span>Instant Reversals</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Right Column: Open space */}
            <div className="hidden md:block w-full md:w-1/2"></div>

          </div>
        </section>

        {/* --- MAIN CONTENT GRID --- */}
        <section className="py-8 md:py-14 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Sidebar Table of Contents */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-3">
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-2">Cancellation Sections</div>
                <div className="space-y-1">
                  {sections.map((sec, i) => (
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
                  <span>Need Cancellation Help?</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Have questions about cancelling a bid or room reservation? Contact our support team.
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
              {sections.map((sec) => {
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

                    <ul className="space-y-3">
                      {sec.content.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
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
