import { useState } from "react";
// Named imports so only these icons are bundled (not the whole lucide set).
import { Bed, Users, Wifi, Wind, Droplet, ChevronDown, ChevronUp, DollarSign, CheckCircle, Droplets, Car, Dumbbell, Utensils, Zap, Shirt, Tv, Shield, Waves, Fan, Home, Check } from "lucide-react";

function getAmenityIcon(amenity) {
  const name = typeof amenity === 'string' ? amenity : (amenity?.name || "");
  const iconName = typeof amenity === 'string' ? '' : (amenity?.icon || "");
  const lower = (name + " " + iconName).toLowerCase();
  
  const iconMap = {
    wifi: Wifi, ac: Wind, water: Droplets, parking: Car, gym: Dumbbell,
    food: Utensils, kitchen: Utensils, mess: Utensils, tv: Tv,
    power: Zap, laundry: Shirt, security: Shield, cctv: Shield,
    pool: Waves, fan: Fan, bed: Bed, room: Home
  };

  for (const [key, IconComp] of Object.entries(iconMap)) {
    if (lower.includes(key)) return IconComp;
  }
  return Check;
}

function normalizeCategory(category) {
  if (!category) return "basic";
  const normalized = String(category).trim().toLowerCase();
  if (["popular", "mostpopular", "most_popular", "most-popular"].includes(normalized)) return "popular";
  if (["basic", "amenity", "amenities"].includes(normalized)) return "basic";
  return normalized;
}

export default function DescriptionSection({ description, amenities = [], beds, gender, price }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_LENGTH = 200;
  const isLong = description && description.length > MAX_LENGTH;

  // Quick info items — OYO style: simple key-value pairs in a row
  const quickInfo = [
    { label: "BEDROOMS", value: beds || "1", icon: Bed, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "FOR", value: gender || "Any", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "MONTHLY RENT", value: `₹${price || 0}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "STATUS", value: "Available", icon: CheckCircle, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const popularAmenities = amenities.filter((amenity) => {
    return normalizeCategory(typeof amenity === "string" ? "basic" : amenity?.category) === "popular";
  });

  return (
    <div className="px-4 md:px-0 py-5 md:py-6" style={{ borderBottom: '1px solid #e8e8e8' }}>
      {/* Quick Info — OYO-style horizontal stat bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 mb-6 rounded-lg overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>
        {quickInfo.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.label} 
              className="text-center py-4 px-3 flex flex-col items-center justify-center"
              style={{ 
                borderRight: idx < quickInfo.length - 1 && idx !== 1 ? '1px solid #e8e8e8' : 'none',
                borderBottom: idx < 2 ? '1px solid #e8e8e8' : 'none',
              }}
            >
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <p className="text-[10px] text-[#6d787d] uppercase tracking-wider font-bold">{item.label}</p>
              <p className="text-[#222] font-black text-[15px] mt-0.5">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* About this property — OYO style */}
      <h2 className="text-[22px] font-bold text-[#222] mb-2">About this property</h2>
      <p className="text-[15px] text-[#6d787d] leading-relaxed">
        {isLong && !expanded
          ? `${description.slice(0, MAX_LENGTH)}...`
          : description || "No description provided"}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-[#EE4266] text-sm font-semibold hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}

      {/* Most Popular For */}
      {popularAmenities.length > 0 && (
        <div className="mt-6">
          <h3 className="text-base font-bold text-[#222] mb-3">Most Popular For</h3>
          <div className="flex flex-wrap gap-2.5">
            {popularAmenities.map((amenity, idx) => {
              const amenityName = typeof amenity === 'string' ? amenity : (amenity?.name || "");
              const Icon = getAmenityIcon(amenity);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-[#222]"
                  style={{ border: '1px solid #e8e8e8', background: '#fafafa' }}
                >
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">{amenityName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
