import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, BadgeCheck, TrendingUp, ChevronLeft, ChevronRight, ChevronDown, X, Building2, Home, Users, MessageSquare, Gavel, Plus, Minus, ShieldCheck, Award, Tag, Headphones, Lock, Bed, Armchair, ArrowUpRight, Sparkles, Check } from 'lucide-react';
import HowRoomhyWorks from '../../components/website/HowRoomhyWorks';
import WhyRoomhy from '../../components/website/WhyRoomhy';
import FindYourHome from '../../components/website/FindYourHome';
import WhyStudentsChooseUs from '../../components/website/WhyStudentsChooseUs';
import WebsiteNavbar from '../../components/website/WebsiteNavbar';
import WebsiteFooter from '../../components/website/WebsiteFooter';
import MobileBottomNav from '../../components/website/MobileBottomNav';
import MobileHamburgerMenu from '../../components/website/MobileHamburgerMenu';
import MobilePropertiesSection from '../../components/website/MobilePropertiesSection';
import MobileVideoSection from '../../components/website/MobileVideoSection';
import { fetchCities, fetchProperties, trackPropertyClick, getPropertyDetailsUrl, fetchSiteStats } from '../../utils/api';
import useSEO from '../../hooks/useSEO';

const cityAreas = {};

const staticCities = [
  { name: 'Kota', properties: '2,500+', image: 'https://picsum.photos/600/400?random=1' },
  { name: 'Sikar', properties: '850+', image: 'https://picsum.photos/600/400?random=7' },
  { name: 'Indore', properties: '1,800+', image: 'https://picsum.photos/600/400?random=2' },
];

const staticOfferings = [
  {
    title: 'PG',
    category: 'PG',
    link: '/pg',
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
    link: '/hostels',
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
    link: '/co-living',
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
    link: '/apartments',
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
    link: '/list-property',
    images: [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582408921715-18e7806365c1?q=80&w=600&auto=format&fit=crop'
    ]
  }
];

const featuredProperties = [
  {
    _id: "prop1",
    name: "Roomhy Stays - Kota",
    location: "Rajeev Gandhi Nagar, Kota",
    city: "Kota",
    monthlyRent: 8500,
    price: 8500,
    rating: 4.8,
    reviewsCount: 24,
    propertyType: "PG",
    type: "PG",
    verified: true,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop"
    ]
  },
  {
    _id: "prop2",
    name: "Roomhy Heights - Sikar",
    location: "Piprali Road, Sikar",
    city: "Sikar",
    monthlyRent: 7200,
    price: 7200,
    rating: 4.6,
    reviewsCount: 18,
    propertyType: "Hostel",
    type: "Hostel",
    verified: true,
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&auto=format&fit=crop"
    ]
  },
  {
    _id: "prop3",
    name: "Roomhy Co-Living - Indore",
    location: "Vijay Nagar, Indore",
    city: "Indore",
    monthlyRent: 9500,
    price: 9500,
    rating: 4.9,
    reviewsCount: 31,
    propertyType: "Co-living",
    type: "Co-living",
    verified: true,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop"
    ]
  },
  {
    _id: "prop4",
    name: "Roomhy Elite PG - Kota",
    location: "Vigyan Nagar, Kota",
    city: "Kota",
    monthlyRent: 6800,
    price: 6800,
    rating: 4.5,
    reviewsCount: 15,
    propertyType: "PG",
    type: "PG",
    verified: true,
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop"
    ]
  },
  {
    _id: "prop5",
    name: "Roomhy Apartments - Indore",
    location: "Bhawar Kuan, Indore",
    city: "Indore",
    monthlyRent: 12000,
    price: 12000,
    rating: 4.7,
    reviewsCount: 22,
    propertyType: "Apartment",
    type: "Apartment",
    verified: true,
    image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&auto=format&fit=crop"
    ]
  }
];

const heroImages = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto=format&fit=crop'
];

export default function WebsiteIndex() {
  useSEO({ 
    pageKey: 'home', 
    fallbackTitle: 'Top PGs, Hostels & Co-living in India | Roomhy.com',
    fallbackDescription: 'Discover 100% verified student PGs, hostels, and flats across India. Enjoy zero brokerage, fully furnished rooms, homemade meals, and easy budget bidding.'
  });
  const navigate = useNavigate();
  const [cities, setCities] = useState(staticCities);
  const [cityAreasMap, setCityAreasMap] = useState(cityAreas);
  const [offerings, setOfferings] = useState(staticOfferings);
  const [trendingProperties, setTrendingProperties] = useState(featuredProperties);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(-1);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');

  // Hero image slideshow state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  // Floating Search State for Mobile
  const [isFloatingSearchVisible, setIsFloatingSearchVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) {
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
        const validItems = stored.filter(item => (now - item.timestamp) < oneDay);
        validItems.sort((a, b) => b.timestamp - a.timestamp);
        setRecentlyViewed(validItems);
        if (validItems.length !== stored.length) {
          localStorage.setItem('recentlyViewed', JSON.stringify(validItems));
        }
      } catch (err) {
        console.error('Error loading recently viewed:', err);
      }
    };
    loadRecentlyViewed();
    const interval = setInterval(loadRecentlyViewed, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dynamic data
  useEffect(() => {
    const loadData = async () => {
      try {
        setCities(staticCities);
        setOfferings(staticOfferings);
        const allProps = await fetchProperties();
        if (allProps && allProps.length > 0) {
          const formattedProperties = allProps.map(p => ({
            _id: p._id || p.visitId || p.id,
            name: p.propertyName || p.property_name || p.propertyInfo?.name || p.name || 'Roomhy Property',
            location: `${p.area || p.propertyInfo?.area ? (p.area || p.propertyInfo?.area) + ', ' : ''}${p.city || p.propertyInfo?.city || 'Kota'}`,
            monthlyRent: p.monthlyRent || p.rent || p.propertyInfo?.rent || 8000,
            image: p.featuredImage || p.images?.[0] || p.propertyInfo?.photos?.[0] || 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600',
            images: (() => {
              const imgs = [];
              if (p.featuredImage) imgs.push(p.featuredImage);
              if (Array.isArray(p.images)) p.images.forEach(i => { if (i && !imgs.includes(i)) imgs.push(i); });
              if (Array.isArray(p.propertyInfo?.photos)) p.propertyInfo.photos.forEach(i => { if (i && !imgs.includes(i)) imgs.push(i); });
              if (imgs.length === 0) imgs.push('https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600');
              return imgs.slice(0, 5);
            })(),
            verified: true
          }));
          setTrendingProperties(formattedProperties);
        } else {
          setTrendingProperties([]);
        }
      } catch (error) {
        setTrendingProperties([]);
      }
    };
    loadData();
  }, []);

  // Load dynamic city stats separately (non-blocking)
  useEffect(() => {
    const loadCityStats = async () => {
      try {
        const stats = await fetchSiteStats();
        if (stats && stats.byCityFormatted) {
          setCities(prev => prev.map(c => ({
            ...c,
            properties: stats.byCityFormatted[c.name] || stats.byCityFormatted[c.name.toLowerCase()] || c.properties
          })));
        }
      } catch (_) { /* keep static fallback */ }
    };
    loadCityStats();
  }, []);

  // Dynamic Search handler
  const handleSearch = async (query) => {
    const q = (query || '').trim();
    if (!q) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    const lowerQuery = q.toLowerCase();

    try {
      const results = [];

      // 1. Match Cities
      const cityMatches = (cities || []).filter(city =>
        city.name?.toLowerCase().includes(lowerQuery)
      ).map(city => ({
        type: 'city',
        title: city.name,
        subtitle: `${city.properties || '1000+'} properties`,
        link: `/website/ourproperty?city=${encodeURIComponent(city.name.toLowerCase())}`,
        icon: 'MapPin'
      }));
      results.push(...cityMatches);

      // 2. Fetch live properties from backend API dynamically
      try {
        const res = await fetchJson(`/api/approved-properties/public/approved?limit=8&search=${encodeURIComponent(q)}`);
        const liveProps = res?.properties || (Array.isArray(res) ? res : []);
        const propMatches = liveProps.map(prop => {
          const propName = prop.title || prop.propertyName || prop.propertyInfo?.name || 'Property';
          const city = prop.city || prop.propertyInfo?.city || '';
          const area = prop.area || prop.locality || prop.propertyInfo?.area || '';
          const type = (prop.propertyType || prop.propertyInfo?.propertyType || 'PG').toUpperCase();
          const pId = prop.visitId || prop._id;
          return {
            type: 'property',
            title: propName,
            subtitle: `${area}${area && city ? ', ' : ''}${city} • ${type}`,
            link: `/website/property-details/${pId}`,
            icon: 'Building2'
          };
        });
        results.push(...propMatches);
      } catch (err) {
        // Fallback to client-side trending properties if network error
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
      }

      setSearchResults(results.slice(0, 10));
      setShowSearchDropdown(results.length > 0);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setHasSearched(true);
    const query = searchQuery.trim();
    const params = new URLSearchParams();
    // Detect city/area from query for smarter navigation
    const knownCities = ['kota', 'sikar', 'indore', 'jaipur', 'delhi', 'mumbai', 'pune', 'bangalore', 'bengaluru', 'hyderabad', 'bhopal', 'nagpur', 'lucknow', 'chandigarh', 'noida', 'gurugram'];
    if (query) {
      const lowerQ = query.toLowerCase();
      const matchedCity = knownCities.find(c => lowerQ.includes(c));
      if (matchedCity) {
        const cityFormatted = matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1);
        params.append('city', cityFormatted);
        const areaText = lowerQ.replace(matchedCity, '').replace(/,/g, '').trim();
        if (areaText) params.append('area', areaText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      } else {
        params.append('search', query);
      }
    }
    if (selectedType) params.append('type', selectedType.toLowerCase());
    const queryString = params.toString();
    navigate(queryString ? `/website/ourproperty?${queryString}` : '/website/ourproperty');
    setShowSearchDropdown(false);
  };

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

  const [cityStartIndex, setCityStartIndex] = useState(0);
  const citiesPerView = 4;
  const [trendingStartIndex, setTrendingStartIndex] = useState(0);
  const trendingPerView = 5;
  const [offeringSelectedImage, setOfferingSelectedImage] = useState({});
  const [trendingCardImgIdx, setTrendingCardImgIdx] = useState({});

  const offeringScrollContainerRef = useRef(null);
  const trendingScrollContainerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const visibleTrending = trendingProperties.slice(trendingStartIndex, trendingStartIndex + trendingPerView);
  const canShowNextTrending = trendingStartIndex + trendingPerView < trendingProperties.length;
  const canShowPrevTrending = trendingStartIndex > 0;

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

  return (
    <div className="min-h-screen bg-white">
      <WebsiteNavbar />

      {/* Floating Search Bar for Mobile */}
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
        <div className="relative min-h-[380px] md:min-h-[410px] bg-slate-900 z-30 flex flex-col justify-center overflow-hidden py-6 md:py-8">
          {/* Full width room background image */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
              style={{ backgroundImage: `url('/hero-luxury.jpg')` }}
            >
              <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]"></div>
            </div>
          </div>

          {/* Centered Translucent Glass Panel */}
          <div className="relative max-w-4xl lg:max-w-[960px] w-full mx-auto px-4 z-20">
            <div className="bg-white/35 backdrop-blur-xl border border-white/60 rounded-[28px] p-4 sm:p-5 md:p-6 shadow-2xl text-center">
              {/* Top Badge */}
              <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3.5 py-1 rounded-full shadow-xs text-[10px] sm:text-[11px] font-black text-slate-800 mb-2 border border-white/80">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0FA596] shrink-0" />
                <span>India's #1 Broker-Free Student Housing &amp; Smart Bidding</span>
              </div>

              {/* Main Heading — DARK NAVY TEXT with TEAL "Living" */}
              <h1 className="text-2xl sm:text-4xl md:text-[40px] font-black text-[#0F172A] mb-1 tracking-tight leading-[1.15]">
                Premium Student &amp; <br className="hidden sm:inline" />
                Professional <span className="text-[#0FA596]">Living</span>
              </h1>
              <p className="text-[11px] sm:text-xs md:text-sm font-semibold text-[#334155] mb-3 max-w-xl mx-auto leading-relaxed">
                Find and book verified PGs, Hostels, Co-living spaces and Apartments in top cities.
              </p>

              {/* Search Container inside Glass Panel */}
              <div className="bg-white/90 backdrop-blur-md rounded-[20px] shadow-lg p-2.5 sm:p-3 border border-white/80 text-left relative z-50">
                {/* Category Tabs Bar */}
                <div className="flex items-center justify-center gap-2 sm:gap-5 border-b border-slate-100/80 pb-2 mb-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'pg', label: 'PG', icon: Bed },
                    { id: 'hostel', label: 'Hostels', icon: Building2 },
                    { id: 'co-living', label: 'Co-living', icon: Armchair },
                    { id: 'apartment', label: 'Apartments', icon: Home },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedType(isSelected ? '' : cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 text-[#0FA596] border border-teal-200/80 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0FA596]' : 'text-slate-400'}`} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Inputs Row */}
                <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-2">
                  {/* Location Search Input */}
                  <div className="relative flex-1 w-full flex items-center bg-white border border-slate-200/90 rounded-full px-3.5 py-2 shadow-2xs focus-within:border-[#0FA596] focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                    <Search className="w-3.5 h-3.5 text-[#0FA596] mr-2 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search city, locality or landmark (e.g. Koramangala, Mumbai)"
                      className="w-full bg-transparent outline-none text-xs font-bold text-slate-800 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Gender Filter Dropdown */}
                  <div className="w-full md:w-32 flex items-center bg-white border border-slate-200/90 rounded-full px-3 py-2 shadow-2xs text-xs font-bold text-slate-700">
                    <select
                      value={selectedGender || ''}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="w-full bg-transparent outline-none cursor-pointer"
                    >
                      <option value="">Any Gender</option>
                      <option value="male">Boys / Male</option>
                      <option value="female">Girls / Female</option>
                      <option value="unisex">Co-ed</option>
                    </select>
                  </div>

                  {/* Budget Filter Dropdown */}
                  <div className="w-full md:w-36 flex items-center bg-white border border-slate-200/90 rounded-full px-3 py-2 shadow-2xs text-xs font-bold text-slate-700">
                    <select
                      value={selectedBudget || ''}
                      onChange={(e) => setSelectedBudget(e.target.value)}
                      className="w-full bg-transparent outline-none cursor-pointer"
                    >
                      <option value="">Any Budget</option>
                      <option value="5000">&lt; ₹5,000</option>
                      <option value="10000">₹5,000 - ₹10,000</option>
                      <option value="15000">₹10,000 - ₹15,000</option>
                      <option value="20000">&gt; ₹15,000</option>
                    </select>
                  </div>

                  {/* Submit Search Button */}
                  <button
                    type="submit"
                    className="w-full md:w-auto bg-[#0FA596] hover:bg-[#0d9284] text-white px-6 py-2 rounded-full font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </form>

                {/* Dynamic Search Dropdown Results */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[9999]">
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((result, idx) => (
                        <Link
                          key={idx}
                          to={result.link}
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 border border-teal-100">
                            {result.icon === 'MapPin' && <MapPin className="w-4 h-4 text-[#0FA596]" />}
                            {result.icon === 'Building2' && <Building2 className="w-4 h-4 text-[#0FA596]" />}
                            {result.icon === 'Home' && <Home className="w-4 h-4 text-[#0FA596]" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-extrabold text-xs sm:text-sm text-slate-900">{result.title}</p>
                            <p className="text-[11px] text-slate-500 font-semibold">{result.subtitle}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* WHITE BENEFITS STRIP — OVERLAPPING HERO BOTTOM */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-5 relative z-40">
          <div className="bg-white rounded-[20px] shadow-xl border border-slate-100 p-3 md:p-3.5 grid grid-cols-2 md:grid-cols-5 gap-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="flex items-center gap-2.5 pt-1 md:pt-0">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 text-[#0FA596] border border-teal-100/60">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-[#0F172A] leading-tight">Smart Bidding</h4>
                <p className="text-[9px] font-semibold text-slate-500 leading-tight">Best price deals</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1 md:pt-0 md:pl-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 text-[#0FA596] border border-teal-100/60">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-[#0F172A] leading-tight">Verified Properties</h4>
                <p className="text-[9px] font-semibold text-slate-500 leading-tight">100% verified listings</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1 md:pt-0 md:pl-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 text-[#0FA596] border border-teal-100/60">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-[#0F172A] leading-tight">Lowest Price Guarantee</h4>
                <p className="text-[9px] font-semibold text-slate-500 leading-tight">Best price, always</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1 md:pt-0 md:pl-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 text-[#0FA596] border border-teal-100/60">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-[#0F172A] leading-tight">24/7 Support</h4>
                <p className="text-[9px] font-semibold text-slate-500 leading-tight">Always here to help</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1 md:pt-0 md:pl-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 text-[#0FA596] border border-teal-100/60">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-[#0F172A] leading-tight">Safe &amp; Secure</h4>
                <p className="text-[9px] font-semibold text-slate-500 leading-tight">Your safety, our priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* What We Offer Section — STARTS DIRECTLY BELOW HERO */}
        <section className="py-5 md:py-6 bg-white relative z-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-3 md:mb-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0F172A] mb-0.5 tracking-tight">
                What We Offer
              </h2>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 max-w-xl mx-auto">
                Choose from a variety of accommodation types tailored for students and professionals.
              </p>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  id: 'pg',
                  title: 'PG (Paying Guest)',
                  icon: Bed,
                  image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop',
                  link: '/website/ourproperty?type=pg'
                },
                {
                  id: 'hostel',
                  title: 'Hostels',
                  icon: Building2,
                  image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=600&auto=format&fit=crop',
                  link: '/website/ourproperty?type=hostel'
                },
                {
                  id: 'co-living',
                  title: 'Co-living',
                  icon: Armchair,
                  image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop',
                  link: '/website/ourproperty?type=co-living'
                },
                {
                  id: 'apartment',
                  title: 'Apartments',
                  icon: Home,
                  image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600&auto=format&fit=crop',
                  link: '/website/ourproperty?type=apartment'
                }
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.id}
                    to={card.link}
                    className="group relative h-40 md:h-44 rounded-[18px] overflow-hidden shadow-md border border-slate-100 hover:shadow-2xl transition-all duration-300 block"
                  >
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent"></div>

                    {/* Top Right Counter Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md border border-white/20">
                      1/3
                    </div>

                    {/* Bottom Left White Pill Category Badge */}
                    <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-black text-slate-900 flex items-center gap-1.5 shadow-md border border-white/80 group-hover:bg-white transition-all">
                      <div className="w-4 h-4 rounded-full bg-teal-50 flex items-center justify-center text-[#0FA596]">
                        <Icon className="w-3 h-3" />
                      </div>
                      <span>{card.title}</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-[#0FA596] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <MobileVideoSection />

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

            <div className="relative max-w-xl mx-auto rounded-2xl overflow-hidden shadow-lg group aspect-video">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent z-10 pointer-events-none"></div>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/4pFUP0HZwWM"
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <div className="absolute bottom-5 left-5 z-20 text-white">
                <h3 className="text-xl font-semibold">Watch Demo</h3>
                <p className="text-sm text-white/80">See how booking works</p>
              </div>
            </div>
          </div>
        </section>

        <section className="hidden md:block py-1 md:py-2 bg-white">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 mt-1 md:mt-2">
            <div className="flex flex-col items-center justify-center text-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Trending Stays This Week</h2>
              <p className="text-base text-gray-600">Most popular properties among students</p>
            </div>
            
            <div className="relative">
              {trendingProperties.length > trendingPerView && canShowPrevTrending && (
                <button 
                  onClick={prevTrending}
                  aria-label="Previous Trending Properties"
                  className="absolute -left-7 lg:-left-11 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-slate-700 shadow-xs flex items-center justify-center hover:bg-white/90 hover:text-slate-900 hover:scale-110 transition-all opacity-60 hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              
              {trendingProperties.length > trendingPerView && canShowNextTrending && (
                <button 
                  onClick={nextTrending}
                  aria-label="Next Trending Properties"
                  className="absolute -right-7 lg:-right-11 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-slate-700 shadow-xs flex items-center justify-center hover:bg-white/90 hover:text-slate-900 hover:scale-110 transition-all opacity-60 hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6">
                  {visibleTrending.map((property) => {
                    const propImgs = property.images && property.images.length > 0 ? property.images : [property.image];
                    const imgIdx = trendingCardImgIdx[property._id] || 0;
                    const totalImgs = propImgs.length;
                    return (
                      <Link
                        key={property._id}
                        to={getPropertyDetailsUrl(property)}
                        className="group block cursor-pointer"
                      >
                        <div className="relative h-36 rounded-md overflow-hidden mb-2">
                          <img
                            src={propImgs[imgIdx]}
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
                          {/* Left arrow */}
                          {totalImgs > 1 && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTrendingCardImgIdx(prev => ({ ...prev, [property._id]: (imgIdx - 1 + totalImgs) % totalImgs })); }}
                              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                            >
                              <ChevronLeft className="w-4 h-4 text-white" />
                            </button>
                          )}
                          {/* Right arrow */}
                          {totalImgs > 1 && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTrendingCardImgIdx(prev => ({ ...prev, [property._id]: (imgIdx + 1) % totalImgs })); }}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                            >
                              <ChevronRight className="w-4 h-4 text-white" />
                            </button>
                          )}
                          {/* Dot indicators */}
                          {totalImgs > 1 && (
                            <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              {propImgs.map((_, i) => (
                                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm mb-0.5 line-clamp-1 group-hover:text-teal-600 transition-colors">{property.name || property.property_name || 'Roomhy Property'}</h3>
                          <div className="text-gray-500 text-[11px] mb-1 line-clamp-1">
                            {property.location}
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
                    );
                  })}
              </div>
            </div>
          </div>
        </section>

        <section className="md:hidden py-1 bg-gray-50">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12">
            <div className="text-center mb-3">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Trending Stays This Week</h2>
              <p className="text-xs text-gray-600">Most popular properties among students</p>
            </div>

            <div className="relative -mx-4">
              <div 
                ref={trendingScrollContainerRef}
                className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
              >
                <div className="flex gap-3 w-max px-2 py-3">
                  {trendingProperties.map((property) => (
                    <Link
                      key={property._id}
                      to={getPropertyDetailsUrl(property)}
                      onClick={() => property._id && trackPropertyClick(property._id)}
                      className="flex-shrink-0 w-36 block active:scale-95 transition-transform"
                    >
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

        {recentlyViewed.length > 0 && (
          <section className="py-1 md:py-2 bg-white">
            <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 mt-1 md:mt-2">
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recently Viewed</h2>
                </div>
                <p className="text-[10px] md:text-sm text-gray-600">Pick up where you left off</p>
              </div>

              <div className="relative hidden md:block">
                {recentlyViewed.length > recentlyViewedPerView && canShowPrevRecentlyViewed && (
                  <button 
                    onClick={prevRecentlyViewed}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                
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
                      to={getPropertyDetailsUrl(item)}
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

              <div className="md:hidden -mx-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 px-2 pb-4 w-max">
                  {recentlyViewed.map((item) => (
                    <Link
                      key={item.id}
                      to={getPropertyDetailsUrl(item)}
                      className="flex-shrink-0 w-36"
                    >
                      <div className="relative h-24 rounded-2xl overflow-hidden shadow-md mb-2">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" width="144" height="96" />
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[10px] font-bold text-gray-800">4.5</span>
                        </div>
                      </div>
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

        <WhyRoomhy />
        
        <section className="py-2 md:py-4 bg-gradient-to-b from-white to-gray-50 overflow-hidden mt-2">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 mb-2 md:mb-4">
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1">What Students Say</h2>
              <p className="text-xs md:text-base text-gray-600">Trusted by 10,000+ students across India</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="flex animate-scroll-left hover:pause-animation">
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
      <MobileBottomNav />
    </div>
  );
}
