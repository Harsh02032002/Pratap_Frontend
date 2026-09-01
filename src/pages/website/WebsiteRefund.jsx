import { useState, useEffect, useRef } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { RefreshCcw, CreditCard, Calendar, GraduationCap, AlertCircle, Clock, Mail, Phone, MapPin, CheckCircle2, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
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
        "Force Majeure & Medical Emergencies: Full 100% refund eligibility applies in cases of verified medical emergencies, natural disasters, or government restrictions.",
        "Documentation required within 5 days of incident."
      ]
    },
    {
      id: "timeline",
      icon: Clock,
      title: "5. Processing & Payout Timelines",
      content: [
        "UPI & Net Banking: Processed within 24 to 48 business hours upon approval.",
        "Debit / Credit Cards: Processed within 2 to 4 business days depending on issuing bank policies.",
        "Zero Hidden Fees: Roomhy does not charge any hidden deduction charges on approved student refund claims."
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
                <RefreshCcw className="w-3.5 h-3.5 text-[#0FA596]" />
                <span>Hassle-Free Security &amp; Token Refunds</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-1.5 leading-tight">
                Refund <span className="bg-gradient-to-r from-[#0FA596] to-emerald-500 bg-clip-text text-transparent">Policy</span>
              </h1>

              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                Transparent terms regarding booking deposits, token refunds, and 2-4 business day processing timelines.
              </p>

              <div className="pt-3">
                <Link
                  to="/refund-request"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0FA596] hover:bg-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105"
                >
                  <span>Submit Online Refund Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="relative w-full md:w-[340px] h-32 md:h-36 rounded-2xl overflow-hidden shadow-md border border-slate-200/90 shrink-0 my-auto group">
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop"
                alt="Roomhy Refund Policy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-white/50 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black text-slate-900">Token &amp; Deposit Refunds</div>
                  <div className="text-[9px] font-bold text-slate-500">2-4 Business Days</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold border border-emerald-200">
                  Guaranteed
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

              {/* Online Form Quick Access Box */}
              <div className="bg-gradient-to-br from-[#EEF8F6] via-white to-emerald-50/60 rounded-3xl p-5 border border-teal-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-[#0FA596] font-extrabold text-xs">
                  <Sparkles className="w-4 h-4 text-[#0FA596]" />
                  <span>Need a Refund Claim?</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Fill out our official refund request form with your Booking ID for fast processing.
                </p>
                <Link
                  to="/refund-request"
                  className="inline-flex items-center gap-2 text-xs font-extrabold text-white bg-[#0FA596] hover:bg-teal-600 px-4 py-2 rounded-xl transition-all shadow-md"
                >
                  <span>Go to Refund Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Detailed Cards (Fixed Portion Scrollable) */}
            <div ref={rightContainerRef} className="lg:col-span-8 space-y-6 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-3 no-scrollbar scroll-smooth">
              
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 border-l-4 border-l-[#0FA596] shadow-2xs space-y-2">
                <h2 className="text-lg font-extrabold text-slate-950">Overview of Roomhy Refund Policy</h2>
                <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                  This policy details the refund terms for booking deposits, token money, and cancellations for student accommodations managed through the Roomhy platform of <strong>ROOMHY TECHNOLOGY</strong>.
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
                <h3 className="text-base font-extrabold text-slate-950">Refund Assistance Desk</h3>
                
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
