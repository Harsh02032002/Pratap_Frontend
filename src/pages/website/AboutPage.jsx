import React, { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Link } from "react-router-dom";
import { 
  Building2, Search, Target, TrendingUp, Quote, 
  Globe, Zap, Heart, Shield, Eye, Users, Rocket,
  Sparkles, CheckCircle2, Award, PhoneCall, ShieldCheck,
  Linkedin, Instagram, Mail, ArrowRight, Headphones, Check, Layers
} from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

export default function AboutPage() {
  useSEO({ 
    pageKey: 'about', 
    fallbackTitle: 'About Us | Zero Brokerage Student Stays | Roomhy.com',
    fallbackDescription: "Learn about Roomhy.com's mission to provide 100% verified, broker-free student and professional living across India with transparent budget bidding."
  });

  const [layoutSections, setLayoutSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.location.pathname !== '/about-us') {
      window.history.replaceState(null, '', '/about-us');
    }
  }, []);

  // Fetch layout settings from API if configured
  useEffect(() => {
    const fetchLayout = async () => {
      let resolved = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          if (!resolved) {
            console.warn('About layout API call timed out, falling back to defaults');
            resolve({ success: false, timeout: true });
          }
        }, 3000);
      });

      try {
        const apiPromise = fetchJson('/api/page-layouts/about');
        const res = await Promise.race([apiPromise, timeoutPromise]);
        
        resolved = true;
        if (res && res.success && res.data && res.data.sections) {
          const sorted = res.data.sections.sort((a, b) => a.order - b.order);
          setLayoutSections(sorted);
        }
      } catch (err) {
        console.warn('Failed to load About page layout:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      <WebsiteNavbar />

      <main className="flex-grow space-y-6 md:space-y-10 py-4 md:py-6">
        
        {/* ============================================================
         * 1. HERO SECTION (COMPACT & SPACE EFFICIENT)
         * ============================================================ */}
        <section className="relative bg-gradient-to-b from-[#F4F7FA] via-[#F8FAFC] to-white py-6 md:py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-200/70">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Content */}
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-bold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>About Roomhy Technology</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  At Roomhy, we believe finding the right place to stay should be <span className="text-teal-600">simple & stress-free.</span>
                </h1>

                <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-medium">
                  We created Roomhy to make the process of discovering and managing properties easier for everyone. Whether you are looking for a comfortable place to stay or you are a property owner looking to manage your property, Roomhy brings everything together in one place.
                </p>

                {/* 3 Pill Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-800 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Zero Brokerage</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-800 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Verified Spaces</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-800 text-xs font-bold">
                    <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                    <span>Direct Owner Connect</span>
                  </div>
                </div>
              </div>

              {/* Right Visual Image + Integrated Stats Strip */}
              <div className="lg:col-span-6 space-y-3">
                <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 h-48 md:h-64">
                  <img 
                    src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1200" 
                    alt="Modern Roomhy Student Accommodation" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
                </div>

                {/* Integrated Metrics Grid */}
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs grid grid-cols-4 gap-2 text-center divide-x divide-slate-100">
                  <div>
                    <div className="text-base md:text-xl font-black text-slate-900">5+</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Active Cities</div>
                  </div>
                  <div>
                    <div className="text-base md:text-xl font-black text-slate-900">5,000+</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Beds</div>
                  </div>
                  <div>
                    <div className="text-base md:text-xl font-black text-slate-900">75+</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Properties</div>
                  </div>
                  <div>
                    <div className="text-base md:text-xl font-black text-slate-900">25K+</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Students</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================
         * 2. OUR MISSION & VISION (COMPACT 4-COLUMN CARDS - FITS ON SAME SCREEN)
         * ============================================================ */}
        <section className="py-6 md:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="text-teal-600 font-extrabold text-[11px] uppercase tracking-widest mb-0.5 block">
              OUR PURPOSE
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Our Mission & Vision
            </h2>
            <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
              We are building Roomhy with a simple goal — to make the property experience easier, more convenient, and more reliable for students across India.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Our Mission */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Our Mission</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-medium">
                  We're on a mission to dismantle the friction of brokerages and hidden fees. By providing a transparent bidding platform, we ensure that every student finds a place that fits their budget.
                </p>
              </div>
            </div>

            {/* Card 2: Our Vision */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mb-3">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Our Vision</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-medium">
                  Giving students the power to bid, book, and live without brokers or hidden charges. Pioneering a new way for India's youth to find accommodation online.
                </p>
              </div>
            </div>

            {/* Card 3: What Drives Us */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-3">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">What Drives Us</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-medium">
                  As we grow, we continue to improve the platform based on what property owners and customers actually need — keeping the experience 100% student-centric.
                </p>
              </div>
            </div>

            {/* Card 4: Our Values */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mb-3">
                  <Heart className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Our Values</h3>
                <ul className="space-y-1.5 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Transparency (Zero Brokerage)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Empowerment (Direct Bidding)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Trust (100% Verified Stays)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Speed & Booking Simplicity</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================
         * 3. WHY CHOOSE ROOMHY? (COMPACT DEEP TEAL FEATURE SECTION)
         * ============================================================ */}
        <section className="py-4 md:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#063836] via-[#0A4D4A] to-[#042C2A] text-white rounded-2xl p-6 md:p-8 shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Column */}
              <div className="lg:col-span-5 space-y-3">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[11px] font-bold inline-block">
                  WHY CHOOSE ROOMHY?
                </span>
                
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Why Roomhy is Better?
                </h2>

                <p className="text-teal-100/80 text-xs font-medium leading-relaxed max-w-sm">
                  Roomhy makes it easier to explore available options, check the details, and find a place that suits your needs.
                </p>

                <div className="pt-1">
                  <Link 
                    to="/properties" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all"
                  >
                    <span>Explore Properties</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Column Grid */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex gap-2.5 bg-white/5 p-3 rounded-xl border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Zero Brokerage Guarantee</h4>
                    <p className="text-[10px] text-teal-100/70 font-medium mt-0.5">Zero hidden fees, transparent pricing, and direct owner contact.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 bg-white/5 p-3 rounded-xl border border-white/10">
                  <Zap className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Dynamic Price Bidding</h4>
                    <p className="text-[10px] text-teal-100/70 font-medium">Revolutionary feature letting students bid their budget directly.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 bg-white/5 p-3 rounded-xl border border-white/10">
                  <PhoneCall className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Direct Owner Contact</h4>
                    <p className="text-[10px] text-teal-100/70 font-medium">Chat and finalize move-in details directly with verified hosts.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 bg-white/5 p-3 rounded-xl border border-white/10">
                  <Headphones className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">24/7 Support</h4>
                    <p className="text-[10px] text-teal-100/70 font-medium">Our support team is always here to assist students & hosts.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================
         * 4. MEET OUR FOUNDER / LEADERSHIP SECTION (COMPACT 3-COLUMN)
         * ============================================================ */}
        <section className="py-6 md:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Founder Details */}
            <div className="lg:col-span-4 space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[11px] font-bold inline-block">
                THE MINDS BEHIND ROOMHY
              </span>

              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Meet Our Founder
              </h2>

              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                With a vision to transform India's student housing sector into a transparent, tech-driven ecosystem, ensuring broker-free, affordable accommodation for India's youth.
              </p>

              <div className="pt-1">
                <div className="text-base font-bold text-slate-900">Resham Singh</div>
                <div className="text-xs font-bold text-teal-600">Founder & Director, Roomhy</div>
                
                <div className="flex items-center gap-2 mt-2">
                  <a href="https://www.linkedin.com/company/roomhy-com/" target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-teal-600 hover:text-white flex items-center justify-center transition-colors">
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                  <a href="https://www.instagram.com/roomhy.com_/" target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-teal-600 hover:text-white flex items-center justify-center transition-colors">
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                  <a href="mailto:team@roomhy.com" className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-teal-600 hover:text-white flex items-center justify-center transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Center Founder Image Frame */}
            <div className="lg:col-span-4 flex justify-center group">
              <div className="relative w-full max-w-xs aspect-3/4">
                <div className="absolute inset-0 bg-amber-500 rounded-2xl rotate-3 group-hover:-rotate-3 group-hover:scale-105 transition-all duration-500 ease-out shadow-xs"></div>
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 shadow-md border-2 border-white transition-all duration-500">
                  <img 
                    src="/website/images/ceo1.png" 
                    alt="Resham Singh - Founder Roomhy" 
                    className="w-full h-full object-cover object-[center_top] scale-110 group-hover:scale-115 transition-transform duration-700 origin-top"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/website/images/ceo1.png';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right 3 Feature Points */}
            <div className="lg:col-span-4 space-y-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Rocket className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                  Pioneering India's first zero-brokerage student housing platform.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                  Strong believer in transparency, trust, and student empowerment.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                  Building Roomhy to simplify room rentals for students nationwide.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================
         * 5. BOTTOM STATS STRIP (COMPACT DARK NAVY BAR)
         * ============================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-[#0D182E] text-white rounded-xl p-4 md:p-6 shadow-md grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 text-center">
            
            <div className="flex flex-col items-center justify-center pt-1 lg:pt-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Globe className="w-4 h-4 text-teal-400" />
                <span className="text-xl md:text-2xl font-black text-white">5+</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400">Active Cities</div>
            </div>

            <div className="flex flex-col items-center justify-center pt-1 lg:pt-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span className="text-xl md:text-2xl font-black text-white">5000+</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400">Operational Beds</div>
            </div>

            <div className="flex flex-col items-center justify-center pt-1 lg:pt-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Award className="w-4 h-4 text-teal-400" />
                <span className="text-xl md:text-2xl font-black text-white">75+</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400">Verified Properties</div>
            </div>

            <div className="flex flex-col items-center justify-center pt-1 lg:pt-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users className="w-4 h-4 text-teal-400" />
                <span className="text-xl md:text-2xl font-black text-white">25K+</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400">Happy Students</div>
            </div>

          </div>
        </section>

      </main>

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}
