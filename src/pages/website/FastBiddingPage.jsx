import { useState, useEffect, useRef, useMemo } from 'react';
import { Zap, ArrowLeft, Send, Loader, CheckCircle, Shield, Info } from 'lucide-react';
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { fetchCities, fetchAreas, fetchProperties } from '../../utils/api';
import { getWebsiteUser, getWebsiteUserId, getWebsiteUserName, getWebsiteUserEmail, isWebsiteLoggedIn } from '../../utils/websiteSession';

const defaultCities = [
  { _id: 'kota', name: 'Kota, Rajasthan' },
  { _id: 'sikar', name: 'Sikar, Rajasthan' },
  { _id: 'indore', name: 'Indore, Madhya Pradesh' },
];

export default function FastBiddingPage() {
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
      try {
        const allAreas = await fetchAreas();
        const filtered = allAreas.filter(a => {
          const cityIdStr = (a.cityId || a.city?._id || a.city || '').toString();
          return cityIdStr === form.city;
        });
        setAreas(filtered);
      } catch {
        setAreas([]);
      }
    };
    loadAreas();
  }, [form.city]);

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
        const ownerId =
          (property.generatedCredentials && property.generatedCredentials.loginId) ||
          property.ownerLoginId ||
          property.createdBy ||
          property.owner ||
          property.propertyOwnerId;

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
    <div className="min-h-screen bg-gray-50">
      <WebsiteNavbar />

      <header className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/website/index" className="font-bold text-xl text-blue-600 flex items-center gap-2">
            <Zap className="w-6 h-6" /> Roomhy Fast Bidding
          </a>
          <a href="/website/index" className="text-gray-600 hover:text-blue-600 inline-flex items-center text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-32">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Bidding Form</h1>
            <p className="text-gray-600">Fill in your details to find matching properties and send bids to multiple owners</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Matches</p>
              <p className="text-lg font-semibold text-gray-900">{properties.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-8">
          <form onSubmit={submitBids}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  value={form.fullName}
                  onChange={handleFormChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                <input
                  type="email"
                  id="gmail"
                  value={form.gmail}
                  onChange={handleFormChange}
                  placeholder="your.email@gmail.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Gender *</label>
              <select
                id="gender"
                value={form.gender}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Select City *</label>
                <select
                  id="city"
                  value={form.city}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a city</option>
                  {cities.map(city => (
                    <option key={city._id || city.id} value={city._id || city.id}>
                      {city.name || city.cityName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Select Area *</label>
                <select
                  id="area"
                  value={form.area}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!form.city}
                >
                  <option value="">{form.city ? 'Select an area' : 'First select a city'}</option>
                  {areas.map(area => (
                    <option key={area._id || area.id} value={area._id || area.id}>
                      {area.name || area.areaName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Budget Query *</label>
              <input
                type="text"
                id="budgetQuery"
                value={form.budgetQuery}
                onChange={handleFormChange}
                placeholder="e.g. < 8000, > 5000, 5000-8000, or = 6000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll include properties up to +₹3000 buffer above your max budget so you have room to negotiate!
              </p>
            </div>

            {/* Properties List — auto-included, no manual selection */}
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Properties Found in Your Area</h3>
                  <p className="text-sm text-gray-500 mt-1">All matching properties are auto-selected and will receive your bid.</p>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                  All {properties.length} selected
                </span>
              </div>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading properties...</span>
                </div>
              )}
              {!loading && properties.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p>No properties found. Try adjusting your filters.</p>
                </div>
              )}
              <div className="space-y-3">
                {properties.map((prop, index) => {
                  const propInfo = prop.propertyInfo || {};
                  const propertyId = prop._id || prop.propertyNumber || prop.propertyId || index;
                  const propertyName = propInfo.name || prop.property_name || `Property ${propertyId}`;
                  const rent = prop.monthlyRent || prop.rent || propInfo.rent || propInfo.monthlyRent || 0;
                  const gender = prop.gender || propInfo.gender || prop.genderSuitability || 'Not specified';
                  const propertyType = prop.propertyType || propInfo.propertyType || 'Property';

                  return (
                    <div key={propertyId} className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{propertyName}</h4>
                          <p className="text-sm text-gray-500 mt-1">#{propertyId}</p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs">
                            <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-gray-700">
                              <strong>₹{Number(rent).toLocaleString()}</strong>/month
                            </span>
                            <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-gray-700">{gender}</span>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{propertyType}</span>
                          </div>
                        </div>
                        <div className="ml-4 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Auto included
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ fullName: '', gmail: '', gender: '', city: '', area: '', budgetQuery: '' })}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-5 h-5" />
                Send Bids to Matching Properties
              </button>
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">How It Works</h4>
                <p className="text-sm text-blue-800">Your bid will be sent to all property owners matching your criteria. Owners will review and can accept or counter your bid.</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex gap-3">
              <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Secure & Safe</h4>
                <p className="text-sm text-green-800">Your phone number will only be shared after the owner accepts your bid. No direct contact until agreement.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="mb-20">
        <WebsiteFooter />
      </div>

      <MobileBottomNav />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bid Sent Successfully!</h2>
              <p className="text-gray-600 text-sm">Your bid has been sent to all matching property owners.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600"><strong>Bids sent to:</strong> {successCount} properties</p>
              <p className="text-xs text-gray-500 mt-2">Property owners will review your bid and respond within 24 hours.</p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Signup Modal — shown when user is not logged in */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Account Verification</h2>
                  <p className="mt-1 text-sm text-gray-600">Create an account to continue bidding.</p>
                </div>
                <button
                  onClick={() => setShowSignupModal(false)}
                  className="rounded-full border border-gray-200 p-2 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-8">
              <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Email</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{signupEmail}</p>
              </div>
              <p className="text-center text-gray-600 mb-6">
                <span className="font-semibold text-gray-900">No account found</span> for this email. Please create an account to verify your identity and continue bidding.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6 bg-white border border-gray-200 rounded-xl p-4">
                <li className="flex items-center"><span className="mr-2 font-bold text-gray-900">✓</span> Verified account</li>
                <li className="flex items-center"><span className="mr-2 font-bold text-gray-900">✓</span> Send multiple bids</li>
                <li className="flex items-center"><span className="mr-2 font-bold text-gray-900">✓</span> Track your properties</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignupModal(false)}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { window.location.href = '/signup'; }}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 transition"
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


