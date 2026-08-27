import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchProperties, getPropertyDetailsUrl } from "../../../utils/api";

export default function CompareSection({ currentProperty }) {
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSimilar = async () => {
      try {
        setLoading(true);
        const allProperties = await fetchProperties();
        
        const similar = allProperties
          .filter((p) => {
            const pId = p._id || p.visitId || p.propertyName;
            const currentId = currentProperty?.id;
            if (pId === currentId) return false;
            
            const pCity = p.propertyInfo?.city || p.city || "";
            const pType = p.propertyInfo?.propertyType || p.propertyType || "";
            
            return (
              pCity.toLowerCase() === (currentProperty?.location || "").toLowerCase() ||
              pType.toLowerCase() === (currentProperty?.type || "").toLowerCase()
            );
          })
          .slice(0, 6)
          .map((p) => ({
            id: p._id || p.visitId || p.propertyName,
            name: p.propertyName || p.property_name || "Property",
            location: p.propertyInfo?.city || p.city || "Location",
            price: p.propertyInfo?.rent || p.monthlyRent || p.price || 0,
            image: p.propertyInfo?.photos?.[0] || p.propertyImage || `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 100)}`,
            rating: p.rating || 4.0,
            type: p.propertyInfo?.propertyType || p.propertyType || "PG",
          }));

        setSimilarProperties(similar);
      } catch (error) {
        console.error("Error loading similar properties:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentProperty) loadSimilar();
  }, [currentProperty]);

  if (loading || similarProperties.length === 0) return null;

  const getRatingBg = (rating) => {
    if (rating >= 4) return '#1ab64f';
    if (rating >= 3) return '#f0ad4e';
    return '#e74c3c';
  };

  return (
    <div className="py-5 md:py-6" style={{ borderBottom: '1px solid #e8e8e8' }}>
      <div className="px-4 md:px-0 mb-4">
        <h2 className="text-[22px] font-bold text-[#222]">Compare with similar properties</h2>
        <p className="text-[#6d787d] text-xs mt-0.5">Find the perfect stay for you</p>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-4 no-scrollbar">
        {/* Current Property — Sticky on the left for comparison */}
        <div className="sticky left-0 z-20 flex-shrink-0 w-[210px] bg-white pr-4 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.1)]">
          <div className="relative rounded-lg overflow-hidden" style={{ border: '2px solid #EE4266' }}>
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-r-full text-[10px] font-bold text-white uppercase tracking-wider shadow-md" style={{ background: '#EE4266' }}>
              ★ Current
            </div>
            <div className="h-[130px] bg-[#f0f0f0]">
              <img
                src={currentProperty?.image || `https://picsum.photos/600/400?random=1`}
                alt={currentProperty?.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="pt-2.5">
            <p className="text-[13px] font-bold text-[#222] line-clamp-1">{currentProperty?.name}</p>
            <p className="text-[11px] text-[#6d787d] mt-0.5">{currentProperty?.location}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-sm font-extrabold text-[#222]">₹{currentProperty?.price}</span>
              <span className="text-[10px] text-[#6d787d]">/mo</span>
            </div>
            <div className="mt-2 py-1.5 text-center text-[10px] font-bold rounded text-[#1ab64f]" style={{ background: '#eef7ee', border: '1px solid #c6e6c6' }}>
              ✓ Selected
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.map((prop) => (
          <Link
            key={prop.id}
            to={getPropertyDetailsUrl(prop)}
            className="flex-shrink-0 w-[200px] group"
          >
            <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>
              <div className="h-[130px] bg-[#f0f0f0]">
                <img
                  src={prop.image}
                  alt={prop.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 100)}`;
                  }}
                />
              </div>
              {/* Rating badge — OYO style bottom-left */}
              <div className="absolute bottom-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-white text-[10px] font-bold" style={{ background: getRatingBg(prop.rating) }}>
                {prop.rating}<Star size={8} className="fill-white text-white" />
              </div>
            </div>
            <div className="pt-2.5">
              <p className="text-[13px] font-bold text-[#222] line-clamp-1">{prop.name}</p>
              <p className="text-[11px] text-[#6d787d] mt-0.5">{prop.location}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-sm font-extrabold text-[#222]">₹{prop.price}</span>
                <span className="text-[10px] text-[#6d787d]">/mo</span>
              </div>
              <div className="mt-2 py-1.5 text-center text-[10px] font-semibold rounded text-[#222] group-hover:bg-[#EE4266] group-hover:text-white group-hover:border-[#EE4266] transition-colors" style={{ border: '1px solid #e0e0e0' }}>
                View Stay
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
