import { useState, useEffect, useRef, useMemo } from 'react';
import { Zap, ArrowLeft, Send, Loader, CheckCircle, Shield, Info, Sparkles, ShieldCheck, CheckCircle2, PhoneCall } from 'lucide-react';
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { fetchCities, fetchAreas, fetchProperties, resolvePropertyOwnerLoginId } from '../../utils/api';
import { getWebsiteUser, getWebsiteUserId, getWebsiteUserName, getWebsiteUserEmail, isWebsiteLoggedIn } from '../../utils/websiteSession';
import { toast } from 'react-hot-toast';

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
  const [resultCategory, setResultCategory] = useState(null);
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

  // ─── Real-time: Owner responded to bid → Show notification toast ───
  useEffect(() => {
    if (typeof window === 'undefined' || !isWebsiteLoggedIn()) return;
    // Use global socket if available (shared from app-level socket init)
    const socket = window.__roomhySocket;
    if (!socket) return;

    const handleOwnerResponded = (payload) => {
      const msg = payload?.title || '💬 Owner responded to your bid! Open Chat to connect.';
      toast.success(msg, {
        duration: 8000,
        icon: '💬',
        style: { background: '#0f172a', color: '#fff', borderRadius: '12px' }
      });
    };
    socket.on('bid_owner_responded', handleOwnerResponded);
    return () => socket.off('bid_owner_responded', handleOwnerResponded);
  }, []);
  // ──────────────────────────────────────────────────────────────────

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
        const bufferedMax = parsedMax ? parsedMax + 2500 : null; // +₹2500 buffer logic

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
      toast.error('Please fill in all required fields correctly');
      return;
    }

    if (!isWebsiteLoggedIn()) {
      setSignupEmail(form.gmail);
      setShowSignupModal(true);
      return;
    }

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

    const budgetLimit = parsedMax || parsedMin || 10000;
    const exactMatches = properties.filter(p => parseInt(p.monthlyRent || p.rent || 0, 10) <= budgetLimit);
    const gapMatches = properties.filter(p => {
      const r = parseInt(p.monthlyRent || p.rent || 0, 10);
      return r > budgetLimit && r <= budgetLimit + 2500;
    });

    const expiryTime = Date.now() + 24 * 60 * 60 * 1000;

    // ─── NO MATCH CASE — Register requirement then show modal ────────
    if (properties.length === 0) {
      // Show modal immediately with no-match content
      setResultCategory({
        type: 'none',
        title: '📌 Requirement Registered!',
        subtitle: 'Auto-Matching is Now Active',
        accentColor: '#0d9488',
        bgGradient: 'from-teal-50 to-cyan-50',
        borderColor: 'border-teal-200',
        budgetLabel: parsedMax ? `₹${parsedMax.toLocaleString('en-IN')}/month` : (parsedMin ? `₹${parsedMin.toLocaleString('en-IN')}/month` : ''),
        matchCount: 0,
        steps: [
          { icon: '📌', title: 'Requirement Saved', desc: 'No match right now — but your budget requirement is saved as ACTIVE in our system.' },
          { icon: '⚡', title: 'Auto-Matching ON', desc: 'As soon as a new property matching your budget is added, our system detects it instantly.' },
          { icon: '📱', title: 'Multi-Channel Alert', desc: 'You will be notified via Push Notification, Email & WhatsApp automatically.' },
          { icon: '🏠', title: 'Chat & Book', desc: 'Once matched, open chat with the owner and finalize your move-in!' },
        ],
        badges: ['⚡ Auto-Matching Active', '📱 Push + WhatsApp Alerts', '📌 Requirement Saved'],
        expiryTime,
        ctaLabel: null,
        ctaPath: null
      });
      setSuccessCount(0);
      setShowSuccessModal(true);

      // Fire register-requirement in background (don't block modal)
      fetch(`${apiUrl}/api/booking/register-requirement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: form.fullName,
          email: form.gmail,
          city: selectedCity?.name || selectedCity?.cityName || form.city,
          area: selectedArea?.name || selectedArea?.area_name || form.area,
          gender: form.gender,
          budget_min: parsedMin,
          budget_max: parsedMax || parsedMin,
          bid_amount: parsedMax || parsedMin || 0,
          message: `Budget: ${form.budgetQuery}, Gender: ${form.gender}, Area: ${selectedArea?.name || form.area}`
        })
      }).catch(() => {});
      return;
    }

    // ─── COMPUTE CATEGORY INSTANTLY (frontend logic) ──────────────────
    const frontendCategory = exactMatches.length > 0 ? 'exact_match' : gapMatches.length > 0 ? 'slight_gap' : 'no_match_active';

    let catInfo = {
      type: 'none',
      title: '📌 Requirement Registered!',
      subtitle: 'Auto-Matching is Now Active',
      accentColor: '#0d9488',
      bgGradient: 'from-teal-50 to-cyan-50',
      borderColor: 'border-teal-200',
      budgetLabel: budgetLimit > 0 ? `₹${budgetLimit.toLocaleString('en-IN')}/month` : '',
      matchCount: 0,
      steps: [
        { icon: '📌', title: 'Requirement Saved', desc: 'No match right now — but your budget requirement is saved as ACTIVE in our system.' },
        { icon: '⚡', title: 'Auto-Matching ON', desc: 'As soon as a new property matching your budget is added, our system detects it instantly.' },
        { icon: '📱', title: 'Multi-Channel Alert', desc: 'You will be notified via Push Notification, Email & WhatsApp automatically.' },
        { icon: '🏠', title: 'Chat & Book', desc: 'Once matched, open chat with the owner and finalize your move-in!' },
      ],
      badges: ['⚡ Auto-Matching Active', '📱 WhatsApp + Push Alerts', '📌 Requirement Saved'],
      expiryTime,
      ctaLabel: null,
      ctaPath: null
    };

    if (frontendCategory === 'exact_match') {
      catInfo = {
        type: 'exact',
        title: '✅ Bid Submitted!',
        subtitle: 'Properties Available in Your Budget',
        accentColor: '#059669',
        bgGradient: 'from-emerald-50 to-teal-50',
        borderColor: 'border-emerald-200',
        budgetLabel: `₹${budgetLimit.toLocaleString('en-IN')}/month`,
        matchCount: exactMatches.length,
        steps: [
          { icon: '📩', title: 'Owners Notified', desc: 'All matching property owners have received your bid request instantly.' },
          { icon: '💬', title: 'Owner Will Start Chat', desc: 'An interested owner will open a chat with you directly on the website.' },
          { icon: '🔔', title: 'You Will Be Notified', desc: 'You\'ll get an instant push + email alert when an owner responds to your bid.' },
          { icon: '🏠', title: 'Finalize Move-in', desc: 'Chat with the owner, confirm rent & move-in date — all within Roomhy!' },
        ],
        badges: ['💬 Direct Owner Chat', '🔔 Real-time Alerts', '⌛ 24-Hour Bid Validity'],
        expiryTime,
        ctaLabel: '💬 Open Chat Panel',
        ctaPath: '/tenant/tenantchat'
      };
    } else if (frontendCategory === 'slight_gap') {
      catInfo = {
        type: 'gap',
        title: '⚡ Bid Submitted!',
        subtitle: 'Properties Within ₹2,500 of Your Budget',
        accentColor: '#d97706',
        bgGradient: 'from-amber-50 to-yellow-50',
        borderColor: 'border-amber-200',
        budgetLabel: `₹${budgetLimit.toLocaleString('en-IN')}/month`,
        matchCount: gapMatches.length,
        steps: [
          { icon: '📩', title: 'Owners Notified', desc: 'Owners of properties within ₹2,500 of your budget have been notified.' },
          { icon: '💬', title: 'Negotiation Chat', desc: 'If an owner agrees to negotiate rent, they\'ll start a chat with you.' },
          { icon: '🔔', title: 'Instant Alert', desc: 'You\'ll get a push + email notification the moment an owner responds.' },
          { icon: '🤝', title: 'Agree & Move-in', desc: 'Negotiate rent directly, finalize a deal & plan your move-in date!' },
        ],
        badges: ['💬 Rent Negotiation Chat', '🔔 Instant Notifications', '⌛ 24-Hour Bid Validity'],
        expiryTime,
        ctaLabel: '💬 Open Chat Panel',
        ctaPath: '/tenant/tenantchat'
      };
    }

    // ─── SHOW MODAL IMMEDIATELY (don't wait for API calls!) ──────────
    setSuccessCount(properties.length);
    setResultCategory(catInfo);
    setShowSuccessModal(true);

    // ─── FIRE ALL BID API CALLS IN PARALLEL (background) ─────────────
    const bidPromises = properties.map((property, index) => {
      const propertyId = property._id || property.propertyNumber || property.propertyId || `${property.property_name || property.propertyInfo?.name || 'property'}-${index}`;
      const ownerId = resolvePropertyOwnerLoginId(property);
      if (!ownerId) return Promise.resolve();

      const bidData = {
        property_id: propertyId,
        property_name: property.property_name || property.propertyInfo?.name || 'Property',
        area: property.locality || property.propertyInfo?.area || '',
        city: selectedCity?.name || selectedCity?.cityName || '',
        property_type: property.propertyType || property.propertyInfo?.propertyType || 'Property',
        rent_amount: parseInt(property.monthlyRent || property.rent || property.propertyInfo?.rent || 0, 10),
        user_id: userId,
        owner_id: ownerId,
        name: form.fullName,
        email: form.gmail,
        phone: getWebsiteUser()?.phone || '',
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

      return fetch(`${apiUrl}/api/booking/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bidData)
      }).catch(() => {});
    });

    // Fire all in parallel — no await, runs in background while modal is already visible
    Promise.allSettled(bidPromises).catch(() => {});
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
                    <p className="text-xs font-bold text-white">Smart Bidding Guaranteed</p>
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
                  <span>{properties.length > 0 ? `Send Bids (${properties.length} Properties)` : 'Register Requirement'}</span>
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

      {/* Success / Category Informational Modal — Premium "Aage Kya Hoga" */}
      {showSuccessModal && resultCategory && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 overflow-hidden max-h-[92vh] flex flex-col">

            {/* Top accent bar */}
            <div className="h-1.5 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${resultCategory.accentColor || '#0d9488'}, ${(resultCategory.accentColor || '#0d9488') + '99'})` }} />

            {/* Header */}
            <div className={`px-5 pt-5 pb-4 bg-gradient-to-br ${resultCategory.bgGradient || 'from-teal-50 to-cyan-50'} border-b ${resultCategory.borderColor || 'border-teal-200'} shrink-0`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-base font-black text-slate-900 leading-tight">{resultCategory.title}</h2>
                  <p className="text-xs font-bold mt-0.5" style={{ color: resultCategory.accentColor || '#0d9488' }}>{resultCategory.subtitle}</p>
                </div>
                {(resultCategory.matchCount ?? 0) > 0 ? (
                  <span className="shrink-0 px-2.5 py-1 rounded-xl text-white text-[10px] font-black shadow-sm" style={{ background: resultCategory.accentColor || '#0d9488' }}>
                    {resultCategory.matchCount} Match{resultCategory.matchCount !== 1 ? 'es' : ''}
                  </span>
                ) : (
                  <span className="shrink-0 px-2.5 py-1 rounded-xl text-white text-[10px] font-black shadow-sm" style={{ background: resultCategory.accentColor || '#0d9488' }}>
                    Active
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                {resultCategory.budgetLabel && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border" style={{ borderColor: `${resultCategory.accentColor || '#0d9488'}40` }}>
                    <span className="text-[10px] font-bold text-slate-500">Your Budget:</span>
                    <span className="text-xs font-black" style={{ color: resultCategory.accentColor || '#0d9488' }}>{resultCategory.budgetLabel}</span>
                  </div>
                )}
                {successCount > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500">Bids Sent:</span>
                    <span className="text-xs font-black text-slate-800">{successCount} Properties</span>
                  </div>
                )}
              </div>
            </div>

            {/* Steps — Aage Kya Hoga */}
            <div className="px-5 py-4 overflow-y-auto flex-1 space-y-3">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">What Happens Next?</p>
              {(resultCategory.steps || []).map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 bg-slate-50 border border-slate-100">
                    {step.icon}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black rounded-full px-1.5 py-0.5 text-white" style={{ background: resultCategory.accentColor || '#0d9488' }}>{idx + 1}</span>
                      <p className="text-xs font-extrabold text-slate-800">{step.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}

              {/* Bid expiry */}
              {resultCategory.expiryTime && (
                <div className="flex items-center gap-2 mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-sm">⌛</span>
                  <span className="text-[11px] text-slate-500 font-medium">Bid valid until: <span className="font-bold text-slate-700">{new Date(resultCategory.expiryTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></span>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(resultCategory.badges || []).map((b, idx) => (
                  <span key={idx} className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border"
                    style={{ color: resultCategory.accentColor || '#0d9488', borderColor: `${resultCategory.accentColor || '#0d9488'}40`, background: `${resultCategory.accentColor || '#0d9488'}10` }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="px-5 pb-5 pt-3 border-t border-slate-100 shrink-0 flex flex-col gap-2">
              {resultCategory.ctaLabel && resultCategory.ctaPath && (
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    window.location.href = resultCategory.ctaPath;
                  }}
                  className="w-full py-3.5 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: `linear-gradient(135deg, ${resultCategory.accentColor || '#0d9488'}, ${(resultCategory.accentColor || '#0d9488') + 'cc'})` }}
                >
                  {resultCategory.ctaLabel}
                </button>
              )}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Close & Continue Browsing
              </button>
            </div>
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


