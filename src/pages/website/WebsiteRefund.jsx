import { useState, useEffect, useRef } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { RefreshCcw, CreditCard, Calendar, GraduationCap, AlertCircle, Clock, Mail, Phone, MapPin, CheckCircle2, ChevronRight, ArrowRight, Sparkles, ShieldCheck, PhoneCall } from 'lucide-react';
import { Link } from "react-router-dom";
import useSEO from "../../hooks/useSEO";

export default function WebsiteRefund() {
  useSEO({
    pageKey: 'refund',
    fallbackTitle: 'Refund Policy | 100% Token Refund | Roomhy.com',
    fallbackDescription: "Review Roomhy.com's transparent refund policy regarding token booking deposits, cancellation percentages, student protections, and processing timelines."
  });

  const [activeTab, setActiveTab] = useState(0);
  const rightContainerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.location.pathname !== '/refund-policy') {
      window.history.replaceState(null, '', '/refund-policy');
    }
  }, []);

  const sections = [
    {
      id: "token",
      icon: RefreshCcw,
      title: "1. Token Deposit & Security Refunds",
      content: [
        "100% Token Refund: Token money (₹500) is 100% fully refundable if the property visited physically does not match the online photos or listing specs.",
        "Instant Claim: You can submit a refund claim directly online within 48 hours of room visit.",
        "Automatic Processing: Approved refunds are returned via original payment method (UPI / Bank Transfer) within 2-4 business days."
      ]
    },
    {
      id: "cancellation-refunds",
      icon: Calendar,
      title: "2. Booking Cancellation Refunds",
      content: [
        "Cancellation by Tenant (Before Check-in): 80% of the advance booking deposit is refunded if cancelled 7+ days prior to move-in. 20% is retained for administrative processing.",
        "Cancellation by Owner: If an owner cancels a confirmed booking, the tenant receives a 100% full refund plus priority re-allocation assistance.",
        "No-Show Policy: If a tenant fails to check in without prior notification, the host retains the booking deposit."
      ]
    },
    {
      id: "student",
      icon: GraduationCap,
      title: "3. Special Protection for Students",
      content: [
        "Coaching Relocation / Exam Exemption: Students moving due to coaching center changes or exam schedule modifications are eligible for fee waivers.",
        "Verification Required: Submission of a valid student ID or institute admission letter is required for special waivers."
      ]
    },
    {
      id: "exceptional",
      icon: AlertCircle,
      title: "4. Exceptional Circumstances",
      content: [
        "Force Majeure & Medical Emergencies: Full or partial refunds are granted upon documentation of medical emergencies or institutional closures.",
        "Review Window: Exceptional requests are reviewed individually by Roomhy Management within 24 hours."
      ]
    },
    {
      id: "timeline",
      icon: Clock,
      title: "5. Refund Timeline & Process",
      content: [
        "Online Submission: Request refund via website form or My Stays dashboard.",
        "Verification: Document audit completed within 24 hours.",
        "Bank Credit: 2-4 business days to original payment method or UPI."
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
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1980&auto=format&fit=crop')` }}
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
                <span className="uppercase tracking-wider">100% Token Refund Guarantee</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Refund Policy &amp; <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Transparent Terms.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                Transparent terms regarding token booking deposits, cancellation percentages, student protections, and fast 2-4 business day processing.
              </p>

              <div className="pt-1">
                <Link
                  to="/website/refund-request"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0FA596] to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105"
                >
                  <span>Submit Online Refund Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Trust Indicators Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-300/80 text-[11px] font-black text-slate-800 tracking-wide uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-[#0FA596]" />
                  </div>
                  <span>100% Token Refund</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span>2-4 Day Processing</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <span>Direct UPI Payout</span>
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
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-2">Refund Sections</div>
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

              {/* Need Quick Refund Card */}
              <div className="bg-gradient-to-br from-[#EEF8F6] via-white to-emerald-50/60 rounded-3xl p-5 border border-teal-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-[#0FA596] font-extrabold text-xs">
                  <Sparkles className="w-4 h-4 text-[#0FA596]" />
                  <span>Request Refund Now</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Visited a room and want your ₹500 token back? Fill our 1-minute online refund request form.
                </p>
                <Link
                  to="/website/refund-request"
                  className="inline-flex items-center justify-center gap-2 w-full text-xs font-extrabold text-white bg-[#0FA596] hover:bg-teal-600 px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
                >
                  <span>Submit Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
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
