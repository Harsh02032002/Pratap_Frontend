import { Home, Clock, Users, ShieldCheck, Utensils, Wifi, Car, Dumbbell, Bed, Users2, DollarSign, CheckCircle } from "lucide-react";

const ICON_MAP = {
  restaurant: Utensils,
  longstay: Clock,
  family: Users,
  verified: ShieldCheck,
  wifi: Wifi,
  parking: Car,
  gym: Dumbbell,
  bedrooms: Bed,
  male: Users2,
  rent: DollarSign,
  available: CheckCircle,
  default: Home,
};

export default function HighlightsSection({ property = {} }) {
  const { 
    highlights = [], 
    amenities = [], 
    facilities = {},
    totalRooms,
    gender,
    monthlyRent,
    status,
    isPublished 
  } = property;

  // Build dynamic highlights from property data
  let displayHighlights = [];

  // Add custom highlights if available
  if (highlights && highlights.length > 0) {
    displayHighlights = highlights;
  } else {
    // Generate highlights from property data
    
    // Property status
    if (isPublished && status === 'active') {
      displayHighlights.push({ 
        icon: "verified", 
        text: "Verified Property", 
        subtext: "Inspected & approved by Roomhy" 
      });
    }

    // Gender specific
    const gNorm = String(gender || '').toLowerCase().trim();
    if (gNorm.includes('female') || gNorm.includes('girl') || gNorm.includes('women') || gNorm.includes('ladies')) {
      displayHighlights.push({ 
        icon: "family", 
        text: "For Female", 
        subtext: "Girls accommodation" 
      });
    } else if (gNorm.includes('male') || gNorm.includes('boy') || gNorm.includes('men') || gNorm.includes('gents')) {
      displayHighlights.push({ 
        icon: "male", 
        text: "For Male", 
        subtext: "Boys accommodation" 
      });
    } else {
      displayHighlights.push({ 
        icon: "family", 
        text: "Co-Ed / Unisex", 
        subtext: "Suitable for everyone" 
      });
    }


    // Room count
    if (totalRooms && totalRooms > 0) {
      displayHighlights.push({ 
        icon: "bedrooms", 
        text: `${totalRooms} Bedrooms`, 
        subtext: "Spacious accommodation" 
      });
    }

    // Rent
    if (monthlyRent && monthlyRent > 0) {
      displayHighlights.push({ 
        icon: "rent", 
        text: `₹${monthlyRent}/month`, 
        subtext: "Affordable pricing" 
      });
    }

    // Availability
    if (status === 'active') {
      displayHighlights.push({ 
        icon: "available", 
        text: "Available", 
        subtext: "Ready to book" 
      });
    }

    // Facilities based highlights
    if (facilities.wifi) {
      displayHighlights.push({ 
        icon: "wifi", 
        text: "Free WiFi", 
        subtext: "High-speed internet" 
      });
    }

    if (facilities.parking) {
      displayHighlights.push({ 
        icon: "parking", 
        text: "Parking Available", 
        subtext: "On-site parking" 
      });
    }

    if (facilities.gym) {
      displayHighlights.push({ 
        icon: "gym", 
        text: "Gym Access", 
        subtext: "Fitness center" 
      });
    }

    if (facilities.food) {
      displayHighlights.push({ 
        icon: "restaurant", 
        text: "Food Included", 
        subtext: "Mess facility" 
      });
    }
  }

  // OYO-style: show as a highlight banner
  const bannerHighlights = displayHighlights.filter(h => 
    h.icon === 'verified' || h.icon === 'available'
  );
  const gridHighlights = displayHighlights.filter(h => 
    h.icon !== 'verified' && h.icon !== 'available'
  );

  return (
    <div className="px-4 md:px-0 py-5 md:py-6" style={{ borderBottom: '1px solid #e8e8e8' }}>
      {/* OYO-style highlight banner */}
      {bannerHighlights.length > 0 && (
        <div className="mb-5 px-4 py-3 rounded-lg" style={{ background: '#eef7ee', border: '1px solid #c6e6c6' }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {bannerHighlights.map((item, idx) => {
              const IconComponent = ICON_MAP[item.icon] || ICON_MAP.default;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <IconComponent size={16} className="text-[#1ab64f]" />
                  <span className="text-sm text-[#1a1a1a] font-medium">{item.text}</span>
                  {item.subtext && (
                    <span className="text-xs text-[#6d787d]">• {item.subtext}</span>
                  )}
                  {idx < bannerHighlights.length - 1 && (
                    <span className="text-gray-300 mx-1">|</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h2 className="text-[22px] font-bold text-[#222] mb-4">
        Why book this property?
      </h2>

      {/* OYO-style: clean grid with icon + text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {gridHighlights.map((item, idx) => {
          const IconComponent = ICON_MAP[item.icon] || ICON_MAP.default;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 py-2"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                background: '#f5f5f5'
              }}>
                <IconComponent size={20} className="text-[#6d787d]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#222]">{item.text}</p>
                {item.subtext && (
                  <p className="text-xs text-[#6d787d] mt-0.5">{item.subtext}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
