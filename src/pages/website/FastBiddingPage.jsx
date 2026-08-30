import { useState, useEffect, useRef, useMemo } from 'react';
import { Zap, ArrowLeft, Send, Loader, CheckCircle, Shield, Info } from 'lucide-react';
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { fetchCities, fetchAreas, fetchProperties, resolvePropertyOwnerLoginId } from '../../utils/api';
import { getWebsiteUser, getWebsiteUserId, getWebsiteUserName, getWebsiteUserEmail, isWebsiteLoggedIn } from '../../utils/websiteSession';

const defaultCities = [
  { _id: 'kota', name: 'Kota, Rajasthan' },
  { _id: 'sikar', name: 'Sikar, Rajasthan' },
  { _id: 'indore', name: 'Indore, Madhya Pradesh' },
];

export default function FastBiddingPage() {
  useEffect(() => {
    if (window.location.pathname !== '/fast-bidding') {
      window.history.replaceState(null, '', '/fast-bidding');
    }
  }, []);

  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const propertiesFetched = useRef(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  const [form, setForm] = useState({
    fullName: '',
    gmail: '',
    gender: '',
    city: '',
    area: '',
    budgetQuery: ''
  });

  const apiUrl = useMemo(() => {
    return import.meta.env?.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : 'https://roohmy-backend-xwa9.vercel.app');
  }, []);

  useEffect(() => {
    const user = getWebsiteUser();
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: getWebsiteUserName() || '',
        gmail: getWebsiteUserEmail() || ''
      }));
    }
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const data = await fetchCities();
        setCities(data.length > 0 ? data : defaultCities);
      } catch {
        setCities(defaultCities);
      }
    };
    loadCities();
  }, []);

  useEffect(() => {
    const loadAreas = async () => {
      if (!form.city) {
        setAreas([]);
        return;
      }
      const cityLower = form.city.toLowerCase().trim();
      const getPropertyLocalities = () => {
        return (allProperties || [])
          .filter(p => {
            const pCity = String(p.city || p.propertyInfo?.city || p.cityName || '').toLowerCase().trim();
            return pCity === cityLower || pCity.includes(cityLower) || cityLower.includes(pCity);
          })
          .map(p => p.locality || p.area || p.propertyInfo?.area || p.propertyInfo?.locality || '')
          .filter(Boolean);
      };

      try {
        const allAreas = await fetchAreas();
        const filtered = allAreas.filter(a => {
          if (typeof a === 'string') return a.toLowerCase().includes(cityLower);
          const cityNameInArea = String(
            (typeof a.city === 'string' ? a.city : a.city?.name) ||
            a.cityName ||
            a.city_name ||
            ''
          ).toLowerCase().trim();
          const cityIdStr = String(a.cityId || a.city?._id || (typeof a.city === 'object' ? a.city?._id : '') || '').toLowerCase().trim();

          return (
            cityNameInArea === cityLower ||
            (cityNameInArea && (cityNameInArea.includes(cityLower) || cityLower.includes(cityNameInArea))) ||
            cityIdStr === cityLower
          );
        });

        const areaNames = filtered.map(a => typeof a === 'string' ? a : (a.name || a.areaName || a.title || '')).filter(Boolean);
        const propAreas = getPropertyLocalities();
        const combined = [...new Set([...areaNames, ...propAreas])];

        setAreas(combined.map(name => typeof name === 'string' ? { name } : name));
      } catch {
        const propAreas = [...new Set(getPropertyLocalities())];
        setAreas(propAreas.map(name => ({ name })));
      }
    };
    loadAreas();
  }, [form.city, allProperties]);

  // Fetch ALL properties once on mount — shared cache via fetchProperties()
  useEffect(() => {
    if (propertiesFetched.current) return;
    propertiesFetched.current = true;
    const load = async () => {
      try {
        const data = await fetchProperties();
        const live = data.filter(p =>
          p.isLiveOnWebsite === true || p.status === 'live' || p.status === 'approved'
        );
        
        // Deduplicate properties by visitId, propertyId, or _id
        const uniqueMap = new Map();
        live.forEach(p => {
          const key = p.visitId || p.propertyId || p._id || String(Math.random());
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, p);
          }
        });
        const dedupedProperties = Array.from(uniqueMap.values());
        
        setAllProperties(dedupedProperties);
      } catch {
        setAllProperties([]);
      }
    };
    load();
  }, []);

  // Filter in memory whenever form filters or allProperties change — no API call
  useEffect(() => {
    if (!form.area) {
      setProperties([]);
      return;
    }
    setLoading(true);

    const selectedArea = areas.find(a => (a._id || a.id) === form.area);
    const areaName = selectedArea?.name?.toLowerCase()?.trim() || '';
    const gender = form.gender.toLowerCase();
    
    let parsedMin = null;
    let parsedMax = null;

    if (form.budgetQuery) {
      const q = form.budgetQuery.trim();
      if (q.startsWith('<') || q.startsWith('<=')) {
        parsedMax = parseInt(q.replace(/[^0-9]/g, ''), 10);
      } else if (q.startsWith('>') || q.startsWith('>=')) {
        parsedMin = parseInt(q.replace(/[^0-9]/g, ''), 10);
      } else if (q.startsWith('=')) {
        const val = parseInt(q.replace(/[^0-9]/g, ''), 10);
        parsedMin = val;
        parsedMax = val;
      } else if (q.includes('-')) {
        const parts = q.split('-');
        parsedMin = parseInt(parts[0].replace(/[^0-9]/g, ''), 10);
        parsedMax = parseInt(parts[1].replace(/[^0-9]/g, ''), 10);
      } else {
        parsedMax = parseInt(q.replace(/[^0-9]/g, ''), 10);
      }
    }

    const filtered = allProperties.filter(prop => {
      const propInfo = prop.propertyInfo || {};
      const propArea = (prop.locality || propInfo.area || '').toString().toLowerCase().trim();

      if (areaName) {
        const areaMatch = propArea.includes(areaName) || areaName.includes(propArea);
        if (!propArea || !areaMatch) return false;
      }

      if (gender) {
        const propGender = (prop.gender || propInfo.gender || prop.genderSuitability || '').toString().toLowerCase();
        const genderMatch = propGender.includes('co-ed') || propGender.includes(gender) || gender.includes(propGender);
        if (propGender && !genderMatch) return false;
      }

      if (parsedMin || parsedMax) {
        const rent = parseInt(prop.monthlyRent || prop.rent || propInfo.rent || propInfo.monthlyRent, 10);
        const bufferedMax = parsedMax ? parsedMax + 3000 : null; // +₹3000 buffer logic

        if (Number.isFinite(rent)) {
          if (parsedMin && rent < parsedMin) return false;
          if (bufferedMax && rent > bufferedMax) return false;
        }
      }

      return true;
    });

    setProperties(filtered);
    setLoading(false);
  }, [form.area, form.gender, form.budgetQuery, areas, allProperties]);

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const validateForm = () => {
    if (!form.fullName.trim()) return false;
    if (!form.gmail.trim() || !form.gmail.includes('@')) return false;
    if (!form.gender) return false;
    if (!form.city || !form.area) return false;
    if (!form.budgetQuery) return false;
    return true;
  };

  const submitBids = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Please fill in all required fields correctly');
      return;
    }

    if (!isWebsiteLoggedIn()) {
      setSignupEmail(form.gmail);
      setShowSignupModal(true);
      return;
    }

    if (properties.length === 0) {
      alert('No matching properties found in this area');
      return;
    }

    // Show success modal immediately, send bids in background
    setSuccessCount(properties.length);
    setShowSuccessModal(true);

    const userId = getWebsiteUserId() || getWebsiteUser()?.loginId || '';
    const selectedCity = cities.find(c => (c._id || c.id) === form.city);
    const selectedArea = areas.find(a => (a._id || a.id) === form.area);
    
    let parsedMin = null; let parsedMax = null;
    if (form.budgetQuery) {
      const q = form.budgetQuery.trim();
      if (q.startsWith('<') || q.startsWith('<=')) { parsedMax = parseInt(q.replace(/[^0-9]/g, ''), 10); }
      else if (q.startsWith('>') || q.startsWith('>=')) { parsedMin = parseInt(q.replace(/[^0-9]/g, ''), 10); }
      else if (q.startsWith('=')) { const v = parseInt(q.replace(/[^0-9]/g, ''), 10); parsedMin = v; parsedMax = v; }
      else if (q.includes('-')) { const p = q.split('-'); parsedMin = parseInt(p[0].replace(/[^0-9]/g, ''), 10); parsedMax = parseInt(p[1].replace(/[^0-9]/g, ''), 10); }
      else { parsedMax = parseInt(q.replace(/[^0-9]/g, ''), 10); }
    }

    for (const [index, property] of properties.entries()) {
      try {
        const propertyId = property._id || property.propertyNumber || property.propertyId || `${property.property_name || property.propertyInfo?.name || 'property'}-${index}`;
        const ownerId = resolvePropertyOwnerLoginId(property);
        if (!ownerId) continue;

        const bidData = {
          property_id: propertyId,
          property_name: property.property_name || property.propertyInfo?.name || 'Property',
          area: property.locality || property.propertyInfo?.area || '',
          property_type: property.propertyType || property.propertyInfo?.propertyType || 'Property',
          rent_amount: parseInt(property.monthlyRent || property.rent || property.propertyInfo?.rent || 0, 10),
          user_id: userId,
          owner_id: ownerId,
          name: form.fullName,
          email: form.gmail,
          phone: '',
          request_type: 'bid',
          bid_amount: Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : (Number.isFinite(parsedMin) && parsedMin > 0 ? parsedMin : 7000),
          bid_min: Number.isFinite(parsedMin) && parsedMin > 0 ? parsedMin : null,
          bid_max: Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : null,
          filter_criteria: {
            gender: form.gender,
            city_id: form.city,
            city: selectedCity?.name || selectedCity?.cityName || '',
            area_id: form.area,
            area: selectedArea?.name || selectedArea?.area_name || '',
            min_price: Number.isFinite(parsedMin) && parsedMin > 0 ? parsedMin : null,
            max_price: Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : null,
            property_type: property.propertyType || property.propertyInfo?.propertyType || 'Property'
          },
          message: `Looking for property with budget: ${form.budgetQuery}, Gender: ${form.gender}`
        };

        await fetch(`${apiUrl}/api/booking/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bidData)
        });
      } catch {
        // ignore individual failures
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <WebsiteNavbar />

      <main className="flex-grow flex items-center justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-[calc(100vh-140px)]">
        {/* Background Decorative Blur Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-50 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-gray-100 my-4">
          
          {/* Left Side: Branding & Info Panel (Same as Login/Signup) */}
          <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 text-white relative">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
            </div>
            
            <div className="relative">
              <img 
                src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" 
                alt="Roomhy Logo" 
                className="h-8 w-auto mb-8 brightness-0 invert" 
              />
              <h1 className="text-3xl font-extrabold tracking-tight mb-4 leading-tight">
                Get the best stay within your <span className="text-teal-400">budget</span>.
              </h1>
              <p className="text-sm text-gray-300 mb-8 leading-relaxed">
                Set your budget &amp; send 1-click bid requests directly to verified property owners in your preferred area.
              </p>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                    <Shield className="text-teal-400 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Direct Owner Connection</p>
                    <p className="text-[11px] text-gray-300">No broker interference or hidden charges</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Zap className="text-blue-400 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">1-Click Multi-Property Bidding</p>
                    <p className="text-[11px] text-gray-300">Send custom budget offer to all matching stays</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Info className="text-purple-400 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Zero Brokerage Guaranteed</p>
                    <p className="text-[11px] text-gray-300">Save money with transparent direct pricing</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-8 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-300 font-medium">Matching Properties</p>
                  <p className="text-lg font-black text-teal-400">{properties.length} Stays Available</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  Ready to Bid
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Fast Bidding Form */}
          <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center bg-white">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Fast Bidding Form</h2>
              <p className="text-sm text-gray-500">Fill in your details to send 1-click bids directly to property owners.</p>
            </div>

            <form onSubmit={submitBids} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-1">Full Name *</label>
                <div className="relative group">
                  <input
                    type="text"
                    id="fullName"
                    required
                    value={form.fullName}
                    onChange={handleFormChange}
                    placeholder="Enter your full name"
                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-1">Email Address *</label>
                <div className="relative group">
                  <input
                    type="email"
                    id="gmail"
                    required
                    value={form.gmail}
                    onChange={handleFormChange}
                    placeholder="your.email@gmail.com"
                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-1">Gender *</label>
                <div className="relative group">
                  <select
                    id="gender"
                    required
                    value={form.gender}
                    onChange={handleFormChange}
                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none text-sm font-medium cursor-pointer"
                  >
                    <option value="">Select gender suitability</option>
                    <option value="male">Boys / Male</option>
                    <option value="female">Girls / Female</option>
                    <option value="other">Co-ed / Any</option>
                  </select>
                </div>
              </div>

              {/* City & Area Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 ml-1">City *</label>
                  <div className="relative group">
                    <select
                      id="city"
                      required
                      value={form.city}
                      onChange={handleFormChange}
                      className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none text-sm font-medium cursor-pointer"
                    >
                      <option value="">Select City</option>
                      {cities.map(city => (
                        <option key={city._id || city.id} value={city._id || city.id}>
                          {city.name || city.cityName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 ml-1">Area / Locality *</label>
                  <div className="relative group">
                    <select
                      id="area"
                      required
                      disabled={!form.city}
                      value={form.area}
                      onChange={handleFormChange}
                      className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none text-sm font-medium cursor-pointer disabled:opacity-50"
                    >
                      <option value="">{form.city ? 'Select Area' : 'First select city'}</option>
                      {areas.map(area => (
                        <option key={area._id || area.id} value={area._id || area.id}>
                          {area.name || area.areaName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Budget Query */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-1">Monthly Budget Query *</label>
                <div className="relative group">
                  <input
                    type="text"
                    id="budgetQuery"
                    required
                    value={form.budgetQuery}
                    onChange={handleFormChange}
                    placeholder="e.g. 7000 or < 8000 or 5000-8000"
                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all outline-none text-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-teal-600 font-semibold mt-1 ml-1">
                  Properties up to +₹3,000 negotiation buffer are auto-included.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 space-y-3">
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/25 active:scale-[0.98] text-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Bids ({properties.length} Properties)</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setForm({ fullName: '', gmail: '', gender: '', city: '', area: '', budgetQuery: '' })}
                  className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors text-center cursor-pointer"
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <div className="mb-20">
        <WebsiteFooter />
      </div>

      <MobileBottomNav />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Bid Sent Successfully!</h2>
              <p className="text-slate-500 text-xs font-medium">Your budget offer has been dispatched to matching owners.</p>
            </div>
            <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-4 mb-6 text-center">
              <p className="text-xs font-bold text-emerald-900">Bids sent to: <span className="text-base font-black text-emerald-700">{successCount} Properties</span></p>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">Owners will review your proposal and respond shortly.</p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-teal-500/25 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Signup Modal — shown when user is not logged in */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Account Verification</h2>
                  <p className="mt-0.5 text-xs text-slate-500 font-medium">Create an account to continue bidding.</p>
                </div>
                <button
                  onClick={() => setShowSignupModal(false)}
                  className="rounded-full border border-slate-200 p-2 text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{signupEmail}</p>
              </div>
              <p className="text-center text-slate-600 text-xs mb-5 font-medium leading-relaxed">
                <span className="font-bold text-slate-900">No account found</span> for this email. Please create an account to verify your identity and send direct bids.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-semibold mb-6 bg-slate-50/80 border border-slate-200/80 rounded-xl p-4">
                <li className="flex items-center"><span className="mr-2 font-bold text-emerald-600">✓</span> 100% Verified Tenant Account</li>
                <li className="flex items-center"><span className="mr-2 font-bold text-emerald-600">✓</span> Unlimited Direct Bidding</li>
                <li className="flex items-center"><span className="mr-2 font-bold text-emerald-600">✓</span> Real-time Owner Responses</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignupModal(false)}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { window.location.href = '/signup'; }}
                  className="flex-1 rounded-2xl bg-teal-600 hover:bg-teal-700 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-teal-500/25 active:scale-95 transition-all uppercase tracking-wider"
                >
                  Sign Up Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


