import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { FileText, Shield, Users, Building2, AlertCircle, CreditCard, RefreshCw, Scale, ShieldAlert, Mail, Phone, MapPin, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
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

  useEffect(() => {
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
        "Roomhy provides an online technology platform connecting students seeking accommodation with verified property owners via transparent, real-time budget bidding.",
        "We do not own, manage, control, or operate the physical properties listed on our platform, nor do we act as a broker. Our service facilitates direct listing discovery, price negotiations, and verified initial token bookings."
      ]
    },
    {
      id: "eligibility",
      icon: Shield,
      title: "3. User Eligibility & Registration",
      content: [
        "You must be at least 18 years old or have parental/guardian consent to enter legally binding contracts.",
        "You agree to provide complete and accurate information during registration and keep your login credentials confidential."
      ]
    },
    {
      id: "listings",
      icon: AlertCircle,
      title: "4. Property Listings & Host Obligations",
      content: [
        "Property hosts must ensure all listing information, rental prices, room photos, and amenities are accurate and non-misleading.",
        "Roomhy reserves the right to audit, reject, or remove any property listing that violates our physical verification standards or student safety codes."
      ]
    },
    {
      id: "payment",
      icon: CreditCard,
      title: "5. Payment & Financial Terms",
      content: [
        "All token booking deposits or subscription fees are processed via encrypted third-party payment gateways (such as Razorpay).",
        "Rent payments made directly to property owners at check-in are governed by the rental agreement between host and tenant.",
        "Roomhy provides instant receipt confirmation for all token transactions executed through our official checkout."
      ]
    },
    {
      id: "cancellation",
      icon: RefreshCw,
      title: "6. Cancellation & Refunds",
      content: [
        "Token refunds and booking cancellations are subject to Roomhy's official Cancellation & Refund Policy.",
        "Eligible refund amounts are transferred back to the original source account within 2-4 business days."
      ]
    },
    {
      id: "liability",
      icon: ShieldAlert,
      title: "7. Limitation of Liability",
      content: [
        "To the extent permitted by Indian law, ROOMHY TECHNOLOGY and its directors shall not be liable for indirect, punitive, or consequential damages.",
        "The rental contract is strictly between the tenant and property owner. Roomhy is not a party to private lease disputes."
      ]
    },
    {
      id: "arbitration",
      icon: Scale,
      title: "8. Dispute Resolution & Arbitration",
      content: [
        "Any dispute arising out of platform usage shall first be resolved through mutual discussion.",
        "Unresolved disputes shall be referred to arbitration in Kota, Rajasthan, India, under the Indian Arbitration and Conciliation Act, 1996."
      ]
    },
    {
      id: "jurisdiction",
      icon: Scale,
      title: "9. Governing Law & Jurisdiction",
      content: [
        "These Terms and Conditions shall be governed by and construed in accordance with the laws of India.",
        "Exclusive jurisdiction rests with the courts of Kota, Rajasthan, India."
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
                <FileText className="w-3.5 h-3.5 text-[#0FA596]" />
                <span>Legal Framework &amp; Guidelines</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-1.5 leading-tight">
                Terms &amp; <span className="bg-gradient-to-r from-[#0FA596] to-emerald-500 bg-clip-text text-transparent">Conditions</span>
              </h1>

              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                Please review these terms and conditions carefully before using Roomhy platform and booking verified stays.
              </p>
            </div>

            <div className="relative w-full md:w-[340px] h-32 md:h-36 rounded-2xl overflow-hidden shadow-md border border-slate-200/90 shrink-0 my-auto group">
              <img
                src="https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop"
                alt="Terms and Conditions"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-white/50 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black text-slate-900">User Agreement</div>
                  <div className="text-[9px] font-bold text-slate-500">Legal Standard</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[9px] font-extrabold border border-teal-200">
                  Official
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

              {/* Legal Support Card */}
              <div className="bg-gradient-to-br from-[#EEF8F6] via-white to-emerald-50/60 rounded-3xl p-5 border border-teal-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-[#0FA596] font-extrabold text-xs">
                  <Sparkles className="w-4 h-4 text-[#0FA596]" />
                  <span>Questions about Terms?</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Our legal &amp; compliance team is available to address any contractual queries.
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
                <h2 className="text-lg font-extrabold text-slate-950">User Agreement Overview</h2>
                <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                  These Terms &amp; Conditions govern your access to and use of the Roomhy website, mobile services, and bidding engine provided by <strong>ROOMHY TECHNOLOGY</strong>. By accessing Roomhy, you agree to comply fully with these terms.
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

              {/* Corporate Contact Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-base font-extrabold text-slate-950">Registered Corporate Headquarters</h3>
                
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
