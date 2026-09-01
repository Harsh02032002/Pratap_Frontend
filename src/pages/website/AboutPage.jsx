import React, { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Link } from "react-router-dom";
import { 
  Building2, Globe, Shield, Users, Award, Sparkles, CheckCircle2,
  PhoneCall, ShieldCheck, Linkedin, Instagram, Mail, ArrowRight,
  Headphones, Check, Zap, MapPin, Heart, ChevronRight, Eye, Rocket, Star
} from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

export default function AboutPage() {
  useSEO({ 
    pageKey: 'about', 
    fallbackTitle: 'About Us | Smart Bidding Student Stays | Roomhy.com',
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
    <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] text-slate-900 selection:bg-teal-500 selection:text-white">
      <WebsiteNavbar />

      <main className="flex-grow">
        
        {/* ============================================================
         * 1. EDITORIAL HERO — BRAND STORY
         * ============================================================ */}
        <section className="relative bg-gradient-to-br from-slate-50 via-white to-teal-50/20 border-b border-slate-200/80 pt-8 pb-10 lg:pt-12 lg:pb-14 px-4 sm:px-6 lg:px-12 overflow-hidden">
          <div className="max-w-[1360px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column (~55%) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[#0FA596] text-[11px] font-extrabold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#0FA596]" />
                  <span className="uppercase tracking-widest">ABOUT ROOMHY TECHNOLOGY</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[3rem] font-black text-slate-950 tracking-tight leading-[1.3] sm:leading-[1.28]">
                  Making student housing <br className="hidden sm:inline" />
                  <span className="text-[#0FA596]">simpler, smarter</span> &amp; <span className="text-[#0FA596]">transparent.</span>
                </h1>

                <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed font-medium max-w-xl">
                  We created Roomhy to eliminate the stress of discovering and managing properties. Whether you are looking for a comfortable student stay or managing rentals as a host, Roomhy brings everything together on one direct, broker-free platform.
                </p>

                {/* Subtle Trust Indicators with Vertical Separators */}
                <div className="pt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-700 border-t border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-slate-900 pt-1">
                    <ShieldCheck className="w-4 h-4 text-[#0FA596]" />
                    <span>SMART BIDDING</span>
                  </div>
                  <span className="text-slate-300 hidden sm:inline pt-1">|</span>
                  <div className="flex items-center gap-1.5 text-slate-900 pt-1">
                    <CheckCircle2 className="w-4 h-4 text-[#0FA596]" />
                    <span>VERIFIED SPACES</span>
                  </div>
                  <span className="text-slate-300 hidden sm:inline pt-1">|</span>
                  <div className="flex items-center gap-1.5 text-slate-900 pt-1">
                    <PhoneCall className="w-4 h-4 text-[#0FA596]" />
                    <span>DIRECT OWNER CONNECT</span>
                  </div>
                </div>
              </div>

              {/* Right Column (~45%) — Editorial Image Framing */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.1)] border border-slate-200/90 aspect-4/3 lg:aspect-5/4 group">
                  <img 
                    src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1200" 
                    alt="Modern Roomhy Living Space" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent"></div>
                  
                  {/* Subtle Asymmetric Label */}
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/60 shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black tracking-wider uppercase text-slate-900">
                      BUILT FOR STUDENTS
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================
         * 2. BRAND EDITORIAL STATEMENT (COMPACT & BALANCED WHITESPACE)
         * ============================================================ */}
        <section className="bg-white py-7 lg:py-9 px-4 sm:px-6 lg:px-12 border-b border-slate-100">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-950 tracking-tight leading-snug">
              &ldquo;Finding a place to live should not begin with a broker.&rdquo;
            </h2>
            <div className="h-0.5 w-12 bg-[#0FA596] mx-auto rounded-full"></div>
            <p className="text-slate-600 text-xs sm:text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto">
              Roomhy is building a simpler way for students to discover verified stays, connect directly with property owners, and choose a place that fits their budget.
            </p>
          </div>
        </section>

        {/* ============================================================
         * 3. OUR PURPOSE — MISSION & VISION (EDITORIAL 2-COLUMN)
         * ============================================================ */}
        <section className="bg-[#F8FAFC] py-10 lg:py-14 px-4 sm:px-6 lg:px-12 border-b border-slate-200/80">
          <div className="max-w-[1360px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
              
              {/* Left Title Box (~35%) */}
              <div className="lg:col-span-4 space-y-2.5 sticky top-28">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0FA596]">
                  OUR PURPOSE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                  Our Mission &amp; Vision
                </h2>
                <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed pt-1">
                  We are building Roomhy with a clear focus — to make finding and living in student accommodation seamless, direct, and reliable.
                </p>
              </div>

              {/* Right Editorial Cards (~65%) */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* 01 OUR MISSION */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-widest text-[#0FA596]">01 / OUR MISSION</span>
                    <ShieldCheck className="w-4.5 h-4.5 text-[#0FA596] group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">Direct, Broker-Free Living</h3>
                  <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed">
                    We're on a mission to dismantle the friction of middleman brokerages and hidden fees. By providing a transparent bidding and booking platform, we ensure every student finds a place that fits their budget directly.
                  </p>
                </div>

                {/* 02 OUR VISION */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-widest text-purple-600">02 / OUR VISION</span>
                    <Eye className="w-4.5 h-4.5 text-purple-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">Empowerment Through Technology</h3>
                  <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed">
                    Giving students the power to bid, book, and live without brokers or hidden charges. Pioneering a new transparent standard for India's youth to find student accommodation online.
                  </p>
                </div>

                {/* 03 WHAT DRIVES US */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-widest text-amber-600">03 / WHAT DRIVES US</span>
                    <Users className="w-4.5 h-4.5 text-amber-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">Student-Centric Innovation</h3>
                  <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed">
                    As we expand, we continue to improve the platform based on what property owners and student tenants actually need — keeping the experience 100% focused on trust, speed, and affordability.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ============================================================
         * 4. OUR VALUES — ELEGANT CARDS WITH HOVER EFFECTS
         * ============================================================ */}
        <section className="bg-white py-10 lg:py-14 px-4 sm:px-6 lg:px-12 border-b border-slate-200/80">
          <div className="max-w-[1360px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  GUIDING PRINCIPLES
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-0.5">
                  Our Values
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/80 hover:border-[#0FA596]/50 hover:bg-white transition-all space-y-2 shadow-2xs group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#0FA596]">01</span>
                  <Check className="w-4 h-4 text-[#0FA596] group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Transparency</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Direct owner contact, clear pricing, and no hidden fees.</p>
              </div>

              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/80 hover:border-purple-400/50 hover:bg-white transition-all space-y-2 shadow-2xs group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-600">02</span>
                  <Zap className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Empowerment</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Direct bidding tools giving students control over their budget.</p>
              </div>

              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/80 hover:border-amber-400/50 hover:bg-white transition-all space-y-2 shadow-2xs group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-600">03</span>
                  <ShieldCheck className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Trust</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">100% physically verified stays, real photos, and safe environments.</p>
              </div>

              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-400/50 hover:bg-white transition-all space-y-2 shadow-2xs group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-600">04</span>
                  <Rocket className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Speed &amp; Simplicity</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Fast 1-click booking requests and instant owner communication.</p>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================
         * 5. WHY CHOOSE ROOMHY? (FULL-WIDTH DARK NAVY BRAND SECTION)
         * ============================================================ */}
        <section className="bg-[#0B192C] text-white py-12 lg:py-16 px-4 sm:px-6 lg:px-12 border-b border-slate-800">
          <div className="max-w-[1360px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              
              {/* Left Column (~45%) */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
                  WHY CHOOSE ROOMHY?
                </span>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  Built around what students actually need.
                </h2>

                <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  Roomhy makes it simpler to explore verified accommodation options, compare pricing, and secure a place that fits your lifestyle.
                </p>

                <div className="pt-2">
                  <Link 
                    to="/properties" 
                    className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#0FA596] hover:bg-teal-400 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer hover:translate-x-1"
                  >
                    <span>Explore Properties</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column (~55%) — Clean 2x2 Grid with Thin Dividers */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-10">
                
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1.5 hover:border-teal-400/40 transition-all">
                  <div className="text-xs font-black text-teal-400">01 / BIDDING</div>
                  <h4 className="text-base font-extrabold text-white">Smart Bidding</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">Innovative budget bidding feature letting students request custom prices directly from owners.</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1.5 hover:border-teal-400/40 transition-all">
                  <div className="text-xs font-black text-teal-400">02 / VERIFICATION</div>
                  <h4 className="text-base font-extrabold text-white">Verified Listings</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">All PGs, Hostels, and Apartments are physically verified for safety and quality amenities.</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1.5 hover:border-teal-400/40 transition-all">
                  <div className="text-xs font-black text-teal-400">03 / CONTACT</div>
                  <h4 className="text-base font-extrabold text-white">Direct Owner Contact</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">Connect and finalize move-in details directly with hosts without broker intervention.</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1.5 hover:border-teal-400/40 transition-all">
                  <div className="text-xs font-black text-teal-400">04 / SUPPORT</div>
                  <h4 className="text-base font-extrabold text-white">24/7 Assistance</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">Dedicated support desk ready to help students with booking, relocation, and queries anytime.</p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ============================================================
         * 6. FOUNDER STORY — SOPHISTICATED EDITORIAL LAYOUT
         * ============================================================ */}
        <section className="bg-[#F8FAFC] py-12 lg:py-16 px-4 sm:px-6 lg:px-12 border-b border-slate-200/80">
          <div className="max-w-[1360px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              
              {/* Left Column: Founder Portrait (~42%) */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative w-full max-w-sm aspect-4/5 rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(15,23,42,0.12)] border border-slate-200 group">
                  <img 
                    src="/website/images/ceo1.png" 
                    alt="Resham Singh - Founder Roomhy" 
                    className="w-full h-full object-cover object-[center_top] scale-105 group-hover:scale-110 transition-transform duration-700 origin-top"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/website/images/ceo1.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
                  
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-lg font-black">Resham Singh</div>
                    <div className="text-xs font-extrabold text-teal-300">Founder &amp; Director, Roomhy</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Founder Story & Numbered Points (~58%) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0FA596]">
                    THE MINDS BEHIND ROOMHY
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    Meet Our Founder
                  </h2>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                  With a vision to transform India's student housing sector into a transparent, tech-driven ecosystem, Resham Singh founded Roomhy to ensure broker-free, affordable, and safe accommodation for India's youth.
                </p>

                {/* Editorial Quote Statement */}
                <blockquote className="p-3.5 rounded-xl bg-white border-l-4 border-[#0FA596] shadow-2xs text-slate-800 text-xs md:text-sm font-semibold italic leading-relaxed">
                  &ldquo;Building Roomhy is about making student housing more transparent, accessible, and human.&rdquo;
                </blockquote>

                {/* Simple Numbered List with Thin Separators */}
                <div className="divide-y divide-slate-200 pt-1 text-xs md:text-sm font-semibold text-slate-800">
                  <div className="py-2.5 flex items-start gap-3">
                    <span className="font-black text-[#0FA596]">01</span>
                    <span>Pioneering India's premier smart bidding student housing platform.</span>
                  </div>
                  <div className="py-2.5 flex items-start gap-3">
                    <span className="font-black text-[#0FA596]">02</span>
                    <span>Strong believer in transparency, trust, and student empowerment.</span>
                  </div>
                  <div className="py-2.5 flex items-start gap-3">
                    <span className="font-black text-[#0FA596]">03</span>
                    <span>Building Roomhy to simplify room rentals for students nationwide.</span>
                  </div>
                </div>

                {/* Social Connect Links */}
                <div className="flex items-center gap-3 pt-1">
                  <a href="https://www.linkedin.com/company/roomhy-com/" target="_blank" rel="noreferrer" className="h-8 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-[#0FA596] hover:text-white hover:border-[#0FA596] flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs">
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                  <a href="https://www.instagram.com/roomhy.com_/" target="_blank" rel="noreferrer" className="h-8 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-[#0FA596] hover:text-white hover:border-[#0FA596] flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs">
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Instagram</span>
                  </a>
                  <a href="mailto:team@roomhy.com" className="h-8 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-[#0FA596] hover:text-white hover:border-[#0FA596] flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================
         * 7. STATISTICS BAR (SOPHISTICATED DARK NAVY COMPACT STRIP)
         * ============================================================ */}
        <section className="bg-[#0D182E] text-white py-8 lg:py-10 px-4 sm:px-6 lg:px-12 border-b border-slate-800">
          <div className="max-w-[1360px] mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 text-center">
              
              <div className="pt-2 lg:pt-0">
                <div className="text-2xl lg:text-3xl font-black text-white tracking-tight">5+</div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Active Cities</div>
              </div>

              <div className="pt-2 lg:pt-0">
                <div className="text-2xl lg:text-3xl font-black text-white tracking-tight">5,000+</div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Operational Beds</div>
              </div>

              <div className="pt-2 lg:pt-0">
                <div className="text-2xl lg:text-3xl font-black text-white tracking-tight">75+</div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Verified Properties</div>
              </div>

              <div className="pt-2 lg:pt-0">
                <div className="text-2xl lg:text-3xl font-black text-white tracking-tight">25K+</div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Happy Students</div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================
         * 8. STUDENT JOURNEY — "FROM SEARCHING TO SETTLING IN"
         * ============================================================ */}
        <section className="bg-white py-12 lg:py-16 px-4 sm:px-6 lg:px-12 border-b border-slate-200/80">
          <div className="max-w-[1360px] mx-auto space-y-8">
            
            <div className="text-center max-w-xl mx-auto space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0FA596]">
                THE ROOMHY EXPERIENCE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                From searching to settling in.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Step 01 */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2 hover:border-teal-300 transition-all shadow-2xs">
                <div className="text-xs font-black tracking-widest text-[#0FA596]">STEP 01</div>
                <h3 className="text-base font-extrabold text-slate-900">Discover</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Browse 100% physically verified PGs, hostels, co-living spaces and student apartments in top educational hubs.
                </p>
              </div>

              {/* Step 02 */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2 hover:border-purple-300 transition-all shadow-2xs">
                <div className="text-xs font-black tracking-widest text-purple-600">STEP 02</div>
                <h3 className="text-base font-extrabold text-slate-900">Choose</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Compare stays, view verified room photos, check amenities, and place custom budget bids directly with hosts.
                </p>
              </div>

              {/* Step 03 */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2 hover:border-emerald-300 transition-all shadow-2xs">
                <div className="text-xs font-black tracking-widest text-emerald-600">STEP 03</div>
                <h3 className="text-base font-extrabold text-slate-900">Connect</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Talk directly with verified property owners, finalize move-in details without brokers, and settle into your new home.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================
         * 9. FINAL BRAND CTA SECTION
         * ============================================================ */}
        <section className="bg-gradient-to-br from-[#063836] via-[#0A4D4A] to-[#042C2A] text-white py-12 lg:py-16 px-4 sm:px-6 lg:px-12 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
              Find a place that feels like home.
            </h2>
            <p className="text-teal-100/80 text-xs sm:text-sm font-medium leading-relaxed max-w-xl mx-auto">
              Join thousands of students finding broker-free, verified PGs, Hostels, and Apartments across India today.
            </p>

            <div className="pt-2">
              <Link 
                to="/properties" 
                className="inline-flex items-center gap-2.5 px-7 py-3 bg-[#0FA596] hover:bg-teal-400 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105"
              >
                <span>Explore Properties</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}
