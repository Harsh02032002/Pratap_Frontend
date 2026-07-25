import React, { useEffect, useState } from 'react';
import { ListPlus, Send, CheckCircle, Loader, User, Mail, Phone, MapPin, Home, Plus, X, Image as ImageIcon, MapPinned } from 'lucide-react';
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { fetchJson, getApiBase, getAuthHeader } from '../../utils/api';
import { clearOwnerRuntimeSession, getOwnerRuntimeSession } from "../../utils/propertyowner";
import LocationMapPicker from '../../components/website/LocationMapPicker';

export default function AddPropertyWizard() {
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
    landmark: '',
    latitude: '',
    longitude: '',
    rent: '',
    description: '',
    images: [],
    propertyViews: [{ label: 'Main', images: [] }]
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [errors, setErrors] = useState({});

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

  const uploadImages = async (files, target = 'images', viewIndex = null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.append('image', file);

        const base = getApiBase();
        const res = await fetch(`${base}/api/upload`, {
          method: 'POST',
          body: data,
          headers: getAuthHeader()
        });

        let json;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          json = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || `HTTP error ${res.status}`);
        }

        if (!res.ok) throw new Error(json.error || 'Upload failed');
        if (json.url) uploadedUrls.push(json.url);
      }

      if (target === 'images') {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls]
        }));
      } else if (target === 'propertyViews' && viewIndex !== null) {
        setFormData(prev => {
          const nextViews = [...(prev.propertyViews || [])];
          nextViews[viewIndex] = {
            ...nextViews[viewIndex],
            images: [...(nextViews[viewIndex].images || []), ...uploadedUrls]
          };
          return { ...prev, propertyViews: nextViews };
        });
      }
    } catch (error) {
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const addCustomView = () => {
    setFormData(prev => ({
      ...prev,
      propertyViews: [...(prev.propertyViews || []), { label: 'New Category', images: [] }]
    }));
  };

  const handleLocationSelect = ({ latitude, longitude, location }) => {
    setFormData(prev => ({
      ...prev,
      latitude,
      longitude,
      city: prev.city || (location ? location.split(',')[0] : prev.city)
    }));
    setShowLocationPicker(false);
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

    setLoading(true);
    try {
      const propertyData = {
        title: formData.propertyName,
        description: formData.description || '',
        address: formData.address || '',
        city: formData.city,
        locality: formData.area || '',
        landmark: formData.landmark || '',
        latitude: formData.latitude || '',
        longitude: formData.longitude || '',
        propertyType: formData.propertyType || 'pg',
        monthlyRent: parseInt(formData.rent, 10) || 0,
        ownerLoginId: owner?.loginId || '',
        ownerName: formData.ownerName,
        ownerPhone: formData.phone,
        images: formData.images || [],
        featuredImage: formData.images?.[0] || '',
        propertyViews: formData.propertyViews || [],
        status: 'pending_approval',
        contact: {
          name: formData.ownerName,
          number: formData.phone,
          email: formData.email
        }
      };

      await fetchJson('/api/properties/add', {
        method: 'POST',
        body: JSON.stringify(propertyData)
      });

      setShowSuccess(true);
      setFormData({
        ownerName: owner?.name || owner?.fullName || '',
        email: owner?.email || '',
        phone: owner?.phone || '',
        propertyName: '',
        propertyType: '',
        city: '',
        area: '',
        address: '',
        landmark: '',
        latitude: '',
        longitude: '',
        rent: '',
        description: '',
        images: [],
        propertyViews: [{ label: 'Main', images: [] }]
      });
    } catch (error) {
      console.error('Error submitting property:', error);
      alert('Failed to submit property listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    { value: 'pg', label: 'PG / Paying Guest' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'coliving', label: 'Co-Living Space' },
    { value: 'apartment', label: 'Apartment / Flat' },
    { value: 'room', label: 'Single Room' }
  ];

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Add Property"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-card rounded-2xl shadow-soft border border-border p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <ListPlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-foreground">List Your Property</h2>
              <p className="text-[13px] text-muted-foreground mt-1">Submit your property details and start receiving tenant leads.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground mb-5 uppercase tracking-wide">Owner Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Full Name <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={`w-full pl-10 pr-4 py-3 bg-muted/30 border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.ownerName ? 'border-destructive' : 'border-border'}`}
                    />
                  </div>
                  {errors.ownerName && <p className="text-destructive text-[11px] mt-1.5">{errors.ownerName}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Email Address <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className={`w-full pl-10 pr-4 py-3 bg-muted/30 border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.email ? 'border-destructive' : 'border-border'}`}
                    />
                  </div>
                  {errors.email && <p className="text-destructive text-[11px] mt-1.5">{errors.email}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Phone Number <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      className={`w-full pl-10 pr-4 py-3 bg-muted/30 border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.phone ? 'border-destructive' : 'border-border'}`}
                    />
                  </div>
                  {errors.phone && <p className="text-destructive text-[11px] mt-1.5">{errors.phone}</p>}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="text-[15px] font-semibold text-foreground mb-5 uppercase tracking-wide">Property Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Property Name <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="propertyName"
                      value={formData.propertyName}
                      onChange={handleChange}
                      placeholder="e.g., Sunshine PG, Royal Hostel"
                      className={`w-full pl-10 pr-4 py-3 bg-muted/30 border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.propertyName ? 'border-destructive' : 'border-border'}`}
                    />
                  </div>
                  {errors.propertyName && <p className="text-destructive text-[11px] mt-1.5">{errors.propertyName}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Property Type <span className="text-destructive">*</span></label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-muted/30 border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.propertyType ? 'border-destructive' : 'border-border'}`}
                  >
                    <option value="">Select property type</option>
                    {propertyTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {errors.propertyType && <p className="text-destructive text-[11px] mt-1.5">{errors.propertyType}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Monthly Rent (₹) <span className="text-destructive">*</span></label>
                  <input
                    type="number"
                    name="rent"
                    value={formData.rent}
                    onChange={handleChange}
                    placeholder="e.g., 8000"
                    className={`w-full px-4 py-3 bg-muted/30 border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.rent ? 'border-destructive' : 'border-border'}`}
                  />
                  {errors.rent && <p className="text-destructive text-[11px] mt-1.5">{errors.rent}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">City <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g., Kota, Indore"
                      className={`w-full pl-10 pr-4 py-3 bg-muted/30 border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.city ? 'border-destructive' : 'border-border'}`}
                    />
                  </div>
                  {errors.city && <p className="text-destructive text-[11px] mt-1.5">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Area/Locality</label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="e.g., Vijay Nagar, Main Market"
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Full Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter complete address with landmarks"
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="e.g., Near Kota Junction, behind Allen"
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-[12px] font-semibold text-muted-foreground">Satellite Coordinates</label>
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(true)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
                    >
                      <MapPinned className="w-3.5 h-3.5" />
                      Pick on map
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="Latitude"
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="Longitude"
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Property Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe your property - number of rooms, amenities, nearby facilities, etc."
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <label className="block text-[12px] font-semibold text-muted-foreground">Images (Main, Front, Room Views)</label>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {(formData.images || []).map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`property-${index}`} className="w-16 h-16 object-cover rounded-lg border border-border" />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index)
                          }))}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => uploadImages(e.target.files, 'images')}
                      />
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-[12px] font-semibold text-muted-foreground">Categorized Property Images</label>
                    <button
                      type="button"
                      onClick={addCustomView}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Category
                    </button>
                  </div>

                  {(formData.propertyViews || []).map((view, index) => (
                    <div key={index} className="bg-muted/20 rounded-xl p-4 border border-border relative mb-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          propertyViews: prev.propertyViews.filter((_, i) => i !== index)
                        }))}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="mb-3 w-3/4">
                        <input
                          value={view.label}
                          onChange={(e) => {
                            setFormData(prev => {
                              const nextViews = [...prev.propertyViews];
                              nextViews[index] = { ...nextViews[index], label: e.target.value };
                              return { ...prev, propertyViews: nextViews };
                            });
                          }}
                          placeholder="e.g. Main, Room, Interior, Building"
                          className="w-full bg-transparent border-b border-border focus:border-primary text-sm font-semibold uppercase tracking-wider outline-none py-1 transition-colors"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(view.images || []).map((img, imgIndex) => (
                          <div key={imgIndex} className="relative group">
                            <img src={img} className="w-16 h-16 object-cover rounded-lg border border-border" alt="" />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => {
                                  const nextViews = [...prev.propertyViews];
                                  nextViews[index] = {
                                    ...nextViews[index],
                                    images: nextViews[index].images.filter((_, i) => i !== imgIndex)
                                  };
                                  return { ...prev, propertyViews: nextViews };
                                });
                              }}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => uploadImages(e.target.files, 'propertyViews', index)}
                          />
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-border">
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
                  landmark: '',
                  latitude: '',
                  longitude: '',
                  rent: '',
                  description: '',
                  images: [],
                  propertyViews: [{ label: 'Main', images: [] }]
                })}
                className="flex-1 bg-muted text-foreground font-semibold py-4 rounded-xl hover:bg-muted/80 transition-colors text-[13px]"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 text-[13px] shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : uploading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Listing</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showLocationPicker && (
        <LocationMapPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-[22px] font-bold text-foreground mb-2">Listing Submitted!</h2>
            <p className="text-[14px] text-muted-foreground mb-8">
              Thank you for listing your property. Our team will review your submission and get in touch with you within 24 hours.
            </p>
            <button
              onClick={() => { setShowSuccess(false); window.location.href = "/propertyowner/properties"; }}
              className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Back to Properties
            </button>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
