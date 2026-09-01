import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import * as LucideIcons from "lucide-react";
const { Filter, MapPin, Wallet, Home, Users, TrendingUp, Send, RefreshCw, ChevronLeft, ChevronRight, Building2, BookOpen, Star, Check, Phone, Wifi, Utensils, Car, Dumbbell, Tv, Wind, Droplets, Zap, X, Menu, Heart, ChevronDown, Clock, Shirt, Cctv, Video, Waves, Fan, Shield, Search, Bed } = LucideIcons;
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { fetchProperties, searchPropertiesByLocation, getNearbyAreas, getInstitutions, getPriceRangeByType, trackPropertyClick, getApiBase, fetchJson, resolvePropertyOwnerLoginId, firstNonEmptyList } from "../../utils/api";
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

// Module-level helpers accessible to all components in this file
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

const getTypeSlug = (type) => {
  if (!type) return "properties";
  const lower = type.toLowerCase();
  if (lower === "pg") return "pg";
  if (lower === "hostel" || lower === "hostels") return "hostels";
  if (lower === "co-living" || lower === "coliving") return "co-living";
  if (lower === "apartment" || lower === "apartments") return "apartments";
  return slugify(type);
};

const humanizeSlug = (s) => {
  if (!s) return "";
  return s
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function OurPropertyPage() {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { city: citySlug, area: areaSlug } = useParams();
  const navigate = useNavigate();

  const cleanPath = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const isSpecificTypeRoute = cleanPath.startsWith('pg') || cleanPath.startsWith('hostels') || cleanPath.startsWith('co-living') || cleanPath.startsWith('apartments');

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
      let type = '';
      if (rawType === 'pg' || rawType.startsWith('pg')) type = 'PG';
      else if (rawType.startsWith('hostel')) type = 'Hostel';
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
      let type = '';
      if (rawType === 'pg' || rawType.startsWith('pg')) type = 'PG';
      else if (rawType.startsWith('hostel')) type = 'Hostel';
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
    } else if (cleanPath === 'properties' || cleanPath.startsWith('properties-') || cleanPath.startsWith('properties/')) {
      t = searchParams.get('type') || '';
    }

    setSelectedCity(c);
    setSelectedArea(a);
    setSelectedType(t);
  }, [pathname, searchParams, citySlug, areaSlug]);



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

  const isBiddingMode = searchParams.get('bid') === 'true' || pathname.toLowerCase().includes('bidding');

  // Sync clean SEO URL or clean /bidding URL to browser address bar
  useEffect(() => {
    if (isBiddingMode) {
      if (window.location.pathname !== '/bidding') {
        window.history.replaceState(null, '', '/bidding');
      }
      return;
    }
    if (activeSlug && activeSlug !== 'website/ourproperty' && activeSlug !== 'our-property') {
      const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (currentPath !== activeSlug) {
        window.history.replaceState(null, '', `/${activeSlug}`);
      }
    }
  }, [activeSlug, isBiddingMode]);

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
  const [biddingSubmitting, setBiddingSubmitting] = useState(false);

  const handleDesktopBidSubmit = async () => {
    if (!isAuthenticated) {
      if (window.toast?.info) window.toast.info('Please log in to submit a bid request');
      navigate('/login');
      return;
    }
    const targetProperties = totalProperties && totalProperties.length > 0 ? totalProperties : properties;
    if (!targetProperties || targetProperties.length === 0) {
      if (window.toast?.error) window.toast.error('No properties match your current filters');
      return;
    }

    setBiddingSubmitting(true);
    try {
      const budget = parseInt(maxPrice) || 8000;
      const userId = user?.loginId || user?._id || user?.id || '';

      const bidRequests = targetProperties.slice(0, 15).map((prop, index) => {
        const propInfo = prop.propertyInfo || {};
        const propertyId = prop._id || prop.id || prop.visitId || `property-${index}`;
        const ownerId = (prop.generatedCredentials && prop.generatedCredentials.loginId) || prop.ownerLoginId || propInfo.ownerLoginId || 'admin';

        return fetchJson(`${getApiBase()}/api/bids/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            userName: user?.name || user?.firstName || 'Student',
            userPhone: user?.phone || '9999999999',
            propertyId,
            propertyName: prop.name || prop.title || 'Property',
            ownerId,
            bidAmount: budget,
            offeredAmount: budget,
            proposedPrice: budget,
            city: selectedCity || prop.city || 'Kota',
            area: selectedArea || prop.area || '',
            gender: selectedGender || 'Any',
            status: 'pending',
            createdVia: 'properties_sidebar_bidding'
          })
        }).catch(err => console.error('Bid failed for prop:', propertyId, err));
      });

      await Promise.all(bidRequests);
      setBiddingSubmitting(false);
      const count = Math.min(targetProperties.length, 15);
      if (window.toast?.success) {
        window.toast.success(`⚡ Fast Bid request sent successfully to ${count} matching properties!`);
      } else {
        alert(`⚡ Fast Bid request sent successfully to ${count} matching properties!`);
      }
    } catch (err) {
      setBiddingSubmitting(false);
      console.error('Bidding error:', err);
    }
  };

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
    const ownerId = resolvePropertyOwnerLoginId(targetProp);
    // An unattached booking is invisible in every owner panel, so refuse it.
    if (!ownerId) {
      throw new Error('This property has no owner assigned yet, so the request cannot be sent. Please contact Roomhy support.');
    }

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
          rating: p.rating || p.propertyInfo?.rating || null,
          type: p.type || p.propertyType || p.property_type || 'PG',
          gender: p.gender || 'Co-ed',
          category: p.propertyCategory || '',
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
          const limit = parseInt(maxPrice);
          const allowedLimit = isBiddingMode ? (limit + 3000) : limit;
          filtered = filtered.filter(p => p.price <= allowedLimit);
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
    <Link to={selectedType ? `/${getTypeSlug(selectedType)}` : '/properties'} className="hover:text-teal-600 transition-colors">
      {selectedType || 'Properties'}
    </Link>
    {selectedCity && (
      <>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to={`/${getTypeSlug(selectedType)}-in-${slugify(selectedCity)}`} className="text-slate-800 font-bold hover:text-teal-600 transition-colors">
          {selectedCity}
        </Link>
      </>
    )}
    {selectedArea && (
      <>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-teal-700 font-extrabold">{selectedType ? `${selectedType} in ` : 'Properties in '}{selectedArea}, {selectedCity}</span>
      </>
    )}
  </div>
</div>

{/* --- DYNAMIC HERO HEADERS & DECORATIVE CAROUSELS (HIDDEN WHEN IN BIDDING MODE) --- */}
{!isBiddingMode && (
  <>
    {isSectionVisible('our-property-hero') && (() => {
  const displayTypeHeading = selectedType ? `${selectedType} in ` : 'Properties in ';
  const propertyTypeName = selectedType || 'Properties';
  const propertyTypePlural = selectedType
    ? (selectedType === 'PG' ? 'PGs' : selectedType === 'Hostel' ? 'Hostels' : selectedType === 'Co-living' ? 'Co-living Spaces' : selectedType === 'Apartment' ? 'Apartments' : `${selectedType}s`)
    : 'PGs, Hostels & Flats';

  // 1. AREA LEVEL HERO HEADER (SCREENSHOT 4 & 5)
  if (selectedCity && selectedArea) {
    return (
      <div className="relative w-full py-3 md:py-4 px-4 md:px-8 bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/30 border-b border-slate-200 overflow-hidden">
        <div className="max-w-[1550px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
          <div className="flex-1 text-left max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-1.5">
              {displayTypeHeading}<span className="text-teal-600 font-bold">{selectedArea}, {selectedCity}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed mb-3">
              Find verified {propertyTypePlural} in {selectedArea}, {selectedCity}. Zero Brokerage. 100% Verified.
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

          {/* Right side floating card for Area - HIDDEN ON MOBILE */}
          <div className="hidden md:block relative w-full md:w-[340px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 group">
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

  // 2. CITY LEVEL HERO HEADER (SCREENSHOT 1)
  if (selectedCity && !selectedArea) {
    const cityTitlePrefix = selectedType ? (selectedType === 'PG' ? 'PGs' : selectedType === 'Hostel' ? 'Hostels' : selectedType === 'Co-living' ? 'Co-living Spaces' : selectedType === 'Apartment' ? 'Apartments' : `${selectedType}s`) : 'Properties';
    const citySubtext = selectedType
      ? `Find verified ${selectedType}s in ${selectedCity}. Zero Brokerage. 100% Verified.`
      : `Find verified PGs, Hostels, Co-living spaces and Apartments in ${selectedCity}. Zero Brokerage. 100% Verified.`;

    return (
      <div className="relative w-full py-3 md:py-5 px-4 md:px-8 bg-gradient-to-r from-slate-50 via-white to-teal-50/40 border-b border-slate-200 overflow-hidden">
        <div className="max-w-[1550px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
          <div className="flex-1 text-left max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-2">
              {cityTitlePrefix} in <span className="text-teal-600 font-bold">{selectedCity}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed mb-4">
              {citySubtext}
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

          {/* Right side floating graphic for City (Screenshot 1) - HIDDEN ON MOBILE */}
          <div className="hidden md:block relative w-full md:w-[380px] h-48 rounded-2xl overflow-hidden shadow-xl border border-slate-200 group">
            <img
              src="https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=800&auto=format&fit=crop"
              alt={selectedCity}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-white/50 shadow-md max-w-[220px]">
              <div className="flex items-center gap-1.5 text-teal-600 font-extrabold text-xs mb-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedCity}, Rajasthan</span>
              </div>
              <p className="text-[11px] font-black text-slate-800">25,000+ Students</p>
              <p className="text-[9px] font-semibold text-slate-500">Trust Roomhy in {selectedCity}</p>
              <div className="flex -space-x-1.5 mt-1.5">
                {[12, 32, 47, 5].map(imgId => (
                  <img key={imgId} src={`https://i.pravatar.cc/40?img=${imgId}`} className="w-5 h-5 rounded-full border-2 border-white object-cover" alt="" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN CATEGORY HERO HEADER OR ORIGINAL PROPERTIES HERO HEADER
  if (!selectedType && !selectedCity) {
    return (
      <div className="relative w-full py-3 md:py-4 px-4 md:px-8 bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/30 border-b border-slate-200 overflow-hidden">
        <div className="max-w-[1550px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
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
          {/* Right side photo banner card - HIDDEN ON MOBILE */}
          <div className="hidden md:block relative w-full md:w-[320px] h-36 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
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
    <div className="relative w-full py-3 md:py-5 px-4 md:px-8 bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/40 border-b border-slate-200 overflow-hidden">
      <div className="max-w-[1550px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 z-10 relative">
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

        {/* Right side Cozy Room Image - HIDDEN ON MOBILE */}
        <div className="hidden md:block relative w-full lg:w-[400px] h-52 md:h-56 rounded-2xl overflow-hidden shadow-lg border border-slate-200 group">
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



{/* --- POPULAR CITIES FOR PGs/PROPERTIES SECTION (HORIZONTAL CAROUSEL SLIDER) --- */}
{!selectedCity && (
  <section className="hidden md:block py-2.5 px-3 sm:px-4 md:px-6 bg-white border-b border-slate-200">
    <div className="max-w-[1550px] mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900">Popular Cities for {selectedType ? `${selectedType}s` : 'Properties'}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Explore top student hubs across India with zero brokerage.</p>
        </div>
        <Link
          to="/cities"
          className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 group transition-all shrink-0"
        >
          <span>View all cities</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      <div className="relative px-6 md:px-10 group">
        {/* Side Floating Left Arrow */}
        <button
          onClick={() => scrollHorizontal(popularCitiesScrollRef, 'left')}
          className="hidden md:flex absolute left-0 md:-left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-teal-600 hover:text-white transition-all hover:scale-110 active:scale-95"
          title="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Side Floating Right Arrow */}
        <button
          onClick={() => scrollHorizontal(popularCitiesScrollRef, 'right')}
          className="hidden md:flex absolute right-0 md:-right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-teal-600 hover:text-white transition-all hover:scale-110 active:scale-95"
          title="Scroll Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div
          ref={popularCitiesScrollRef}
          className="flex items-center gap-3 overflow-x-auto scroll-smooth scrollbar-hide py-1 px-1"
        >
          {[
            { city: 'Kota', count: '512+ Properties', image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&auto=format&fit=crop' },
            { city: 'Jaipur', count: '320+ Properties', image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=600&auto=format&fit=crop' },
            { city: 'Delhi', count: '780+ Properties', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format&fit=crop' },
            { city: 'Indore', count: '210+ Properties', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop' },
            { city: 'Bhopal', count: '190+ Properties', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop' },
            { city: 'Nagpur', count: '150+ Properties', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop' },
            { city: 'Sikar', count: '120+ Properties', image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&auto=format&fit=crop' },
            { city: 'Bangalore', count: '600+ Properties', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&auto=format&fit=crop' },
            { city: 'Pune', count: '430+ Properties', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop' },
            { city: 'Hyderabad', count: '380+ Properties', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop' },
          ].map((item) => {
            const dynamicCount = (() => {
              if (!allRawProperties || allRawProperties.length === 0) return item.count;
              const matchCount = allRawProperties.filter(p => {
                const pCity = (p.city || p.propertyInfo?.city || '').toLowerCase();
                const matchesCity = pCity === item.city.toLowerCase();
                const pType = (p.type || p.propertyType || p.property_type || '').toLowerCase();
                const targetType = (selectedType || '').toLowerCase();
                const matchesType = !targetType || pType === targetType || (targetType === 'pg' && pType.includes('pg'));
                return matchesCity && matchesType;
              }).length;
              return matchCount > 0 ? `${matchCount}+ ${selectedType ? `${selectedType}s` : 'Properties'}` : item.count;
            })();

            return (
              <Link
                key={item.city}
                to={`/${getTypeSlug(selectedType || (pathname.startsWith('/pg') ? 'PG' : ''))}-in-${slugify(item.city)}`}
                className="w-[155px] sm:w-[170px] flex-shrink-0 group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="h-28 overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={`${selectedType || 'Properties'} in ${item.city}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-t-xl"
                  />
                </div>
                <div className="p-2.5 bg-white">
                  <h3 className="font-extrabold text-slate-900 text-xs group-hover:text-teal-600 transition-colors truncate">
                    {selectedType ? `${selectedType} in ` : 'Properties in '}{item.city}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">{dynamicCount}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  </section>
)}

{/* --- EXPLORE PGs/PROPERTIES BY LOCALITIES SECTION (HORIZONTAL CAROUSEL SLIDER) --- */}
{!selectedCity && (
  <section className="hidden md:block py-2.5 px-3 sm:px-4 md:px-6 bg-[#F8FAFC] border-b border-slate-200">
    <div className="max-w-[1550px] mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900">Explore {selectedType ? `${selectedType}s` : 'Properties'} by Localities</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Find stays right next to your coaching institute or college.</p>
        </div>
        <Link
          to="/localities"
          className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 group transition-all shrink-0"
        >
          <span>View all localities</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      <div className="relative px-6 md:px-10 group">
        {/* Side Floating Left Arrow */}
        <button
          onClick={() => scrollHorizontal(popularLocalitiesScrollRef, 'left')}
          className="hidden md:flex absolute left-0 md:-left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-teal-600 hover:text-white transition-all hover:scale-110 active:scale-95"
          title="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Side Floating Right Arrow */}
        <button
          onClick={() => scrollHorizontal(popularLocalitiesScrollRef, 'right')}
          className="hidden md:flex absolute right-0 md:-right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-teal-600 hover:text-white transition-all hover:scale-110 active:scale-95"
          title="Scroll Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div
          ref={popularLocalitiesScrollRef}
          className="flex items-center gap-3 overflow-x-auto scroll-smooth scrollbar-hide py-1 px-1"
        >
          {[
            { area: 'Talwandi', city: 'Kota', count: '102+ Properties', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop' },
            { area: 'Vigyan Nagar', city: 'Kota', count: '88+ Properties', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop' },
            { area: 'Landmark City', city: 'Kota', count: '67+ Properties', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop' },
            { area: 'Mahaveer Nagar', city: 'Kota', count: '74+ Properties', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop' },
            { area: 'Indra Vihar', city: 'Kota', count: '54+ Properties', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop' },
            { area: 'Rajeev Gandhi Nagar', city: 'Kota', count: '48+ Properties', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop' },
            { area: 'Kunhari', city: 'Kota', count: '41+ Properties', image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&auto=format&fit=crop' },
            { area: 'Pratap Nagar', city: 'Jaipur', count: '56+ Properties', image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop' },
          ].map((item) => {
            const dynamicAreaCount = (() => {
              if (!allRawProperties || allRawProperties.length === 0) return item.count;
              const matchCount = allRawProperties.filter(p => {
                const pArea = (p.area || p.locality || p.propertyInfo?.area || '').toLowerCase();
                const pCity = (p.city || p.propertyInfo?.city || '').toLowerCase();
                const matchesArea = pArea.includes(item.area.toLowerCase()) || item.area.toLowerCase().includes(pArea);
                const matchesCity = !item.city || pCity === item.city.toLowerCase();
                const pType = (p.type || p.propertyType || p.property_type || '').toLowerCase();
                const targetType = (selectedType || '').toLowerCase();
                const matchesType = !targetType || pType === targetType || (targetType === 'pg' && pType.includes('pg'));
                return matchesArea && matchesCity && matchesType;
              }).length;
              return matchCount > 0 ? `${matchCount}+ ${selectedType ? `${selectedType}s` : 'Properties'}` : item.count;
            })();

            return (
              <Link
                key={item.area}
                to={`/${getTypeSlug(selectedType)}-in-${slugify(item.area)}-${slugify(item.city)}`}
                className="w-[155px] sm:w-[170px] flex-shrink-0 group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="h-28 overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={`${item.area}, ${item.city}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-t-xl"
                  />
                </div>
                <div className="p-2.5 bg-white">
                  <h3 className="font-extrabold text-slate-900 text-xs group-hover:text-teal-600 transition-colors truncate">
                    {item.area}, {item.city}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">{dynamicAreaCount}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  </section>
)}



{/* --- WHY STUDENTS LOVE AREA FEATURE CARDS (SCREENSHOT 4 & 5) --- */}
{selectedCity && selectedArea && (
  <section className="hidden md:block py-2.5 md:py-3 px-4 md:px-8 bg-white border-b border-slate-200">
    <div className="max-w-[1550px] mx-auto">
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
  <section className="hidden md:block py-8 px-4 md:px-8 bg-white border-b border-slate-200">
    <div className="max-w-[1550px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-black text-slate-900">Popular Localities in {selectedCity}</h2>
        <span className="text-xs font-bold text-slate-400">Choose your area</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {getCityPopularAreas().map(area => (
          <Link
            key={area}
            to={`/${getTypeSlug(selectedType)}-in-${slugify(area)}-${slugify(selectedCity)}`}
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
  </>
)}

        <section className="pt-4 pb-8 bg-white px-4 sm:px-6 md:px-8 border-b border-slate-200">
          <div className="max-w-[1550px] mx-auto">

            {/* --- FAST BIDDING HEADER BANNER (SITE GREEN/TEAL THEME) --- */}
            {isBiddingMode && (
              <div className="mb-6 p-5 md:p-6 rounded-2xl md:rounded-3xl bg-gradient-to-r from-teal-50 via-emerald-50/80 to-teal-100/60 border border-teal-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all animate-in fade-in duration-300">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600/10 border border-teal-600/20 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
                    <Zap className="w-6 h-6 fill-teal-600 text-teal-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase tracking-wider border border-teal-200">
                        FAST BIDDING MODE ACTIVE
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                        {totalProperties.length} Properties Matching
                      </span>
                    </div>
                    <h2 className="text-lg md:text-2xl font-black tracking-tight text-slate-900">
                      Set your filters below &amp; send 1-click bid request directly to property owners!
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Matching owners in {selectedCity || 'your city'} will receive your requested budget directly.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-teal-200/60">
                  <button
                    type="button"
                    onClick={handleDesktopBidSubmit}
                    disabled={biddingSubmitting || totalProperties.length === 0}
                    className="flex-1 md:flex-none px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-black text-xs md:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {biddingSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Placing Bids...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Bid ({totalProperties.length} Properties)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      searchParams.delete('bid');
                      setSearchParams(searchParams);
                    }}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                    title="Exit Bidding Mode"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

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
                lg:w-[280px] flex-shrink-0 lg:static lg:block lg:z-auto lg:transform-none lg:h-auto
                fixed top-0 left-0 w-[85%] max-w-[320px] h-full max-h-screen z-50 transform transition-transform duration-300 ease-in-out bg-white shadow-2xl overflow-y-auto
                ${mobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              `}>
                <div className="bg-white p-5 rounded-none lg:rounded-2xl border-0 lg:border border-slate-200 shadow-none lg:shadow-xs lg:sticky lg:top-[85px] h-full max-h-full lg:max-h-[calc(100vh-100px)] overflow-y-auto w-full pb-24 lg:pb-5">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
                    <h3 className="text-base font-black text-slate-900">Filters</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedCity('');
                          setSelectedType('');
                          setSelectedGender('');
                          setMinPrice('');
                          setMaxPrice('');
                          setSelectedColleges([]);
                        }}
                        className="text-rose-600 text-xs font-bold hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileFilterOpen(false)}
                        className="lg:hidden p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                        title="Close Filters"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* 1. Property Type (Hidden on specific type routes like /pg-in-talwandi-kota) */}
                  {!isSpecificTypeRoute && (
                    <div className="mb-5 pb-5 border-b border-slate-100">
                      <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2.5">
                        Property Type
                      </label>
                      <div className="space-y-1.5">
                        {[
                          { type: 'PG', label: 'PG', icon: Bed },
                          { type: 'Hostel', label: 'Hostels', icon: Building2 },
                          { type: 'Co-living', label: 'Co-living', icon: Users },
                          { type: 'Apartment', label: 'Apartments', icon: Home }
                        ].map(item => {
                          const isSelected = (selectedType || '').toLowerCase() === item.type.toLowerCase() || (item.type === 'PG' && !selectedType && pathname.startsWith('/pg'));
                          const IconComponent = item.icon;
                          return (
                            <button
                              key={item.type}
                              type="button"
                              onClick={() => setSelectedType(isSelected ? '' : item.type)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Gender Pills */}
                  <div className="mb-5 pb-5 border-b border-slate-100">
                    <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2.5">
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Boys', 'Girls', 'Co-ed'].map(gender => {
                        const isSelected = (selectedGender || '').toLowerCase() === gender.toLowerCase();
                        return (
                          <button
                            key={gender}
                            type="button"
                            onClick={() => setSelectedGender(isSelected ? '' : gender)}
                            className={`py-2 rounded-xl text-xs font-extrabold transition-all border text-center ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {gender}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Budget Range Slider */}
                  <div className="mb-5 pb-5 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Budget Range
                      </label>
                    </div>
                    <div className="flex items-center justify-between text-xs font-black text-slate-800 mb-3">
                      <span>₹{(parseInt(minPrice) || 2000).toLocaleString()}</span>
                      <span>₹{(parseInt(maxPrice) || 20000).toLocaleString()}{!maxPrice ? '+' : ''}</span>
                    </div>

                    <div className="px-1">
                      <div className="relative h-1.5 bg-slate-200 rounded-full mb-4">
                        <div
                          className="absolute h-full bg-teal-500 rounded-full"
                          style={{
                            left: `${((parseInt(minPrice) || 2000) / 50000) * 100}%`,
                            right: `${100 - ((parseInt(maxPrice) || 20000) / 50000) * 100}%`
                          }}
                        ></div>
                        <input
                          type="range"
                          min="1000"
                          max="50000"
                          step="500"
                          value={parseInt(minPrice) || 2000}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val < (parseInt(maxPrice) || 20000)) {
                              setMinPrice(val === 2000 ? '' : String(val));
                            }
                          }}
                          className="price-range-input"
                          style={{ zIndex: (parseInt(minPrice) || 2000) > 45000 ? 5 : 3 }}
                        />
                        <input
                          type="range"
                          min="1000"
                          max="50000"
                          step="500"
                          value={parseInt(maxPrice) || 20000}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val > (parseInt(minPrice) || 2000)) {
                              setMaxPrice(val === 20000 ? '' : String(val));
                            }
                          }}
                          className="price-range-input"
                          style={{ zIndex: 4 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Localities List */}
                  <div className="mb-5 pb-5 border-b border-slate-100">
                    <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2.5">
                      Localities
                    </label>

                    {/* Search locality input */}
                    <div className="relative mb-3">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search locality..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-2">
                      {[
                        { name: 'Talwandi', count: 23 },
                        { name: 'Vigyan Nagar', count: 38 },
                        { name: 'Mahaveer Nagar', count: 31 },
                        { name: 'Indra Vihar', count: 19 },
                        { name: 'Landmark City', count: 27 }
                      ].map(loc => (
                        <label key={loc.name} className="flex items-center justify-between text-xs font-bold text-slate-700 hover:text-teal-600 cursor-pointer group py-0.5">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                            <span>{loc.name}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-teal-600">{loc.count}</span>
                        </label>
                      ))}
                    </div>
                    <button type="button" className="text-teal-600 font-extrabold text-xs mt-2 hover:underline">
                      + View More
                    </button>
                  </div>

                  {/* 5. Room Type */}
                  <div className="mb-5 pb-5 border-b border-slate-100">
                    <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2.5">
                      Room Type
                    </label>
                    <div className="space-y-2">
                      {['Single Room', 'Double Sharing', 'Triple Sharing', 'Four Sharing'].map(room => (
                        <label key={room} className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-teal-600 cursor-pointer py-0.5">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                          <span>{room}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 6. Amenities */}
                  <div className="mb-5">
                    <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2.5">
                      Amenities
                    </label>
                    <div className="space-y-2">
                      {['WiFi', 'AC', 'Cooler', 'Meals / Food', 'Laundry'].map(amenity => (
                        <label key={amenity} className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-teal-600 cursor-pointer py-0.5">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                          <span>{amenity}</span>
                        </label>
                      ))}
                    </div>
                    <button type="button" className="text-teal-600 font-extrabold text-xs mt-2 hover:underline">
                      + View More
                    </button>
                  </div>

                  {/* Reset Filters Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCity('');
                      setSelectedType('');
                      setSelectedGender('');
                      setMinPrice('');
                      setMaxPrice('');
                      setSelectedColleges([]);
                    }}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition-all text-center mt-2 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset Filters</span>
                  </button>

                  {/* Apply Filters Button for Mobile */}
                  <div className="lg:hidden mt-6 pt-4 border-t border-slate-100 sticky bottom-0 bg-white pb-2 z-10">
                    <button
                      type="button"
                      onClick={() => setMobileFilterOpen(false)}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-md transition-all text-center"
                    >
                      Show Properties ({totalCount})
                    </button>
                  </div>
                </div>
              </aside>

              {/* Right Content - Properties */}
              <div className="flex-1 min-w-0 lg:sticky lg:top-[85px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-2 no-scrollbar">
                <div className="flex items-center justify-between md:mb-4 mb-0 bg-white py-2 px-1 rounded-xl border-b border-slate-100">
                  <div className="hidden md:block text-xs font-extrabold text-slate-700">
                    Showing {((currentPage - 1) * propertiesPerPage) + 1} to {Math.min(currentPage * propertiesPerPage, totalCount)} of {totalCount} properties {selectedCity ? `in ${selectedCity}` : ''}
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

                <div className="flex flex-col gap-3 bg-white pb-16 md:pb-0">
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
          <div className="hidden md:block bg-white border-y border-stone-200/80 py-4 px-4 shadow-2xs my-4">
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
          <section className="hidden md:block bg-[#F8FAFC] border-t border-slate-200 py-10 px-4 md:px-8 mt-8">
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

                  const targetAreaUrl = `/${getTypeSlug(selectedType)}-in-${aSlug}-${cSlug}`;

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

        {/* --- EXPLORE OTHER CITIES & STAY TYPES SECTION AT BOTTOM OF PAGE --- */}
        {/* Shown ONLY on specific City pages OR specific Property Type pages, NOT on general /properties page */}
        {((selectedCity && !selectedType) || (selectedType && !selectedCity)) && (
          <section className="hidden md:block max-w-7xl mx-auto px-4 md:px-8 my-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              
              {/* 1. Explore Properties in Other Cities - Shown ONLY on a City Page */}
              {selectedCity && !selectedType && (
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>Explore Properties in Other Cities</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mb-3">Find verified student PGs, hostels, and flats in top coaching hubs across India.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                      { city: 'Kota', image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300&q=70' },
                      { city: 'Jaipur', image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=300&q=70' },
                      { city: 'Delhi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=70' },
                      { city: 'Indore', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=300&q=70' },
                      { city: 'Bhopal', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&q=70' },
                      { city: 'Sikar', image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=300&q=70' }
                    ]
                      .filter(c => c.city.toLowerCase() !== selectedCity.toLowerCase())
                      .map((item) => (
                        <Link
                          key={item.city}
                          to={`/properties-in-${slugify(item.city)}`}
                          className="group flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50/60 hover:border-teal-200 transition-all shadow-2xs"
                        >
                          <img src={item.image} alt={item.city} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                          <div className="overflow-hidden">
                            <span className="block text-xs font-bold text-slate-800 group-hover:text-teal-700 truncate">{item.city}</span>
                            <span className="block text-[10px] font-semibold text-slate-500 group-hover:text-teal-600">Properties →</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              )}

              {/* 2. Explore Other Stay Types - Shown ONLY on a Property Type Page */}
              {selectedType && !selectedCity && (
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>Explore Other Stay Types</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mb-3">Browse all stay categories available for students and working professionals.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { type: 'PG', label: 'PGs', desc: 'Meals & housekeeping included', icon: Bed },
                      { type: 'Hostel', label: 'Hostels', desc: 'Budget friendly student stays', icon: Building2 },
                      { type: 'Co-living', label: 'Co-living', desc: 'Modern shared living spaces', icon: Users },
                      { type: 'Apartment', label: 'Apartments', desc: 'Private 1BHK & 2BHK flats', icon: Home }
                    ]
                      .filter(t => t.type.toLowerCase() !== selectedType.toLowerCase())
                      .map((t) => {
                        const IconComponent = t.icon;
                        return (
                          <Link
                            key={t.type}
                            to={`/${getTypeSlug(t.type)}`}
                            className="group p-3.5 rounded-2xl border border-slate-150 bg-slate-50/60 hover:bg-teal-50/60 hover:border-teal-200 transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700">{t.label}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-tight mb-2">{t.desc}</p>
                            <span className="text-[11px] font-extrabold text-teal-600 group-hover:translate-x-1 transition-transform inline-block">Explore →</span>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* Dynamic Property Owner CTA Banner (PDF Screenshot 3) */}
        <section className="hidden md:block max-w-7xl mx-auto px-4 md:px-8 my-8">
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
              <div className="w-20 h-20 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Building2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900">
                  {selectedCity ? `Have a property in ${locationDisplayName}?` : 'Have a property to list?'}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  List your PG, Hostel or Co-living space {selectedCity ? `in ${locationDisplayName}` : ''} and connect with thousands of students.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3 text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1 text-emerald-600"><Check className="w-3.5 h-3.5" /> Zero Brokerage</span>
                  <span className="flex items-center gap-1 text-emerald-600"><Check className="w-3.5 h-3.5" /> Verified Tenants</span>
                  <span className="flex items-center gap-1 text-emerald-600"><Check className="w-3.5 h-3.5" /> Quick Rent</span>
                  <span className="flex items-center gap-1 text-emerald-600"><Check className="w-3.5 h-3.5" /> Wide Reach</span>
                </div>
              </div>
            </div>
            <Link
              to="/list-property"
              className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all shrink-0 hover:scale-105"
            >
              List Your Property FREE →
            </Link>
          </div>
        </section>
      </main>

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

// Property Card Component - List View matching Properties in Kota (1).pdf
function PropertyCard({ property, onBookNow }) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Get all images from property. firstNonEmptyList, not `||` — an empty array
  // is truthy, so `property.images || …` returned the [] that a property with
  // an unpopulated gallery carries and the card fell back to a stock photo.
  const allImages = firstNonEmptyList(
    property.images,
    property.photos,
    property.propertyInfo?.photos,
    property.image ? [property.image] : []
  );
  const displayImages = allImages.length > 0 ? allImages : ['https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600'];
  
  // Check discount
  const hasDiscount = property.originalPrice && Number(property.originalPrice) > Number(property.price);
  const originalPrice = hasDiscount ? Number(property.originalPrice) : property.price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - property.price) / originalPrice) * 100) : 0;

  // Real Rating Calculation Logic
  const displayRating = (() => {
    const reviews = property.reviews || property.propertyInfo?.reviews || [];
    if (Array.isArray(reviews) && reviews.length > 0) {
      const validRatings = reviews.map(r => Number(r.rating || r.stars || r.score)).filter(r => !isNaN(r) && r > 0);
      if (validRatings.length > 0) {
        const avg = validRatings.reduce((acc, curr) => acc + curr, 0) / validRatings.length;
        return avg.toFixed(1);
      }
    }
    const dbRating = Number(property.rating || property.propertyInfo?.rating);
    if (!isNaN(dbRating) && dbRating > 0 && dbRating !== 4.5) {
      return dbRating.toFixed(1);
    }
    return '4.5';
  })();

  const propSlug = slugify(property.name || property.title || property.id);
  const detailPath = `/property-details/${propSlug}`;

  return (
    <div className="bg-white rounded-2xl shadow-xs hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-teal-200 overflow-hidden mb-3.5 md:mb-4 group">
      {/* ─── MOBILE CARD VIEW (MATCHING EXACT OYO MOBILE SCREENSHOT) ─── */}
      <div className="lg:hidden p-3.5 flex flex-col gap-2.5 cursor-pointer" onClick={() => navigate(detailPath)}>
        {/* 2-Photo Side-by-Side Grid Header */}
        <div className="relative w-full h-[175px] rounded-xl overflow-hidden grid grid-cols-2 gap-1 bg-slate-100">
          {/* Left Photo */}
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={getOptimizedImageUrl(displayImages[0], 500)}
              alt={property.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Top Left Serviced / Verified Badge */}
            <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs shadow-xs">
              <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
              <span>Roomhy-Serviced</span>
            </div>

            {/* Bottom Left Rating Badge (★ 4.5 (46)) */}
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-slate-900 px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-extrabold shadow-sm border border-slate-200/60">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{displayRating}</span>
              <span className="text-slate-400 font-semibold">({property.reviewsCount || property.reviews?.length || 28})</span>
            </div>
          </div>

          {/* Right Photo */}
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={getOptimizedImageUrl(displayImages[1] || displayImages[0], 500)}
              alt={property.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Top Right Heart Wishlist Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsLiked(!isLiked);
                if (window.toast?.success) window.toast.success(isLiked ? 'Removed from Wishlist' : 'Saved to Wishlist!');
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/85 backdrop-blur-xs flex items-center justify-center text-slate-500 hover:text-rose-500 shadow-sm z-10"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Details Below Photos */}
        <div>
          <h3 className="text-base font-extrabold text-slate-900 line-clamp-1 leading-snug">
            {property.name}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
            {property.area ? `${property.area}, ` : ''}{property.location || property.city}
          </p>

          {/* Social Proof / Urgency text (⚡ 5+ students booked recently) */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-1">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
            <span>5+ students booked this stay recently</span>
          </div>

          {/* Price Block */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              ₹{property.price?.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 font-bold line-through">₹{originalPrice.toLocaleString()}</span>
            )}
            {hasDiscount && (
              <span className="text-xs font-black text-emerald-600">{discountPercent}% off</span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">+ taxes &amp; fees</p>
        </div>
      </div>

      {/* ─── DESKTOP CARD VIEW (>= 1024px) ─── */}
      <div className="hidden lg:flex flex-col lg:flex-row min-h-[210px]">
        {/* Left Image Section - OYO Style Main Photo + Right Thumbnails */}
        <div className={`relative w-full ${displayImages.length > 1 ? 'lg:w-[320px] xl:w-[350px]' : 'lg:w-[270px] xl:w-[290px]'} h-[200px] md:h-[210px] shrink-0 bg-slate-100 p-1 flex gap-1 rounded-t-2xl lg:rounded-tr-none lg:rounded-l-2xl overflow-hidden border-r border-slate-100`}>
          {/* Main Photo (Left) */}
          <div className="relative flex-1 h-full rounded-l-xl overflow-hidden group/img cursor-pointer" onClick={() => navigate(detailPath)}>
            <img
              src={getOptimizedImageUrl(displayImages[currentImageIndex], 600)}
              alt={property.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
              loading="lazy"
            />
            
            {/* Top Left VERIFIED Badge */}
            <div className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider z-10">
              <Check className="w-3 h-3 text-white stroke-[3]" />
              <span>Verified</span>
            </div>

            {/* Top Right Wishlist Heart Button (if single image) */}
            {displayImages.length <= 1 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsLiked(!isLiked);
                  if (window.toast?.success) window.toast.success(isLiked ? 'Removed from Wishlist' : 'Saved to Wishlist!');
                }}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-md z-10"
                title="Add to Wishlist"
              >
                <Heart className={`w-4 h-4 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            )}
          </div>

          {/* OYO-Style Right-Side Thumbnails Column */}
          {displayImages.length > 1 && (
            <div className="w-[75px] sm:w-[85px] h-full flex flex-col gap-1 shrink-0 relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsLiked(!isLiked);
                  if (window.toast?.success) window.toast.success(isLiked ? 'Removed from Wishlist' : 'Saved to Wishlist!');
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-md z-20"
                title="Add to Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

              {displayImages.slice(1, 5).map((img, idx) => {
                const actualIndex = idx + 1;
                const isLastItem = idx === 3;
                const extraCount = displayImages.length - 5;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(actualIndex);
                    }}
                    className={`relative flex-1 w-full rounded-md overflow-hidden border transition-all cursor-pointer ${
                      currentImageIndex === actualIndex ? 'border-teal-500 ring-2 ring-teal-500' : 'border-slate-200 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <img src={getOptimizedImageUrl(img, 150)} alt="thumb" className="w-full h-full object-cover" />
                    {isLastItem && extraCount > 0 && (
                      <div className="absolute inset-0 bg-slate-900/80 text-white font-black text-xs flex items-center justify-center backdrop-blur-[1px]">
                        +{extraCount + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Middle Content Details Area */}
        <div className="flex-1 p-4 md:p-5 flex flex-col justify-between min-w-0">
          <div>
            {/* Title & Rating */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <Link
                to={detailPath}
                onClick={() => trackPropertyClick(property.id)}
                className="text-lg md:text-xl font-black text-slate-900 hover:text-teal-600 transition-colors line-clamp-1"
              >
                {property.name}
              </Link>

              {displayRating && (
                <div className="bg-emerald-500 text-white px-2 py-0.5 rounded-lg flex items-center gap-1 text-xs font-black shadow-2xs shrink-0">
                  <span>{displayRating}</span>
                  <Star className="w-3 h-3 fill-white stroke-none" />
                </div>
              )}
            </div>

            {/* Location Subtitle */}
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-3 truncate">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{property.area ? `${property.area}, ` : ''}{property.location || property.city}</span>
            </p>

            {/* Amenity Icons Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 mb-3">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                <Wifi className="w-3.5 h-3.5 text-slate-400" />
                <span>WiFi</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                <Wind className="w-3.5 h-3.5 text-slate-400" />
                <span>AC</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                <Utensils className="w-3.5 h-3.5 text-slate-400" />
                <span>Meals</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                <Tv className="w-3.5 h-3.5 text-slate-400" />
                <span>TV</span>
              </div>
            </div>

            {/* Category & Sharing Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-100">
                {property.category || property.gender || 'Boys PG'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-[11px] font-extrabold border border-sky-100">
                {property.sharing || '2 Sharing'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-extrabold border border-purple-100">
                {property.type || 'PG'}
              </span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-4 text-xs font-extrabold text-slate-500">
            <div className="flex items-center gap-1 text-emerald-600">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Zero Brokerage</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Instant Booking</span>
            </div>
          </div>
        </div>

        {/* Right Side Price & Buttons Section */}
        <div className="w-full lg:w-[220px] p-4 md:p-5 bg-slate-50/50 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 shrink-0">
          <div className="text-left lg:text-right">
            <div className="flex items-baseline gap-2 justify-start lg:justify-end">
              {hasDiscount && (
                <span className="text-xs text-slate-400 font-bold line-through">₹{originalPrice.toLocaleString()}</span>
              )}
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                ₹{property.price?.toLocaleString()}
              </div>
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-0.5">
              /month <span className="text-slate-400 font-normal">+ taxes &amp; fees</span>
            </div>
            {hasDiscount && (
              <span className="inline-block mt-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-auto lg:w-full shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                trackPropertyClick(property.id);
                navigate(detailPath);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-800 text-slate-800 font-extrabold text-xs transition-all hover:bg-white text-center whitespace-nowrap"
            >
              View Details
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onBookNow) onBookNow();
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition-all shadow-md hover:scale-[1.02] active:scale-95 text-center whitespace-nowrap"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
