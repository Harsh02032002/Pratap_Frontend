import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, MapPin, Zap, Send, Loader, Info, Shield, CheckCircle, AlertTriangle, ChevronDown, Wallet, Building2, Home, Users, Bed, Check, Search, Star, Wind, Utensils, Tv, Filter, RefreshCw } from 'lucide-react';
import { fetchCities, fetchProperties, fetchJson, getPropertyDetailsUrl, getApiBase, resolvePropertyOwnerLoginId } from '../../utils/api';
import { cacheInvalidate } from '../../utils/cache';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// Cities & Localities map dynamically built from MongoDB database properties
const cityAreasMap = {};

export default function FastBiddingModal({ isOpen, onClose, initialData = {} }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [allProperties, setAllProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [toast, setToast] = useState(null);

  // Filter States (Same as OurPropertyPage)
  const [selectedCity, setSelectedCity] = useState(initialData.city || 'Kota');
  const [selectedArea, setSelectedArea] = useState(initialData.area || '');
  const [selectedType, setSelectedType] = useState(initialData.type || '');
  const [selectedGender, setSelectedGender] = useState(initialData.gender || '');
  const [maxPrice, setMaxPrice] = useState(initialData.maxPrice || '12000');
  const [areaSearch, setAreaSearch] = useState('');

  // Fetch properties once
  useEffect(() => {
    if (!isOpen) return;
    setLoadingProps(true);
    fetchProperties()
      .then(props => {
        setAllProperties(Array.isArray(props) ? props : []);
        setLoadingProps(false);
      })
      .catch(() => {
        setAllProperties([]);
        setLoadingProps(false);
      });
  }, [isOpen]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filtered Properties matching active filters
  const filteredProperties = useMemo(() => {
    return allProperties.filter(p => {
      // City
      if (selectedCity && p.city?.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      // Area
      if (selectedArea && p.area?.toLowerCase() !== selectedArea.toLowerCase() && !p.location?.toLowerCase().includes(selectedArea.toLowerCase())) {
        return false;
      }
      // Property Type
      if (selectedType) {
        const st = selectedType.toLowerCase();
        const pt = (p.propertyType || p.type || '').toLowerCase();
        if (st === 'pg' && !pt.includes('pg') && !pt.includes('guest')) return false;
        if (st === 'hostel' && !pt.includes('hostel')) return false;
        if ((st === 'co-living' || st === 'coliving') && !pt.includes('co-living') && !pt.includes('coliving')) return false;
        if ((st === 'apartment' || st === 'apartments') && !pt.includes('apartment') && !pt.includes('flat')) return false;
      }
      // Gender
      if (selectedGender && p.gender?.toLowerCase() !== selectedGender.toLowerCase() && p.genderSuitability?.toLowerCase() !== selectedGender.toLowerCase()) {
        return false;
      }
      // Max Price (Allow +2500 buffer for bidding negotiation)
      if (maxPrice) {
        const limit = parseInt(maxPrice, 10);
        const rent = parseInt(p.monthlyRent || p.price || 0, 10);
        if (rent > limit + 2500) return false;
      }
      return true;
    });
  }, [allProperties, selectedCity, selectedArea, selectedType, selectedGender, maxPrice]);

  const [resultModal, setResultModal] = useState(null);

  const handleBidSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    const parsedMax = parseInt(maxPrice, 10) || 0;
    const exactMatches = filteredProperties.filter(p => parseInt(p.monthlyRent || p.price || 0, 10) <= parsedMax);
    const gapMatches = filteredProperties.filter(p => {
      const r = parseInt(p.monthlyRent || p.price || 0, 10);
      return r > parsedMax && r <= parsedMax + 2500;
    });

    let category = 'no_match_active';
    if (exactMatches.length > 0) {
      category = 'exact_match';
    } else if (gapMatches.length > 0) {
      category = 'slight_gap';
    }

    setSubmitting(true);
    try {
      const userId = user?.loginId || user?._id || user?.id || '';

      const targetProps = filteredProperties.length > 0 ? filteredProperties.slice(0, 15) : [{ _id: 'generic_bid_request', propertyName: 'Active Requirement', monthlyRent: parsedMax }];

      const bidRequests = targetProps.map((prop, index) => {
        const propInfo = prop.propertyInfo || {};
        const propertyId = prop._id || prop.id || prop.visitId || `property-${index}`;
        const ownerId = resolvePropertyOwnerLoginId(prop) || (prop.generatedCredentials && prop.generatedCredentials.loginId) || prop.ownerLoginId || propInfo.ownerLoginId || 'admin';
        const propRent = parseInt(prop.monthlyRent || prop.rent || prop.price || prop.pricing?.monthlyRent || parsedMax || 0, 10);
        const budget = (Number.isFinite(parsedMax) && parsedMax > 0) ? parsedMax : 0;

        return fetchJson(`${getApiBase()}/api/bids/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            user_id: userId,
            name: user?.name || user?.firstName || 'Student',
            userName: user?.name || user?.firstName || 'Student',
            phone: user?.phone || '9999999999',
            userPhone: user?.phone || '9999999999',
            email: user?.email || '',
            userEmail: user?.email || '',
            propertyId,
            property_id: propertyId,
            propertyName: prop.propertyName || prop.name || prop.title || 'Property',
            property_name: prop.propertyName || prop.name || prop.title || 'Property',
            ownerId,
            owner_id: ownerId,
            requestType: 'bid',
            request_type: 'bid',
            rentAmount: propRent,
            rent_amount: propRent,
            bidAmount: budget,
            bid_amount: budget,
            offeredAmount: budget,
            proposedPrice: budget,
            city: selectedCity || prop.city || 'Kota',
            area: selectedArea || prop.area || '',
            gender: selectedGender || 'Any',
            status: 'pending',
            createdVia: 'fullscreen_bidding_modal'
          })
        }).catch(err => console.error('Bid failed:', propertyId, err));
      });

      await Promise.all(bidRequests);
      cacheInvalidate('enquiries:');
      cacheInvalidate('booking-requests:');
      setSubmitting(false);

      if (category === 'exact_match') {
        setResultModal({
          type: 'exact',
          title: '✅ Bid Submitted!',
          subtitle: 'Properties Available in Your Budget',
          accentColor: '#059669',
          bgGradient: 'from-emerald-50 to-teal-50',
          borderColor: 'border-emerald-200',
          budgetLabel: `₹${parsedMax.toLocaleString('en-IN')}/month`,
          matchCount: exactMatches.length,
          steps: [
            { icon: '📩', title: 'Owners Notified', desc: 'All matching property owners have received your bid request instantly.' },
            { icon: '💬', title: 'Owner Will Start Chat', desc: 'An interested owner will open a chat with you directly on the website.' },
            { icon: '🔔', title: 'You Will Be Notified', desc: 'You\'ll get an instant push + email alert when an owner responds to your bid.' },
            { icon: '🏠', title: 'Finalize Move-in', desc: 'Chat with the owner, confirm rent & move-in date — all within Roomhy!' },
          ],
          badges: ['💬 Direct Owner Chat', '🔔 Real-time Alerts', '⌛ 24-Hour Bid Validity'],
          ctaLabel: '💬 Open Chat Panel',
          ctaPath: '/tenant/tenantchat'
        });
      } else if (category === 'slight_gap') {
        setResultModal({
          type: 'gap',
          title: '⚡ Bid Submitted!',
          subtitle: `Properties Within ₹2,500 of Your Budget`,
          accentColor: '#d97706',
          bgGradient: 'from-amber-50 to-yellow-50',
          borderColor: 'border-amber-200',
          budgetLabel: `₹${parsedMax.toLocaleString('en-IN')}/month`,
          matchCount: gapMatches.length,
          steps: [
            { icon: '📩', title: 'Owners Notified', desc: 'Owners of properties within ₹2,500 of your budget have been notified.' },
            { icon: '💬', title: 'Negotiation Chat', desc: 'If an owner agrees to negotiate rent, they\'ll start a chat with you.' },
            { icon: '🔔', title: 'Instant Alert', desc: 'You\'ll get a push + email notification the moment an owner responds.' },
            { icon: '🤝', title: 'Agree & Move-in', desc: 'Negotiate rent directly, finalize a deal & plan your move-in date!' },
          ],
          badges: ['💬 Rent Negotiation Chat', '🔔 Instant Notifications', '⌛ 24-Hour Bid Validity'],
          ctaLabel: '💬 Open Chat Panel',
          ctaPath: '/tenant/tenantchat'
        });
      } else {
        setResultModal({
          type: 'none',
          title: '📌 Requirement Registered!',
          subtitle: 'Auto-Matching is Now Active',
          accentColor: '#0d9488',
          bgGradient: 'from-teal-50 to-cyan-50',
          borderColor: 'border-teal-200',
          budgetLabel: `₹${parsedMax.toLocaleString('en-IN')}/month`,
          matchCount: 0,
          steps: [
            { icon: '📌', title: 'Requirement Saved', desc: 'No match right now — but your budget requirement is saved as ACTIVE in our system.' },
            { icon: '⚡', title: 'Auto-Matching ON', desc: 'As soon as a new property matching your budget is added, our system detects it instantly.' },
            { icon: '📱', title: 'Multi-Channel Alert', desc: 'You will be notified via Push Notification, Email & WhatsApp automatically.' },
            { icon: '🏠', title: 'Chat & Book', desc: 'Once matched, open chat with the owner and finalize your move-in!' },
          ],
          badges: ['⚡ Auto-Matching Active', '📱 Push + WhatsApp Alerts', '📌 Requirement Saved'],
          ctaLabel: null,
          ctaPath: null
        });
      }
    } catch (err) {
      setSubmitting(false);
      showToast('Failed to submit bid requests. Please try again.', 'error');
    }
  };

  // Dynamically merge DB cities & localities with cityAreasMap
  const dynamicCitiesMap = useMemo(() => {
    const map = { ...cityAreasMap };
    if (Array.isArray(allProperties)) {
      allProperties.forEach(p => {
        const c = p.city || p.propertyInfo?.city;
        const a = p.locality || p.area || p.propertyInfo?.area || p.location;
        if (c && typeof c === 'string' && c.trim()) {
          const cityFormatted = c.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          if (!map[cityFormatted]) {
            map[cityFormatted] = [];
          }
          if (a && typeof a === 'string' && a.trim()) {
            const areaFormatted = a.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            if (!map[cityFormatted].includes(areaFormatted)) {
              map[cityFormatted].push(areaFormatted);
            }
          }
        }
      });
    }
    return map;
  }, [allProperties]);

  if (!isOpen) return null;

  const currentAreas = dynamicCitiesMap[selectedCity] || [];
  const filteredAreas = currentAreas.filter(a => a.toLowerCase().includes(areaSearch.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Login Prompt Overlay */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center border border-slate-100 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 fill-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Login Required to Bid</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Please log in to your Roomhy account so property owners can receive your bid request and contact you directly.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLoginPrompt(false); onClose(); navigate('/website/login'); }}
                className="flex-1 py-3 rounded-xl bg-[#EE4266] text-white font-extrabold text-xs hover:bg-[#d63a5b] shadow-md transition-all"
              >
                Login Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[130] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-xs md:text-sm font-extrabold transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' :
          toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Main Filter-Only Dialog Box - ULTRA PREMIUM KADAK DESIGN */}
      <div className="bg-white w-full max-w-lg md:max-w-md max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 animate-in zoom-in-95">
        
        {/* Top Gradient Accent Line */}
        <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 w-full shrink-0"></div>

        {/* Top Header Bar - Clean Aligned Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-100 shrink-0">
          {/* Top Row: Roomhy Logo & Controls */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <img 
              src="/website/roomhy_logo.jpeg" 
              alt="Roomhy Logo" 
              className="h-8 md:h-9 w-auto object-contain" 
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedArea('');
                  setSelectedType('');
                  setSelectedGender('');
                  setMaxPrice('20000');
                  setAreaSearch('');
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs transition-all cursor-pointer"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                title="Close Form"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Title, Subtext & Badge */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Fast Bidding Form</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {filteredProperties.length} Matching Stays
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Set budget &amp; send 1-click bids directly to property owners
            </p>
          </div>
        </div>

        {/* Modal Body: Premium Section Cards Layout */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50 no-scrollbar">
          
          {/* 1. Select City Card */}
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
            <label className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" /> City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedArea('');
              }}
              className="w-full p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
            >
              {Object.keys(dynamicCitiesMap).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* 2. Property Type Stacked Cards */}
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
            <label className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
              PROPERTY TYPE
            </label>
            <div className="space-y-1.5">
              {[
                { type: 'PG', label: 'PG', icon: Bed },
                { type: 'Hostel', label: 'Hostels', icon: Building2 },
                { type: 'Co-living', label: 'Co-living', icon: Users },
                { type: 'Apartment', label: 'Apartments', icon: Home }
              ].map(item => {
                const isSelected = (selectedType || '').toLowerCase() === item.type.toLowerCase();
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedType(isSelected ? '' : item.type)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/90 text-teal-800 border-teal-300 ring-2 ring-teal-500/20 shadow-2xs font-extrabold'
                        : 'bg-slate-50/60 text-slate-700 border-slate-200/80 hover:bg-slate-100/80 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Gender Pills Card */}
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
            <label className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
              GENDER
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Boys', 'Girls', 'Co-ed'].map(gender => {
                const isSelected = (selectedGender || '').toLowerCase() === gender.toLowerCase();
                return (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setSelectedGender(isSelected ? '' : gender)}
                    className={`py-2 rounded-xl text-xs transition-all border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/90 text-teal-800 border-teal-300 ring-2 ring-teal-500/20 shadow-2xs font-extrabold'
                        : 'bg-slate-50/60 text-slate-700 border-slate-200/80 hover:bg-slate-100/80 font-bold'
                    }`}
                  >
                    {gender}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Budget Range Card */}
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                BUDGET RANGE
              </label>
              <span className="px-2.5 py-0.5 rounded-lg bg-teal-600 text-white font-black text-xs shadow-2xs">
                ₹{(parseInt(maxPrice) || 20000).toLocaleString()}+
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
              <span>₹2,000</span>
              <span>Max: ₹30,000+</span>
            </div>
            <input
              type="range"
              min="2000"
              max="30000"
              step="500"
              value={parseInt(maxPrice, 10) || 20000}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          {/* 5. Localities Card */}
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
            <label className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
              LOCALITIES IN {selectedCity.toUpperCase()}
            </label>

            {/* Search locality input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search locality..."
                value={areaSearch}
                onChange={(e) => setAreaSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
              <label
                onClick={() => setSelectedArea('')}
                className={`flex items-center justify-between text-xs font-bold cursor-pointer group py-1 px-2 rounded-lg transition-colors ${!selectedArea ? 'bg-teal-50 text-teal-700 font-black' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!selectedArea} readOnly className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <span>All Localities in {selectedCity}</span>
                </div>
              </label>
              {filteredAreas.map((locName, idx) => {
                const isSel = selectedArea === locName;
                const dummyCounts = [23, 38, 31, 19, 27, 15, 42, 18];
                const count = dummyCounts[idx % dummyCounts.length];
                return (
                  <label
                    key={locName}
                    onClick={() => setSelectedArea(isSel ? '' : locName)}
                    className={`flex items-center justify-between text-xs font-bold cursor-pointer group py-1 px-2 rounded-lg transition-colors ${isSel ? 'bg-teal-50 text-teal-700 font-black' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={isSel} readOnly className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                      <span>{locName}</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md group-hover:text-teal-600">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Sticky Footer - Vibrant Teal Gradient Action Button */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={handleBidSubmit}
            disabled={submitting || filteredProperties.length === 0}
            className="w-full py-3.5 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs md:text-sm rounded-2xl shadow-lg shadow-teal-500/25 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Placing Bids...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Bid ({filteredProperties.length} Properties)</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Result Informational Modal Overlay — Premium "Aage Kya Hoga" */}
      {resultModal && (
        <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 overflow-hidden max-h-[90vh] flex flex-col">

            {/* Top accent bar */}
            <div className="h-1.5 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${resultModal.accentColor}, ${resultModal.accentColor}99)` }} />

            {/* Header */}
            <div className={`px-5 pt-5 pb-4 bg-gradient-to-br ${resultModal.bgGradient} border-b ${resultModal.borderColor} shrink-0`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-black text-slate-900 leading-tight">{resultModal.title}</h3>
                  <p className="text-xs font-bold mt-0.5" style={{ color: resultModal.accentColor }}>{resultModal.subtitle}</p>
                </div>
                {resultModal.matchCount > 0 && (
                  <span className="shrink-0 px-2.5 py-1 rounded-xl text-white text-[10px] font-black shadow-sm" style={{ background: resultModal.accentColor }}>
                    {resultModal.matchCount} Match{resultModal.matchCount !== 1 ? 'es' : ''}
                  </span>
                )}
                {resultModal.matchCount === 0 && (
                  <span className="shrink-0 px-2.5 py-1 rounded-xl text-white text-[10px] font-black shadow-sm" style={{ background: resultModal.accentColor }}>
                    Active
                  </span>
                )}
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border" style={{ borderColor: `${resultModal.accentColor}40` }}>
                <span className="text-[10px] font-bold text-slate-500">Your Budget:</span>
                <span className="text-xs font-black" style={{ color: resultModal.accentColor }}>{resultModal.budgetLabel}</span>
              </div>
            </div>

            {/* Steps — Aage Kya Hoga */}
            <div className="px-5 py-4 overflow-y-auto flex-1 space-y-3">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">What Happens Next?</p>
              {resultModal.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 bg-slate-50 border border-slate-100">
                    {step.icon}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black rounded-full px-1.5 py-0.5 text-white" style={{ background: resultModal.accentColor }}>{idx + 1}</span>
                      <p className="text-xs font-extrabold text-slate-800">{step.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {resultModal.badges.map((b, idx) => (
                  <span key={idx} className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border" style={{ color: resultModal.accentColor, borderColor: `${resultModal.accentColor}40`, background: `${resultModal.accentColor}10` }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="px-5 pb-5 pt-3 border-t border-slate-100 shrink-0 flex flex-col gap-2">
              {resultModal.ctaLabel && resultModal.ctaPath && (
                <button
                  onClick={() => {
                    setResultModal(null);
                    onClose();
                    navigate(resultModal.ctaPath);
                  }}
                  className="w-full py-3.5 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${resultModal.accentColor}, ${resultModal.accentColor}cc)` }}
                >
                  {resultModal.ctaLabel}
                </button>
              )}
              <button
                onClick={() => { setResultModal(null); onClose(); }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Close & Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
