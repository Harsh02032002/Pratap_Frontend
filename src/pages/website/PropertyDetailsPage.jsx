import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchPropertyByVisitId, getPropertyReviews, getPropertyReviewStats, checkUserReview, submitReview, trackPropertyView, trackPropertyClick, fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

// Extract city from property name (e.g., "HOSTEL - Vastrapur, Ahmedabad" -> "Ahmedabad")
const extractCityFromName = (name) => {
  if (!name) return null;
  const parts = name.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return null;
};
import {
  ChevronLeft, MapPin, Users, Bed, Wifi, Wind, Droplet,
  Phone, Mail, Star, Share2, GraduationCap, Navigation, ExternalLink
} from "lucide-react";
import {
  PropertyGallery,
  PropertyHeader,
  HighlightsSection,
  DescriptionSection,
  OffersSection,
  ReviewsSection,
  NearbySection,
  CompareSection,
  StickyCTA,
  PricingBreakdown,
  RoomTypesSection,
} from "../../components/website/propertyDetails";
import PropertyViewsGallery from "../../components/website/propertyDetails/PropertyViewsGallery";
import AmenitiesSection from "../../components/website/propertyDetails/AmenitiesSection";
import ExclusiveBenefitsSection from "../../components/website/propertyDetails/ExclusiveBenefitsSection";
import QuickBookingModal from "../../components/website/QuickBookingModal";

// Static sample data for Vercel deployment - 10 Properties
const staticPropertiesData = [
  {
    _id: "static1",
    title: "Roomhy Boys PG - Kota",
    name: "Roomhy Boys PG - Kota",
    description: "Premium paying guest accommodation for boys near coaching centers with all modern amenities. Spacious rooms with study tables, high-speed WiFi, and nutritious food.",
    address: "Talwandi, Kota, Rajasthan 324005, India",
    locationCode: "KOT",
    latitude: 25.2138,
    longitude: 75.8648,
    propertyType: "pg", gender: "male", monthlyRent: 8000, totalRooms: 20, bedsPerRoom: 2, price: 8000,
    rating: 4.5,
    location: "Kota",
    propertyViews: [
      { label: "Facade", images: ["https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Modern Building Exterior" },
      { label: "Reception", images: ["https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Welcoming Lobby Area" },
      { label: "Bedroom", images: ["https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Spacious Student Rooms" },
      { label: "Kitchen", images: ["https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Clean & Modern Kitchen" }
    ],
    amenities: [
      { name: "Near Coaching Centers", icon: "graduation-cap", category: "popular" },
      { name: "Student Friendly", icon: "users", category: "popular" },
      { name: "Budget Friendly", icon: "dollar-sign", category: "popular" },
      { name: "High-Speed WiFi", icon: "wifi", category: "basic" },
      { name: "Air Conditioning", icon: "wind", category: "basic" },
      { name: "Study Table", icon: "check", category: "basic" },
      { name: "Power Backup", icon: "zap", category: "basic" },
      { name: "Water Supply", icon: "droplet", category: "basic" },
      { name: "Security", icon: "shield", category: "basic" }
    ],
    exclusiveBenefits: [
      { title: "Free Maintenance", description: "No maintenance charges", icon: "gift" }
    ],
    facilities: { wifi: true, ac: true, food: true, laundry: true }
  },
  {
    _id: "static2",
    title: "Roomhy Girls Hostel - Indore",
    name: "Roomhy Girls Hostel - Indore",
    description: "Safe and secure girls hostel with 24/7 security and homely atmosphere. Located in Vijay Nagar with easy access to colleges.",
    address: "Vijay Nagar, Indore, Madhya Pradesh 452010",
    locationCode: "IND",
    latitude: 22.7196, longitude: 75.8577,
    propertyType: "hostel", gender: "female", monthlyRent: 10000, price: 10000,
    rating: 4.8,
    location: "Indore",
    propertyViews: [
      { label: "Facade", images: ["https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Main Entrance" },
      { label: "Reception", images: ["https://images.pexels.com/photos/279719/pexels-photo-279719.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "24/7 Managed Reception" },
      { label: "Bedroom", images: ["https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Comfortable Girls Dorm" },
      { label: "Kitchen", images: ["https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Hygienic Dining Area" }
    ],
    amenities: [
      { name: "Girls Safe Area", icon: "shield", category: "popular" },
      { name: "Walking Distance to Metro", icon: "map-pin", category: "popular" },
      { name: "24/7 Food Court", icon: "coffee", category: "popular" },
      { name: "CCTV", icon: "shield", category: "basic" },
      { name: "RO Water", icon: "droplet", category: "basic" },
      { name: "Power Backup", icon: "zap", category: "basic" },
      { name: "Housekeeping", icon: "home", category: "basic" },
      { name: "WiFi", icon: "wifi", category: "basic" }
    ]
  },
  {
    _id: "static3",
    title: "Roomhy Co-living - Jaipur",
    name: "Roomhy Co-living - Jaipur",
    description: "Modern co-living space for professionals and students with fully furnished rooms and community areas.",
    address: "Malviya Nagar, Jaipur, Rajasthan 302017",
    locationCode: "JAI",
    latitude: 26.9124, longitude: 75.7873,
    propertyType: "co-living", gender: "any", monthlyRent: 12000, price: 12000,
    rating: 4.2,
    location: "Jaipur",
    propertyViews: [
      { label: "Facade", images: ["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Modern Co-living Exterior" },
      { label: "Lobby", images: ["https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Community Chill Zone" },
      { label: "Bedroom", images: ["https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Sleek Private Rooms" },
      { label: "Kitchen", images: ["https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600"], description: "Shared Kitchen" }
    ],
    amenities: [
      { name: "IT Professionals Hub", icon: "briefcase", category: "popular" },
      { name: "Premium Location", icon: "star", category: "popular" },
      { name: "Coworking Space", icon: "users", category: "popular" },
      { name: "WiFi", icon: "wifi", category: "basic" },
      { name: "AC", icon: "wind", category: "basic" },
      { name: "Gym", icon: "dumbbell", category: "basic" },
      { name: "Parking", icon: "car", category: "basic" },
      { name: "TV", icon: "tv", category: "basic" }
    ]
  },
  {
    _id: "static4",
    title: "Roomhy Apartments - Delhi",
    description: "Premium 2BHK and 3BHK apartments for families and working professionals with modern amenities.",
    address: "Dwarka, New Delhi, Delhi 110075",
    locationCode: "DEL",
    latitude: 28.6139, longitude: 77.2090,
    ownerLoginId: "DEL001", status: "active", isPublished: true,
    amenities: [
      { name: "Family Friendly", icon: "users", category: "popular" },
      { name: "Premium Location", icon: "star", category: "popular" },
      { name: "Near Metro", icon: "map-pin", category: "popular" },
      { name: "High-Speed WiFi", icon: "wifi", category: "basic" },
      { name: "Modular Kitchen", icon: "coffee", category: "basic" },
      { name: "Power Backup", icon: "zap", category: "basic" },
      { name: "Lift", icon: "check", category: "basic" },
      { name: "Reserved Parking", icon: "car", category: "basic" }
    ],
    exclusiveBenefits: [
      { title: "No Brokerage", description: "Direct booking discount", icon: "star" },
      { title: "Free Maintenance", description: "First 3 months", icon: "gift" }
    ],
    propertyViews: [
      { label: "Building", images: ["https://picsum.photos/800/600?random=7"], description: "Premium apartments" },
      { label: "Kitchen", images: ["https://picsum.photos/800/600?random=8"], description: "Modern kitchen" }
    ],
    propertyType: "apartment", gender: "any", monthlyRent: 25000, totalRooms: 10, bedsPerRoom: 4,
    facilities: { wifi: true, ac: true, food: false, laundry: false, parking: true, gym: true, tv: false, powerBackup: true },
    name: "Roomhy Apartments - Delhi", price: 25000, beds: 40
  },
  {
    _id: "static5",
    title: "Roomhy Student PG - Bhopal",
    description: "Affordable PG for students with study-friendly environment and proximity to educational institutions.",
    address: "MP Nagar, Bhopal, Madhya Pradesh 462016",
    locationCode: "BHO",
    latitude: 23.2599, longitude: 77.4126,
    ownerLoginId: "BHO001", status: "active", isPublished: true,
    amenities: [
      { name: "Near Coaching Centers", icon: "graduation-cap", category: "popular" },
      { name: "Student Friendly", icon: "users", category: "popular" },
      { name: "Budget Friendly", icon: "dollar-sign", category: "popular" },
      { name: "High-Speed WiFi", icon: "wifi", category: "basic" },
      { name: "Study Room", icon: "check", category: "basic" },
      { name: "Mess Facility", icon: "coffee", category: "basic" },
      { name: "Water Purifier", icon: "droplet", category: "basic" },
      { name: "Locker Facility", icon: "shield", category: "basic" }
    ],
    exclusiveBenefits: [
      { title: "Study Groups", description: "Free group study sessions", icon: "star" },
      { title: "Library Access", description: "24/7 study room", icon: "gift" }
    ],
    propertyViews: [
      { label: "Entrance", images: ["https://picsum.photos/800/600?random=9"], description: "Main entrance" },
      { label: "Study Room", images: ["https://picsum.photos/800/600?random=10"], description: "Study area" }
    ],
    propertyType: "pg", gender: "male", monthlyRent: 6000, totalRooms: 30, bedsPerRoom: 3,
    facilities: { wifi: true, ac: false, food: true, laundry: false, parking: false, gym: false, tv: true, powerBackup: true },
    name: "Roomhy Student PG - Bhopal", price: 6000, beds: 90
  },
  {
    _id: "static6",
    title: "Roomhy Luxury PG - Nagpur",
    description: "Luxury PG with premium amenities, AC rooms, and personalized services for executives and professionals.",
    address: "Civil Lines, Nagpur, Maharashtra 440001",
    locationCode: "NAG",
    latitude: 21.1458, longitude: 79.0882,
    ownerLoginId: "NAG001", status: "active", isPublished: true,
    amenities: [
      { name: "Premium Location", icon: "star", category: "popular" },
      { name: "IT Professionals Hub", icon: "briefcase", category: "popular" },
      { name: "Luxury Living", icon: "shield", category: "popular" },
      { name: "High-Speed WiFi", icon: "wifi", category: "basic" },
      { name: "Air Conditioning", icon: "wind", category: "basic" },
      { name: "Mini Fridge", icon: "check", category: "basic" },
      { name: "TV in Room", icon: "tv", category: "basic" },
      { name: "Room Service", icon: "coffee", category: "basic" }
    ],
    exclusiveBenefits: [
      { title: "Premium Amenities", description: "Luxury facilities", icon: "star" },
      { title: "Concierge Service", description: "Personal assistance", icon: "gift" }
    ],
    propertyViews: [
      { label: "Lobby", images: ["https://picsum.photos/800/600?random=11"], description: "Luxury lobby" },
      { label: "Premium Room", images: ["https://picsum.photos/800/600?random=12"], description: "Premium rooms" }
    ],
    propertyType: "pg", gender: "male", monthlyRent: 15000, totalRooms: 12, bedsPerRoom: 2,
    facilities: { wifi: true, ac: true, food: true, laundry: true, parking: true, gym: true, tv: true, powerBackup: true },
    name: "Roomhy Luxury PG - Nagpur", price: 15000, beds: 24
  },
  {
    _id: "static7",
    title: "Roomhy Working Women PG - Jodhpur",
    description: "Safe and comfortable PG for working women with modern amenities and convenient location.",
    address: "Paota, Jodhpur, Rajasthan 342001",
    locationCode: "JOD",
    latitude: 26.2389, longitude: 73.0243,
    ownerLoginId: "JOD001", status: "active", isPublished: true,
    amenities: [
      { name: "Girls Safe Area", icon: "shield", category: "popular" },
      { name: "Working Women Friendly", icon: "users", category: "popular" },
      { name: "Near IT Parks", icon: "map-pin", category: "popular" },
      { name: "High-Speed WiFi", icon: "wifi", category: "basic" },
      { name: "Air Conditioning", icon: "wind", category: "basic" },
      { name: "Security", icon: "shield", category: "basic" },
      { name: "Power Backup", icon: "zap", category: "basic" },
      { name: "Laundry Service", icon: "droplet", category: "basic" }
    ],
    exclusiveBenefits: [
      { title: "Transport Facility", description: "Drop to office", icon: "gift" },
      { title: "Flexible Timings", description: "No entry restrictions", icon: "star" }
    ],
    propertyViews: [
      { label: "Building", images: ["https://picsum.photos/800/600?random=13"], description: "Safe building" },
      { label: "Room", images: ["https://picsum.photos/800/600?random=14"], description: "Comfortable rooms" }
    ],
    propertyType: "pg", gender: "female", monthlyRent: 9000, totalRooms: 18, bedsPerRoom: 2,
    facilities: { wifi: true, ac: true, food: true, laundry: true, parking: false, gym: false, tv: true, powerBackup: true },
    name: "Roomhy Working Women PG - Jodhpur", price: 9000, beds: 36
  },
  {
    _id: "static8",
    title: "Roomhy Budget PG - Mumbai",
    description: "Affordable PG accommodation in Mumbai with basic amenities and good connectivity to local transport.",
    address: "Andheri, Mumbai, Maharashtra 400053",
    locationCode: "MUM",
    latitude: 19.0760, longitude: 72.8777,
    ownerLoginId: "MUM001", status: "active", isPublished: true,
    amenities: [
      { name: "Budget Friendly", icon: "dollar-sign", category: "popular" },
      { name: "Near Metro", icon: "map-pin", category: "popular" },
      { name: "Student Friendly", icon: "users", category: "popular" },
      { name: "WiFi", icon: "wifi", category: "basic" },
      { name: "Common Kitchen", icon: "coffee", category: "basic" },
      { name: "Water Supply", icon: "droplet", category: "basic" },
      { name: "Locker", icon: "shield", category: "basic" },
      { name: "Power Backup", icon: "zap", category: "basic" }
    ],
    exclusiveBenefits: [
      { title: "Best Price", description: "Affordable rates", icon: "star" },
      { title: "No Hidden Charges", description: "Transparent pricing", icon: "gift" }
    ],
    propertyViews: [
      { label: "Entrance", images: ["https://picsum.photos/800/600?random=15"], description: "Main entrance" },
      { label: "Room", images: ["https://picsum.photos/800/600?random=16"], description: "Budget rooms" }
    ],
    propertyType: "pg", gender: "male", monthlyRent: 7000, totalRooms: 25, bedsPerRoom: 4,
    facilities: { wifi: true, ac: false, food: false, laundry: false, parking: false, gym: false, tv: false, powerBackup: false },
    name: "Roomhy Budget PG - Mumbai", price: 7000, beds: 100
  },
  {
    _id: "static9",
    title: "Roomhy Executive Hostel - Bangalore",
    description: "Premium hostel for executives with business amenities, conference rooms, and networking opportunities.",
    address: "Electronic City, Bangalore, Karnataka 560100",
    locationCode: "BLR",
    latitude: 12.8444, longitude: 77.6631,
    ownerLoginId: "BLR001", status: "active", isPublished: true,
    amenities: [
      { name: "IT Professionals Hub", icon: "briefcase", category: "popular" },
      { name: "Premium Location", icon: "star", category: "popular" },
      { name: "Business Friendly", icon: "users", category: "popular" },
      { name: "High-Speed WiFi", icon: "wifi", category: "basic" },
      { name: "Conference Room", icon: "check", category: "basic" },
      { name: "Business Center", icon: "tv", category: "basic" },
      { name: "Gym", icon: "dumbbell", category: "basic" },
      { name: "Cafeteria", icon: "coffee", category: "basic" }
    ],
    exclusiveBenefits: [
      { title: "Networking Events", description: "Monthly meetups", icon: "star" },
      { title: "Business Support", description: "Office facilities", icon: "gift" }
    ],
    propertyViews: [
      { label: "Campus", images: ["https://picsum.photos/800/600?random=17"], description: "Executive campus" },
      { label: "Conference", images: ["https://picsum.photos/800/600?random=18"], description: "Business facilities" }
    ],
    propertyType: "hostel", gender: "male", monthlyRent: 18000, totalRooms: 20, bedsPerRoom: 2,
    facilities: { wifi: true, ac: true, food: true, laundry: true, parking: true, gym: true, tv: true, powerBackup: true },
    name: "Roomhy Executive Hostel - Bangalore", price: 18000, beds: 40
  },
  {
    _id: "static10",
    title: "Roomhy Family PG - Chennai",
    description: "Family-friendly PG accommodation suitable for small families and couples with home-like atmosphere.",
    address: "T Nagar, Chennai, Tamil Nadu 600017",
    locationCode: "CHE",
    latitude: 13.0827, longitude: 80.2707,
    ownerLoginId: "CHE001", status: "active", isPublished: true,
    amenities: [
      { name: "Family Friendly", icon: "users", category: "popular" },
      { name: "Premium Location", icon: "star", category: "popular" },
      { name: "Near Metro", icon: "map-pin", category: "popular" },
      { name: "High-Speed WiFi", icon: "wifi", category: "basic" },
      { name: "Family Rooms", icon: "check", category: "basic" },
      { name: "Kitchen Access", icon: "coffee", category: "basic" },
      { name: "Children Play Area", icon: "check", category: "basic" },
      { name: "Power Backup", icon: "zap", category: "basic" }
    ],
    exclusiveBenefits: [
      { title: "Family Friendly", description: "Safe for families", icon: "heart" },
      { title: "Flexible Stay", description: "Short/long term", icon: "star" }
    ],
    propertyViews: [
      { label: "Building", images: ["https://picsum.photos/800/600?random=19"], description: "Family building" },
      { label: "Family Room", images: ["https://picsum.photos/800/600?random=20"], description: "Spacious family rooms" }
    ],
    propertyType: "pg", gender: "any", monthlyRent: 13000, totalRooms: 15, bedsPerRoom: 4,
    facilities: { wifi: true, ac: true, food: false, laundry: true, parking: true, gym: false, tv: true, powerBackup: true },
    name: "Roomhy Family PG - Chennai", price: 13000, beds: 60
  }
];

const getStaticPropertyById = (id) => {
  return staticPropertiesData.find(p => p._id === id) || staticPropertiesData[0];
};

export default function PropertyDetailsPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [rawPropertyId, setRawPropertyId] = useState(null); // MongoDB ObjectId
  const [nearbyInstitutes, setNearbyInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loadingInstitutes, setLoadingInstitutes] = useState(false);
  const [showQuickBookingModal, setShowQuickBookingModal] = useState(false);
  const [rooms, setRooms] = useState([]);

  // Layout sections from CMS editor
  const [layoutSections, setLayoutSections] = useState([]);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const timeoutPromise = new Promise(r => setTimeout(() => r({ success: false }), 3000));
        const apiPromise = fetchJson('/api/page-layouts/property-details');
        const res = await Promise.race([apiPromise, timeoutPromise]);
        if (res?.success && res?.data?.sections) {
          setLayoutSections(res.data.sections.sort((a, b) => a.order - b.order));
        }
      } catch (err) {
        console.warn('Failed to load property details layout:', err);
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

  // Dynamic SEO from property data (updates once property loads)
  useSEO({
    pageKey: 'property-details',
    fallbackTitle: property ? `${property.name} - Roomhy` : 'Property Details - Roomhy',
    fallbackDescription: property ? `Book ${property.name} in ${property.location}. ${property.type ? property.type.toUpperCase() + ' -' : ''} Starting ₹${property.price || property.monthlyRent}/month. Verified, broker-free.` : undefined
  });

  // Handle Book Now button click
  const handleBookNow = () => {
    setShowQuickBookingModal(true);
  };

  // Handle quick booking submission
  const handleQuickBookingSubmit = async (bookingData) => {
    // Resolve user_id: prefer logged-in website user, fall back to email
    let userId = bookingData.email;
    try {
      const raw = sessionStorage.getItem("website_user") || localStorage.getItem("website_user") ||
                  sessionStorage.getItem("user") || localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?._id || u?.id) userId = u._id || u.id;
      }
    } catch (_) {}

    const payload = {
      property_id:   property?._id || property?.id || bookingData.propertyId,
      property_name: property?.name || property?.property_name || bookingData.propertyName,
      owner_id:      property?.owner_id || property?.ownerLoginId,
      rent_amount:   property?.monthlyRent || property?.price || bookingData.propertyPrice,
      area:          property?.location || property?.city,
      city:          property?.city,
      property_type: property?.propertyType,
      request_type:  'direct',
      user_id:       userId,
      name:          bookingData.name,
      email:         bookingData.email,
      phone:         bookingData.phone,
      message:       bookingData.message || '',
    };

    const { getApiBase } = await import('../../utils/api');
    const res = await fetch(`${getApiBase()}/api/booking/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit booking request');
    navigate('/website/ourproperty');
  };
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, totalReviews: 0, ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [hasReviewed, setHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // Editing rating state
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [editRatingValue, setEditRatingValue] = useState(5);
  const [editRatingText, setEditRatingText] = useState('');
  const [updatingRating, setUpdatingRating] = useState(false);

  // Posting comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  useEffect(() => {
    if (userReview) {
      setEditRatingValue(userReview.rating || 5);
      setEditRatingText(userReview.review || userReview.reviewText || '');
    }
  }, [userReview]);

  // Fetch nearby colleges/universities/schools using OpenStreetMap Overpass API and save to database
  const fetchNearbyEducation = async (lat, lng, propertyId) => {
    setLoadingInstitutes(true);
    try {
      const radius = 2500; // 2.5 km in meters
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="university"](around:${radius},${lat},${lng});
          node["amenity"="college"](around:${radius},${lat},${lng});
          node["amenity"="school"](around:${radius},${lat},${lng});
          way["amenity"="university"](around:${radius},${lat},${lng});
          way["amenity"="college"](around:${radius},${lat},${lng});
          way["amenity"="school"](around:${radius},${lat},${lng});
          relation["amenity"="university"](around:${radius},${lat},${lng});
          relation["amenity"="college"](around:${radius},${lat},${lng});
          relation["amenity"="school"](around:${radius},${lat},${lng});
        );
        out center tags;
      `;

      // Fetch nearby institutes with fallback servers
    const overpassServers = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter", 
      "https://overpass.nchc.org.tw/api/interpreter"
    ];
    
    let apiSuccess = false;
    let institutes = [];
    
    for (const server of overpassServers) {
      try {
        const response = await fetch(server, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query),
        });

        if (response.status === 429) {
          console.warn(`Rate limit on ${server}, trying next...`);
          continue;
        } else if (response.status === 504) {
          console.warn(`Timeout on ${server}, trying next...`);
          continue;
        } else if (!response.ok) {
          console.warn(`Error on ${server}, trying next...`);
          continue;
        }

        const data = await response.json();

        institutes = data.elements
          .filter((el) => el.tags?.name)
          .map((el, idx) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLng = el.lon ?? el.center?.lon;
            const amenity = el.tags.amenity;
            const type =
              amenity === "university"
                ? "university"
                : amenity === "college"
                ? "college"
                : "school";
            const distance = elLat && elLng ? getDistance(lat, lng, elLat, elLng) : 0;
            return {
              id: el.id || idx,
              name: el.tags.name,
              type,
              lat: elLat,
              lng: elLng,
              distance,
            };
          })
          .sort((a, b) => a.distance - b.distance);

        apiSuccess = true;
        break;
      } catch (error) {
        console.error(`Error with ${server}:`, error);
        continue;
      }
    }
    
    if (!apiSuccess) {
      console.warn("All Overpass servers failed, using database colleges");
      institutes = [];
      
      // Try to use database colleges as fallback
      if (property?.nearbyColleges && property.nearbyColleges.length > 0) {
        institutes = property.nearbyColleges.map((name, idx) => ({
          id: `db_${idx}`,
          name: name,
          type: "college",
          lat: lat,
          lng: lng,
          distance: 0,
          source: "database"
        }));
      }
    }

    // Save fetched colleges to database
    if (institutes.length > 0 && propertyId) {
      try {
        const collegeNames = institutes
          .filter(inst => inst.type === 'university' || inst.type === 'college')
          .map(inst => inst.name)
          .slice(0, 10); // Save top 10 colleges

        if (collegeNames.length > 0) {
          
          // Update property in database
          await fetch(`/api/property-colleges/properties/${propertyId}/colleges`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nearbyColleges: collegeNames
            })
          });
        }
      } catch (saveError) {
        console.error('Error saving colleges to database:', saveError);
      }
    }

    setNearbyInstitutes(institutes);
    } catch (error) {
      console.error("Error fetching nearby institutes:", error);
      setNearbyInstitutes([]);
    } finally {
      setLoadingInstitutes(false);
    }
  };

  // Haversine distance (km)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    const loadPropertyDetails = async () => {
      try {
        setLoading(true);

        let foundProperty = null;
        try {
          foundProperty = await fetchPropertyByVisitId(propertyId);
        } catch (apiError) {
          console.warn('API failed, using static data:', apiError.message);
          const staticProperty = getStaticPropertyById(propertyId);
          setProperty(staticProperty);
          setRawPropertyId(staticProperty._id);
          setLoading(false);
          return;
        }

        if (foundProperty) {
          const actualId = foundProperty._id || foundProperty.id;
          setRawPropertyId(actualId);

          if (actualId) {
            trackPropertyView(actualId);
            
            // Fetch rooms for this property with fallbacks
            try {
              let roomsData = null;
              try {
                roomsData = await fetchJson(`/api/rooms/property/${encodeURIComponent(actualId)}?limit=100`);
              } catch (_) {}
              
              let roomList = (roomsData && Array.isArray(roomsData.rooms)) ? roomsData.rooms : (Array.isArray(roomsData) ? roomsData : []);

              if (roomList.length === 0 && foundProperty.visitId) {
                try {
                  const visitRoomsData = await fetchJson(`/api/rooms/property/${encodeURIComponent(foundProperty.visitId)}?limit=100`);
                  if (visitRoomsData && Array.isArray(visitRoomsData.rooms)) roomList = visitRoomsData.rooms;
                } catch (_) {}
              }

              if (roomList.length === 0 && (foundProperty.ownerLoginId || foundProperty.owner_id)) {
                const ownerId = foundProperty.ownerLoginId || foundProperty.owner_id;
                try {
                  const ownerRoomsData = await fetchJson(`/api/rooms/owner/${encodeURIComponent(ownerId)}?limit=100`);
                  const allOwnerRooms = ownerRoomsData?.rooms || (Array.isArray(ownerRoomsData) ? ownerRoomsData : []);
                  const matched = allOwnerRooms.filter(r => {
                    const rPid = String(r.propertyId || r.property?._id || r.property || '');
                    return rPid === String(actualId) || rPid === String(foundProperty.visitId);
                  });
                  if (matched.length) roomList = matched;
                } catch (_) {}
              }

              setRooms(roomList);
            } catch (err) {
              console.error('Failed to fetch rooms:', err);
            }

          }
          
          const formatted = {
            // Basic fields
            id: foundProperty._id || foundProperty.visitId || foundProperty.propertyName,
            name: foundProperty.propertyName || foundProperty.property_name || foundProperty.title || "Property",
            location: foundProperty.city || foundProperty.propertyInfo?.city || foundProperty.propertyInfo?.address?.city || extractCityFromName(foundProperty.property_name) || "Location",
            area: foundProperty.propertyInfo?.area || foundProperty.area || "",
            type: foundProperty.propertyInfo?.propertyType || foundProperty.propertyType || "",
            price: foundProperty.propertyInfo?.rent || foundProperty.monthlyRent || foundProperty.price || "0",
            gender: (() => {
              const gRaw = String(
                foundProperty.gender ||
                foundProperty.genderSuitability ||
                foundProperty.propertyInfo?.genderSuitability ||
                foundProperty.forGender ||
                foundProperty.propertyInfo?.forGender ||
                foundProperty.suitableFor ||
                foundProperty.tenantType ||
                ""
              ).toLowerCase().trim();
              const propName = String(foundProperty.propertyName || foundProperty.property_name || foundProperty.title || "").toLowerCase();
              if (gRaw.includes("female") || gRaw.includes("girl") || gRaw.includes("women") || /girl|female|women|lady|ladies|kanya|mahila/i.test(propName)) return "Female";
              if (gRaw.includes("male") || gRaw.includes("boy") || gRaw.includes("men") || /boy|male|men|gents/i.test(propName)) return "Male";
              if (gRaw.includes("co-ed") || gRaw.includes("coed") || gRaw.includes("both") || gRaw.includes("unisex")) return "Co-Ed";
              return "Female";
            })(),

            owner_id: foundProperty.ownerLoginId || foundProperty.owner_id || foundProperty.generatedCredentials?.loginId || "",
            ownerPhone: foundProperty.propertyInfo?.ownerPhone || foundProperty.ownerPhoneNumber || foundProperty.ownerPhone || foundProperty.contact?.number || "",
            ownerEmail: foundProperty.propertyInfo?.ownerEmail || foundProperty.propertyInfo?.ownerGmail || foundProperty.ownerEmail || foundProperty.contact?.email || "",
            
            // Image fields - prioritize new fields
            image: foundProperty.featuredImage || foundProperty.propertyInfo?.photos?.[0] || foundProperty.propertyImage || foundProperty.image || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
            images: foundProperty.images || foundProperty.propertyInfo?.photos || foundProperty.propertyImages || [foundProperty.featuredImage || foundProperty.propertyImage || foundProperty.image || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`],
            
            // Description and basic info
            description: foundProperty.description || "No description provided",
            verified: foundProperty.isVerified || foundProperty.verified || false,
            rating: foundProperty.rating || 4.5,
            latitude: foundProperty.latitude || foundProperty.propertyInfo?.latitude || foundProperty.propertyInfo?.location?.coordinates?.[1] || null,
            longitude: foundProperty.longitude || foundProperty.propertyInfo?.longitude || foundProperty.propertyInfo?.location?.coordinates?.[0] || null,
            address: foundProperty.address || foundProperty.propertyAddress || "",
            nearbyColleges: foundProperty.nearbyColleges || [],
            
            // NEW DYNAMIC FIELDS - Direct mapping for static data
            amenities: (() => {
              const rawAmenities = foundProperty.amenities || foundProperty.propertyInfo?.amenities || [];
              
              // Parse amenities if they are JSON strings
              const parsedAmenities = rawAmenities.map(amenity => {
                if (typeof amenity === 'string') {
                  try {
                    // Try to parse JSON string
                    return JSON.parse(amenity);
                  } catch (e) {
                    // If parsing fails, create a basic amenity object
                    return {
                      name: amenity.replace(/[{}]/g, '').trim(),
                      icon: 'check',
                      category: 'basic'
                    };
                  }
                }
                return amenity;
              });
              
              return parsedAmenities;
            })(),
            exclusiveBenefits: foundProperty.exclusiveBenefits || foundProperty.benefits || [],
            propertyViews: foundProperty.propertyViews || [],
            roomTypes: (foundProperty.roomTypes && foundProperty.roomTypes.length > 0) 
              ? foundProperty.roomTypes 
              : (foundProperty.propertyInfo?.roomTypes && foundProperty.propertyInfo.roomTypes.length > 0)
                ? foundProperty.propertyInfo.roomTypes
                : foundProperty.roomVariants || [],
            facilities: foundProperty.facilities || foundProperty.propertyInfo?.facilities || [],
            
            // Property details
            propertyType: foundProperty.propertyType || foundProperty.propertyInfo?.propertyType || "pg",
            monthlyRent: foundProperty.monthlyRent || foundProperty.rent || foundProperty.price || 0,
            pricing: foundProperty.pricing || {},
            securityDeposit: foundProperty.pricing?.securityDeposit || foundProperty.propertyInfo?.securityDeposit || 0,
            advanceRent: foundProperty.pricing?.advanceRent || foundProperty.propertyInfo?.advanceRent || 0,
            discountPercent: foundProperty.pricing?.discountPercent || foundProperty.discountPercent || 0,
            totalRooms: (() => {
              // Calculate from actual rooms if available
              if (rooms && rooms.length > 0) {
                return rooms.length;
              }
              // Fallback to roomTypes
              const fromRoomTypes = (foundProperty.roomTypes || foundProperty.propertyInfo?.roomTypes || [])
                .reduce((acc, rt) => acc + parseInt(rt.totalRooms || 0), 0);
              return fromRoomTypes || foundProperty.totalRooms || foundProperty.propertyDetails?.floors || 0;
            })(),
            totalBeds: (() => {
              // Calculate total beds from individual rooms
              if (rooms && rooms.length > 0) {
                return rooms.reduce((acc, room) => acc + (room.beds || 1), 0);
              }
              // Fallback to roomTypes calculation
              const fromRoomTypes = (foundProperty.roomTypes || foundProperty.propertyInfo?.roomTypes || [])
                .reduce((acc, rt) => acc + (parseInt(rt.totalRooms || 0) * parseInt(rt.bedsPerRoom || 1)), 0);
              return fromRoomTypes || foundProperty.beds || foundProperty.bedrooms || 0;
            })(),
            bedsPerRoom: foundProperty.bedsPerRoom || 1,
            
            // New sections
            propertyDetails: foundProperty.propertyDetails || {},
            policies: foundProperty.policies || {},
            tenantDescription: foundProperty.tenantDescription || "",
            
            status: foundProperty.status || "active",
            isPublished: foundProperty.isPublished !== undefined ? foundProperty.isPublished : true,
            
            // Legacy fields for backward compatibility
            highlights: foundProperty.highlights || [],
            benefits: foundProperty.benefits || foundProperty.exclusiveBenefits || [],
            offers: foundProperty.offers || [],
            roomVariants: foundProperty.roomVariants || [],
            pricingDetails: foundProperty.pricingDetails || null,
            originalPrice: foundProperty.originalPrice || null,
          };

          setProperty(formatted);

          // Fetch nearby institutes from OpenStreetMap if coordinates available
          if (formatted.latitude && formatted.longitude) {
            fetchNearbyEducation(formatted.latitude, formatted.longitude, propertyId);
          } else if (formatted.nearbyColleges && formatted.nearbyColleges.length > 0) {
            // Fallback: use seeded data from DB if no coordinates
            const institutes = formatted.nearbyColleges.map((name, idx) => ({
              id: idx,
              name: name,
              type: 'college',
              lat: formatted.latitude,
              lng: formatted.longitude,
              distance: 0,
            }));
            setNearbyInstitutes(institutes);
          }
        } else {
          const staticProperty = getStaticPropertyById(propertyId);
          setProperty(staticProperty);
          setRawPropertyId(staticProperty._id);
        }
      } catch (error) {
        console.error("Error fetching property details:", error);
        const staticProperty = getStaticPropertyById(propertyId);
        setProperty(staticProperty);
        setRawPropertyId(staticProperty._id);
      } finally {
        setLoading(false);
      }
    };
    loadPropertyDetails();
  }, [propertyId]);

  // Track Recently Viewed Properties
  useEffect(() => {
    if (property) {
      try {
        const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        
        // Prepare new entry
        const newEntry = {
          id: property.id,
          name: property.name,
          location: property.location,
          price: property.price,
          image: property.image,
          type: property.type,
          timestamp: Date.now()
        };

        // Remove duplicates and add to start
        const filtered = recentlyViewed.filter(item => item.id !== property.id);
        const updated = [newEntry, ...filtered].slice(0, 10); // Keep top 10
        
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      } catch (err) {
        console.error('Error updating recently viewed:', err);
      }
    }
  }, [property]);

  // Load reviews when property loads
  useEffect(() => {
    if (rawPropertyId) {
      loadReviews();
    }
  }, [rawPropertyId]);

  const loadReviews = async () => {
    if (!rawPropertyId) return;
    try {
      const [reviewsData, statsData, userReviewData] = await Promise.all([
        getPropertyReviews(rawPropertyId),
        getPropertyReviewStats(rawPropertyId),
        checkUserReview(rawPropertyId)
      ]);
      setReviews(reviewsData);
      setReviewStats(statsData);
      setHasReviewed(userReviewData.hasReviewed);
      setUserReview(userReviewData.review);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    
    // Use rawPropertyId (MongoDB ObjectId) instead of property.id (which can be a friendly string)
    const actualPropertyId = rawPropertyId;
    
    if (!actualPropertyId) {
      alert('Error: Property ID not found');
      return;
    }
    
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await submitReview({
        propertyId: actualPropertyId,
        propertyName: property?.name,
        rating: newRating,
        review: newReviewText
      });
      setShowReviewForm(false);
      setNewRating(5);
      setNewReviewText('');
      await loadReviews(); // Reload reviews
    } catch (error) {
      setReviewError(error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const actualPropertyId = rawPropertyId;
    if (!actualPropertyId) {
      alert('Error: Property ID not found');
      return;
    }
    
    setSubmittingComment(true);
    setCommentError(null);
    try {
      await submitReview({
        propertyId: actualPropertyId,
        propertyName: property?.name,
        rating: 0,
        review: commentText
      });
      setCommentText('');
      await loadReviews(); // Reload reviews
    } catch (error) {
      setCommentError(error.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateRating = async (e) => {
    e.preventDefault();
    if (!editRatingText.trim()) return;
    if (!userReview?._id) return;

    setUpdatingRating(true);
    try {
      const res = await fetchJson(`/api/reviews/${userReview._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          rating: editRatingValue,
          review: editRatingText
        })
      });
      if (res.success) {
        setIsEditingRating(false);
        await loadReviews();
      }
    } catch (error) {
      alert('Error updating rating: ' + error.message);
    } finally {
      setUpdatingRating(false);
    }
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <WebsiteNavbar />
        <div className="flex flex-col items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-[#EE4266] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading property details...</p>
        </div>
      </div>
    );
  }

  // ==================== NOT FOUND STATE ====================
  if (!property) {
    return (
      <div className="min-h-screen bg-white">
        <WebsiteNavbar />
        <div className="flex flex-col items-center justify-center h-96">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <span className="text-3xl">🏠</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Property Not Found</h2>
          <p className="text-gray-500 mt-2">The property you're looking for doesn't exist.</p>
          <button onClick={() => navigate("/website/ourproperty")} className="mt-6 px-6 py-3 bg-[#EE4266] hover:bg-[#d63a5b] text-white rounded-xl font-semibold transition-colors">
            Back to Properties
          </button>
        </div>
        <WebsiteFooter />
      </div>
    );
  }

  const hasCoordinates = property.latitude && property.longitude;

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar — hidden on mobile for immersive gallery, shown on desktop */}
      <div className="hidden md:block">
        <WebsiteNavbar />
      </div>

      {/* ==================== TWO-COLUMN LAYOUT ==================== */}
      <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 md:py-6">
        <div className="md:grid md:grid-cols-3 md:gap-8">

          {/* ==================== LEFT / MAIN CONTENT ==================== */}
          <div className="md:col-span-2">
            
            {/* 1. Property Views Gallery - OYO Style */}
            <div className="md:rounded-2xl md:overflow-hidden">
              <PropertyViewsGallery
                propertyViews={property.propertyViews}
                images={property.images}
                categories={property.categories}
              />
            </div>

            {/* Content Sections — OYO-style clean layout */}
            <div className="md:px-0 px-0">
              
              {/* 2. Property Header */}
              <div className="pt-5 pb-5" style={{ borderBottom: '1px solid #e8e8e8' }}>
                <PropertyHeader property={property} reviewStats={reviewStats} />
              </div>

              {/* 5.5. Choose Your Room (Room Types) */}
              <div className="px-4 md:px-0">
                <RoomTypesSection roomTypes={property.roomTypes} rooms={rooms} property={property} onSelectRoom={handleBookNow} />
              </div>



              {/* 6. Exclusive Benefits Section */}
              <div className="px-4 md:px-0">
                <ExclusiveBenefitsSection
                  exclusiveBenefits={property.exclusiveBenefits}
                />
              </div>

              {/* 7. Offers/Benefits (Legacy) */}
              <OffersSection
                offers={property.exclusiveBenefits?.map(b => b.title)}
                benefits={property.benefits}
              />

              {/* 8. Nearby Places */}
              <NearbySection
                nearbyInstitutes={nearbyInstitutes}
                loading={loadingInstitutes}
                hasCoordinates={hasCoordinates}
              />

              {/* 9. Map (Mobile Only) */}
              {hasCoordinates && (
                <div className="md:hidden px-4 py-5" style={{ borderBottom: '1px solid #e8e8e8' }}>
                  <h2 className="text-lg font-bold text-[#222] mb-3 flex items-center gap-2">
                    <Navigation size={16} className="text-[#EE4266]" />
                    Property Location
                  </h2>
                  <div className="rounded-lg overflow-hidden" style={{ height: '250px', border: '1px solid #e8e8e8' }}>
                    <iframe
                      src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=14&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Property Location"
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 mt-3 py-2.5 rounded-lg text-sm font-semibold text-[#222] hover:text-[#EE4266] transition-colors"
                    style={{ border: '1px solid #e0e0e0' }}
                  >
                    <Navigation size={14} /> Get Directions
                  </a>
                </div>
              )}

              {/* 10. Pricing Breakdown (Mobile) */}
              <PricingBreakdown property={property} />

              {/* 11. Reviews */}
              <ReviewsSection
                reviews={reviews}
                reviewStats={reviewStats}
                hasReviewed={hasReviewed}
                userReview={userReview}
                showReviewForm={showReviewForm}
                setShowReviewForm={setShowReviewForm}
                newRating={newRating}
                setNewRating={setNewRating}
                newReviewText={newReviewText}
                setNewReviewText={setNewReviewText}
                submittingReview={submittingReview}
                handleSubmitReview={handleSubmitReview}
                reviewError={reviewError}
                isEditingRating={isEditingRating}
                setIsEditingRating={setIsEditingRating}
                editRatingValue={editRatingValue}
                setEditRatingValue={setEditRatingValue}
                editRatingText={editRatingText}
                setEditRatingText={setEditRatingText}
                updatingRating={updatingRating}
                handleUpdateRating={handleUpdateRating}
                commentText={commentText}
                setCommentText={setCommentText}
                submittingComment={submittingComment}
                handleSubmitComment={handleSubmitComment}
                commentError={commentError}
              />

              {/* 12. Compare with Similar */}
              <CompareSection currentProperty={property} />

              {/* 13. Owner Info (Mobile Only) */}
              <div className="md:hidden px-4 py-5" style={{ borderBottom: '1px solid #e8e8e8' }}>
                <h2 className="text-lg font-bold text-[#222] mb-3">Owner Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-[#6d787d] uppercase tracking-wider">Owner Name</p>
                    <p className="text-sm text-[#222] font-semibold">{property.owner}</p>
                  </div>
                  {property.ownerPhone && (
                    <a
                      href={`tel:${property.ownerPhone}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[#EE4266] text-white rounded-lg font-semibold text-sm hover:bg-[#d63a5b] transition-colors"
                    >
                      <Phone size={16} /> Call Owner
                    </a>
                  )}
                  {property.ownerEmail && (
                    <a
                      href={`mailto:${property.ownerEmail}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white text-[#222] rounded-lg font-semibold text-sm transition-colors"
                      style={{ border: '1px solid #e0e0e0' }}
                    >
                      <Mail size={16} /> Send Email
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== RIGHT SIDEBAR (Desktop) ==================== */}
          <div className="hidden md:block md:col-span-1">
            <StickyCTA property={property} onBookNow={handleBookNow} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-32 md:pb-0">
        <WebsiteFooter />
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="md:hidden">
        <StickyCTA property={property} onBookNow={handleBookNow} />
      </div>

      {/* Mobile Bottom Navigation — pushed up by sticky CTA */}
      {/* Note: MobileBottomNav is replaced by StickyCTA on this page */}
      
      {/* Quick Booking Modal */}
      <QuickBookingModal
        property={property}
        isOpen={showQuickBookingModal}
        onClose={() => setShowQuickBookingModal(false)}
        onSubmit={handleQuickBookingSubmit}
      />
    </div>
  );
}

