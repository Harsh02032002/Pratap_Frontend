import React, { useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Link } from "react-router-dom";
import {
  ShieldCheck, CheckCircle2, PhoneCall, Linkedin, Instagram, Mail, ArrowRight,
  Check, Zap, Rocket, Eye, Users, Sparkles, Building2, Shield, Heart, Globe, Award
} from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

export default function AboutPage() {
  useSEO({
    pageKey: 'about',
    fallbackTitle: 'About Us | Smart Bidding Student Stays | Roomhy.com',
    fallbackDescription: "Learn about Roomhy.com's mission to provide 100% verified, broker-free student and professional living across India with transparent budget bidding."
  });

  useEffect(() => {
    if (window.location.pathname !== '/about-us') {
      window.history.replaceState(null, '', '/about-us');
    }
  }, []);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        await fetchJson('/api/page-layouts/about');
      } catch (err) {
        // silent fallback
      }
    };
    fetchLayout();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-slate-900 selection:bg-teal-500 selection:text-white">
      <WebsiteNavbar />

      <main className="flex-grow">

        {/* ================================================================
         * 1. HERO — ULTRA PREMIUM MODERN PROPTECH HERO
         * ================================================================ */}
        <section className="relative border-b border-slate-200/70 text-slate-900 py-10 md:py-14 px-4 md:px-8 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/50">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 relative z-10">
            
            {/* Left Column: Headline & Value Props */}
            <div className="flex-1 text-left max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 text-[#0FA596] text-xs font-black tracking-wide shadow-2xs">
                <Sparkles className="w-4 h-4 text-[#0FA596] animate-pulse" />
                <span className="uppercase tracking-wider text-[11px]">About Roomhy Technology</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-black tracking-tight text-slate-950 leading-[1.15]">
                Making student housing <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  simpler, smarter &amp; transparent.
                </span>
              </h1>

              <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-xl">
                We created Roomhy to eliminate the stress of discovering and managing properties. Whether you are looking for a comfortable student stay or managing rentals as a host, Roomhy brings everything together on one direct, broker-free platform.
              </p>

              {/* Trust Indicators Bar */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-3 border-t border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 tracking-wide uppercase">
                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0FA596]" />
                  </div>
                  <span>Smart Bidding</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 tracking-wide uppercase">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span>Verified Spaces</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 tracking-wide uppercase">
                  <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <span>Direct Owner Connect</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-End Photo Card & Live Stats Bar */}
            <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 space-y-4">
              <div className="relative rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(15,165,150,0.12)] border border-slate-200/90 aspect-[4/3] group">
                <img
                  src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1200"
                  alt="Modern Roomhy Living Space"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                
                {/* Floating Glassmorphic Pill Badge */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/60 shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <div>
                      <div className="text-xs font-black text-slate-900">Built for Students</div>
                      <div className="text-[10px] font-bold text-slate-500">Broker-Free Living</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200/80 shadow-2xs">
                    100% Verified
                  </span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ================================================================
         * 2. BRAND MANIFESTO — ULTRA MODERN CENTERPIECE CARD
         * ================================================================ */}
        <section className="bg-white py-12 lg:py-16 px-4 sm:px-8 lg:px-14 border-b border-slate-100 relative overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-3xl p-8 sm:p-12 md:p-14 bg-gradient-to-br from-[#F2FAF8] via-white to-emerald-50/70 border border-teal-200/80 shadow-[0_12px_36px_rgba(15,165,150,0.08)] overflow-hidden text-center">
              {/* Translucent background glow spheres */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 max-w-3xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-teal-200 text-[#0FA596] text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#0FA596]" />
                  <span>OUR CORE MANIFESTO</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                  &ldquo;Finding a place to live should not begin with a{" "}
                  <span className="bg-gradient-to-r from-[#0FA596] to-emerald-500 bg-clip-text text-transparent underline decoration-teal-300 decoration-wavy decoration-2">
                    broker.
                  </span>&rdquo;
                </h2>

                <div className="h-1 w-20 bg-gradient-to-r from-[#0FA596] via-teal-400 to-emerald-400 rounded-full mx-auto shadow-2xs my-3"></div>

                <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed max-w-xl mx-auto">
                  Roomhy is building a simpler way for students to discover verified stays, connect directly with property owners, and choose a place that fits their budget.
                </p>

                {/* 3 Pill Highlights at bottom */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-teal-100/80 mt-6">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-teal-200/60 text-slate-800 text-xs font-extrabold shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0FA596]" />
                    <span>Zero Brokerage Fees</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-teal-200/60 text-slate-800 text-xs font-extrabold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Verified Listings</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-teal-200/60 text-slate-800 text-xs font-extrabold shadow-2xs">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                    <span>Direct Owner Connect</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
         * 3. OUR PURPOSE — 3 MODERN CARDS GRID
         * ================================================================ */}
        <section className="bg-[#F8FBFA] py-14 lg:py-18 px-5 sm:px-8 lg:px-14 border-b border-slate-100">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div className="max-w-2xl space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0FA596]">
                OUR PURPOSE
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
                Our Mission &amp; Vision
              </h2>
              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
                We are building Roomhy with a clear focus — to make finding and living in student accommodation seamless, direct, and reliable.
              </p>
            </div>

            {/* 3 Modern Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Card 01 / OUR MISSION */}
              <div className="group bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-[#0FA596] to-emerald-400 absolute top-0 left-0"></div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-[0.2em] text-[#0FA596] uppercase">
                      01 / OUR MISSION
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-teal-50 text-[#0FA596] flex items-center justify-center group-hover:bg-[#0FA596] group-hover:text-white transition-colors">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-950 tracking-tight">
                    Direct, Broker-Free Living
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    We're on a mission to dismantle the friction of middleman brokerages and hidden fees. By providing a transparent bidding and booking platform, we ensure every student finds a place that fits their budget directly.
                  </p>
                </div>
              </div>

              {/* Card 02 / OUR VISION */}
              <div className="group bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-500 absolute top-0 left-0"></div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-[0.2em] text-purple-600 uppercase">
                      02 / OUR VISION
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-950 tracking-tight">
                    Empowerment Through Technology
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    Giving students the power to bid, book, and live without brokers or hidden charges. Pioneering a new transparent standard for India's youth to find student accommodation online.
                  </p>
                </div>
              </div>

              {/* Card 03 / WHAT DRIVES US */}
              <div className="group bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500 absolute top-0 left-0"></div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-[0.2em] text-amber-600 uppercase">
                      03 / WHAT DRIVES US
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-950 tracking-tight">
                    Student-Centric Innovation
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    As we expand, we continue to improve the platform based on what property owners and student tenants actually need — keeping the experience 100% focused on trust, speed, and affordability.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ================================================================
         * 4. OUR VALUES — 4-COLUMN INTERACTIVE PANEL
         * ================================================================ */}
        <section className="bg-white py-14 lg:py-18 px-5 sm:px-8 lg:px-14 border-b border-slate-100">
          <div className="max-w-7xl mx-auto space-y-8">

            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                GUIDING PRINCIPLES
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Our Values
              </h2>
            </div>

            {/* 4 Equal Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { num: "01", title: "Transparency", desc: "Direct owner contact, clear pricing, and no hidden fees.", icon: Check, color: "teal" },
                { num: "02", title: "Empowerment", desc: "Direct bidding tools giving students control over their budget.", icon: Zap, color: "purple" },
                { num: "03", title: "Trust", desc: "100% physically verified stays, real photos, and safe environments.", icon: ShieldCheck, color: "amber" },
                { num: "04", title: "Speed & Simplicity", desc: "Fast 1-click booking requests and instant owner communication.", icon: Rocket, color: "emerald" },
              ].map((v) => {
                const IconComponent = v.icon;
                return (
                  <div
                    key={v.num}
                    className="bg-[#F8FBFA] p-6 rounded-3xl border border-slate-200/80 hover:border-[#0FA596]/50 hover:bg-white transition-all duration-300 space-y-3 shadow-2xs hover:shadow-md group cursor-default"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#0FA596]">{v.num}</span>
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0FA596] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconComponent className="w-4 h-4" />
                      </div>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-950">{v.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ================================================================
         * 5. WHY CHOOSE ROOMHY — DARK NAVY CONTRAST SECTION
         * ================================================================ */}
        <section className="bg-[#0B1730] text-white py-16 lg:py-20 px-5 sm:px-8 lg:px-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

              {/* Left Column */}
              <div className="lg:col-span-5 space-y-5">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
                  WHY CHOOSE ROOMHY?
                </span>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  Built around what <br className="hidden sm:inline" />
                  students actually need.
                </h2>

                <p className="text-slate-300 text-sm font-medium leading-relaxed">
                  Roomhy makes it simpler to explore verified accommodation options, compare pricing, and secure a place that fits your lifestyle.
                </p>

                <div className="pt-2">
                  <Link
                    to="/properties"
                    className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-[#0FA596] to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
                  >
                    <span>Explore Properties</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: 2x2 Glassmorphic Cards Grid */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:border-l border-slate-800 lg:pl-10">
                {[
                  { num: "01 / BIDDING", title: "Smart Bidding", desc: "Innovative budget bidding feature letting students request custom prices directly from owners." },
                  { num: "02 / VERIFICATION", title: "Verified Listings", desc: "All PGs, Hostels, and Apartments are physically verified for safety and quality amenities." },
                  { num: "03 / CONTACT", title: "Direct Owner Contact", desc: "Connect and finalize move-in details directly with hosts without broker intervention." },
                  { num: "04 / SUPPORT", title: "24/7 Assistance", desc: "Dedicated support desk ready to help students with booking, relocation, and queries anytime." },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 space-y-2 hover:border-teal-400/50 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="text-[10px] font-black text-teal-400 tracking-wider uppercase">{f.num}</div>
                    <h4 className="text-base font-extrabold text-white">{f.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{f.desc}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ================================================================
         * 6. FOUNDER SECTION — RESHAM SINGH (FOUNDER & DIRECTOR)
         * ================================================================ */}
        <section className="bg-[#F8FBFA] py-16 lg:py-20 px-5 sm:px-8 lg:px-14 border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Left Column: Founder Portrait */}
              <div className="lg:col-span-5 flex justify-center relative">
                <div className="relative w-full max-w-sm aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.12)] border border-slate-200 group">
                  <img
                    src="/website/images/ceo1.png"
                    alt="Resham Singh — Founder Roomhy"
                    className="w-full h-full object-cover object-[center_top] scale-105 group-hover:scale-110 transition-transform duration-700 origin-top"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/website/images/ceo1.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                  
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <div className="text-xl font-black">Resham Singh</div>
                    <div className="text-xs font-black text-teal-300 uppercase tracking-wider mt-0.5">Founder &amp; Director, Roomhy</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Founder Story & Key Pillars */}
              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-1">
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
                <blockquote className="p-4 rounded-2xl bg-gradient-to-r from-teal-50/80 to-emerald-50/80 border-l-4 border-[#0FA596] shadow-2xs text-slate-800 text-xs md:text-sm font-semibold italic leading-relaxed">
                  &ldquo;Building Roomhy is about making student housing more transparent, accessible, and human.&rdquo;
                </blockquote>

                {/* Numbered Highlights */}
                <div className="divide-y divide-slate-200/80 pt-1 text-xs md:text-sm font-semibold text-slate-800">
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
                  <a href="https://www.linkedin.com/company/roomhy-com/" target="_blank" rel="noreferrer" className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-[#0FA596] hover:text-white hover:border-[#0FA596] flex items-center gap-2 text-xs font-extrabold transition-all shadow-2xs">
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                  <a href="https://www.instagram.com/roomhy.com_/" target="_blank" rel="noreferrer" className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-[#0FA596] hover:text-white hover:border-[#0FA596] flex items-center gap-2 text-xs font-extrabold transition-all shadow-2xs">
                    <Instagram className="w-4 h-4" />
                    <span>Instagram</span>
                  </a>
                  <a href="mailto:team@roomhy.com" className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-[#0FA596] hover:text-white hover:border-[#0FA596] flex items-center gap-2 text-xs font-extrabold transition-all shadow-2xs">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================================================================
         * 7. STATISTICS BAR (DARK COMPACT METRICS STRIP)
         * ================================================================ */}
        <section className="bg-[#0D1A2E] text-white py-10 px-5 sm:px-8 lg:px-14 border-t border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 text-center">
              <div className="pt-2 lg:pt-0">
                <div className="text-3xl lg:text-4xl font-black text-white tracking-tight">5+</div>
                <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Active Cities</div>
              </div>

              <div className="pt-2 lg:pt-0">
                <div className="text-3xl lg:text-4xl font-black text-white tracking-tight">5,000+</div>
                <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Operational Beds</div>
              </div>

              <div className="pt-2 lg:pt-0">
                <div className="text-3xl lg:text-4xl font-black text-white tracking-tight">75+</div>
                <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Verified Properties</div>
              </div>

              <div className="pt-2 lg:pt-0">
                <div className="text-3xl lg:text-4xl font-black text-white tracking-tight">25K+</div>
                <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Happy Students</div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
         * 8. THE ROOMHY EXPERIENCE — HORIZONTAL STEPPER JOURNEY
         * ================================================================ */}
        <section className="bg-white py-14 lg:py-18 px-5 sm:px-8 lg:px-14 border-b border-slate-100">
          <div className="max-w-7xl mx-auto space-y-10">

            <div className="text-center max-w-xl mx-auto space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0FA596]">
                THE ROOMHY EXPERIENCE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                From searching to settling in.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Horizontal Line Connector for Desktop */}
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-slate-200 z-0"></div>

              {/* Step 01 */}
              <div className="relative z-10 bg-[#F8FBFA] p-6 rounded-3xl border border-slate-200/80 space-y-3 hover:border-[#0FA596]/50 transition-all shadow-2xs hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-2xl bg-[#0FA596] text-white flex items-center justify-center font-black text-sm shadow-md shadow-teal-500/20 group-hover:scale-110 transition-transform">
                  01
                </div>
                <span className="text-[11px] font-black tracking-wider text-[#0FA596] uppercase block">DISCOVER</span>
                <h3 className="text-lg font-extrabold text-slate-950">Browse Verified Stays</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Browse 100% physically verified PGs, hostels, co-living spaces and student apartments in top educational hubs.
                </p>
              </div>

              {/* Step 02 */}
              <div className="relative z-10 bg-[#F8FBFA] p-6 rounded-3xl border border-slate-200/80 space-y-3 hover:border-purple-300 transition-all shadow-2xs hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
                  02
                </div>
                <span className="text-[11px] font-black tracking-wider text-purple-600 uppercase block">CHOOSE</span>
                <h3 className="text-lg font-extrabold text-slate-950">Fast Bidding &amp; Offers</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Compare stays, view verified room photos, check amenities, and place custom budget bids directly with hosts.
                </p>
              </div>

              {/* Step 03 */}
              <div className="relative z-10 bg-[#F8FBFA] p-6 rounded-3xl border border-slate-200/80 space-y-3 hover:border-emerald-300 transition-all shadow-2xs hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  03
                </div>
                <span className="text-[11px] font-black tracking-wider text-emerald-600 uppercase block">CONNECT</span>
                <h3 className="text-lg font-extrabold text-slate-950">Direct Owner Move-in</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Talk directly with verified property owners, finalize move-in details without brokers, and settle into your new home.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ================================================================
         * 9. FINAL BRAND CTA CONTAINER
         * ================================================================ */}
        <section className="py-12 lg:py-16 px-5 sm:px-8 lg:px-14 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 via-[#0B1730] to-teal-950 text-white rounded-3xl p-10 md:p-14 text-center shadow-2xl relative overflow-hidden border border-teal-500/20">
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="max-w-2xl mx-auto space-y-4 relative z-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                  Find a place that <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">
                    feels like home.
                  </span>
                </h2>
                
                <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  Join thousands of students finding broker-free, verified PGs, Hostels, and Apartments across India today.
                </p>

                <div className="pt-3">
                  <Link
                    to="/properties"
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-[#0FA596] to-teal-400 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-teal-500/30 transition-all hover:scale-105 group"
                  >
                    <span>Explore Properties</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
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
