import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WebsiteNavbar from '../../components/website/WebsiteNavbar';
import WebsiteFooter from '../../components/website/WebsiteFooter';
import MobileBottomNav from '../../components/website/MobileBottomNav';
import FastBiddingModal from '../../components/website/FastBiddingModal';
import { 
  ChevronRight, 
  Search, 
  Shield, 
  Check, 
  Star, 
  Headphones, 
  Building2, 
  MapPin, 
  Send 
} from 'lucide-react';
import toast from 'react-hot-toast';

const CITIES_DATA = [
  { city: 'Kota', state: 'Rajasthan', count: '512+ PGs', image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop' },
  { city: 'Jaipur', state: 'Rajasthan', count: '320+ PGs', image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=800&auto=format&fit=crop' },
  { city: 'Delhi', state: 'Delhi NCR', count: '780+ PGs', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop' },
  { city: 'Indore', state: 'Madhya Pradesh', count: '210+ PGs', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop' },
  { city: 'Bhopal', state: 'Madhya Pradesh', count: '190+ PGs', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop' },
  { city: 'Nagpur', state: 'Maharashtra', count: '150+ PGs', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop' },
  { city: 'Sikar', state: 'Rajasthan', count: '120+ PGs', image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&auto=format&fit=crop' },
  { city: 'Bangalore', state: 'Karnataka', count: '600+ PGs', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop' },
  { city: 'Pune', state: 'Maharashtra', count: '430+ PGs', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop' },
  { city: 'Hyderabad', state: 'Telangana', count: '380+ PGs', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop' }
];

export default function AllCitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);
  const [callbackData, setCallbackData] = useState({
    name: '',
    phone: '',
    city: 'Kota',
    budget: ''
  });

  const slugify = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const filteredCities = CITIES_DATA.filter(c => 
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCallbackSubmit = (e) => {
    e.preventDefault();
    if (!callbackData.name || !callbackData.phone) {
      toast.error('Please enter your name and phone number');
      return;
    }
    toast.success('Thank you! Our Roomhy team will contact you shortly.');
    setCallbackData({ name: '', phone: '', city: 'Kota', budget: '' });
  };

  useEffect(() => {
    document.title = 'All Cities - Find Verified PGs & Hostels | Roomhy';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <WebsiteNavbar />

      {/* --- BREADCRUMBS BAR --- */}
      <div className="bg-[#F1F5F9] border-b border-slate-200 py-2 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center text-xs font-semibold text-slate-500 gap-2">
          <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Cities</span>
        </div>
      </div>

      {/* --- HERO SECTION (MATCHING PDF SCREENSHOT 1) --- */}
      <section className="relative w-full py-8 md:py-12 px-4 md:px-8 bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/50 border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 z-10 relative">
          <div className="flex-1 text-left max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
              All <span className="text-teal-600">Cities</span>
            </h1>
            <p className="text-sm md:text-base text-slate-600 font-semibold leading-relaxed mb-6">
              Find verified PGs in top cities across India.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-none">Smart Bidding</div>
                  <div className="text-[9px] text-slate-500 font-medium">No hidden charges</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-none">Verified Properties</div>
                  <div className="text-[9px] text-slate-500 font-medium">100% verified listings</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-none">Trusted by Students</div>
                  <div className="text-[9px] text-slate-500 font-medium">50,000+ happy stays</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-none">24/7 Support</div>
                  <div className="text-[9px] text-slate-500 font-medium">Always here to help</div>
                </div>
              </div>
            </div>

            {/* Floating Search Bar Input */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search city..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>
          </div>

          {/* Right Architectural Illustration Graphic */}
          <div className="relative w-full lg:w-[460px] h-64 md:h-72 rounded-3xl overflow-hidden shadow-xl border border-slate-200 group shrink-0">
            <img
              src="https://images.unsplash.com/photo-1548013146-72479768bada?w=1000&auto=format&fit=crop"
              alt="Indian Cities Architecture"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"></div>
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <span className="px-2.5 py-1 rounded-full bg-teal-500 text-white text-[10px] font-extrabold uppercase tracking-wider mb-1.5 inline-block">
                Top Student Hubs
              </span>
              <div className="text-xl font-black">Find Stays in 50+ Cities</div>
              <div className="text-xs text-slate-200 font-medium mt-0.5">Explore Kota, Jaipur, Delhi, Indore &amp; more with Smart Bidding.</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- EXPLORE PGS IN TOP CITIES GRID (MATCHING PDF SCREENSHOT 1 & 2) --- */}
      <section className="py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Explore PGs in Top Cities
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1.5">
            Choose a city to find PGs, Hostels and Co-living spaces that suit your lifestyle and budget.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {filteredCities.map((item) => (
            <Link
              key={item.city}
              to={`/pg-in-${slugify(item.city)}`}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="h-44 sm:h-48 overflow-hidden relative">
                <img
                  src={item.image}
                  alt={`PG in ${item.city}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                  {item.state}
                </div>
              </div>

              <div className="p-4 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-teal-600 transition-colors">
                    PG in {item.city}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">{item.count}</p>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-100">
                      PGs
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-extrabold border border-purple-100">
                      Hostels
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-100">
                      Co-living
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-teal-600 group-hover:text-teal-700">
                  <span>Explore {item.city}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredCities.length === 0 && (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 my-8">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-800">No cities found matching "{searchTerm}"</h3>
            <p className="text-xs text-slate-500 mt-1">Try searching for Kota, Jaipur, Delhi, Indore or Bhopal</p>
          </div>
        )}
      </section>

      {/* --- CAN'T DECIDE WHICH CITY OR PG IS RIGHT FOR YOU? (CALLBACK BANNER MATCHING PDF SCREENSHOT 2 & 3) --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-teal-700 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Info Text & Illustration */}
            <div className="lg:col-span-5 text-left">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-3 inline-block">
                Free Assistance
              </span>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-3">
                Can't Decide Which City or PG is Right for You?
              </h2>
              <p className="text-xs sm:text-sm text-teal-50 font-medium leading-relaxed mb-6">
                Submit your details, bid your budget, and let Roomhy find the best matching PG for you with Smart Bidding.
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/15">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>You Bid Your Budget</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/15">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Best Matching PGs</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/15">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Smart Bidding</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/15">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>100% Verified</span>
                </div>
              </div>
            </div>

            {/* Right Callback Request Form Box */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 text-slate-900 shadow-lg">
              <form onSubmit={handleCallbackSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={callbackData.name}
                      onChange={(e) => setCallbackData({ ...callbackData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={callbackData.phone}
                      onChange={(e) => setCallbackData({ ...callbackData, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Preferred City</label>
                    <select
                      value={callbackData.city}
                      onChange={(e) => setCallbackData({ ...callbackData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500 bg-white"
                    >
                      {CITIES_DATA.map(c => (
                        <option key={c.city} value={c.city}>{c.city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Your Budget (₹)</label>
                    <input
                      type="text"
                      value={callbackData.budget}
                      onChange={(e) => setCallbackData({ ...callbackData, budget: e.target.value })}
                      placeholder="e.g. 7000 - 10000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit &amp; Find My PG →</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* --- TRUST STATS STRIP (MATCHING PDF SCREENSHOT 3) --- */}
      <section className="bg-white border-t border-slate-200 py-8 px-4 md:px-8 mb-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-2xl md:text-3xl font-black text-teal-600">50,000+</div>
            <div className="text-xs font-bold text-slate-600 mt-1">Happy Students</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-2xl md:text-3xl font-black text-emerald-600">10,000+</div>
            <div className="text-xs font-bold text-slate-600 mt-1">Verified PGs</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-2xl md:text-3xl font-black text-purple-600">50+</div>
            <div className="text-xs font-bold text-slate-600 mt-1">Top Cities</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-2xl md:text-3xl font-black text-amber-600">0%</div>
            <div className="text-xs font-bold text-slate-600 mt-1">Brokerage</div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
      <MobileBottomNav />

      <FastBiddingModal 
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
      />
    </div>
  );
}
