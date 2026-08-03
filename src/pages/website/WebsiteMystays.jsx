import React, { useCallback, useEffect, useMemo, useState } from "react";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl, getWebsiteUserEmail, getWebsiteUserId, logoutWebsite } from "../../utils/websiteSession";
import { useLucideIcons, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
export default function WebsiteMystays() {
  useWebsiteCommon();
  useWebsiteMenu();

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [bookings, setBookings] = useState([]);
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
  const [feedback, setFeedback] = useState("");

  useLucideIcons([bookings, selectedBooking, requestType, paymentMethod]);

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
    const collected = [];
    const seen = new Set();

    const addBooking = (booking) => {
      if (!booking || typeof booking !== "object") return;
      const key = booking.booking_id || booking.bookingId || booking._id || booking.id;
      const fallbackKey = `${booking.user_id || booking.userId || ""}::${booking.property_id || booking.propertyId || ""}::${booking.payment_id || booking.paymentId || ""}`;
      const finalKey = String(key || fallbackKey);
      if (!finalKey || seen.has(finalKey)) return;
      seen.add(finalKey);
      collected.push(booking);
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
          const apiBookings = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          apiBookings.forEach(addBooking);
          break;
        } catch (err) {
          console.warn("Booking API failed:", err);
          break;
        }
      }
    }

    collected.sort((a, b) => {
      const aTime = new Date(a.created_at || a.createdAt || a.submittedAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.created_at || b.createdAt || b.submittedAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });

    setBookings(collected);
    setLoading(false);
  }, [apiUrl]);

  useEffect(() => {
    collectBookings();
  }, [collectBookings]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  const openRefundModal = (booking, type = "refund") => {
    setSelectedBooking(booking);
    setRequestType(type);
    setPaymentMethod("upi");
    setFormData((prev) => ({
      ...prev,
      name: booking.name || booking.user_name || "",
      phone: booking.phone || booking.user_phone || "",
      email: booking.email || booking.user_email || booking.userEmail || ""
    }));
  };

  const closeRefundModal = () => {
    setSelectedBooking(null);
    setFeedback("");
  };

  const handleRefundSubmit = async () => {
    if (!selectedBooking) return;
    const name = formData.name.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim();
    if (!name || !phone) {
      setFeedback("Please enter name and 8764425030.");
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
      refund_amount: Number(selectedBooking.total_amount || selectedBooking.totalAmount || selectedBooking.price || 500),
      request_type: requestType,
      refund_method: requestType === "refund" ? paymentMethod : null,
      upi_id: paymentMethod === "upi" ? formData.upiId.trim() : null,
      bank_account_holder: paymentMethod === "bank" ? formData.bankAccountName.trim() : null,
      bank_account_number: paymentMethod === "bank" ? formData.bankAccount.trim() : null,
      bank_ifsc_code: paymentMethod === "bank" ? formData.ifscCode.trim() : null,
      bank_name: paymentMethod === "bank" ? formData.bankName.trim() : null,
      preferred_area: requestType === "alternative_property" ? formData.preferredArea.trim() : null,
      property_requirements: requestType === "alternative_property" ? formData.requirements.trim() : null
    };

    setSubmitting(true);
    setFeedback("");
    try {
      const res = await fetch(`${apiUrl}/api/booking/refund-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Request failed");
      }
      closeRefundModal();
    } catch (err) {
      console.warn("Refund request failed:", err);
      const submissions = JSON.parse(localStorage.getItem("refundSubmissions") || "[]");
      submissions.push({ ...payload, submitted_at: new Date().toISOString(), status: "pending_sync" });
      localStorage.setItem("refundSubmissions", JSON.stringify(submissions));
      closeRefundModal();
    } finally {
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
            Manage your property bookings with ease
          </p>

          {/* Bottom Accent Dot */}
          <div className="mt-4 w-1.5 h-1.5 rounded-full bg-[#C5A059]/30"></div>
        </div>
      </div>
      
          <main className="container mx-auto px-4 sm:px-6 py-16">
              
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

                    const mainImage =
                      extractImageUrls(booking.propertyImage)[0] ||
                      extractImageUrls(booking.property_image)[0] ||
                      extractImageUrls(booking.property_photo)[0] ||
                      extractImageUrls(booking.image)[0] ||
                      extractImageUrls(booking.thumbnail)[0] ||
                      photos[0] ||
                      `https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=1974&auto=format&fit=crop&property=${booking.propertyId || booking.property_id || "default"}`;

                    const thumbs = photos.slice(0, 4);
                    const propertyId = booking.propertyId || booking.property_id || booking._id || "N/A";
                    const displayPropertyId =
                      String(propertyId).length > 20 ? `${String(propertyId).slice(0, 12)}...` : String(propertyId);
                    const bookingStatus = String(booking.booking_status || booking.status || "confirmed").replace(/_/g, " ");

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

                          <div className="mb-3 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                            <span className="text-blue-700 font-semibold block mb-1">Property ID</span>
                            <span title={propertyId} className="block font-mono text-xs break-all">{displayPropertyId}</span>
                          </div>

                          <div className="mb-3">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 border border-green-200">
                              Booking {bookingStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-gray-200 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 font-semibold uppercase">Check-in</p>
                              <p className="font-bold text-gray-900 text-sm">
                                {formatDate(booking.check_in_date || booking.checkInDate || booking.start_date)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-semibold uppercase">Check-out</p>
                              <p className="font-bold text-gray-900 text-sm">
                                {formatDate(booking.check_out_date || booking.checkOutDate || booking.end_date)}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-700 font-medium">Total Amount:</span>
                            <span className="text-2xl font-bold text-blue-600">
                              ₹{Number(booking.total_amount || booking.totalAmount || booking.price || 0).toLocaleString("en-IN")}
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

                          <div className="flex gap-3 pt-4 mt-auto">
                            <button
                              onClick={() => openRefundModal(booking, "refund")}
                              className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm"
                            >
                              <i data-lucide="undo-2" className="w-4 h-4"></i>
                              <span>Refund</span>
                            </button>
                            <button
                              onClick={() => openRefundModal(booking, "alternative_property")}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                            >
                              <i data-lucide="repeat" className="w-4 h-4"></i>
                              <span>Alternative</span>
                            </button>
                          </div>
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
          </main>
      
      
      <div id="refundModal" className={`modal fixed inset-0 z-50 ${selectedBooking ? "flex" : "hidden"} bg-black bg-opacity-50 overflow-y-auto`}>
          <div className="flex items-center justify-center min-h-screen px-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                  
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white">Refund Request</h2>
                      <button onClick={closeRefundModal} className="text-white hover:text-gray-200">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                  </div>
      
                  
                  <div className="p-8 space-y-6">
                      
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h3 className="font-bold text-purple-900 mb-2" id="modalPropertyName">
                            {selectedBooking?.property_name || selectedBooking?.propertyName || "Property"}
                          </h3>
                          <p className="text-purple-800 text-sm" id="modalPropertyDetails">
                            {selectedBooking?.property_location || selectedBooking?.location || selectedBooking?.area || ""}
                          </p>
                      </div>
      
                      
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">What would you like to do?</label>
                          <div className="space-y-3">
                              <div className="flex items-center">
                                  <input type="radio" id="refundOption" name="requestType" value="refund" checked={requestType === "refund"} onChange={() => setRequestType("refund")} className="h-4 w-4 text-purple-600" />
                                  <label htmlFor="refundOption" className="ml-3 flex flex-col">
                                      <span className="text-sm font-semibold text-gray-900">Request Refund</span>
                                      <span className="text-xs text-gray-600">Get ₹500 refund to your UPI/Bank account</span>
                                  </label>
                              </div>
                              <div className="flex items-center">
                                  <input type="radio" id="alternativeOption" name="requestType" value="alternative_property" checked={requestType === "alternative_property"} onChange={() => setRequestType("alternative_property")} className="h-4 w-4 text-purple-600" />
                                  <label htmlFor="alternativeOption" className="ml-3 flex flex-col">
                                      <span className="text-sm font-semibold text-gray-900">Alternative Property</span>
                                      <span className="text-xs text-gray-600">Browse other properties instead</span>
                                  </label>
                              </div>
                          </div>
                      </div>
      
                      
                      <div id="refundForm" className={`space-y-4 ${requestType === "refund" ? "" : "hidden"}`}>
                          
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                              <input type="text" id="refundName" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Enter your name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
                          </div>
      
                          
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">8764425030</label>
                              <input type="tel" id="refundPhone" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
                          </div>
      
                          
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                              <input type="email" id="refundEmail" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="your.email@gmail.com" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
                          </div>
      
                          
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
                              <div className="grid grid-cols-3 gap-3">
                                  
                                  <div className="flex items-center">
                                      <input type="radio" id="upiMethod" name="paymentMethod" value="upi" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} className="h-4 w-4 text-purple-600" />
                                      <label htmlFor="upiMethod" className="ml-3 flex flex-col cursor-pointer flex-1">
                                          <span className="text-sm font-semibold text-gray-900">UPI</span>
                                          <span className="text-xs text-gray-600">Fast & Instant</span>
                                      </label>
                                  </div>
                                  
                                  <div className="flex items-center">
                                      <input type="radio" id="bankMethod" name="paymentMethod" value="bank" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} className="h-4 w-4 text-purple-600" />
                                      <label htmlFor="bankMethod" className="ml-3 flex flex-col cursor-pointer flex-1">
                                          <span className="text-sm font-semibold text-gray-900">Bank</span>
                                          <span className="text-xs text-gray-600">Transfer</span>
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
      
                      
                      <div id="alternativeForm" className={`space-y-4 ${requestType === "alternative_property" ? "" : "hidden"}`}>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Area/Location</label>
                              <input type="text" id="preferredArea" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="e.g., Whitefield, Marathahalli" value={formData.preferredArea} onChange={(e) => setFormData((prev) => ({ ...prev, preferredArea: e.target.value }))} />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Requirements</label>
                              <textarea id="propertyRequirements" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" rows="3" placeholder="Any specific requirements..." value={formData.requirements} onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}></textarea>
                          </div>
                      </div>
      
                      
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800">
                              <span className="font-semibold">Refund Amount:</span> <span className="text-2xl font-bold text-green-600">₹{Number(selectedBooking?.total_amount || selectedBooking?.totalAmount || selectedBooking?.price || 500)}</span>
                          </p>
                      </div>
                      {feedback && <p className="text-sm text-red-600">{feedback}</p>}
                  </div>
      
                  
                  <div className="bg-gray-50 px-8 py-4 flex justify-between gap-3">
                      <button onClick={closeRefundModal} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100">
                          Cancel
                      </button>
                      <button onClick={handleRefundSubmit} disabled={submitting} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
                          {submitting ? "Submitting..." : "Submit Request"}
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

