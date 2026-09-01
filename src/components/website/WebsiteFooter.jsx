import React from "react";
import { Link } from "react-router-dom";
import { 
  Building2, Bed, Home, Users, Star, ShieldCheck, Search, ArrowRight, 
  Phone, Mail, Heart, MapPin, CheckCircle2, Building, Sparkles, Lock, FileText,
  Facebook, Instagram, Linkedin, Twitter, Youtube, MessageCircle
} from "lucide-react";

function Logo() {
  return (
    <Link to="/" className="inline-flex items-center -mt-2.5">
      <img 
        src="/website/roomhy_logo.jpeg" 
        alt="Roomhy Logo" 
        className="h-7 md:h-8 w-auto object-contain mix-blend-multiply"
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
    <footer className="border-t border-slate-200/80 bg-[#f9fbfb] text-slate-700 font-sans relative pb-16 md:pb-0">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-12 py-10 space-y-8">
        
        {/* ========================================================================= */}
        {/* MAIN MULTI-COLUMN FOOTER GRID                                             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-5 items-start">
          
          {/* COLUMN 1: BRAND INFO & TRUST BADGES */}
          <div className="space-y-4">
            <Logo />
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              India's smart bidding platform for PGs, Hostels, Co-living Spaces &amp; Student Apartments.
            </p>

            {/* Green Check Trust Badges List */}
            <div className="space-y-1.5 pt-1 text-xs font-extrabold text-slate-700">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                <span className="text-slate-800 text-[11px]">Smart Bidding</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                <span className="text-slate-800 text-[11px]">Verified Properties</span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-600">
                <Bed className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                <span className="text-slate-800 text-[11px]">50,000+ Beds</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-500">
                <Star className="w-3.5 h-3.5 shrink-0 fill-amber-400 stroke-none" />
                <span className="text-slate-800 text-[11px]">Trusted by Students</span>
              </div>
            </div>

            {/* Social Icons Row — ONLY Facebook, Instagram, LinkedIn */}
            <div className="pt-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Follow us on</p>
              <div className="flex items-center gap-2">
                <a href="https://www.facebook.com/profile.php?id=61587850180193" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform">
                  <Facebook className="w-3.5 h-3.5 fill-white" />
                </a>
                <a href="https://www.instagram.com/roomhy.com_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform">
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a href="https://www.linkedin.com/company/roomhy-com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-7 h-7 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform">
                  <Linkedin className="w-3.5 h-3.5 fill-white" />
                </a>
              </div>
            </div>
          </div>

          {/* COLUMN 2: POPULAR CITIES */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Popular Cities</span>
            </div>
            <ul className="space-y-2 text-xs font-bold text-slate-600">
              <li>
                <Link to="/website/ourproperty?city=kota" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> PG in Kota
                </Link>
              </li>
              <li>
                <Link to="/website/ourproperty?city=jaipur" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> PG in Jaipur
                </Link>
              </li>
              <li>
                <Link to="/website/ourproperty?city=delhi" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> PG in Delhi
                </Link>
              </li>
              <li>
                <Link to="/website/ourproperty?city=indore" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> PG in Indore
                </Link>
              </li>
              <li>
                <Link to="/website/ourproperty?city=bangalore" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> PG in Bangalore
                </Link>
              </li>
              <li>
                <Link to="/website/ourproperty?city=pune" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> PG in Pune
                </Link>
              </li>
            </ul>
            <div className="pt-1">
              <Link to="/website/ourproperty" className="text-xs font-black text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 group">
                View all cities <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* COLUMN 3: PROPERTY TYPES */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-purple-700 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Property Types</span>
            </div>
            <ul className="space-y-2 text-xs font-bold text-slate-600">
              <li>
                <Link to="/pg?gender=boys" className="hover:text-purple-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> PG for Boys
                </Link>
              </li>
              <li>
                <Link to="/pg?gender=girls" className="hover:text-purple-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> PG for Girls
                </Link>
              </li>
              <li>
                <Link to="/pg?gender=coed" className="hover:text-purple-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> Co-ed PG
                </Link>
              </li>
              <li>
                <Link to="/hostels" className="hover:text-purple-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> Hostels
                </Link>
              </li>
              <li>
                <Link to="/hostels?gender=boys" className="hover:text-purple-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> Boys Hostels
                </Link>
              </li>
              <li>
                <Link to="/hostels?gender=girls" className="hover:text-purple-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> Girls Hostels
                </Link>
              </li>
              <li>
                <Link to="/co-living" className="hover:text-purple-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> Co-living
                </Link>
              </li>
              <li>
                <Link to="/apartments" className="hover:text-purple-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> Apartments
                </Link>
              </li>
            </ul>
            <div className="pt-1">
              <Link to="/website/ourproperty" className="text-xs font-black text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 group">
                View all properties <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* COLUMN 4: HOSTELS & CO-LIVING */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Hostels</span>
            </div>
            <ul className="space-y-2 text-xs font-bold text-slate-600">
              <li>
                <Link to="/hostels?gender=boys" className="hover:text-amber-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> Hostels for Boys
                </Link>
              </li>
              <li>
                <Link to="/hostels?gender=girls" className="hover:text-amber-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> Hostels for Girls
                </Link>
              </li>
              <li>
                <Link to="/hostels?gender=coed" className="hover:text-amber-600 transition-colors flex items-center gap-1">
                  <span className="text-slate-400 font-bold">&gt;</span> Co-ed Hostels
                </Link>
              </li>
            </ul>

            {/* Sub-block: CO-LIVING */}
            <div className="pt-3 space-y-3 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5 text-xs font-black text-sky-700 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Co-living</span>
              </div>
              <ul className="space-y-2 text-xs font-bold text-slate-600">
                <li>
                  <Link to="/co-living?gender=boys" className="hover:text-sky-600 transition-colors flex items-center gap-1">
                    <span className="text-slate-400 font-bold">&gt;</span> Co-living for Boys
                  </Link>
                </li>
                <li>
                  <Link to="/co-living?gender=girls" className="hover:text-sky-600 transition-colors flex items-center gap-1">
                    <span className="text-slate-400 font-bold">&gt;</span> Co-living for Girls
                  </Link>
                </li>
                <li>
                  <Link to="/co-living?gender=coed" className="hover:text-sky-600 transition-colors flex items-center gap-1">
                    <span className="text-slate-400 font-bold">&gt;</span> Co-ed Co-living
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* COLUMN 5: QUICK LINKS */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-teal-700 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Quick Links</span>
            </div>
            <ul className="space-y-2 text-xs font-bold text-slate-600">
              <li><Link to="/list-property" className="hover:text-teal-600 transition-colors">List Your Property</Link></li>
              <li><Link to="/propertyowner/dashboard" className="hover:text-teal-600 transition-colors">Owner Dashboard</Link></li>
              <li><Link to="/website/mystays" className="hover:text-teal-600 transition-colors">Tenant Dashboard / My Stays</Link></li>
              <li><Link to="/about-us" className="hover:text-teal-600 transition-colors">About Us</Link></li>
              <li><Link to="/contact-us" className="hover:text-teal-600 transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-teal-600 transition-colors">FAQ</Link></li>
              <li><Link to="/auth/login" className="hover:text-teal-600 transition-colors">Login / Register</Link></li>
            </ul>
          </div>

          {/* COLUMN 6: POLICIES & LEGAL (Dedicated Top-Level Column) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-700 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Policies &amp; Legal</span>
            </div>
            <ul className="space-y-2 text-xs font-bold text-slate-600">
              <li><Link to="/privacy-policy" className="hover:text-rose-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-rose-600 transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-rose-600 transition-colors">Refund Policy</Link></li>
              <li><Link to="/cancellation-policy" className="hover:text-rose-600 transition-colors">Cancellation Policy</Link></li>
              <li><Link to="/website/refund-request" className="hover:text-rose-600 transition-colors">Refund Request</Link></li>
            </ul>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* POPULAR SEARCHES PILLS BANNER CARD                                         */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-[#E8F7F2]/80 border border-teal-200/70 p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs shrink-0">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Search className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>POPULAR SEARCHES</span>
          </div>

          <div className="flex flex-wrap gap-2 flex-1">
            {[
              { label: 'PG in Kota', link: '/pg-in-kota' },
              { label: 'PG in Jaipur', link: '/pg-in-jaipur' },
              { label: 'PG in Delhi', link: '/pg-in-delhi' },
              { label: 'Hostels in Kota', link: '/hostels-in-kota' },
              { label: 'Hostels in Jaipur', link: '/hostels-in-jaipur' },
              { label: 'Hostels in Delhi', link: '/hostels-in-delhi' },
              { label: 'Co-living in Bangalore', link: '/co-living-in-bangalore' },
              { label: 'Co-living in Pune', link: '/co-living-in-pune' },
              { label: 'Student Apartments', link: '/apartments' },
              { label: 'Girls Hostel', link: '/hostels?gender=girls' },
              { label: 'Boys Hostel', link: '/hostels?gender=boys' },
              { label: 'Luxury PG', link: '/pg' },
              { label: 'Budget PG', link: '/pg' },
            ].map(item => (
              <Link
                key={item.label}
                to={item.link}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold border border-slate-200/80 shadow-2xs transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link to="/website/ourproperty" className="text-xs font-black text-emerald-700 hover:text-emerald-800 shrink-0 inline-flex items-center gap-1">
            View all searches &rarr;
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* TRUST BADGES SUMMARY ROW CARD                                             */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 md:p-5 shadow-2xs grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Smart Bidding</p>
              <p className="text-[11px] font-semibold text-slate-500">Best price deals</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Verified Listings</p>
              <p className="text-[11px] font-semibold text-slate-500">100% verified properties</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">50,000+ Students</p>
              <p className="text-[11px] font-semibold text-slate-500">Trust us to find a home</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">10+ Cities</p>
              <p className="text-[11px] font-semibold text-slate-500">Across India</p>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* BOTTOM COPYRIGHT & CONTACT BAR                                            */}
      {/* ========================================================================= */}
      <div className="border-t border-slate-200/80 bg-white py-4 px-4 md:px-8">
        <div className="mx-auto max-w-[1440px] flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-600">
          <p>© {new Date().getFullYear()} Roomhy Technology Pvt. Ltd. All rights reserved.</p>
          
          <div className="flex items-center gap-1 text-slate-500">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline" />
            <span>in India</span>
          </div>

          <div className="flex items-center gap-4 text-slate-700">
            <a href="mailto:team@roomhy.com" className="hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> team@roomhy.com
            </a>
            <span className="text-slate-300">|</span>
            <a href="tel:+918764425030" className="hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5 text-emerald-700 font-black">
              <Phone className="w-3.5 h-3.5 text-emerald-600" /> +91 87644 25030
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
