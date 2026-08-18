import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import { Shield, Eye, Lock, Database, UserCheck, Mail, Phone, MapPin } from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

export default function WebsitePrivacy() {
  useSEO({ pageKey: 'privacy', fallbackTitle: 'Privacy Policy - Roomhy' });
  const [layoutSections, setLayoutSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.location.pathname !== '/privacy-policy') {
      window.history.replaceState(null, '', '/privacy-policy');
    }
  }, []);

  // Fetch page layout settings from DB
  useEffect(() => {
    const fetchLayout = async () => {
      let resolved = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          if (!resolved) {
            console.warn('Privacy layout API call timed out, falling back to defaults');
            resolve({ success: false, timeout: true });
          }
        }, 3000);
      });

      try {
        const apiPromise = fetchJson('/api/page-layouts/privacy');
        const res = await Promise.race([apiPromise, timeoutPromise]);
        
        resolved = true;
        if (res && res.success && res.data && res.data.sections) {
          const sorted = res.data.sections.sort((a, b) => a.order - b.order);
          setLayoutSections(sorted);
        }
      } catch (err) {
        console.warn('Failed to load privacy page layout:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, []);

  const isSectionVisible = (id) => {
    if (layoutSections.length === 0) return true;
    const sec = layoutSections.find(s => s.id === id);
    return sec ? sec.visible : true;
  };

  const getSectionContent = (id, fallback) => {
    if (layoutSections.length === 0) return fallback;
    const sec = layoutSections.find(s => s.id === id);
    return sec && sec.content ? { ...fallback, ...sec.content } : fallback;
  };

  const staticSections = [
    {
      icon: Database,
      title: "Information We Collect",
      items: [
        "Personal Information: Name, email address, phone number, date of birth, profile picture, and identity verification details.",
        "Property Information: Contact details, property location, rental prices, photos, and ownership documents (for property owners).",
        "Usage Information: IP address, device type, browser type, pages visited, and browsing patterns.",
        "Payment Information: Payment method, transaction history, and billing addresses (processed through secure payment gateways)."
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      items: [
        "To facilitate property listings and bookings",
        "To process payments and refunds",
        "To verify identity and prevent fraud",
        "To send notifications, updates, and promotional content",
        "To improve our platform and services",
        "To comply with legal obligations"
      ]
    },
    {
      icon: Lock,
      title: "Data Security",
      items: [
        "We implement industry-standard security measures including encryption, firewalls, and secure servers to protect your personal information from unauthorized access, alteration, disclosure, or destruction."
      ]
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      items: [
        "Right to access your personal information",
        "Right to request data deletion (subject to legal obligations)",
        "Right to opt out of marketing communications",
        "Right to data portability"
      ]
    }
  ];

  const renderHero = () => {
    const content = getSectionContent('privacy-hero', {
      title: 'Privacy Policy',
      subtitle: ' — We take your privacy seriously.'
    });
    return (
      <div 
        key="privacy-hero" 
        className="relative w-full py-8 md:py-12 px-4 md:px-8 overflow-hidden border-b border-stone-200/80 text-center"
        style={{
          background: 'linear-gradient(135deg, #EAEFF5 0%, #F5F7FA 50%, #E5EDF5 100%)'
        }}
      >
        <div 
          className="absolute inset-0 opacity-[0.25] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(200, 215, 230, 0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(210, 225, 240, 0.4) 0%, transparent 40%), linear-gradient(45deg, rgba(255,255,255,0.6) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.6) 75%)`,
            backgroundSize: '100% 100%, 100% 100%, 60px 60px'
          }}
        ></div>
        <div className="relative max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#1E293B] tracking-wider uppercase leading-tight mb-4 drop-shadow-xs">
            {(content.title || 'PRIVACY POLICY').toUpperCase()}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              DATA PROTECTION
            </div>
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              USER SECURITY
            </div>
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              CONFIDENTIALITY
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const content = getSectionContent('privacy-content', {
      introduction: 'Roomhy is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our platform of ROOMHY TECHNOLOGY.'
    });
    return (
      <section key="privacy-content" className="py-6 md:py-16 px-4 max-w-4xl mx-auto">
        <div className="bg-white md:rounded-3xl p-0 md:p-12 md:shadow-sm md:border md:border-gray-100">
          <p className="text-gray-600 leading-relaxed mb-6 md:mb-8 text-sm md:text-base">
            {content.introduction}
          </p>

          <div className="space-y-5 md:space-y-8">
            {staticSections.map((section, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <section.icon size={18} />
                  </div>
                  <h2 className="text-base md:text-xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <ul className="space-y-2.5">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <p className="text-gray-600 text-xs md:text-base leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Corporate & Contact Information</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">ROOMHY TECHNOLOGY</p>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <span>847, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a href="mailto:team@roomhy.com" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                  <Mail size={16} /> team@roomhy.com
                </a>
                <a href="tel:+918764425030" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                  <Phone size={16} /> +91 8764425030
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const defaultOrder = ['privacy-hero', 'privacy-content'];
  const activeOrder = layoutSections.length > 0
    ? layoutSections.map(s => s.id)
    : defaultOrder;

  return (
    <div className="min-h-screen bg-white md:bg-gray-50">
      <WebsiteNavbar />

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <main className="min-h-screen">
          {activeOrder.map(sectionId => {
            if (!isSectionVisible(sectionId)) return null;
            switch (sectionId) {
              case 'privacy-hero': return renderHero();
              case 'privacy-content': return renderContent();
              default: return null;
            }
          })}
        </main>
      )}

      <WebsiteFooter />
    </div>
  );
}




