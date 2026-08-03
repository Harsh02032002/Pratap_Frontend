import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Search } from "lucide-react";
import { fetchCities, fetchAreas } from "../../utils/api.js";

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About Roomhy", href: "/website/about" },
      { label: "Contact", href: "/website/contact" }
    ]
  },
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/website/index" },
      { label: "Our Properties", href: "/website/ourproperty" },
      { label: "Fast Bidding", href: "/website/fast-bidding" },
      { label: "Post Property", href: "/website/list" }
    ]
  },
  {
    title: "Support",
    links: [
      { label: "My Stays", href: "/website/mystays" },
      { label: "Refund Request", href: "/website/refund-request" },
      { label: "Cancellation", href: "/website/cancellation" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/website/terms" },
      { label: "Privacy Policy", href: "/website/privacy" },
      { label: "Refund Policy", href: "/website/refund" }
    ]
  }
];

const staticCityLinks = [
  { name: "Kota", count: "2,500+", href: "/website/ourproperty?city=kota", areas: ["Vigyan Nagar", "Rajeev Gandhi Nagar", "Indra Vihar", "Mahaveer Nagar"] },
  { name: "Sikar", count: "850+", href: "/website/ourproperty?city=sikar", areas: ["Piprali Road", "Subhash Chowk", "Station Road"] },
  { name: "Indore", count: "1,800+", href: "/website/ourproperty?city=indore", areas: ["Vijay Nagar", "Bhawarkua", "Sapna Sangeeta"] },
];

export default function WebsiteFooter() {
  const year = new Date().getFullYear();
  const [cityLinks, setCityLinks] = useState(staticCityLinks);
  const [showAllCities, setShowAllCities] = useState(false);
  const [mobileExpandedCity, setMobileExpandedCity] = useState(null);

  // STATIC MODE: cities and areas loaded from static data only
  // useEffect(() => {
  //   const loadCitiesAndAreas = async () => {
  //     try {
  //       const [cities, areas] = await Promise.all([fetchCities(), fetchAreas()]);
  //       
  //       if (cities && cities.length > 0) {
  //         const areasByCity = {};
  //         areas.forEach(area => {
  //           if (typeof area === 'object') {
  //             const cityName = area.cityName || area.city?.name || '';
  //             const areaName = area.name || area.areaName || '';
  //             if (cityName && areaName) {
  //               const key = cityName.toLowerCase();
  //               if (!areasByCity[key]) areasByCity[key] = [];
  //               areasByCity[key].push(areaName);
  //             }
  //           }
  //         });
  //         
  //         const transformedCities = cities
  //           .map(city => {
  //             const cityName = typeof city === 'string' ? city : (city.name || city.city || '');
  //             const cityKey = cityName.toLowerCase();
  //             const cityAreas = areasByCity[cityKey] || [];
  //             const cityCount = typeof city.propertyCount === 'number' ? city.propertyCount : '—';
  //             
  //             return {
  //               name: cityName,
  //               count: cityCount,
  //               href: `/website/ourproperty?city=${encodeURIComponent(cityName.toLowerCase())}`,
  //               areas: cityAreas.slice(0, 5)
  //             };
  //           })
  //           .filter(city => ['Kota','Sikar','Indore'].includes(city.name));
  //         
  //         if (transformedCities.length > 0) {
  //           setCityLinks(transformedCities);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error fetching cities/areas for footer:", error);
  //     }
  //   };
  //   
  //   loadCitiesAndAreas();
  // }, []);

  return (
    <footer className="mt-auto bg-gray-50 border-t border-gray-200 text-gray-700">
      <div className="container mx-auto px-4 sm:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <a href="/website/index" className="inline-flex items-center gap-3 transition-transform hover:scale-105">
              <img
                src="/website/images/logoroomhy_cropped.jpg"
                alt="Roohmy"
                className="h-10 w-auto"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/website/images/logoroomhy.jpg';
                }}
              />
            </a>
            <p className="mt-2 md:mt-4 text-sm text-gray-900 max-w-sm">
              Find student housing smarter, simpler, and broker-free with Roohmy.
            </p>
            <div className="mt-3 md:mt-5 flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
              <a className="text-gray-700 hover:text-teal-600 font-medium" href="/website/contact">
                Help & Support
              </a>
              <span className="text-gray-400">•</span>
              <a className="text-gray-700 hover:text-teal-600 font-medium" href="mailto:hello@roomhy.com">
                hello@roomhy.com
              </a>
            </div>
            <div className="mt-3 md:mt-6 flex items-center justify-center md:justify-start gap-3">
              <a 
                href="#" 
                title="Facebook" 
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 shadow-md"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="#" 
                title="Twitter" 
                className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-all hover:scale-110 shadow-md"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a 
                href="#" 
                title="Instagram" 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white flex items-center justify-center hover:scale-110 transition-all shadow-md"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.2-4.354-2.618-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="#" 
                title="LinkedIn" 
                className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition-all hover:scale-110 shadow-md"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a 
                href="#" 
                title="YouTube" 
                className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all hover:scale-110 shadow-md"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 flex flex-col items-center md:items-start text-center md:text-left w-full space-y-1">
              <p className="font-semibold text-gray-800">ROOMHY TECHNOLOGY</p>
              <p>847, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India</p>
              <p>+91 8764425030</p>
              <p>GSTIN: 08SLWPS2629G1ZZ</p>
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="grid grid-cols-4 gap-4 md:gap-6">
              {footerColumns.map((col) => (
                <div key={col.title}>
                  <div className="text-xs md:text-sm font-bold text-gray-900">{col.title}</div>
                  <ul className="mt-2 md:mt-3 space-y-1 md:space-y-2">
                    {col.links.map((l) => (
                      <li key={l.href}>
                        <a className="text-[10px] md:text-sm text-gray-900 hover:text-teal-600 font-medium" href={l.href}>
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cities with Areas */}
        <div className="mt-4 md:mt-8 pt-3 md:pt-5 border-t border-gray-200">
          <h4 className="text-sm font-bold text-gray-900 mb-2 md:mb-4">Top Cities & Areas</h4>
          
          {/* Desktop Grid - Hidden on mobile */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {cityLinks.map((city) => (
              <div key={city.name} className="bg-white rounded-lg border border-gray-200 p-3">
                <a
                  href={city.href}
                  className="flex items-center justify-between hover:text-teal-600 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{city.name}</span>
                  <span className="text-xs text-gray-500">({city.count})</span>
                </a>
                
                {/* Areas under each city */}
                {city.areas && city.areas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {city.areas.map((area) => (
                      <a
                        key={area}
                        href={`/website/ourproperty?city=${encodeURIComponent(city.name.toLowerCase())}&area=${encodeURIComponent(area.toLowerCase())}`}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-teal-50 hover:text-teal-600 rounded text-gray-600 transition-colors"
                      >
                        {area}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile UI - Horizontal Scrolling Chips with Revealable Areas */}
          <div className="md:hidden mt-4">
            <div className="flex flex-col gap-4">
              <div className={`overflow-x-auto scrollbar-hide flex gap-2 pb-2 ${showAllCities ? 'flex-wrap' : 'flex-nowrap'}`}>
                {cityLinks.slice(0, showAllCities ? cityLinks.length : 6).map((city) => (
                  <button
                    key={city.name}
                    onClick={() => setMobileExpandedCity(mobileExpandedCity === city.name ? null : city.name)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      mobileExpandedCity === city.name 
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md' 
                        : 'bg-white text-gray-700 border-gray-200 shadow-sm'
                    }`}
                  >
                    {city.name} <span className="text-[10px] font-normal opacity-70">({city.count})</span>
                  </button>
                ))}
                
                {!showAllCities && cityLinks.length > 6 && (
                  <button
                    onClick={() => setShowAllCities(true)}
                    className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-black text-teal-600 bg-teal-50 border border-teal-100 flex items-center gap-1 shadow-sm"
                  >
                    All Cities <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Panel for Areas - Appears when a city is selected */}
              {mobileExpandedCity && (
                <div className="bg-white rounded-2xl p-5 border-2 border-teal-50 shadow-md animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-black text-gray-900">Explore Locations in {mobileExpandedCity}</h5>
                    <button onClick={() => setMobileExpandedCity(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                      <ChevronDown className="w-5 h-5 text-gray-400 rotate-180" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {cityLinks.find(c => c.name === mobileExpandedCity)?.areas.map((area) => (
                      <a
                        key={area}
                        href={`/website/ourproperty?city=${encodeURIComponent(mobileExpandedCity.toLowerCase())}&area=${encodeURIComponent(area.toLowerCase())}`}
                        className="text-[11px] p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all text-center"
                      >
                        {area}
                      </a>
                    ))}
                    <a 
                      href={cityLinks.find(c => c.name === mobileExpandedCity)?.href}
                      className="col-span-2 text-xs p-3 bg-gray-900 text-white rounded-xl font-black flex items-center justify-center gap-2 mt-2 shadow-lg active:scale-95 transition-transform"
                    >
                      View All in {mobileExpandedCity} <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {showAllCities && (
                <button
                  onClick={() => setShowAllCities(false)}
                  className="mx-auto text-xs font-bold text-gray-400 hover:text-teal-600 underline decoration-dotted"
                >
                  Show Less
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-8 pt-3 md:pt-5 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="text-xs text-gray-900 font-medium">© {year} ROOMHY TECHNOLOGY. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}



