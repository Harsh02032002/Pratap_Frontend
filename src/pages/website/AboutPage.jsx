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
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop')` }}
          />

          {/* Rich White Opacity Overlay for 100% text readability & background visibility */}
          <div 
            className="absolute inset-0 z-0"
            style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.90) 50%, rgba(255,255,255,0.35) 100%)' }}
          ></div>

          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            
            {/* Left Column: Direct Dark Typography */}
            <div className="w-full md:max-w-[500px] lg:max-w-[540px] text-left space-y-3.5 text-slate-900">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-teal-200 text-[#0FA596] text-[10px] sm:text-xs font-black tracking-wide shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#0FA596] animate-pulse" />
                <span className="uppercase tracking-wider">About Roomhy Technology</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Making student housing <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  simpler, smarter &amp; transparent.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                We created Roomhy to eliminate the stress of discovering and managing properties. Whether you are looking for a comfortable student stay or managing rentals as a host, Roomhy brings everything together on one direct, broker-free platform.
              </p>

              {/* Trust Indicators Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-300/80 text-[11px] font-black text-slate-800 tracking-wide uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-[#0FA596]" />
                  </div>
                  <span>Smart Bidding</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span>Verified Spaces</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <span>Direct Owner Connect</span>
                </div>
              </div>
            </div>

            {/* Right Column: Open space */}
            <div className="hidden md:block w-full md:w-1/2"></div>

          </div>
        </section>

        {/* ================================================================
         * 2. BRAND MANIFESTO — BRIGHT SUNLIT VILLA CARD
         * ================================================================ */}
        <section className="py-6 lg:py-8 px-4 sm:px-8 lg:px-14 border-b border-slate-200/80 bg-[#F4F7F6] relative overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <div 
              className="relative rounded-2xl p-6 sm:p-8 md:p-10 bg-cover bg-center border border-teal-200/80 shadow-lg overflow-hidden text-center"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200')` }}
            >
              {/* Soft Light Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/75 to-emerald-50/70 backdrop-blur-[0.5px]"></div>

              <div className="relative z-10 max-w-3xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-teal-200 text-[#0FA596] text-[10px] font-black tracking-widest uppercase shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#0FA596]" />
                  <span>OUR CORE MANIFESTO</span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-950 leading-tight">
                  &ldquo;Finding a place to live should not begin with a{" "}
                  <span className="bg-gradient-to-r from-[#0FA596] to-emerald-500 bg-clip-text text-transparent underline decoration-teal-300 decoration-wavy decoration-2">
                    broker.
                  </span>&rdquo;
                </h2>

                <div className="h-1 w-16 bg-gradient-to-r from-[#0FA596] via-teal-400 to-emerald-400 rounded-full mx-auto shadow-2xs my-2"></div>

                <p className="text-slate-800 text-xs sm:text-sm font-bold leading-relaxed max-w-xl mx-auto">
                  Roomhy is building a simpler way for students to discover verified stays, connect directly with property owners, and choose a place that fits their budget.
                </p>

                {/* 3 Pill Highlights */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3 border-t border-teal-200/80 mt-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-teal-200 text-slate-800 text-xs font-extrabold shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0FA596]" />
                    <span>Zero Brokerage Fees</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-teal-200 text-slate-800 text-xs font-extrabold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Verified Listings</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-teal-200 text-slate-800 text-xs font-extrabold shadow-2xs">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                    <span>Direct Owner Connect</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
         * 3. OUR PURPOSE — 3 CRISP PROPERTY CARDS (EXACT MATCHING TRENDING STAYS)
         * ================================================================ */}
        <section className="bg-white py-12 lg:py-16 px-5 sm:px-8 lg:px-14 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Header */}
            <div className="max-w-2xl space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0FA596]">
                OUR PURPOSE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Our Mission &amp; Vision
              </h2>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                We are building Roomhy with a clear focus — to make finding and living in student accommodation seamless, direct, and reliable.
              </p>
            </div>

            {/* 3 Compact Property Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Card 01 / OUR MISSION */}
              <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="h-44 relative overflow-hidden bg-slate-100">
                  <img 
                    src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80" 
                    alt="Our Mission" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-wider text-teal-300 uppercase">01 / OUR MISSION</span>
                    <div className="w-7 h-7 rounded-lg bg-white/95 backdrop-blur-md text-[#0FA596] flex items-center justify-center shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-2 flex-1 flex flex-col justify-start">
                  <h3 className="text-base font-extrabold text-slate-950 tracking-tight">
                    Direct, Broker-Free Living
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    We're on a mission to dismantle middleman brokerages and hidden fees so every student finds a stay that fits their budget.
                  </p>
                </div>
              </div>

              {/* Card 02 / OUR VISION */}
              <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="h-44 relative overflow-hidden bg-slate-100">
                  <img 
                    src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80" 
                    alt="Our Vision" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-wider text-purple-300 uppercase">02 / OUR VISION</span>
                    <div className="w-7 h-7 rounded-lg bg-white/95 backdrop-blur-md text-purple-600 flex items-center justify-center shadow-xs">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-2 flex-1 flex flex-col justify-start">
                  <h3 className="text-base font-extrabold text-slate-950 tracking-tight">
                    Empowerment Through Tech
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Giving students the power to bid, book, and live without brokers, pioneering a new transparent standard online.
                  </p>
                </div>
              </div>

              {/* Card 03 / WHAT DRIVES US */}
              <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="h-44 relative overflow-hidden bg-slate-100">
                  <img 
                    src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80" 
                    alt="What Drives Us" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-wider text-amber-300 uppercase">03 / WHAT DRIVES US</span>
                    <div className="w-7 h-7 rounded-lg bg-white/95 backdrop-blur-md text-amber-600 flex items-center justify-center shadow-xs">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-2 flex-1 flex flex-col justify-start">
                  <h3 className="text-base font-extrabold text-slate-950 tracking-tight">
                    Student-Centric Innovation
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Improving the platform based on what property owners and student tenants actually need — focused 100% on trust.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ================================================================
         * 4. OUR VALUES — 4 CARDS WITH CRISP PHOTO HEADERS
         * ================================================================ */}
        <section className="bg-[#F4F7F6] py-12 lg:py-16 px-5 sm:px-8 lg:px-14 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto space-y-8">

            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0FA596]">
                GUIDING PRINCIPLES
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Our Values
              </h2>
            </div>

            {/* 4 Equal Cards Grid with Photo Headers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { num: "01", title: "Transparency", desc: "Direct owner contact, clear pricing, and no hidden fees.", icon: Check, img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80" },
                { num: "02", title: "Empowerment", desc: "Direct bidding tools giving students control over their budget.", icon: Zap, img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80" },
                { num: "03", title: "Trust", desc: "100% physically verified stays, real photos, and safe environments.", icon: ShieldCheck, img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80" },
                { num: "04", title: "Speed & Simplicity", desc: "Fast 1-click booking requests and instant owner communication.", icon: Rocket, img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80" },
              ].map((v) => {
                const IconComponent = v.icon;
                return (
                  <div
                    key={v.num}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 space-y-0 group cursor-default flex flex-col"
                  >
                    <div className="h-32 relative overflow-hidden bg-slate-100">
                      <img src={v.img} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between">
                        <span className="text-xs font-black text-teal-300">{v.num}</span>
                        <div className="w-7 h-7 rounded-lg bg-white/95 text-[#0FA596] flex items-center justify-center shadow-xs">
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-start">
                      <h4 className="text-sm font-extrabold text-slate-950">{v.title}</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ================================================================
         * 5. WHY CHOOSE ROOMHY — BRIGHT SUNLIT MODERN HOUSE BACKGROUND (SS 1 FIX)
         * ================================================================ */}
        <section className="bg-slate-950 text-white py-16 lg:py-20 px-5 sm:px-8 lg:px-14 relative overflow-hidden">
          {/* BRIGHT SUNLIT MODERN ARCHITECTURE BACKGROUND PHOTO */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 opacity-100 brightness-110"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80')` }}
          >
            {/* Clean dark translucent glass overlay so bright sunny house photo is 100% visible */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/70 to-slate-900/50 backdrop-blur-[0.5px]"></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

              {/* Left Column */}
              <div className="lg:col-span-5 space-y-5">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
                  WHY CHOOSE ROOMHY?
                </span>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  Built around what <br className="hidden sm:inline" />
                  students actually need.
                </h2>

                <p className="text-slate-200 text-sm font-medium leading-relaxed drop-shadow-xs">
                  Roomhy makes it simpler to explore verified accommodation options, compare pricing, and secure a place that fits your lifestyle.
                </p>

                <div className="pt-2">
                  <Link
                    to="/website/ourproperty"
                    className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-[#0FA596] to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all hover:scale-105"
                  >
                    <span>Explore Properties</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: 2x2 Cards Grid */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:border-l border-white/20 lg:pl-10">
                {[
                  { num: "01 / BIDDING", title: "Smart Bidding", desc: "Innovative budget bidding feature letting students request custom prices directly from owners." },
                  { num: "02 / VERIFICATION", title: "Verified Listings", desc: "All PGs, Hostels, and Apartments are physically verified for safety and quality amenities." },
                  { num: "03 / CONTACT", title: "Direct Owner Contact", desc: "Connect and finalize move-in details directly with hosts without broker intervention." },
                  { num: "04 / SUPPORT", title: "24/7 Assistance", desc: "Dedicated support desk ready to help students with booking, relocation, and queries anytime." },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="p-5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/20 space-y-2 hover:border-teal-400/50 hover:bg-slate-900/90 transition-all duration-300 shadow-xl text-white"
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
        <section className="bg-white py-14 lg:py-18 px-5 sm:px-8 lg:px-14 border-t border-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Left Column: Founder Portrait */}
              <div className="lg:col-span-5 flex justify-center relative">
                <div className="relative w-full max-w-xs aspect-[4/5] rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
                  <img
                    src="/website/images/ceo1.png"
                    alt="Resham Singh — Founder Roomhy"
                    className="w-full h-full object-cover object-[center_top] scale-105 group-hover:scale-110 transition-transform duration-700 origin-top"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/website/images/ceo1.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                  
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-lg font-black">Resham Singh</div>
                    <div className="text-[11px] font-black text-teal-300 uppercase tracking-wider mt-0.5">Founder &amp; Director, Roomhy</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Founder Story */}
              <div className="lg:col-span-7 space-y-4">
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
                <div className="divide-y divide-slate-200/80 pt-1 text-xs font-semibold text-slate-800">
                  <div className="py-2.5 flex items-start gap-2.5">
                    <span className="font-black text-[#0FA596]">01</span>
                    <span>Pioneering India's premier smart bidding student housing platform.</span>
                  </div>
                  <div className="py-2.5 flex items-start gap-2.5">
                    <span className="font-black text-[#0FA596]">02</span>
                    <span>Strong believer in transparency, trust, and student empowerment.</span>
                  </div>
                  <div className="py-2.5 flex items-start gap-2.5">
                    <span className="font-black text-[#0FA596]">03</span>
                    <span>Building Roomhy to simplify room rentals for students nationwide.</span>
                  </div>
                </div>

                {/* Social Connect Links */}
                <div className="flex items-center gap-2.5 pt-1">
                  <a href="https://www.linkedin.com/company/roomhy-com/" target="_blank" rel="noreferrer" className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-[#0FA596] hover:text-white hover:border-[#0FA596] flex items-center gap-1.5 text-xs font-extrabold transition-all shadow-2xs">
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                  <a href="https://www.instagram.com/roomhy.com_/" target="_blank" rel="noreferrer" className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-[#0FA596] hover:text-white hover:border-[#0FA596] flex items-center gap-1.5 text-xs font-extrabold transition-all shadow-2xs">
                    <Instagram className="w-4 h-4" />
                    <span>Instagram</span>
                  </a>
                  <a href="mailto:team@roomhy.com" className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-[#0FA596] hover:text-white hover:border-[#0FA596] flex items-center gap-1.5 text-xs font-extrabold transition-all shadow-2xs">
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
          <div className="max-w-6xl mx-auto">
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
         * 8. THE ROOMHY EXPERIENCE — 3 CARDS WITH PHOTO HEADERS
         * ================================================================ */}
        <section className="bg-white py-14 lg:py-18 px-5 sm:px-8 lg:px-14 border-b border-slate-100">
          <div className="max-w-6xl mx-auto space-y-8">

            <div className="text-center max-w-xl mx-auto space-y-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0FA596]">
                THE ROOMHY EXPERIENCE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                From searching to settling in.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Step 01 */}
              <div className="bg-[#F8FBFA] rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
                <div className="h-44 relative overflow-hidden bg-slate-100">
                  <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80" alt="Discover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-wider text-teal-300 uppercase">DISCOVER</span>
                    <div className="w-7 h-7 rounded-lg bg-[#0FA596] text-white flex items-center justify-center font-black text-xs shadow-xs">01</div>
                  </div>
                </div>
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-start">
                  <h3 className="text-base font-extrabold text-slate-950">Browse Verified Stays</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Browse 100% physically verified PGs, hostels, co-living spaces and student apartments in top educational hubs.
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="bg-[#F8FBFA] rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
                <div className="h-44 relative overflow-hidden bg-slate-100">
                  <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80" alt="Choose" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-wider text-purple-300 uppercase">CHOOSE</span>
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-xs">02</div>
                  </div>
                </div>
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-start">
                  <h3 className="text-base font-extrabold text-slate-950">Fast Bidding &amp; Offers</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Compare stays, view verified room photos, check amenities, and place custom budget bids directly with hosts.
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="bg-[#F8FBFA] rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
                <div className="h-44 relative overflow-hidden bg-slate-100">
                  <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80" alt="Connect" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-wider text-emerald-300 uppercase">CONNECT</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">03</div>
                  </div>
                </div>
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-start">
                  <h3 className="text-base font-extrabold text-slate-950">Direct Owner Move-in</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Talk directly with verified property owners, finalize move-in details without brokers, and settle into your new home.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ================================================================
         * 9. FINAL BRAND CTA CONTAINER (BRIGHT SUNLIT VILLA HOUSE BG)
         * ================================================================ */}
        <section className="py-12 lg:py-16 px-5 sm:px-8 lg:px-14 bg-[#F4F7F6]">
          <div className="max-w-6xl mx-auto">
            <div 
              className="relative rounded-3xl p-10 md:p-14 text-center shadow-2xl overflow-hidden border border-slate-200 bg-cover bg-center"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600')` }}
            >
              {/* Light translucent dark overlay so villa photo is 100% visible */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/65 to-teal-950/70 backdrop-blur-[0.5px]"></div>

              <div className="max-w-2xl mx-auto space-y-4 relative z-10 text-white">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                  Find a place that <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                    feels like home.
                  </span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed max-w-xl mx-auto drop-shadow-sm">
                  Join thousands of students finding broker-free, verified PGs, Hostels, and Apartments across India today.
                </p>

                <div className="pt-4">
                  <Link
                    to="/website/ourproperty"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#0FA596] to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-black text-sm shadow-xl transition-all hover:scale-105"
                  >
                    <span>Explore Properties</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
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
