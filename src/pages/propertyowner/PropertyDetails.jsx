import React, { useEffect, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { clearOwnerRuntimeSession, getOwnerRuntimeSession } from "../../utils/propertyowner";
import { Plus, X, Upload, Camera, Gift, Check, Wifi, Wind, Droplet, Car, Dumbbell, Tv, Zap, Coffee } from "lucide-react";

export default function PropertyDetails() {
  useHtmlPage({
    title: "Roomhy - Property Details",
    bodyClass: "text-foreground",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [fetchError, setFetchError] = useState("");

  // Form states
  const [amenities, setAmenities] = useState([]);
  const [exclusiveBenefits, setExclusiveBenefits] = useState([]);
  const [propertyViews, setPropertyViews] = useState([]);
  const [facilities, setFacilities] = useState({
    wifi: false,
    ac: false,
    food: false,
    laundry: false,
    parking: false,
    gym: false,
    tv: false,
    powerBackup: false
  });

  // New item states
  const [newAmenity, setNewAmenity] = useState({ name: '', icon: 'check', category: 'basic' });
  const [newBenefit, setNewBenefit] = useState({ title: '', description: '', icon: 'gift' });
  const [newView, setNewView] = useState({ label: '', images: [], description: '' });

  // Available icons
  const availableIcons = [
    { value: 'check', label: 'Check', icon: Check },
    { value: 'wifi', label: 'WiFi', icon: Wifi },
    { value: 'wind', label: 'AC', icon: Wind },
    { value: 'droplet', label: 'Water', icon: Droplet },
    { value: 'car', label: 'Parking', icon: Car },
    { value: 'dumbbell', label: 'Gym', icon: Dumbbell },
    { value: 'tv', label: 'TV', icon: Tv },
    { value: 'zap', label: 'Power', icon: Zap },
    { value: 'coffee', label: 'Food', icon: Coffee },
    { value: 'gift', label: 'Gift', icon: Gift }
  ];

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
      return;
    }
    setOwner(session);
    fetchPropertyDetails();
  }, []);


const fetchPropertyDetails = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const session = getOwnerRuntimeSession();
      const response = await fetch(`/api/properties/ensure-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerLoginId: session.loginId })
      });
      const data = await response.json();
      if (data.success) {
        setProperty(data.property);
        setAmenities(data.property.amenities || []);
        setExclusiveBenefits(data.property.exclusiveBenefits || []);
        setPropertyViews(data.property.propertyViews || []);
        setFacilities(data.property.facilities || facilities);
      } else {
        setFetchError(data.message || 'Failed to load property details.');
      }
    } catch {
      setFetchError('Failed to load property details. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const savePropertyDetails = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const session = getOwnerRuntimeSession();
      const response = await fetch(`/api/properties/${property._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({ amenities, exclusiveBenefits, propertyViews, facilities })
      });
      const data = await response.json();
      if (data.success) {
        setProperty(data.property);
        setSaveMsg({ type: 'success', text: 'Property details updated successfully.' });
      } else {
        setSaveMsg({ type: 'error', text: data.message || 'Save failed. Please try again.' });
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Save failed. Please check your connection and try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 5000);
    }
  };

  const addAmenity = () => {
    if (newAmenity.name.trim()) {
      setAmenities([...amenities, { ...newAmenity }]);
      setNewAmenity({ name: '', icon: 'check', category: 'basic' });
    }
  };

  const removeAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const addBenefit = () => {
    if (newBenefit.title.trim()) {
      setExclusiveBenefits([...exclusiveBenefits, { ...newBenefit }]);
      setNewBenefit({ title: '', description: '', icon: 'gift' });
    }
  };

  const removeBenefit = (index) => {
    setExclusiveBenefits(exclusiveBenefits.filter((_, i) => i !== index));
  };

  const addView = () => {
    if (newView.label.trim() && newView.images.length > 0) {
      setPropertyViews([...propertyViews, { ...newView }]);
      setNewView({ label: '', images: [], description: '' });
    }
  };

  const removeView = (index) => {
    setPropertyViews(propertyViews.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e, viewType = 'new') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const toDataUrl = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const compress = (dataUrl, maxWidth = 1200) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(maxWidth / img.width, 1);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          try {
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = dataUrl;
      });

    try {
      const imageUrls = [];
      for (const file of files) {
        const raw = await toDataUrl(file);
        const compressed = await compress(raw, 1200);
        imageUrls.push(compressed);
      }

      if (viewType === 'new') {
        setNewView({ ...newView, images: [...newView.images, ...imageUrls] });
      }
    } catch (err) {
      console.error('Image processing failed', err);
    }
  };

  if (loading) {
    return (
      <PropertyOwnerLayout owner={owner} title="Property Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </PropertyOwnerLayout>
    );
  }

  if (fetchError) {
    return (
      <PropertyOwnerLayout
        owner={owner}
        title="Property Details"
        onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm font-medium flex items-center gap-4">
          {fetchError}
          <button onClick={fetchPropertyDetails} className="underline font-bold shrink-0">Retry</button>
        </div>
      </PropertyOwnerLayout>
    );
  }

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Property Details"
      navVariant="property"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
      contentClassName="max-w-6xl mx-auto"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{property?.title}</h2>
              <p className="text-gray-600 mt-1">{property?.address}</p>
            </div>
            <button
              onClick={savePropertyDetails}
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {saveMsg && (
            <div className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-3 ${
              saveMsg.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {saveMsg.text}
              {saveMsg.type === 'error' && (
                <button onClick={savePropertyDetails} className="underline font-bold shrink-0">Retry</button>
              )}
            </div>
          )}
        </div>

        {/* Quick Facilities */}
        <div className="bg-card rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Facilities</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(facilities).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setFacilities({ ...facilities, [key]: e.target.checked })}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities Section */}
        <div className="bg-card rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Amenities</h3>
          
          {/* Add New Amenity */}
          <div className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Amenity name"
                value={newAmenity.name}
                onChange={(e) => setNewAmenity({ ...newAmenity, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={newAmenity.icon}
                onChange={(e) => setNewAmenity({ ...newAmenity, icon: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {availableIcons.map(icon => (
                  <option key={icon.value} value={icon.value}>{icon.label}</option>
                ))}
              </select>
              <select
                value={newAmenity.category}
                onChange={(e) => setNewAmenity({ ...newAmenity, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="basic">Basic</option>
                <option value="comfort">Comfort</option>
                <option value="luxury">Luxury</option>
              </select>
              <button
                onClick={addAmenity}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Existing Amenities */}
          <div className="space-y-2">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {availableIcons.find(i => i.value === amenity.icon)?.icon && 
                    React.createElement(availableIcons.find(i => i.value === amenity.icon).icon, { className: "w-5 h-5 text-purple-600" })
                  }
                  <span className="font-medium">{amenity.name}</span>
                  <span className="text-sm text-gray-500 capitalize">{amenity.category}</span>
                </div>
                <button
                  onClick={() => removeAmenity(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Exclusive Benefits Section */}
        <div className="bg-card rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Exclusive Direct Benefits</h3>
          
          {/* Add New Benefit */}
          <div className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Benefit title"
                value={newBenefit.title}
                onChange={(e) => setNewBenefit({ ...newBenefit, title: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newBenefit.description}
                onChange={(e) => setNewBenefit({ ...newBenefit, description: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={addBenefit}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Benefit
              </button>
            </div>
          </div>

          {/* Existing Benefits */}
          <div className="space-y-2">
            {exclusiveBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium">{benefit.title}</div>
                  {benefit.description && (
                    <div className="text-sm text-gray-600">{benefit.description}</div>
                  )}
                </div>
                <button
                  onClick={() => removeBenefit(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Property Views Section */}
        <div className="bg-card rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Property Views (Like OYO)</h3>
          
          {/* Add New View */}
          <div className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="View label (e.g., Facade, Room, Kitchen)"
                  value={newView.label}
                  onChange={(e) => setNewView({ ...newView, label: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newView.description}
                  onChange={(e) => setNewView({ ...newView, description: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images for this View
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'new')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {newView.images.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {newView.images.length} image(s) selected
                  </div>
                )}
              </div>
              
              <button
                onClick={addView}
                disabled={!newView.label.trim() || newView.images.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add View
              </button>
            </div>
          </div>

          {/* Existing Views */}
          <div className="space-y-4">
            {propertyViews.map((view, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{view.label}</h4>
                  <button
                    onClick={() => removeView(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {view.description && (
                  <p className="text-sm text-gray-600 mb-2">{view.description}</p>
                )}
                <div className="text-sm text-gray-500">
                  {view.images?.length || 0} image(s)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
