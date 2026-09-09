import React from "react";
import { Link } from "react-router-dom";
import {
  Heart, MapPin, FileText, Facebook, Instagram, Linkedin, Search,
  CheckCircle2, ShieldCheck, Users, Star, Building2, ArrowRight,
  Bed, Layers, Phone, Mail
} from "lucide-react";

function Logo() {
  return (
    <Link to="/" className="inline-flex items-center">
      <img
        src="/website/roomhy_logo.jpeg"
        alt="Roomhy Logo"
        className="h-8 md:h-9 w-auto object-contain mix-blend-multiply"
        onError={(e) => { e.target.onerror = null; e.target.src = "/website/roomhy_logo.jpeg"; }}
      />
    </Link>
  );
}

const POPULAR_SEARCHES = [
  { label: "PG in Kota", link: "/pg/kota" },
  { label: "PG in Jaipur", link: "/pg/jaipur" },
  { label: "PG in Delhi", link: "/pg/delhi" },
  { label: "Hostels in Kota", link: "/hostels/kota" },
  { label: "Hostels in Jaipur", link: "/hostels/jaipur" },
  { label: "Hostels in Delhi", link: "/hostels/delhi" },
  { label: "Co-living in Bangalore", link: "/co-living/bangalore" },
  { label: "Co-living in Pune", link: "/co-living/pune" },
  { label: "Student Apartments", link: "/apartments" },
  { label: "Girls Hostel", link: "/hostels?gender=girls" },
  { label: "Boys Hostel", link: "/hostels?gender=boys" },
  { label: "Luxury PG", link: "/pg" },
  { label: "Budget PG", link: "/pg" },
];

const LinkItem = ({ to, children }) => (
  <li className="flex items-center gap-1">
    <span className="text-[#0FA89D] font-bold text-xs">›</span>
    <Link to={to} className="text-[#0B2341] hover:text-[#0FA89D] transition-colors">{children}</Link>
  </li>
);

export default function WebsiteFooter() {
  return (
    <footer className="font-sans relative pb-16 md:pb-0">

      {/* ── 1. CARDS STRIP ON WHITE PAGE BACKGROUND ── */}
      <div className="bg-[#F8FBFA] py-6 border-t border-slate-100">
        {/* POPULAR SEARCHES STRIP */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mb-4">
          <div className="rounded-2xl bg-white border border-slate-200/90 p-4 lg:p-5 flex flex-col md:flex-row items-start md:items-center gap-3 justify-between shadow-2xs">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#0FA89D] text-white flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-[#0B2341] uppercase tracking-wider">POPULAR SEARCHES</span>
            </div>

            <div className="flex flex-wrap gap-2 flex-1">
              {POPULAR_SEARCHES.map(item => (
                <Link
                  key={item.label}
                  to={item.link}
                  className="px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-[#0FA89D] hover:text-white text-[#0B2341] text-xs font-bold border border-slate-200/80 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <Link to="/properties" className="shrink-0 text-xs font-bold text-[#0FA89D] hover:text-[#0b837b] transition-colors flex items-center gap-1">
              View all searches &rarr;
            </Link>
          </div>
        </div>

        {/* TRUST BADGES SUMMARY CARD */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white border border-slate-200/90 p-4 lg:p-5 shadow-2xs grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0FA89D] border border-teal-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0B2341]">Smart Bidding</p>
                <p className="text-[11px] font-medium text-slate-500">Best price deals</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0FA89D] border border-teal-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0B2341]">Verified Listings</p>
                <p className="text-[11px] font-medium text-slate-500">100% verified properties</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0FA89D] border border-teal-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0B2341]">50,000+ Students</p>
                <p className="text-[11px] font-medium text-slate-500">Trust us to find a home</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0FA89D] border border-teal-100 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0B2341]">10+ Cities</p>
                <p className="text-[11px] font-medium text-slate-500">Across India</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN FOOTER SECTION (#F1F4F3) ───────────────────────── */}
      <div className="border-t border-[#E2E8E6] bg-[#F1F4F3] text-[#0B2341]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

            {/* LEFT COLUMN: Logo + Features + Social */}
            <div className="w-full lg:w-[230px] shrink-0 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-[#E2E8E6] pb-6 lg:pb-0 lg:pr-6">
              <div className="h-10 flex items-center border-b border-[#E2E8E6]">
                <Logo />
              </div>

              <p className="text-xs text-[#0B2341]/80 font-medium leading-relaxed">
                India's smart bidding platform for PGs, Hostels, Co-living Spaces &amp; Student Apartments.
              </p>

              {/* Feature Badges */}
              <div className="space-y-2 text-xs font-semibold text-[#0B2341]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0FA89D] shrink-0" />
                  <span>Smart Bidding</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0FA89D] shrink-0" />
                  <span>Verified Properties</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-[#0FA89D] shrink-0" />
                  <span>50,000+ Beds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                  <span>Trusted by Students</span>
                </div>
              </div>

              {/* Social */}
              <div className="pt-1">
                <p className="text-[10px] font-extrabold text-[#0B2341]/70 uppercase tracking-wider mb-2">Follow Us On</p>
                <div className="flex items-center gap-2.5">
                  <a href="https://www.facebook.com/profile.php?id=61587850180193" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                    className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs">
                    <Facebook className="w-3.5 h-3.5 fill-white" />
                  </a>
                  <a href="https://www.instagram.com/roomhy.com_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs">
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                  <a href="https://www.linkedin.com/company/roomhy-com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                    className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs">
                    <Linkedin className="w-3.5 h-3.5 fill-white" />
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT: 5 LINK COLUMNS */}
            <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">

              {/* 1. POPULAR CITIES */}
              <div className="space-y-3">
                <h3 className="h-10 flex items-center gap-1.5 text-xs font-black text-[#0B2341] uppercase tracking-wider border-b border-[#E2E8E6]">
                  <MapPin className="w-3.5 h-3.5 text-[#0FA89D] shrink-0" />
                  <span>Popular Cities</span>
                </h3>
                <ul className="space-y-2 text-xs font-semibold text-[#0B2341]">
                  <LinkItem to="/properties-in-kota">PG in Kota</LinkItem>
                  <LinkItem to="/properties-in-jaipur">PG in Jaipur</LinkItem>
                  <LinkItem to="/properties-in-delhi">PG in Delhi</LinkItem>
                  <LinkItem to="/properties-in-indore">PG in Indore</LinkItem>
                  <LinkItem to="/properties-in-bangalore">PG in Bangalore</LinkItem>
                  <LinkItem to="/properties-in-pune">PG in Pune</LinkItem>
                  <li className="pt-1">
                    <Link to="/cities" className="inline-flex items-center gap-1 text-[#0FA89D] font-bold hover:text-[#0b837b] transition-colors text-xs">
                      View all cities &rarr;
                    </Link>
                  </li>
                </ul>
              </div>

              {/* 2. PROPERTY TYPES */}
              <div className="space-y-3">
                <h3 className="h-10 flex items-center gap-1.5 text-xs font-black text-[#0B2341] uppercase tracking-wider border-b border-[#E2E8E6]">
                  <Building2 className="w-3.5 h-3.5 text-[#0FA89D] shrink-0" />
                  <span>Property Types</span>
                </h3>
                <ul className="space-y-2 text-xs font-semibold text-[#0B2341]">
                  <LinkItem to="/pg?gender=boys">PG for Boys</LinkItem>
                  <LinkItem to="/pg?gender=girls">PG for Girls</LinkItem>
                  <LinkItem to="/pg">Co-ed PG</LinkItem>
                  <LinkItem to="/hostels">Hostels</LinkItem>
                  <LinkItem to="/hostels?gender=boys">Boys Hostels</LinkItem>
                  <LinkItem to="/hostels?gender=girls">Girls Hostels</LinkItem>
                  <LinkItem to="/co-living">Co-living</LinkItem>
                  <LinkItem to="/apartments">Apartments</LinkItem>
                  <li className="pt-1">
                    <Link to="/properties" className="inline-flex items-center gap-1 text-[#0FA89D] font-bold hover:text-[#0b837b] transition-colors text-xs">
                      View all types &rarr;
                    </Link>
                  </li>
                </ul>
              </div>

              {/* 3. HOSTELS & CO-LIVING */}
              <div className="space-y-3">
                <h3 className="h-10 flex items-center gap-1.5 text-xs font-black text-[#0B2341] uppercase tracking-wider border-b border-[#E2E8E6]">
                  <Bed className="w-3.5 h-3.5 text-[#0FA89D] shrink-0" />
                  <span>Hostels</span>
                </h3>
                <ul className="space-y-2 text-xs font-semibold text-[#0B2341]">
                  <LinkItem to="/hostels?gender=boys">Hostels for Boys</LinkItem>
                  <LinkItem to="/hostels?gender=girls">Hostels for Girls</LinkItem>
                  <LinkItem to="/hostels">Co-ed Hostels</LinkItem>
                </ul>

                <div className="pt-2">
                  <h4 className="flex items-center gap-1.5 text-xs font-black text-[#0B2341] uppercase tracking-wider border-b border-[#E2E8E6] pb-1.5 mb-2">
                    <Layers className="w-3.5 h-3.5 text-[#0FA89D] shrink-0" />
                    <span>Co-Living</span>
                  </h4>
                  <ul className="space-y-2 text-xs font-semibold text-[#0B2341]">
                    <LinkItem to="/co-living?gender=boys">Co-living for Boys</LinkItem>
                    <LinkItem to="/co-living?gender=girls">Co-living for Girls</LinkItem>
                    <LinkItem to="/co-living">Co-ed Co-living</LinkItem>
                  </ul>
                </div>
              </div>

              {/* 4. QUICK LINKS */}
              <div className="space-y-3">
                <h3 className="h-10 flex items-center gap-1.5 text-xs font-black text-[#0B2341] uppercase tracking-wider border-b border-[#E2E8E6]">
                  <ArrowRight className="w-3.5 h-3.5 text-[#0FA89D] shrink-0" />
                  <span>Quick Links</span>
                </h3>
                <ul className="space-y-2 text-xs font-semibold text-[#0B2341]">
                  <li><Link to="/list-property" className="hover:text-[#0FA89D] transition-colors">List Your Property</Link></li>
                  <li><Link to="/propertyowner/dashboard" className="hover:text-[#0FA89D] transition-colors">Owner Dashboard</Link></li>
                  <li><Link to="/website/mystays" className="hover:text-[#0FA89D] transition-colors font-bold text-[#0FA89D]">Tenant Dashboard / My Stays</Link></li>
                  <li><Link to="/about-us" className="hover:text-[#0FA89D] transition-colors">About Us</Link></li>
                  <li><Link to="/contact-us" className="hover:text-[#0FA89D] transition-colors">Contact Us</Link></li>
                  <li><Link to="/faq" className="hover:text-[#0FA89D] transition-colors">FAQ</Link></li>
                  <li><Link to="/website/login" className="hover:text-[#0FA89D] transition-colors">Login / Register</Link></li>
                </ul>
              </div>

              {/* 5. POLICIES & LEGAL */}
              <div className="space-y-3">
                <h3 className="h-10 flex items-center gap-1.5 text-xs font-black text-[#0B2341] uppercase tracking-wider border-b border-[#E2E8E6]">
                  <FileText className="w-3.5 h-3.5 text-[#0FA89D] shrink-0" />
                  <span>Policies &amp; Legal</span>
                </h3>
                <ul className="space-y-2 text-xs font-semibold text-[#0B2341]">
                  <li><Link to="/privacy-policy" className="hover:text-[#0FA89D] transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms-and-conditions" className="hover:text-[#0FA89D] transition-colors">Terms &amp; Conditions</Link></li>
                  <li><Link to="/refund-policy" className="hover:text-[#0FA89D] transition-colors">Refund Policy</Link></li>
                  <li><Link to="/cancellation-policy" className="hover:text-[#0FA89D] transition-colors">Cancellation Policy</Link></li>
                  <li><Link to="/website/refund-request" className="hover:text-[#0FA89D] transition-colors">Refund Request</Link></li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── 3. BOTTOM COPYRIGHT & COMPANY REGISTRATION BAR (#E5EBEA) ─────── */}
      <div className="border-t border-[#D8E1DF] bg-[#E5EBEA] py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-semibold text-[#0B2341]">
          <p>© {new Date().getFullYear()} Roomhy Technology Pvt. Ltd. All rights reserved.</p>

          <div className="flex items-center gap-1.5 text-[#0B2341]/80">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline" />
            <span>In India</span>
          </div>

          <div className="flex items-center gap-3 text-[#0B2341]">
            <a href="mailto:team@roomhy.com" className="flex items-center gap-1 hover:text-[#0FA89D] transition-colors">
              <Mail className="w-3.5 h-3.5 text-[#0FA89D]" />
              <span>team@roomhy.com</span>
            </a>
            <span>|</span>
            <a href="tel:+918764425030" className="flex items-center gap-1 hover:text-[#0FA89D] transition-colors">
              <Phone className="w-3.5 h-3.5 text-[#0FA89D]" />
              <span>+918764425030</span>
            </a>
          </div>
        </div>

        {/* Company Address & GSTIN */}
        <div className="mx-auto max-w-[1400px] mt-2.5 pt-2.5 border-t border-[#D0DBD9] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#0B2341]/75 font-medium">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#0FA89D] shrink-0" />
            <span>ROOMHY TECHNOLOGY — 847, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-[#0FA89D] shrink-0" />
            <span>GSTIN: <span className="font-bold text-[#0B2341]">08SLWPS2629G1ZZ</span></span>
          </div>
        </div>
      </div>

    </footer>
  );
}
