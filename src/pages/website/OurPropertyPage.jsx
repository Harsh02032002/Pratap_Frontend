import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import * as LucideIcons from "lucide-react";
const { Filter, MapPin, Wallet, Home, Users, TrendingUp, Send, RefreshCw, ChevronLeft, ChevronRight, Building2, BookOpen, Star, Check, Phone, Wifi, Utensils, Car, Dumbbell, Tv, Wind, Droplets, Zap, X, Menu, Heart, ChevronDown, Clock, Shirt, Cctv, Video, Waves, Fan } = LucideIcons;
import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { fetchProperties, searchPropertiesByLocation, getNearbyAreas, getInstitutions, getPriceRangeByType, trackPropertyClick, getApiBase, fetchJson } from "../../utils/api";
import FastBiddingModal from "../../components/website/FastBiddingModal";
import QuickBookingModal from "../../components/website/QuickBookingModal";
import { useAuth } from "../../contexts/AuthContext";
import { useHtmlPage } from "../../utils/htmlPage";
import axios from "axios";
import useSEO from "../../hooks/useSEO";

// Client-side memory cache to optimize performance and prevent duplicate SEO API lookups
const seoCache = new Map();

export default function OurPropertyPage() {
  useSEO({ pageKey: 'our-property', fallbackTitle: 'Browse PGs, Hostels & Co-living Spaces - Roomhy' });
  const [showFilters, setShowFilters] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { city: citySlug, area: areaSlug } = useParams();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState([]);
  const [nearbyAreas, setNearbyAreas] = useState([]);
  const [allColleges, setAllColleges] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0, average: 0, count: 0 });
  const [propertyNearbyColleges, setPropertyNearbyColleges] = useState({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [propertiesPerPage] = useState(10);
  const [totalProperties, setTotalProperties] = useState([]);
  const [totalCount, setTotalCount] = useState(0); // Total from API

  // Layout sections from CMS editor
  const [layoutSections, setLayoutSections] = useState([]);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const timeoutPromise = new Promise(r => setTimeout(() => r({ success: false }), 3000));
        const apiPromise = fetchJson('/api/page-layouts/our-property');
        const res = await Promise.race([apiPromise, timeoutPromise]);
        if (res?.success && res?.data?.sections) {
          setLayoutSections(res.data.sections.sort((a, b) => a.order - b.order));
        }
      } catch (err) {
        console.warn('Failed to load property listing layout:', err);
      }
    };
    fetchLayout();
  }, []);

  // Helper to get section content from CMS layout
  const getSectionContent = (sectionId, defaults = {}) => {
    const section = layoutSections.find(s => s.id === sectionId);
    if (section?.content) return { ...defaults, ...section.content };
    return defaults;
  };

  const isSectionVisible = (sectionId) => {
    if (layoutSections.length === 0) return true;
    const sec = layoutSections.find(s => s.id === sectionId);
    return sec ? sec.visible !== false : true;
  };
  
  // Helper to slugify text on the client side
  const slugify = (text) => {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  };

  // Helper to humanize a slug
  const humanizeSlug = (s) => {
    if (!s) return "";
    return s
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const { pathname } = useLocation();

  const getTypeFromPathname = (path) => {
    if (path.startsWith('/pg')) return 'PG';
    if (path.startsWith('/hostels')) return 'Hostel';
    if (path.startsWith('/co-living')) return 'Co-living';
    if (path.startsWith('/apartments')) return 'Apartment';
    return '';
  };

  const getPrefix = (path) => {
    if (path.startsWith('/pg')) return '/pg';
    if (path.startsWith('/hostels')) return '/hostels';
    if (path.startsWith('/co-living')) return '/co-living';
    if (path.startsWith('/apartments')) return '/apartments';
    if (path.startsWith('/property')) return '/property';
    return '/website/ourproperty';
  };

  // Get parameters from URL first (before using them in state)
  const typeFromUrl = searchParams.get('type');
  const cityFromUrl = searchParams.get('city');
  const areaFromUrl = searchParams.get('area');
  const searchFromUrl = searchParams.get('search');
  const latitudeFromUrl = searchParams.get('latitude');
  const longitudeFromUrl = searchParams.get('longitude');
  
  const initialCity = cityFromUrl || (citySlug ? humanizeSlug(citySlug) : "");
  const initialArea = areaFromUrl || (areaSlug ? humanizeSlug(areaSlug) : "");
  const initialType = typeFromUrl || getTypeFromPathname(pathname) || '';

  // Filter states (after URL params are declared)
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [selectedType, setSelectedType] = useState(initialType);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl || '');
  const [selectedGender, setSelectedGender] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [sortBy, setSortBy] = useState('Featured');
  const [showSort, setShowSort] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedPropertyForBid, setSelectedPropertyForBid] = useState(null);
  const [showDirectBookingModal, setShowDirectBookingModal] = useState(false);
  const [selectedPropertyForDirectBook, setSelectedPropertyForDirectBook] = useState(null);
  const { user, isAuthenticated } = useAuth();

  const handleDirectBookingSubmit = async (bookingData) => {
    let userId = bookingData.email;
    try {
      const raw = sessionStorage.getItem("website_user") || localStorage.getItem("website_user") ||
                  sessionStorage.getItem("user") || localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?._id || u?.id) userId = u._id || u.id;
      }
    } catch (_) {}

    const targetProp = selectedPropertyForDirectBook || {};
    const ownerId = targetProp.generatedCredentials?.loginId || targetProp.ownerLoginId || targetProp.owner_id || targetProp.owner || targetProp.createdBy || targetProp.propertyOwnerId || '';

    const payload = {
      property_id: targetProp._id || targetProp.id || bookingData.propertyId,
      property_name: targetProp.name || targetProp.title || bookingData.propertyName || 'Property',
      owner_id: ownerId,
      rent_amount: parseInt(targetProp.price || targetProp.monthlyRent || targetProp.rent || bookingData.propertyPrice || 0, 10),
      area: targetProp.area || targetProp.locality || targetProp.propertyInfo?.area || targetProp.location || 'Nearby',
                    city: targetProp.city || targetProp.propertyInfo?.city || targetProp.location || 'Kota',
      property_type: targetProp.type || targetProp.propertyType || targetProp.propertyInfo?.propertyType || 'PG',
      request_type: 'direct',
      user_id: userId,
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      message: bookingData.message || 'Direct booking request from website',
    };

    const res = await fetch(`${getApiBase()}/api/booking/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit booking request');
    alert('Direct Booking Request Sent Successfully to Property Owner!');
    setShowDirectBookingModal(false);
  };

  const [seoData, setSeoData] = useState({
    title: "Our Properties | Roomhy",
    description: "Find verified, broker-free PGs and hostels on Roomhy.",
    keywords: "pg, hostel, co-living, student housing",
    canonicalUrl: ""
  });

  // Synchronize type from path/URL changes
  useEffect(() => {
    const type = getTypeFromPathname(pathname) || typeFromUrl || '';
    setSelectedType(type);
  }, [pathname, typeFromUrl]);

  // 1. Redirect old query parameter URLs to clean path parameters (301-equivalent client-side redirect)
  useEffect(() => {
    const qCity = searchParams.get("city");
    const qArea = searchParams.get("area");
    if (qCity) {
      const citySlugified = slugify(qCity);
      const areaSlugified = qArea ? slugify(qArea) : "";
      const prefix = getPrefix(pathname);
      const cleanPath = `${prefix}/${citySlugified}${
        areaSlugified ? "/" + areaSlugified : ""
      }`;
      
      const remainingParams = new URLSearchParams(searchParams);
      remainingParams.delete("city");
      remainingParams.delete("area");
      const queryString = remainingParams.toString();
      
      navigate(`${cleanPath}${queryString ? "?" + queryString : ""}`, {
        replace: true
      });
    }
  }, [searchParams, navigate, pathname]);

  // 2. Synchronize path parameters with active selection states
  useEffect(() => {
    if (citySlug) {
      const hCity = humanizeSlug(citySlug);
      if (selectedCity.toLowerCase() !== hCity.toLowerCase()) {
        setSelectedCity(hCity);
      }
    } else if (!cityFromUrl) {
      setSelectedCity("");
    }
  }, [citySlug, cityFromUrl]);

  useEffect(() => {
    if (areaSlug) {
      const hArea = humanizeSlug(areaSlug);
      if (selectedArea.toLowerCase() !== hArea.toLowerCase()) {
        setSelectedArea(hArea);
      }
    } else if (!areaFromUrl) {
      setSelectedArea("");
    }
  }, [areaSlug, areaFromUrl]);

  // 3. Improve casing correctness based on database records
  useEffect(() => {
    if (citySlug && availableCities.length > 0) {
      const exactMatch = availableCities.find((c) => slugify(c) === citySlug);
      if (exactMatch && exactMatch !== selectedCity) {
        setSelectedCity(exactMatch);
      }
    }
  }, [citySlug, availableCities]);

  useEffect(() => {
    if (areaSlug && nearbyAreas.length > 0) {
      const exactMatch = nearbyAreas.find((a) => slugify(a) === areaSlug);
      if (exactMatch && exactMatch !== selectedArea) {
        setSelectedArea(exactMatch);
      }
    }
  }, [areaSlug, nearbyAreas]);

  // 4. Fetch dynamic SEO metadata with memory caching
  useEffect(() => {
    let isMounted = true;
    const fetchSEOMetadata = async () => {
      const cacheKey = `${selectedCity || ""}_${selectedArea || ""}`;
      if (seoCache.has(cacheKey)) {
        if (isMounted) setSeoData(seoCache.get(cacheKey));
        return;
      }

      try {
        const queryParams = new URLSearchParams();
        queryParams.append("pageKey", "our-property");
        if (selectedCity) queryParams.append("city", selectedCity);
        if (selectedArea) queryParams.append("area", selectedArea);

        const slugPath = `website/ourproperty${
          selectedCity ? "/" + slugify(selectedCity) : ""
        }${selectedArea ? "/" + slugify(selectedArea) : ""}`;
        queryParams.append("slug", slugPath);

        const response = await axios.get(
          `${getApiBase()}/api/seo/metadata?${queryParams.toString()}`
        );
        if (response.data && response.data.success && response.data.data) {
          const { metaTitle, metaDescription, metaKeywords, canonicalUrl } =
            response.data.data;
          
          const result = {
            title: metaTitle || "Our Properties | Roomhy",
            description: metaDescription || "Find verified, broker-free PGs and hostels on Roomhy.",
            keywords: metaKeywords || "pg, hostel, co-living, student housing",
            canonicalUrl: canonicalUrl || ""
          };

          seoCache.set(cacheKey, result);
          if (isMounted) setSeoData(result);
        }
      } catch (err) {
        console.warn("Failed to fetch SEO metadata:", err.message);
      }
    };

    fetchSEOMetadata();
    return () => {
      isMounted = false;
    };
  }, [selectedCity, selectedArea]);

  // 5. Mount meta tags dynamically to document head
  useHtmlPage({
    title: seoData.title,
    metas: [
      { name: "description", content: seoData.description },
      { name: "keywords", content: seoData.keywords }
    ],
    links: seoData.canonicalUrl
      ? [{ rel: "canonical", href: seoData.canonicalUrl }]
      : []
  });

  // Fetch properties and related data dynamically
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        let allProperties = [];
        let city = cityFromUrl;

        // Fast initial fetch - backend now includes nearbyColleges
        if (latitudeFromUrl && longitudeFromUrl) {
          allProperties = await searchPropertiesByLocation(
            parseFloat(latitudeFromUrl),
            parseFloat(longitudeFromUrl),
            typeFromUrl,
            50
          );
          if (allProperties.length > 0 && !city) {
            city = allProperties[0].city || allProperties[0].propertyInfo?.city;
          }
        } else {
          allProperties = await fetchProperties();
        }
        
        // Format properties — _formatProperty (in api.js) already normalized all fields.
        // This pass only extracts the shape the listing UI needs; no re-normalization.
        const formattedProperties = allProperties.map(p => ({
          id: p._id,
          name: p.name,
          city: p.city || p.propertyInfo?.city || '',
          location: p.location,
          area: p.locality || p.propertyInfo?.area || '',
          price: p.monthlyRent,
          rating: p.rating || 4.5,
          type: p.propertyType,
          gender: p.gender,
          image: p.image,
          images: p.images,
          verified: p.isVerified || true,
          owner: p.owner_name,
          beds: p.beds,
          phone: p.owner_phone,
          amenities: p.amenities || [],
          nearbyColleges: p.nearbyColleges || [],
          latitude: p.latitude,
          longitude: p.longitude,
          originalPrice: p.originalPrice || null,
        }));

        // Extract unique cities from all properties for the filter sidebar
        const cities = [...new Set(formattedProperties.map(p => p.city).filter(Boolean))].sort();
        setAvailableCities(cities);

        // Apply filters quickly
        let filtered = formattedProperties;

        if (selectedCity && selectedCity !== 'All Cities') {
          filtered = filtered.filter(p =>
            p.city?.toLowerCase() === selectedCity.toLowerCase() ||
            p.location?.toLowerCase().includes(selectedCity.toLowerCase())
          );
        }
        
        if (selectedArea) {
          filtered = filtered.filter(p => 
            p.area?.toLowerCase() === selectedArea.toLowerCase() || 
            p.locality?.toLowerCase() === selectedArea.toLowerCase()
          );
        }
        
        // Search by property name, city, area, or type
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(p => 
            p.name?.toLowerCase().includes(query) ||
            p.location?.toLowerCase().includes(query) ||
            p.area?.toLowerCase().includes(query) ||
            p.type?.toLowerCase().includes(query) ||
            p.locality?.toLowerCase().includes(query)
          );
        }
        
        if (selectedType) {
          filtered = filtered.filter(p => p.type?.toLowerCase() === selectedType.toLowerCase());
        }
        
        if (selectedGender) {
          filtered = filtered.filter(p => p.gender?.toLowerCase() === selectedGender.toLowerCase());
        }
        
        if (minPrice) {
          filtered = filtered.filter(p => p.price >= parseInt(minPrice));
        }
        
        if (maxPrice) {
          filtered = filtered.filter(p => p.price <= parseInt(maxPrice));
        }
        
        // Multi-college filter - show properties near ANY selected college
        if (selectedColleges.length > 0) {
          filtered = filtered.filter(p => {
            const propColleges = propertyNearbyColleges[p.id] || [];
            return selectedColleges.some(selectedCollege => 
              propColleges.some(college => 
                college.toLowerCase().includes(selectedCollege.toLowerCase()) ||
                selectedCollege.toLowerCase().includes(college.toLowerCase())
              )
            );
          });
        }
        
        // Apply sort
        if (sortBy === 'Price: Low to High') {
          filtered = [...filtered].sort((a, b) => a.price - b.price);
        } else if (sortBy === 'Price: High to Low') {
          filtered = [...filtered].sort((a, b) => b.price - a.price);
        } else if (sortBy === 'Newest First') {
          filtered = [...filtered].sort((a, b) => (b.id > a.id ? 1 : -1));
        }

        // Store all filtered properties for pagination
        setTotalProperties(filtered);

        // Fix: Use the filtered length for accurate pagination counts
        setTotalCount(filtered.length);

        // Extract colleges from ALL filtered properties (not just current page)
        const collegesByProperty = {};
        const allCollegesSet = new Set();

        filtered.forEach(prop => {
          if (prop.nearbyColleges && prop.nearbyColleges.length > 0) {
            collegesByProperty[prop.id] = prop.nearbyColleges.map(c => c.name || c);
            prop.nearbyColleges.forEach(c => allCollegesSet.add(c.name || c));
          }
        });

        setPropertyNearbyColleges(collegesByProperty);
        setAllColleges(Array.from(allCollegesSet).sort());

        // Get current page properties
        const indexOfLastProperty = currentPage * propertiesPerPage;
        const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
        const currentProperties = filtered.slice(indexOfFirstProperty, indexOfLastProperty);
        
        // Show properties immediately with colleges from backend
        setProperties(currentProperties);
        
        // Get price range quickly
        if (filtered.length > 0) {
          const prices = filtered.map(p => p.price);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
          setPriceRange({ min, max, average, count: filtered.length });
        }

        // Fetch additional data in background
        if (city) {
          setTimeout(async () => {
            try {
              const areas = await getNearbyAreas(
                parseFloat(latitudeFromUrl) || 0,
                parseFloat(longitudeFromUrl) || 0,
                city
              );
              setNearbyAreas(areas);

              const insts = await getInstitutions(city);
              setInstitutions(insts);
            } catch (err) {
              console.error('Background data fetch failed:', err);
            }
          }, 200);
        }

        // Get price range for property type in background
        if (typeFromUrl) {
          setTimeout(async () => {
            try {
              const range = await getPriceRangeByType(typeFromUrl);
              setPriceRange(range);
            } catch (err) {
              console.error('Price range fetch failed:', err);
            }
          }, 300);
        }

      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [typeFromUrl, cityFromUrl, searchFromUrl, latitudeFromUrl, longitudeFromUrl, currentPage, selectedCity, selectedType, selectedGender, minPrice, maxPrice, selectedRatings, selectedColleges, sortBy]);


  // Pagination handlers
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Don't clear cache when changing pages - we want to keep it!
  };

  const totalPages = Math.ceil(totalProperties.length / propertiesPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCity, selectedType, selectedGender, minPrice, maxPrice, selectedRatings, selectedColleges, searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      <WebsiteNavbar />

      <main className="min-h-screen">
{/* --- COMPACT & STYLISH PROPERTIES HEADER --- */}
{isSectionVisible('our-property-hero') && (() => {
  const heroContent = getSectionContent('our-property-hero', {
    title: 'Our Properties',
    titleAccent: 'Properties',
    subtitle: 'Find PGs, Hostels, and Co-living spaces directly without brokers.'
  });
  return (
<div className="relative w-full py-1 md:py-4 px-4 md:px-6 overflow-hidden border-b border-stone-200/50" 
     style={{
       background: 'linear-gradient(135deg, #FFFAF5 0%, #FDFCFB 50%, #F5F7FA 100%)'
     }}>
  
  {/* Background Pattern - Subtle Overlay */}
  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
       style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
  </div>

  <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
    
    {/* MAIN HEADING */}
    <div className="flex items-center gap-4 mb-1">
      <div className="h-[1px] w-6 bg-[#C5A059]/40 hidden md:block"></div>
      <h1 className="text-xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
        {heroContent.title.replace(heroContent.titleAccent || '', '').trim()}{' '}
        <span className="text-[#C5A059] font-serif italic font-medium">{heroContent.titleAccent || ''}</span>
      </h1>
      <div className="h-[1px] w-6 bg-[#C5A059]/40 hidden md:block"></div>
    </div>

    {/* Total Properties Count */}
    <div className="mt-1 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-[#C5A059]/20 inline-flex items-center gap-2">
      <span className="text-[11px] md:text-sm font-semibold text-[#1A1A1A]">
        {totalCount > 0 ? totalCount : (totalProperties.length > 0 ? totalProperties.length : 'Loading...')} Properties
      </span>
    </div>

    {/* Bottom Accent Dot */}
    <div className="mt-2 w-1 h-1 rounded-full bg-[#C5A059]/30 md:block hidden"></div>
  </div>
</div>
  );
})()}

        <section className="pt-1 pb-4 md:pt-0 md:pb-8 bg-white md:bg-[#F3F5F9] px-3 md:px-0">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-0">
            {/* Mobile Filter & Sort Trigger */}
            <div className="lg:hidden flex items-center justify-between gap-2 mb-4">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 text-gray-700 font-medium"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {(selectedCity || selectedType || minPrice || maxPrice) && (
                  <span className="ml-1 w-2 h-2 bg-[#1ab64f] rounded-full"></span>
                )}
              </button>
              
              {/* Custom Sort Dropdown */}
              <div className="flex-1 relative">
                <button 
                  onClick={() => setShowSort(!showSort)}
                  className="w-full flex items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 text-gray-700 font-medium"
                >
                  <span className="truncate">Sort: {sortBy}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                </button>
                
                {showSort && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1 animate-in">
                    {['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest First'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setShowSort(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${sortBy === option ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-700'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
              {/* Left Sidebar - Filters - Desktop: Always visible, Mobile: Overlay */}
              {/* Mobile Filter Overlay Backdrop */}
              {mobileFilterOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setMobileFilterOpen(false)}
                />
              )}

              <aside className={`
                lg:w-[350px] flex-shrink-0
                lg:static lg:block
                fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out
                ${mobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              `}>
                <div className="bg-white lg:pl-10 lg:pr-5 h-full lg:h-auto lg:sticky lg:top-24 lg:max-h-none lg:overflow-visible w-[300px] lg:w-auto overflow-y-auto lg:rounded-none lg:shadow-none lg:border-0 lg:border-r lg:border-gray-200">
                  {/* Mobile Filter Header - UNTOUCHED */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 lg:hidden">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Filter className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Filters</h3>
                        <p className="text-xs text-gray-500">Refine your search</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileFilterOpen(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Desktop Filter Header - OYO STYLE */}
                  <div className="hidden lg:flex items-center justify-between py-4 border-b border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900">Filters</h3>
                    <button onClick={() => { setSelectedCity(''); setSelectedType(''); setSelectedGender(''); setMinPrice(''); setMaxPrice(''); setSelectedColleges([]); }} className="text-[#EE2A24] text-xs font-bold hover:underline">Clear All</button>
                  </div>

                  {/* Location Filter - OYO CHECKBOX STYLE */}
                  <div className="py-6 border-b border-gray-100">
                    <label className="block text-sm font-bold text-gray-900 mb-4">Location</label>
                    <div className="space-y-4">
                      {(availableCities.length > 0 ? availableCities : ['Kota', 'Sikar', 'Indore']).map(city => (
                        <label key={city} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedCity === city}
                              onChange={() => setSelectedCity(selectedCity === city ? '' : city)}
                              className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded checked:bg-white checked:border-[#EE2A24] transition-all cursor-pointer"
                            />
                            <div className="absolute w-2.5 h-2.5 bg-[#EE2A24] rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{city}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Budget Filter - Interactive Dual Range */}
                  <div className="py-6 border-b border-gray-100">
                    <label className="block text-sm font-bold text-gray-900 mb-6">Price</label>
                    <div className="px-2">
                      <div className="relative h-1 bg-gray-200 rounded-full mb-6">
                        <div
                          className="absolute h-full bg-[#EE2A24] rounded-full"
                          style={{
                            left: `${((parseInt(minPrice) || 0) / 50000) * 100}%`,
                            right: `${100 - ((parseInt(maxPrice) || 50000) / 50000) * 100}%`
                          }}
                        ></div>
                        <input
                          type="range"
                          min="0"
                          max="50000"
                          step="500"
                          value={parseInt(minPrice) || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val < (parseInt(maxPrice) || 50000)) {
                              setMinPrice(val === 0 ? '' : String(val));
                            }
                          }}
                          className="price-range-input"
                          style={{ zIndex: (parseInt(minPrice) || 0) > 45000 ? 5 : 3 }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="50000"
                          step="500"
                          value={parseInt(maxPrice) || 50000}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val > (parseInt(minPrice) || 0)) {
                              setMaxPrice(val === 50000 ? '' : String(val));
                            }
                          }}
                          className="price-range-input"
                          style={{ zIndex: 4 }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-bold text-gray-900">
                        <span>₹{(parseInt(minPrice) || 0).toLocaleString()}</span>
                        <span>₹{(parseInt(maxPrice) || 50000).toLocaleString()}{!maxPrice ? '+' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Property Type - OYO CHECKBOX STYLE */}
                  <div className="py-6 border-b border-gray-100">
                    <label className="block text-sm font-bold text-gray-900 mb-4">Property Type</label>
                    <div className="space-y-4">
                      {['PG', 'Hostel', 'Apartment', 'Co-living'].map(type => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={selectedType === type} 
                              onChange={() => setSelectedType(selectedType === type ? '' : type)} 
                              className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded checked:bg-white checked:border-[#EE2A24] transition-all cursor-pointer" 
                            />
                            <div className="absolute w-2.5 h-2.5 bg-[#EE2A24] rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{type}s</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Gender Filter - OYO CHECKBOX STYLE */}
                  <div className="py-6 border-b border-gray-100">
                    <label className="block text-sm font-bold text-gray-900 mb-4">Categories</label>
                    <div className="space-y-4">
                      {['Male', 'Female', 'Co-ed'].map(gender => (
                        <label key={gender} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={selectedGender === gender} 
                              onChange={() => setSelectedGender(selectedGender === gender ? '' : gender)} 
                              className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded checked:bg-white checked:border-[#EE2A24] transition-all cursor-pointer" 
                            />
                            <div className="absolute w-2.5 h-2.5 bg-[#EE2A24] rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{gender}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Colleges Section - OYO STYLE */}
                  <div className="py-6">
                    <label className="block text-sm font-bold text-gray-900 mb-4">Nearby Colleges</label>
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {allColleges.slice(0, 10).map((college, idx) => (
                          <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={selectedColleges.includes(college)}
                                onChange={() => {
                                  if (selectedColleges.includes(college)) {
                                    setSelectedColleges(selectedColleges.filter(c => c !== college));
                                  } else {
                                    setSelectedColleges([...selectedColleges, college]);
                                  }
                                }}
                                className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded checked:bg-white checked:border-[#EE2A24] transition-all"
                              />
                              <div className="absolute w-2.5 h-2.5 bg-[#EE2A24] rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 truncate">{college}</span>
                          </label>
                        ))}
                      </div>
                  </div>

                  {/* Price Range Info */}
                  {priceRange.count > 0 && (
                    <div className="py-6 border-t border-gray-100">
                      <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#EE2A24]" />
                        Price Summary
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between pb-2 border-b border-gray-50">
                          <span className="text-gray-500 font-medium">Starting from</span>
                          <span className="font-bold text-gray-900">₹{priceRange.min.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-gray-50">
                          <span className="text-gray-500 font-medium">Average price</span>
                          <span className="font-bold text-[#EE2A24]">₹{priceRange.average.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium italic">Based on {priceRange.count} verified listings</p>
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {/* Right Content - Properties */}
              <div className="flex-1">
                <div className="flex items-center justify-between md:mb-4 mb-0">
                  <div className="hidden md:block text-sm text-gray-600">
                    Showing {((currentPage - 1) * propertiesPerPage) + 1} to {Math.min(currentPage * propertiesPerPage, totalCount)} of {totalCount} properties
                  </div>
                  {/* Desktop Custom Sort */}
                  <div className="hidden md:block relative min-w-[200px]">
                    <button 
                      onClick={() => setShowSort(!showSort)}
                      className="w-full flex items-center justify-between gap-3 bg-white px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
                    >
                      <span>Sort by: {sortBy}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showSort && (
                      <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1 animate-in">
                        {['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest First'].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSortBy(option);
                              setShowSort(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${sortBy === option ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-700'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-0 md:gap-1.5 bg-gray-100 md:bg-transparent pb-16 md:pb-0">
                  {loading ? (
                    // Skeleton Loaders while loading
                    <>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse flex flex-col md:flex-row">
                          <div className="w-full md:w-[400px] lg:w-[500px] h-48 bg-gray-300"></div>
                          <div className="flex-1 p-5">
                            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
                            <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
                            <div className="h-10 bg-gray-300 rounded mt-4 w-32"></div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : properties.length > 0 ? (
                    <>
                      {properties.map((property) => (
                        <PropertyCard 
                          key={property.id} 
                          property={property} 
                          nearbyColleges={propertyNearbyColleges[property.id]} 
                          onBookNow={() => {
                            setSelectedPropertyForDirectBook(property);
                            setShowDirectBookingModal(true);
                          }}
                        />
                      ))}
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="col-span-full flex justify-center items-center gap-1.5 md:gap-2 mt-6 md:mt-8 flex-wrap">
                          <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-2.5 md:px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1 text-sm"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden md:inline">Previous</span>
                          </button>
                          
                          <div className="flex gap-1">
                            {/* Mobile: Show limited pages with ellipsis */}
                            <div className="md:hidden flex gap-1">
                              {(() => {
                                const pages = [];
                                const maxVisible = 5;
                                
                                if (totalPages <= maxVisible) {
                                  // Show all pages if less than maxVisible
                                  for (let i = 1; i <= totalPages; i++) {
                                    pages.push(i);
                                  }
                                } else {
                                  // Show first, last, and pages around current
                                  if (currentPage <= 3) {
                                    for (let i = 1; i <= 4; i++) {
                                      pages.push(i);
                                    }
                                    pages.push('...');
                                    pages.push(totalPages);
                                  } else if (currentPage >= totalPages - 2) {
                                    pages.push(1);
                                    pages.push('...');
                                    for (let i = totalPages - 3; i <= totalPages; i++) {
                                      pages.push(i);
                                    }
                                  } else {
                                    pages.push(1);
                                    pages.push('...');
                                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                                      pages.push(i);
                                    }
                                    pages.push('...');
                                    pages.push(totalPages);
                                  }
                                }
                                
                                return pages.map((page, index) => {
                                  if (page === '...') {
                                    return (
                                      <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-gray-500">
                                        ...
                                      </span>
                                    );
                                  }
                                  
                                  return (
                                    <button
                                      key={page}
                                      onClick={() => paginate(page)}
                                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                        currentPage === page
                                          ? 'bg-teal-500 text-white'
                                          : 'border border-gray-300 hover:bg-gray-50'
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                            
                            {/* Desktop: Show all pages */}
                            <div className="hidden md:flex gap-1">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                                <button
                                  key={pageNumber}
                                  onClick={() => paginate(pageNumber)}
                                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                    currentPage === pageNumber
                                      ? 'bg-teal-500 text-white'
                                      : 'border border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNumber}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-2.5 md:px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1 text-sm"
                          >
                            <span className="hidden md:inline">Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Home className="w-16 h-16 text-gray-300 mb-4" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Properties Found</h3>
                      <p className="text-gray-600 mb-6">Try adjusting your search filters or explore all properties</p>
                      <a href="/website/ourproperty" className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold">
                        View All Properties
                      </a>
                    </div>
                  )}
                </div>

                
              </div>
            </div>
          </div>
        </section>
      </main>

      <WebsiteFooter />

      <MobileBottomNav />

      {/* Fast Bidding Modal */}
      <FastBiddingModal 
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        initialData={selectedPropertyForBid ? {
          city: selectedPropertyForBid.location,
          area: selectedPropertyForBid.area,
          property_id: selectedPropertyForBid.id,
          property_name: selectedPropertyForBid.name,
          priceRange: `Around ${selectedPropertyForBid.price}`,
          gender: selectedPropertyForBid.gender
        } : {
          city: selectedCity,
          area: selectedArea,
          priceRange: (minPrice || maxPrice) ? (maxPrice ? `Less than ${maxPrice}` : `More than ${minPrice}`) : '',
          gender: selectedGender || 'Any'
        }}
      />

      {/* Direct Quick Booking Confirmation Modal */}
      <QuickBookingModal 
        property={selectedPropertyForDirectBook}
        isOpen={showDirectBookingModal}
        onClose={() => setShowDirectBookingModal(false)}
        onSubmit={handleDirectBookingSubmit}
      />
    </div>
  );
}

// Inject Cloudinary transforms. Non-Cloudinary URLs pass through unchanged.
function getOptimizedImageUrl(url, width = 800) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

// Property Card Component - OYO Style
function PropertyCard({ property, onBookNow }) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all images from property
  const allImages = property.images || property.photos || property.propertyInfo?.photos || [property.image];
  const displayImages = allImages.length > 0 ? allImages : ['https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600'];
  
  // Check if there is an actual discount
  const hasDiscount = property.originalPrice && Number(property.originalPrice) > Number(property.price);
  const originalPrice = hasDiscount ? Number(property.originalPrice) : property.price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - property.price) / originalPrice) * 100) : 0;

  const amenityNames = (property.amenities || [])
    .map(a => (typeof a === 'string' ? a : a?.name || ''))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all border border-gray-200 hover:border-[#CFE0FF] overflow-hidden mb-0 md:mb-4 lg:h-[185px]">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Desktop OYO-style Image Section */}
        <div className="hidden lg:flex w-[280px] h-full flex-shrink-0 relative border-r border-gray-100">
          <div className="flex-1 overflow-hidden relative group">
            <img
              src={getOptimizedImageUrl(displayImages[currentImageIndex], 280)}
              alt={property.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              width="280"
              height="185"
            />
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              Verified
            </div>
          </div>
          
          {/* Vertical Thumbnails */}
          <div className="w-[65px] flex flex-col gap-0.5 p-0.5 bg-gray-50 border-l border-gray-100 h-full overflow-hidden">
            {displayImages.slice(1, 4).map((img, idx) => (
              <div 
                key={idx} 
                className={`flex-1 overflow-hidden cursor-pointer rounded-sm transition-all border ${currentImageIndex === idx + 1 ? 'border-[#EE2A24]' : 'border-transparent'}`}
                onMouseEnter={() => setCurrentImageIndex(idx + 1)}
              >
                <img src={getOptimizedImageUrl(img, 65)} alt="thumb" className="w-full h-full object-cover" loading="lazy" width="65" height="60" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile image strip - UNTOUCHED */}
        <div className="relative w-full lg:hidden group">
          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-[145px] gap-2 p-2">
            {displayImages.map((img, idx) => (
              <div key={idx} className="flex-shrink-0 w-[48%] h-full snap-start rounded-md overflow-hidden">
                <img
                  src={getOptimizedImageUrl(img, 400)}
                  alt={`${property.name} ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  width="200"
                  height="145"
                />
              </div>
            ))}
          </div>
          <div className="absolute bottom-3 left-3 bg-white/95 text-gray-900 px-2 py-1 rounded-md shadow-sm flex items-center gap-1 z-10 border border-gray-100">
            <Star className="w-3.5 h-3.5 text-black fill-black" />
            <span className="text-xs font-bold">{property.rating}</span>
          </div>
        </div>

        {/* Mobile details - UNTOUCHED */}
        <Link 
          to={`/website/property-details/${property.id}`} 
          className="lg:hidden px-3 pb-3"
          onClick={() => {
            trackPropertyClick(property.id);
          }}
        >
          <h3 className="font-bold text-[16px] text-gray-900 leading-tight mb-0.5 truncate">{property.name}</h3>
          <p className="text-gray-500 text-[12px] mb-1 font-medium">
            {property.area && `${property.area}, `}{property.location}
          </p>
          <div className="flex items-center gap-1 text-[#d48900] text-[11px] font-bold mb-1">
            <Zap className="w-2.5 h-2.5 fill-[#d48900]" />
            <span className="uppercase tracking-tight">Highly Rated Property</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] leading-none font-extrabold text-gray-950">₹{property.price?.toLocaleString()}</span>
            {hasDiscount && (
              <>
                <span className="text-[13px] text-gray-400 font-medium line-through">₹{originalPrice.toLocaleString()}</span>
                <span className="text-[14px] font-bold text-[#1ab64f]">{discountPercent}% off</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">+ taxes & fees</p>
        </Link>

        {/* Desktop Content Area - HIDDEN ON MOBILE */}
        <div className="hidden lg:flex flex-1 min-w-0 flex-col lg:flex-row h-full">
          {/* Main Info Section */}
          <Link 
            to={`/website/property-details/${property.id}`} 
            className="flex-1 p-3.5 flex flex-col justify-between"
            onClick={() => {
              trackPropertyClick(property.id);
            }}
          >
            <div className="space-y-1.5">
              <div className="flex justify-between items-start">
                 <h3 className="text-xl font-extrabold text-gray-900 leading-tight line-clamp-1 group-hover:text-[#EE2A24] transition-colors">{property.name}</h3>
                 <div className="bg-[#1AB64F] text-white px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-bold shadow-sm">
                   {property.rating || '4.5'} <Star className="w-3 h-3 fill-white" />
                 </div>
              </div>
              <p className="text-sm text-gray-500 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {property.area && `${property.area}, `}{property.location}
              </p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-600 font-medium py-1">
                {property.amenities && property.amenities.length > 0 ? (
                  property.amenities.slice(0, 4).map((amenity, idx) => {
                    // Dynamic Icon Mapping
                    const getIcon = (iconName) => {
                      if (!iconName) return Check;
                      
                      const lowerName = iconName.toLowerCase();
                      
                      // Manual aliases for common terms
                      const aliases = {
                        ac: 'Wind',
                        food: 'Utensils',
                        gym: 'Dumbbell',
                        parking: 'Car',
                        powerbackup: 'Zap',
                        laundry: 'Shirt',
                        water: 'Droplets'
                      };
                      
                      const targetName = aliases[lowerName] || iconName;
                      
                      // Convert to PascalCase (e.g. "power-backup" -> "PowerBackup")
                      const pascalName = targetName
                        .split(/[-_ ]/)
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join('');
                        
                      return LucideIcons[pascalName] || LucideIcons[targetName] || Check;
                    };
                    
                    const Icon = getIcon(amenity.icon);
                    
                    return (
                      <div key={idx} className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                        <span>{amenity.name}</span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="flex items-center gap-1.5"><Tv className="w-3.5 h-3.5 text-gray-400" /> <span>TV</span></div>
                    <div className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-gray-400" /> <span>Wifi</span></div>
                    <div className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-gray-400" /> <span>AC</span></div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#EE2A24] bg-[#EE2A24]/5 px-2 py-1 rounded border border-[#EE2A24]/10">
                  {property.gender}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                  {property.type}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                  Premium
                </span>
              </div>
            </div>
            
            {/* Added extra info to fill space */}
            <div className="mt-auto pt-3 border-t border-gray-100/60">
              <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500">
                <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#1AB64F]" /> No Brokerage</div>
                <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#1AB64F]" /> Instant Booking</div>
              </div>
            </div>
          </Link>

          {/* Pricing & Actions Section - Far Right */}
          <div className="w-full lg:w-[210px] flex flex-col items-end justify-between border-l border-gray-100 p-4 bg-gray-50/30">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-2">
                {hasDiscount && <span className="text-xs text-gray-400 line-through font-medium">₹{originalPrice.toLocaleString()}</span>}
                <div className="text-2xl font-black text-gray-900 tracking-tight">₹{property.price?.toLocaleString()}</div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                {hasDiscount && <div className="text-xs font-bold text-[#1AB64F] bg-[#E8F7EE] px-1.5 py-0.5 rounded">{discountPercent}% off</div>}
                <p className="text-[10px] text-gray-400 font-medium">+ taxes & fees</p>
              </div>
            </div>

            <div className="flex gap-2 w-full mt-2">
              <button 
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  trackPropertyClick(property.id);
                  navigate(`/website/property-details/${property.id}`); 
                }}
                className="flex-1 py-2 border border-gray-900 text-gray-900 font-bold rounded hover:bg-gray-50 text-[10px] transition-all whitespace-nowrap"
              >
                View details
              </button>
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  if (onBookNow) onBookNow();
                }}
                className="flex-1 py-2 bg-[#EE4266] text-white font-bold rounded text-[10px] hover:bg-[#d63a5b] transition-all shadow-sm whitespace-nowrap"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
