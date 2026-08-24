import { MapPin, Star, Shield, ExternalLink } from "lucide-react";

export default function PropertyHeader({ property, reviewStats }) {
  const hasCoordinates = property?.latitude && property?.longitude;

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return "EXCELLENT";
    if (rating >= 4.0) return "VERY GOOD";
    if (rating >= 3.5) return "GOOD";
    if (rating >= 3.0) return "AVERAGE";
    return "FAIR";
  };

  const getRatingBg = (rating) => {
    if (rating >= 4) return '#1ab64f';
    if (rating >= 3) return '#f0ad4e';
    return '#e74c3c';
  };

  const avgRating = reviewStats?.avgRating || property?.rating || 0;
  const totalReviews = reviewStats?.totalReviews || 0;

  return (
    <div className="px-4 md:px-0">
      {/* Property Name + Rating Row — OYO style inline */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl sm:text-2xl md:text-[26px] font-bold text-[#222] leading-tight">
          {property?.name || "Property"}
        </h1>
        
        {/* OYO-style rating badge — top right */}
        {avgRating > 0 && (
          <div className="flex-shrink-0 text-center">
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white font-bold" style={{ background: getRatingBg(avgRating) }}>
              {avgRating.toFixed(1)}
              <Star size={12} className="fill-white text-white" />
            </div>
            <p className="text-[10px] text-[#6d787d] mt-1">{totalReviews} Ratings</p>
          </div>
        )}
      </div>

      {/* Address — OYO style */}
      <p className="text-[13px] text-[#6d787d] mt-1.5 leading-relaxed">
        {property?.address || `${property?.area ? `${property.area}, ` : ""}${property?.location || ""}`}
      </p>

      {/* Badges Row — OYO style horizontal pills */}
      <div className="flex flex-wrap items-center gap-3 mt-3">
        {property?.type && (
          <div className="flex items-center gap-1.5 text-xs text-[#222]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#222]"></span>
            <span className="font-medium capitalize">{property.type}</span>
          </div>
        )}
        {property?.verified && (
          <div className="flex items-center gap-1 text-xs text-[#1ab64f] font-medium">
            <Shield size={12} />
            <span>Verified</span>
          </div>
        )}
        {((property?.category) || (property?.gender && property.gender !== "Any")) && (
          <div className="flex items-center gap-1 text-xs text-[#6d787d] font-medium">
            <span>•</span>
            <span>{property.category || property.gender}</span>
          </div>
        )}
        {/* Check-in rating — OYO style */}
        {avgRating > 0 && (
          <div className="flex items-center gap-1 text-xs text-[#6d787d]">
            <span>•</span>
            <span className="font-medium">{getRatingLabel(avgRating)}</span>
          </div>
        )}
      </div>

      {/* View on map link — OYO style */}
      {hasCoordinates && (
        <a
          href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2.5 text-[#EE4266] text-sm font-semibold hover:underline"
        >
          View on map <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}
