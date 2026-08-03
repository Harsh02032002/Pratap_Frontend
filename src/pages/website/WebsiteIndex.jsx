import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, BadgeCheck, TrendingUp, ChevronLeft, ChevronRight, ChevronDown, X, Building2, Home, Users, MessageSquare, Gavel, Plus, Minus } from 'lucide-react';
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
import { fetchCities, fetchProperties, trackPropertyClick } from '../../utils/api';

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
  { _id: 'static1', name: 'Sunrise PG', location: 'Kota, Rajasthan', price: '₹6,500', rating: 4.8, image: 'https://picsum.photos/600/400?random=29', verified: true },
  { _id: 'static2', name: 'Elite Hostel', location: 'Indore, MP', price: '₹5,200', rating: 4.6, image: 'https://picsum.photos/600/400?random=30', verified: true },
  { _id: 'static3', name: 'Urban Co-Space', location: 'Sikar, Rajasthan', price: '₹8,900', rating: 4.9, image: 'https://picsum.photos/600/400?random=31', verified: true },
  { _id: 'static4', name: 'Campus View PG', location: 'Kota, Rajasthan', price: '₹7,800', rating: 4.7, image: 'https://picsum.photos/600/400?random=32', verified: true },
  { _id: 'static8', name: 'Royal Residency', location: 'Indore, MP', price: '₹12,500', rating: 4.5, image: 'https://picsum.photos/600/400?random=33', verified: true },
  { _id: 'static5', name: 'Smart Stay PG', location: 'Sikar, Rajasthan', price: '₹5,800', rating: 4.4, image: 'https://picsum.photos/600/400?random=34', verified: true },
  { _id: 'static6', name: 'Grand Hostel', location: 'Kota, Rajasthan', price: '₹4,800', rating: 4.3, image: 'https://picsum.photos/600/400?random=35', verified: true },
  { _id: 'static7', name: 'City Center PG', location: 'Indore, MP', price: '₹6,200', rating: 4.6, image: 'https://picsum.photos/600/400?random=36', verified: true },
  { _id: 'static9', name: 'Premium Co-Living', location: 'Sikar, Rajasthan', price: '₹10,500', rating: 4.8, image: 'https://picsum.photos/600/400?random=37', verified: true },
  { _id: 'static10', name: 'Student Hub', location: 'Kota, Rajasthan', price: '₹5,500', rating: 4.2, image: 'https://picsum.photos/600/400?random=38', verified: true }
];

const heroImages = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto=format&fit=crop'
];

export default function WebsiteIndex() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [cityAreasMap, setCityAreasMap] = useState(cityAreas);
  const [offerings, setOfferings] = useState([]);
  const [trendingProperties, setTrendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  const [isFloatingSearchVisible, setIsFloatingSearchVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

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

  const getCityImage = (cityName) => {
    const cityImages = {
      'Kota': 'https://picsum.photos/600/400?random=1',
      'Sikar': 'https://picsum.photos/600/400?random=7',
      'Indore': 'https://picsum.photos/600/400?random=2'
    };
    return cityImages[cityName] || 'https://picsum.photos/600/400?random=1';
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // STATIC MODE: using static cities only (Kota, Sikar, Indore)
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
      const cityMatches = cities.filter(city => city.name?.toLowerCase().includes(lowerQuery)).map(city => ({
        type: 'city', title: city.name, subtitle: `${city.properties || '1000+'} properties`,
        link: `/website/ourproperty?city=${encodeURIComponent(city.name.toLowerCase())}`, icon: 'MapPin'
      }));
      results.push(...cityMatches);
      const propertyMatches = trendingProperties.filter(prop => {
        const propName = prop.propertyName || prop.property_name || prop.name || '';
        return propName.toLowerCase().includes(lowerQuery);
      }).slice(0, 5).map(prop => ({
        type: 'property', title: prop.propertyName || prop.property_name || prop.name,
        subtitle: `${prop.city || prop.location || ''} - ${prop.propertyType || prop.type || 'Property'}`,
        link: `/website/property-details/${prop._id || prop.visitId}`, icon: 'Building2'
      }));
      results.push(...propertyMatches);
      const typeMatches = offerings.filter(offering =>
        offering.title?.toLowerCase().includes(lowerQuery) || offering.category?.toLowerCase().includes(lowerQuery)
      ).map(offering => ({
        type: 'type', title: offering.title, subtitle: `Find ${offering.title} accommodations`,
        link: `/website/ourproperty?type=${encodeURIComponent(offering.category.toLowerCase())}`, icon: 'Home'
      }));
      results.push(...typeMatches);
      setSearchResults(results.slice(0, 8));
      setShowSearchDropdown(true);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (searchQuery) handleSearch(searchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setHasSearched(true);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedType) params.append('type', selectedType.toLowerCase());
    const queryString = params.toString();
    navigate(queryString ? `/website/ourproperty?${queryString}` : '/website/ourproperty');
    setShowSearchDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchDropdown && !event.target.closest('.search-container')) setShowSearchDropdown(false);
      if (isTypeDropdownOpen && typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) setIsTypeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchDropdown]);

  const [cityStartIndex, setCityStartIndex] = useState(0);
  const citiesPerView = 4;
  const [mobileCityIndex, setMobileCityIndex] = useState(0);
  const [trendingStartIndex, setTrendingStartIndex] = useState(0);
  const trendingPerView = 5;
  const [offeringSelectedImage, setOfferingSelectedImage] = useState({});
  const [mobileOfferingIndex, setMobileOfferingIndex] = useState(0);
  const [mobileImageIndex, setMobileImageIndex] = useState(0);

  const offeringScrollContainerRef = useRef(null);
  const trendingScrollContainerRef = useRef(null);
  const citiesScrollContainerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextCities = () => setCityStartIndex((prev) => prev + citiesPerView >= cities.length ? 0 : prev + citiesPerView);
  const prevCities = () => setCityStartIndex((prev) => prev - citiesPerView < 0 ? Math.max(0, cities.length - citiesPerView) : prev - citiesPerView);
  const nextTrending = () => setTrendingStartIndex((prev) => prev + trendingPerView >= trendingProperties.length ? 0 : prev + trendingPerView);
  const prevTrending = () => setTrendingStartIndex((prev) => prev - trendingPerView < 0 ? Math.max(0, trendingProperties.length - trendingPerView) : prev - trendingPerView);

  const visibleCities = cities.slice(cityStartIndex, cityStartIndex + citiesPerView);
  const visibleTrending = trendingProperties.slice(trendingStartIndex, trendingStartIndex + trendingPerView);
  const canShowNextCities = cityStartIndex + citiesPerView < cities.length;
  const canShowPrevCities = cityStartIndex > 0;
  const canShowNextTrending = trendingStartIndex + trendingPerView < trendingProperties.length;
  const canShowPrevTrending = trendingStartIndex > 0;

  const [recentlyViewedStartIndex, setRecentlyViewedStartIndex] = useState(0);
  const recentlyViewedPerView = 5;
  const nextRecentlyViewed = () => setRecentlyViewedStartIndex((prev) => prev + recentlyViewedPerView >= recentlyViewed.length ? 0 : prev + recentlyViewedPerView);
  const prevRecentlyViewed = () => setRecentlyViewedStartIndex((prev) => prev - recentlyViewedPerView < 0 ? Math.max(0, recentlyViewed.length - recentlyViewedPerView) : prev - recentlyViewedPerView);
  const visibleRecentlyViewed = recentlyViewed.slice(recentlyViewedStartIndex, recentlyViewedStartIndex + recentlyViewedPerView);
  const canShowNextRecentlyViewed = recentlyViewedStartIndex + recentlyViewedPerView < recentlyViewed.length;
  const canShowPrevRecentlyViewed = recentlyViewedStartIndex > 0;

  const canShowNextMobileCity = mobileCityIndex + 4 < cities.length;
  const canShowPrevMobileCity = mobileCityIndex > 0;
  const canShowNextMobileOffering = mobileOfferingIndex + 3 < offerings.length;
  const canShowPrevMobileOffering = mobileOfferingIndex > 0;
  const visibleMobileCities = cities.slice(mobileCityIndex, mobileCityIndex + 4);
  const visibleMobileOfferings = offerings.slice(mobileOfferingIndex, mobileOfferingIndex + 3);

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
          <div className="px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 border border-gray-100">Search</div>
        </div>
      </div>

      <main className="min-h-screen">
        {/* ── HERO SECTION – exact PDF design ── */}
        <div className="hidden md:block bg-white border-b border-gray-100">
          <div className="max-w-none w-full mx-auto px-6 lg:px-12">
            <div className="flex items-stretch min-h-[390px] relative">

              {/* LEFT: text + search */}
              <div className="flex-1 flex flex-col justify-center py-8 pr-8 max-w-[54%]">
                {/* Zero brokerage badge */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Zero Brokerage</span>
                </div>

                {/* Main heading */}
                <h1 className="text-[2.15rem] leading-[1.18] font-extrabold text-gray-900 mb-2">
                  Premium Student &amp; Professional{' '}
                  <span className="text-teal-500">Living</span>
                </h1>

                {/* Sub heading */}
                <p className="text-sm text-gray-500 mb-5 leading-relaxed max-w-md">
                  Find and book verified PGs, Hostels, Co-living spaces and Apartments in top cities.
                </p>

                {/* Type Tabs */}
                <div className="flex items-center gap-0 mb-3 border-b border-gray-200">
                  {['PG', 'Hostels', 'Co-living', 'Apartments'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedType(tab === 'PG' ? 'pg' : tab.toLowerCase())}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-all -mb-px ${
                        (selectedType === tab.toLowerCase() || (tab === 'PG' && selectedType === 'pg') || (tab === 'PG' && !selectedType))
                          ? 'border-teal-500 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'PG' && <Home className="w-3.5 h-3.5" />}
                      {tab === 'Hostels' && <Building2 className="w-3.5 h-3.5" />}
                      {tab === 'Co-living' && <Users className="w-3.5 h-3.5" />}
                      {tab === 'Apartments' && <Building2 className="w-3.5 h-3.5" />}
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Search bar */}
                <div className="search-container relative">
                  <form onSubmit={handleSearchSubmit} className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible h-12">
                    <div className="flex-1 flex items-center px-4 h-full">
                      <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search city, locality or landmark"
                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 font-medium placeholder-gray-400 h-full min-w-0"
                      />
                    </div>
                    <div className="h-8 w-px bg-gray-200 flex-shrink-0" />
                    <div className="relative flex-shrink-0">
                      <select className="h-12 pl-3 pr-7 text-sm font-medium text-gray-600 bg-transparent outline-none cursor-pointer appearance-none">
                        <option>Any Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Any</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <div className="h-8 w-px bg-gray-200 flex-shrink-0" />
                    <div className="relative flex-shrink-0">
                      <select className="h-12 pl-3 pr-7 text-sm font-medium text-gray-600 bg-transparent outline-none cursor-pointer appearance-none">
                        <option>Any Budget</option>
                        <option>Under ₹5,000</option>
                        <option>₹5,000 – ₹10,000</option>
                        <option>₹10,000 – ₹20,000</option>
                        <option>Above ₹20,000</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white h-full px-6 font-semibold text-sm flex items-center gap-2 transition-colors flex-shrink-0">
                      <Search className="w-4 h-4" />
                      Search
                    </button>
                  </form>

                  {/* Search dropdown */}
                  {showSearchDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="max-h-72 overflow-y-auto">
                        {searchResults.map((result, idx) => (
                          <Link
                            key={idx}
                            to={result.link}
                            onClick={() => setShowSearchDropdown(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                          >
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                              {result.icon === 'MapPin' && <MapPin className="w-4 h-4 text-teal-600" />}
                              {result.icon === 'Building2' && <Building2 className="w-4 h-4 text-teal-600" />}
                              {result.icon === 'Home' && <Home className="w-4 h-4 text-teal-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{result.title}</p>
                              <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: hero image */}
              <div className="flex-1 relative overflow-hidden">
                {heroImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ backgroundImage: `url(${image})` }}
                  />
                ))}
                {/* Verified Stays card */}
                <div className="absolute bottom-6 right-6 bg-white rounded-2xl shadow-xl p-3 flex flex-col gap-1 z-10">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-xs font-bold text-gray-800">Verified Stays</span>
                  </div>
                  <div className="flex -space-x-2">
                    {['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face','https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face','https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face'].map((src, i) => (
                      <img key={i} src={src} alt="student" className="w-7 h-7 rounded-full border-2 border-white object-cover" loading="lazy" />
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">50,000+ Students</p>
                    <p className="text-[10px] text-gray-500">Trust Roomhy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Hero */}
        <div className="md:hidden relative h-[240px] bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-600">
          <div className="absolute inset-0 overflow-hidden">
            {heroImages.map((image, index) => (
              <div key={index} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url(${image})` }}>
                <div className="absolute inset-0 bg-black/55" />
              </div>
            ))}
          </div>
          <div className="relative h-full flex flex-col justify-center items-center px-4 text-center">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-4 h-4 rounded-full bg-teal-400 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
              <span className="text-xs font-semibold text-white/90">Zero Brokerage</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-tight mb-1">Premium Student &amp;<br />Professional <span className="text-teal-300">Living</span></h1>
            <p className="text-xs text-white/80 mb-4">Find verified PGs, Hostels, Co-living &amp; Apartments</p>
            <div className="search-container w-full max-w-sm">
              <form onSubmit={handleSearchSubmit} className="flex items-center bg-white rounded-xl shadow-lg overflow-hidden h-10">
                <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search city, locality..." className="flex-1 bg-transparent outline-none text-xs text-gray-700 font-medium px-2 h-full" />
                <button type="submit" className="bg-teal-500 text-white px-4 h-full text-xs font-bold flex-shrink-0">Search</button>
              </form>
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  {searchResults.slice(0, 5).map((result, idx) => (
                    <Link key={idx} to={result.link} onClick={() => setShowSearchDropdown(false)} className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">{result.icon === 'MapPin' && <MapPin className="w-3 h-3 text-teal-600" />}{result.icon === 'Building2' && <Building2 className="w-3 h-3 text-teal-600" />}{result.icon === 'Home' && <Home className="w-3 h-3 text-teal-600" />}</div>
                      <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900 truncate">{result.title}</p><p className="text-[10px] text-gray-500 truncate">{result.subtitle}</p></div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TRUST BAR ── */}
        <div className="hidden md:block bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-none w-full mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between py-3">
              {[
                { icon: '🛡️', label: 'Zero Brokerage', sub: 'No hidden charges' },
                { icon: '✅', label: 'Verified Properties', sub: '100% verified listings' },
                { icon: '💰', label: 'Lowest Price Guarantee', sub: 'Best price, always' },
                { icon: '🎧', label: '24/7 Support', sub: 'Always here to help' },
                { icon: '🔒', label: 'Safe & Secure', sub: 'Your safety, our priority' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-800 leading-none">{item.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── WHAT WE OFFER ── */}
        <section className="py-4 md:py-6 bg-white">
          <div className="max-w-none w-full mx-auto px-4 md:px-6 lg:px-12">
            <div className="text-center mb-4">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-0.5">What We Offer</h2>
              <p className="text-xs md:text-sm text-gray-500">Choose from a variety of accommodation types tailored for students and professionals.</p>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-5 gap-3">
              {offerings.map((offering) => {
                const selectedIdx = offeringSelectedImage[offering.title] || 0;
                const allImages = offering.images;
                const totalImages = allImages.length;
                const nextImage = () => setOfferingSelectedImage(prev => ({ ...prev, [offering.title]: (selectedIdx + 1) % totalImages }));
                const prevImage = () => setOfferingSelectedImage(prev => ({ ...prev, [offering.title]: (selectedIdx - 1 + totalImages) % totalImages }));
                return (
                  <div
                    key={offering.title}
                    onClick={() => offering.link ? navigate(offering.link) : navigate(`/website/ourproperty?type=${offering.category.toLowerCase()}`)}
                    className="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-all group cursor-pointer"
                  >
                    <div className="h-[130px] overflow-hidden relative">
                      <img src={allImages[selectedIdx]} alt={offering.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" width="200" height="130" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h3 className="text-sm font-bold text-white drop-shadow">{offering.title}</h3>
                        <p className="text-[10px] text-white/80 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">{offering.description}</p>
                      </div>
                      {totalImages > 1 && (<button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"><ChevronLeft className="w-4 h-4 text-white" /></button>)}
                      {totalImages > 1 && (<button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"><ChevronRight className="w-4 h-4 text-white" /></button>)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Scroll */}
            <div className="md:hidden -mx-4">
              <div ref={offeringScrollContainerRef} className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 w-max px-4 py-2">
                  {offerings.map((offering) => (
                    <div key={offering.title} onClick={() => navigate(`/website/ourproperty?type=${offering.category.toLowerCase()}`)} className="flex-shrink-0 w-32 bg-white rounded-xl overflow-hidden shadow cursor-pointer">
                      <div className="h-20 overflow-hidden relative">
                        <img src={offering.images[0]} alt={offering.title} className="w-full h-full object-cover" loading="lazy" width="128" height="80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <h3 className="absolute bottom-1 left-2 text-xs font-bold text-white drop-shadow">{offering.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cities Sub-navigation */}
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

        {/* What We Offer */}
        <section className="py-1 md:py-4 bg-white">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 mt-1 md:mt-4">
            <div className="text-center mb-4">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1">What We Offer</h2>
              <p className="text-xs md:text-base text-gray-600">Choose from a variety of accommodation types tailored for students</p>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              {offerings.map((offering) => {
                const selectedIdx = offeringSelectedImage[offering.title] || 0;
                const allImages = offering.images;
                const totalImages = allImages.length;

                const nextImage = () => {
                  setOfferingSelectedImage(prev => ({ ...prev, [offering.title]: (selectedIdx + 1) % totalImages }));
                };
                const prevImage = () => {
                  setOfferingSelectedImage(prev => ({ ...prev, [offering.title]: (selectedIdx - 1 + totalImages) % totalImages }));
                };

                return (
                  <div
                    key={offering.title}
                    onClick={() => offering.link ? navigate(offering.link) : navigate(`/website/ourproperty?type=${offering.category.toLowerCase()}`)}
                    className="bg-white rounded-xl overflow-hidden shadow hover:shadow-xl transition-all group cursor-pointer"
                  >
                    <div className="h-40 overflow-hidden relative">
                      <img src={allImages[selectedIdx]} alt={offering.title} className="w-full h-full object-cover transition-all duration-300" loading="lazy" width="200" height="160" />
                      <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/50 to-transparent">
                        <h3 className="text-base font-bold text-white drop-shadow-md">{offering.title}</h3>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-xs text-white drop-shadow-md line-clamp-2">{offering.description}</p>
                      </div>
                      {totalImages > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); prevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10">
                          <ChevronLeft className="w-6 h-6 text-white drop-shadow-lg" />
                        </button>
                      )}
                      {totalImages > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); nextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10">
                          <ChevronRight className="w-6 h-6 text-white drop-shadow-lg" />
                        </button>
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">{selectedIdx + 1} / {totalImages}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Scroll */}
            <div className="md:hidden relative -mx-4">
              <div ref={offeringScrollContainerRef} className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing">
                <div className="flex gap-4 w-max px-2 py-3">
                  {offerings.map((offering) => (
                    <div
                      key={offering.title}
                      onClick={() => navigate(`/website/ourproperty?type=${offering.category.toLowerCase()}`)}
                      className="flex-shrink-0 w-32 bg-white rounded-lg overflow-hidden shadow cursor-pointer"
                    >
                      <div className="h-24 overflow-hidden relative group">
                        <img src={offering.images[0]} alt={offering.title} className="w-full h-full object-cover" loading="lazy" width="128" height="96" />
                        <div className="absolute top-0 left-0 right-0 p-1 bg-gradient-to-b from-black/50 to-transparent">
                          <h3 className="text-xs font-bold text-white drop-shadow-md truncate">{offering.title}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <MobileVideoSection />

        {/* How Roomhy Works */}
        <section className="hidden md:block py-5 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">How Roomhy Works</h2>
              <p className="text-xs md:text-sm text-gray-500">Find, compare, and book your perfect stay in just a few steps</p>
            </div>
            <div className="relative max-w-lg mx-auto rounded-2xl overflow-hidden shadow-lg group aspect-video">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent z-10 pointer-events-none"></div>
              <iframe className="absolute top-0 left-0 w-full h-full" src="https://www.youtube.com/embed/4pFUP0HZwWM" title="How Roomhy Works" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
              <div className="absolute bottom-4 left-4 z-20 text-white">
                <h3 className="text-base font-semibold">Watch Demo</h3>
                <p className="text-xs text-white/80">See how booking works</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Stays - Desktop */}
        <section className="hidden md:block py-4 bg-white border-t border-gray-100">
          <div className="max-w-none w-full mx-auto px-4 md:px-6 lg:px-12">
            <div className="flex flex-col items-center justify-center text-center mb-3">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">Trending Stays This Week</h2>
              <p className="text-xs md:text-sm text-gray-500">Most popular properties among students</p>
            </div>
            <div className="relative">
              {trendingProperties.length > trendingPerView && canShowPrevTrending && (
                <button onClick={prevTrending} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              {trendingProperties.length > trendingPerView && canShowNextTrending && (
                <button onClick={nextTrending} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6">
                {visibleTrending.map((property) => (
                  <Link key={property._id} to={`/website/property-details/${property._id}`} className="group block cursor-pointer">
                    <div className="relative h-36 rounded-md overflow-hidden mb-2">
                      <img src={property.image} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width="300" height="144"
                        onError={(e) => { e.target.src = `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 100)}`; }}
                      />
                      {property.verified && (
                        <div className="absolute top-2 left-2 bg-white/20 backdrop-blur border border-white/30 rounded px-1.5 py-0.5 flex items-center shadow-lg">
                          <BadgeCheck className="w-3.5 h-3.5 text-teal-600 mr-1" />
                          <span className="text-[10px] font-bold text-gray-900">Verified</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-0.5 line-clamp-1 group-hover:text-teal-600 transition-colors">{property.name || 'Roomhy Property'}</h3>
                      <div className="text-gray-500 text-[11px] mb-1 line-clamp-1">{property.location}</div>
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

        {/* Mobile Trending Stays */}
        <section className="md:hidden py-1 bg-gray-50">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12">
            <div className="text-center mb-3">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Trending Stays This Week</h2>
              <p className="text-xs text-gray-600">Most popular properties among students</p>
            </div>
            <div className="relative -mx-4">
              <div ref={trendingScrollContainerRef} className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing">
                <div className="flex gap-3 w-max px-2 py-3">
                  {trendingProperties.map((property) => (
                    <Link key={property._id} to={`/website/property-details/${property._id}`} onClick={() => property._id && trackPropertyClick(property._id)} className="flex-shrink-0 w-36 block active:scale-95 transition-transform">
                      <div className="relative h-24 rounded-2xl overflow-hidden shadow-md mb-2">
                        <img src={property.image} alt={property.name} className="w-full h-full object-cover" loading="lazy" width="144" height="96"
                          onError={(e) => { e.target.src = `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 100)}`; }}
                        />
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[10px] font-bold text-gray-800">{property.rating}</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm mb-0 line-clamp-1">{property.name || 'Roomhy Property'}</h3>
                      <div className="flex items-center text-gray-600 font-medium text-[10px] mb-0">
                        <MapPin className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{property.location}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-gray-900">{property.monthlyRent ? `₹${property.monthlyRent.toLocaleString()}` : (property.price || '₹0')}</span>
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

        {/* Recently Viewed Properties */}
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
                  <button onClick={prevRecentlyViewed} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                {recentlyViewed.length > recentlyViewedPerView && canShowNextRecentlyViewed && (
                  <button onClick={nextRecentlyViewed} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-6">
                  {visibleRecentlyViewed.map((item) => (
                    <Link key={item.id} to={`/website/property-details/${item.id}`} className="group block cursor-pointer">
                      <div className="relative h-36 rounded-md overflow-hidden mb-2">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width="300" height="144"
                          onError={(e) => { e.target.src = `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 100)}`; }}
                        />
                        <div className="absolute top-2 left-2 flex gap-1">
                          <div className="bg-white/20 backdrop-blur border border-white/30 rounded px-1.5 py-0.5 flex items-center shadow-lg">
                            <span className="text-[9px] font-bold text-teal-600 uppercase tracking-wider">{item.type || 'PG'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-0.5 line-clamp-1 group-hover:text-teal-600 transition-colors">{item.name}</h3>
                        <div className="text-gray-500 text-[11px] mb-1 line-clamp-1">{item.location}</div>
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
                    <Link key={item.id} to={`/website/property-details/${item.id}`} className="flex-shrink-0 w-36">
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

        {/* Why Choose Roomhy */}
        <WhyRoomhy />

        {/* ── BROWSE BY CITIES (From Magic Clone) ── */}
        <section className="py-4 md:py-6 bg-[#f8fffd] border-t border-gray-100">
          <div className="max-w-none w-full mx-auto px-4 md:px-6 lg:px-12">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-0.5">Browse by Cities</h2>
                <p className="text-xs md:text-sm text-gray-500">Explore properties in India's most popular student cities.</p>
              </div>
              <Link to="/website/ourproperty" className="shrink-0 text-xs font-semibold text-teal-600 hover:text-teal-700">View all cities →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {cities.slice(0, 6).map((c) => (
                <Link to={`/website/ourproperty?city=${encodeURIComponent(c.name)}`} key={c.name} className="group overflow-hidden rounded-xl border border-teal-100 bg-white shadow-sm hover:-translate-y-1 hover:shadow-md transition-all">
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-sm font-bold text-white drop-shadow-md">{c.name}</p>
                      <p className="text-[10px] font-medium text-white/90 drop-shadow">{c.properties} Properties</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Slider Section */}
        <section className="py-4 md:py-6 bg-white overflow-hidden border-t border-gray-100">
          <div className="max-w-none w-full mx-auto px-4 md:px-6 lg:px-12 mb-3">
            <div className="text-center">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-0.5">What Students Say</h2>
              <p className="text-xs md:text-sm text-gray-500">Trusted by 10,000+ students across India</p>
            </div>
          </div>
          <div className="relative">
            <div className="flex animate-scroll-left hover:pause-animation">
              {[...Array(2)].flatMap((_, setIdx) => [
                { name: "Rahul Sharma", role: "IIT Delhi Student", rating: 5, text: "Roomhy made finding my hostel so easy! Zero brokerage and the bidding feature helped me get a great deal.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
                { name: "Priya Patel", role: "Medical Student", rating: 5, text: "The 24/7 support team helped me find a safe PG near my college. Best platform for students!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
                { name: "Amit Kumar", role: "Engineering Student", rating: 5, text: "Found a fully furnished apartment in just 2 days. The direct chat with owners saved so much time.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" },
                { name: "Sneha Gupta", role: "MBA Student", rating: 5, text: "Love the verified listings! No fake photos or hidden charges. Roomhy is a game changer.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
                { name: "Vikram Singh", role: "Law Student", rating: 4, text: "The ₹500 booking token is such a smart feature. It shows owners you're serious about renting.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
                { name: "Anjali Mehta", role: "CA Student", rating: 5, text: "Moved to Kota for coaching and found the perfect hostel within a day. Thank you Roomhy!", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" }
              ].map((review, idx) => (
                <div key={`${setIdx}-${idx}`} className="flex-shrink-0 w-[280px] mx-2">
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full object-cover border-2 border-teal-100" loading="lazy" width="40" height="40" />
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{review.name}</h4>
                        <p className="text-xs text-gray-500">{review.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
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
            .animate-scroll-left { animation: scroll-left 30s linear infinite; }
            .animate-scroll-left:hover { animation-play-state: paused; }
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </section>

        {/* ── FAQ SECTION (From Magic Clone) ── */}
        <section className="py-4 md:py-6 bg-gray-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <div className="text-center mb-5">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-0.5">Frequently Asked Questions</h2>
              <p className="text-xs md:text-sm text-gray-500">Everything you need to know before you book</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { q: "How does zero brokerage work?", a: "You connect directly with verified property owners on Roomhy — no middlemen, no brokerage fees, ever." },
                { q: "What documents are required to book?", a: "A valid government ID (Aadhaar / passport) and a student/employee ID is usually enough." },
                { q: "Can I get a refund if I cancel?", a: "Yes — refunds follow the cancellation policy shown on each listing before you book." },
                { q: "Is the property verified?", a: "Every listing is physically inspected and verified by the Roomhy team before it goes live." }
              ].map((f, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="rounded-xl bg-white border border-gray-200 overflow-hidden transition-all shadow-sm">
                    <button onClick={() => setOpenFaq(isOpen ? -1 : i)} className="w-full flex items-center justify-between p-3.5 text-left bg-white hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-semibold text-gray-800">{f.q}</span>
                      {isOpen ? <Minus className="h-4 w-4 text-teal-600 flex-shrink-0" /> : <Plus className="h-4 w-4 text-teal-600 flex-shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-1">
                        <p className="text-xs leading-relaxed text-gray-600">{f.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}
