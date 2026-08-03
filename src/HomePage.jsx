import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, BadgeCheck, TrendingUp, ChevronLeft, ChevronRight, ChevronDown, X, Building2, Home, Users, MessageSquare, Gavel } from 'lucide-react';
import HowRoomhyWorks from './components/website/HowRoomhyWorks';
import WhyRoomhy from './components/website/WhyRoomhy';
import FindYourHome from './components/website/FindYourHome';
import WhyStudentsChooseUs from './components/website/WhyStudentsChooseUs';
import WebsiteNavbar from './components/website/WebsiteNavbar';
import WebsiteFooter from './components/website/WebsiteFooter';
import MobileBottomNav from './components/website/MobileBottomNav';
import MobileHamburgerMenu from './components/website/MobileHamburgerMenu';
import MobilePropertiesSection from './components/website/MobilePropertiesSection';
import MobileVideoSection from './components/website/MobileVideoSection';
import { fetchCities, fetchProperties, trackPropertyClick } from './utils/api';
import useSEO from './hooks/useSEO';

const cityAreas = {
  'Kota': ['Vigyan Nagar', 'Rajeev Gandhi Nagar', 'Indra Vihar', 'Mahaveer Nagar'],
  'Sikar': ['Piprali Road', 'Subhash Chowk', 'Station Road', 'Nawalgarh Road'],
  'Indore': ['Vijay Nagar', 'Bhawar Kuan', 'Rajwada', 'Palasia']
};

// Static fallback data - moved outside to prevent re-renders
const staticCities = [
  { name: 'Kota', properties: '2,500+', image: 'https://picsum.photos/600/400?random=1' },
  { name: 'Sikar', properties: '850+', image: 'https://picsum.photos/600/400?random=7' },
  { name: 'Indore', properties: '1,800+', image: 'https://picsum.photos/600/400?random=2' },
];

const staticOfferings = [
  {
    title: 'PG',
    category: 'PG',
    description: 'Comfortable paying guest accommodations with all amenities',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop'
    ]
  },
  {
    title: 'Hostel',
    category: 'Hostel',
    description: 'Affordable hostel living for students and working professionals',
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop'
    ]
  },
  {
    title: 'Co-living',
    category: 'Co-living',
    description: 'Modern co-living spaces with community and facilities',
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop'
    ]
  },
  {
    title: 'Apartment/Flats',
    category: 'Apartment',
    description: 'Private apartments for individuals and small groups',
    images: [
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600&auto=format&fit=crop'
    ]
  },
  {
    title: 'List Property',
    category: 'List',
    description: 'Are you an owner? List your property on Roomhy for free!',
    link: '/website/list',
    images: [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582408921715-18e7806365c1?q=80&w=600&auto=format&fit=crop'
    ]
  }
];

const featuredProperties = [
  {
    _id: 'static1',
    name: 'Sunrise PG',
    location: 'Kota, Rajasthan',
    price: '₹6,500',
    rating: 4.8,
    image: 'https://picsum.photos/600/400?random=29',
    verified: true
  },
  {
    _id: 'static2',
    name: 'Elite Hostel',
    location: 'Indore, MP',
    price: '₹5,200',
    rating: 4.6,
    image: 'https://picsum.photos/600/400?random=30',
    verified: true
  },
  {
    _id: 'static3',
    name: 'Urban Co-Space',
    location: 'Sikar, Rajasthan',
    price: '₹8,900',
    rating: 4.9,
    image: 'https://picsum.photos/600/400?random=31',
    verified: true
  },
  {
    _id: 'static4',
    name: 'Campus View PG',
    location: 'Kota, Rajasthan',
    price: '₹7,800',
    rating: 4.7,
    image: 'https://picsum.photos/600/400?random=32',
    verified: true
  },
  {
    _id: 'static8',
    name: 'Royal Residency',
    location: 'Indore, MP',
    price: '₹12,500',
    rating: 4.5,
    image: 'https://picsum.photos/600/400?random=33',
    verified: true
  },
  {
    _id: 'static5',
    name: 'Smart Stay PG',
    location: 'Kota, Rajasthan',
    price: '₹5,800',
    rating: 4.4,
    image: 'https://picsum.photos/600/400?random=34',
    verified: true
  },
  {
    _id: 'static6',
    name: 'Grand Hostel',
    location: 'Sikar, Rajasthan',
    price: '₹4,800',
    rating: 4.3,
    image: 'https://picsum.photos/600/400?random=35',
    verified: true
  },
  {
    _id: 'static7',
    name: 'City Center PG',
    location: 'Indore, MP',
    price: '₹6,200',
    rating: 4.6,
    image: 'https://picsum.photos/600/400?random=36',
    verified: true
  },
  {
    _id: 'static9',
    name: 'Premium Co-Living',
    location: 'Kota, Rajasthan',
    price: '₹10,500',
    rating: 4.8,
    image: 'https://picsum.photos/600/400?random=37',
    verified: true
  },
  {
    _id: 'static10',
    name: 'Student Hub',
    location: 'Sikar, Rajasthan',
    price: '₹5,500',
    rating: 4.2,
    image: 'https://picsum.photos/600/400?random=38',
    verified: true
  }
];

const liveBiddingProperties = [
  {
    name: 'Sunrise PG',
    location: 'Kota',
    price: '₹6,500',
    currentBid: '₹6,200',
    timeLeft: '2h 15m',
    image: 'https://picsum.photos/600/400?random=41',
    verified: true
  },
  {
    name: 'Elite Hostel',
    location: 'Indore',
    price: '₹5,200',
    currentBid: '₹5,100',
    timeLeft: '45m',
    image: 'https://picsum.photos/600/400?random=42',
    verified: true
  },
  {
    name: 'Urban Co-Space',
    location: 'Sikar',
    price: '₹8,900',
    currentBid: '₹8,500',
    timeLeft: '1h 30m',
    image: 'https://picsum.photos/600/400?random=43',
    verified: true,
    girlsOnly: true
  },
];

const heroImages = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto=format&fit=crop'
];

export default function HomePage() {
  useSEO({ pageKey: 'home', fallbackTitle: 'Roomhy - Find Your Student Home' });
  const navigate = useNavigate();
  // State for dynamic data
  const [cities, setCities] = useState([]);
  const [cityAreasMap, setCityAreasMap] = useState(cityAreas);
  const [offerings, setOfferings] = useState([]);
  const [trendingProperties, setTrendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  // Hero image slideshow state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  // Floating Search State for Mobile
  const [isFloatingSearchVisible, setIsFloatingSearchVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) { // Mobile only
        setIsFloatingSearchVisible(window.scrollY > 350);
      } else {
        setIsFloatingSearchVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Recently Viewed Properties
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    const loadRecentlyViewed = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        // Filter out items older than 24 hours
        const validItems = stored.filter(item => (now - item.timestamp) < oneDay);
        
        // Sort by timestamp descending
        validItems.sort((a, b) => b.timestamp - a.timestamp);
        
        // Save strictly the non-expired items (hides the section completely if empty)
        setRecentlyViewed(validItems);
        
        // Update storage with cleaned items
        if (validItems.length !== stored.length) {
          localStorage.setItem('recentlyViewed', JSON.stringify(validItems));
        }
      } catch (err) {
        console.error('Error loading recently viewed:', err);
      }
    };
    
    loadRecentlyViewed();
    
    // Check every hour for expiration
    const interval = setInterval(loadRecentlyViewed, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to get city images dynamically
  const getCityImage = (cityName) => {
    const cityImages = {
      'Kota': 'https://picsum.photos/600/400?random=1',
      'Sikar': 'https://picsum.photos/600/400?random=7',
      'Indore': 'https://picsum.photos/600/400?random=2'
    };
    return cityImages[cityName] || 'https://picsum.photos/600/400?random=1';
  };

  // Fetch dynamic data
  useEffect(() => {
    const loadData = async () => {
      try {
        // STATIC MODE: using static cities only (Kota, Sikar, Indore)
        // Dynamic fetch disabled for now
        // const citiesData = await fetchCities();
        // if (citiesData && citiesData.length > 0) {
        //   const formattedCities = citiesData.map((city, index) => ({
        //     name: city.name || city,
        //     properties: typeof city.propertyCount === 'number' ? `${city.propertyCount}` : staticCities[index]?.properties || '0',
        //     image: city.imageUrl || city.image || staticCities[index]?.image || getCityImage(city.name)
        //   }));
        //   setCities(formattedCities);
        // } else {
          setCities(staticCities);
        // }

        setOfferings(staticOfferings);

        // STATIC MODE: using featured properties only
        // const allProperties = await fetchProperties();
        // if (allProperties && allProperties.length > 0) {
        //   const filteredProperties = allProperties.filter(p => {
        //     const name = (p.name || p.property_name || '').toLowerCase();
        //     return !name.includes('jhvhhjhjv') && !name.includes('test');
        //   });
        //   setTrendingProperties(filteredProperties);
        // } else {
          setTrendingProperties(featuredProperties);
        // }
      } catch (error) {
        console.error('Error loading homepage data:', error);
        setCities(staticCities);
        setOfferings(staticOfferings);
        setTrendingProperties(featuredProperties);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Search handler - uses already-loaded state, no API calls
  const handleSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();

    try {
      const results = [];

      // 1. Search by City
      const cityMatches = cities.filter(city =>
        city.name?.toLowerCase().includes(lowerQuery)
      ).map(city => ({
        type: 'city',
        title: city.name,
        subtitle: `${city.properties || '1000+'} properties`,
        link: `/website/ourproperty?city=${encodeURIComponent(city.name.toLowerCase())}`,
        icon: 'MapPin'
      }));
      results.push(...cityMatches);

      // 2. Search by Property Name using already-loaded trendingProperties
      const propertyMatches = trendingProperties.filter(prop => {
        const propName = prop.propertyName || prop.property_name || prop.name || '';
        return propName.toLowerCase().includes(lowerQuery);
      }).slice(0, 5).map(prop => ({
        type: 'property',
        title: prop.propertyName || prop.property_name || prop.name,
        subtitle: `${prop.city || prop.location || ''} - ${prop.propertyType || prop.type || 'Property'}`,
        link: `/website/property-details/${prop._id || prop.visitId}`,
        icon: 'Building2'
      }));
      results.push(...propertyMatches);

      // 3. Search by Property Type
      const typeMatches = offerings.filter(offering =>
        offering.title?.toLowerCase().includes(lowerQuery) ||
        offering.category?.toLowerCase().includes(lowerQuery)
      ).map(offering => ({
        type: 'type',
        title: offering.title,
        subtitle: `Find ${offering.title} accommodations`,
        link: `/website/ourproperty?type=${encodeURIComponent(offering.category.toLowerCase())}`,
        icon: 'Home'
      }));
      results.push(...typeMatches);

      setSearchResults(results.slice(0, 8));
      setShowSearchDropdown(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setHasSearched(true);
    
    // Build query parameters
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }
    if (selectedType) {
      params.append('type', selectedType.toLowerCase());
    }
    
    const queryString = params.toString();
    const navigateUrl = queryString ? `/website/ourproperty?${queryString}` : '/website/ourproperty';
    
    navigate(navigateUrl);
    setShowSearchDropdown(false);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchDropdown && !event.target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
      if (isTypeDropdownOpen && typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchDropdown]);



  // Cities carousel state
  const [cityStartIndex, setCityStartIndex] = useState(0);
  const citiesPerView = 4;
  const [mobileCityIndex, setMobileCityIndex] = useState(0); // Mobile: 1 row (4 cities) at a time

  // Trending properties carousel state
  const [trendingStartIndex, setTrendingStartIndex] = useState(0);
  const trendingPerView = 5;

  // What We Offer - selected image index for each offering
  const [offeringSelectedImage, setOfferingSelectedImage] = useState({});
  const [mobileOfferingIndex, setMobileOfferingIndex] = useState(0); // Mobile: 1 offering at a time
  const [mobileImageIndex, setMobileImageIndex] = useState(0); // Mobile: current image index
  
  // Refs for scroll containers
  const offeringScrollContainerRef = useRef(null);
  const trendingScrollContainerRef = useRef(null);
  const citiesScrollContainerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextCities = () => {
    setCityStartIndex((prev) => 
      prev + citiesPerView >= cities.length ? 0 : prev + citiesPerView
    );
  };

  const prevCities = () => {
    setCityStartIndex((prev) => 
      prev - citiesPerView < 0 ? Math.max(0, cities.length - citiesPerView) : prev - citiesPerView
    );
  };

  const nextTrending = () => {
    setTrendingStartIndex((prev) => 
      prev + trendingPerView >= trendingProperties.length ? 0 : prev + trendingPerView
    );
  };

  const prevTrending = () => {
    setTrendingStartIndex((prev) => 
      prev - trendingPerView < 0 ? Math.max(0, trendingProperties.length - trendingPerView) : prev - trendingPerView
    );
  };

  const visibleCities = cities.slice(cityStartIndex, cityStartIndex + citiesPerView);
  const visibleTrending = trendingProperties.slice(trendingStartIndex, trendingStartIndex + trendingPerView);
  const canShowNextCities = cityStartIndex + citiesPerView < cities.length;
  const canShowPrevCities = cityStartIndex > 0;
  const canShowNextTrending = trendingStartIndex + trendingPerView < trendingProperties.length;
  const canShowPrevTrending = trendingStartIndex > 0;

  // Recently Viewed carousel state
  const [recentlyViewedStartIndex, setRecentlyViewedStartIndex] = useState(0);
  const recentlyViewedPerView = 5;

  const nextRecentlyViewed = () => {
    setRecentlyViewedStartIndex((prev) => 
      prev + recentlyViewedPerView >= recentlyViewed.length ? 0 : prev + recentlyViewedPerView
    );
  };

  const prevRecentlyViewed = () => {
    setRecentlyViewedStartIndex((prev) => 
      prev - recentlyViewedPerView < 0 ? Math.max(0, recentlyViewed.length - recentlyViewedPerView) : prev - recentlyViewedPerView
    );
  };

  const visibleRecentlyViewed = recentlyViewed.slice(recentlyViewedStartIndex, recentlyViewedStartIndex + recentlyViewedPerView);
  const canShowNextRecentlyViewed = recentlyViewedStartIndex + recentlyViewedPerView < recentlyViewed.length;
  const canShowPrevRecentlyViewed = recentlyViewedStartIndex > 0;

  // Mobile carousel helpers
  const canShowNextMobileCity = mobileCityIndex + 4 < cities.length;
  const canShowPrevMobileCity = mobileCityIndex > 0;
  const canShowNextMobileOffering = mobileOfferingIndex + 3 < offerings.length;
  const canShowPrevMobileOffering = mobileOfferingIndex > 0;
  const visibleMobileCities = cities.slice(mobileCityIndex, mobileCityIndex + 4);
  const visibleMobileOfferings = offerings.slice(mobileOfferingIndex, mobileOfferingIndex + 3);



  return (
    <div className="min-h-screen bg-white">
      <WebsiteNavbar />

      {/* Floating Search Bar for Mobile - Fixed at top on scroll */}
      <div 
        className={`md:hidden fixed top-0 left-0 right-0 z-[60] p-3 transition-all duration-300 transform ${
          isFloatingSearchVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
              const searchInput = document.querySelector('.search-container input');
              if (searchInput) searchInput.focus();
            }, 400);
          }}
          className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 px-4 py-2.5 flex items-center gap-3 active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
            <Search className="w-4 h-4 text-white" />
          </div>
          <p className="text-gray-400 text-sm font-medium flex-1">Search for PG, Hostels...</p>
          <div className="px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 border border-gray-100">
            Search
          </div>
        </div>
      </div>

      <main className="min-h-screen">
        {/* Hero Section */}
        <div className="relative min-h-[160px] md:min-h-0 md:h-[320px] bg-gradient-to-br from-teal-600 via-blue-600 to-cyan-500 z-10">
          <div className="absolute inset-0 overflow-hidden">
            {heroImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ backgroundImage: `url(${image})` }}
              >
                <div className="absolute inset-0 bg-black/60"></div>
              </div>
            ))}
          </div>

          <div className="relative max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 h-full flex flex-col justify-start pt-4 md:pt-10">
            <h1 className="text-xl sm:text-4xl md:text-6xl font-bold text-white mb-1 md:mb-4 leading-tight text-center drop-shadow-lg">
              Find Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 drop-shadow-2xl">Student Stay</span>
            </h1>
            <p className="text-xs sm:text-lg md:text-xl text-white/95 mb-2 md:mb-6 max-w-4xl mx-auto leading-relaxed text-center px-2">
              Search verified PGs, hostels & co-living spaces across 50+ Indian cities
            </p>

            <div className="max-w-5xl mx-auto w-full px-2 md:px-4 search-container relative z-50">
              <form onSubmit={handleSearchSubmit} className="bg-white/95 md:bg-white backdrop-blur-md md:backdrop-blur-none rounded-2xl md:rounded shadow-2xl p-2 md:p-0 flex flex-row gap-2 md:gap-0 items-center relative z-20 md:h-16 w-full">
                
                {/* Mobile Only: Type Dropdown */}
                <div className="md:hidden relative flex-shrink-0" ref={typeDropdownRef}>
                  <div
                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                    className="flex items-center justify-between bg-teal-50 text-gray-700 px-2 py-2 rounded-lg font-medium focus:outline-none cursor-pointer w-[70px] text-[10px]"
                  >
                    <span className="truncate">{selectedType || 'Type'}</span>
                    <ChevronLeft className={`w-3 h-3 text-teal-600 transition-transform ${isTypeDropdownOpen ? '-rotate-90' : '-rotate-180'}`} style={{ transform: isTypeDropdownOpen ? 'rotate(90deg)' : 'rotate(270deg)' }} />
                  </div>
                  {isTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-[120px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[70]">
                      {offerings.map((offering) => (
                        <div
                          key={offering.category}
                          onClick={() => {
                            setSelectedType(offering.category.toLowerCase());
                            setIsTypeDropdownOpen(false);
                          }}
                          className={`px-3 py-2 cursor-pointer hover:bg-teal-50 ${selectedType === offering.category.toLowerCase() ? 'bg-teal-50 border-l-2 border-teal-500' : ''}`}
                        >
                          <div className="text-[10px] font-bold text-gray-900">{offering.title}</div>
                          <div className="text-[8px] text-gray-500 truncate">{offering.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 1. Property Type (Desktop Only) - Left */}
                <div className="relative flex-1 hidden md:flex items-center px-5 h-full bg-white border-r border-gray-300 cursor-pointer hover:bg-gray-50" onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}>
                  <div className="flex-1 flex justify-between items-center text-base font-semibold text-gray-900">
                    <span className="truncate">{selectedType ? selectedType.charAt(0).toUpperCase() + selectedType.slice(1) : 'Property Type'}</span>
                    <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${isTypeDropdownOpen ? '-rotate-90' : '-rotate-180'}`} style={{ transform: isTypeDropdownOpen ? 'rotate(90deg)' : 'rotate(270deg)' }} />
                  </div>
                  
                  {isTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white rounded shadow-xl border border-gray-100 overflow-hidden z-[70]">
                      {offerings.map((offering) => (
                        <div
                          key={offering.category}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedType(offering.category.toLowerCase());
                            setIsTypeDropdownOpen(false);
                          }}
                          className="px-5 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 group"
                        >
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold transition-colors ${selectedType === offering.category.toLowerCase() ? 'text-teal-600' : 'text-gray-900 group-hover:text-teal-600'}`}>
                              {offering.title}
                            </span>
                            <span className="text-xs text-gray-500 line-clamp-1">{offering.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Location / Search Query - Middle */}
                <div className="flex-1 md:flex-[1.5] flex items-center px-2 md:px-5 py-2 md:py-0 h-full bg-gray-50 md:bg-white rounded-lg md:rounded-none relative min-w-0">
                  <Search className="w-3 h-3 md:w-5 md:h-5 text-gray-400 mr-1 md:mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city, locality, or landmark"
                    className="flex-1 bg-transparent outline-none text-gray-900 text-[10px] md:text-base font-semibold min-w-0 w-full h-full"
                  />
                </div>



                {/* Search Button */}
                <button type="submit" className="bg-gradient-to-r from-teal-500 to-teal-600 md:bg-none md:bg-[#1AB64F] hover:bg-[#18a245] text-white px-3 md:px-10 py-2 md:py-0 h-full rounded-lg md:rounded-none font-bold text-[10px] md:text-lg transition-all flex-shrink-0 whitespace-nowrap border-l border-transparent md:border-[#18a245]">
                  Search
                </button>
              </form>
              
              {/* Search Suggestions Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <Link
                        key={idx}
                        to={result.link}
                        onClick={() => setShowSearchDropdown(false)}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {result.icon === 'MapPin' && <MapPin className="w-5 h-5 text-teal-600" />}
                          {result.icon === 'Building2' && <Building2 className="w-5 h-5 text-teal-600" />}
                          {result.icon === 'Home' && <Home className="w-5 h-5 text-teal-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{result.title}</p>
                          <p className="text-sm text-gray-500">{result.subtitle}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cities Sub-navigation placed under banner */}
        <div className="hidden md:block bg-[#f8f9fa] border-b border-gray-200">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12">
            <div className="flex items-center justify-center h-8 text-[13px] font-medium text-gray-600">
              <div className="flex items-center justify-center space-x-10 w-full">
                {Object.keys(cityAreasMap).filter(city => ['Kota','Sikar','Indore'].includes(city)).map((city) => {
                  const areas = cityAreasMap[city] || [];
                  return (
                  <div key={city} className="relative group h-full flex items-center">
                    <Link to={`/website/ourproperty?city=${encodeURIComponent(city)}`} className="flex items-center space-x-1 hover:text-black cursor-pointer h-full">
                      <span>{city}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-black transition-colors" />
                    </Link>

                    {/* Areas Dropdown on Hover */}
                    {areas.length > 0 && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-white shadow-xl rounded-b-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                        {areas.map((area) => (
                          <Link
                            key={area}
                            to={`/website/ourproperty?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`}
                            className="block px-4 py-2 text-xs text-gray-600 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                          >
                            {area}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })}
                <Link to="/website/ourproperty" className="flex items-center space-x-1 hover:text-black cursor-pointer group font-semibold h-full">
                  <span>All Cities</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-black transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </div>



        {/* What We Offer - Desktop & Mobile Responsive */}
        <section className="py-1 md:py-4 bg-white">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 mt-1 md:mt-4">
            <div className="text-center mb-4">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1">What We Offer</h2>
              <p className="text-xs md:text-base text-gray-600">Choose from a variety of accommodation types tailored for students</p>
            </div>

            {/* Desktop Grid - Hidden on mobile */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              {offerings.map((offering) => {
                const selectedIdx = offeringSelectedImage[offering.title] || 0;
                const allImages = offering.images;
                const totalImages = allImages.length;

                const nextImage = () => {
                  setOfferingSelectedImage(prev => ({
                    ...prev,
                    [offering.title]: (selectedIdx + 1) % totalImages
                  }));
                };

                const prevImage = () => {
                  setOfferingSelectedImage(prev => ({
                    ...prev,
                    [offering.title]: (selectedIdx - 1 + totalImages) % totalImages
                  }));
                };

                return (
                  <div
                    key={offering.title}
                    onClick={() => offering.link ? navigate(offering.link) : navigate(`/website/ourproperty?type=${offering.category.toLowerCase()}`)}
                    className="bg-white rounded-xl overflow-hidden shadow hover:shadow-xl transition-all group cursor-pointer"
                  >
                    {/* Main Image - with arrows */}
                    <div className="h-40 overflow-hidden relative">
                      <img
                        src={allImages[selectedIdx]}
                        alt={offering.title}
                        className="w-full h-full object-cover transition-all duration-300"
                        loading="lazy"
                        width="200"
                        height="160"
                      />

                      {/* Title always visible at TOP */}
                      <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/50 to-transparent">
                        <h3 className="text-base font-bold text-white drop-shadow-md">{offering.title}</h3>
                      </div>

                      {/* Description on hover */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-xs text-white drop-shadow-md line-clamp-2">{offering.description}</p>
                      </div>

                      {/* Left Arrow */}
                      {totalImages > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); prevImage(); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                        >
                          <ChevronLeft className="w-6 h-6 text-white drop-shadow-lg" />
                        </button>
                      )}

                      {/* Right Arrow */}
                      {totalImages > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); nextImage(); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                        >
                          <ChevronRight className="w-6 h-6 text-white drop-shadow-lg" />
                        </button>
                      )}

                      {/* Image Counter */}
                      <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                        {selectedIdx + 1} / {totalImages}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Carousel - Smooth horizontal scroll */}
            <div className="md:hidden relative -mx-4">

              {/* Smooth Horizontal Scroll Container */}
              <div 
                ref={offeringScrollContainerRef}
                className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
              >
                <div className="flex gap-4 w-max px-2 py-3">
                  {offerings.map((offering) => (
                    <div
                      key={offering.title}
                      onClick={() => navigate(`/website/ourproperty?type=${offering.category.toLowerCase()}`)}
                      className="flex-shrink-0 w-32 bg-white rounded-lg overflow-hidden shadow cursor-pointer"
                    >
                      <div className="h-24 overflow-hidden relative group">
                        {/* Current Image */}
                        <img
                          src={offering.images[0]}
                          alt={offering.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          width="128"
                          height="96"
                        />

                        {/* Title always visible at TOP */}
                        <div className="absolute top-0 left-0 right-0 p-1 bg-gradient-to-b from-black/50 to-transparent">
                          <h3 className="text-xs font-bold text-white drop-shadow-md truncate">{offering.title}</h3>
                        </div>

                        {/* Description on hover/tap */}
                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/70 to-transparent transform translate-y-full group-hover:translate-y-0 group-active:translate-y-0 transition-transform duration-300">
                          <p className="text-[8px] text-white drop-shadow-md line-clamp-2">{offering.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Swipe hint text */}
              
            </div>
          </div>
        </section>

        <MobileVideoSection />

        {/* How Roomhy Works - Improved Section */}
        <section className="hidden md:block py-4 bg-white border-t border-gray-100 mt-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-0.5">
                How Roomhy Works
              </h2>
              <p className="text-sm text-gray-600">
                Find, compare, and book your perfect stay in just a few steps
              </p>
            </div>

            {/* Video Container */}
            <div className="relative max-w-xl mx-auto rounded-2xl overflow-hidden shadow-lg group aspect-video">
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent z-10 pointer-events-none"></div>

              {/* Video */}
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/4pFUP0HZwWM"
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>

              {/* Play Badge */}
              <div className="absolute bottom-5 left-5 z-20 text-white">
                <h3 className="text-xl font-semibold">Watch Demo</h3>
                <p className="text-sm text-white/80">See how booking works</p>
              </div>

            </div>

          </div>
        </section>
 

        {/* Trending Stays - Carousel with 12 properties - DESKTOP ONLY */}
        <section className="hidden md:block py-1 md:py-2 bg-white">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 mt-1 md:mt-2">
            <div className="flex flex-col items-center justify-center text-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Trending Stays This Week</h2>
              <p className="text-base text-gray-600">Most popular properties among students</p>
            </div>
            
            <div className="relative">
              {/* Left Arrow */}
              {trendingProperties.length > trendingPerView && canShowPrevTrending && (
                <button 
                  onClick={prevTrending}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              
              {/* Right Arrow */}
              {trendingProperties.length > trendingPerView && canShowNextTrending && (
                <button 
                  onClick={nextTrending}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6">
                {visibleTrending.map((property) => (
                  <Link 
                    key={property._id} 
                    to={`/website/property-details/${property._id}`}
                    className="group block cursor-pointer"
                  >
                    <div className="relative h-36 rounded-md overflow-hidden mb-2">
                      <img
                        src={property.image}
                        alt={property.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        width="300"
                        height="144"
                        onError={(e) => {
                          e.target.src = `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 100)}`;
                        }}
                      />
                      {property.verified && (
                        <div className="absolute top-2 left-2 bg-white/20 backdrop-blur border border-white/30 rounded px-1.5 py-0.5 flex items-center shadow-lg">
                          <BadgeCheck className="w-3.5 h-3.5 text-teal-600 mr-1" />
                          <span className="text-[10px] font-bold text-gray-900">Verified</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-0.5 line-clamp-1 group-hover:text-teal-600 transition-colors">{property.name || property.property_name || 'Roomhy Property'}</h3>
                      <div className="text-gray-500 text-[11px] mb-1 line-clamp-1">
                        {property.location}
                      </div>
                      <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                        <div className="bg-[#1AB64F] text-white px-1 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                          {property.rating} <Star className="w-2.5 h-2.5 fill-white text-white" />
                        </div>
                        <span className="text-gray-500">Excellent</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-gray-900">
                          {property.monthlyRent ? `₹${property.monthlyRent.toLocaleString()}` : (property.price || '₹0')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-through">₹9,999</span>
                        <span className="text-[10px] font-semibold text-[#f5a623]">40% off</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Trending Stays - Smooth horizontal scroll */}
        <section className="md:hidden py-1 bg-gray-50">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12">
            {/* Heading - Same as Desktop */}
            <div className="text-center mb-3">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Trending Stays This Week</h2>
              <p className="text-xs text-gray-600">Most popular properties among students</p>
            </div>

            <div className="relative -mx-4">

              {/* SCROLL (IMPORTANT: yahin hona chahiye) */}
              <div 
                ref={trendingScrollContainerRef}
                className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
              >
                <div className="flex gap-3 w-max px-2 py-3">
                  {trendingProperties.map((property) => (
                    <Link
                      key={property._id}
                      to={`/website/property-details/${property._id}`}
                      onClick={() => property._id && trackPropertyClick(property._id)}
                      className="flex-shrink-0 w-36 block active:scale-95 transition-transform"
                    >
                      {/* Standalone image with rating badge */}
                      <div className="relative h-24 rounded-2xl overflow-hidden shadow-md mb-2">
                        <img
                          src={property.image}
                          alt={property.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          width="144"
                          height="96"
                          onError={(e) => {
                            e.target.src = `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 100)}`;
                          }}
                        />
                        {/* Rating badge - bottom left on image */}
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[10px] font-bold text-gray-800">{property.rating}</span>
                        </div>
                      </div>
                      {/* Plain text below image — no card box */}
                      <h3 className="font-bold text-gray-900 text-sm mb-0 line-clamp-1">{property.name || property.property_name || 'Roomhy Property'}</h3>
                      <div className="flex items-center text-gray-600 font-medium text-[10px] mb-0">
                        <MapPin className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{property.location}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-gray-900">
                          {property.monthlyRent ? `₹${property.monthlyRent.toLocaleString()}` : (property.price || '₹0')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-through">₹9,999</span>
                        <span className="text-[10px] font-semibold text-teal-600">30% off</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Recently Viewed Properties - Desktop & Mobile */}
        {recentlyViewed.length > 0 && (
          <section className="py-1 md:py-2 bg-white">
            <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 mt-1 md:mt-2">
              {/* Heading - Matched with Trending Section */}
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recently Viewed</h2>
                </div>
                <p className="text-[10px] md:text-sm text-gray-600">Pick up where you left off</p>
              </div>

              {/* Desktop Grid */}
              <div className="relative hidden md:block">
                {/* Left Arrow */}
                {recentlyViewed.length > recentlyViewedPerView && canShowPrevRecentlyViewed && (
                  <button 
                    onClick={prevRecentlyViewed}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                
                {/* Right Arrow */}
                {recentlyViewed.length > recentlyViewedPerView && canShowNextRecentlyViewed && (
                  <button 
                    onClick={nextRecentlyViewed}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-6">
                  {visibleRecentlyViewed.map((item) => (
                    <Link 
                      key={item.id} 
                      to={`/website/property-details/${item.id}`}
                      className="group block cursor-pointer"
                    >
                      <div className="relative h-36 rounded-md overflow-hidden mb-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          width="300"
                          height="144"
                          onError={(e) => {
                            e.target.src = `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 100)}`;
                          }}
                        />
                        <div className="absolute top-2 left-2 flex gap-1">
                          <div className="bg-white/20 backdrop-blur border border-white/30 rounded px-1.5 py-0.5 flex items-center shadow-lg">
                            <span className="text-[9px] font-bold text-teal-600 uppercase tracking-wider">{item.type || 'PG'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-0.5 line-clamp-1 group-hover:text-teal-600 transition-colors">{item.name}</h3>
                        <div className="text-gray-500 text-[11px] mb-1 line-clamp-1">
                          {item.location}
                        </div>
                        <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                          <div className="bg-[#1AB64F] text-white px-1 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                            4.5 <Star className="w-2.5 h-2.5 fill-white text-white" />
                          </div>
                          <span className="text-gray-500">Excellent</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-gray-900">₹{item.price}</span>
                          <span className="text-[10px] text-gray-500 line-through">₹9,999</span>
                          <span className="text-[10px] font-semibold text-[#f5a623]">30% off</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Swipe Carousel */}
              <div className="md:hidden -mx-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 px-2 pb-4 w-max">
                  {recentlyViewed.map((item) => (
                    <Link
                      key={item.id}
                      to={`/website/property-details/${item.id}`}
                      className="flex-shrink-0 w-36"
                    >
                      {/* Standalone image with rating badge */}
                      <div className="relative h-24 rounded-2xl overflow-hidden shadow-md mb-2">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" width="144" height="96" />
                        {/* Rating badge - bottom left on image */}
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[10px] font-bold text-gray-800">4.5</span>
                        </div>
                      </div>
                      {/* Plain text below image — no card box */}
                      <h3 className="font-bold text-gray-900 text-sm mb-0 line-clamp-1">{item.name}</h3>
                      <div className="flex items-center text-gray-600 font-medium text-[10px] mb-0">
                        <MapPin className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{item.location}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
                        <span className="text-[10px] text-gray-500 line-through">₹{Math.round(item.price * 1.3)}</span>
                        <span className="text-[10px] font-semibold text-teal-600">30% off</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}


        {/* Why Choose Roomhy - Combined Section */}
        <WhyRoomhy />
        
        {/* Reviews Slider Section - Auto Sliding */}
        <section className="py-2 md:py-4 bg-gradient-to-b from-white to-gray-50 overflow-hidden mt-2">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 mb-2 md:mb-4">
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1">What Students Say</h2>
              <p className="text-xs md:text-base text-gray-600">Trusted by 10,000+ students across India</p>
            </div>
          </div>
          
          {/* Auto-sliding Reviews Carousel */}
          <div className="relative">
            <div className="flex animate-scroll-left hover:pause-animation">
              {/* First set of reviews */}
              {[...Array(2)].flatMap((_, setIdx) => [
                {
                  name: "Rahul Sharma",
                  role: "IIT Delhi Student",
                  rating: 5,
                  text: "Roomhy made finding my hostel so easy! Zero brokerage and the bidding feature helped me get a great deal.",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                },
                {
                  name: "Priya Patel",
                  role: "Medical Student",
                  rating: 5,
                  text: "The 24/7 support team helped me find a safe PG near my college. Best platform for students!",
                  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                },
                {
                  name: "Amit Kumar",
                  role: "Engineering Student",
                  rating: 5,
                  text: "Found a fully furnished apartment in just 2 days. The direct chat with owners saved so much time.",
                  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
                },
                {
                  name: "Sneha Gupta",
                  role: "MBA Student",
                  rating: 5,
                  text: "Love the verified listings! No fake photos or hidden charges. Roomhy is a game changer.",
                  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
                },
                {
                  name: "Vikram Singh",
                  role: "Law Student",
                  rating: 4,
                  text: "The ₹500 booking token is such a smart feature. It shows owners you're serious about renting.",
                  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                },
                {
                  name: "Anjali Mehta",
                  role: "CA Student",
                  rating: 5,
                  text: "Moved to Kota for coaching and found the perfect hostel within a day. Thank you Roomhy!",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
                }
              ].map((review, idx) => (
                <div key={`${setIdx}-${idx}`} className="flex-shrink-0 w-[280px] mx-2">
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-teal-100"
                        loading="lazy"
                        width="40"
                        height="40"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{review.name}</h4>
                        <p className="text-xs text-gray-500">{review.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed italic">"{review.text}"</p>
                  </div>
                </div>
              )))}
            </div>
          </div>
          
          {/* Custom CSS for animation and scrollbar hiding */}
          <style>{`
            @keyframes scroll-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-scroll-left {
              animation: scroll-left 30s linear infinite;
            }
            .animate-scroll-left:hover {
              animation-play-state: paused;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </section>

      </main>
            
      <WebsiteFooter />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

