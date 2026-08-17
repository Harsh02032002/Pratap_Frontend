import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { ChevronDown, HelpCircle } from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const faqData = [
  {
    question: "What is Roomhy and how does it work?",
    answer: "Roomhy is a student accommodation platform that connects students directly with verified property owners. You search, shortlist, and book properties like PG, hostels, and apartments without paying any brokerage fees. Our bidding feature also allows you to secure the best possible rental price."
  },
  {
    question: "Is Roomhy completely broker-free?",
    answer: "Yes, absolutely. Our core promise is zero brokerage. We eliminate the middleman, ensuring you only pay the rent and a small, refundable security deposit directly to the property owner. This saves students thousands in commission fees."
  },
  {
    question: "How do I place a bid on a property?",
    answer: "When viewing a property, you can see the owner's expected price. You can then submit a 'bid' or offer that you are willing to pay. The owner can accept, reject, or counter your offer. This live bidding process helps you secure a better deal than fixed-price listings."
  },
  {
    question: "What types of properties are listed on Roomhy?",
    answer: "We offer a wide range of properties tailored for students, including: fully furnished Hostels (shared rooms, budget-friendly), PGs (Paying Guest accommodation with meals and services), and Apartments (private flats for independent living or sharing with friends)."
  },
  {
    question: "Can I view room availability in real-time?",
    answer: "Yes, property owners are encouraged to keep their listings updated in real-time. You can filter properties based on immediate availability and expected move-in dates to ensure you only view options that suit your schedule."
  },
  {
    question: "Do I have to pay to use Roomhy as a student?",
    answer: "Searching, browsing, and contacting property owners through Roomhy is entirely free for students. Our revenue comes from value-added services offered to property owners, keeping the platform free and zero-brokerage for tenants."
  },
  {
    question: "How is Roomhy different from regular rental websites?",
    answer: "We are focused purely on student needs, ensuring all properties are near major educational hubs. We offer a unique bidding system, guarantee zero brokerage, and verify every listing to save you time and money compared to traditional, generalized rental sites."
  },
  {
    question: "Is it safe to book a property on Roomhy?",
    answer: "We prioritize your safety. Every property owner and listing is thoroughly verified by our team. The booking process is secure, and you only finalize the full payment after confirming the property details with the owner."
  },
  {
    question: "What is the booking process?",
    answer: "1. Search and find your ideal property\n2. Place your bid or contact owner\n3. Owner accepts your offer\n4. Chat and finalize details\n5. Pay ₹500 token to book\n6. Visit and verify property\n7. Move in!"
  },
  {
    question: "Can I get a refund if I don't like the property?",
    answer: "Yes! The ₹500 token amount is fully refundable if the property doesn't meet your expectations after visiting. We want you to be completely satisfied with your choice."
  },
  {
    question: "How do I contact property owners?",
    answer: "Once you find a property you like, you can use our in-app chat system to communicate directly with the owner. Ask about rent, amenities, rules, move-in date, and any other questions before making your decision."
  },
  {
    question: "Are the properties verified?",
    answer: "Yes, every property on Roomhy goes through a verification process. Our team checks the property details, photos, and owner credentials to ensure you get exactly what you see on the platform."
  }
];

export default function FAQPage() {
  useSEO({ pageKey: 'faq', fallbackTitle: 'How Roomhy Works - FAQ & Guide' });
  const [layoutSections, setLayoutSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch page layout settings from DB
  useEffect(() => {
    const fetchLayout = async () => {
      let resolved = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          if (!resolved) {
            console.warn('FAQ layout API call timed out, falling back to defaults');
            resolve({ success: false, timeout: true });
          }
        }, 3000);
      });

      try {
        const apiPromise = fetchJson('/api/page-layouts/faq');
        const res = await Promise.race([apiPromise, timeoutPromise]);
        
        resolved = true;
        if (res && res.success && res.data && res.data.sections) {
          const sorted = res.data.sections.sort((a, b) => a.order - b.order);
          setLayoutSections(sorted);
        }
      } catch (err) {
        console.warn('Failed to load FAQ page layout:', err);
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

  const renderHero = () => {
    const content = getSectionContent('faq-hero', {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about finding your perfect home'
    });
    return (
      <div 
        key="faq-hero" 
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
            {(content.title || 'FREQUENTLY ASKED QUESTIONS').toUpperCase()}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              24/7 SUPPORT
            </div>
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              HELP & GUIDES
            </div>
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              INSTANT ANSWERS
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFAQList = () => {
    return (
      <section key="faq-list" className="py-6 md:py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-2.5 md:space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <details className="group">
                  <summary className="flex justify-between items-center p-4 md:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors">
                    <span className="font-semibold text-sm md:text-lg text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <span className="text-teal-500 flex-shrink-0 group-open:rotate-180 transition-transform">
                      <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                    </span>
                  </summary>
                  <div className="px-4 pb-4 md:px-6 md:pb-6">
                    <p className="text-gray-600 text-xs md:text-base leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
              <p className="text-lg mb-6">Our support team is here to help you 24/7</p>
              <a 
                href="/website/contact" 
                className="inline-block bg-white text-teal-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const defaultOrder = ['faq-hero', 'faq-list'];
  const activeOrder = layoutSections.length > 0
    ? layoutSections.map(s => s.id)
    : defaultOrder;

  return (
    <div className="min-h-screen bg-white">
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
              case 'faq-hero': return renderHero();
              case 'faq-list': return renderFAQList();
              default: return null;
            }
          })}
        </main>
      )}

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}
