import React from "react";
import { Link } from "react-router-dom";
import { 
  Facebook, Instagram, Linkedin
} from "lucide-react";

function Logo() {
  return (
    <Link to="/" className="inline-flex items-center">
      <img 
        src="/website/roomhy_logo.jpeg" 
        alt="Roomhy Logo" 
        className="h-7 md:h-8 w-auto object-contain mix-blend-multiply relative -top-1"
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

      {/* ========================================================================= */}
      {/* MOBILE FOOTER                                                             */}
      {/* ========================================================================= */}
      <div className="md:hidden px-4 py-6 text-center space-y-4 bg-white border-t border-gray-100">
        {/* Top Cities & Areas Pills */}
        <div className="pb-3 border-b border-gray-100">
          <p className="text-[11px] font-bold text-gray-800 mb-2">Top Cities &amp; Areas</p>
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

        {/* Logo */}
        <Logo />

        {/* Subtitle */}
        <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-tight font-medium">
          Find student housing smarter, simpler, and broker-free with Roomhy.
        </p>

        {/* Contact Info */}
        <p className="text-xs font-semibold text-gray-700">
          Help &amp; Support • <a href="mailto:hello@roomhy.com" className="text-teal-600 font-bold">hello@roomhy.com</a>
        </p>

        {/* Social Icons Row (Facebook, Instagram, LinkedIn) */}
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <a href="https://www.facebook.com/profile.php?id=61587850180193" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-8 w-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform">
            <Facebook className="h-4 w-4 fill-white" />
          </a>
          <a href="https://www.instagram.com/roomhy.com_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform">
            <Instagram className="h-4 w-4" />
          </a>
          <a href="https://www.linkedin.com/company/roomhy-com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="h-8 w-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform">
            <Linkedin className="h-4 w-4 fill-white" />
          </a>
        </div>

        {/* Address & Registration Block */}
        <div className="text-[10px] text-gray-400 space-y-0.5 pt-2 max-w-xs mx-auto leading-relaxed border-t border-gray-100">
          <p className="font-bold text-gray-700">ROOMHY TECHNOLOGY</p>
          <p>647, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India</p>
          <p className="font-semibold text-gray-600">+91 8764425030</p>
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
              <li><Link to="/bidding">Fast Bidding</Link></li>
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
              <li><Link to="/faq">Terms &amp; Conditions</Link></li>
              <li><Link to="/faq">Privacy Policy</Link></li>
              <li><Link to="/faq">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP FOOTER                                                            */}
      {/* ========================================================================= */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-12 py-10 space-y-8">

          {/* Top Cities & Areas Section (Positioned FIRST at the top of Desktop Footer) */}
          <div className="pb-8 border-b border-slate-200/80 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs tracking-tight">Top Cities &amp; Areas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Kota Card */}
              <div className="rounded-xl bg-white p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Kota</span>
                  <span className="text-[11px] text-slate-400 font-medium">(2,500+)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Vigyan Nagar", "Rajeev Gandhi Nagar", "Indra Vihar", "Mahaveer Nagar"].map((area) => (
                    <Link 
                      key={area} 
                      to={`/website/ourproperty?city=kota&search=${encodeURIComponent(area)}`}
                      className="rounded-md bg-slate-100/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                    >
                      {area}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sikar Card */}
              <div className="rounded-xl bg-white p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Sikar</span>
                  <span className="text-[11px] text-slate-400 font-medium">(850+)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Piprali Road", "Subhash Chowk", "Station Road"].map((area) => (
                    <Link 
                      key={area} 
                      to={`/website/ourproperty?city=sikar&search=${encodeURIComponent(area)}`}
                      className="rounded-md bg-slate-100/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                    >
                      {area}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Indore Card */}
              <div className="rounded-xl bg-white p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Indore</span>
                  <span className="text-[11px] text-slate-400 font-medium">(1,800+)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Vijay Nagar", "Bhawarkua", "Sapna Sangeeta"].map((area) => (
                    <Link 
                      key={area} 
                      to={`/website/ourproperty?city=indore&search=${encodeURIComponent(area)}`}
                      className="rounded-md bg-slate-100/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                    >
                      {area}
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Top 5 Grid Columns (Positioned SECOND below Top Cities & Areas) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 items-start justify-between">

            {/* Column 1: Logo & Address info */}
            <div className="space-y-4 -mt-1">
              <Logo />
              <p className="text-xs leading-relaxed text-slate-500 font-medium">
                Find student housing smarter, simpler, and broker-free with Roomhy.
              </p>

              <p className="text-xs font-semibold text-slate-700">
                Help &amp; Support • <a href="mailto:hello@roomhy.com" className="text-slate-600 font-bold hover:text-teal-600">hello@roomhy.com</a>
              </p>

              {/* 3 Social Circles (Facebook, Instagram, LinkedIn) */}
              <div className="flex items-center gap-3 pt-1">
                <a href="https://www.facebook.com/profile.php?id=61587850180193" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-9 w-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs">
                  <Facebook className="h-4 w-4 fill-white" />
                </a>
                <a href="https://www.instagram.com/roomhy.com_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="https://www.linkedin.com/company/roomhy-com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="h-9 w-9 rounded-full bg-[#0A66C2] text-white flex items-center justify-center transition-transform hover:scale-110 shadow-xs">
                  <Linkedin className="h-4 w-4 fill-white" />
                </a>
              </div>

              {/* Address & GST Block */}
              <div className="text-[10px] text-slate-400 space-y-0.5 pt-3 leading-relaxed border-t border-slate-200/80 font-medium">
                <p className="font-bold text-slate-700">ROOMHY TECHNOLOGY</p>
                <p>647, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India</p>
                <p className="font-semibold text-slate-600">+91 8764425030</p>
                <p>GSTIN: 08SLWPS2629Q1ZZ</p>
              </div>
            </div>

            {/* Column 2: Company */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Company</h4>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li><Link to="/about-us" className="hover:text-teal-600 transition-colors">About Roomhy</Link></li>
                <li><Link to="/contact-us" className="hover:text-teal-600 transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Column 3: Explore */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Explore</h4>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li><Link to="/" className="hover:text-teal-600 transition-colors">Home</Link></li>
                <li><Link to="/website/ourproperty" className="hover:text-teal-600 transition-colors">Our Properties</Link></li>
                <li><Link to="/bidding" className="hover:text-teal-600 transition-colors">Fast Bidding</Link></li>
                <li><Link to="/list-property" className="hover:text-teal-600 transition-colors">Post Property</Link></li>
              </ul>
            </div>

            {/* Column 4: Support */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Support</h4>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li><Link to="/website/mystays" className="hover:text-teal-600 transition-colors">My Stays</Link></li>
                <li><Link to="/contact-us" className="hover:text-teal-600 transition-colors">Refund Request</Link></li>
                <li><Link to="/contact-us" className="hover:text-teal-600 transition-colors">Cancellation</Link></li>
              </ul>
            </div>

            {/* Column 5: Legal */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Legal</h4>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li><Link to="/faq" className="hover:text-teal-600 transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link to="/faq" className="hover:text-teal-600 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/faq" className="hover:text-teal-600 transition-colors">Refund Policy</Link></li>
              </ul>
            </div>

          </div>

        </div>

        {/* COPYRIGHT BAR */}
        <div className="border-t border-slate-200/80 bg-[#f9fbfb]">
          <div className="mx-auto flex max-w-[1440px] px-4 md:px-8 lg:px-12 items-center justify-between py-4 text-xs font-semibold text-slate-700">
            <p>© {new Date().getFullYear()} ROOMHY TECHNOLOGY. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
