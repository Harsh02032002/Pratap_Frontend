import React from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, BadgeCheck, Bed, Star, Facebook, Instagram, Linkedin, Twitter, 
  Youtube, Phone, Mail, Building2, Home, Users, Link2, Search, Heart, MessageSquare, Zap
} from "lucide-react";

function Logo() {
  return (
    <Link to="/" className="inline-flex items-center justify-center md:justify-start">
      <img 
        src="/website/roomhy_logo.jpeg" 
        alt="Roomhy Logo" 
        className="h-8 md:h-10 max-h-10 w-auto object-contain"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/website/roomhy_logo.jpeg';
        }}
      />
    </Link>
  );
}

export default function WebsiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#f9fbfb] text-slate-700 font-sans relative pb-16 md:pb-0">

      {/* ========================================================================= */}
      {/* MOBILE FOOTER (With Exact Navbar Image Logo)                              */}
      {/* ========================================================================= */}
      <div className="md:hidden px-4 py-6 text-center space-y-4 bg-white border-t border-gray-100">
        {/* Logo */}
        <Logo />

        {/* Subtitle */}
        <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-tight font-medium">
          Find student housing smarter, simpler, and broker-free with Roomhy.
        </p>

        {/* Contact Info */}
        <p className="text-xs font-semibold text-gray-700">
          Help & Support • <a href="mailto:team@roomhy.com" className="text-teal-600 font-bold">team@roomhy.com</a>
        </p>

        {/* Social Icons Row (5 colored circular buttons) */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <a href="#" aria-label="Facebook" className="h-8 w-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-sm">
            <Facebook className="h-4 w-4 fill-white" />
          </a>
          <a href="#" aria-label="Twitter" className="h-8 w-8 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center shadow-sm">
            <Twitter className="h-4 w-4 fill-white" />
          </a>
          <a href="#" aria-label="Instagram" className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
            <Instagram className="h-4 w-4" />
          </a>
          <a href="#" aria-label="LinkedIn" className="h-8 w-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-sm">
            <Linkedin className="h-4 w-4 fill-white" />
          </a>
          <a href="#" aria-label="YouTube" className="h-8 w-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-sm">
            <Youtube className="h-4 w-4 fill-white" />
          </a>
        </div>

        {/* Address & Registration Block */}
        <div className="text-[10px] text-gray-400 space-y-0.5 pt-2 max-w-xs mx-auto leading-relaxed border-t border-gray-100">
          <p className="font-bold text-gray-700">ROOMHY TECHNOLOGY</p>
          <p>647, Balaji Nagar Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India</p>
          <p className="font-semibold text-gray-600">+918764425030</p>
          <p>GSTIN: 08SLWPS2629Q1ZZ</p>
        </div>

        {/* Link Columns Grid (4 columns) */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100 text-left text-[10px]">
          <div>
            <h4 className="font-bold text-gray-900 mb-1.5">Company</h4>
            <ul className="space-y-1 text-gray-500 font-medium">
              <li><Link to="/about-us">About Roomhy</Link></li>
              <li><Link to="/contact-us">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1.5">Explore</h4>
            <ul className="space-y-1 text-gray-500 font-medium">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/website/ourproperty">Our Properties</Link></li>
              <li><Link to="/website/fast-bidding">Fast Bidding</Link></li>
              <li><Link to="/list-property">Post Property</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1.5">Support</h4>
            <ul className="space-y-1 text-gray-500 font-medium">
              <li><Link to="/website/mystays">My Stays</Link></li>
              <li><Link to="/contact-us">Refund Request</Link></li>
              <li><Link to="/contact-us">Cancellation</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1.5">Legal</h4>
            <ul className="space-y-1 text-gray-500 font-medium">
              <li><Link to="/faq">Terms & Conditions</Link></li>
              <li><Link to="/faq">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Top Cities & Areas Pills */}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[11px] font-bold text-gray-800 mb-2">Top Cities & Areas</p>
          <div className="flex flex-wrap justify-center gap-1.5 text-[10px]">
            <Link to="/website/ourproperty?city=kota" className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-700 border border-gray-200 font-semibold">
              Kota (2,500+)
            </Link>
            <Link to="/website/ourproperty?city=sikar" className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-700 border border-gray-200 font-semibold">
              Sikar (850+)
            </Link>
            <Link to="/website/ourproperty?city=indore" className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-700 border border-gray-200 font-semibold">
              Indore (1,800+)
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Buttons for Mobile (Bottom Right: Chat + BidNow) */}
      <div className="md:hidden fixed bottom-16 right-4 z-40 flex flex-col items-end gap-2">
        <a
          href="https://wa.me/918764425030"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 bg-[#00BFA5] text-white px-3.5 py-2 rounded-full shadow-lg font-bold text-xs hover:scale-105 transition-transform"
        >
          <MessageSquare className="w-4 h-4 fill-white" />
          <span>Chat</span>
        </a>
        <Link
          to="/website/fast-bidding"
          className="flex items-center gap-1.5 bg-[#FF6B35] text-white px-4 py-2.5 rounded-full shadow-xl font-extrabold text-xs hover:scale-105 transition-transform"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>BidNow</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP FOOTER                                                            */}
      {/* ========================================================================= */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">

            {/* Column 1: Logo & Info */}
            <div className="space-y-4">
              <Logo />
              <p className="text-xs leading-relaxed text-slate-600 font-medium">
                India's zero brokerage platform for PGs, Hostels, Co-living Spaces & Student Apartments.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Zero Brokerage</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Verified Properties</span>
                </li>
                <li className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>50,000+ Beds</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Trusted by Students</span>
                </li>
              </ul>
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-600 mb-2">Follow us on</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <a href="#" aria-label="Facebook" className="h-7 w-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center transition-transform hover:scale-110">
                    <Facebook className="h-3.5 w-3.5 fill-white" />
                  </a>
                  <a href="#" aria-label="Instagram" className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center transition-transform hover:scale-110">
                    <Instagram className="h-3.5 w-3.5" />
                  </a>
                  <a href="#" aria-label="LinkedIn" className="h-7 w-7 rounded-full bg-[#0A66C2] text-white flex items-center justify-center transition-transform hover:scale-110">
                    <Linkedin className="h-3.5 w-3.5 fill-white" />
                  </a>
                  <a href="#" aria-label="Twitter" className="h-7 w-7 rounded-full bg-black text-white flex items-center justify-center transition-transform hover:scale-110">
                    <Twitter className="h-3.5 w-3.5 fill-white" />
                  </a>
                  <a href="#" aria-label="YouTube" className="h-7 w-7 rounded-full bg-[#FF0000] text-white flex items-center justify-center transition-transform hover:scale-110">
                    <Youtube className="h-3.5 w-3.5 fill-white" />
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2: POPULAR CITIES */}
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-emerald-600 font-bold text-xs tracking-wider uppercase">
                <Building2 className="h-4 w-4" />
                <span>POPULAR CITIES</span>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                {[
                  { label: "PG in Kota", city: "kota" },
                  { label: "PG in Jaipur", city: "jaipur" },
                  { label: "PG in Delhi", city: "delhi" },
                  { label: "PG in Indore", city: "indore" },
                  { label: "PG in Sikar", city: "sikar" },
                  { label: "PG in Bhopal", city: "bhopal" }
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={`/website/ourproperty?city=${item.city}`} className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                      <span className="text-slate-400">&gt;</span> {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/website/ourproperty" className="inline-block mt-3 text-xs font-bold text-emerald-600 hover:underline">
                View all cities →
              </Link>
            </div>

            {/* Column 3: PROPERTY TYPES */}
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-purple-600 font-bold text-xs tracking-wider uppercase">
                <Home className="h-4 w-4" />
                <span>PROPERTY TYPES</span>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                {[
                  { label: "PG for Boys", type: "pg" },
                  { label: "PG for Girls", type: "pg" },
                  { label: "Co-ed PG", type: "pg" },
                  { label: "Hostels", type: "hostel" },
                  { label: "Boys Hostels", type: "hostel" },
                  { label: "Girls Hostels", type: "hostel" },
                  { label: "Co-living", type: "co-living" },
                  { label: "Apartments", type: "apartment" }
                ].map((item, idx) => (
                  <li key={idx}>
                    <Link to={`/website/ourproperty?type=${item.type}`} className="hover:text-purple-600 transition-colors flex items-center gap-1">
                      <span className="text-slate-400">&gt;</span> {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/website/ourproperty" className="inline-block mt-3 text-xs font-bold text-purple-600 hover:underline">
                View all properties →
              </Link>
            </div>

            {/* Column 4: HOSTELS */}
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-amber-600 font-bold text-xs tracking-wider uppercase">
                <Building2 className="h-4 w-4" />
                <span>HOSTELS</span>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                {["Hostels for Boys", "Hostels for Girls", "Co-ed Hostels"].map((item) => (
                  <li key={item}>
                    <Link to="/website/ourproperty?type=hostel" className="hover:text-amber-600 transition-colors flex items-center gap-1">
                      <span className="text-slate-400">&gt;</span> {item}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/website/ourproperty?type=hostel" className="inline-block mt-3 text-xs font-bold text-amber-600 hover:underline">
                View all hostels →
              </Link>
            </div>

            {/* Column 5: CO-LIVING */}
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-blue-600 font-bold text-xs tracking-wider uppercase">
                <Users className="h-4 w-4" />
                <span>CO-LIVING</span>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                {["Co-living for Boys", "Co-living for Girls", "Co-ed Co-living"].map((item) => (
                  <li key={item}>
                    <Link to="/website/ourproperty?type=co-living" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                      <span className="text-slate-400">&gt;</span> {item}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/website/ourproperty?type=co-living" className="inline-block mt-3 text-xs font-bold text-blue-600 hover:underline">
                View all co-living →
              </Link>
            </div>

            {/* Column 6: QUICK LINKS */}
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-teal-700 font-bold text-xs tracking-wider uppercase">
                <Link2 className="h-4 w-4" />
                <span>QUICK LINKS</span>
              </div>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                {[
                  { label: "List Your Property", href: "/list-property" },
                  { label: "Owner Dashboard", href: "/propertyowner/ownerlogin" },
                  { label: "Tenant Dashboard", href: "/website/profile" },
                  { label: "FAQ", href: "/faq" },
                  { label: "About Us", href: "/about-us" },
                  { label: "Contact Us", href: "/contact-us" },
                  { label: "Login / Register", href: "/login" }
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={item.href} className="hover:text-teal-700 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* POPULAR SEARCHES Section */}
          <div className="mt-8 rounded-2xl bg-[#edf7f4] p-4 border border-emerald-100/80">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 shrink-0">
                <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <span className="tracking-wide">POPULAR SEARCHES</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {[
                  "PG in Kota", "PG in Sikar", "PG in Indore", "PG in Jaipur", "PG in Delhi",
                  "Hostels in Kota", "Hostels in Sikar", "Hostels in Indore", "Co-living in Indore",
                  "Student Apartments", "Girls Hostel", "Boys Hostel", "Budget PG"
                ].map((pill) => (
                  <Link
                    key={pill}
                    to={`/website/ourproperty?search=${encodeURIComponent(pill)}`}
                    className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm border border-slate-100 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                  >
                    {pill}
                  </Link>
                ))}
              </div>
              <Link to="/website/ourproperty" className="text-xs font-bold text-emerald-600 shrink-0 hover:underline">
                View all searches →
              </Link>
            </div>
          </div>

          {/* TRUST HIGHLIGHTS BAR */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Zero Brokerage</p>
                <p className="text-[11px] text-slate-500">No hidden charges</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Verified Listings</p>
                <p className="text-[11px] text-slate-500">100% verified properties</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4">
              <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">50,000+ Students</p>
                <p className="text-[11px] text-slate-500">Trust us to find a home</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4">
              <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">10+ Cities</p>
                <p className="text-[11px] text-slate-500">Across India</p>
              </div>
            </div>
          </div>

        </div>

        {/* COPYRIGHT & CONTACT BAR */}
        <div className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs font-medium text-slate-600 md:flex-row lg:px-8">
            <p>© {new Date().getFullYear()} Roomhy Technology Pvt. Ltd. All rights reserved.</p>
            <div className="flex items-center gap-1 text-slate-600 font-semibold">
              Made with <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500 mx-0.5 inline" /> in India
            </div>
            <div className="flex items-center gap-4 text-slate-700 font-bold">
              <a href="mailto:team@roomhy.com" className="flex items-center gap-1.5 hover:text-emerald-600">
                <Mail className="h-3.5 w-3.5 text-slate-500" /> team@roomhy.com
              </a>
              <span className="text-slate-300">|</span>
              <a href="tel:+918764425030" className="flex items-center gap-1.5 text-emerald-600 hover:underline">
                <Phone className="h-3.5 w-3.5 text-emerald-600" /> +91 87644 25030
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
