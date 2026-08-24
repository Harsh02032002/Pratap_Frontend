import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import { FileText, Shield, Users, Building2, AlertCircle, CreditCard, RefreshCw, Scale, ShieldAlert, Mail, Phone, MapPin } from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

export default function WebsiteTerms() {
  useSEO({ 
    pageKey: 'terms', 
    fallbackTitle: 'Terms and Conditions | User Agreement | Roomhy.com',
    fallbackDescription: "Review Roomhy.com's terms and conditions covering platform usage, booking rules, bidding policies, payments, and tenant-owner guidelines."
  });
  const [layoutSections, setLayoutSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.location.pathname !== '/terms-and-conditions') {
      window.history.replaceState(null, '', '/terms-and-conditions');
    }
  }, []);

  // Fetch page layout settings from DB
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await fetchJson('/api/page-layouts/terms');
        if (res.success && res.data && res.data.sections) {
          const sorted = res.data.sections.sort((a, b) => a.order - b.order);
          setLayoutSections(sorted);
        }
      } catch (err) {
        console.warn('Failed to load terms page layout:', err);
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
      icon: Users,
      title: "1. Definitions",
      content: [
        '"Roomhy", "Company", "We", "Us", or "Our" refers to ROOMHY TECHNOLOGY, a company incorporated under the laws of India, having its registered office at 22, Krishna Nagar, Rangbari Road, Kota, Rajasthan - 324005.',
        '"User", "You", or "Your" refers to any individual or entity using the platform, including students, tenants, property owners, and hosts.',
        '"Platform" refers to Roomhy\'s website, mobile application, and related services.'
      ]
    },
    {
      icon: Building2,
      title: "2. Scope of Services",
      content: [
        "Roomhy provides an online platform that connects students and individuals seeking accommodation with property owners and hosts through a transparent, broker-free, and real-time bidding process.",
        "We do not own, manage, control, or operate the properties listed on our platform, nor do we act as a real estate agent. Our service is limited to facilitating the listing, discovery, and initial booking of accommodations."
      ]
    },
    {
      icon: Shield,
      title: "3. User Eligibility & Account Registration",
      content: [
        "You must be at least 18 years old or have parental/guardian consent and be capable of entering into legally binding contracts to use our platform.",
        "You agree to provide accurate, complete, and current information during registration and keep your account credentials secure. You are solely responsible for any activity on your account."
      ]
    },
    {
      icon: AlertCircle,
      title: "4. Property Listings & Host Obligations",
      content: [
        "Property owners/hosts must ensure all listings are truthful, with accurate descriptions, amenities, rules, real photographs, and correct pricing.",
        "Roomhy reserves the right, but is not obligated, to verify, edit, reject, or remove any listing that violates our guidelines or is reported as fraudulent/inaccurate."
      ]
    },
    {
      icon: CreditCard,
      title: "5. Payment & Financial Terms",
      content: [
        "All payments for bookings, security deposits, token money, or service fees made through the platform are processed via secure, third-party payment gateways (like Razorpay).",
        "By initiating a transaction, you agree to pay all applicable fees, including room rent, security deposit, and any platform service charges clearly shown during checkout.",
        "The billing cycles, dues, and payment structures are decided between the tenant and the host, and Roomhy shall not be held liable for any dispute regarding manual rent payments made outside the platform."
      ]
    },
    {
      icon: RefreshCw,
      title: "6. Cancellation & Refund Policy",
      content: [
        "Cancellations and refunds are governed by our dedicated Cancellation and Refund Policies. Please review these policies carefully before making a booking.",
        "In case of a successful cancellation request eligible for a refund, the amount will be processed back to the original payment source within 21 days.",
        "Roomhy reserves the right to charge convenience or transaction fees for processing refunds where applicable."
      ]
    },
    {
      icon: ShieldAlert,
      title: "7. Limitation of Liability",
      content: [
        "To the maximum extent permitted by law, ROOMHY TECHNOLOGY, its directors, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages.",
        "We do not guarantee the quality, safety, suitability, or legality of any listed property. Any lease or rental agreement is solely between the tenant and the property owner; Roomhy is not a party to such agreements.",
        "We are not liable for any behavior, misconduct, or theft by tenants, hosts, or third parties."
      ]
    },
    {
      icon: Scale,
      title: "8. Dispute Resolution & Arbitration",
      content: [
        "Any dispute, controversy, or claim arising out of or relating to these Terms & Conditions, including their validity, invalidity, breach, or termination, shall be settled by mutual discussion first.",
        "If a dispute cannot be settled amicably, it shall be referred to and finally resolved by arbitration in accordance with the Indian Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Kota, Rajasthan, India, and the language of the proceedings shall be English."
      ]
    },
    {
      icon: Scale,
      title: "9. Governing Law & Jurisdiction",
      content: [
        "These Terms and Conditions shall be governed by, and construed in accordance with, the laws of India.",
        "Subject to the arbitration clause above, any legal action or proceeding arising out of these Terms shall be brought exclusively in the courts of competent jurisdiction located at Kota, Rajasthan, India."
      ]
    }
  ];

  const renderHero = () => {
    const content = getSectionContent('terms-hero', {
      title: 'Terms & Conditions',
      subtitle: ''
    });
    return (
      <div 
        key="terms-hero" 
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
            {(content.title || 'TERMS & CONDITIONS').toUpperCase()}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              LEGAL TERMS
            </div>
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              PLATFORM RULES
            </div>
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              USER RIGHTS
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const content = getSectionContent('terms-content', {
      clause: 'Welcome to Roomhy. By using our platform (website or mobile app), you agree to comply with and be bound by these Terms & Conditions of ROOMHY TECHNOLOGY. Please read them carefully.'
    });
    return (
      <section key="terms-content" className="py-6 md:py-16 px-4 max-w-4xl mx-auto">
        <div className="bg-white md:rounded-3xl p-0 md:p-12 md:shadow-sm md:border md:border-gray-100">
          <p className="text-gray-600 leading-relaxed mb-6 md:mb-8 text-sm md:text-base">
            {content.clause}
          </p>

          <div className="space-y-5 md:space-y-8">
            {staticSections.map((section, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <section.icon size={18} />
                  </div>
                  <h2 className="text-base md:text-xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <ul className="space-y-2.5 pl-2 md:pl-13">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      <p className="text-gray-600 text-xs md:text-base leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Corporate & Contact Information</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">ROOMHY TECHNOLOGY</p>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <span>22, Krishna Nagar, Rangbari Road, Kota, Rajasthan - 324005</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a href="mailto:team@roomhy.com" className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium">
                  <Mail size={16} /> team@roomhy.com
                </a>
                <a href="tel:+918764425030" className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium">
                  <Phone size={16} /> +91 8764425030
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const defaultOrder = ['terms-hero', 'terms-content'];
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
              case 'terms-hero': return renderHero();
              case 'terms-content': return renderContent();
              default: return null;
            }
          })}
        </main>
      )}

      <WebsiteFooter />
    </div>
  );
}




