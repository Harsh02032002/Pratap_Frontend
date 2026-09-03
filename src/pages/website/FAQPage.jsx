import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { ChevronDown, HelpCircle, Search, MessageSquare, ShieldCheck, CheckCircle2, PhoneCall, Sparkles } from 'lucide-react';
import { Link } from "react-router-dom";
import useSEO from "../../hooks/useSEO";

const faqCategories = [
  { id: 'all', label: 'All Questions' },
  { id: 'general', label: 'General & Stays' },
  { id: 'bidding', label: 'Fast Bidding & Rent' },
  { id: 'booking', label: 'Booking & Refunds' },
  { id: 'safety', label: 'Safety & Verification' }
];

const faqData = [
  {
    id: 1,
    category: 'general',
    question: "What is Roomhy and how does it work?",
    answer: "Roomhy is India's premier student accommodation platform connecting students directly with verified property owners. You search, shortlist, and book PGs, Hostels, and Apartments with 100% Zero Brokerage. You can also place custom budget bids directly to property owners."
  },
  {
    id: 2,
    category: 'general',
    question: "Is Roomhy completely broker-free?",
    answer: "Yes, absolutely. Our core promise is zero brokerage. We eliminate middlemen completely, ensuring you only pay your rent and a small, refundable security deposit directly to the property owner."
  },
  {
    id: 3,
    category: 'bidding',
    question: "How does the Fast Bidding system work?",
    answer: "Fast Bidding allows you to set your target monthly budget for your preferred location and room type. Property owners in that locality review your bid and accept or counter-offer in real-time, helping you secure student housing below market rates."
  },
  {
    id: 4,
    category: 'general',
    question: "What types of properties are listed on Roomhy?",
    answer: "We list verified Hostels (shared & single rooms with food options), PGs (Paying Guest accommodations with full amenities), Co-living spaces, and independent Apartments for students and working professionals."
  },
  {
    id: 5,
    category: 'booking',
    question: "What is the token booking amount and is it refundable?",
    answer: "When an owner accepts your bid or listing enquiry, you pay a small ₹500 token amount to reserve the room. This token is 100% fully refundable if the property doesn't match your expectations upon physical visit."
  },
  {
    id: 6,
    category: 'booking',
    question: "How do I request a refund?",
    answer: "You can submit a refund request directly on our website via the Refund Request page or My Stays dashboard. Refunds are processed back to your original payment method or UPI within 2-4 business days."
  },
  {
    id: 7,
    category: 'safety',
    question: "Are all properties on Roomhy verified?",
    answer: "Yes. Every property listed undergoes multi-step verification including owner ID check, physical room inspection, and amenity audits to ensure what you see online is exactly what you get."
  },
  {
    id: 8,
    category: 'bidding',
    question: "Can I contact the property owner directly?",
    answer: "Yes! Once you submit a bid or booking enquiry, our in-app chat opens up direct communication between you and the verified owner so you can ask about food menus, rules, and move-in dates."
  },
  {
    id: 9,
    category: 'general',
    question: "Do students have to pay any subscription or platform fee?",
    answer: "No. Searching, browsing listings, placing bids, and chatting with property owners is 100% FREE for all students."
  }
];

export default function FAQPage() {
  useSEO({ pageKey: 'faq', fallbackTitle: 'How Roomhy Works - FAQ & Student Guide | Roomhy.com' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    if (window.location.pathname !== '/faq') {
      window.history.replaceState(null, '', '/faq');
    }
  }, []);

  const toggleAccordion = (id) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-[#F4F7F6] text-slate-900 selection:bg-teal-500 selection:text-white"
    >
      <WebsiteNavbar />

      <main className="flex-grow">

        {/* ================================================================
         * 1. HERO — FULL SECTION BACKGROUND PHOTO (EDGE-TO-EDGE WITH SOFT LEFT OVERLAY)
         * ================================================================ */}
        <section className="relative border-b border-slate-200/80 text-slate-900 py-8 sm:py-10 px-4 sm:px-8 lg:px-14 overflow-hidden bg-slate-900 flex items-center min-h-[380px]">
          
          {/* Full Width Background Photo Layer (Edge-to-Edge Across 100% Section) */}
          <div 
            className="absolute inset-0 bg-cover bg-center md:bg-[center_right] opacity-100 z-0 brightness-105"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1980&auto=format&fit=crop')` }}
          />

          {/* Rich White Opacity Overlay for 100% text readability & background visibility */}
          <div 
            className="absolute inset-0 z-0"
            style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.90) 50%, rgba(255,255,255,0.35) 100%)' }}
          ></div>

          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            
            {/* Left Column: Direct Dark Typography */}
            <div className="w-full md:max-w-[500px] lg:max-w-[540px] text-left space-y-3.5 text-slate-900">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-teal-200 text-[#0FA596] text-[10px] sm:text-xs font-black tracking-wide shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#0FA596] animate-pulse" />
                <span className="uppercase tracking-wider">Help Center &amp; Student FAQs</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Frequently Asked <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Questions &amp; Guide.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                Have questions about zero brokerage, room verification, fast bidding, token amounts, or refunds? Find instant answers below.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl pt-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4 text-[#0FA596]" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search any question (e.g. bidding, refunds, Kota hostels)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/90 backdrop-blur-md rounded-xl border border-teal-200 text-xs font-semibold focus:border-[#0FA596] focus:ring-2 focus:ring-[#0FA596]/20 outline-none transition-all shadow-xs"
                />
              </div>

              {/* Trust Indicators Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-300/80 text-[11px] font-black text-slate-800 tracking-wide uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-[#0FA596]" />
                  </div>
                  <span>Instant Answers</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span>Zero Brokerage</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Right Column: Open space */}
            <div className="hidden md:block w-full md:w-1/2"></div>

          </div>
        </section>

        {/* --- MAIN FAQ CONTENT --- */}
        <section className="py-10 px-4 md:px-8 max-w-5xl mx-auto">

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {faqCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0FA596] text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 hover:bg-teal-50 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ Accordion List */}
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-900">No questions found matching "{searchTerm}"</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Try searching for a different keyword or browse all categories above.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredFaqs.map((faq) => {
                const isOpen = openIndex === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'border-[#0FA596] shadow-md ring-2 ring-[#0FA596]/10'
                        : 'border-slate-200/90 shadow-2xs hover:border-teal-300'
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                        {faq.question}
                      </span>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen ? 'bg-teal-50 text-[#0FA596] rotate-180' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Need More Help Box */}
          <div className="mt-12 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white text-center shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left space-y-1">
              <h3 className="text-lg md:text-xl font-black text-white">Still have questions?</h3>
              <p className="text-xs md:text-sm text-slate-300 font-medium">Can't find the answer you're looking for? Please chat with our friendly team.</p>
            </div>
            <Link
              to="/contact-us"
              className="px-6 py-3 rounded-xl bg-[#0FA596] hover:bg-teal-500 text-white font-extrabold text-xs shadow-lg transition-all hover:scale-105 shrink-0 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Support</span>
            </Link>
          </div>

        </section>

      </main>

      <WebsiteFooter />

      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
