import React, { useState, useEffect, useRef, useMemo } from 'react';
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

const BRAND = "text-[#0FA89C]";
const BRAND_BG = "bg-[#0FA89C]";
const BRAND_SOFT = "bg-[#F3FBFA]";
const BRAND_BORDER = "border-[#DDE9E8]";

const heroImages = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto=format&fit=crop'
];

const staticOfferings = [
  {
    title: 'PG',
    category: 'PG',
    link: '/pg',
    description: 'Comfortable paying guest accommodations with all amenities',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Hostel',
    category: 'Hostel',
    link: '/hostels',
    description: 'Affordable hostel living for students and working professionals',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Co-living',
    category: 'Co-living',
    link: '/co-living',
    description: 'Modern co-living spaces with community and facilities',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Apartment/Flats',
    category: 'Apartment',
    link: '/apartments',
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
function DesktopSection({ title, sub, children, right, className = "" }) {
  return (
    <section className={`mx-auto max-w-[1360px] px-4 md:px-6 lg:px-8 py-5 md:py-6 ${className}`}>
      <div className="relative mb-4 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-2xl font-extrabold text-[#102A43] md:text-3xl">{title}</h2>
          {sub && <p className="mt-1 text-xs text-[#60758A] md:text-sm font-medium">{sub}</p>}
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

function DesktopHero({ searchQuery, setSearchQuery, selectedGender, setSelectedGender, selectedBudget, setSelectedBudget, handleSearchSubmit, properties = [] }) {
  const [tab, setTab] = useState("PG");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const tabs = [
    { k: "PG", icon: Bed, val: "pg" },
    { k: "Hostels", icon: Building2, val: "hostel" },
    { k: "Co-living", icon: Sofa, val: "co-living" },
    { k: "Apartments", icon: HomeIcon, val: "apartment" },
  ];

  // Filter properties and cities for live search autocomplete dropdown
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();

    const matches = [];
    const knownCities = ['Kota', 'Sikar', 'Indore', 'Jaipur', 'Delhi', 'Mumbai', 'Pune', 'Bangalore', 'Hyderabad', 'Bhopal'];
    
    // Check city matches
    knownCities.forEach(city => {
      if (city.toLowerCase().includes(q)) {
        matches.push({ type: 'city', title: city, subtitle: 'Explore all stays in ' + city, link: `/properties-in-${city.toLowerCase()}` });
      }
    });

    // Check property matches
    (properties || []).forEach(p => {
      const name = p.name || p.propertyName || '';
      const loc = p.location || p.city || p.area || '';
      if (name.toLowerCase().includes(q) || loc.toLowerCase().includes(q)) {
        if (matches.length < 6) {
          matches.push({ type: 'prop', title: name, subtitle: loc, link: `/property-details/${p._id || p.id}` });
        }
      }
    });

    return matches;
  }, [searchQuery, properties]);

  return (
    <div className="relative min-h-[400px] md:min-h-[430px] bg-[#102A43] z-30 flex flex-col justify-between overflow-hidden pt-5 pb-3.5 md:pt-6 md:pb-4">
      {/* Full width room background image */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
          style={{ backgroundImage: `url('/hero-luxury.jpg')` }}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]"></div>
        </div>
      </div>

      {/* Centered Translucent Glass Panel */}
      <div className="relative max-w-[1020px] w-full mx-auto px-4 z-20 my-auto">
        <div className="bg-white/30 backdrop-blur-[4px] border border-white/60 rounded-[28px] p-4 sm:p-5 md:p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-full shadow-2xs text-[11px] font-black text-[#102A43] mb-2 border border-[#DDE9E8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0FA89C] shrink-0" />
            <span>India's #1 Broker-Free Student Housing &amp; Smart Bidding</span>
          </div>

          {/* Main Heading — DARK NAVY TEXT with TEAL "Living" */}
          <h1 className="text-2xl sm:text-3xl md:text-[36px] font-black text-[#102A43] mb-1 tracking-tight leading-[1.15]">
            Premium Student &amp; <br className="hidden sm:inline" />
            Professional <span className="text-[#0FA89C]">Living</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#102A43] mb-3 max-w-xl mx-auto leading-relaxed">
            Find and book verified PGs, Hostels, Co-living spaces and Apartments in top cities.
          </p>

          {/* Search Container inside Glass Panel */}
          <div className="bg-white/95 backdrop-blur-md rounded-[20px] shadow-lg p-2 sm:p-2.5 border border-[#DDE9E8] text-left relative z-50">
            {/* Category Tabs Bar */}
            <div className="flex items-center justify-center gap-2 sm:gap-5 border-b border-[#DDE9E8] pb-1.5 mb-1.5 overflow-x-auto no-scrollbar">
              {tabs.map(({ k, icon: Icon, val }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                    tab === k
                      ? "bg-[#F3FBFA] text-[#0FA89C] border border-[#DDE9E8] shadow-2xs"
                      : "text-[#60758A] hover:text-[#102A43] hover:bg-[#F7FAFA]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab === k ? 'text-[#0FA89C]' : 'text-[#60758A]'}`} />
                  <span>{k}</span>
                </button>
              ))}
            </div>

            {/* Search Inputs Row */}
            <form 
              onSubmit={(e) => {
                setShowDropdown(false);
                handleSearchSubmit(e, tabs.find(t => t.k === tab)?.val);
              }} 
              className="flex flex-col md:flex-row items-center gap-2 relative"
            >
              {/* Location Search Input */}
              <div className="relative flex-1 w-full flex items-center bg-white border border-[#DDE9E8] rounded-full px-4 py-2 shadow-2xs focus-within:border-[#0FA89C] focus-within:ring-2 focus-within:ring-[#F3FBFA] transition-all">
                <Search className="w-4 h-4 text-[#0FA89C] mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  placeholder="Search city, locality or landmark (e.g. Koramangala, Mumbai)"
                  className="w-full bg-transparent outline-none text-xs font-bold text-[#102A43] placeholder:text-[#60758A]"
                />
              </div>

              {/* Gender Filter Dropdown */}
              <div className="w-full md:w-36 flex items-center bg-white border border-[#DDE9E8] rounded-full px-3.5 py-2 shadow-2xs text-xs font-bold text-[#102A43]">
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full bg-transparent outline-none cursor-pointer"
                >
                  <option value="">Any Gender</option>
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                  <option value="co-ed">Co-Ed</option>
                </select>
              </div>

              {/* Budget Filter Dropdown */}
              <div className="w-full md:w-40 flex items-center bg-white border border-[#DDE9E8] rounded-full px-3.5 py-2 shadow-2xs text-xs font-bold text-[#102A43]">
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="w-full bg-transparent outline-none cursor-pointer"
                >
                  <option value="">Any Budget</option>
                  <option value="5000">Under ₹5,000</option>
                  <option value="8000">Under ₹8,000</option>
                  <option value="12000">Under ₹12,000</option>
                  <option value="15000">₹15,000+</option>
                </select>
              </div>

              {/* Submit Search Button */}
              <button
                type="submit"
                className="w-full md:w-auto bg-[#0FA89C] hover:bg-[#0D9388] text-white px-6 py-2 rounded-full font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            {/* LIVE AUTOCOMPLETE SEARCH DROPDOWN */}
            {showDropdown && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#DDE9E8] overflow-hidden z-[99999] text-left">
                <div className="max-h-72 overflow-y-auto">
                  {filteredSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setShowDropdown(false);
                        navigate(item.link);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F3FBFA] border-b border-[#DDE9E8] last:border-0 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#F3FBFA] text-[#0FA89C] flex items-center justify-center shrink-0 border border-[#DDE9E8]">
                        {item.type === 'city' ? <MapPin className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-xs text-[#102A43] truncate">{item.title}</p>
                        <p className="text-[10px] text-[#60758A] font-semibold truncate">{item.subtitle}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#60758A]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WHITE BENEFITS STRIP — FLOATING INSIDE HERO BOTTOM */}
      <div className="relative max-w-[1020px] w-full mx-auto px-4 z-20 mt-3 sm:mt-3.5">
        <div className="bg-white rounded-[22px] shadow-xl border border-[#DDE9E8] p-3 md:p-3.5 grid grid-cols-2 md:grid-cols-5 gap-2.5 divide-y md:divide-y-0 md:divide-x divide-[#DDE9E8]">
          <div className="flex items-center gap-2.5 pt-1 md:pt-0">
            <div className="w-7.5 h-7.5 rounded-xl bg-[#F3FBFA] flex items-center justify-center shrink-0 text-[#0FA89C] border border-[#DDE9E8]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-[#102A43] leading-tight">Smart Bidding</h4>
              <p className="text-[8.5px] font-semibold text-[#60758A] leading-tight">Best price deals</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1 md:pt-0 md:pl-2.5">
            <div className="w-7.5 h-7.5 rounded-xl bg-[#F3FBFA] flex items-center justify-center shrink-0 text-[#0FA89C] border border-[#DDE9E8]">
              <BadgeCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-[#102A43] leading-tight">Verified Properties</h4>
              <p className="text-[8.5px] font-semibold text-[#60758A] leading-tight">100% verified listings</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1 md:pt-0 md:pl-2.5">
            <div className="w-7.5 h-7.5 rounded-xl bg-[#F3FBFA] flex items-center justify-center shrink-0 text-[#0FA89C] border border-[#DDE9E8]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-[#102A43] leading-tight">Lowest Price Guarantee</h4>
              <p className="text-[8.5px] font-semibold text-[#60758A] leading-tight">Best price, always</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1 md:pt-0 md:pl-2.5">
            <div className="w-7.5 h-7.5 rounded-xl bg-[#F3FBFA] flex items-center justify-center shrink-0 text-[#0FA89C] border border-[#DDE9E8]">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-[#102A43] leading-tight">24/7 Support</h4>
              <p className="text-[8.5px] font-semibold text-[#60758A] leading-tight">Always here to help</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1 md:pt-0 md:pl-2.5">
            <div className="w-7.5 h-7.5 rounded-xl bg-[#F3FBFA] flex items-center justify-center shrink-0 text-[#0FA89C] border border-[#DDE9E8]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-black text-[#102A43] leading-tight">Safe &amp; Secure</h4>
              <p className="text-[8.5px] font-semibold text-[#60758A] leading-tight">Your safety, our priority</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopWhatWeOffer() {
  const items = [
    {
      icon: Bed,
      t: "PG (Paying Guest)",
      href: "/pg",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80"
    },
    {
      icon: Building2,
      t: "Hostels",
      href: "/hostels",
      image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80"
    },
    {
      icon: Sofa,
      t: "Co-living",
      href: "/co-living",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80"
    },
    {
      icon: HomeIcon,
      t: "Apartments",
      href: "/apartments",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80"
    }
  ];

  return (
    <section className="py-5 md:py-6 bg-white relative z-0">
      <div className="max-w-[1360px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-3 md:mb-3.5">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#102A43] mb-0.5 tracking-tight">
            What We Offer
          </h2>
          <p className="text-[11px] sm:text-xs font-semibold text-[#60758A] max-w-xl mx-auto">
            Choose from a variety of accommodation types tailored for students and professionals.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {items.map(({ icon: Icon, t, href, image }) => (
            <Link
              key={t}
              to={href}
              className="group relative h-32 sm:h-34 md:h-36 rounded-[18px] overflow-hidden shadow-md border border-[#DDE9E8] hover:shadow-xl transition-all duration-300 block"
            >
              <img
                src={image}
                alt={t}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102A43]/80 via-[#102A43]/20 to-transparent"></div>

              {/* Top Right Counter Badge */}
              <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md border border-white/20">
                1/3
              </div>

              {/* Bottom Left White Pill Category Badge */}
              <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-black text-[#102A43] flex items-center gap-1.5 shadow-md border border-[#DDE9E8] group-hover:bg-white transition-all">
                <div className="w-4 h-4 rounded-full bg-[#F3FBFA] flex items-center justify-center text-[#0FA89C]">
                  <Icon className="w-3 h-3" />
                </div>
                <span>{t}</span>
                <ChevronRight className="w-3 h-3 text-[#60758A] group-hover:text-[#0FA89C] group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function DesktopHowItWorks({ onOpenVideoModal }) {
  return (
    <DesktopSection title="How Roomhy Works" sub="Find, compare, and book your perfect stay in just a few steps.">
      <div className="relative mx-auto w-full overflow-hidden rounded-3xl bg-[#F3FBFA] border border-[#DDE9E8] p-6 lg:p-7 shadow-sm text-left flex flex-col lg:flex-row items-center justify-between gap-7">
        {/* Subtle Decorative Accents */}
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-[#0FA89C]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-[#0FA89C]/10 blur-3xl rounded-full pointer-events-none" />

        {/* LEFT SIDE: Features & Text Details */}
        <div className="relative z-10 flex-1 space-y-3.5 max-w-2xl">
          <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#102A43] tracking-tight leading-snug">
            Book Your Ideal Stay with Smart Bidding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="flex items-start gap-2.5 bg-white p-3 rounded-2xl border border-[#DDE9E8] shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-[#F3FBFA] text-[#0FA89C] flex items-center justify-center shrink-0 mt-0.5 border border-[#DDE9E8]">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#102A43] leading-none">Search &amp; Filter</h4>
                <p className="text-[11px] text-[#60758A] font-semibold leading-relaxed mt-1.5">Verified PGs, Hostels &amp; Flats with real photos.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white p-3 rounded-2xl border border-[#DDE9E8] shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-[#F3FBFA] text-[#0FA89C] flex items-center justify-center shrink-0 mt-0.5 border border-[#DDE9E8]">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#102A43] leading-none">Smart Bidding</h4>
                <p className="text-[11px] text-[#60758A] font-semibold leading-relaxed mt-1.5">Bid directly to lock lower prices with owners.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white p-3 rounded-2xl border border-[#DDE9E8] shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-[#F3FBFA] text-[#0FA89C] flex items-center justify-center shrink-0 mt-0.5 border border-[#DDE9E8]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#102A43] leading-none">Instant Move-in</h4>
                <p className="text-[11px] text-[#60758A] font-semibold leading-relaxed mt-1.5">Token booking &amp; 100% broker-free transparency.</p>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button 
              onClick={onOpenVideoModal}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0FA89C] hover:bg-[#0D9388] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer group"
            >
              <PlayCircle className="w-4.5 h-4.5 transition-transform group-hover:scale-110" />
              <span>Watch 1-Min Video Guide</span>
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: Reserved Video Preview Frame */}
        <div 
          onClick={onOpenVideoModal}
          className="relative z-10 w-full lg:w-[410px] shrink-0 h-[215px] rounded-2xl overflow-hidden border border-[#DDE9E8] bg-white shadow-xl group cursor-pointer flex flex-col justify-end p-3.5"
        >
          {/* Video Thumbnail Background Image */}
          <img 
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80" 
            alt="Roomhy Video Guide" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102A43]/80 via-[#102A43]/20 to-transparent" />

          {/* Centered Play Button */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="w-13 h-13 rounded-full bg-[#0FA89C] text-white flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0D9388]">
              <PlayCircle className="w-7 h-7 fill-white text-[#0FA89C]" />
            </div>
          </div>

          {/* Video Title Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0FA89C] animate-pulse" /> Official Video Guide
            </span>
            <span className="text-xs font-bold text-white">0:60</span>
          </div>
        </div>
      </div>
    </DesktopSection>
  );
}

function DesktopTrending({ properties }) {
  const scrollRef = React.useRef(null);
  const [cardImgIdx2, setCardImgIdx2] = React.useState({});

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
    { _id: "1", name: "ABC Residence", location: "Vigyan Nagar, Kota", rent: 2000, rating: 4.6, reviews: 120, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=70", images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=70","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=70","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=70"] },
    { _id: "2", name: "HL Residency", location: "Landmark City, Kota", rent: 2500, rating: 4.5, reviews: 98, image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=70", images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=70","https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&q=70","https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=70"] },
    { _id: "3", name: "Sunshine PG", location: "Talwandi, Kota", rent: 2500, rating: 4.3, reviews: 76, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=70", images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=70","https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=70","https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=70"] },
    { _id: "4", name: "Cozy Stay Boys PG", location: "Mahaveer Nagar, Kota", rent: 2500, rating: 4.6, reviews: 110, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=70", images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=70","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=70","https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=70"] },
    { _id: "5", name: "Green View Hostel", location: "Indra Vihar, Kota", rent: 2300, rating: 4.4, reviews: 95, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=70", images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=70","https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&q=70","https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=70"] },
    { _id: "6", name: "Royal Heights PG", location: "Vijay Nagar, Indore", rent: 3200, rating: 4.8, reviews: 140, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=70", images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=70","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=70","https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&q=70"] },
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
          className="absolute -left-6 md:-left-8 lg:-left-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white text-[#102A43] hover:text-[#0FA89C] border border-[#DDE9E8] flex items-center justify-center transition-all hover:scale-110 cursor-pointer shadow-md"
          title="Scroll Left"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Floating Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-6 md:-right-8 lg:-right-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white text-[#102A43] hover:text-[#0FA89C] border border-[#DDE9E8] flex items-center justify-center transition-all hover:scale-110 cursor-pointer shadow-md"
          title="Scroll Right"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>

        <div
          ref={scrollRef}
          className="flex items-center gap-4 overflow-x-auto scroll-smooth scrollbar-hide py-2 px-1"
        >
          {displayList.map((c) => {
            const propImgs = c.images && c.images.length > 0 ? c.images : [c.image];
            const imgIdx = cardImgIdx2[c._id || c.id] || 0;
            const totalImgs = propImgs.length;
            return (
              <Link key={c._id || c.id} to={`/website/propertydetails/${c._id || c.id}`} className="w-[240px] shrink-0 group text-left cursor-pointer">
                {/* TOP IMAGE CONTAINER */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 mb-2 border border-[#DDE9E8]">
                  <img src={propImgs[imgIdx]} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full ${BRAND_BG} px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs`}>
                    <BadgeCheck className="h-3 w-3" /> Verified
                  </span>
                  {/* Left arrow */}
                  {totalImgs > 1 && (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCardImgIdx2(prev => ({ ...prev, [c._id || c.id]: (imgIdx - 1 + totalImgs) % totalImgs })); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10">
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {/* Right arrow */}
                  {totalImgs > 1 && (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCardImgIdx2(prev => ({ ...prev, [c._id || c.id]: (imgIdx + 1) % totalImgs })); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {/* Dots */}
                  {totalImgs > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {propImgs.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />)}
                    </div>
                  )}
                </div>

                {/* BOTTOM DETAILS CONTAINER */}
                <div className="space-y-1 px-0.5">
                  <h3 className="truncate font-display text-sm font-extrabold text-[#102A43] group-hover:text-[#0FA89C] transition-colors leading-tight">
                    {c.name}
                  </h3>
                  <p className="truncate text-xs text-[#60758A] font-medium">
                    {c.location || c.city || 'Kota'}
                  </p>

                  {/* Dynamic Rating & Reviews Line */}
                  {(() => {
                    const ratingVal = Number(c.rating || c.averageRating || 0);
                    const reviewCount = Number(c.reviews || c.reviewCount || 0);
                    const ratingFormatted = ratingVal > 0 ? (ratingVal % 1 === 0 ? ratingVal.toFixed(0) : ratingVal.toFixed(1)) : '0';
                    const ratingTag = ratingVal >= 4.5 ? '• Excellent' : ratingVal >= 4.0 ? '• Very Good' : ratingVal > 0 ? '• Good' : '';

                    return (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className={`inline-flex items-center gap-0.5 rounded-md ${ratingVal > 0 ? 'bg-[#0FA89C]' : 'bg-slate-400'} px-1.5 py-0.5 text-[11px] font-extrabold text-white`}>
                          {ratingFormatted} <Star className="h-2.5 w-2.5 fill-white text-white" />
                        </span>
                        <span className="text-[11px] text-[#60758A] font-semibold truncate">
                          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}) {ratingTag}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Dynamic Price Line */}
                  {(() => {
                    const currentRent = Number(c.price ? String(c.price).replace(/[^0-9]/g, '') : c.rent || 0);
                    const origPrice = c.originalPrice || c.mrp || null;
                    const discountVal = c.discount || (origPrice && origPrice > currentRent ? `${Math.round(((origPrice - currentRent) / origPrice) * 100)}% off` : null);

                    return (
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-base font-extrabold text-[#102A43]">
                          ₹{currentRent.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-[#60758A] font-medium">/mo</span>
                        {origPrice && origPrice > currentRent && (
                          <span className="text-xs text-slate-400 line-through font-medium">
                            ₹{Number(origPrice).toLocaleString('en-IN')}
                          </span>
                        )}
                        {discountVal && (
                          <span className="text-xs font-extrabold text-[#0FA89C]">
                            {discountVal}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </Link>
            );
          })}
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
    <section className="bg-[#F3FBFA] py-6 md:py-8 border-y border-[#DDE9E8]">
      <div className="mx-auto max-w-[1360px] px-4 md:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-[#102A43] md:text-3xl">Browse by Cities</h2>
            <p className="mt-1 text-sm text-[#60758A] font-medium">Explore properties in India's most popular student cities.</p>
          </div>
          <Link to="/cities" className={`shrink-0 text-sm font-semibold ${BRAND}`}>View all cities →</Link>
        </div>
        <div className="mt-5 grid grid-cols-6 gap-3">
          {cities.map((c) => (
            <Link to={`/properties-in-${c.n.toLowerCase()}`} key={c.n} className="group overflow-hidden rounded-2xl border border-[#DDE9E8] bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative aspect-[5/4] overflow-hidden">
                <img src={c.img} alt={c.n} className="h-full w-full object-cover transition group-hover:scale-105" />
              </div>
              <div className="p-3">
                <p className="font-display text-sm font-bold text-[#102A43]">{c.n}</p>
                <p className="text-[11px] text-[#60758A] font-medium">{c.c} Properties</p>
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

  const slugify = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <DesktopSection title="Popular Areas" sub="Find stays in the most preferred localities across top cities." right={<Link to="/localities" className={`text-sm font-semibold ${BRAND}`}>View all localities →</Link>}>
      <div className="grid grid-cols-6 gap-4">
        {data.map((c) => (
          <div key={c.city} className="flex flex-col justify-between rounded-2xl border border-[#DDE9E8] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-[#0FA89C] shrink-0" />
                <h3 className="font-display text-sm font-bold text-[#102A43]">{c.city}</h3>
              </div>
              <ul className="space-y-2 text-xs font-medium text-[#60758A]">
                {c.areas.map((area) => (
                  <li key={area}>
                    <Link to={`/properties-in-${slugify(area)}-${slugify(c.city)}`} className="hover:text-[#0FA89C] cursor-pointer transition-colors block">
                      {area}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <Link to={`/properties-in-${c.city.toLowerCase()}`} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0FA89C] hover:underline">
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
    { icon: ShieldCheck, t: "Smart Bidding", d: "Bid your budget and get instant verified deals.", c: "bg-[#F3FBFA] text-[#0FA89C] border border-[#DDE9E8]" },
    { icon: BadgeCheck, t: "Verified Properties", d: "Every listing is verified by our team for your safety.", c: "bg-[#F3FBFA] text-[#0FA89C] border border-[#DDE9E8]" },
    { icon: Wallet, t: "Best Price Guarantee", d: "Find the best prices compared to other platforms.", c: "bg-[#F3FBFA] text-[#0FA89C] border border-[#DDE9E8]" },
    { icon: Sofa, t: "Fully Furnished", d: "Move in with just your suitcase. All essentials included.", c: "bg-[#F3FBFA] text-[#0FA89C] border border-[#DDE9E8]" },
    { icon: Headphones, t: "24/7 Support", d: "Our support team is always here to help you anytime.", c: "bg-[#F3FBFA] text-[#0FA89C] border border-[#DDE9E8]" },
    { icon: CalendarCheck, t: "Flexible Booking", d: "Book for any duration – short term or long term.", c: "bg-[#F3FBFA] text-[#0FA89C] border border-[#DDE9E8]" },
    { icon: Lock, t: "Secure & Safe", d: "Verified owners, safe localities and secure living.", c: "bg-[#F3FBFA] text-[#0FA89C] border border-[#DDE9E8]" },
    { icon: Tag, t: "Lowest Price", d: "Get the most affordable stays in top locations.", c: "bg-[#F3FBFA] text-[#0FA89C] border border-[#DDE9E8]" },
  ];

  return (
    <DesktopSection title="Why Choose Roomhy?" sub="Built by students, for students. Here's why thousands trust us.">
      <div className="grid grid-cols-8 gap-3">
        {items.map(({ icon: I, t, d, c }) => (
          <div key={t} className="flex flex-col items-center text-center rounded-2xl border border-[#DDE9E8] bg-white p-3.5 transition-all hover:shadow-md hover:-translate-y-1">
            <div className={`grid h-11 w-11 place-items-center rounded-full ${c} mb-2.5`}>
              <I className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xs font-bold text-[#102A43] leading-snug">{t}</h3>
            <p className="mt-1 text-[10px] leading-tight text-[#60758A]">{d}</p>
          </div>
        ))}
      </div>
    </DesktopSection>
  );
}

function DesktopLifeAtRoomhy() {
  const items = [
    { icon: Utensils, title: "Homemade Food", desc: "Healthy & tasty meals with veg & non-veg options.", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80", badgeBg: "bg-[#0FA89C] text-white" },
    { icon: Wifi, title: "High Speed WiFi", desc: "Unlimited high speed internet for study, entertainment & work.", img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80", badgeBg: "bg-[#0FA89C] text-white" },
    { icon: Sparkles, title: "Daily Housekeeping", desc: "Clean rooms & common areas for a hassle-free stay.", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80", badgeBg: "bg-[#0FA89C] text-white" },
    { icon: Bed, title: "Fully Furnished", desc: "Bed, study table, wardrobe & more. Just move in!", img: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80", badgeBg: "bg-[#0FA89C] text-white" }
  ];

  return (
    <DesktopSection title="Life at Roomhy" sub="More than just a stay – It's a complete experience.">
      <div className="grid grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.title} className="group overflow-hidden rounded-2xl border border-[#DDE9E8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="relative h-40 overflow-hidden">
              <img src={item.img} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="relative p-4 pt-5">
              <div className={`absolute -top-5 left-4 flex h-9 w-9 items-center justify-center rounded-xl shadow-md ${item.badgeBg}`}>
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-display text-sm font-bold text-[#102A43]">{item.title}</h3>
              <p className="mt-1 text-xs text-[#60758A] leading-snug">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl bg-[#F3FBFA] p-8 flex items-center justify-between gap-6 border border-[#DDE9E8] shadow-sm">
        <div>
          <h3 className="font-display text-2xl font-extrabold text-[#102A43] md:text-3xl">
            Your comfort is our priority.
          </h3>
          <p className="mt-2 text-sm font-medium text-[#60758A] max-w-md">
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
  const [cardImgIdx, setCardImgIdx] = React.useState({});
  const cards = [
    { title: "PG (Paying Guest)", icon: Bed, color: "bg-[#0FA89C] text-white", bgCard: "bg-white border-[#DDE9E8]", bullets: ["Best for students", "Affordable", "Meals included", "Monthly stay"], images: ["https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=500&q=80","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=80","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=80"], type: "pg" },
    { title: "Hostels", icon: Building2, color: "bg-[#0FA89C] text-white", bgCard: "bg-white border-[#DDE9E8]", bullets: ["Best for students", "Budget friendly", "Shared facilities", "Daily / Monthly"], images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=80","https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=500&q=80","https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&q=80"], type: "hostel" },
    { title: "Co-living", icon: Sofa, color: "bg-[#0FA89C] text-white", bgCard: "bg-white border-[#DDE9E8]", bullets: ["Best for professionals", "Flexible stay", "Community living", "Fully furnished"], images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80","https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80","https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=80"], type: "co-living" },
    { title: "Apartments", icon: Home, color: "bg-[#0FA89C] text-white", bgCard: "bg-white border-[#DDE9E8]", bullets: ["Best for families/pros", "Private & shared", "Long term stay", "Independent living"], images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=80","https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&q=80","https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=500&q=80"], type: "apartment" }
  ];

  return (
    <DesktopSection title="Find Your Perfect Stay" sub="Different needs, perfect spaces.">
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => {
          const idx = cardImgIdx[c.type] || 0;
          const total = c.images.length;
          return (
            <Link key={c.title} to={c.type === 'pg' ? '/pg' : c.type === 'hostel' ? '/hostels' : c.type === 'co-living' ? '/co-living' : c.type === 'apartment' ? '/apartments' : `/website/ourproperty?type=${c.type}`} className={`flex flex-col justify-between rounded-3xl border ${c.bgCard} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md group`}>
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${c.color}`}>
                    <c.icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-base font-bold text-[#102A43]">{c.title}</h3>
                </div>
                <ul className="space-y-2 mb-6">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs font-semibold text-[#60758A]">
                      <Check className="h-3.5 w-3.5 text-[#0FA89C] shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Image with carousel */}
              <div className="relative h-32 w-full overflow-hidden rounded-2xl mt-2 border border-[#DDE9E8]">
                <img src={c.images[idx]} alt={c.title} className="h-full w-full object-cover transition-all duration-300" />
                {/* Left arrow */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCardImgIdx(prev => ({ ...prev, [c.type]: (idx - 1 + total) % total })); }}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                {/* Right arrow */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCardImgIdx(prev => ({ ...prev, [c.type]: (idx + 1) % total })); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {c.images.map((_, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </DesktopSection>
  );
}

function DesktopZeroBrokerageSavings() {
  return (
    <section className="mx-auto max-w-[1360px] px-4 md:px-6 lg:px-8 py-5 md:py-6">
      <div className="w-full rounded-3xl bg-[#F3FBFA] py-6 lg:py-7 pl-4 lg:pl-6 pr-6 lg:pr-8 border border-[#DDE9E8] shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-12 gap-8 items-center">
          <div className="col-span-4 space-y-4">
            <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-[#102A43] leading-tight">
              Smart Bidding.<br />
              <span className="text-[#0FA89C]">100% Savings.</span>
            </h2>
            <p className="text-xs lg:text-sm text-[#60758A] font-medium leading-relaxed">
              Connect directly with verified property owners and save thousands on brokerage.
            </p>
            <ul className="space-y-2 pt-1">
              {["No Hidden Charges", "Direct Owner Contact", "Transparent Pricing"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs font-bold text-[#102A43]">
                  <div className="h-4 w-4 rounded-full bg-[#0FA89C] text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-6 flex items-center justify-center gap-3 relative">
            <div className="w-1/2 rounded-2xl bg-white p-4 shadow-sm border border-[#DDE9E8] text-center space-y-3">
              <span className="inline-block rounded-lg bg-[#60758A] px-3 py-1 text-xs font-bold text-white shadow-sm">
                Traditional Way
              </span>
              <ul className="space-y-2 text-xs font-medium text-[#60758A] pt-1">
                <li className="flex items-center justify-center gap-1.5 text-[#60758A] font-semibold">
                  <span className="text-[#60758A] font-extrabold">✕</span> Pay Brokerage
                </li>
                <li className="flex items-center justify-center gap-1.5 text-[#60758A]">
                  <span className="text-[#60758A] font-extrabold">✕</span> Extra Charges
                </li>
                <li className="flex items-center justify-center gap-1.5 text-[#60758A]">
                  <span className="text-[#60758A] font-extrabold">✕</span> Multiple Calls
                </li>
                <li className="flex items-center justify-center gap-1.5 text-[#60758A]">
                  <span className="text-[#60758A] font-extrabold">✕</span> Time Consuming
                </li>
                <li className="flex items-center justify-center gap-1.5 text-[#60758A]">
                  <span className="text-[#60758A] font-extrabold">✕</span> Expensive
                </li>
              </ul>
            </div>

            <div className="z-10 h-9 w-9 rounded-full bg-[#0FA89C] text-white flex items-center justify-center font-extrabold text-xs shadow-md shrink-0">
              VS
            </div>

            <div className="w-1/2 rounded-2xl bg-white p-4 shadow-sm border border-[#DDE9E8] text-center space-y-3 relative ring-2 ring-[#0FA89C]/20">
              <span className="inline-block rounded-lg bg-[#0FA89C] px-3 py-1 text-xs font-bold text-white shadow-sm">
                With Roomhy
              </span>
              <ul className="space-y-2 text-xs font-medium text-[#102A43] pt-1">
                <li className="flex items-center justify-center gap-1.5 text-[#0FA89C] font-bold">
                  <Check className="h-3.5 w-3.5 text-[#0FA89C] stroke-[3]" /> Smart Bidding
                </li>
                <li className="flex items-center justify-center gap-1.5 text-[#102A43] font-semibold">
                  <Check className="h-3.5 w-3.5 text-[#0FA89C] stroke-[3]" /> No Hidden Charges
                </li>
                <li className="flex items-center justify-center gap-1.5 text-[#102A43] font-semibold">
                  <Check className="h-3.5 w-3.5 text-[#0FA89C] stroke-[3]" /> Direct Owner
                </li>
                <li className="flex items-center justify-center gap-1.5 text-[#102A43] font-semibold">
                  <Check className="h-3.5 w-3.5 text-[#0FA89C] stroke-[3]" /> Quick & Easy
                </li>
                <li className="flex items-center justify-center gap-1.5 text-[#102A43] font-semibold">
                  <Check className="h-3.5 w-3.5 text-[#0FA89C] stroke-[3]" /> Best Prices
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
  const row1 = [
    { n: "Aman Gupta", r: "Coaching Student, Jaipur", q: "Super smooth experience. Booked my room online without any agent hassle.", a: "https://i.pravatar.cc/80?img=33" },
    { n: "Rahul Sharma", r: "IIT JEE Student, Kota", q: "Roomhy made finding my hostel so easy! Smart bidding and no hidden charges. Highly recommended!", a: "https://i.pravatar.cc/80?img=12" },
    { n: "Priya Patel", r: "NEET Student, Sikar", q: "Great platform! I found a safe PG near my college within a day. The owner was very cooperative.", a: "https://i.pravatar.cc/80?img=47" },
    { n: "Vikram Singh", r: "Allen Student, Kota", q: "Verified properties and direct owner contact saved me both money and time.", a: "https://i.pravatar.cc/80?img=68" }
  ];

  const row2 = [
    { n: "Anjali Mehta", r: "IT Professional, Indore", q: "Love the variety of options. Co-living spaces are amazing and budget friendly.", a: "https://i.pravatar.cc/80?img=32" },
    { n: "Karan Verma", r: "Student, Delhi University", q: "Extremely easy to search and compare PGs. Got an instant discount through bidding!", a: "https://i.pravatar.cc/80?img=59" },
    { n: "Sneha Reddy", r: "Medical Student, Hyderabad", q: "Best app for student stays. Verified owners and smooth digital check-in process.", a: "https://i.pravatar.cc/80?img=44" },
    { n: "Rohan Kapoor", r: "Engineering Student, Pune", q: "Saved ₹12,000 on annual rent using Smart Bidding. Couldn't be happier!", a: "https://i.pravatar.cc/80?img=15" }
  ];

  const duplicatedRow1 = [...row1, ...row1, ...row1];
  const duplicatedRow2 = [...row2, ...row2, ...row2];

  return (
    <DesktopSection title="What Students Say" sub="Trusted by 50,000+ students across India">
      {/* Container with Edge-to-Edge Full Bleed & Gradient Fade Edges */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden py-2 space-y-3.5 before:absolute before:inset-y-0 before:left-0 before:w-28 before:bg-gradient-to-r before:from-white before:to-transparent before:z-10 before:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-28 after:bg-gradient-to-l after:from-white after:to-transparent after:z-10 after:pointer-events-none">
        
        {/* ROW 1: Scrolls Left */}
        <div className="flex gap-4 animate-scroll-left w-max">
          {duplicatedRow1.map((t, idx) => (
            <div key={idx} className="w-80 h-[155px] shrink-0 rounded-2xl border border-[#DDE9E8] bg-white p-4 shadow-2xs hover:shadow-md transition-shadow text-left flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <img src={t.a} alt={t.n} className="h-10 w-10 rounded-full object-cover border border-[#DDE9E8] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#102A43] truncate">{t.n}</p>
                    <p className="text-[11px] text-[#60758A] font-semibold truncate">{t.r}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 pt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#0FA89C] text-[#0FA89C]" />
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-[#60758A] font-medium line-clamp-3">"{t.q}"</p>
              </div>
            </div>
          ))}
        </div>

        {/* ROW 2: Scrolls Right (Opposite Direction) */}
        <div className="flex gap-4 animate-scroll-right w-max">
          {duplicatedRow2.map((t, idx) => (
            <div key={idx} className="w-80 h-[155px] shrink-0 rounded-2xl border border-[#DDE9E8] bg-white p-4 shadow-2xs hover:shadow-md transition-shadow text-left flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <img src={t.a} alt={t.n} className="h-10 w-10 rounded-full object-cover border border-[#DDE9E8] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#102A43] truncate">{t.n}</p>
                    <p className="text-[11px] text-[#60758A] font-semibold truncate">{t.r}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 pt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#0FA89C] text-[#0FA89C]" />
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-[#60758A] font-medium line-clamp-3">"{t.q}"</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 32s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 32s linear infinite;
        }
        .animate-scroll-left:hover, .animate-scroll-right:hover {
          animation-play-state: paused;
        }
      `}</style>
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
    <DesktopSection title="Latest from Our Blog" sub="" right={<Link to="/faq" className="text-xs font-bold text-[#0FA89C] hover:underline">View all blogs →</Link>}>
      <div className="grid grid-cols-4 gap-4">
        {blogs.map((b) => (
          <div key={b.title} className="group overflow-hidden rounded-2xl border border-[#DDE9E8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer">
            <div className="relative h-44 overflow-hidden">
              <img src={b.img} alt={b.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute top-3 left-3 rounded-md bg-[#F7FAFA] border border-[#DDE9E8] px-2 py-1 text-[10px] font-extrabold tracking-wider text-[#102A43] shadow-sm backdrop-blur">
                {b.tag}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-display text-xs font-bold text-[#102A43] group-hover:text-[#0FA89C] transition-colors leading-snug">
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
            <div key={f.q} className="rounded-xl bg-[#F7FAFA] p-4 text-left transition hover:bg-[#F3FBFA] border border-[#DDE9E8]">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex items-center justify-between gap-3 w-full text-left font-semibold text-xs text-[#102A43]"
              >
                <span>{f.q}</span>
                {isOpen ? <Minus className={`h-4 w-4 shrink-0 ${BRAND}`} /> : <Plus className={`h-4 w-4 shrink-0 ${BRAND}`} />}
              </button>
              {isOpen && <p className="mt-2 text-xs leading-relaxed text-[#60758A] font-medium">{f.a}</p>}
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
            rating: p.rating ?? p.averageRating ?? 0,
            reviews: p.reviewsCount ?? p.reviews ?? 0,
            verified: p.verified ?? true,
            image: p.featuredImage || p.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=70',
            originalPrice: p.originalPrice || p.mrp || null,
            discount: p.discount || (p.originalPrice && p.originalPrice > (p.monthlyRent || p.rent) ? `${Math.round(((p.originalPrice - (p.monthlyRent || p.rent)) / p.originalPrice) * 100)}% off` : null)
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
    const query = searchQuery.trim();
    
    // Try to detect city and area from query text
    const knownCities = ['kota', 'sikar', 'indore', 'jaipur', 'delhi', 'mumbai', 'pune', 'bangalore', 'bengaluru', 'hyderabad', 'bhopal', 'nagpur', 'lucknow', 'chandigarh', 'noida', 'gurugram'];
    const lowerQ = query.toLowerCase();
    const matchedCity = knownCities.find(c => lowerQ === c || lowerQ.includes(c));

    // If simple city search with no extra filters
    if (matchedCity && !selectedGender && !selectedBudget && (!query || lowerQ.trim() === matchedCity)) {
      const typePrefix = selectedTabType || selectedType ? `${(selectedTabType || selectedType).toLowerCase()}-in-` : 'properties-in-';
      navigate(`/${typePrefix}${matchedCity}`);
      return;
    }

    const params = new URLSearchParams();
    if (query) {
      if (matchedCity) {
        const cityFormatted = matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1);
        params.append('city', cityFormatted);
        const areaText = lowerQ.replace(matchedCity, '').replace(/,/g, '').trim();
        if (areaText) params.append('area', areaText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      } else {
        params.append('search', query);
      }
    }
    
    if (selectedTabType || selectedType) params.append('type', selectedTabType || selectedType);
    if (selectedGender) params.append('gender', selectedGender);
    if (selectedBudget) params.append('maxPrice', selectedBudget);

    const queryString = params.toString();
    navigate(queryString ? `/properties?${queryString}` : '/properties');
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
          setSelectedBudget={setSelectedBudget}
          handleSearchSubmit={handleSearchSubmit}
          properties={properties}
        />
        <DesktopWhatWeOffer />
        <DesktopHowItWorks onOpenVideoModal={() => setVideoModalOpen(true)} />
        <DesktopTrending properties={properties} />
        <DesktopCities />
        <DesktopWhyChoose />
        <DesktopZeroBrokerageSavings />
        <DesktopTestimonials />
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
                        <span>{prop.rating ? (typeof prop.rating === 'number' ? prop.rating.toFixed(1) : prop.rating) : '0'}</span>
                        <span className="text-gray-400 font-normal">({prop.reviews || 0})</span>
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
                        <span>{prop.rating ? (typeof prop.rating === 'number' ? prop.rating.toFixed(1) : prop.rating) : '0'}</span>
                        <span className="text-gray-400 font-normal">({prop.reviews || 0})</span>
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
