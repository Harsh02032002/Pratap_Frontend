import { useState, useEffect, useRef } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Ban, ShieldCheck, AlertTriangle, Users, Building2, Mail, Phone, MapPin, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
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
      id: "fair-use",
      icon: ShieldCheck,
      title: "5. Fair Use & Anti-Spam Policy",
      content: [
        "Posting false, duplicate, or unverified property listings is strictly forbidden.",
        "Submitting non-serious or fake bids with no intent to rent is prohibited.",
        "Abusing or spamming other platform users results in permanent account suspension.",
        "Circumventing platform features to bypass security audits is disallowed."
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
                <Ban className="w-3.5 h-3.5 text-[#0FA596]" />
                <span>Transparent Cancellation Policy</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-1.5 leading-tight">
                Cancellation <span className="bg-gradient-to-r from-[#0FA596] to-emerald-500 bg-clip-text text-transparent">Policy</span>
              </h1>

              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                Clear rules regarding booking cancellations, bid reversals, and fair platform usage for student tenants and property hosts.
              </p>
            </div>

            <div className="relative w-full md:w-[340px] h-32 md:h-36 rounded-2xl overflow-hidden shadow-md border border-slate-200/90 shrink-0 my-auto group">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop"
                alt="Roomhy Cancellation Policy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-white/50 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black text-slate-900">Easy Cancellation</div>
                  <div className="text-[9px] font-bold text-slate-500">Fair Use Guidelines</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[9px] font-extrabold border border-teal-200">
                  Transparent
                </span>
              </div>
            </div>
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
                  <span>Cancellation Queries?</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Our support desk helps resolve booking cancellations and bid reversals within 2-4 hours.
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

            {/* Right Detailed Cards (Fixed Portion Scrollable) */}
            <div ref={rightContainerRef} className="lg:col-span-8 space-y-6 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-3 no-scrollbar scroll-smooth">">
              
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 border-l-4 border-l-[#0FA596] shadow-2xs space-y-2">
                <h2 className="text-lg font-extrabold text-slate-950">Policy Overview</h2>
                <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                  This Cancellation Policy outlines terms for cancelling property reservations, retracting bids, and fair use guidelines for ROOMHY TECHNOLOGY users.
                </p>
              </div>

              {sections.map((section) => {
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
                      {section.content.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
                          <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Corporate Contact Info */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-base font-extrabold text-slate-950">Corporate Entity Details</h3>
                
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
