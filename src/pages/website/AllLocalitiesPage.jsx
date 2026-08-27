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

const LOCALITIES_BY_CITY = [
  {
    city: 'Kota',
    totalLocalities: '25+',
    items: [
      { area: 'Talwandi', count: '102+ PGs', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&q=70' },
      { area: 'Vigyan Nagar', count: '88+ PGs', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&q=70' },
      { area: 'Landmark City', count: '67+ PGs', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&q=70' },
      { area: 'Mahaveer Nagar', count: '74+ PGs', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&q=70' },
      { area: 'Indra Vihar', count: '54+ PGs', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=70' }
    ]
  },
  {
    city: 'Jaipur',
    totalLocalities: '30+',
    items: [
      { area: 'Malviya Nagar', count: '95+ PGs', image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=300&q=70' },
      { area: 'Vaishali Nagar', count: '85+ PGs', image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=300&q=70' },
      { area: 'Mansarovar', count: '70+ PGs', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300&q=70' },
      { area: 'C-Scheme', count: '60+ PGs', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=300&q=70' },
      { area: 'Tonk Road', count: '55+ PGs', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&q=70' }
    ]
  },
  {
    city: 'Delhi',
    totalLocalities: '40+',
    items: [
      { area: 'Kamla Nagar', count: '120+ PGs', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=70' },
      { area: 'Lajpat Nagar', count: '110+ PGs', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=300&q=70' },
      { area: 'Mukherjee Nagar', count: '150+ PGs', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&q=70' },
      { area: 'Laxmi Nagar', count: '74+ PGs', image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=300&q=70' },
      { area: 'Rohini', count: '100+ PGs', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=70' }
    ]
  },
  {
    city: 'Indore',
    totalLocalities: '25+',
    items: [
      { area: 'Vijay Nagar', count: '85+ PGs', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=300&q=70' },
      { area: 'Bhawarkua', count: '70+ PGs', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&q=70' },
      { area: 'Rau', count: '66+ PGs', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&q=70' },
      { area: 'Palasia', count: '60+ PGs', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&q=70' },
      { area: 'Annapurna Road', count: '55+ PGs', image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=300&q=70' }
    ]
  },
  {
    city: 'Bhopal',
    totalLocalities: '20+',
    items: [
      { area: 'MP Nagar', count: '75+ PGs', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&q=70' },
      { area: 'Kolar Road', count: '60+ PGs', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&q=70' },
      { area: 'Arera Colony', count: '55+ PGs', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=300&q=70' },
      { area: 'Shahpura', count: '45+ PGs', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&q=70' }
    ]
  },
  {
    city: 'Nagpur',
    totalLocalities: '15+',
    items: [
      { area: 'Ramdaspeth', count: '50+ PGs', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300&q=70' },
      { area: 'Sadar', count: '45+ PGs', image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=300&q=70' },
      { area: 'Dharampeth', count: '40+ PGs', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=70' },
      { area: 'Manish Nagar', count: '35+ PGs', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=300&q=70' }
    ]
  },
  {
    city: 'Sikar',
    totalLocalities: '16+',
    items: [
      { area: 'Piprali Road', count: '40+ PGs', image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=300&q=70' },
      { area: 'Station Road', count: '35+ PGs', image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300&q=70' },
      { area: 'Gandhi Nagar', count: '30+ PGs', image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=300&q=70' }
    ]
  },
  {
    city: 'Bangalore',
    totalLocalities: '35+',
    items: [
      { area: 'BTM Layout', count: '120+ PGs', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=300&q=70' },
      { area: 'Koramangala', count: '110+ PGs', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&q=70' },
      { area: 'HSR Layout', count: '100+ PGs', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=70' },
      { area: 'Electronic City', count: '90+ PGs', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=70' },
      { area: 'Marathahalli', count: '80+ PGs', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&q=70' }
    ]
  },
  {
    city: 'Pune',
    totalLocalities: '20+',
    items: [
      { area: 'Kothrud', count: '80+ PGs', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&q=70' },
      { area: 'Hinjewadi', count: '75+ PGs', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=300&q=70' },
      { area: 'Viman Nagar', count: '70+ PGs', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=300&q=70' },
      { area: 'Wakad', count: '60+ PGs', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300&q=70' }
    ]
  },
  {
    city: 'Hyderabad',
    totalLocalities: '20+',
    items: [
      { area: 'Gachibowli', count: '100+ PGs', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&q=70' },
      { area: 'Ameerpet', count: '90+ PGs', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=70' },
      { area: 'Kukatpally', count: '85+ PGs', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&q=70' },
      { area: 'Madhapur', count: '80+ PGs', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=300&q=70' }
    ]
  }
];

export default function AllLocalitiesPage() {
  const [selectedFilterCity, setSelectedFilterCity] = useState('All Cities');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);
  const [callbackData, setCallbackData] = useState({
    name: '',
    phone: '',
    city: 'Kota',
    budget: ''
  });

  const slugify = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const filteredGroups = LOCALITIES_BY_CITY.filter(group => {
    const matchesCityFilter = selectedFilterCity === 'All Cities' || group.city.toLowerCase() === selectedFilterCity.toLowerCase();
    if (!matchesCityFilter) return false;

    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    const cityMatches = group.city.toLowerCase().includes(lowerSearch);
    const itemMatches = group.items.some(i => i.area.toLowerCase().includes(lowerSearch));
    return cityMatches || itemMatches;
  });

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
    document.title = 'All Localities - Find PGs in Your Preferred Area | Roomhy';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <WebsiteNavbar />

      {/* --- BREADCRUMBS BAR --- */}
      <div className="bg-[#F1F5F9] border-b border-slate-200 py-2 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center text-xs font-semibold text-slate-500 gap-2 flex-wrap">
          <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/cities" className="hover:text-teal-600 transition-colors">Cities</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Localities</span>
        </div>
      </div>

      {/* --- HERO SECTION (MATCHING PDF SCREENSHOT 1) --- */}
      <section className="relative w-full py-8 md:py-12 px-4 md:px-8 bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/50 border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 z-10 relative">
          <div className="flex-1 text-left max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-2">
              All <span className="text-teal-600">Localities</span>
            </h1>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mb-3">
              Find PGs in Your <span className="text-teal-600">Preferred Area</span>
            </h2>
            <p className="text-sm text-slate-600 font-semibold leading-relaxed mb-6">
              Explore PGs in the best localities across top cities. Zero Brokerage. 100% Verified.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-none">Zero Brokerage</div>
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

            {/* Combined Search & City Filter Input Bar */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-2xl">
              <div className="flex-1 min-w-[140px] w-full">
                <select
                  value={selectedFilterCity}
                  onChange={(e) => setSelectedFilterCity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="All Cities">Select City: All Cities</option>
                  {LOCALITIES_BY_CITY.map(g => (
                    <option key={g.city} value={g.city}>{g.city}</option>
                  ))}
                </select>
              </div>

              <div className="flex-2 relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search locality..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                onClick={() => {}}
                className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Right Architecture Illustration Graphic */}
          <div className="relative w-full lg:w-[460px] h-64 md:h-72 rounded-3xl overflow-hidden shadow-xl border border-slate-200 group shrink-0">
            <img
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop"
              alt="Localities Architecture"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"></div>
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <span className="px-2.5 py-1 rounded-full bg-teal-500 text-white text-[10px] font-extrabold uppercase tracking-wider mb-1.5 inline-block">
                Top Coaching &amp; College Hubs
              </span>
              <div className="text-xl font-black">Stay Near Your Institute</div>
              <div className="text-xs text-slate-200 font-medium mt-0.5">Explore Talwandi, Vigyan Nagar, Landmark City, Malviya Nagar &amp; more.</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- BROWSE LOCALITIES BY CITY GRID (MATCHING PDF SCREENSHOT 1, 2, 3 & 4) --- */}
      <section className="py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Browse Localities by City
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1.5">
            Choose a city to explore PGs in top localities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.city}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* City Card Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900">{group.city}</h3>
                  <Link
                    to={`/properties-in-${slugify(group.city)}`}
                    className="text-xs font-extrabold text-teal-600 hover:text-teal-700 flex items-center gap-1 group"
                  >
                    <span>View all PGs in {group.city}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>

                {/* Locality Items List */}
                <div className="space-y-2.5">
                  {group.items.map((loc) => (
                    <Link
                      key={loc.area}
                      to={`/pg-in-${slugify(loc.area)}-${slugify(group.city)}`}
                      className="group/item flex items-center justify-between p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-teal-50/50 hover:border-teal-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={loc.image}
                          alt={`${loc.area}, ${group.city}`}
                          className="w-10 h-10 object-cover rounded-xl shrink-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover/item:text-teal-700 transition-colors">
                            {loc.area}, {group.city}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500">{loc.count}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover/item:text-teal-600 group-hover/item:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Bottom Locality Counter Link Button */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <Link
                  to={`/properties-in-${slugify(group.city)}`}
                  className="w-full py-2.5 px-4 bg-teal-50/80 hover:bg-teal-100/80 text-teal-700 font-extrabold text-xs rounded-2xl text-center block transition-colors border border-teal-100"
                >
                  View all {group.totalLocalities} localities →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 my-8">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-800">No localities found matching "{searchTerm}"</h3>
            <p className="text-xs text-slate-500 mt-1">Try selecting a city or clearing your search query</p>
          </div>
        )}
      </section>

      {/* --- CAN'T FIND THE RIGHT LOCALITY? (CALLBACK BANNER MATCHING PDF SCREENSHOT 3 & 4) --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-teal-700 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Info Text */}
            <div className="lg:col-span-5 text-left">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-3 inline-block">
                Area Search Assistance
              </span>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-3">
                Can't Find the Right Locality? Let Roomhy Find It for You!
              </h2>
              <p className="text-xs sm:text-sm text-teal-50 font-medium leading-relaxed mb-6">
                Submit your details, bid your budget, and let our team find the best matching PG in your preferred area.
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
                  <span>Zero Brokerage</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/15">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>100% Verified</span>
                </div>
              </div>
            </div>

            {/* Right Callback Form */}
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
                      {LOCALITIES_BY_CITY.map(c => (
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

      {/* --- TRUST STATS STRIP (MATCHING PDF SCREENSHOT 4) --- */}
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
