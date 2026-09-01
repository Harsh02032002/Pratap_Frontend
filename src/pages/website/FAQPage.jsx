import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { ChevronDown, HelpCircle, Search, MessageSquare } from 'lucide-react';
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
      className="min-h-screen flex flex-col font-sans selection:bg-teal-500 selection:text-white"
      style={{ background: 'linear-gradient(135deg, #F5FAFF 0%, #F2FBF9 50%, #F8FFFD 100%)' }}
    >
      <WebsiteNavbar />

      <main className="flex-grow">
        {/* --- HERO BANNER --- */}
        <section
          className="relative border-b border-[#DCE7EF]/80 text-slate-900 py-12 md:py-16 px-4 md:px-8 overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 50% 20%, rgba(15,165,150,0.08), transparent 55%), linear-gradient(180deg, #FFFFFF 0%, #F5FAFF 100%)'
          }}
        >
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50/80 border border-teal-200/80 text-[#0FA596] text-xs font-extrabold mb-3.5 shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5 text-[#0FA596]" />
              <span>Help Center &amp; FAQs</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-3 leading-tight">
              Frequently Asked <span className="text-[#0FA596]">Questions</span>
            </h1>

            <p className="text-sm md:text-base text-slate-600 max-w-lg mx-auto font-medium leading-relaxed mb-6">
              Have questions about zero brokerage, room verification, fast bidding, or refunds? Find instant answers below.
            </p>

            {/* Search Input Bar */}
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any question (e.g. bidding, refund, brokerage)..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#DCE7EF] rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 shadow-[0_4px_18px_rgba(15,23,42,0.04)] focus:outline-none focus:border-[#0FA596] focus:ring-2 focus:ring-[#0FA596]/15 transition-all"
              />
            </div>
          </div>
        </section>

        {/* --- FAQ CONTENT & CATEGORIES --- */}
        <section className="py-12 md:py-16 px-4 md:px-8 max-w-4xl mx-auto">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {faqCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0FA596] text-white shadow-sm'
                    : 'bg-white border border-[#DCE7EF] text-slate-700 hover:border-[#62CFC0] hover:text-[#0FA596]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ Accordion List */}
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#DCE7EF] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No matching questions found</h3>
              <p className="text-xs text-slate-500 mt-1">Try searching with a different keyword or view all questions.</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="mt-4 px-4 py-2 bg-teal-50 text-[#0FA596] border border-teal-200/80 rounded-xl text-xs font-extrabold hover:bg-teal-100 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredFaqs.map((faq) => {
                const isOpen = openIndex === faq.id;
                return (
                  <div 
                    key={faq.id}
                    className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen ? 'border-[#0FA596] shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-2 ring-[#0FA596]/15' : 'border-[#DCE7EF] shadow-[0_4px_18px_rgba(15,23,42,0.04)] hover:border-[#62CFC0]'
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left font-extrabold text-slate-900 text-sm md:text-base gap-4 cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-teal-50 text-[#0FA596] border border-teal-100 flex items-center justify-center text-xs font-black shrink-0">
                          ?
                        </span>
                        {faq.question}
                      </span>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen ? 'bg-[#0FA596] text-white rotate-180' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 text-xs md:text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --- STILL HAVE QUESTIONS CTA --- */}
          <div className="mt-12 bg-white rounded-3xl p-8 border border-[#DCE7EF] shadow-[0_4px_18px_rgba(15,23,42,0.04)] text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0FA596] border border-teal-100 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">Still have questions?</h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium max-w-md mx-auto mb-5">
              Can't find the answer you're looking for? Contact our 24/7 support team directly.
            </p>
            <Link
              to="/contact-us"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0FA596] hover:bg-teal-700 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md hover:shadow-teal-600/25 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>Contact Support Team</span>
            </Link>
          </div>

        </section>
      </main>

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}

