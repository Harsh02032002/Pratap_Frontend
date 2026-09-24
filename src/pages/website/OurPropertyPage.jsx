import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import * as LucideIcons from "lucide-react";
const { Filter, MapPin, Wallet, Home, Users, TrendingUp, Send, RefreshCw, ChevronLeft, ChevronRight, Building2, BookOpen, Star, Check, Phone, Wifi, Utensils, Car, Dumbbell, Tv, Wind, Droplets, Zap, X, Menu, Heart, ChevronDown, Clock, Shirt, Cctv, Video, Waves, Fan, Shield, Search, Bed, SlidersHorizontal, Sparkles, Tag, GraduationCap, School } = LucideIcons;
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { fetchProperties, searchPropertiesByLocation, getNearbyAreas, getInstitutions, getPriceRangeByType, trackPropertyClick, getApiBase, fetchJson, resolvePropertyOwnerLoginId, firstNonEmptyList } from "../../utils/api";
import { cacheInvalidate } from "../../utils/cache";
import FastBiddingModal from "../../components/website/FastBiddingModal";
import QuickBookingModal from "../../components/website/QuickBookingModal";
import { useAuth } from "../../contexts/AuthContext";
import { useHtmlPage } from "../../utils/htmlPage";
import axios from "axios";
import useSEO from "../../hooks/useSEO";
import { toast } from "react-hot-toast";

// Client-side memory cache to optimize performance and prevent duplicate API lookups
const seoCache = new Map();
const propertyCache = new Map();
const nearbyDataCache = new Map();
const overpassCollegesCache = new Map(); // cache colleges per city-set to avoid 429 rate limit
// Pre-seed from localStorage to survive page reloads (24h TTL)
try {
  const saved = JSON.parse(localStorage.getItem('__overpassCollegesCache') || '{}');
  const now = Date.now();
  Object.entries(saved).forEach(([k, v]) => {
    if (v && v.data && (now - (v.ts || 0)) < 24 * 60 * 60 * 1000) {
      overpassCollegesCache.set(k, v.data); // only restore if < 24h old
    }
  });
} catch (_) {}

async function getCachedOrFetch(cacheMap, key, fetcher, ttlMs = 10 * 60 * 1000) {
  const cached = cacheMap.get(key);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }
  const data = await fetcher();
  cacheMap.set(key, { data, timestamp: Date.now() });
  return data;
}

// Cities & Localities map dynamically built from MongoDB database properties
const cityAreasMap = {};

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
    if (clean === 'hostels' || clean === 'hostel' || clean.startsWith('hostel') || clean.startsWith('hostels-') || clean.startsWith('hostels/')) return 'Hostel';
    if (clean === 'co-living' || clean === 'coliving' || clean.startsWith('co-living-') || clean.startsWith('co-living/')) return 'Co-living';
    if (clean === 'apartments' || clean === 'apartment' || clean.startsWith('apartment') || clean.startsWith('apartments-') || clean.startsWith('apartments/')) return 'Apartment';
    return '';
  };

  const typeFromUrl = searchParams.get('type');
  const cityFromUrl = searchParams.get('city');
  const areaFromUrl = searchParams.get('area');
  const searchFromUrl = searchParams.get('search');

  const initialCity = cityFromUrl || parsedLoc?.city || (citySlug ? humanizeSlug(citySlug) : "");
  const initialArea = areaFromUrl || parsedLoc?.area || (areaSlug ? humanizeSlug(areaSlug) : "");
  const initialType = typeFromUrl || (parsedLoc ? parsedLoc.type : getTypeFromPathname(pathname)) || '';
  const isLocationSpecificRoute = !!(citySlug || parsedLoc?.city || cleanPath.includes('-in-'));

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


  // NOTE: Filter state is managed purely in React state.
  // URL is NOT updated on filter change to prevent route re-renders and page navigations.



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

  // Bidding mode active check
  const isBiddingMode = searchParams.get('bid') === 'true' || pathname.toLowerCase().includes('bidding');

  const [showFilters, setShowFilters] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState([]);
  const [nearbyAreas, setNearbyAreas] = useState([]);
  const [allColleges, setAllColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
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

  // Dynamically merge DB cities & localities with cityAreasMap
  const dynamicCitiesMap = useMemo(() => {
    const map = { ...cityAreasMap };
    const targetProps = (allRawProperties && allRawProperties.length > 0) ? allRawProperties : properties;
    
    if (Array.isArray(targetProps)) {
      targetProps.forEach(p => {
        const c = p.city || p.propertyInfo?.city;
        const a = p.locality || p.area || p.propertyInfo?.area || p.location;
        if (c && typeof c === 'string' && c.trim()) {
          const cityFormatted = c.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          if (!map[cityFormatted]) {
            map[cityFormatted] = [];
          }
          if (a && typeof a === 'string' && a.trim()) {
            const areaFormatted = a.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            if (!map[cityFormatted].includes(areaFormatted)) {
              map[cityFormatted].push(areaFormatted);
            }
          }
        }
      });
    }
    return map;
  }, [allRawProperties, properties]);

  const [localitySearchQuery, setLocalitySearchQuery] = useState('');
  const [showAllLocalities, setShowAllLocalities] = useState(false);

  // Dynamically compute localities list for selected city (or all cities) from DB properties
  const displayLocalities = useMemo(() => {
    let rawList = [];
    if (selectedCity) {
      const matchedKey = Object.keys(dynamicCitiesMap).find(c => c.toLowerCase() === selectedCity.toLowerCase());
      rawList = matchedKey ? (dynamicCitiesMap[matchedKey] || []) : [];
    } else {
      const allLocs = new Set();
      Object.values(dynamicCitiesMap).forEach(arr => {
        if (Array.isArray(arr)) arr.forEach(a => allLocs.add(a));
      });
      rawList = Array.from(allLocs);
    }

    const targetProps = (allRawProperties && allRawProperties.length > 0) ? allRawProperties : properties;
    const localityCounts = {};
    if (Array.isArray(targetProps)) {
      targetProps.forEach(p => {
        const areaName = p.locality || p.area || p.propertyInfo?.area || p.location;
        if (areaName && typeof areaName === 'string' && areaName.trim()) {
          const formatted = areaName.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          localityCounts[formatted] = (localityCounts[formatted] || 0) + 1;
        }
      });
    }

    let result = rawList.map(name => ({
      name,
      count: localityCounts[name] || 0
    }));

    if (localitySearchQuery.trim()) {
      const q = localitySearchQuery.toLowerCase().trim();
      result = result.filter(item => item.name.toLowerCase().includes(q));
    }

    return result.sort((a, b) => b.count - a.count);
  }, [selectedCity, dynamicCitiesMap, allRawProperties, properties, localitySearchQuery]);

  const [selectedRoomTypes, setSelectedRoomTypes] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [amenitiesDropdownOpen, setAmenitiesDropdownOpen] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  // Dynamically compute all amenities and their property counts from DB properties
  const displayAmenities = useMemo(() => {
    const targetProps = (allRawProperties && allRawProperties.length > 0) ? allRawProperties : properties;
    const amenityCounts = {};
    
    if (Array.isArray(targetProps)) {
      targetProps.forEach(p => {
        const ams = p.amenities || p.facilities || p.propertyInfo?.amenities || p.propertyInfo?.facilities || [];
        const list = Array.isArray(ams) ? ams : (typeof ams === 'string' ? ams.split(',') : []);
        
        list.forEach(raw => {
          if (!raw || typeof raw !== 'string') return;
          const clean = raw.trim();
          if (clean) {
            const formatted = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            amenityCounts[formatted] = (amenityCounts[formatted] || 0) + 1;
          }
        });

        if (p.wifi || p.propertyInfo?.wifi) amenityCounts['WiFi'] = (amenityCounts['WiFi'] || 0) + 1;
        if (p.ac || p.propertyInfo?.ac) amenityCounts['AC'] = (amenityCounts['AC'] || 0) + 1;
        if (p.food || p.meals || p.propertyInfo?.food) amenityCounts['Meals / Food'] = (amenityCounts['Meals / Food'] || 0) + 1;
        if (p.laundry || p.propertyInfo?.laundry) amenityCounts['Laundry'] = (amenityCounts['Laundry'] || 0) + 1;
        if (p.powerBackup || p.propertyInfo?.powerBackup) amenityCounts['Power Backup'] = (amenityCounts['Power Backup'] || 0) + 1;
        if (p.security || p.cctv || p.propertyInfo?.security) amenityCounts['CCTV & Security'] = (amenityCounts['CCTV & Security'] || 0) + 1;
      });
    }

    const defaultAmenities = ['WiFi', 'AC', 'Cooler', 'Meals / Food', 'Laundry', 'Power Backup', 'CCTV & Security', 'Geyser', 'Study Table', 'Parking', 'Gym'];
    const allNames = Array.from(new Set([...defaultAmenities, ...Object.keys(amenityCounts)]));

    return allNames.map(name => ({
      name,
      count: amenityCounts[name] || 0
    })).sort((a, b) => b.count - a.count);
  }, [allRawProperties, properties]);

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
  const [priceInputText, setPriceInputText] = useState('');
  const [pricePlaceholder, setPricePlaceholder] = useState('e.g. <8000, >5000, or 3000-8000');
  const priceInputRef = useRef(null);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [sortBy, setSortBy] = useState('Featured');
  const [showSort, setShowSort] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedPropertyForBid, setSelectedPropertyForBid] = useState(null);
  const [showDirectBookingModal, setShowDirectBookingModal] = useState(false);
  const [selectedPropertyForDirectBook, setSelectedPropertyForDirectBook] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const [biddingSubmitting, setBiddingSubmitting] = useState(false);

  const [bidResultModal, setBidResultModal] = useState(null);

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
      const parsedMax = parseInt(maxPrice, 10) || 0;
      const userId = user?.loginId || user?._id || user?.id || '';

      const bidRequests = targetProperties.slice(0, 15).map((prop, index) => {
        const propInfo = prop.propertyInfo || {};
        const propertyId = prop._id || prop.id || prop.visitId || `property-${index}`;
        const ownerId = resolvePropertyOwnerLoginId(prop) || (prop.generatedCredentials && prop.generatedCredentials.loginId) || prop.ownerLoginId || propInfo.ownerLoginId || 'admin';
        const propRent = parseInt(prop.monthlyRent || prop.rent || prop.price || prop.pricing?.monthlyRent || 0, 10);
        const budget = (Number.isFinite(parsedMax) && parsedMax > 0) ? parsedMax : 0;

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
            requestType: 'bid',
            request_type: 'bid',
            rentAmount: propRent,
            rent_amount: propRent,
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
      cacheInvalidate('enquiries:');
      cacheInvalidate('booking-requests:');
      setBiddingSubmitting(false);

      const exactMatches = targetProperties.filter(p => parseInt(p.monthlyRent || p.rent || p.price || 0, 10) <= parsedMax);
      const gapMatches = targetProperties.filter(p => {
        const r = parseInt(p.monthlyRent || p.rent || p.price || 0, 10);
        return r > parsedMax && r <= parsedMax + 2500;
      });

      let category = 'no_match_active';
      if (exactMatches.length > 0) category = 'exact_match';
      else if (gapMatches.length > 0) category = 'slight_gap';

      if (category === 'exact_match') {
        setBidResultModal({
          type: 'exact',
          title: '✅ Bid Submitted!',
          subtitle: 'Properties Available in Your Budget',
          accentColor: '#059669',
          bgGradient: 'from-emerald-50 to-teal-50',
          borderColor: 'border-emerald-200',
          budgetLabel: `₹${parsedMax.toLocaleString('en-IN')}/month`,
          matchCount: exactMatches.length,
          steps: [
            { icon: '📩', title: 'Owners Notified', desc: 'All matching property owners have received your bid request instantly.' },
            { icon: '💬', title: 'Owner Will Start Chat', desc: 'An interested owner will open a chat with you directly on the website.' },
            { icon: '🔔', title: 'You Will Be Notified', desc: 'You\'ll get an instant push + email alert when an owner responds to your bid.' },
            { icon: '🏠', title: 'Finalize Move-in', desc: 'Chat with the owner, confirm rent & move-in date — all within Roomhy!' },
          ],
          badges: ['💬 Direct Owner Chat', '🔔 Real-time Alerts', '⌛ 24-Hour Bid Validity'],
          ctaLabel: '💬 Open Chat Panel',
          ctaPath: '/tenant/tenantchat'
        });
      } else if (category === 'slight_gap') {
        setBidResultModal({
          type: 'gap',
          title: '⚡ Bid Submitted!',
          subtitle: `Properties Within ₹2,500 of Your Budget`,
          accentColor: '#d97706',
          bgGradient: 'from-amber-50 to-yellow-50',
          borderColor: 'border-amber-200',
          budgetLabel: `₹${parsedMax.toLocaleString('en-IN')}/month`,
          matchCount: gapMatches.length,
          steps: [
            { icon: '📩', title: 'Owners Notified', desc: 'Owners of properties within ₹2,500 of your budget have been notified.' },
            { icon: '💬', title: 'Negotiation Chat', desc: 'If an owner agrees to negotiate rent, they\'ll start a chat with you.' },
            { icon: '🔔', title: 'Instant Alert', desc: 'You\'ll get a push + email notification the moment an owner responds.' },
            { icon: '🤝', title: 'Agree & Move-in', desc: 'Negotiate rent directly, finalize a deal & plan your move-in date!' },
          ],
          badges: ['💬 Rent Negotiation Chat', '🔔 Instant Notifications', '⌛ 24-Hour Bid Validity'],
          ctaLabel: '💬 Open Chat Panel',
          ctaPath: '/tenant/tenantchat'
        });
      } else {
        setBidResultModal({
          type: 'none',
          title: '📌 Requirement Registered!',
          subtitle: 'Auto-Matching is Now Active',
          accentColor: '#0d9488',
          bgGradient: 'from-teal-50 to-cyan-50',
          borderColor: 'border-teal-200',
          budgetLabel: `₹${parsedMax.toLocaleString('en-IN')}/month`,
          matchCount: 0,
          steps: [
            { icon: '📌', title: 'Requirement Saved', desc: 'No match right now — but your budget requirement is saved as ACTIVE in our system.' },
            { icon: '⚡', title: 'Auto-Matching ON', desc: 'As soon as a new property matching your budget is added, our system detects it instantly.' },
            { icon: '📱', title: 'Multi-Channel Alert', desc: 'You will be notified via Push Notification, Email & WhatsApp automatically.' },
            { icon: '🏠', title: 'Chat & Book', desc: 'Once matched, open chat with the owner and finalize your move-in!' },
          ],
          badges: ['⚡ Auto-Matching Active', '📱 Push + WhatsApp Alerts', '📌 Requirement Saved'],
          ctaLabel: null,
          ctaPath: null
        });
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

    const offeredRent = bookingData.bidAmount ? parseInt(bookingData.bidAmount, 10) : parseInt(targetProp.price || targetProp.monthlyRent || targetProp.rent || bookingData.propertyPrice || 0, 10);
    const propRent = parseInt(targetProp.price || targetProp.monthlyRent || targetProp.rent || bookingData.propertyPrice || 0, 10);

    const payload = {
      property_id: targetProp._id || targetProp.id || bookingData.propertyId,
      property_name: targetProp.name || targetProp.title || bookingData.propertyName || 'Property',
      owner_id: ownerId,
      rent_amount: propRent,
      bid_amount: offeredRent,
      offered_amount: offeredRent,
      area: targetProp.area || targetProp.locality || targetProp.propertyInfo?.area || targetProp.location || 'Nearby',
      city: targetProp.city || targetProp.propertyInfo?.city || targetProp.location || 'Kota',
      property_type: targetProp.type || targetProp.propertyType || targetProp.propertyInfo?.propertyType || 'PG',
      request_type: bookingData.bidAmount ? 'bid' : 'direct',
      user_id: userId,
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      message: bookingData.message || 'Direct request from website',
    };

    const res = await fetch(`${getApiBase()}/api/booking/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit booking request');
    setShowDirectBookingModal(false);

    const isExact = offeredRent >= propRent;
    const isGap = !isExact && (propRent <= offeredRent + 2500);

    setBidResultModal({
      type: isExact ? 'exact' : isGap ? 'gap' : 'none',
      title: isExact ? '✅ Bid / Request Submitted!' : isGap ? '⚡ Bid Submitted!' : '📌 Requirement Saved!',
      subtitle: isExact 
        ? `Request sent for ${targetProp.name || 'Property'}`
        : isGap
        ? `Within ₹2,500 gap of listed rent (₹${propRent.toLocaleString('en-IN')})`
        : `Your budget requirement is active for auto-matching`,
      accentColor: isExact ? '#059669' : isGap ? '#d97706' : '#0d9488',
      bgGradient: isExact ? 'from-emerald-50 to-teal-50' : isGap ? 'from-amber-50 to-yellow-50' : 'from-teal-50 to-cyan-50',
      borderColor: isExact ? 'border-emerald-200' : isGap ? 'border-amber-200' : 'border-teal-200',
      budgetLabel: `₹${offeredRent.toLocaleString('en-IN')}/month`,
      matchCount: 1,
      steps: [
        { icon: '📩', title: 'Owner Notified', desc: `Property owner of "${targetProp.name || 'Property'}" has received your request.` },
        { icon: '💬', title: 'Owner Will Start Chat', desc: 'An interested owner will open a direct chat with you on the Roomhy platform.' },
        { icon: '🔔', title: 'Multi-Channel Alert', desc: 'You will get real-time Push, Email & WhatsApp notifications when the owner responds.' },
        { icon: '⌛', title: '24-Hour Bid Validity', desc: 'Your bid stays active for 24 hours. If unfulfilled, auto-matching remains active!' },
      ],
      badges: ['💬 Direct Owner Chat', '🔔 Push + WhatsApp Alerts', '⌛ 24-Hour Bid Validity'],
      ctaLabel: '💬 Open Chat Panel',
      ctaPath: '/tenant/tenantchat'
    });
  };

  // 0. COLLEGES FETCH — Overpass API, sequential with delay to avoid 429 rate limit + session cache
  useEffect(() => {
    if (availableCities.length === 0) return;
    let cancelled = false;

    // Cache key based on sorted city list
    const cacheKey = availableCities.slice(0, 5).sort().join('|');

    // Return cached result immediately if available
    if (overpassCollegesCache.has(cacheKey)) {
      setAllColleges(overpassCollegesCache.get(cacheKey));
      return;
    }

    const EXCLUDE_WORDS = ['ground', 'park', 'field', 'stadium', 'garden', 'playground', 'sports', 'club', 'gym', 'hospital', 'clinic', 'hotel', 'mall', 'market', 'temple', 'church', 'mosque', 'masjid', 'mandir', 'dispensary'];

    const run = async () => {
      setCollegesLoading(true);
      const allFound = new Set();

      // Sequential requests — 1.2s delay between each to respect Overpass 1 req/sec limit
      for (const city of availableCities.slice(0, 5)) {
        if (cancelled) break;
        try {
          const q = `[out:json][timeout:25];area["name"="${city}"]["place"~"city|town|village"]->.a;(node["amenity"="college"]["name"](area.a);way["amenity"="college"]["name"](area.a);node["amenity"="university"]["name"](area.a);way["amenity"="university"]["name"](area.a);node["amenity"="school"]["name"](area.a);way["amenity"="school"]["name"](area.a););out;`;
          const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
          if (res.ok) {
            const json = await res.json();
            (json.elements || []).forEach(e => {
              const name = (e.tags?.name || '').trim();
              if (name.length >= 4) {
                const lower = name.toLowerCase();
                if (!EXCLUDE_WORDS.some(w => lower.includes(w))) allFound.add(name);
              }
            });
          }
        } catch (e) { /* silent */ }
        // Wait 2s between requests to respect Overpass rate limit (1 req/sec public)
        if (!cancelled) await new Promise(r => setTimeout(r, 2000));
      }

      if (!cancelled) {
        const result = Array.from(allFound).sort();
        overpassCollegesCache.set(cacheKey, result); // cache for this session
        // Persist to localStorage so page reloads don't re-fetch (24h TTL)
        try {
          const existing = JSON.parse(localStorage.getItem('__overpassCollegesCache') || '{}');
          existing[cacheKey] = { data: result, ts: Date.now() };
          // Keep max 10 entries to avoid bloat
          const keys = Object.keys(existing);
          if (keys.length > 10) delete existing[keys[0]];
          localStorage.setItem('__overpassCollegesCache', JSON.stringify(existing));
        } catch (_) {}
        setAllColleges(result);
        setCollegesLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [availableCities]); // eslint-disable-line react-hooks/exhaustive-deps

  // 1. SERVER DATA FETCHING — runs ONLY when search location / URL type parameters change
  useEffect(() => {
    let isCancelled = false;
    const fetchServerData = async () => {
      try {
        setLoading(true);
        const cacheKey = `properties:${latitudeFromUrl || ''}:${longitudeFromUrl || ''}:${typeFromUrl || ''}:${cityFromUrl || ''}`;
        
        const rawData = await getCachedOrFetch(propertyCache, cacheKey, async () => {
          if (latitudeFromUrl && longitudeFromUrl) {
            return await searchPropertiesByLocation(
              parseFloat(latitudeFromUrl),
              parseFloat(longitudeFromUrl),
              typeFromUrl,
              50
            );
          } else {
            return await fetchProperties();
          }
        }, 5 * 60 * 1000);

        if (isCancelled) return;

        // Format properties
        const formattedProperties = rawData.map(p => ({
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
          amenities: p.propertyInfo?.amenities || p.amenities || [],
          wifi: !!(p.wifi || p.propertyInfo?.wifi),
          ac: !!(p.ac || p.propertyInfo?.ac),
          meals: !!(p.food || p.meals || p.propertyInfo?.food || p.propertyInfo?.meals),
          laundry: !!(p.laundry || p.propertyInfo?.laundry),
          powerBackup: !!(p.powerBackup || p.propertyInfo?.powerBackup),
          security: !!(p.security || p.cctv || p.propertyInfo?.security || p.propertyInfo?.cctv),
          geyser: !!(p.geyser || p.propertyInfo?.geyser),
          parking: !!(p.parking || p.propertyInfo?.parking),
          gym: !!(p.gym || p.propertyInfo?.gym),
          studyTable: !!(p.studyTable || p.propertyInfo?.studyTable),
          cooler: !!(p.cooler || p.propertyInfo?.cooler),
          nearbyColleges: p.nearbyColleges || [],
          latitude: p.latitude,
          longitude: p.longitude,
          originalPrice: p.originalPrice || null,
        }));

        setAllRawProperties(formattedProperties);
        const cities = [...new Set(formattedProperties.map(p => p.city).filter(Boolean))].sort();
        setAvailableCities(cities);

        // Pre-extract colleges from dataset
        const collegesByProperty = {};
        const propertyCollegesSet = new Set();
        formattedProperties.forEach(prop => {
          if (Array.isArray(prop.nearbyColleges) && prop.nearbyColleges.length > 0) {
            const names = prop.nearbyColleges.map(c => (typeof c === 'string' ? c : c.name)).filter(Boolean);
            collegesByProperty[prop.id] = names;
            names.forEach(n => propertyCollegesSet.add(n));
          }
        });
        setPropertyNearbyColleges(collegesByProperty);
        // Merge with any colleges already fetched from dedicated endpoint
        setAllColleges(prev => {
          const merged = new Set([...prev, ...Array.from(propertyCollegesSet)]);
          return Array.from(merged).sort();
        });

        // Background fetch for nearby areas & institutions (cached, ONCE per city)
        const targetCity = cityFromUrl || (formattedProperties.length > 0 ? formattedProperties[0].city : '');
        if (targetCity) {
          getCachedOrFetch(nearbyDataCache, `nearbyAreas:${targetCity}`, () =>
            getNearbyAreas(parseFloat(latitudeFromUrl) || 0, parseFloat(longitudeFromUrl) || 0, targetCity)
          ).then(areas => { if (!isCancelled) setNearbyAreas(areas); }).catch(() => {});

          getCachedOrFetch(nearbyDataCache, `institutions:${targetCity}`, () =>
            getInstitutions(targetCity)
          ).then(insts => { if (!isCancelled) setInstitutions(insts); }).catch(() => {});
        }
      } catch (err) {
        console.error('Error loading properties dataset:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchServerData();
    return () => { isCancelled = true; };
  }, [typeFromUrl, cityFromUrl, latitudeFromUrl, longitudeFromUrl]);


  // 2. CLIENT-SIDE FILTERING, SORTING, AND PAGINATION — runs instantly in memory!
  useEffect(() => {
    if (!allRawProperties || allRawProperties.length === 0) return;

    let filtered = allRawProperties;

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
      const allowedLimit = isBiddingMode ? (limit + 2500) : limit;
      filtered = filtered.filter(p => p.price <= allowedLimit);
    }

    if (selectedRoomTypes.length > 0) {
      filtered = filtered.filter(p => {
        const rawRoomTypes = p.roomTypes || p.propertyInfo?.roomTypes || p.type || '';
        const roomStr = (Array.isArray(rawRoomTypes) ? rawRoomTypes.join(' ') : String(rawRoomTypes)).toLowerCase();
        return selectedRoomTypes.some(rt => {
          const rtLower = rt.toLowerCase();
          if (rtLower.includes('single')) return roomStr.includes('single') || roomStr.includes('1');
          if (rtLower.includes('double')) return roomStr.includes('double') || roomStr.includes('2');
          if (rtLower.includes('triple')) return roomStr.includes('triple') || roomStr.includes('3');
          if (rtLower.includes('four')) return roomStr.includes('four') || roomStr.includes('4');
          return roomStr.includes(rtLower);
        });
      });
    }

    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(p => {
        const ams = p.amenities || p.facilities || p.propertyInfo?.amenities || p.propertyInfo?.facilities || [];
        const amArr = Array.isArray(ams) ? ams : (typeof ams === 'string' ? ams.split(',') : []);
        const amStr = amArr.map(a => String(a).trim().toLowerCase()).join(' ');
        return selectedAmenities.every(am => {
          const amLower = am.toLowerCase();
          if (amLower.includes('wifi')) return amStr.includes('wifi') || !!(p.wifi) || !!(p.propertyInfo?.wifi);
          if (amLower === 'ac') return amStr.includes('ac') || amStr.includes(' ac ') || amStr.includes('air') || !!(p.ac) || !!(p.propertyInfo?.ac);
          if (amLower.includes('food') || amLower.includes('meal')) return amStr.includes('food') || amStr.includes('meal') || amStr.includes('mess') || !!(p.food) || !!(p.meals) || !!(p.propertyInfo?.food);
          if (amLower.includes('laundry')) return amStr.includes('laundry') || amStr.includes('wash') || !!(p.laundry) || !!(p.propertyInfo?.laundry);
          if (amLower.includes('cooler')) return amStr.includes('cooler') || !!(p.cooler) || !!(p.propertyInfo?.cooler);
          if (amLower.includes('power')) return amStr.includes('power') || amStr.includes('backup') || !!(p.powerBackup) || !!(p.propertyInfo?.powerBackup);
          if (amLower.includes('cctv') || amLower.includes('security')) return amStr.includes('cctv') || amStr.includes('security') || !!(p.security) || !!(p.cctv) || !!(p.propertyInfo?.security);
          if (amLower.includes('geyser')) return amStr.includes('geyser') || !!(p.geyser) || !!(p.propertyInfo?.geyser);
          if (amLower.includes('parking')) return amStr.includes('parking') || !!(p.parking) || !!(p.propertyInfo?.parking);
          if (amLower.includes('gym')) return amStr.includes('gym') || !!(p.gym) || !!(p.propertyInfo?.gym);
          if (amLower.includes('study')) return amStr.includes('study') || amStr.includes('table') || !!(p.studyTable) || !!(p.propertyInfo?.studyTable);
          // Generic match: check each amenity in the array individually
          return amArr.some(a => String(a).trim().toLowerCase().includes(amLower) || amLower.includes(String(a).trim().toLowerCase()));
        });
      });
    }

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

    setTotalProperties(filtered);
    setTotalCount(filtered.length);

    // Get current page properties
    const indexOfLastProperty = currentPage * propertiesPerPage;
    const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
    setProperties(filtered.slice(indexOfFirstProperty, indexOfLastProperty));
    
    if (filtered.length > 0) {
      const prices = filtered.map(p => p.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      setPriceRange({ min, max, average, count: filtered.length });
    }
  }, [allRawProperties, selectedCity, selectedArea, searchQuery, selectedType, selectedGender, minPrice, maxPrice, selectedRoomTypes, selectedAmenities, selectedColleges, sortBy, currentPage, isBiddingMode, propertyNearbyColleges, propertiesPerPage]);


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
    const normalizedKey = Object.keys(dynamicCitiesMap).find(c => c.toLowerCase() === selectedCity.toLowerCase());
    const staticList = normalizedKey ? dynamicCitiesMap[normalizedKey] : [];

    const dbAreas = totalProperties
      .filter(p => p.city?.toLowerCase() === selectedCity.toLowerCase())
      .map(p => p.area || p.locality)
      .filter(Boolean);

    return Array.from(new Set([...staticList, ...dbAreas]));
  };

  return (
    <div className="min-h-screen bg-white">
      <WebsiteNavbar />

      <main className="min-h-screen">
{/* --- BREADCRUMBS BAR --- */}
<div className="border-b border-slate-200/90 py-2 bg-gradient-to-r from-[#EFF6F9] via-[#F4F8FA] to-[#F0F6F8]">
  <div className="w-full pl-1.5 sm:pl-2 md:pl-3 pr-3 sm:pr-4 md:pr-5 lg:pr-6 flex items-center justify-start text-xs font-semibold text-slate-500 gap-2 flex-wrap">
    <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
    <Link to="/properties" className="hover:text-teal-600 transition-colors">Properties</Link>
    {initialCity && (
      <>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-bold">{initialCity}</span>
      </>
    )}
    {!initialCity && initialType && (
      <>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-bold">{initialType}</span>
      </>
    )}
    {!initialCity && !initialType && (
      <><ChevronRight className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-800 font-bold">All Properties</span></>
    )}
  </div>
</div>

{/* --- DYNAMIC HERO HEADER (based on URL only — compact on mobile) --- */}
{(initialCity || initialType) ? (
  <div className="relative w-full py-3 md:py-5 bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/40 border-b border-slate-200 overflow-hidden">
    <div className="w-full pl-1.5 sm:pl-2 md:pl-3 pr-3 sm:pr-4 md:pr-5 lg:pr-6 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 z-10 relative">
      <div className="flex-1 text-left max-w-2xl">
        <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-1 sm:mb-2">
          {initialCity && initialType
            ? <>{initialType} in <span className="text-teal-600">{initialCity}</span></>
            : initialCity
              ? <>Properties in <span className="text-teal-600">{initialCity}</span></>
              : <>Find the Perfect <span className="text-teal-600">{initialType}</span> That Feels Like Home</>
          }
        </h1>
        <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 font-semibold leading-tight sm:leading-snug mb-2 sm:mb-3">
          {initialCity
            ? `Find verified PGs, Hostels, Co-living spaces and Apartments in ${initialCity}. Smart Bidding. 100% Verified.`
            : `Discover verified ${(initialType || 'properties').toLowerCase()}s across top cities. Smart Bidding. 100% Verified.`
          }
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-teal-700 text-[10px] font-extrabold shadow-2xs">
            <Shield className="w-3 h-3 text-teal-600" /><span>Smart Bidding</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-emerald-700 text-[10px] font-extrabold shadow-2xs">
            <Check className="w-3 h-3 text-emerald-600" /><span>Verified Properties</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-amber-700 text-[10px] font-extrabold shadow-2xs">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" /><span>Trusted by Students</span>
          </div>
        </div>
      </div>
      {/* Right photo card */}
      <div className="hidden md:block relative w-[260px] lg:w-[300px] h-32 rounded-2xl overflow-hidden shadow-md border border-slate-200 shrink-0">
        <img
          src={initialCity
            ? `https://source.unsplash.com/featured/600x300/?${encodeURIComponent(initialCity)},city`
            : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop"}
          alt={initialCity || initialType || "Properties"}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          {initialCity && <div className="flex items-center gap-1 text-[10px] font-black mb-0.5"><MapPin className="w-3 h-3" />{initialCity}{initialCity === 'Kota' ? ', Rajasthan' : ''}</div>}
          <div className="text-sm font-black">{initialCity ? `25,000+ Students` : `Top ${initialType || 'Properties'}`}</div>
          <div className="text-[9px] text-white/80 font-medium">Trust Roomhy in {initialCity || 'top cities'}</div>
        </div>
      </div>
    </div>
  </div>
) : null}




        <section className="py-3 md:py-4 bg-white">
          <div className="w-full pl-1 sm:pl-1.5 md:pl-2 pr-3 sm:pr-4 md:pr-5 lg:pr-6">

            {/* Top Bidding banner removed per user request */}

            {/* Mobile Filter & Sort Trigger */}
            <div className="lg:hidden flex items-center justify-between gap-2 mb-3">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 text-gray-700 font-medium"
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
                  className="w-full flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 text-gray-700 font-medium"
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
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${sortBy === option ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-700'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-4 lg:gap-5 items-start">
              {/* Left Sidebar - Filters - Desktop: Always visible, Mobile: Overlay */}
              {/* Mobile Filter Overlay Backdrop */}
              {mobileFilterOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setMobileFilterOpen(false)}
                />
              )}

              <aside className={`
                w-full shrink-0 lg:static lg:block lg:z-auto lg:transform-none lg:h-auto
                fixed top-0 left-0 w-[85%] max-w-[290px] h-full max-h-screen z-50 transform transition-transform duration-300 ease-in-out bg-white shadow-2xl lg:shadow-none lg:bg-transparent
                ${mobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              `}>
                <div
                  className="lg:sticky lg:top-[75px] w-full overflow-hidden lg:h-[calc(100vh-95px)] flex flex-col justify-between"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D8E7E8',
                    borderRadius: '8px',
                    boxShadow: '0 2px 12px 0 rgba(15,159,145,0.08)',
                  }}
                >
                  {/* Header — soft blue→mint gradient, 46px */}
                  <div
                    className="flex items-center justify-between px-3.5"
                    style={{
                      height: '46px',
                      background: 'linear-gradient(135deg, #D9F0FF 0%, #DDF8F2 55%, #E4FAF5 100%)',
                      borderBottom: '1px solid #C8E9E3',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal style={{ width: '16px', height: '16px', color: '#0F9F91', flexShrink: 0 }} />
                      <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Filters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCity('');
                          setSelectedArea('');
                          setSelectedType('');
                          setSelectedGender('');
                          setMinPrice('');
                          setMaxPrice('');
                          setSelectedColleges([]);
                          setSelectedRoomTypes([]);
                          setSelectedAmenities([]);
                        }}
                        style={{
                          fontSize: '11.5px', fontWeight: 700, color: '#0F9F91',
                          background: '#FFFFFF', border: '1px solid #A8DDD7',
                          borderRadius: '999px', padding: '3px 12px',
                          cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F0FBF8'; e.currentTarget.style.borderColor = '#0F9F91'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#A8DDD7'; }}
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileFilterOpen(false)}
                        className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded"
                        title="Close Filters"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filter body — compact & perfectly fitted on 1 screen */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2" style={{ background: '#FFFFFF' }}>

                    {/* 1. CITY */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2.5px' }}>
                        <MapPin style={{ width: '13.5px', height: '13.5px', color: '#0F9F91', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>City</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCity}
                          onChange={(e) => {
                            const newCity = e.target.value;
                            setSelectedCity(newCity);
                            setSelectedArea('');
                          }}
                          style={{
                            width: '100%', height: '34px', borderRadius: '6px',
                            border: `1px solid ${selectedCity ? '#62CFC0' : '#DCE7EF'}`,
                            background: selectedCity ? '#F0FBF8' : '#FFFFFF',
                            color: selectedCity ? '#087F73' : '#334155',
                            fontSize: '11.5px', fontWeight: 600,
                            padding: '0 28px 0 10px', appearance: 'none',
                            cursor: 'pointer', outline: 'none',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          <option value="">All Cities</option>
                          {/* Always include URL city even before properties load */}
                          {initialCity && !Object.keys(dynamicCitiesMap).some(c => c.toLowerCase() === initialCity.toLowerCase()) && (
                            <option key={initialCity} value={initialCity}>{initialCity}</option>
                          )}
                          {Object.keys(dynamicCitiesMap).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* 2. LOCALITY / AREA */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2.5px' }}>
                        <Building2 style={{ width: '13.5px', height: '13.5px', color: '#0F9F91', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Locality / Area</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedArea}
                          onChange={(e) => setSelectedArea(e.target.value)}
                          style={{
                            width: '100%', height: '34px', borderRadius: '6px',
                            border: `1px solid ${selectedArea ? '#62CFC0' : '#DCE7EF'}`,
                            background: selectedArea ? '#F0FBF8' : '#FFFFFF',
                            color: selectedArea ? '#087F73' : '#334155',
                            fontSize: '11.5px', fontWeight: 600,
                            padding: '0 28px 0 10px', appearance: 'none',
                            cursor: 'pointer', outline: 'none',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          <option value="">All Localities {selectedCity ? `in ${selectedCity}` : ''}</option>
                          {/* Always include URL area even before properties load */}
                          {initialArea && !displayLocalities.some(l => l.name.toLowerCase() === initialArea.toLowerCase()) && (
                            <option key={initialArea} value={initialArea}>{initialArea}</option>
                          )}
                          {displayLocalities.map(loc => (
                            <option key={loc.name} value={loc.name}>
                              {loc.name} {loc.count > 0 ? `(${loc.count})` : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* 3. PROPERTY TYPE */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2.5px' }}>
                        <Home style={{ width: '13.5px', height: '13.5px', color: '#0F9F91', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Property Type</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value)}
                          style={{
                            width: '100%', height: '34px', borderRadius: '6px',
                            border: `1px solid ${selectedType ? '#62CFC0' : '#DCE7EF'}`,
                            background: selectedType ? '#F0FBF8' : '#FFFFFF',
                            color: selectedType ? '#087F73' : '#334155',
                            fontSize: '11.5px', fontWeight: 600,
                            padding: '0 28px 0 10px', appearance: 'none',
                            cursor: 'pointer', outline: 'none',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          <option value="">All Property Types</option>
                          <option value="PG">PG (Paying Guest)</option>
                          <option value="Hostel">Hostels</option>
                          <option value="Co-living">Co-living</option>
                          <option value="Apartment">Apartments</option>
                        </select>
                        <ChevronDown style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* 4. GENDER / CATEGORY */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2.5px' }}>
                        <Users style={{ width: '13.5px', height: '13.5px', color: '#0F9F91', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Gender / Category</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedGender}
                          onChange={(e) => setSelectedGender(e.target.value)}
                          style={{
                            width: '100%', height: '34px', borderRadius: '6px',
                            border: `1px solid ${selectedGender ? '#62CFC0' : '#DCE7EF'}`,
                            background: selectedGender ? '#F0FBF8' : '#FFFFFF',
                            color: selectedGender ? '#087F73' : '#334155',
                            fontSize: '11.5px', fontWeight: 600,
                            padding: '0 28px 0 10px', appearance: 'none',
                            cursor: 'pointer', outline: 'none',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          <option value="">All Genders (Boys / Girls / Co-ed)</option>
                          <option value="Boys">Boys Only</option>
                          <option value="Girls">Girls Only</option>
                          <option value="Co-ed">Co-ed</option>
                        </select>
                        <ChevronDown style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* 5. PRICE FILTER - single smart input */}
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag style={{ width: '13.5px', height: '13.5px', color: '#0F9F91', flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Price Filter</span>
                        </label>
                        {(minPrice || maxPrice || priceInputText) && (
                          <button
                            type="button"
                            onClick={() => { setMinPrice(''); setMaxPrice(''); setPriceInputText(''); }}
                            className="text-[10px] font-bold text-teal-600 hover:text-teal-800 underline ml-auto"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <input
                        ref={priceInputRef}
                        type="text"
                        value={priceInputText}
                        placeholder={pricePlaceholder}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setPriceInputText(raw);
                          const trimmed = raw.trim();
                          if (!trimmed) { setMinPrice(''); setMaxPrice(''); return; }
                          if (trimmed.startsWith('<')) {
                            setMinPrice(''); setMaxPrice(trimmed.slice(1).trim());
                          } else if (trimmed.startsWith('>')) {
                            setMinPrice(trimmed.slice(1).trim()); setMaxPrice('');
                          } else if (trimmed.includes('-')) {
                            const [a, b] = trimmed.split('-');
                            setMinPrice(a.trim()); setMaxPrice(b.trim());
                          } else if (!isNaN(trimmed) && trimmed !== '') {
                            const n = parseInt(trimmed);
                            setMinPrice(String(Math.max(0, n - 500)));
                            setMaxPrice(String(n + 500));
                          }
                        }}
                        style={{
                          width: '100%', height: '34px', borderRadius: '6px',
                          border: `1px solid ${(minPrice || maxPrice) ? '#62CFC0' : '#DCE7EF'}`,
                          background: (minPrice || maxPrice) ? '#F0FBF8' : '#FFFFFF',
                          color: '#334155',
                          fontSize: '11.5px', fontWeight: 600,
                          padding: '0 10px', outline: 'none',
                          transition: 'border-color 0.15s, background 0.15s',
                          boxSizing: 'border-box',
                        }}
                      />

                      {/* Quick Format Helper Buttons (< Max, > Min, Min-Max) */}
                      <div className="mt-1 space-y-1">
                        <div className="text-[10px] font-bold text-slate-500">Quick Format:</div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPriceInputText('<');
                              setPricePlaceholder('Enter Max Price (e.g. <8000)');
                              if (priceInputRef.current) priceInputRef.current.focus();
                            }}
                            className={`px-1 py-1 rounded border text-[10px] font-black transition-all text-center ${
                              priceInputText.startsWith('<')
                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                : 'bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border-slate-200 hover:border-teal-200'
                            }`}
                            title="Below Max Price (e.g. <8000)"
                          >
                            &lt; Max
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPriceInputText('>');
                              setPricePlaceholder('Enter Min Price (e.g. >5000)');
                              if (priceInputRef.current) priceInputRef.current.focus();
                            }}
                            className={`px-1 py-1 rounded border text-[10px] font-black transition-all text-center ${
                              priceInputText.startsWith('>')
                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                : 'bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border-slate-200 hover:border-teal-200'
                            }`}
                            title="Above Min Price (e.g. >5000)"
                          >
                            &gt; Min
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPriceInputText('');
                              setMinPrice(''); setMaxPrice('');
                              setPricePlaceholder('Enter Range (e.g. 3000-8000)');
                              if (priceInputRef.current) priceInputRef.current.focus();
                            }}
                            className={`px-1 py-1 rounded border text-[9.5px] font-black transition-all text-center ${
                              pricePlaceholder.includes('Range') || priceInputText.includes('-')
                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                : 'bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border-slate-200 hover:border-teal-200'
                            }`}
                            title="Price Range (e.g. 3000-8000)"
                          >
                            Min-Max
                          </button>
                        </div>
                      </div>

                      {(minPrice || maxPrice) && (
                        <p style={{ fontSize: '10px', color: '#0F9F91', marginTop: '2px', fontWeight: 800 }}>
                          Active: {minPrice && maxPrice ? `₹${minPrice} – ₹${maxPrice}` : minPrice ? `≥ ₹${minPrice}` : `≤ ₹${maxPrice}`}
                        </p>
                      )}
                    </div>

                    {/* 6. AMENITIES (Multi-Select Dropdown with Checkboxes) */}
                    <div className="relative">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <label style={{ display: 'flex', items: 'center', gap: '6px' }}>
                          <Sparkles style={{ width: '13.5px', height: '13.5px', color: '#0F9F91', flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Amenities</span>
                        </label>
                        {selectedAmenities.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedAmenities([])}
                            className="text-[10px] font-bold text-teal-600 hover:text-teal-800 underline ml-auto"
                          >
                            Clear ({selectedAmenities.length})
                          </button>
                        )}
                      </div>

                      {/* Dropdown Select Button (34px) */}
                      <button
                        type="button"
                        onClick={() => setAmenitiesDropdownOpen(!amenitiesDropdownOpen)}
                        style={{
                          width: '100%', height: '34px', borderRadius: '6px',
                          border: `1px solid ${selectedAmenities.length > 0 ? '#62CFC0' : '#DCE7EF'}`,
                          background: selectedAmenities.length > 0 ? '#F0FBF8' : '#FFFFFF',
                          color: selectedAmenities.length > 0 ? '#087F73' : '#334155',
                          fontSize: '11.5px', fontWeight: 600,
                          padding: '0 28px 0 10px',
                          outline: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          position: 'relative',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <span className="truncate">
                          {selectedAmenities.length === 0
                            ? 'All Amenities'
                            : `${selectedAmenities.length} Selected (${selectedAmenities.slice(0, 2).join(', ')}${selectedAmenities.length > 2 ? '...' : ''})`
                          }
                        </span>
                        <ChevronDown style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) rotate(${amenitiesDropdownOpen ? 180 : 0}deg)`, transition: 'transform 0.15s' }} />
                      </button>

                      {/* Floating Dropdown Popup with Checkboxes */}
                      {amenitiesDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setAmenitiesDropdownOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-2 max-h-[220px] overflow-y-auto space-y-1 animate-in">
                            {displayAmenities.length === 0 ? (
                              <div className="text-[11px] text-slate-400 italic p-1">No amenities available</div>
                            ) : (
                              displayAmenities.map(a => {
                                const isChecked = selectedAmenities.includes(a.name);
                                return (
                                  <label
                                    key={a.name}
                                    className={`flex items-center justify-between text-[11px] font-semibold px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                                      isChecked ? 'bg-teal-50 text-teal-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setSelectedAmenities(selectedAmenities.filter(item => item !== a.name));
                                          } else {
                                            setSelectedAmenities([...selectedAmenities, a.name]);
                                          }
                                        }}
                                        className="w-3.5 h-3.5 accent-teal-600 rounded cursor-pointer shrink-0"
                                      />
                                      <span className="truncate">{a.name}</span>
                                    </div>
                                    {a.count > 0 && (
                                      <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ml-1 ${
                                        isChecked ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        {a.count}
                                      </span>
                                    )}
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* 7. NEARBY COLLEGE / INSTITUTE */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2.5px' }}>
                        <GraduationCap style={{ width: '13.5px', height: '13.5px', color: '#0F9F91', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Nearby College / Institute</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedColleges[0] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) { setSelectedColleges([]); } else { setSelectedColleges([val]); }
                          }}
                          style={{
                            width: '100%', height: '34px', borderRadius: '6px',
                            border: `1px solid ${selectedColleges.length > 0 ? '#62CFC0' : '#DCE7EF'}`,
                            background: selectedColleges.length > 0 ? '#F0FBF8' : '#FFFFFF',
                            color: selectedColleges.length > 0 ? '#087F73' : '#334155',
                            fontSize: '11.5px', fontWeight: 600,
                            padding: '0 28px 0 10px', appearance: 'none',
                            cursor: 'pointer', outline: 'none',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          <option value="">{collegesLoading && allColleges.length === 0 ? '⏳ Loading...' : 'All Colleges & Institutes'}</option>
                          {allColleges.length === 0 && !collegesLoading ? (
                            <option disabled value="">No colleges found</option>
                          ) : (
                            allColleges.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))
                          )}
                        </select>
                        {collegesLoading ? (
                          <RefreshCw style={{ width: '11px', height: '11px', color: '#0F9F91', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} className="animate-spin" />
                        ) : (
                          <ChevronDown style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Button: Bid Now in Bidding Mode, else Bid Now + Reset Filters */}
                    {isBiddingMode ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={handleDesktopBidSubmit}
                          disabled={biddingSubmitting || totalProperties.length === 0}
                          style={{
                            flex: 1,
                            height: '35px',
                            borderRadius: '6px',
                            background: 'linear-gradient(90deg, #BFD8FF 0%, #C8F2E8 100%)',
                            border: 'none',
                            color: '#0F172A',
                            fontSize: '12px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'opacity 0.15s',
                          }}
                          className="hover:opacity-85 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {biddingSubmitting ? (
                            <>
                              <RefreshCw style={{ width: '14px', height: '14px', color: '#0F9F91' }} className="animate-spin" />
                              <span>Placing Bids...</span>
                            </>
                          ) : (
                            <>
                              <Send style={{ width: '14px', height: '14px', color: '#0F9F91' }} />
                              <span>Bid Now ({totalProperties.length} Stays)</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          title="Reset Filters"
                          onClick={() => {
                            setSelectedCity('');
                            setSelectedArea('');
                            setSelectedType('');
                            setSelectedGender('');
                            setMinPrice('');
                            setMaxPrice('');
                            setPriceInputText('');
                            setSelectedColleges([]);
                            setSelectedRoomTypes([]);
                            setSelectedAmenities([]);
                          }}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-auto p-3 border-t border-slate-100 bg-white shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPropertyForBid(null);
                            setShowBidModal(true);
                          }}
                          style={{
                            width: '100%',
                            height: '38px',
                            borderRadius: '8px',
                            background: '#0FA596',
                            border: '1px solid #0FA596',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease-in-out',
                          }}
                          className="hover:bg-teal-700 active:scale-95 transition-all shadow-md cursor-pointer"
                        >
                          <Zap style={{ width: '15px', height: '15px', fill: '#FFFFFF' }} />
                          <span>Bid Now</span>
                        </button>
                      </div>
                    )}

                    {/* Mobile only: Apply button */}
                    <div className="lg:hidden pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setMobileFilterOpen(false)}
                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-md transition-all text-center"
                      >
                        Show Properties ({totalCount})
                      </button>
                    </div>

                  </div>
                </div>
              </aside>



              {/* Right Content - Properties */}
              <div className="flex-1 min-w-0 lg:sticky lg:top-[85px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-2 no-scrollbar">
                


                <div className="flex items-center justify-between mb-1.5 py-0.5 px-0">
                  <div className="hidden md:block text-xs font-extrabold text-slate-700">
                    Showing {((currentPage - 1) * propertiesPerPage) + 1} to {Math.min(currentPage * propertiesPerPage, totalCount)} of {totalCount} properties {selectedCity ? `in ${selectedCity}` : ''}
                  </div>
                  {/* Desktop Custom Sort */}
                  <div className="hidden md:block relative min-w-[180px]">
                    <button 
                      onClick={() => setShowSort(!showSort)}
                      className="w-full flex items-center justify-between gap-2 bg-white px-3 py-1 rounded-md border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <span>Sort by: {sortBy}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showSort ? 'rotate-180' : ''}`} />
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

                <div className="flex flex-col gap-1.5 bg-white pb-16 md:pb-0">
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

                  {/* City Quick Links for Type Pages — e.g. PG in Kota, PG in Jaipur */}
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      <span>{selectedType} in Top Cities</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        { city: 'Kota', image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300&q=70' },
                        { city: 'Jaipur', image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=300&q=70' },
                        { city: 'Delhi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=70' },
                        { city: 'Indore', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=300&q=70' },
                        { city: 'Bhopal', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&q=70' },
                        { city: 'Sikar', image: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=300&q=70' }
                      ].map((item) => (
                        <Link
                          key={item.city}
                          to={`/${getTypeSlug(selectedType)}-in-${slugify(item.city)}`}
                          className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50/60 hover:border-teal-200 transition-all shadow-2xs"
                        >
                          <img src={item.image} alt={item.city} className="w-9 h-9 object-cover rounded-lg shrink-0" />
                          <div className="overflow-hidden">
                            <span className="block text-xs font-bold text-slate-800 group-hover:text-teal-700 truncate">{item.city}</span>
                            <span className="block text-[10px] font-semibold text-teal-600">{selectedType} →</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

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

      {/* Bid / Requirement Confirmation Result Modal */}
      {bidResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className={`px-6 pt-6 pb-4 bg-gradient-to-br ${bidResultModal.bgGradient} border-b ${bidResultModal.borderColor} relative shrink-0`}>
              <button
                onClick={() => setBidResultModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm bg-white shrink-0">
                  {bidResultModal.type === 'exact' ? '✅' : bidResultModal.type === 'gap' ? '⚡' : '📌'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{bidResultModal.title}</h3>
                  <p className="text-xs font-bold mt-0.5" style={{ color: bidResultModal.accentColor }}>{bidResultModal.subtitle}</p>
                </div>
              </div>
              {bidResultModal.budgetLabel && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border" style={{ borderColor: `${bidResultModal.accentColor}40` }}>
                  <span className="text-[10px] font-bold text-slate-500">Your Budget / Offer:</span>
                  <span className="text-xs font-black" style={{ color: bidResultModal.accentColor }}>{bidResultModal.budgetLabel}</span>
                </div>
              )}
            </div>

            {/* Steps — What Happens Next / Aage Kya Hoga */}
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-3.5">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">What Happens Next?</p>
              {bidResultModal.steps?.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 bg-slate-50 border border-slate-100">
                    {step.icon}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black rounded-full px-1.5 py-0.5 text-white" style={{ background: bidResultModal.accentColor }}>{idx + 1}</span>
                      <p className="text-xs font-extrabold text-slate-800">{step.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}

              {/* Badges */}
              {bidResultModal.badges && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {bidResultModal.badges.map((b, idx) => (
                    <span key={idx} className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border" style={{ color: bidResultModal.accentColor, borderColor: `${bidResultModal.accentColor}40`, background: `${bidResultModal.accentColor}10` }}>
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="px-6 pb-6 pt-3 border-t border-slate-100 shrink-0 flex flex-col gap-2">
              {bidResultModal.ctaLabel && bidResultModal.ctaPath && (
                <button
                  onClick={() => {
                    setBidResultModal(null);
                    navigate(bidResultModal.ctaPath);
                  }}
                  className="w-full py-3.5 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${bidResultModal.accentColor}, ${bidResultModal.accentColor}cc)` }}
                >
                  {bidResultModal.ctaLabel}
                </button>
              )}
              <button
                onClick={() => setBidResultModal(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Close & Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
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
    if (!isNaN(dbRating) && dbRating > 0) {
      return dbRating.toFixed(1);
    }
    return '0';
  })();

  const propSlug = slugify(property.name || property.title || property.id);
  const detailPath = `/property-details/${propSlug}`;

  return (
    <div
      className="bg-white hover:border-[#0FA596]/40 transition-all duration-300 overflow-hidden mb-1.5 group"
      style={{
        background: '#FFFFFF',
        border: '1px solid #DCE7EC',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
      }}
    >
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

            {/* Bottom Left Rating Badge */}
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-slate-900 px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-extrabold shadow-sm border border-slate-200/60">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{displayRating}</span>
              <span className="text-slate-400 font-semibold">({property.reviewsCount || property.reviews?.length || 0})</span>
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
            {/* Top Right Heart Wishlist Button - REMOVED */}
          </div>
        </div>

        {/* Details Below Photos */}
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 line-clamp-1 leading-snug">
            {property.name}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
            {property.area ? `${property.area}, ` : ''}{property.location || property.city}
          </p>

          {/* Social Proof / Urgency text (⚡ 5+ students booked recently) */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-1">
            <Zap className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
            <span>5+ students booked recently</span>
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
      <div className="hidden lg:flex flex-col lg:flex-row h-[185px]">
        {/* Left Image Section - OYO Style Main Photo + Right Thumbnails */}
        <div className={`relative w-full ${displayImages.length > 1 ? 'lg:w-[260px] xl:w-[280px]' : 'lg:w-[200px] xl:w-[220px]'} h-[185px] shrink-0 bg-slate-100 p-0.5 flex gap-0.5 rounded-l-[12px] overflow-hidden border-r border-slate-100`}>
          {/* Main Photo (Left) */}
          <div className="relative flex-1 h-full rounded-l-[10px] overflow-hidden group/img cursor-pointer" onClick={() => navigate(detailPath)}>
            <img
              src={getOptimizedImageUrl(displayImages[currentImageIndex], 600)}
              alt={property.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
              loading="lazy"
            />
            
            {/* Top Left VERIFIED Badge */}
            <div className="absolute top-2 left-2 bg-[#0FA89C] text-white text-[9.5px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider z-10">
              <Check className="w-3 h-3 text-white stroke-[3]" />
              <span>Verified</span>
            </div>
          </div>

          {/* OYO-Style Right-Side Thumbnails Column */}
          {displayImages.length > 1 && (
            <div className="w-[72px] sm:w-[78px] h-full flex flex-col gap-0.5 shrink-0 relative">

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
                      currentImageIndex === actualIndex ? 'border-[#0FA89C] ring-1 ring-[#0FA89C]' : 'border-[#DDE9E8] opacity-85 hover:opacity-100'
                    }`}
                  >
                    <img src={getOptimizedImageUrl(img, 150)} alt="thumb" className="w-full h-full object-cover" />
                    {isLastItem && extraCount > 0 && (
                      <div className="absolute inset-0 bg-[#102A43]/80 text-white font-black text-[10.5px] flex items-center justify-center backdrop-blur-[1px]">
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
        <div className="flex-1 pt-2 px-4 pb-2.5 flex flex-col justify-between min-w-0 h-full">
          <div>
            {/* Title */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <Link
                to={detailPath}
                onClick={() => trackPropertyClick(property.id)}
                className="text-lg sm:text-xl font-bold text-[#102A43] line-clamp-1 tracking-tight"
              >
                {property.name}
              </Link>
            </div>

            {/* Location Subtitle & Nearby Landmark */}
            <div className="flex items-center gap-2 mb-2 text-base font-semibold text-[#60758A] truncate">
              <span className="flex items-center gap-1 truncate shrink-0">
                <MapPin className="w-5 h-5 text-[#0FA89C] shrink-0" />
                <span>{property.area ? `${property.area}, ` : ''}{property.location || property.city}</span>
              </span>
              {(property.landmark || property.nearInstitute || property.nearby) && (
                <span className="flex items-center gap-1 text-[#0FA89C] font-bold bg-[#F3FBFA] border border-[#DDE9E8] px-2.5 py-0.5 rounded-md truncate shrink text-xs">
                  <GraduationCap className="w-4 h-4 text-[#0FA89C] shrink-0" />
                  <span>{property.landmark || property.nearInstitute || property.nearby}</span>
                </span>
              )}
            </div>

            {/* Amenity Icons Row — Clean List */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold text-[#102A43] mb-2">
              <span className="inline-flex items-center gap-1 text-[#102A43]">
                <Check className="w-4.5 h-4.5 text-[#0FA89C] stroke-[2.5]" /> WiFi
              </span>
              <span className="inline-flex items-center gap-1 text-[#102A43]">
                <Check className="w-4.5 h-4.5 text-[#0FA89C] stroke-[2.5]" /> AC
              </span>
              <span className="inline-flex items-center gap-1 text-[#102A43]">
                <Check className="w-4.5 h-4.5 text-[#0FA89C] stroke-[2.5]" /> Meals
              </span>
              <span className="inline-flex items-center gap-1 text-[#102A43]">
                <Check className="w-4.5 h-4.5 text-[#0FA89C] stroke-[2.5]" /> TV
              </span>
              <span className="inline-flex items-center gap-1 text-[#102A43]">
                <Check className="w-4.5 h-4.5 text-[#0FA89C] stroke-[2.5]" /> Daily Housekeeping
              </span>
            </div>

            {/* Key Feature Highlights Bar — Neutral Chips with Subtle Borders */}
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-[#102A43]">
              <span className="inline-flex items-center gap-1.5 bg-[#F7FAFA] border border-[#DDE9E8] px-3 py-1 rounded-md text-[#102A43]">
                <Shield className="w-4 h-4 text-[#60758A]" /> {property.category || property.gender || 'Boys PG'}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#F7FAFA] border border-[#DDE9E8] px-3 py-1 rounded-md text-[#102A43]">
                <Bed className="w-4 h-4 text-[#60758A]" /> {property.sharing || '2 Sharing'}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#F7FAFA] border border-[#DDE9E8] px-3 py-1 rounded-md text-[#102A43]">
                <Building2 className="w-4 h-4 text-[#60758A]" /> {property.type || 'PG'}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#F3FBFA] border border-[#DDE9E8] px-3 py-1 rounded-md text-[#0FA89C]">
                <Zap className="w-4 h-4 text-[#0FA89C] fill-[#0FA89C]" /> Smart Bidding
              </span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="pt-2 border-t border-[#DDE9E8] flex items-center gap-4 text-xs font-bold text-[#60758A]">
            <div className="flex items-center gap-1.5 text-[#0FA89C]">
              <Check className="w-3.5 h-3.5 stroke-[3] text-[#0FA89C]" />
              <span>Smart Bidding</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#0FA89C]">
              <Check className="w-3.5 h-3.5 stroke-[3] text-[#0FA89C]" />
              <span>Instant Booking</span>
            </div>
          </div>
        </div>

        {/* Right Side Price & Buttons Section */}
        <div className="w-full lg:w-[215px] p-4 bg-white border-t lg:border-t-0 lg:border-l border-[#DDE9E8] flex flex-row lg:flex-col justify-between items-center lg:items-end shrink-0 h-full">
          {/* Top Right Rating Badge */}
          <div className="w-full flex justify-end">
            {displayRating && (
              <div className="bg-[#0FA89C] text-white px-2.5 py-1 rounded-md flex items-center gap-1 text-xs font-black shrink-0 shadow-xs">
                <span>{displayRating}</span>
                <Star className="w-3.5 h-3.5 fill-white stroke-none" />
              </div>
            )}
          </div>

          {/* Price Block */}
          <div className="text-left lg:text-right my-auto">
            <div className="flex items-baseline gap-1.5 justify-start lg:justify-end">
              {hasDiscount && (
                <span className="text-xs text-slate-400 font-bold line-through">₹{originalPrice.toLocaleString()}</span>
              )}
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{property.price?.toLocaleString()}
              </div>
            </div>
            <div className="text-xs font-bold text-slate-500">
              /month <span className="text-slate-400 font-normal">+ taxes</span>
            </div>
          </div>

          {/* Buttons Row */}
          <div className="flex flex-row items-center justify-end gap-2 w-full shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                trackPropertyClick(property.id);
                navigate(detailPath);
              }}
              style={{
                height: '36px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #DDE9E8',
                color: '#102A43',
                fontSize: '12px',
                fontWeight: 800,
                padding: '0 10px',
                transition: 'all 0.15s ease-in-out',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              className="flex-1 flex items-center justify-center text-center whitespace-nowrap cursor-pointer"
            >
              View Details
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onBookNow) onBookNow();
              }}
              style={{
                height: '36px',
                borderRadius: '8px',
                background: '#0FA89C',
                border: '1px solid #0FA89C',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 800,
                padding: '0 10px',
                transition: 'all 0.15s ease-in-out',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#0D9388'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(15,168,156,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#0FA89C'; e.currentTarget.style.boxShadow = 'none'; }}
              className="flex-1 flex items-center justify-center text-center whitespace-nowrap cursor-pointer"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
