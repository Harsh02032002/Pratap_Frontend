import { useState, useEffect } from 'react';
import { ListPlus, Send, CheckCircle, Loader, Building2, User, Mail, Phone, MapPin, Home, Sparkles, ShieldCheck, CheckCircle2, PhoneCall } from 'lucide-react';
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { submitEnquiry, fetchJson } from '../../utils/api';
import { getOwnerRuntimeSession } from '../../utils/propertyowner';
import useSEO from '../../hooks/useSEO';
import { toast } from 'react-hot-toast';

export default function ListYourPropertyPage() {
  useSEO({ 
    pageKey: 'list-property', 
    fallbackTitle: 'List Your Property for Free | Hostels & PGs | Roomhy.com',
    fallbackDescription: 'List your PG, hostel, co-living space, or apartment on Roomhy.com for free. Connect directly with verified student tenants and maximize your occupancy.'
  });
  const owner = getOwnerRuntimeSession();

  useEffect(() => {
    if (window.location.pathname !== '/list-property') {
      window.history.replaceState(null, '', '/list-property');
    }
  }, []);

  const [formData, setFormData] = useState({
    ownerName: owner?.name || owner?.fullName || '',
    email: owner?.email || '',
    phone: owner?.phone || '',
    propertyName: '',
    propertyType: '',
    city: '',
    area: '',
    address: '',
    rent: '',
    description: ''
  });
  const [loadingForm, setLoadingForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [layoutSections, setLayoutSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch page layout settings from DB
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await fetchJson('/api/page-layouts/list-property');
        if (res.success && res.data && res.data.sections) {
          const sorted = res.data.sections.sort((a, b) => a.order - b.order);
          setLayoutSections(sorted);
        }
      } catch (err) {
        console.warn('Failed to load list property page layout:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, []);

  const isSectionVisible = (id) => {
    if (id === 'list-form') return true; // Form is mandatory on List Your Property page
    if (layoutSections.length === 0) return true;
    const sec = layoutSections.find(s => s.id === id);
    return sec ? sec.visible !== false : true;
  };

  const getSectionContent = (id, fallback) => {
    if (layoutSections.length === 0) return fallback;
    const sec = layoutSections.find(s => s.id === id);
    return sec && sec.content ? { ...fallback, ...sec.content } : fallback;
  };

  useEffect(() => {
    const fetchOwnerDetails = async () => {
      if (owner?.loginId) {
        try {
          const response = await fetchJson(`/api/owners/${encodeURIComponent(owner.loginId)}`);
          if (response) {
            setFormData(prev => ({
              ...prev,
              ownerName: prev.ownerName || response.name || response.profile?.name || '',
              email: prev.email || response.email || response.profile?.email || '',
              phone: prev.phone || response.phone || response.profile?.phone || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching owner details:', error);
        }
      }
    };
    fetchOwnerDetails();
  }, [owner?.loginId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.propertyName.trim()) newErrors.propertyName = 'Property name is required';
    if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.rent.trim()) newErrors.rent = 'Rent amount is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoadingForm(true);
    try {
      const enquiryData = {
        property_type: formData.propertyType || 'pg',
        property_name: formData.propertyName,
        city: formData.city,
        locality: formData.area || '',
        address: formData.address || '',
        pincode: '',
        description: formData.description || '',
        amenities: [],
        gender_suitability: '',
        rent: parseInt(formData.rent) || 0,
        deposit: '',
        owner_name: formData.ownerName,
        owner_email: formData.email,
        owner_phone: formData.phone,
        contact_name: formData.ownerName,
        country: 'India',
        tenants_managed: 0,
        additional_message: formData.description || '',
        photos: []
      };

      await submitEnquiry(enquiryData);
      setShowSuccess(true);
      setFormData({
        ownerName: '',
        email: '',
        phone: '',
        propertyName: '',
        propertyType: '',
        city: '',
        area: '',
        address: '',
        rent: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setLoadingForm(false);
    }
  };

  const propertyTypes = [
    { value: 'pg', label: 'PG / Paying Guest' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'coliving', label: 'Co-Living Space' },
    { value: 'apartment', label: 'Apartment / Flat' },
    { value: 'room', label: 'Single Room' }
  ];

  const renderHero = () => {
    return (
      <section 
        key="list-hero" 
        className="relative border-b border-slate-200/80 text-slate-900 py-6 sm:py-8 px-4 sm:px-8 lg:px-14 overflow-hidden flex items-center min-h-[260px] sm:min-h-[280px] bg-cover bg-center md:bg-[center_right]"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1980&auto=format&fit=crop')` }}
      >
        {/* Rich White Opacity Overlay for 100% text readability & background visibility */}
        <div 
          className="absolute inset-0 z-0"
          style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.90) 50%, rgba(255,255,255,0.35) 100%)' }}
        ></div>

        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Left Column: Heading */}
          <div className="w-full md:max-w-[500px] lg:max-w-[540px] text-left space-y-2.5 text-slate-900">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-teal-200 text-[#0FA596] text-[10px] sm:text-xs font-black tracking-wide shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#0FA596] animate-pulse" />
              <span className="uppercase tracking-wider">Free Property Host Partner Portal</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
              List your property &amp; connect <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                with student tenants directly.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
              Reach thousands of students searching for verified PGs, Hostels, and Apartments with 100% Zero Brokerage.
            </p>

            {/* Trust Indicators Bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2.5 border-t border-slate-300/80 text-[11px] font-black text-slate-800 tracking-wide uppercase">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3 text-[#0FA596]" />
                </div>
                <span>Free Property Listing</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <span>Direct Tenants</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center">
                  <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <span>Zero Commission</span>
              </div>
            </div>
          </div>

          {/* Right Column: Open space */}
          <div className="hidden md:block w-full md:w-1/2"></div>

        </div>
      </section>
    );
  };

  const renderBenefits = () => {
    const content = getSectionContent('owner-benefits', {
      title: 'Why List with Us',
      subtitle: 'Direct bidding, direct tenant contact, and instant booking token payouts.'
    });
    return (
      <section key="owner-benefits" className="mb-6 md:mb-12">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">{content.title}</h2>
          <p className="text-sm text-gray-500">{content.subtitle}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          {[
            { icon: Building2, title: 'Free Listing', desc: 'List at no cost' },
            { icon: User, title: 'Direct Contact', desc: 'Connect directly' },
            { icon: Home, title: 'Verified Tenants', desc: 'Pre-verified students' }
          ].map((benefit, i) => (
            <div key={i} className="bg-white rounded-xl p-3 md:p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-50 md:bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <benefit.icon className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
              </div>
              <h3 className="text-[10px] md:text-base font-bold text-gray-900 mb-0.5">{benefit.title}</h3>
              <p className="text-gray-500 text-[9px] md:text-sm hidden sm:block">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderForm = () => {
    return (
      <section key="list-form" className="bg-white rounded-2xl shadow-md p-4 md:p-8">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <ListPlus className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Property Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="border-b border-gray-200 pb-4 md:pb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base ${errors.ownerName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit phone number"
                    className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4 md:pb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Property Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Property Name *</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    name="propertyName"
                    value={formData.propertyName}
                    onChange={handleChange}
                    placeholder="e.g., Sunshine PG, Royal Hostel"
                    className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base ${errors.propertyName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.propertyName && <p className="text-red-500 text-xs mt-1">{errors.propertyName}</p>}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Property Type *</label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base bg-white ${errors.propertyType ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select property type</option>
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.propertyType && <p className="text-red-500 text-xs mt-1">{errors.propertyType}</p>}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Monthly Rent (₹) *</label>
                <input
                  type="number"
                  name="rent"
                  value={formData.rent}
                  onChange={handleChange}
                  placeholder="e.g., 8000"
                  className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base ${errors.rent ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.rent && <p className="text-red-500 text-xs mt-1">{errors.rent}</p>}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">City *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Kota, Indore"
                    className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Area/Locality</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="e.g., Vijay Nagar, Main Market"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Enter complete address with landmarks"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Property Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe your property - number of rooms, amenities, nearby facilities, etc."
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => setFormData({
                ownerName: owner?.name || owner?.fullName || '',
                email: owner?.email || '',
                phone: owner?.phone || '',
                propertyName: '',
                propertyType: '',
                city: '',
                area: '',
                address: '',
                rent: '',
                description: ''
              })}
              className="flex-1 bg-gray-150 text-gray-700 font-semibold py-3 md:py-4 rounded-xl hover:bg-gray-200 transition-colors text-sm md:text-base"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={loadingForm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {loadingForm ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Listing
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    );
  };

  const defaultOrder = ['list-hero', 'owner-benefits', 'list-form'];
  let activeOrder = layoutSections.length > 0
    ? layoutSections.map(s => s.id)
    : defaultOrder;

  if (!activeOrder.includes('list-form')) {
    activeOrder.push('list-form');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <WebsiteNavbar />

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-4 border-[#0FA596] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Full Width Hero Section Edge-to-Edge Right Under Navbar */}
          {isSectionVisible('list-hero') && renderHero()}

          <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 w-full">
            {activeOrder.map(sectionId => {
              if (sectionId === 'list-hero' || !isSectionVisible(sectionId)) return null;
              switch (sectionId) {
                case 'owner-benefits': return renderBenefits();
                case 'list-form': return renderForm();
                default: return null;
              }
            })}

            <div className="mt-10 bg-teal-50/70 border border-teal-100/90 rounded-2xl p-6 shadow-2xs">
              <h3 className="font-extrabold text-slate-900 mb-1">Need Help Listing Your Property?</h3>
              <p className="text-slate-600 text-xs font-medium mb-4">Our support team is here to assist you with listing setup and verification.</p>
              <div className="flex flex-wrap gap-4 text-xs font-bold">
                <a href="tel:+918764425030" className="flex items-center gap-2 text-[#0FA596] hover:underline">
                  <Phone className="w-4 h-4" />
                  <span>+91 8764425030</span>
                </a>
                <a href="mailto:team@roomhy.com" className="flex items-center gap-2 text-[#0FA596] hover:underline">
                  <Mail className="w-4 h-4" />
                  <span>team@roomhy.com</span>
                </a>
              </div>
            </div>
          </main>
        </>
      )}

      <WebsiteFooter />
      <MobileBottomNav />

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for listing your property. Our team will review your submission and get in touch with you within 24 hours.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



