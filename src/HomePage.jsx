import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Star, Building2, Users, Bed, Home as HomeIcon, ChevronRight, ChevronLeft,
  ShieldCheck, BadgeCheck, Tag, Headphones, Lock, CalendarCheck, Plus, Minus, Check,
  Sofa, Home, Utensils, Wifi, Sparkles, PlayCircle, Wallet, User, ChevronDown, ArrowLeft, X
} from 'lucide-react';

import WebsiteNavbar from './components/website/WebsiteNavbar';
import WebsiteFooter from './components/website/WebsiteFooter';
import MobileBottomNav from './components/website/MobileBottomNav';
import MobilePropertiesSection from './components/website/MobilePropertiesSection';
import MobileVideoSection from './components/website/MobileVideoSection';
import WhyStudentsChooseUs from './components/website/WhyStudentsChooseUs';
import FindYourHome from './components/website/FindYourHome';
import WhyRoomhy from './components/website/WhyRoomhy';
import { fetchProperties } from './utils/api';
import useSEO from './hooks/useSEO';

const BRAND = "text-[oklch(0.68_0.15_165)]";
const BRAND_BG = "bg-[oklch(0.68_0.15_165)]";
const BRAND_SOFT = "bg-[oklch(0.96_0.04_165)]";
const BRAND_BORDER = "border-[oklch(0.68_0.15_165)]";

const heroImages = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto=format&fit=crop'
];

const staticOfferings = [
  {
    title: 'PG',
    category: 'PG',
    link: '/website/ourproperty?type=pg',
    description: 'Comfortable paying guest accommodations with all amenities',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Hostel',
    category: 'Hostel',
    link: '/website/ourproperty?type=hostel',
    description: 'Affordable hostel living for students and working professionals',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Co-living',
    category: 'Co-living',
    link: '/website/ourproperty?type=co-living',
    description: 'Modern co-living spaces with community and facilities',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Apartment/Flats',
    category: 'Apartment',
    link: '/website/ourproperty?type=apartment',
    description: 'Private apartments for individuals and small groups',
    image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'List Property',
    category: 'List',
    description: 'Are you an owner? List your property on Roomhy for free!',
    link: '/list-property',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop'
  }
];

/* Reusable Desktop Section Wrapper */
function DesktopSection({ title, sub, children, right }) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
      <div className="relative mb-5 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-extrabold text-slate-900 md:text-3xl">{title}</h2>
          {sub && <p className="mt-1.5 text-sm text-slate-500 md:text-base font-medium">{sub}</p>}
        </div>
        {right && (
          <div className="mt-2 md:absolute md:right-0 md:bottom-0 md:mt-0">
            {right}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

/* ========================================================================= */
/* DESKTOP-ONLY COMPONENTS (home-page-magic Design)                          */
/* ========================================================================= */

function DesktopHero({ searchQuery, setSearchQuery, selectedGender, setSelectedGender, selectedBudget, setSelectedBudget, handleSearchSubmit }) {
  const [tab, setTab] = useState("PG");
  const tabs = [
    { k: "PG", icon: Bed, val: "pg" },
    { k: "Hostels", icon: Building2, val: "hostel" },
    { k: "Co-living", icon: Sofa, val: "co-living" },
    { k: "Apartments", icon: Home, val: "apartment" },
  ];

  return (
    <section className="relative bg-gradient-to-b from-[#f4fcfa] to-white pt-4 pb-4 lg:pt-6 lg:pb-6 overflow-hidden border-b border-slate-100">
      {/* Right Image Container — Expanded to 68% width with subtle fade */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[68%] z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#f4fcfa] via-[#f4fcfa]/60 to-transparent lg:w-32 z-10" />
        <img
          src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80"
          alt="Premium Roomhy stay"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Container — Flush to far left corner with no empty left margin */}
      <div className="relative z-10 w-full pl-4 sm:pl-6 md:pl-8 lg:pl-10 pr-4">
        <div className="max-w-xl">
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm ${BRAND} border ${BRAND_BORDER}/20`}>
            <ShieldCheck className="h-4 w-4" /> Smart Bidding
          </span>
          <h1 className="mt-2.5 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-[#1a2b3c] md:text-4xl lg:text-[2.65rem]">
            Premium Student & <br />
            Professional <span className={BRAND}>Living</span>
          </h1>
          <p className="mt-2.5 max-w-md text-xs font-medium text-slate-600 md:text-sm leading-relaxed">
            Find and book verified PGs, Hostels, Co-living spaces and Apartments in top cities.
          </p>
        </div>

        {/* Search Container — Compact max-w-[46rem] so image is prominently visible on the right */}
        <div className="mt-4 max-w-[46rem] rounded-2xl bg-white/95 backdrop-blur-md p-2 shadow-[0_4px_25px_rgb(0,0,0,0.08)] border border-slate-100">
          <div className="flex gap-3 border-b border-slate-100 px-3 pt-1">
            {tabs.map(({ k, icon: I, val }) => (
              <button 
                key={k} 
                onClick={() => setTab(k)}
                className={`relative flex items-center gap-2 pb-2.5 px-2 text-xs font-bold transition-colors ${tab === k ? BRAND : "text-slate-500 hover:text-slate-800"}`}
              >
                <I className="h-4 w-4" /> {k}
                {tab === k && <span className={`absolute bottom-0 left-0 h-0.5 w-full ${BRAND_BG}`} />}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => handleSearchSubmit(e, tabs.find(t => t.k === tab)?.val)} className="flex flex-row items-center p-2 gap-2">
            <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 hover:border-slate-300 transition-colors w-full">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Search city, locality or landmark (e.g. Kota, Vigyan Nagar)" 
              />
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="flex h-[40px] w-36 items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 outline-none cursor-pointer"
              >
                <option value="">Any Gender</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="co-ed">Co-Ed</option>
              </select>

              <select 
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
                className="flex h-[40px] w-36 items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 outline-none cursor-pointer"
              >
                <option value="">Any Budget</option>
                <option value="5000">Under ₹5,000</option>
                <option value="8000">Under ₹8,000</option>
                <option value="12000">Under ₹12,000</option>
                <option value="15000">₹15,000+</option>
              </select>
            </div>

            <button type="submit" className={`flex h-[40px] items-center justify-center gap-2 rounded-xl ${BRAND_BG} px-7 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity shrink-0`}>
              <Search className="h-4 w-4" /> Search
            </button>
          </form>
        </div>

        <div className="mt-4 max-w-[1440px] w-full rounded-xl bg-white px-6 py-3 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 relative z-10">
          {[
            { i: ShieldCheck, t: "Smart Bidding", s: "Best price deals" },
            { i: BadgeCheck, t: "Verified Properties", s: "100% verified listings" },
            { i: Tag, t: "Lowest Price Guarantee", s: "Best price, always" },
            { i: Headphones, t: "24/7 Support", s: "Always here to help" },
            { i: Lock, t: "Safe & Secure", s: "Your safety, our priority" },
          ].map(({ i: I, t, s }) => (
            <div key={t} className="flex min-w-0 items-center gap-2.5">
              <I className={`h-5 w-5 shrink-0 ${BRAND}`} />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">{t}</p>
                <p className="truncate text-[11px] font-medium text-slate-500">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute right-10 top-36 z-20">
        <div className="rounded-2xl bg-white p-4 shadow-2xl border border-slate-100 flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <div className={`grid h-6 w-6 place-items-center rounded-full ${BRAND_BG}`}>
              <BadgeCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">Verified Stays</span>
          </div>
          <div className="flex -space-x-2 mt-1">
            {[47, 12, 32, 5].map(i => (
              <img key={i} src={`https://i.pravatar.cc/40?img=${i}`} className="h-7 w-7 rounded-full border-2 border-white object-cover" alt="" />
            ))}
          </div>
          <p className="mt-1 text-xs font-bold text-slate-800">
            50,000+ Students <br />
            <span className="font-medium text-slate-500">Trust Roomhy</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function DesktopWhatWeOffer() {
  const items = [
    { 
      icon: Bed, 
      t: "PG (Paying Guest)", 
      d: "Comfortable PGs with food & essential amenities.", 
      cta: "Explore PGs", 
      href: "/website/ourproperty?type=pg", 
      badge: "bg-teal-50 text-teal-700 border-teal-200/80",
      bullets: ["Students Preferred", "Meals & WiFi"],
      img: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&q=80" 
    },
    { 
      icon: Building2, 
      t: "Hostels", 
      d: "Affordable hostels with great student community.", 
      cta: "Explore Hostels", 
      href: "/website/ourproperty?type=hostel", 
      badge: "bg-orange-50 text-orange-700 border-orange-200/80",
      bullets: ["Budget Friendly", "Shared & Private"],
      img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80" 
    },
    { 
      icon: Sofa, 
      t: "Co-living", 
      d: "Stylish co-living spaces for modern lifestyle.", 
      cta: "Explore Co-living", 
      href: "/website/ourproperty?type=co-living", 
      badge: "bg-purple-50 text-purple-700 border-purple-200/80",
      bullets: ["For Professionals", "Fully Furnished"],
      img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80" 
    },
    { 
      icon: Home, 
      t: "Apartments", 
      d: "Private & shared apartments for independent living.", 
      cta: "Explore Apartments", 
      href: "/website/ourproperty?type=apartment", 
      badge: "bg-sky-50 text-sky-700 border-sky-200/80",
      bullets: ["Independent Living", "Long Term Stays"],
      img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80" 
    }
  ];

  return (
    <DesktopSection title="What We Offer" sub="Choose from a variety of accommodation types tailored for students and professionals.">
      <div className="grid grid-cols-4 gap-4">
        {items.map(({ icon: I, t, d, cta, href, badge, bullets, img }) => (
          <Link 
            key={t} 
            to={href} 
            className="group flex overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-lg hover:border-teal-300/80 hover:-translate-y-0.5 transition-all duration-300 h-36"
          >
            {/* LEFT SIDE: Image Thumbnail (50% EQUAL WIDTH w-1/2) */}
            <div className="relative w-1/2 shrink-0 overflow-hidden bg-slate-100">
              <img src={img} alt={t} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent"></div>
              <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-white/95 backdrop-blur-md shadow-xs text-teal-600 flex items-center justify-center border border-slate-200/80">
                <I className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* RIGHT SIDE: Details & Clean Subtle Text Link (50% EQUAL WIDTH w-1/2) */}
            <div className="flex w-1/2 flex-col p-3 justify-between min-w-0">
              <div className="space-y-1">
                <h3 className="font-display text-xs font-extrabold text-slate-900 tracking-tight truncate">{t}</h3>
                <p className="text-[10px] leading-snug text-slate-500 font-medium line-clamp-2">{d}</p>
                
                {/* Feature Badges */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {bullets.map((b) => (
                    <span key={b} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${badge}`}>
                      <Check className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{b}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Clean Subtle Text Link (No Bulky Solid Button) */}
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-teal-600 group-hover:text-teal-700 inline-flex items-center gap-1 transition-colors">
                  <span>{cta}</span>
                  <span className="transition-transform group-hover:translate-x-1 font-bold">→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DesktopSection>
  );
}

function DesktopHowItWorks({ onOpenVideoModal }) {
  return (
    <DesktopSection title="How Roomhy Works" sub="Find, compare, and book your perfect stay in just a few steps.">
      <div 
        onClick={onOpenVideoModal}
        className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-[oklch(0.96_0.04_165)] to-[oklch(0.92_0.06_165)] shadow-lg h-[280px] cursor-pointer group"
      >
        <div className="absolute inset-0 grid place-items-center">
          <button aria-label="Play video" className={`flex items-center gap-3 rounded-full ${BRAND_BG} px-6 py-3 text-white shadow-xl transition group-hover:scale-105`}>
            <PlayCircle className="h-6 w-6" />
            <span className="text-sm font-bold">Watch how it works</span>
          </button>
        </div>
        <div className="absolute bottom-3 left-3 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          Official Roomhy Video Guide
        </div>
      </div>
    </DesktopSection>
  );
}

function DesktopTrending({ properties }) {
  const scrollRef = React.useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const fallbackProperties = [
    { _id: "1", name: "ABC Residence", location: "Vigyan Nagar, Kota", rent: 2000, rating: 4.6, reviews: 120, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=70" },
    { _id: "2", name: "HL Residency", location: "Landmark City, Kota", rent: 2500, rating: 4.5, reviews: 98, image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=70" },
    { _id: "3", name: "Sunshine PG", location: "Talwandi, Kota", rent: 2500, rating: 4.3, reviews: 76, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=70" },
    { _id: "4", name: "Cozy Stay Boys PG", location: "Mahaveer Nagar, Kota", rent: 2500, rating: 4.6, reviews: 110, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=70" },
    { _id: "5", name: "Green View Hostel", location: "Indra Vihar, Kota", rent: 2300, rating: 4.4, reviews: 95, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=70" },
    { _id: "6", name: "Royal Heights PG", location: "Vijay Nagar, Indore", rent: 3200, rating: 4.8, reviews: 140, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=70" },
  ];

  const displayList = properties && properties.length > 0 ? properties : fallbackProperties;

  return (
    <DesktopSection 
      title="Trending Stays This Week" 
      sub="Most popular properties among students"
      right={<Link to="/website/ourproperty" className={`text-sm font-semibold ${BRAND}`}>View all properties →</Link>}
    >
      <div className="relative group">
        {/* Floating Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-6 md:-left-8 lg:-left-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-transparent hover:bg-slate-200/50 text-slate-700 hover:text-teal-600 flex items-center justify-center transition-all hover:scale-125 active:scale-95 cursor-pointer opacity-70 hover:opacity-100"
          title="Scroll Left"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Floating Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-6 md:-right-8 lg:-right-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-transparent hover:bg-slate-200/50 text-slate-700 hover:text-teal-600 flex items-center justify-center transition-all hover:scale-125 active:scale-95 cursor-pointer opacity-70 hover:opacity-100"
          title="Scroll Right"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>

        <div
          ref={scrollRef}
          className="flex items-center gap-4 overflow-x-auto scroll-smooth scrollbar-hide py-2 px-1"
        >
          {displayList.map((c) => (
            <Link key={c._id || c.id} to={`/website/propertydetails/${c._id || c.id}`} className="w-[230px] shrink-0 group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img src={c.image} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full ${BRAND_BG} px-2 py-0.5 text-[10px] font-bold text-white shadow-xs`}>
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              </div>
              <div className="p-3">
                <h3 className="truncate font-display text-sm font-bold text-slate-800">{c.name}</h3>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 font-medium">{c.location}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className={`inline-flex items-center gap-0.5 rounded ${BRAND_BG} px-1.5 py-0.5 text-[10px] font-bold text-white`}>
                    <Star className="h-2.5 w-2.5 fill-white" /> {c.rating || 4.5}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">({c.reviews || 95})</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-sm font-extrabold text-slate-900">₹{Number(c.price ? c.price.replace(/[^0-9]/g, '') : c.rent).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-500 font-medium">/ mo</span>
                  <span className="ml-auto text-[10px] font-bold text-orange-500">40% off</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DesktopSection>
  );
}

function DesktopCities() {
  const cities = [
    { n: "Kota", c: "25,000+", img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=500&q=70" },
    { n: "Jaipur", c: "18,000+", img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=500&q=70" },
    { n: "Delhi", c: "45,000+", img: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=500&q=70" },
    { n: "Indore", c: "12,000+", img: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=500&q=70" },
    { n: "Bhopal", c: "10,000+", img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=500&q=70" },
    { n: "Sikar", c: "8,500+", img: "https://images.unsplash.com/photo-1572445271230-a78b5944a659?w=500&q=70" },
  ];

  return (
    <section className={`${BRAND_SOFT} py-6`}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 md:text-3xl">Browse by Cities</h2>
            <p className="mt-1 text-sm text-slate-600 font-medium">Explore properties in India's most popular student cities.</p>
          </div>
          <Link to="/website/ourproperty" className={`shrink-0 text-sm font-semibold ${BRAND}`}>View all cities →</Link>
        </div>
        <div className="mt-5 grid grid-cols-6 gap-3">
          {cities.map((c) => (
            <Link to={`/website/ourproperty?city=${c.n.toLowerCase()}`} key={c.n} className="group overflow-hidden rounded-2xl border border-emerald-100 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative aspect-[5/4] overflow-hidden">
                <img src={c.img} alt={c.n} className="h-full w-full object-cover transition group-hover:scale-105" />
              </div>
              <div className="p-3">
                <p className="font-display text-sm font-bold text-slate-800">{c.n}</p>
                <p className="text-[11px] text-slate-500 font-medium">{c.c} Properties</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function DesktopPopularAreas() {
  const data = [
    { city: "Kota", areas: ["Talwandi", "Vigyan Nagar", "Landmark City", "Mahaveer Nagar", "Indra Vihar"] },
    { city: "Sikar", areas: ["Piprali Road", "Subhash Chowk", "Station Road", "Nawalgarh Road", "Jaipur Road"] },
    { city: "Indore", areas: ["Vijay Nagar", "Bhawar Kuan", "Palasia", "Rajwada", "Geeta Bhawan"] },
    { city: "Jaipur", areas: ["Malviya Nagar", "Vaishali Nagar", "Mansarovar", "C-Scheme", "Raja Park"] },
    { city: "Delhi", areas: ["Mukherjee Nagar", "North Campus", "South Campus", "Laxmi Nagar", "Rohini"] },
    { city: "Bhopal", areas: ["MP Nagar", "Indrapuri", "New Market", "Arera Colony", "Ayodhya Bypass"] }
  ];

  return (
    <DesktopSection title="Popular Areas" sub="Find stays in the most preferred localities across top cities.">
      <div className="grid grid-cols-6 gap-4">
        {data.map((c) => (
          <div key={c.city} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <h3 className="font-display text-sm font-bold text-slate-800">{c.city}</h3>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                {c.areas.map((area) => (
                  <li key={area}>
                    <Link to={`/website/ourproperty?search=${encodeURIComponent(area)}`} className="hover:text-emerald-600 cursor-pointer transition-colors block">
                      {area}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <Link to={`/website/ourproperty?city=${c.city.toLowerCase()}`} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline">
              View all →
            </Link>
          </div>
        ))}
      </div>
    </DesktopSection>
  );
}

function DesktopWhyChoose() {
  const items = [
    { icon: ShieldCheck, t: "Smart Bidding", d: "Bid your budget and get instant verified deals.", c: "bg-emerald-100 text-emerald-600" },
    { icon: BadgeCheck, t: "Verified Properties", d: "Every listing is verified by our team for your safety.", c: "bg-orange-100 text-orange-600" },
    { icon: Wallet, t: "Best Price Guarantee", d: "Find the best prices compared to other platforms.", c: "bg-purple-100 text-purple-600" },
    { icon: Sofa, t: "Fully Furnished", d: "Move in with just your suitcase. All essentials included.", c: "bg-amber-100 text-amber-600" },
    { icon: Headphones, t: "24/7 Support", d: "Our support team is always here to help you anytime.", c: "bg-blue-100 text-blue-600" },
    { icon: CalendarCheck, t: "Flexible Booking", d: "Book for any duration – short term or long term.", c: "bg-rose-100 text-rose-600" },
    { icon: Lock, t: "Secure & Safe", d: "Verified owners, safe localities and secure living.", c: "bg-emerald-100 text-emerald-600" },
    { icon: Tag, t: "Lowest Price", d: "Get the most affordable stays in top locations.", c: "bg-teal-100 text-teal-600" },
  ];

  return (
    <DesktopSection title="Why Choose Roomhy?" sub="Built by students, for students. Here's why thousands trust us.">
      <div className="grid grid-cols-8 gap-3">
        {items.map(({ icon: I, t, d, c }) => (
          <div key={t} className="flex flex-col items-center text-center rounded-2xl border border-slate-100 bg-white p-3.5 transition-all hover:shadow-md hover:-translate-y-1">
            <div className={`grid h-11 w-11 place-items-center rounded-full ${c} mb-2.5`}>
              <I className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xs font-bold text-slate-800 leading-snug">{t}</h3>
            <p className="mt-1 text-[10px] leading-tight text-slate-500">{d}</p>
          </div>
        ))}
      </div>
    </DesktopSection>
  );
}

function DesktopLifeAtRoomhy() {
  const items = [
    { icon: Utensils, title: "Homemade Food", desc: "Healthy & tasty meals with veg & non-veg options.", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80", badgeBg: "bg-emerald-500 text-white" },
    { icon: Wifi, title: "High Speed WiFi", desc: "Unlimited high speed internet for study, entertainment & work.", img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80", badgeBg: "bg-teal-500 text-white" },
    { icon: Sparkles, title: "Daily Housekeeping", desc: "Clean rooms & common areas for a hassle-free stay.", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80", badgeBg: "bg-orange-500 text-white" },
    { icon: Bed, title: "Fully Furnished", desc: "Bed, study table, wardrobe & more. Just move in!", img: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80", badgeBg: "bg-purple-500 text-white" }
  ];

  return (
    <DesktopSection title="Life at Roomhy" sub="More than just a stay – It's a complete experience.">
      <div className="grid grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.title} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="relative h-40 overflow-hidden">
              <img src={item.img} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="relative p-4 pt-5">
              <div className={`absolute -top-5 left-4 flex h-9 w-9 items-center justify-center rounded-xl shadow-md ${item.badgeBg}`}>
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-display text-sm font-bold text-slate-800">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-snug">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl bg-gradient-to-r from-[#e6f7f2] via-[#eaf8f4] to-[#f2faf7] p-8 flex items-center justify-between gap-6 border border-emerald-100/60 shadow-sm">
        <div>
          <h3 className="font-display text-2xl font-extrabold text-emerald-950 md:text-3xl">
            Your comfort is our priority.
          </h3>
          <p className="mt-2 text-sm font-medium text-emerald-800/80 max-w-md">
            From comfort to connectivity, we've got everything you need.
          </p>
        </div>
        <div className="relative w-80 h-36 overflow-hidden rounded-2xl">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80"
            alt="Students on sofa"
            className="h-full w-full object-cover rounded-2xl"
          />
        </div>
      </div>
    </DesktopSection>
  );
}

function DesktopFindYourStay() {
  const cards = [
    { title: "PG (Paying Guest)", icon: Bed, color: "bg-emerald-500 text-white", bgCard: "bg-emerald-50/50 border-emerald-100", bullets: ["Best for students", "Affordable", "Meals included", "Monthly stay"], img: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=500&q=80", type: "pg" },
    { title: "Hostels", icon: Building2, color: "bg-orange-500 text-white", bgCard: "bg-orange-50/50 border-orange-100", bullets: ["Best for students", "Budget friendly", "Shared facilities", "Daily / Monthly"], img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=80", type: "hostel" },
    { title: "Co-living", icon: Sofa, color: "bg-purple-500 text-white", bgCard: "bg-purple-50/50 border-purple-100", bullets: ["Best for professionals", "Flexible stay", "Community living", "Fully furnished"], img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80", type: "co-living" },
    { title: "Apartments", icon: Home, color: "bg-sky-500 text-white", bgCard: "bg-sky-50/50 border-sky-100", bullets: ["Best for families/pros", "Private & shared", "Long term stay", "Independent living"], img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=80", type: "apartment" }
  ];

  return (
    <DesktopSection title="Find Your Perfect Stay" sub="Different needs, perfect spaces.">
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.title} to={`/website/ourproperty?type=${c.type}`} className={`flex flex-col justify-between rounded-3xl border ${c.bgCard} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}>
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${c.color}`}>
                  <c.icon className="h-4 w-4" />
                </div>
                <h3 className="font-display text-base font-bold text-slate-800">{c.title}</h3>
              </div>
              <ul className="space-y-2 mb-6">
                {c.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-32 w-full overflow-hidden rounded-2xl mt-2">
              <img src={c.img} alt={c.title} className="h-full w-full object-cover" />
            </div>
          </Link>
        ))}
      </div>
    </DesktopSection>
  );
}

function DesktopZeroBrokerageSavings() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-4 md:px-8">
      <div className="w-full rounded-3xl bg-gradient-to-br from-[#ecf7f4] via-[#f0faf6] to-[#f4fbf8] py-6 lg:py-7 pl-4 lg:pl-6 pr-6 lg:pr-8 border border-emerald-100/80 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-12 gap-8 items-center">
          <div className="col-span-4 space-y-4">
            <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              Smart Bidding.<br />
              <span className="text-emerald-600">100% Savings.</span>
            </h2>
            <p className="text-xs lg:text-sm text-slate-600 font-medium leading-relaxed">
              Connect directly with verified property owners and save thousands on brokerage.
            </p>
            <ul className="space-y-2 pt-1">
              {["No Hidden Charges", "Direct Owner Contact", "Transparent Pricing"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <div className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-6 flex items-center justify-center gap-3 relative">
            <div className="w-1/2 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 text-center space-y-3">
              <span className="inline-block rounded-lg bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                Traditional Way
              </span>
              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-1">
                <li className="flex items-center justify-center gap-1.5 text-rose-500 font-semibold">
                  <span className="text-rose-500 font-extrabold">✕</span> Pay Brokerage
                </li>
                <li className="flex items-center justify-center gap-1.5 text-slate-500">
                  <span className="text-rose-500 font-extrabold">✕</span> Extra Charges
                </li>
                <li className="flex items-center justify-center gap-1.5 text-slate-500">
                  <span className="text-rose-500 font-extrabold">✕</span> Multiple Calls
                </li>
                <li className="flex items-center justify-center gap-1.5 text-slate-500">
                  <span className="text-rose-500 font-extrabold">✕</span> Time Consuming
                </li>
                <li className="flex items-center justify-center gap-1.5 text-slate-500">
                  <span className="text-rose-500 font-extrabold">✕</span> Expensive
                </li>
              </ul>
            </div>

            <div className="z-10 h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-extrabold text-xs shadow-md shrink-0">
              VS
            </div>

            <div className="w-1/2 rounded-2xl bg-white p-4 shadow-sm border border-emerald-200 text-center space-y-3 relative ring-2 ring-emerald-500/20">
              <span className="inline-block rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                With Roomhy
              </span>
              <ul className="space-y-2 text-xs font-medium text-slate-700 pt-1">
                <li className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold">
                  <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" /> Smart Bidding
                </li>
                <li className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold">
                  <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" /> No Hidden Charges
                </li>
                <li className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold">
                  <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" /> Direct Owner
                </li>
                <li className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold">
                  <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" /> Quick & Easy
                </li>
                <li className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold">
                  <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" /> Best Prices
                </li>
              </ul>
            </div>
          </div>

          <div className="col-span-2 flex justify-center">
            <div className="relative h-44 w-44 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80"
                alt="Savings"
                className="h-36 w-36 object-cover rounded-full shadow-lg border-4 border-white"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DesktopTestimonials() {
  const items = [
    { n: "Rahul Sharma", r: "IIT JEE Student, Kota", q: "Roomhy made finding my hostel so easy! Smart bidding and no hidden charges. Highly recommended!", a: "https://i.pravatar.cc/80?img=12" },
    { n: "Priya Patel", r: "NEET Student, Sikar", q: "Great platform! I found a safe PG near my college within a day. The owner was very cooperative.", a: "https://i.pravatar.cc/80?img=32" },
    { n: "Vikram Singh", r: "Allen Student, Kota", q: "Verified properties and direct owner contact saved me both money and time.", a: "https://i.pravatar.cc/80?img=15" },
    { n: "Anjali Mehta", r: "IT Professional, Indore", q: "Love the variety of options. Co-living spaces are amazing and budget friendly.", a: "https://i.pravatar.cc/80?img=47" },
    { n: "Aman Gupta", r: "Coaching Student, Jaipur", q: "Super smooth experience. Booked my room online without any agent hassle.", a: "https://i.pravatar.cc/80?img=33" }
  ];

  const duplicated = [...items, ...items];

  return (
    <DesktopSection title="What Students Say" sub="Trusted by 50,000+ students across India">
      <div className="relative w-full overflow-hidden">
        <div className="flex gap-4 animate-scroll-left w-max py-2">
          {duplicated.map((t, idx) => (
            <div key={idx} className="w-80 shrink-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <img src={t.a} alt={t.n} className="h-10 w-10 rounded-full object-cover border border-slate-100" />
                <div>
                  <p className="text-xs font-bold text-slate-800">{t.n}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{t.r}</p>
                </div>
              </div>
              <div className="mt-2.5 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium">"{t.q}"</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-left {
          animation: scroll-left 25s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </DesktopSection>
  );
}

function DesktopListYourPropertyBanner() {
  return (
    <DesktopSection title="" sub="">
      <div className="rounded-3xl bg-gradient-to-r from-[#eaf6f2] via-[#eff8f4] to-[#f4fbf8] p-8 border border-emerald-100 shadow-sm flex items-center justify-between gap-6">
        <div className="max-w-xl space-y-4">
          <h2 className="font-display text-3xl font-extrabold text-slate-900">
            List Your Property for Free
          </h2>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            Join thousands of property owners who trust Roomhy to find genuine tenants.
          </p>
          <div>
            <Link
              to="/list-property"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              List Your Property Now →
            </Link>
          </div>
        </div>

        <div className="relative h-36 w-72 overflow-hidden rounded-2xl shrink-0">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80"
            alt="List Property"
            className="h-full w-full object-cover rounded-2xl"
          />
        </div>

        <div className="space-y-3 shrink-0">
          {["Free Listing", "Verified Badge", "More Enquiries", "Faster Bookings"].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </DesktopSection>
  );
}

function DesktopLatestBlog() {
  const blogs = [
    { tag: "TIPS", title: "7 Tips to Find the Perfect PG in Kota", img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=80" },
    { tag: "SAVINGS", title: "How Smart Bidding Saves You ₹10,000+ Every Academic Year", img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500&q=80" },
    { tag: "GUIDE", title: "PG vs Hostel vs Co-living – Which is Right for You?", img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=80" },
    { tag: "BUDGET", title: "How to Save Money While Living Away From Home", img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80" }
  ];

  return (
    <DesktopSection title="Latest from Our Blog" sub="" right={<Link to="/faq" className="text-xs font-bold text-emerald-600 hover:underline">View all blogs →</Link>}>
      <div className="grid grid-cols-4 gap-4">
        {blogs.map((b) => (
          <div key={b.title} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer">
            <div className="relative h-44 overflow-hidden">
              <img src={b.img} alt={b.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute top-3 left-3 rounded-md bg-white/90 px-2 py-1 text-[10px] font-extrabold tracking-wider text-slate-800 shadow-sm backdrop-blur">
                {b.tag}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-display text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors leading-snug">
                {b.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </DesktopSection>
  );
}

function DesktopFAQ() {
  const faqs = [
    { q: "How does Smart Bidding work?", a: "Place custom budget bids directly to verified property owners on Roomhy and get instant savings." },
    { q: "What documents are required to book?", a: "A valid government ID (Aadhaar / passport) and a student/employee ID is usually enough." },
    { q: "How can I contact the property owner?", a: "Once you shortlist a property, use the built-in chat or call button to reach the owner directly." },
    { q: "Can I get a refund if I cancel?", a: "Yes — refunds follow the cancellation policy shown on each listing before you book." },
    { q: "Is the property verified?", a: "Every listing is physically inspected and verified by the Roomhy team before it goes live." },
    { q: "Can I change my room after booking?", a: "Yes, subject to availability. Just contact support and we'll help you switch." },
    { q: "Can I visit the property before booking?", a: "Absolutely. You can schedule a free visit directly from the property page." },
    { q: "Is Roomhy safe for girls?", a: "Yes. We list only verified girls-only and co-ed properties with strict safety checks and CCTV." },
  ];
  const [open, setOpen] = useState(null);

  return (
    <DesktopSection title="Frequently Asked Questions" sub="Everything you need to know before you book" right={<Link to="/faq" className={`text-sm font-semibold ${BRAND}`}>View all FAQs →</Link>}>
      <div className="grid grid-cols-2 gap-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="rounded-xl bg-slate-100/60 p-4 text-left transition hover:bg-slate-100 border border-slate-200/60">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex items-center justify-between gap-3 w-full text-left font-semibold text-xs text-slate-800"
              >
                <span>{f.q}</span>
                {isOpen ? <Minus className={`h-4 w-4 shrink-0 ${BRAND}`} /> : <Plus className={`h-4 w-4 shrink-0 ${BRAND}`} />}
              </button>
              {isOpen && <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium">{f.a}</p>}
            </div>
          );
        })}
      </div>
    </DesktopSection>
  );
}

/* ========================================================================= */
/* MAIN HOMEPAGE COMPONENT                                                    */
/* ========================================================================= */

export default function HomePage() {
  useSEO({ pageKey: 'home', fallbackTitle: 'Roomhy - Smart Bidding Student PGs, Hostels & Co-living' });
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search States
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isBudgetDropdownOpen, setIsBudgetDropdownOpen] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isMobileSearchOverlayOpen, setIsMobileSearchOverlayOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  // Floating Search State for Mobile
  const [isFloatingSearchVisible, setIsFloatingSearchVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) {
        setIsFloatingSearchVisible(window.scrollY > 350);
      } else {
        setIsFloatingSearchVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await fetchProperties();
        if (data && data.length > 0) {
          const formatted = data.map((p) => ({
            _id: p._id || p.id,
            id: p._id || p.id,
            name: p.propertyName || p.name || 'Roomhy Stay',
            location: `${p.area ? p.area + ', ' : ''}${p.city || 'Kota'}`,
            price: `₹${(p.monthlyRent || p.rent || 7500).toLocaleString('en-IN')}`,
            rent: p.monthlyRent || p.rent || 7500,
            rating: p.rating || 4.5,
            reviews: p.reviewsCount || 85,
            verified: true,
            image: p.featuredImage || p.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=70',
            discount: '30% off'
          }));
          setProperties(formatted);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, []);

  const filteredSearchProperties = React.useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return properties;

    const rawQuery = searchQuery.toLowerCase().trim();
    const stopWords = new Set(['in', 'at', 'near', 'the', 'for', 'and', 'with', 'is', 'a', 'an', 'to', 'of', 'me', 'stay', 'stays']);
    
    const tokens = rawQuery
      .split(/\s+/)
      .filter(t => t.length > 0 && !stopWords.has(t));

    if (tokens.length === 0) return properties;

    const expandToken = (token) => {
      if (token === 'girls' || token === 'girl' || token === 'female') return ['girls', 'female', 'girls pg', 'girl'];
      if (token === 'boys' || token === 'boy' || token === 'male') return ['boys', 'male', 'boys pg', 'boy'];
      if (token === 'flat' || token === 'flats') return ['apartment', 'flat', 'flats'];
      if (token === 'coed' || token === 'co-ed') return ['co-ed', 'coed', 'mixed'];
      return [token];
    };

    const expandedTokens = tokens.map(expandToken);

    return properties.filter((p) => {
      const name = String(p.name || p.propertyName || '').toLowerCase();
      const city = String(p.city || '').toLowerCase();
      const area = String(p.area || p.locality || '').toLowerCase();
      const location = String(p.location || '').toLowerCase();
      const landmark = String(p.landmark || p.nearInstitute || p.address || '').toLowerCase();
      const type = String(p.propertyType || p.type || '').toLowerCase();
      const gender = String(p.gender || p.genderCategory || '').toLowerCase();
      const colleges = Array.isArray(p.nearbyColleges) 
        ? p.nearbyColleges.join(' ').toLowerCase() 
        : String(p.nearbyColleges || p.college || '').toLowerCase();

      const fullText = `${name} ${city} ${area} ${location} ${landmark} ${type} ${gender} ${colleges}`;

      return expandedTokens.every(synonymList => 
        synonymList.some(synonym => fullText.includes(synonym))
      );
    });
  }, [properties, searchQuery]);

  const handleSearchSubmit = (e, selectedTabType) => {
    if (e && e.preventDefault) e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedTabType || selectedType) params.append('type', selectedTabType || selectedType);
    if (selectedGender) params.append('gender', selectedGender);
    if (selectedBudget) params.append('maxPrice', selectedBudget);
    navigate(`/website/ourproperty?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navbar - 100% UNTOUCHED ORIGINAL NAVBAR */}
      <WebsiteNavbar />

      {/* ========================================================================= */}
      {/* 1. MOBILE VIEW (md:hidden) — EXACT MATCH TO SCREENSHOT                     */}
      {/* ========================================================================= */}
      <div className="md:hidden">
        {/* Floating Search Bar for Mobile */}
        <div 
          className={`fixed top-0 left-0 right-0 z-[60] p-3 transition-all duration-300 transform ${
            isFloatingSearchVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        >
          <div 
            onClick={() => setIsMobileSearchOverlayOpen(true)}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 px-4 py-2.5 flex items-center gap-3 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
              <Search className="w-4 h-4 text-white" />
            </div>
            <p className="text-gray-400 text-sm font-medium flex-1">Search for PG, Hostels...</p>
            <div className="px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 border border-gray-100">
              Search
            </div>
          </div>
        </div>

        {/* HERO SECTION (MOBILE) */}
        <div className="relative min-h-[170px] bg-gradient-to-br from-teal-600 via-blue-600 to-cyan-500 flex items-center justify-center z-30">
          <div className="absolute inset-0 overflow-hidden">
            {heroImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                  index === currentImgIndex ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ backgroundImage: `url(${image})` }}
              >
                <div className="absolute inset-0 bg-black/60"></div>
              </div>
            ))}
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center py-3">
            <h1 className="text-xl font-bold text-white mb-1 tracking-tight drop-shadow-md">
              Find Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">Student Stay</span>
            </h1>
            <p className="text-xs text-white/90 mb-3 max-w-2xl mx-auto font-medium">
              Search verified PGs, hostels & co-living spaces across 50+ Indian cities
            </p>

            <form onSubmit={handleSearchSubmit} className="search-container bg-white rounded-2xl shadow-2xl p-2 max-w-4xl mx-auto border border-white/20 relative z-50 overflow-visible">
              <div className="flex flex-row items-center gap-1.5">
                <div className="relative flex-shrink-0" ref={typeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTypeDropdownOpen(!isTypeDropdownOpen);
                      setIsGenderDropdownOpen(false);
                      setIsBudgetDropdownOpen(false);
                    }}
                    className="flex items-center justify-between gap-1 bg-teal-50 hover:bg-teal-100 text-teal-800 px-2.5 py-2 rounded-xl font-bold text-xs border border-teal-200 shadow-2xs cursor-pointer min-w-[78px]"
                  >
                    <span className="capitalize">{selectedType ? staticOfferings.find(o => o.category.toLowerCase() === selectedType)?.title || selectedType : 'Type'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-teal-600 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[132px] bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-[9999] text-left overflow-hidden">
                      <div 
                        onClick={() => { setSelectedType(''); setIsTypeDropdownOpen(false); }}
                        className={`px-3 py-2 hover:bg-teal-50 text-[11px] font-semibold cursor-pointer border-b border-gray-100 flex items-center justify-between ${!selectedType ? 'text-teal-700 font-bold bg-teal-50/50' : 'text-gray-700'}`}
                      >
                        <span>All Types</span>
                        {!selectedType && <Check className="w-3 h-3 text-teal-600 stroke-[3]" />}
                      </div>
                      {staticOfferings.filter(o => o.category !== 'List').map((offering) => {
                        const isSelected = selectedType === offering.category.toLowerCase();
                        return (
                          <div
                            key={offering.category}
                            onClick={() => {
                              setSelectedType(offering.category.toLowerCase());
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`px-3 py-2 hover:bg-teal-50 text-[11px] font-semibold cursor-pointer flex items-center justify-between ${
                              isSelected ? 'bg-teal-50/50 text-teal-700 font-bold' : 'text-gray-700'
                            }`}
                          >
                            <span>{offering.title}</span>
                            {isSelected && <Check className="w-3 h-3 text-teal-600 stroke-[3]" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex items-center px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer" onClick={() => setIsMobileSearchOverlayOpen(true)}>
                  <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsMobileSearchOverlayOpen(true)}
                    onClick={() => setIsMobileSearchOverlayOpen(true)}
                    placeholder="Search city, locality..."
                    className="w-full bg-transparent outline-none text-xs font-semibold text-gray-900 placeholder:text-gray-400 cursor-pointer"
                    readOnly
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileSearchOverlayOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md text-xs flex-shrink-0"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 1. WHAT WE OFFER */}
        <section className="py-5 bg-white relative z-0">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-3">
              <h2 className="text-lg font-bold text-gray-900 mb-0.5">What We Offer</h2>
              <p className="text-[11px] text-gray-500 font-medium">
                Choose from a variety of accommodation types tailored for students
              </p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {staticOfferings.slice(0, 4).map((item) => (
                <Link
                  key={item.title}
                  to={item.link}
                  className="flex-shrink-0 w-36 relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-[4/3] group"
                >
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                  <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {item.category === 'Apartment' ? 'Apartment/Flats' : item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 2. HOW ROOMHY WORKS */}
        <MobileVideoSection />

        {/* 3. TRENDING STAYS THIS WEEK */}
        <MobilePropertiesSection />

        {/* 4. WHY CHOOSE ROOMHY? (EXACT MATCH TO USER'S SCREENSHOT) */}
        <WhyRoomhy />

        {/* 5. WHAT STUDENTS SAY (EXACT MATCH TO USER'S SCREENSHOT) */}
        <WhyStudentsChooseUs />
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (hidden md:block) — NEW home-page-magic DESKTOP DESIGN    */}
      {/* ========================================================================= */}
      <div className="hidden md:block">
        <DesktopHero 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedGender={selectedGender}
          setSelectedGender={setSelectedGender}
          selectedBudget={selectedBudget}
          setSelectedBudget={handleSearchSubmit}
        />
        <DesktopWhatWeOffer />
        <DesktopHowItWorks onOpenVideoModal={() => setVideoModalOpen(true)} />
        <DesktopTrending properties={properties} />
        <DesktopCities />
        <DesktopWhyChoose />
        <DesktopZeroBrokerageSavings />
        <DesktopTestimonials />
        <DesktopListYourPropertyBanner />
        <DesktopLatestBlog />
        <DesktopFAQ />
      </div>

      {/* FOOTER */}
      <WebsiteFooter />

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>

      {/* OYO-Style Full Screen Mobile Search Overlay */}
      {isMobileSearchOverlayOpen && (
        <div className="fixed inset-0 bg-white z-[99999] md:hidden flex flex-col animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
            <button
              type="button"
              onClick={() => setIsMobileSearchOverlayOpen(false)}
              className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-800" />
            </button>
            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 border border-gray-200">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setIsMobileSearchOverlayOpen(false);
                    handleSearchSubmit(e);
                  }
                }}
                placeholder="Search city, locality, property name..."
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-gray-100">
            {/* Live Search Results */}
            {searchQuery.trim() ? (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Results</p>
                {filteredSearchProperties.length > 0 ? (
                  filteredSearchProperties.map((prop) => (
                    <div
                      key={prop._id}
                      onClick={() => {
                        setIsMobileSearchOverlayOpen(false);
                        navigate(`/website/ourproperty?search=${encodeURIComponent(prop.name)}`);
                      }}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-600">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{prop.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{prop.location || prop.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-700 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{prop.rating || '4.8'}</span>
                        <span className="text-gray-400 font-normal">({prop.reviews || 12})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    No stays matching "{searchQuery}". Try another keyword or city.
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Popular Keywords / Trending Cities */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Popular Keywords & Cities</p>
                  <div className="flex flex-wrap gap-2">
                    {['Kota', 'Sikar', 'Indore', 'Rajeev Gandhi Nagar', 'Piprali Road', 'Talwandi', 'Boys PG', 'Girls PG', 'Co-living'].map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => {
                          setSearchQuery(keyword);
                        }}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 text-xs font-semibold rounded-full border border-gray-200 transition-colors"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Suggested Properties */}
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Suggested Stays</p>
                  {properties.slice(0, 5).map((prop) => (
                    <div
                      key={prop._id}
                      onClick={() => {
                        setIsMobileSearchOverlayOpen(false);
                        navigate(`/website/ourproperty?search=${encodeURIComponent(prop.name)}`);
                      }}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{prop.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{prop.location || prop.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-700 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{prop.rating || '4.8'}</span>
                        <span className="text-gray-400 font-normal">({prop.reviews || 12})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIDEO MODAL (DESKTOP) */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full text-center relative border border-slate-100">
            <button 
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800"
            >
              ✕
            </button>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Roomhy Platform Tour</h3>
            <p className="text-xs text-slate-500 mb-4">Discover how Smart Bidding student housing works.</p>
            <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 text-sm font-semibold">
              <span>[ Official Roomhy Video Tour ]</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
