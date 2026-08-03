import { useState, useEffect } from 'react';
import { ListPlus, Send, CheckCircle, Loader, Building2, User, Mail, Phone, MapPin, Home } from 'lucide-react';
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { submitEnquiry, fetchJson } from '../../utils/api';
import { getOwnerRuntimeSession } from '../../utils/propertyowner';
import useSEO from '../../hooks/useSEO';

export default function ListYourPropertyPage() {
  useSEO({ pageKey: 'list-property', fallbackTitle: 'List Your Property on Roomhy - Zero Commission' });
  const owner = getOwnerRuntimeSession();

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
    if (layoutSections.length === 0) return true;
    const sec = layoutSections.find(s => s.id === id);
    return sec ? sec.visible : true;
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
      alert('Failed to submit. Please try again.');
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
    const content = getSectionContent('list-hero', {
      title: 'List Your Property',
      subtitle: 'Reach thousands of students looking for accommodation'
    });
    return (
      <div key="list-hero" className="relative w-full py-10 px-6 overflow-hidden border-b border-stone-200/50" 
           style={{ background: 'linear-gradient(135deg, #FFFAF5 0%, #FDFCFB 50%, #F5F7FA 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
        </div>
        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-[1px] w-8 bg-[#C5A059]/40 hidden md:block"></div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
              {content.title}
            </h1>
            <div className="h-[1px] w-8 bg-[#C5A059]/40 hidden md:block"></div>
          </div>
          <p className="text-base md:text-lg text-stone-500 font-normal opacity-90 max-w-xl mx-auto">
            {content.subtitle}
          </p>
          <div className="mt-4 w-1.5 h-1.5 rounded-full bg-[#C5A059]/30"></div>
        </div>
      </div>
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
  const activeOrder = layoutSections.length > 0
    ? layoutSections.map(s => s.id)
    : defaultOrder;

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteNavbar />

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-12">
          {activeOrder.map(sectionId => {
            if (!isSectionVisible(sectionId)) return null;
            switch (sectionId) {
              case 'list-hero': return renderHero();
              case 'owner-benefits': return renderBenefits();
              case 'list-form': return renderForm();
              default: return null;
            }
          })}

          <div className="mt-12 bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-4">Our team is here to assist you with listing your property</p>
            <div className="flex flex-wrap gap-4">
              <a href="tel:+911234567890" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <Phone className="w-4 h-4" />
                <span>+91 12345 67890</span>
              </a>
              <a href="mailto:team@roomhy.com" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <Mail className="w-4 h-4" />
                <span>team@roomhy.com</span>
              </a>
            </div>
          </div>
        </main>
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



