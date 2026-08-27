import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { fetchProperties } from '../../utils/api';

const featuredProperties = [
  {
    name: "Sunshine PG",
    location: "Koramangala, Bangalore",
    price: "₹8,500",
    rating: 4.8,
    verified: true,
    image: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    name: "Student Hub",
    location: "Powai, Mumbai",
    price: "₹12,000",
    rating: 4.9,
    verified: true,
    image: "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    name: "Campus Stay",
    location: "Vijay Nagar, Delhi",
    price: "₹7,500",
    rating: 4.7,
    verified: true,
    image: "https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    name: "Scholar's Den",
    location: "Aundh, Pune",
    price: "₹9,000",
    rating: 4.6,
    verified: true,
    image: "https://images.pexels.com/photos/1571467/pexels-photo-1571467.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    name: "Study Nest",
    location: "Madivala, Bangalore",
    price: "₹8,000",
    rating: 4.5,
    verified: true,
    image: "https://images.pexels.com/photos/1571470/pexels-photo-1571470.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    name: "Academic Homes",
    location: "T-Nagar, Chennai",
    price: "₹10,500",
    rating: 4.8,
    verified: true,
    image: "https://images.pexels.com/photos/1571462/pexels-photo-1571462.jpeg?auto=compress&cs=tinysrgb&w=800"
  }
];

export default function MobilePropertiesSection() {
  const [properties, setProperties] = useState(featuredProperties);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const allProperties = await fetchProperties();
        if (allProperties && allProperties.length > 0) {
          const mapped = allProperties.slice(0, 8).map(p => ({
            id: p._id || p.id,
            name: p.propertyName || p.name || 'Roomhy Stay',
            location: `${p.propertyInfo?.area || p.area || p.city || 'Kota'}, ${p.city || 'Kota'}`,
            price: `₹${p.propertyInfo?.rent || p.monthlyRent || p.rent || '8,500'}`,
            rating: 4.5,
            verified: true,
            image: p.propertyInfo?.photos?.[0] || p.featuredImage || p.images?.[0] || featuredProperties[0].image
          }));
          setProperties(mapped);
        }
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, []);

  if (loading) {
    return (
      <section className="md:hidden bg-gray-50 py-5 px-4">
        <div className="animate-pulse">
          <div className="bg-white rounded-xl h-44 mx-auto max-w-sm"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="md:hidden bg-gray-50 py-4">
      {/* Section Header */}
      <div className="px-4 mb-2.5">
        <h2 className="text-lg font-bold text-gray-900 mb-0.5">Trending Stays This Week</h2>
        <p className="text-xs text-gray-600">Most popular properties among students</p>
      </div>

      {/* Native Horizontal Scroll Container for Finger Swipe */}
      <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {properties.map((property, idx) => (
          <Link
            key={property.id || idx}
            to={property.id ? `/website/propertydetails/${property.id}` : '/website/ourproperty'}
            className="flex-shrink-0 w-[42%] max-w-[160px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden snap-align-start active:scale-98 transition-transform"
          >
            {/* Property Image */}
            <div className="relative h-24 overflow-hidden bg-gray-100">
              <img src={property.image} alt={property.name} className="w-full h-full object-cover" loading="lazy" />
              {property.verified && (
                <div className="absolute top-1 right-1 bg-white/90 backdrop-blur-xs rounded-full px-1.5 py-0.5 flex items-center shadow-xs">
                  <BadgeCheck className="w-2.5 h-2.5 text-teal-600 mr-0.5" />
                  <span className="text-[8px] font-bold text-gray-800">Verified</span>
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="p-2">
              <h3 className="font-bold text-xs mb-0.5 text-gray-900 truncate">{property.name}</h3>
              <div className="flex items-center text-gray-500 text-[9px] mb-1">
                <MapPin className="w-2.5 h-2.5 mr-0.5 shrink-0 text-gray-400" />
                <span className="truncate">{property.location}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-extrabold text-teal-600">{property.price}</span>
                <div className="flex items-center bg-amber-50 px-1 py-0.5 rounded text-amber-700">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-0.5" />
                  <span className="text-[9px] font-bold">{property.rating}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Swipe hint text */}
      <div className="text-center mt-1.5 text-[10px] font-medium text-gray-400">
        ← Swipe to navigate →
      </div>
    </section>
  );
}
