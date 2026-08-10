import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Search } from "lucide-react";

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
  const [cityLinks] = useState(staticCityLinks);
  const [showAllCities, setShowAllCities] = useState(false);
  const [mobileExpandedCity, setMobileExpandedCity] = useState(null);

  return (
    <footer className="mt-auto bg-gray-50 border-t border-gray-200 text-gray-700">
      <div className="container mx-auto px-4 sm:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <a href="/website/index" className="inline-flex items-center gap-3 transition-transform hover:scale-105">
              <img
                src="/website/images/logoroomhy_cropped.jpg"
                alt="Roomhy"
                className="h-10 w-auto"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/website/images/logoroomhy.jpg';
                }}
              />
            </a>
            <p className="mt-2 md:mt-4 text-sm text-gray-900 max-w-sm">
              Find student housing smarter, simpler, and broker-free with Roomhy.
            </p>
            <div className="mt-3 md:mt-5 flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
              <a className="text-gray-700 hover:text-teal-600 font-medium" href="/website/contact">
                Help & Support
              </a>
              <span className="text-gray-400">•</span>
              <a className="text-gray-700 hover:text-teal-600 font-medium" href="mailto:team@roomhy.com">
                team@roomhy.com
              </a>
              <span className="text-gray-400">•</span>
              <a className="text-gray-700 hover:text-teal-600 font-medium" href="tel:+918764425030">
                +91 8764425030
              </a>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mt-4 md:mt-0 text-center md:text-left">
            {footerColumns.map((column) => (
              <div key={column.title} className="space-y-2 md:space-y-3">
                <p className="text-xs font-bold text-gray-900 tracking-wider uppercase">
                  {column.title}
                </p>
                <ul className="space-y-1.5 md:space-y-2 text-xs font-medium">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-gray-600 hover:text-teal-600 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 md:mt-10 pt-4 md:pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {year} Roomhy Technology. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/website/privacy" className="hover:text-gray-700">Privacy Policy</a>
            <a href="/website/terms" className="hover:text-gray-700">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
