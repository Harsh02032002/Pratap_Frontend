import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import * as LucideIcons from "lucide-react";
const { Filter, MapPin, Wallet, Home, Users, TrendingUp, Send, RefreshCw, ChevronLeft, ChevronRight, Building2, BookOpen, Star, Check, Phone, Wifi, Utensils, Car, Dumbbell, Tv, Wind, Droplets, Zap, X, Menu, Heart, ChevronDown, Clock, Shirt, Cctv, Video, Waves, Fan, Shield } = LucideIcons;
import { useState, useEffect, useRef } from "react";
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

const cityAreasMap = {
  'Kota': ['Talwandi', 'Vigyan Nagar', 'Landmark City', 'Rajeev Gandhi Nagar', 'Indra Vihar', 'Mahaveer Nagar', 'Kunhari', 'Dadabari', 'Gumanpura'],
  'Sikar': ['Piprali Road', 'Subhash Chowk', 'Station Road', 'Nawalgarh Road', 'Katrathal'],
  'Indore': ['Vijay Nagar', 'Bhawar Kuan', 'Rajwada', 'Palasia', 'LIG Colony', 'Geeta Bhawan'],
  'Jaipur': ['Malviya Nagar', 'Vaishali Nagar', 'Raja Park', 'Mansarovar', 'Tonk Road', 'Jagatpura', 'Gopalpura Bypass'],
  'Delhi': ['Laxmi Nagar', 'Mukherjee Nagar', 'GTB Nagar', 'Satya Niketan', 'Karol Bagh', 'North Campus', 'South Campus'],
  'Bhopal': ['MP Nagar', 'Arera Colony', 'Indrapuri', 'Kolar Road', 'Shahpura'],
  'Bangalore': ['Koramangala', 'HSR Layout', 'Indiranagar', 'BTM Layout', 'Whitefield', 'Electronic City'],
  'Pune': ['Kothrud', 'Viman Nagar', 'Hinjewadi', 'Baner', 'Wakad', 'Hadapsar']
};

export default function OurPropertyPage() {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { city: citySlug, area: areaSlug } = useParams();
  const navigate = useNavigate();

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

  const humanizeSlug = (s) => {
    if (!s) return "";
    return s
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const parseLocationFromPath = (path) => {
    const clean = (path || '').replace(/^\/+|\/+$/g, '').toLowerCase();
    if (!clean || clean.includes('xml') || clean.includes('sitemap') || clean.includes('admin')) {
      return null;
    }
    const knownCities = [
      'kota', 'jaipur', 'delhi', 'indore', 'bhopal',
      'nagpur', 'sikar', 'bangalore', 'bengaluru', 'pune', 'hyderabad',
      'mumbai', 'chennai', 'ahmedabad', 'lucknow', 'chandigarh', 'noida', 'gurugram'
    ];

    // 1. Check /{type}-in-{locationSlug} (e.g. pg-in-talwandi-kota)
    const seoMatch = clean.match(/^(pg|hostels|hostel|co-living|coliving|apartments|apartment|properties|property)-in-(.+)$/i);
    if (seoMatch) {
      const locPart = seoMatch[2].toLowerCase();
      if (locPart.includes('sitemap') || locPart.includes('xml')) {
        return null;
      }

      const rawType = seoMatch[1].toLowerCase();
      let type = 'PG';
      if (rawType.startsWith('hostel')) type = 'Hostel';
      else if (rawType.includes('coliving') || rawType.includes('co-living')) type = 'Co-living';
      else if (rawType.startsWith('apartment')) type = 'Apartment';
      else if (rawType.startsWith('propert')) type = '';

      const matchedCity = knownCities.find(c => locPart.endsWith('-' + c) || locPart === c);
      let city = '';
      let area = '';

      if (matchedCity) {
        city = matchedCity.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (locPart !== matchedCity) {
          const areaPart = locPart.slice(0, locPart.length - matchedCity.length - 1);
          area = areaPart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      } else {
        const parts = locPart.split('-');
        if (parts.length >= 2) {
          city = parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
          area = parts.slice(0, parts.length - 1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else {
          city = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        }
      }
      return { type, city, area };
    }

    // 2. Check /{type}/:city or /{type}/:city/:area (e.g. /pg/kota, /pg/kota/talwandi)
    const typePrefixes = ['pg', 'hostels', 'hostel', 'co-living', 'coliving', 'apartments', 'apartment', 'property', 'properties'];
    const parts = clean.split('/');

    if (parts.length >= 2 && typePrefixes.includes(parts[0].toLowerCase())) {
      const rawType = parts[0].toLowerCase();
      let type = 'PG';
      if (rawType.startsWith('hostel')) type = 'Hostel';
      else if (rawType.includes('coliving') || rawType.includes('co-living')) type = 'Co-living';
      else if (rawType.startsWith('apartment')) type = 'Apartment';
      else if (rawType.startsWith('propert')) type = '';

      const city = parts[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const area = parts[2] ? parts[2].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
      return { type, city, area };
    }

    // 3. Check general city or area routes: /:city or /:city/:area (e.g. /kota, /kota/talwandi)
    if (parts.length === 1 && knownCities.includes(parts[0].toLowerCase())) {
      const city = parts[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { type: '', city, area: '' };
    }
    if (parts.length === 2 && knownCities.includes(parts[0].toLowerCase())) {
      const city = parts[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const area = parts[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { type: '', city, area };
    }

    return null;
  };

  const parsedLoc = parseLocationFromPath(pathname);
  const getTypeFromPathname = (path) => {
    const clean = (path || '').replace(/^\/+|\/+$/g, '').toLowerCase();
    if (clean === 'pg' || clean.startsWith('pg-') || clean.startsWith('pg/')) return 'PG';
    if (clean === 'hostels' || clean.startsWith('hostels-') || clean.startsWith('hostels/')) return 'Hostel';
    if (clean === 'co-living' || clean.startsWith('co-living-') || clean.startsWith('co-living/')) return 'Co-living';
    if (clean === 'apartments' || clean.startsWith('apartments-') || clean.startsWith('apartments/')) return 'Apartment';
    return '';
  };

  const typeFromUrl = searchParams.get('type');
  const cityFromUrl = searchParams.get('city');
  const areaFromUrl = searchParams.get('area');
  const searchFromUrl = searchParams.get('search');

  const initialCity = cityFromUrl || parsedLoc?.city || (citySlug ? humanizeSlug(citySlug) : "");
  const initialArea = areaFromUrl || parsedLoc?.area || (areaSlug ? humanizeSlug(areaSlug) : "");
  const initialType = typeFromUrl || (parsedLoc ? parsedLoc.type : getTypeFromPathname(pathname)) || '';

  // Filter states
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [selectedType, setSelectedType] = useState(initialType);

  // Slider Scroll Refs & Handler
  const popularCitiesScrollRef = useRef(null);
  const popularLocalitiesScrollRef = useRef(null);

  const scrollHorizontal = (ref, direction) => {
    if (ref && ref.current) {
      const scrollAmount = 350;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Sync URL changes dynamically into filter state
  useEffect(() => {
    const loc = parseLocationFromPath(pathname);
    const c = searchParams.get('city') || loc?.city || (citySlug ? humanizeSlug(citySlug) : "");
    const a = searchParams.get('area') || loc?.area || (areaSlug ? humanizeSlug(areaSlug) : "");

    const cleanPath = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    let t = searchParams.get('type') || (loc ? loc.type : getTypeFromPathname(pathname)) || '';

    if (cleanPath === 'pg' || cleanPath.startsWith('pg-') || cleanPath.startsWith('pg/')) {
      t = 'PG';
    } else if (cleanPath === 'hostels' || cleanPath.startsWith('hostels-') || cleanPath.startsWith('hostels/')) {
      t = 'Hostel';
    } else if (cleanPath === 'co-living' || cleanPath.startsWith('co-living-') || cleanPath.startsWith('co-living/')) {
      t = 'Co-living';
    } else if (cleanPath === 'apartments' || cleanPath.startsWith('apartments-') || cleanPath.startsWith('apartments/')) {
      t = 'Apartment';
    } else if (cleanPath === 'properties') {
      t = searchParams.get('type') || '';
    }

    setSelectedCity(c);
    setSelectedArea(a);
    setSelectedType(t);
  }, [pathname, searchParams, citySlug, areaSlug]);

  // Auto Sync Browser URL bar to match selected category (e.g. /properties -> /pg when selectedType is PG)
  useEffect(() => {
    const cleanPath = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (cleanPath === 'properties' && selectedType) {
      const typeSlug = slugify(selectedType === 'PG' ? 'pg' : selectedType === 'Hostel' ? 'hostels' : selectedType === 'Co-living' ? 'co-living' : selectedType === 'Apartment' ? 'apartments' : selectedType);
      if (selectedCity && selectedArea) {
        navigate(`/${typeSlug}-in-${slugify(selectedArea)}-${slugify(selectedCity)}`, { replace: true });
      } else if (selectedCity) {
        navigate(`/${typeSlug}-in-${slugify(selectedCity)}`, { replace: true });
      } else {
        navigate(`/${typeSlug}`, { replace: true });
      }
    }
  }, [pathname, selectedType, selectedCity, selectedArea, navigate]);

  // Compute active SEO slug from location or active city/area filters
  const getActiveSeoSlug = () => {
    const cleanPath = pathname.replace(/^\/+|\/+$/g, '');

    // If pathname is already an explicit SEO route (e.g., /properties-in-kota, /pg-in-kota, /hostels-in-talwandi-kota), preserve it!
    if (cleanPath.includes('-in-')) {
      return cleanPath;
    }

    if (selectedType && selectedArea && selectedCity) {
      const typeSlug = slugify(selectedType === 'PG' ? 'pg' : selectedType === 'Hostel' ? 'hostels' : selectedType === 'Co-living' ? 'co-living' : selectedType === 'Apartment' ? 'apartments' : selectedType);
      return `${typeSlug}-in-${slugify(selectedArea)}-${slugify(selectedCity)}`;
    }
    if (selectedType && selectedCity) {
      const typeSlug = slugify(selectedType === 'PG' ? 'pg' : selectedType === 'Hostel' ? 'hostels' : selectedType === 'Co-living' ? 'co-living' : selectedType === 'Apartment' ? 'apartments' : selectedType);
      return `${typeSlug}-in-${slugify(selectedCity)}`;
    }
    if (selectedArea && selectedCity) {
      return `properties-in-${slugify(selectedArea)}-${slugify(selectedCity)}`;
    }
    if (selectedCity) {
      return `properties-in-${slugify(selectedCity)}`;
    }
    if (selectedType) {
      return slugify(selectedType === 'PG' ? 'pg' : selectedType === 'Hostel' ? 'hostels' : selectedType === 'Co-living' ? 'co-living' : selectedType === 'Apartment' ? 'apartments' : selectedType);
    }
    return 'properties';
  };

  const activeSlug = getActiveSeoSlug();
  const canonicalUrl = activeSlug === 'website/ourproperty'
    ? 'https://roomhy.com/website/ourproperty'
    : `https://roomhy.com/${activeSlug}`;

  useSEO({
    slug: activeSlug,
    pageKey: 'our-property',
    fallbackTitle: 'Browse PGs, Hostels & Co-living Spaces - Roomhy',
    canonical: canonicalUrl
  });

  const [seoData, setSeoData] = useState({});

  useEffect(() => {
    let isMounted = true;
    async function loadSeoData() {
      try {
        if (seoCache.has(activeSlug)) {
          setSeoData(seoCache.get(activeSlug) || {});
          return;
        }
        const res = await fetchJson(`/api/seo/metadata?slug=${encodeURIComponent(activeSlug)}`);
        if (isMounted && res?.success && res?.data) {
          seoCache.set(activeSlug, res.data);
          setSeoData(res.data);
        }
      } catch (e) {
        // silent fail
      }
    }
    if (activeSlug) {
      loadSeoData();
    } else {
      setSeoData({});
    }
    return () => { isMounted = false; };
  }, [activeSlug]);

  // Sync clean SEO URL to browser address bar when city or area filters change
  useEffect(() => {
    if (activeSlug && activeSlug !== 'website/ourproperty' && activeSlug !== 'our-property') {
      const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (currentPath !== activeSlug) {
        window.history.replaceState(null, '', `/${activeSlug}`);
      }
    }
  }, [activeSlug]);
  const [showFilters, setShowFilters] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
  const [allRawProperties, setAllRawProperties] = useState([]);
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
  
  const latitudeFromUrl = searchParams.get('latitude');
  const longitudeFromUrl = searchParams.get('longitude');
  
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
          id: p._id || p.id || p.visitId || '',
          name: p.name || p.property_name || p.propertyName || 'Property',
          city: p.city || p.propertyInfo?.city || '',
          location: p.location || (p.city ? (p.area ? `${p.area}, ${p.city}` : p.city) : ''),
          area: p.area || p.locality || p.propertyInfo?.area || '',
          price: p.price || p.monthlyRent || p.rent || 5000,
          rating: p.rating || 4.5,
          type: p.type || p.propertyType || p.property_type || 'PG',
          gender: p.gender || 'Co-ed',
          image: p.image || p.featuredImage || (p.images?.[0] || ''),
          images: p.images || [],
          verified: p.isVerified !== false,
          owner: p.owner || p.owner_name || 'Verified Owner',
          beds: p.beds || 1,
          phone: p.phone || p.owner_phone || '',
          amenities: p.amenities || [],
          nearbyColleges: p.nearbyColleges || [],
          latitude: p.latitude,
          longitude: p.longitude,
          originalPrice: p.originalPrice || null,
        }));

        // Extract unique cities from all properties for the filter sidebar
        setAllRawProperties(formattedProperties);
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
            p.area?.toLowerCase().includes(selectedArea.toLowerCase()) || 
            p.location?.toLowerCase().includes(selectedArea.toLowerCase())
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
          const st = selectedType.toLowerCase();
          filtered = filtered.filter(p => {
            const pt = (p.type || '').toLowerCase();
            if (st === 'pg') return pt.includes('pg') || pt.includes('guest');
            if (st === 'hostel') return pt.includes('hostel');
            if (st === 'co-living' || st === 'coliving') return pt.includes('co-living') || pt.includes('coliving');
            if (st === 'apartment' || st === 'apartments') return pt.includes('apartment') || pt.includes('flat');
            return pt.includes(st) || st.includes(pt);
          });
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
        
        // Extract colleges from ALL properties before applying college filter
        const collegesByProperty = {};
        const allCollegesSet = new Set();

        formattedProperties.forEach(prop => {
          if (Array.isArray(prop.nearbyColleges) && prop.nearbyColleges.length > 0) {
            const names = prop.nearbyColleges.map(c => (typeof c === 'string' ? c : c.name)).filter(Boolean);
            collegesByProperty[prop.id] = names;
            names.forEach(n => allCollegesSet.add(n));
          }
        });

        setPropertyNearbyColleges(collegesByProperty);
        setAllColleges(Array.from(allCollegesSet).sort());

        // Multi-college filter - show properties near ANY selected college
        if (selectedColleges.length > 0) {
          filtered = filtered.filter(p => {
            const propColleges = collegesByProperty[p.id] || [];
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
  }, [typeFromUrl, cityFromUrl, searchFromUrl, latitudeFromUrl, longitudeFromUrl, currentPage, selectedCity, selectedArea, selectedType, selectedGender, minPrice, maxPrice, selectedRatings, selectedColleges, sortBy]);


  // Pagination handlers
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Don't clear cache when changing pages - we want to keep it!
  };

  const totalPages = Math.ceil(totalProperties.length / propertiesPerPage);

  const locationDisplayName = selectedArea && selectedCity 
    ? `${selectedArea}, ${selectedCity}` 
    : (selectedCity || 'All Cities');

  const getCityStats = () => {
    const rawList = allRawProperties.length > 0 ? allRawProperties : totalProperties;
    let cityProps = rawList;

    if (selectedCity) {
      cityProps = cityProps.filter(p => 
        p.city?.toLowerCase() === selectedCity.toLowerCase() || 
        p.location?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (selectedArea) {
      const areaProps = cityProps.filter(p => 
        p.area?.toLowerCase().includes(selectedArea.toLowerCase()) || 
        p.location?.toLowerCase().includes(selectedArea.toLowerCase())
      );
      if (areaProps.length > 0) {
        cityProps = areaProps;
      }
    }

    const realPgs = cityProps.filter(p => {
      const t = (p.type || '').toLowerCase();
      return t.includes('pg') || t.includes('guest');
    }).length;

    const realHostels = cityProps.filter(p => (p.type || '').toLowerCase().includes('hostel')).length;
    const realColiving = cityProps.filter(p => {
      const t = (p.type || '').toLowerCase();
      return t.includes('co-living') || t.includes('coliving');
    }).length;
    const realApartments = cityProps.filter(p => {
      const t = (p.type || '').toLowerCase();
      return t.includes('apartment') || t.includes('flat');
    }).length;
    const realBeds = cityProps.reduce((sum, p) => sum + (parseInt(p.beds) || 1), 0);

    return {
      total: cityProps.length,
      pgs: realPgs,
      hostels: realHostels,
      coliving: realColiving,
      apartments: realApartments,
      beds: realBeds,
      students: cityProps.length > 0 ? cityProps.length * 10 : 0
    };
  };

  const cityStats = getCityStats();

  const getCityPopularAreas = () => {
    if (!selectedCity) return [];
    const normalizedKey = Object.keys(cityAreasMap).find(c => c.toLowerCase() === selectedCity.toLowerCase());
    const staticList = normalizedKey ? cityAreasMap[normalizedKey] : [];

    const dbAreas = totalProperties
      .filter(p => p.city?.toLowerCase() === selectedCity.toLowerCase())
      .map(p => p.area)
      .filter(Boolean);

    return Array.from(new Set([...staticList, ...dbAreas]));
  };

  return (
    <div className="min-h-screen bg-white">
      <WebsiteNavbar />

      <main className="min-h-screen">
{/* --- BREADCRUMBS BAR --- */}
<div className="bg-[#F8FAFC] border-b border-slate-200/80 py-1.5 px-4 md:px-8">
  <div className="max-w-7xl mx-auto flex items-center text-xs font-semibold text-slate-500 gap-2 flex-wrap">
    <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
    <Link to={selectedType ? `/${slugify(selectedType === 'PG' ? 'pg' : selectedType === 'Hostel' ? 'hostels' : selectedType === 'Co-living' ? 'co-living' : selectedType === 'Apartment' ? 'apartments' : selectedType)}` : '/properties'} className="hover:text-teal-600 transition-colors">
      {selectedType || 'Properties'}
    </Link>
    {selectedCity && (
      <>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to={`/${slugify(selectedType === 'PG' ? 'pg' : selectedType === 'Hostel' ? 'hostels' : selectedType === 'Co-living' ? 'co-living' : selectedType === 'Apartment' ? 'apartments' : 'properties')}-in-${slugify(selectedCity)}`} className="text-slate-800 font-bold hover:text-teal-600 transition-colors">
          {selectedCity}
        </Link>
      </>
    )}
    {selectedArea && (
      <>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-teal-700 font-extrabold">{selectedType || 'PG'} in {selectedArea}, {selectedCity}</span>
      </>
    )}
  </div>
</div>

{/* --- DYNAMIC HERO HEADERS (MATCHING SCREENSHOTS 1, 3, 4 & 5) --- */}
{isSectionVisible('our-property-hero') && (() => {
  const propertyTypeName = selectedType || 'PG';

  // 1. AREA LEVEL HERO HEADER (SCREENSHOT 4 & 5)
  if (selectedCity && selectedArea) {
    return (
      <div className="relative w-full py-4 md:py-4.5 px-4 md:px-8 bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/30 border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
          <div className="flex-1 text-left max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-1.5">
              {propertyTypeName} in <span className="text-teal-600 font-bold">{selectedArea}, {selectedCity}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed mb-3">
              Find verified {propertyTypeName}s in {selectedArea}, {selectedCity}. Zero Brokerage. 100% Verified.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-teal-700 text-[11px] font-extrabold shadow-xs">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                <span>Zero Brokerage</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-emerald-700 text-[11px] font-extrabold shadow-xs">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Properties</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-amber-700 text-[11px] font-extrabold shadow-xs">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Trusted by Students</span>
              </div>
            </div>
          </div>

          {/* Right side floating card for Area */}
          <div className="relative w-full md:w-[340px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 group">
            <img
              src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop"
              alt={`${selectedArea}, ${selectedCity}`}
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-white/40 shadow-sm">
              <div className="flex items-center gap-2 text-teal-600 font-extrabold text-xs mb-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedArea}, {selectedCity}</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-600 leading-tight">
                Preferred student area in {selectedCity}. Safe &amp; connected.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. CITY LEVEL HERO HEADER (SCREENSHOT 3)
  if (selectedCity && !selectedArea) {
    return (
      <div className="relative w-full py-4 md:py-4.5 px-4 md:px-8 bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/30 border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
          <div className="flex-1 text-left max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-1.5">
              {propertyTypeName} in <span className="text-teal-600 font-bold">{selectedCity}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed mb-3">
              Find verified {propertyTypeName}s in top localities of {selectedCity}. Zero Brokerage. 100% Verified.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-teal-700 text-[11px] font-extrabold shadow-xs">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                <span>Zero Brokerage</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-emerald-700 text-[11px] font-extrabold shadow-xs">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Properties</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-amber-700 text-[11px] font-extrabold shadow-xs">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Trusted by Students</span>
              </div>
            </div>
          </div>

          {/* Right side illustration / graphic for City */}
          <div className="relative w-full md:w-[360px] h-44 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=800&auto=format&fit=crop"
              alt={selectedCity}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="text-base font-black">{selectedCity} Heritage &amp; Hub</div>
              <div className="text-[10px] text-white/90 font-medium">Top verified PGs &amp; student stays.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN CATEGORY HERO HEADER OR ORIGINAL PROPERTIES HERO HEADER
  if (!selectedType && !selectedCity) {
    return (
      <div className="relative w-full py-4 md:py-5 px-4 md:px-8 bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/30 border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
          <div className="flex-1 text-left max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">
              Browse Rental Properties
            </h1>
            <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed mb-3">
              Explore verified PGs, hostels, co-living spaces and apartments across top cities. Zero Brokerage. 100% Verified.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-teal-700 text-[11px] font-extrabold shadow-xs">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                <span>Zero Brokerage</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-emerald-700 text-[11px] font-extrabold shadow-xs">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Properties</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-amber-700 text-[11px] font-extrabold shadow-xs">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Trusted by Students</span>
              </div>
            </div>
          </div>
          <div className="relative w-full md:w-[320px] h-36 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop"
              alt="Properties"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="text-base font-black">All Top Cities</div>
              <div className="text-[10px] text-white/90 font-medium">Find verified student stays near top coaching hubs.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full py-6 md:py-8 px-4 md:px-8 bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/40 border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 z-10 relative">
        <div className="flex-1 text-left max-w-2xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">
            Find the <span className="text-teal-600 font-bold">Perfect {propertyTypeName}</span> That Feels Like Home
          </h1>
          <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed mb-4">
            Discover verified {propertyTypeName}s in top cities. Choose your location, set your budget and find a stay that fits you best. Zero Brokerage. 100% Verified.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-teal-700 text-xs font-extrabold shadow-xs">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>Zero Brokerage</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-emerald-700 text-xs font-extrabold shadow-xs">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Verified Properties</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-amber-700 text-xs font-extrabold shadow-xs">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Trusted by Students</span>
            </div>
          </div>
        </div>

        {/* Right side Cozy Room Image */}
        <div className="relative w-full lg:w-[400px] h-52 md:h-56 rounded-2xl overflow-hidden shadow-lg border border-slate-200 group">
          <img
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop"
            alt="Verified Roomhy Stay"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/40 shadow-xs flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[9px]">
              <Check className="w-3 h-3" />
            </div>
            <div>
              <div className="text-[11px] font-black text-slate-900">Verified Stays</div>
              <div className="text-[9px] font-bold text-slate-500">50,000+ Students Trust Roomhy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})()}

{/* --- POPULAR CITIES FOR PGs SECTION (HORIZONTAL CAROUSEL SLIDER) --- */}
{!selectedCity && selectedType && (
  <section className="py-1.5 md:py-2 px-4 md:px-8 bg-white border-b border-slate-200">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900">Popular Cities for {selectedType || 'PG'}s</h2>
          <p className="text-[11px] text-slate-500 font-semibold">Explore top student hubs across India with zero brokerage.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scrollHorizontal(popularCitiesScrollRef, 'left')}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 flex items-center justify-center transition-all shadow-xs border border-slate-200"
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scrollHorizontal(popularCitiesScrollRef, 'right')}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 flex items-center justify-center transition-all shadow-xs border border-slate-200"
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={popularCitiesScrollRef}
        className="flex items-center gap-3 overflow-x-auto scroll-smooth scrollbar-hide py-1"
      >
        {[
          { city: 'Kota', count: '512+ PGs', image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&auto=format&fit=crop' },
          { city: 'Jaipur', count: '320+ PGs', image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=600&auto=format&fit=crop' },
          { city: 'Delhi', count: '780+ PGs', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format&fit=crop' },
          { city: 'Indore', count: '210+ PGs', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop' },
          { city: 'Bhopal', count: '190+ PGs', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop' },
          { city: 'Nagpur', count: '150+ PGs', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop' },
          { city: 'Sikar', count: '120+ PGs', image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&auto=format&fit=crop' },
          { city: 'Bangalore', count: '600+ PGs', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&auto=format&fit=crop' },
          { city: 'Pune', count: '430+ PGs', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop' },
          { city: 'Hyderabad', count: '380+ PGs', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop' },
        ].map((item) => {
          const dynamicCount = (() => {
            if (!allRawProperties || allRawProperties.length === 0) return item.count;
            const matchCount = allRawProperties.filter(p => {
              const pCity = (p.city || p.propertyInfo?.city || '').toLowerCase();
              const matchesCity = pCity === item.city.toLowerCase();
              const pType = (p.type || p.propertyType || p.property_type || '').toLowerCase();
              const targetType = (selectedType || 'PG').toLowerCase();
              const matchesType = pType === targetType || (targetType === 'pg' && pType.includes('pg'));
              return matchesCity && matchesType;
            }).length;
            return matchCount > 0 ? `${matchCount}+ ${selectedType || 'PG'}s` : item.count;
          })();

          return (
            <Link
              key={item.city}
              to={`/${slugify(selectedType || 'pg')}-in-${slugify(item.city)}`}
              className="w-[180px] sm:w-[195px] flex-shrink-0 group bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="h-20 overflow-hidden relative">
                <img
                  src={item.image}
                  alt={`${selectedType || 'PG'} in ${item.city}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
              </div>
              <div className="p-2 bg-white">
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-teal-600 transition-colors truncate">
                  {selectedType || 'PG'} in {item.city}
                </h3>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{dynamicCount}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  </section>
)}

{/* --- EXPLORE PGs BY LOCALITIES SECTION (HORIZONTAL CAROUSEL SLIDER) --- */}
{!selectedCity && selectedType && (
  <section className="py-1.5 md:py-2 px-4 md:px-8 bg-[#F8FAFC] border-b border-slate-200">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900">Explore {selectedType || 'PG'}s by Localities</h2>
          <p className="text-[11px] text-slate-500 font-semibold">Find stays right next to your coaching institute or college.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scrollHorizontal(popularLocalitiesScrollRef, 'left')}
            className="w-7 h-7 rounded-full bg-white hover:bg-teal-600 hover:text-white text-slate-700 flex items-center justify-center transition-all shadow-xs border border-slate-200"
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scrollHorizontal(popularLocalitiesScrollRef, 'right')}
            className="w-7 h-7 rounded-full bg-white hover:bg-teal-600 hover:text-white text-slate-700 flex items-center justify-center transition-all shadow-xs border border-slate-200"
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={popularLocalitiesScrollRef}
        className="flex items-center gap-3 overflow-x-auto scroll-smooth scrollbar-hide py-1"
      >
        {[
          { area: 'Talwandi', city: 'Kota', count: '102+ PGs', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop' },
          { area: 'Vigyan Nagar', city: 'Kota', count: '88+ PGs', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop' },
          { area: 'Landmark City', city: 'Kota', count: '67+ PGs', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop' },
          { area: 'Mahaveer Nagar', city: 'Kota', count: '74+ PGs', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop' },
          { area: 'Indra Vihar', city: 'Kota', count: '54+ PGs', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop' },
          { area: 'Rajeev Gandhi Nagar', city: 'Kota', count: '48+ PGs', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop' },
          { area: 'Kunhari', city: 'Kota', count: '41+ PGs', image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&auto=format&fit=crop' },
          { area: 'Pratap Nagar', city: 'Jaipur', count: '56+ PGs', image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop' },
        ].map((item) => {
          const dynamicAreaCount = (() => {
            if (!allRawProperties || allRawProperties.length === 0) return item.count;
            const matchCount = allRawProperties.filter(p => {
              const pArea = (p.area || p.locality || p.propertyInfo?.area || '').toLowerCase();
              const pCity = (p.city || p.propertyInfo?.city || '').toLowerCase();
              const matchesArea = pArea.includes(item.area.toLowerCase()) || item.area.toLowerCase().includes(pArea);
              const matchesCity = !item.city || pCity === item.city.toLowerCase();
              const pType = (p.type || p.propertyType || p.property_type || '').toLowerCase();
              const targetType = (selectedType || 'PG').toLowerCase();
              const matchesType = pType === targetType || (targetType === 'pg' && pType.includes('pg'));
              return matchesArea && matchesCity && matchesType;
            }).length;
            return matchCount > 0 ? `${matchCount}+ ${selectedType || 'PG'}s` : item.count;
          })();

          return (
            <Link
              key={item.area}
              to={`/${slugify(selectedType || 'pg')}-in-${slugify(item.area)}-${slugify(item.city)}`}
              className="w-[180px] sm:w-[195px] flex-shrink-0 group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="h-20 overflow-hidden relative">
                <img
                  src={item.image}
                  alt={`${item.area}, ${item.city}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
              </div>
              <div className="p-2">
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-teal-600 transition-colors truncate">
                  {item.area}, {item.city}
                </h3>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{dynamicAreaCount}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  </section>
)}

{/* --- CAN'T DECIDE WHICH PG IS RIGHT FOR YOU CALLBACK FORM BANNER (SCREENSHOT 2) --- */}
{!selectedCity && selectedType && (
  <section className="py-10 px-4 md:px-8 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border-b border-slate-200">
    <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-teal-100 flex flex-col lg:flex-row items-center justify-between gap-8">
      <div className="flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-800 font-extrabold text-xs rounded-full mb-3">
          <LucideIcons.Sparkles className="w-3.5 h-3.5" />
          <span>Fast Bidding &amp; Custom Help</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          Can't Decide Which {selectedType || 'PG'} is <span className="text-teal-600">Right for You?</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 max-w-lg">
          Submit your details, bid your budget, and let Roomhy find the best matching {selectedType || 'PG'} for you.
        </p>

        <div className="mt-6 flex flex-wrap gap-4 text-xs font-extrabold text-slate-700">
          <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-teal-600" /> You Bid Your Budget</div>
          <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-teal-600" /> Best Matching PGs</div>
          <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-teal-600" /> Zero Brokerage</div>
          <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-teal-600" /> 100% Verified</div>
        </div>
      </div>

      <div className="w-full lg:w-[480px] bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Thank you! Our Roomhy advisor will contact you within 15 minutes with best matching PGs.");
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Preferred City</label>
            <select className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none">
              <option value="Kota">Kota</option>
              <option value="Jaipur">Jaipur</option>
              <option value="Delhi">Delhi</option>
              <option value="Indore">Indore</option>
              <option value="Sikar">Sikar</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Budget (₹)</label>
            <input
              type="text"
              placeholder="e.g. 7000 - 9000"
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2 mt-1">
            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit &amp; Find My {selectedType || 'PG'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
)}

{/* --- WHY STUDENTS LOVE AREA FEATURE CARDS (SCREENSHOT 4 & 5) --- */}
{selectedCity && selectedArea && (
  <section className="py-2.5 md:py-3 px-4 md:px-8 bg-white border-b border-slate-200">
    <div className="max-w-7xl mx-auto">
      <div className="mb-2 text-center">
        <h2 className="text-lg md:text-xl font-black text-slate-900">Why Students Love {selectedArea}, {selectedCity}</h2>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Key highlights making {selectedArea} the top choice for students.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="p-2.5 bg-teal-50/50 rounded-xl border border-teal-100">
          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-1.5 font-bold">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-[11px] mb-0.5">Close to Major Coaching Institutes</h3>
          <p className="text-[10px] text-slate-500 font-medium leading-snug">Allen, Resonance, Career Point &amp; more within walking distance.</p>
        </div>

        <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-1.5 font-bold">
            <LucideIcons.Bus className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-[11px] mb-0.5">Excellent Connectivity</h3>
          <p className="text-[10px] text-slate-500 font-medium leading-snug">Well connected by main roads, auto-rickshaws &amp; public transport.</p>
        </div>

        <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-1.5 font-bold">
            <Utensils className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-[11px] mb-0.5">Nearby Markets &amp; Essentials</h3>
          <p className="text-[10px] text-slate-500 font-medium leading-snug">Shopping complexes, cafes, ATMs, tiffin services &amp; pharmacies.</p>
        </div>

        <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100">
          <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-1.5 font-bold">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-[11px] mb-0.5">Safe &amp; Student-Friendly</h3>
          <p className="text-[10px] text-slate-500 font-medium leading-snug">24/7 safe environment with student community culture.</p>
        </div>

        <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-1.5 font-bold">
            <Waves className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-[11px] mb-0.5">Peaceful Environment</h3>
          <p className="text-[10px] text-slate-500 font-medium leading-snug">Green spaces, quiet study surroundings &amp; fresh atmosphere.</p>
        </div>
      </div>
    </div>
  </section>
)}

{/* --- POPULAR LOCALITIES IN CITY (FOR CITY PAGE SCREENSHOT 3) --- */}
{selectedCity && !selectedArea && (
  <section className="py-8 px-4 md:px-8 bg-white border-b border-slate-200">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-black text-slate-900">Popular Localities in {selectedCity}</h2>
        <span className="text-xs font-bold text-slate-400">Choose your area</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {getCityPopularAreas().map(area => (
          <Link
            key={area}
            to={`/${slugify(selectedType || 'pg')}-in-${slugify(area)}-${slugify(selectedCity)}`}
            className="flex-shrink-0 px-4 py-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-2xl text-xs font-extrabold text-slate-800 hover:text-teal-700 transition-all flex items-center gap-2"
          >
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>{area}, {selectedCity}</span>
          </Link>
        ))}
      </div>
    </div>
  </section>
)}



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

        {/* City Statistics Bar */}
        {selectedCity && (
          <div className="bg-white border-y border-stone-200/80 py-4 px-4 shadow-2xs my-4">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-around gap-4 text-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-black text-xs">PG</div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900">{cityStats.pgs.toLocaleString()}+ PGs</div>
                  <div className="text-[11px] text-slate-500 font-medium">Verified Accommodations</div>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-black text-xs">H</div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900">{cityStats.hostels.toLocaleString()}+ Hostels</div>
                  <div className="text-[11px] text-slate-500 font-medium">Student Stays</div>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-black text-xs">CL</div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900">{cityStats.coliving.toLocaleString()}+ Co-living</div>
                  <div className="text-[11px] text-slate-500 font-medium">Shared Spaces</div>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">🛏️</div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900">{cityStats.beds.toLocaleString()}+ Beds</div>
                  <div className="text-[11px] text-slate-500 font-medium">In {locationDisplayName}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popular Areas in Selected City Visual Grid */}
        {selectedCity && getCityPopularAreas().length > 0 && (
          <section className="bg-[#F8FAFC] border-t border-slate-200 py-10 px-4 md:px-8 mt-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Popular Areas in {selectedCity}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Top localities preferred by students and professionals</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {getCityPopularAreas().map((areaName, idx) => {
                  const aSlug = slugify(areaName);
                  const cSlug = slugify(selectedCity);
                  const isSelected = selectedArea?.toLowerCase() === areaName.toLowerCase();
                  const areaImages = [
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=300&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=300&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=300&auto=format&fit=crop'
                  ];
                  const bgImg = areaImages[idx % areaImages.length];

                  const targetAreaUrl = selectedType
                    ? `/${slugify(selectedType === 'PG' ? 'pg' : selectedType === 'Hostel' ? 'hostels' : selectedType === 'Co-living' ? 'co-living' : selectedType === 'Apartment' ? 'apartments' : selectedType)}-in-${aSlug}-${cSlug}`
                    : `/properties-in-${aSlug}-${cSlug}`;

                  return (
                    <Link
                      key={areaName}
                      to={targetAreaUrl}
                      className={`group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border ${
                        isSelected ? 'ring-2 ring-teal-500 border-teal-500 font-bold' : 'border-slate-200'
                      }`}
                    >
                      <div className="h-24 overflow-hidden relative">
                        <img
                          src={bgImg}
                          alt={areaName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent"></div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-xs font-bold text-white line-clamp-1">{areaName}</div>
                          <div className="text-[10px] text-teal-300 font-medium">Top Area</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Property Owner CTA Banner */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 my-10">
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl border border-teal-700/40 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="flex-1 text-center md:text-left z-10">
              <h3 className="text-2xl md:text-3xl font-black mb-2">
                {selectedCity ? `Have a property in ${locationDisplayName}?` : 'Have a property to list?'}
              </h3>
              <p className="text-xs md:text-sm text-slate-200 max-w-xl font-medium leading-relaxed mb-4">
                List your PG, Hostel or Co-living space {selectedCity ? `in ${locationDisplayName}` : ''} and connect directly with thousands of students and working professionals.
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-teal-200">
                <span className="flex items-center gap-1"><Check className="w-4 h-4 text-teal-400" /> Zero Brokerage</span>
                <span className="flex items-center gap-1"><Check className="w-4 h-4 text-teal-400" /> Verified Tenants</span>
                <span className="flex items-center gap-1"><Check className="w-4 h-4 text-teal-400" /> Quick Rent</span>
                <span className="flex items-center gap-1"><Check className="w-4 h-4 text-teal-400" /> Wide Reach</span>
              </div>
            </div>

            <div className="z-10 flex-shrink-0">
              <Link
                to="/website/list"
                className="inline-flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-sm px-7 py-3.5 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <span>List Your Property FREE</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
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
