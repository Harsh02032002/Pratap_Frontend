import AlternateVisitStatus, { BookingAlternateVisits, useAlternateWorkflow } from "../../components/AlternateVisitStatus";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl, getWebsiteUserEmail, getWebsiteUserId, logoutWebsite } from "../../utils/websiteSession";
import { useLucideIcons, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import { getStayBookingAmount, mergeStayBookings } from "../../utils/myStaysBookings";
import { toast } from "react-hot-toast";

export default function WebsiteMystays() {
  useWebsiteCommon();
  useWebsiteMenu();

  useEffect(() => {
    if (window.location.pathname !== '/my-stays') {
      window.history.replaceState(null, '', '/my-stays');
    }
  }, []);

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [bookings, setBookings] = useState([]);
  const [activeBids, setActiveBids] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'bids'
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [requestType, setRequestType] = useState("refund");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    upiId: "",
    bankAccountName: "",
    bankAccount: "",
    ifscCode: "",
    bankName: "",
    preferredArea: "",
    requirements: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [feedback, setFeedback] = useState("");
  const [copiedBookingId, setCopiedBookingId] = useState(null);

  // Alternative property recommendations state
  const [altRecommendations, setAltRecommendations] = useState([]);
  const [loadingAlt, setLoadingAlt] = useState(false);
  const [selectedAlternatives, setSelectedAlternatives] = useState([]);

  useLucideIcons([bookings, selectedBooking, requestType, paymentMethod, altRecommendations, selectedAlternatives]);

  const extractImageUrls = useCallback((value) => {
    const isValid = (url) => {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (!trimmed) return false;
      const lowered = trimmed.toLowerCase();
      if (lowered === "null" || lowered === "undefined" || lowered === "[object object]") return false;
      return /^https?:\/\//.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../");
    };

    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object") return item.url || item.secure_url || item.src || item.image || "";
          return "";
        })
        .filter(isValid);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (isValid(trimmed)) return [trimmed];
      try {
        const parsed = JSON.parse(trimmed);
        return extractImageUrls(parsed);
      } catch {
        return trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(isValid);
      }
    }
    if (typeof value === "object") {
      return [value.url || value.secure_url || value.src || value.image || ""].filter(isValid);
    }
    return [];
  }, []);

  const collectBookings = useCallback(async () => {
    const cachedBookings = [];
    let apiBookings = [];

    const addBooking = (booking) => {
      if (!booking || typeof booking !== "object") return;
      cachedBookings.push(booking);
    };

    try {
      const sessionBooking = sessionStorage.getItem("bookingConfirmation");
      if (sessionBooking) addBooking(JSON.parse(sessionBooking));
    } catch (err) {
      console.warn("Failed to parse session booking:", err);
    }

    try {
      const localBooking = localStorage.getItem("lastBooking");
      if (localBooking) addBooking(JSON.parse(localBooking));
    } catch (err) {
      console.warn("Failed to parse local booking:", err);
    }

    try {
      const confirmedBookings = JSON.parse(localStorage.getItem("confirmedBookings") || "[]");
      if (Array.isArray(confirmedBookings)) confirmedBookings.forEach(addBooking);
    } catch (err) {
      console.warn("Failed to parse confirmed bookings:", err);
    }

    const userId = getWebsiteUserId() || localStorage.getItem("userId") || sessionStorage.getItem("userId");
    const userEmail = getWebsiteUserEmail() || localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
    if (userId || userEmail) {
      const identity = userId || userEmail;
      const querySuffix = userEmail ? `?email=${encodeURIComponent(userEmail)}` : "";
      const endpoints = [
        `${apiUrl}/api/booking/user/${encodeURIComponent(identity)}${querySuffix}`,
        `${apiUrl}/api/bookings/user/${encodeURIComponent(identity)}${querySuffix}` 
      ];
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, { method: "GET", headers: { "Content-Type": "application/json" } });
          if (res.status === 404) continue;
          if (!res.ok) break;
          const data = await res.json();
          apiBookings = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          break;
        } catch (err) {
          console.warn("Booking API failed:", err);
          break;
        }
      }
    }

    const collected = mergeStayBookings(cachedBookings, apiBookings);
    collected.sort((a, b) => {
      const aTime = new Date(a.created_at || a.createdAt || a.submittedAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.created_at || b.createdAt || b.submittedAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });

    setBookings(collected);
    setLoading(false);
  }, [apiUrl]);

  // Fetch active bids for this user
  const fetchActiveBids = useCallback(async () => {
    const userEmail = getWebsiteUserEmail();
    const identity = getWebsiteUserId() || userEmail;
    if (!identity) return;
    try {
      const emailQuery = userEmail ? `&email=${encodeURIComponent(userEmail)}` : "";
      const res = await fetch(`${apiUrl}/api/booking/user/${encodeURIComponent(identity)}?type=bids${emailQuery}`);
      if (!res.ok) return;
      const data = await res.json();
      const all = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      const bids = all.filter(b => b.request_type === 'bid' && b.status === 'pending' && !b.is_expired);
      setActiveBids(bids);
    } catch {}
  }, [apiUrl]);

  useEffect(() => {
    collectBookings();
    fetchActiveBids();
  }, [collectBookings, fetchActiveBids]);

  const [alternateRevision, setAlternateRevision] = useState(0);
  const selectedWorkflow = useAlternateWorkflow(
    selectedBooking?.booking_id || selectedBooking?.bookingId || selectedBooking?._id || selectedBooking?.id || "",
    selectedBooking?.email || selectedBooking?.user_email || "", alternateRevision);
  const existingAlternate = selectedWorkflow.data?.request;
  const needsAlternateChoice = requestType === "alternative_property" && Boolean(existingAlternate);
  const refundOnly = ["refund_only", "refund_requested"].includes(existingAlternate?.workflow_status);
  useEffect(() => { if (refundOnly) setRequestType("refund"); }, [refundOnly]);

  const fetchAltRecommendations = useCallback(async (booking, areaFilter = "") => {
    if (!booking) return;
    setLoadingAlt(true);
    try {
      const params = new URLSearchParams();
      const bId = booking.booking_id || booking.bookingId || booking._id || booking.id || "";
      const pId = booking.property_id || booking.propertyId || "";
      const areaVal = areaFilter || booking.area || booking.property_location || booking.location || "";
      if (bId) params.set("bookingId", bId);
      if (pId) params.set("excludePropertyId", pId);
      if (areaVal) params.set("preferredArea", areaVal);
      if (booking.rent_amount) params.set("maxPrice", String(Number(booking.rent_amount) + 3000));

      const res = await fetch(`${apiUrl}/api/booking/alternative-recommendations?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAltRecommendations(Array.isArray(json.recommendations) ? json.recommendations : []);
      }
    } catch (err) {
      console.warn("Failed to load alternative recommendations:", err);
    } finally {
      setLoadingAlt(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (selectedBooking && requestType === "alternative_property") {
      fetchAltRecommendations(selectedBooking, formData.preferredArea);
    }
  }, [selectedBooking, requestType, fetchAltRecommendations]);

  const toggleSelectAlternative = (prop) => {
    const propId = String(prop.propertyId || prop._id);
    setSelectedAlternatives((prev) => {
      const exists = prev.some((p) => String(p.property_id) === propId);
      if (exists) {
        return prev.filter((p) => String(p.property_id) !== propId);
      }
      return [
        ...prev,
        {
          property_id: propId,
          property_name: prop.title,
          area: prop.area,
          city: prop.city,
          monthly_rent: prop.monthlyRent,
          owner_id: prop.ownerLoginId,
          owner_name: prop.ownerName
        }
      ];
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  const getAgreementDates = (booking) => {
    const period = booking.agreementPeriod;
    return period && period.startDate && period.endDate ? period : null;
  };

  const openRefundModal = (booking, type = "refund") => {
    setSelectedBooking(booking);
    setRequestType(type);
    setPaymentMethod("upi");
    setSelectedAlternatives([]);
    const defaultArea = booking.area || booking.property_location || booking.location || "";
    setFormData((prev) => ({
      ...prev,
      name: booking.name || booking.user_name || "",
      phone: booking.phone || booking.user_phone || "",
      email: booking.email || booking.user_email || booking.userEmail || "",
      preferredArea: defaultArea
    }));
  };

  const closeRefundModal = () => {
    setSelectedBooking(null);
    setFeedback("");
    setSelectedAlternatives([]);
  };

  const handleCopyId = (idText) => {
    if (!idText) return;
    navigator.clipboard.writeText(String(idText));
    setCopiedBookingId(String(idText));
    toast.success("Booking ID copied!");
    setTimeout(() => setCopiedBookingId(null), 2000);
  };

  const handleRefundSubmit = async () => {
    if (!selectedBooking || submittingRef.current || selectedWorkflow.loading || selectedWorkflow.error || needsAlternateChoice) return;
    const name = formData.name.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim();
    if (!name || !phone) {
      setFeedback("Please enter your full name and phone number.");
      return;
    }
    if (requestType === "refund" && !paymentMethod) {
      setFeedback("Please select a refund method.");
      return;
    }
    if (requestType === "refund" && paymentMethod === "upi" && !formData.upiId.trim()) {
      setFeedback("Please enter your UPI ID.");
      return;
    }
    if (
      requestType === "refund" &&
      paymentMethod === "bank" &&
      (!formData.bankAccount.trim() || !formData.ifscCode.trim() || !formData.bankName.trim())
    ) {
      setFeedback("Please enter all bank details.");
      return;
    }

    const payload = {
      booking_id: selectedBooking.booking_id || selectedBooking.bookingId || selectedBooking._id || selectedBooking.id || "",
      user_id:
        selectedBooking.user_id ||
        selectedBooking.userId ||
        localStorage.getItem("userId") ||
        sessionStorage.getItem("userId") ||
        "",
      payment_id:
        selectedBooking.payment_id ||
        selectedBooking.paymentId ||
        selectedBooking._id ||
        selectedBooking.bookingId ||
        "",
      user_name: name,
      user_phone: phone,
      user_email: email,
      refund_amount: 500,
      workflow_version: existingAlternate?.workflow_version,
      request_type: requestType,
      refund_method: requestType === "refund" ? paymentMethod : null,
      upi_id: paymentMethod === "upi" ? formData.upiId.trim() : null,
      bank_account_holder: paymentMethod === "bank" ? formData.bankAccountName.trim() : null,
      bank_account_number: paymentMethod === "bank" ? formData.bankAccount.trim() : null,
      bank_ifsc_code: paymentMethod === "bank" ? formData.ifscCode.trim() : null,
      bank_name: paymentMethod === "bank" ? formData.bankName.trim() : null,
      preferred_area: requestType === "alternative_property" ? formData.preferredArea.trim() : null,
      property_requirements: requestType === "alternative_property" ? formData.requirements.trim() : null,
      selected_alternative_properties: requestType === "alternative_property" ? selectedAlternatives : []
    };

    submittingRef.current = true;
    setSubmitting(true);
    setFeedback("");
    try {
      const res = await fetch(`${apiUrl}/api/booking/refund-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const response = await res.json().catch(() => null);
      if (!res.ok || response?.success !== true) throw new Error(response?.message || "Request could not be saved. Please try again.");
      toast.success(
        response.message || (requestType === "alternative_property"
          ? "Alternative property request submitted! Assigned area executive has been notified."
          : "Refund request submitted! Assigned area executive & SuperAdmin have been notified.")
      );
      setAlternateRevision(value => value + 1);
      closeRefundModal();
    } catch (err) {
      console.warn("Refund request failed:", err);
      setFeedback(err.message || "Request could not be saved. Please try again.");
      toast.error("Request was not submitted. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };
  useHtmlPage({
    title: "My Stays - Roomhy",
    bodyClass: "",
    htmlAttrs: {
  "lang": "en",
  "class": "scroll-smooth"
},
    metas: [
  {
    "charset": "UTF-8"
  },
  {
    "name": "viewport",
    "content": "width=device-width, initial-scale=1.0"
  },
  {
    "name": "referrer",
    "content": "no-referrer-when-downgrade"
  }
],
    bases: [],
    links: [
  {
    "rel": "preconnect",
    "href": "https://fonts.googleapis.com"
  },
  {
    "rel": "preconnect",
    "href": "https://fonts.gstatic.com",
    "crossorigin": true
  },
  {
    "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    "rel": "stylesheet"
  },
  {
    "rel": "stylesheet",
    "href": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
    "crossorigin": "anonymous",
    "referrerpolicy": "no-referrer"
  },
  {
    "rel": "stylesheet",
    "href": "/website/assets/css/mystays.css"
  }
],
    styles: [],
    scripts: [
  {
    "src": "https://cdn.tailwindcss.com"
  },
  {
    "src": "https://unpkg.com/lucide@latest"
  }
],
    inlineScripts: []
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteNavbar />
      <div id="menu-overlay" className="fixed inset-0 bg-black/50 z-40 hidden"></div>
      <div id="mobile-menu" className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
          <div className="flex justify-end p-4 flex-shrink-0">
              <button id="menu-close" className="p-2">
                  <i data-lucide="x" className="w-6 h-6 text-gray-700"></i>
              </button>
          </div>
          
          
          <div id="menu-logged-in" className="hidden flex flex-col h-full">
              <div className="flex justify-between items-center px-6 py-2">
                  <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                          <i data-lucide="user" className="w-6 h-6 text-white"></i>
                      </div>
                      <div>
                          <span className="text-lg font-semibold text-gray-800" id="welcomeUserName">Hi,welcome</span>
                          <p className="text-xs text-gray-500" id="userIdDisplay"></p>
                      </div>
                  </div>
                  <a href="/website/profile" className="text-sm font-medium text-blue-600 hover:underline">Profile</a>
              </div>
      
              <div className="px-6 py-4">
                  <div className="border border-blue-200 rounded-lg p-4 relative overflow-hidden">
                      <p className="font-semibold text-gray-800 mb-3 relative z-10">Looking to Sell/Rent your Property?</p>
                      <a href="/website/list" className="block text-center w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors relative z-10">
                          Post Property for Free
                      </a>
                  </div>
              </div>
      
              <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                  <a href="/website/ourproperty" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="home" className="w-5 h-5 text-blue-600"></i>
                      </div>
                      <span>Our Properties</span>
                  </a>
                  <a href="/website/fav" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="heart" className="w-5 h-5 text-red-600"></i>
                      </div>
                      <span>Favorites</span>
                  </a>
                  <a href="/website/mystays" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="building" className="w-5 h-5 text-purple-600"></i>
                      </div>
                      <span>My Stays</span>
                  </a>
                  <a href="/website/about" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="info" className="w-5 h-5 text-yellow-600"></i>
                      </div>
                      <span>About Us</span>
                  </a>
                  <a href="/website/contact" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="phone" className="w-5 h-5 text-cyan-600"></i>
                      </div>
                      <span>Contact Us</span>
                  </a>
                  <a href="/website/websitechat" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="message-circle" className="w-5 h-5 text-green-600"></i>
                      </div>
                      <span>Chat</span>
                  </a>
              </nav>
              
              <div className="p-4 border-t flex-shrink-0">
                  <button onClick={() => logoutWebsite("login")} className="w-full flex items-center space-x-4 p-3 rounded-lg text-red-600 hover:bg-red-50">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="log-out" className="w-5 h-5 text-gray-600"></i>
                      </div>
                      <span>Logout</span>
                  </button>
              </div>
          </div>
      
          
          <div id="menu-logged-out" className="flex flex-col h-full">
              <div className="flex-grow p-4 space-y-1 overflow-y-auto">
                  <a href="/website/about" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="info" className="w-5 h-5 text-yellow-600"></i>
                      </div>
                      <span>About Us</span>
                  </a>
                  <a href="/website/contact" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="phone" className="w-5 h-5 text-cyan-600"></i>
                      </div>
                      <span>Contact Us</span>
                  </a>
              </div>
              
              <div className="p-4 space-y-3 border-t flex-shrink-0">
                  <a href="/website/login" className="block w-full text-center bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      <i data-lucide="log-in" className="w-4 h-4 inline mr-2"></i>
                      Login
                  </a>
                  <a href="/website/signup" className="block w-full text-center border-2 border-blue-600 text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                      <i data-lucide="user-plus" className="w-4 h-4 inline mr-2"></i>
                      Sign Up
                  </a>
              </div>
          </div>
      </div>
      
      
      {/* --- COMPACT & STYLISH HEADER --- */}
      <div className="relative w-full py-10 px-6 overflow-hidden border-b border-stone-200/50" 
           style={{ background: 'linear-gradient(135deg, #FFFAF5 0%, #FDFCFB 50%, #F5F7FA 100%)' }}>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
        </div>

        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
          
          {/* MAIN HEADING */}
          <div className="flex items-center gap-4 mb-2">
            <div className="h-[1px] w-8 bg-[#C5A059]/40 hidden md:block"></div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
              My Stays <span className="text-[#C5A059] font-serif italic font-medium">& Bookings</span>
            </h1>
            <div className="h-[1px] w-8 bg-[#C5A059]/40 hidden md:block"></div>
          </div>

          {/* SUB-HEADING */}
          <p className="text-base md:text-lg text-stone-500 font-normal opacity-90 max-w-xl mx-auto">
            Manage your property bookings, track your Booking ID, or request an alternative stay
          </p>

          {/* Bottom Accent Dot */}
          <div className="mt-4 w-1.5 h-1.5 rounded-full bg-[#C5A059]/30"></div>
        </div>
      </div>
      
        
          <main className="container mx-auto px-4 sm:px-6 py-16">

            {/* ── Tab Switcher ── */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'bookings'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                }`}
              >
                🏠 My Bookings
              </button>
              <button
                onClick={() => setActiveTab('bids')}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'bids'
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/25'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
                }`}
              >
                ⚡ Active Bids
                {activeBids.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {activeBids.length}
                  </span>
                )}
              </button>
            </div>

            {/* ── Active Bids Panel ── */}
            {activeTab === 'bids' && (
              <div>
                {activeBids.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">⚡</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Bids</h3>
                    <p className="text-gray-500 text-sm mb-6">Submit a bid from the Fast Bidding page to find your ideal stay.</p>
                    <a href="/fast-bidding" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors">
                      Go to Fast Bidding ⚡
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {activeBids.map((bid) => {
                      const matchCat = bid.match_category || 'no_match_active';
                      const catConfig = {
                        exact_match: { label: '✅ Exact Match', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Matching properties found in your budget! Owner may initiate chat.' },
                        slight_gap: { label: '⚡ Negotiation Available', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Properties within ₹2,500 of your budget. Owner can offer lower rent.' },
                        no_match_active: { label: '📌 Auto-Match Active', color: 'bg-teal-100 text-teal-700 border-teal-200', desc: 'Requirement registered. You\'ll be notified when a matching property is added.' }
                      };
                      const cat = catConfig[matchCat] || catConfig.no_match_active;

                      return (
                        <div key={bid._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                          <div className="p-4 border-b bg-gray-50 border-gray-100">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{bid.property_name}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cat.color}`}>{cat.label}</span>
                            </div>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-slate-50 rounded-lg p-2">
                                <p className="text-gray-400 font-medium">Your Bid</p>
                                <p className="font-black text-gray-900">₹{Number(bid.bid_amount || 0).toLocaleString('en-IN')}/mo</p>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-2">
                                <p className="text-gray-400 font-medium">Property Rent</p>
                                <p className="font-black text-gray-900">₹{Number(bid.rent_amount || 0).toLocaleString('en-IN')}/mo</p>
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{cat.desc}</p>
                            <div className="flex gap-2 pt-1">
                              {(matchCat === 'exact_match' || matchCat === 'slight_gap') && (
                                <a
                                  href="/website/chat"
                                  className="flex-1 text-center py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors"
                                >
                                  💬 Open Chat
                                </a>
                              )}
                              <a
                                href="/fast-bidding"
                                className="flex-1 text-center py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors"
                              >
                                ⚡ Rebid
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Bookings Panel ── */}
            {activeTab === 'bookings' && (
              <>
              <div id="loadingState" className={`text-center py-16 ${loading ? "" : "hidden"}`}>
                  <div className="inline-block">
                      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 mt-4 text-lg">Loading your bookings...</p>
              </div>
      
              
              <div id="bookingsContainer" className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${loading || bookings.length === 0 ? "hidden" : ""}`}>
                  {bookings.map((booking, index) => {
                    const photos = [
                      ...extractImageUrls(booking.propertyPhotos),
                      ...extractImageUrls(booking.property_photos),
                      ...extractImageUrls(booking.propertyImages),
                      ...extractImageUrls(booking.property_images),
                      ...extractImageUrls(booking.photos),
                      ...extractImageUrls(booking.images)
                    ].filter((url, i, arr) => arr.indexOf(url) === i);

                    const thumbs = photos.slice(0, 4);
                    const agreement = getAgreementDates(booking);
                    const propertyId = booking.propertyId || booking.property_id || booking._id || "N/A";
                    const officialBookingId = booking.booking_id || booking.bookingId || booking._id || booking.id || "N/A";
                    const displayPropertyId =
                      String(propertyId).length > 20 ? `${String(propertyId).slice(0, 12)}...` : String(propertyId);
                    const bookingStatus = String(booking.booking_status || booking.status || "confirmed").replace(/_/g, " ");
                    const totalAmount = getStayBookingAmount(booking);

                    return (
                      <div key={`${propertyId}-${index}`} className="light-card rounded-xl overflow-hidden h-full flex flex-col bg-white shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                        <div className="p-5 flex-grow flex flex-col">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                              {booking.property_name || booking.propertyName || "Property"}
                            </h3>
                            <div className="flex items-center gap-1 text-gray-600 mt-2">
                              <i data-lucide="map-pin" className="w-4 h-4"></i>
                              <p className="text-sm line-clamp-1">
                                {booking.property_location || booking.location || booking.area || "Location"}
                              </p>
                            </div>
                          </div>

                          {/* Official Booking ID Box */}
                          <div className="mb-2.5 text-xs bg-teal-50 p-2.5 rounded-lg border border-teal-200 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-teal-700 font-bold uppercase tracking-wider text-[10px] block">Official Booking ID</span>
                              <span title={officialBookingId} className="block font-mono text-xs font-bold text-teal-950 truncate">{officialBookingId}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyId(officialBookingId)}
                              className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-700 border border-teal-200 rounded text-[11px] font-bold shrink-0 transition"
                            >
                              {copiedBookingId === String(officialBookingId) ? "Copied!" : "Copy"}
                            </button>
                          </div>

                          <div className="mb-3 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200 flex items-center justify-between">
                            <div>
                              <span className="text-blue-700 font-semibold block text-[10px] uppercase">Property ID</span>
                              <span title={propertyId} className="block font-mono text-xs break-all">{displayPropertyId}</span>
                            </div>
                            {booking.owner_name && (
                              <div className="text-right">
                                <span className="text-blue-700 font-semibold block text-[10px] uppercase">Owner</span>
                                <span className="text-xs font-medium text-gray-800">{booking.owner_name}</span>
                              </div>
                            )}
                          </div>

                          <div className="mb-3">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 border border-green-200">
                              Booking {bookingStatus}
                            </span>
                          </div>

                          {agreement && (
                          <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-gray-200 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 font-semibold uppercase">Check-in</p>
                              <p className="font-bold text-gray-900 text-sm">
                                {formatDate(agreement.startDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-semibold uppercase">Check-out</p>
                              <p className="font-bold text-gray-900 text-sm">
                                {formatDate(agreement.endDate)}
                              </p>
                            </div>
                          </div>
                          )}

                          <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-700 font-medium">Total Amount:</span>
                            <span className="text-2xl font-bold text-blue-600">
                              {totalAmount === null ? "Not available" : `₹${totalAmount.toLocaleString("en-IN")}`}
                            </span>
                          </div>

                          {thumbs.length > 0 && (
                            <div className="mb-4 overflow-x-auto horizontal-slider">
                              <div className="flex gap-2 pb-2">
                                {thumbs.map((photoUrl) => (
                                  <img key={photoUrl} src={photoUrl} className="h-16 w-20 object-cover rounded" alt="thumb" />
                                ))}
                              </div>
                            </div>
                          )}

                          <BookingAlternateVisits booking={booking} revision={alternateRevision} onRefund={() => openRefundModal(booking, "refund")}>
                          <div className="flex gap-3 pt-4 mt-auto">
                            <button
                              onClick={() => openRefundModal(booking, "refund")}
                              className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                            >
                              <i data-lucide="undo-2" className="w-4 h-4"></i>
                              <span>Refund</span>
                            </button>
                            <button
                              onClick={() => openRefundModal(booking, "alternative_property")}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                            >
                              <i data-lucide="repeat" className="w-4 h-4"></i>
                              <span>Alternative</span>
                            </button>
                          </div>
                          </BookingAlternateVisits>
                        </div>
                      </div>
                    );
                  })}
              </div>
      
              
              <div id="emptyState" className={`text-center py-20 ${loading || bookings.length > 0 ? "hidden" : ""}`}>
                  <div className="mb-4">
                      <i data-lucide="inbox" className="w-16 h-16 text-gray-300 mx-auto"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-600 mb-6 text-lg">You haven't made any bookings. Start exploring properties today!</p>
                  <a href="/website/ourproperty" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                      Browse Properties
                  </a>
              </div>
          </>
          )}
          </main>
      

      <div id="refundModal" className={`modal fixed inset-0 z-50 ${selectedBooking ? "flex" : "hidden"} bg-black/40 overflow-y-auto py-8`}>
          <div className="flex items-center justify-center min-h-screen px-4 w-full">
              <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden border border-gray-100">
                  
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {requestType === "alternative_property" ? "Choose Alternative Property" : "Refund / Alternative Stay Request"}
                        </h2>
                        <p className="text-xs text-purple-100 mt-0.5">
                          Booking ID: {selectedBooking?.booking_id || selectedBooking?.bookingId || selectedBooking?._id || "N/A"}
                        </p>
                      </div>
                      <button onClick={closeRefundModal} className="text-white hover:text-gray-200 cursor-pointer">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                  </div>
      
                  
                  <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                      
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex flex-wrap justify-between items-center gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">Current Booked Property</span>
                            <h3 className="font-bold text-purple-900" id="modalPropertyName">
                              {selectedBooking?.property_name || selectedBooking?.propertyName || "Property"}
                            </h3>
                            <p className="text-purple-800 text-xs" id="modalPropertyDetails">
                              {selectedBooking?.property_location || selectedBooking?.location || selectedBooking?.area || ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">Token Paid</span>
                            <span className="text-lg font-extrabold text-purple-900">
                              ₹{Number(selectedBooking?.total_amount || selectedBooking?.totalAmount || selectedBooking?.payment_amount || selectedBooking?.price || 500)}
                            </span>
                          </div>
                      </div>
      
                      
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">What would you like to do?</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div
                                onClick={() => setRequestType("refund")}
                                className={`flex items-center p-3.5 rounded-xl border cursor-pointer transition ${
                                  requestType === "refund" ? "bg-purple-50 border-purple-400" : "bg-white border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                  <input type="radio" id="refundOption" name="requestType" value="refund" checked={requestType === "refund"} onChange={() => setRequestType("refund")} className="h-4 w-4 text-purple-600" />
                                  <label htmlFor="refundOption" className="ml-3 flex flex-col cursor-pointer">
                                      <span className="text-sm font-semibold text-gray-900">Request Refund</span>
                                      <span className="text-xs text-gray-600">Get token refund to your UPI/Bank account</span>
                                  </label>
                              </div>
                              {!refundOnly && <div
                                onClick={() => setRequestType("alternative_property")}
                                className={`flex items-center p-3.5 rounded-xl border cursor-pointer transition ${
                                  requestType === "alternative_property" ? "bg-blue-50 border-blue-400" : "bg-white border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                  <input type="radio" id="alternativeOption" name="requestType" value="alternative_property" checked={requestType === "alternative_property"} onChange={() => setRequestType("alternative_property")} className="h-4 w-4 text-blue-600" />
                                  <label htmlFor="alternativeOption" className="ml-3 flex flex-col cursor-pointer">
                                      <span className="text-sm font-semibold text-gray-900">Alternative Property</span>
                                      <span className="text-xs text-gray-600">Property pasand nahi aayi? Select another stay</span>
                                  </label>
                              </div>}
                          </div>
                      </div>

                      {/* Common User Info Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                              <input type="text" id="refundName" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Enter your name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                              <input type="tel" id="refundPhone" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                              <input type="email" id="refundEmail" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="your.email@gmail.com" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
                          </div>
                      </div>
      
                      
                      <div id="refundForm" className={`space-y-4 ${requestType === "refund" ? "" : "hidden"}`}>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
                              <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center p-3 border rounded-lg">
                                      <input type="radio" id="upiMethod" name="paymentMethod" value="upi" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} className="h-4 w-4 text-purple-600" />
                                      <label htmlFor="upiMethod" className="ml-3 flex flex-col cursor-pointer flex-1">
                                          <span className="text-sm font-semibold text-gray-900">UPI</span>
                                          <span className="text-xs text-gray-600">Fast & Instant</span>
                                      </label>
                                  </div>
                                  <div className="flex items-center p-3 border rounded-lg">
                                      <input type="radio" id="bankMethod" name="paymentMethod" value="bank" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} className="h-4 w-4 text-purple-600" />
                                      <label htmlFor="bankMethod" className="ml-3 flex flex-col cursor-pointer flex-1">
                                          <span className="text-sm font-semibold text-gray-900">Bank Account</span>
                                          <span className="text-xs text-gray-600">NEFT / IMPS Transfer</span>
                                      </label>
                                  </div>
                              </div>
                          </div>
      
                          <div id="upiField" className={paymentMethod === "upi" ? "block" : "hidden"}>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">UPI ID</label>
                              <input type="text" id="upiId" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="yourname@upi" value={formData.upiId} onChange={(e) => setFormData((prev) => ({ ...prev, upiId: e.target.value }))} />
                          </div>
      
                          <div id="bankFields" className={paymentMethod === "bank" ? "space-y-3" : "hidden space-y-3"}>
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
                                  <input type="text" id="bankName" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Name on bank account" value={formData.bankAccountName} onChange={(e) => setFormData((prev) => ({ ...prev, bankAccountName: e.target.value }))} />
                              </div>
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                                  <input type="text" id="bankAccount" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="12345678901234" value={formData.bankAccount} onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))} />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
                                      <input type="text" id="ifscCode" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="SBIN0001234" value={formData.ifscCode} onChange={(e) => setFormData((prev) => ({ ...prev, ifscCode: e.target.value }))} />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                                      <input type="text" id="bankNameField" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="State Bank of India" value={formData.bankName} onChange={(e) => setFormData((prev) => ({ ...prev, bankName: e.target.value }))} />
                                  </div>
                              </div>
                          </div>
                      </div>
      
                      
                      {selectedWorkflow.loading && <p role="status">Loading alternate request status...</p>}
                      {selectedWorkflow.error && <p role="alert" className="text-sm text-red-700">{selectedWorkflow.error} <button type="button" onClick={selectedWorkflow.refresh} className="underline">Retry</button></p>}
                      {needsAlternateChoice && <AlternateVisitStatus data={selectedWorkflow.data}
                        bookingId={selectedBooking?.booking_id || selectedBooking?._id} email={selectedBooking?.email || selectedBooking?.user_email}
                        onRefund={() => setRequestType("refund")} onRefresh={selectedWorkflow.refresh} onChange={data => { selectedWorkflow.setData(data); setAlternateRevision(value => value + 1); }} />}
                      <div id="alternativeForm" className={`space-y-4 ${requestType === "alternative_property" && !needsAlternateChoice ? "" : "hidden"}`}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Area / Location</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    id="preferredArea"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Koramangala, Indiranagar, Kota"
                                    value={formData.preferredArea}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, preferredArea: e.target.value }))}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => fetchAltRecommendations(selectedBooking, formData.preferredArea)}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shrink-0 cursor-pointer"
                                  >
                                    Filter
                                  </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Property Requirements / Reason</label>
                                <input
                                  type="text"
                                  id="propertyRequirements"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Why didn't you like the previous stay?"
                                  value={formData.requirements}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
                                />
                            </div>
                          </div>

                          {/* Recommended Alternative Properties Grid */}
                          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="text-sm font-bold text-blue-950">Recommended Alternative Properties for You</h4>
                                <p className="text-xs text-blue-700">
                                  Select 1 or more stays below — your booking token will be shifted to your chosen property
                                </p>
                              </div>
                              {selectedAlternatives.length > 0 && (
                                <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                                  {selectedAlternatives.length} Selected
                                </span>
                              )}
                            </div>

                            {loadingAlt ? (
                              <div className="py-6 text-center text-xs text-blue-700 font-medium">
                                Loading matching properties in this area...
                              </div>
                            ) : altRecommendations.length === 0 ? (
                              <div className="py-6 text-center text-xs text-gray-500 bg-white rounded-lg border border-gray-200">
                                No matching properties found for this filter. Try clearing the area filter or submit your preference above.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                                {altRecommendations.map((prop) => {
                                  const propId = String(prop.propertyId || prop._id);
                                  const isSelected = selectedAlternatives.some((p) => String(p.property_id) === propId);
                                  return (
                                    <div
                                      key={propId}
                                      className={`bg-white rounded-xl border p-3 flex flex-col justify-between transition ${
                                        isSelected ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20" : "border-gray-200 hover:border-blue-300"
                                      }`}
                                    >
                                      <div>
                                        <div className="flex gap-3">
                                          <img
                                            src={prop.thumbnail || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80"}
                                            alt={prop.title}
                                            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-100"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                                              {prop.matchReason || "Recommended"}
                                            </span>
                                            <h5 className="text-xs font-bold text-gray-900 truncate">{prop.title}</h5>
                                            <p className="text-[11px] text-gray-500 truncate">
                                              {prop.area}{prop.city ? `, ${prop.city}` : ""}
                                            </p>
                                            <p className="text-xs font-extrabold text-blue-600 mt-0.5">
                                              ₹{Number(prop.monthlyRent || 0).toLocaleString("en-IN")}/mo
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                                        <button
                                          type="button"
                                          onClick={() => toggleSelectAlternative(prop)}
                                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            isSelected
                                              ? "bg-blue-600 text-white"
                                              : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                          }`}
                                        >
                                          {isSelected ? "✓ Selected" : "Select Stay"}
                                        </button>
                                        <a
                                          href={`/website/property?id=${encodeURIComponent(propId)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="py-1.5 px-2.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition"
                                        >
                                          View
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                      </div>
      
                      {feedback && <p className="text-sm font-medium text-red-600">{feedback}</p>}
                  </div>
      
                  
                  <div className="bg-gray-50 px-6 sm:px-8 py-4 flex justify-between gap-3 border-t border-gray-200">
                      <button onClick={closeRefundModal} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 cursor-pointer">
                          Cancel
                      </button>
                      <button onClick={handleRefundSubmit} disabled={submitting || selectedWorkflow.loading || Boolean(selectedWorkflow.error) || needsAlternateChoice} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 cursor-pointer">
                          {submitting ? "Submitting..." : requestType === "alternative_property" ? "Submit Alternative Stay Request" : "Submit Refund Request"}
                      </button>
                  </div>
              </div>
          </div>
      </div>
      
      
      <WebsiteFooter />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
