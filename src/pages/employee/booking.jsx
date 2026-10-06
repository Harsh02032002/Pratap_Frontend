import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://roohmy-backend-xwa9.vercel.app");

const toNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = Number(String(val).replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? num : 0;
};

const formatCurrency = (val) => {
  const num = toNumber(val);
  return num.toLocaleString("en-IN");
};

const getPaymentInfo = (booking) => {
  const method = (booking.payment_method || booking.paymentMethod || "").toLowerCase();
  let paymentType = "N/A";
  let cardDetails = "N/A";

  if (method.includes("upi")) {
    paymentType = "UPI";
    cardDetails =
      booking.upi_id ||
      booking.payment_details?.upi_id ||
      booking.upi ||
      booking.upi_address ||
      "N/A";
  } else if (method.includes("card")) {
    paymentType = "Card";
    if (booking.card_last_four) {
      cardDetails = `****${booking.card_last_four}`;
    } else if (booking.payment_details?.card_last_four) {
      cardDetails = `****${booking.payment_details.card_last_four}`;
    } else if (booking.card_number) {
      cardDetails = `****${String(booking.card_number).slice(-4)}`;
    } else if (booking.payment_details?.card_number) {
      cardDetails = `****${String(booking.payment_details.card_number).slice(-4)}`;
    } else {
      cardDetails = "Card Payment";
    }
  } else if (method.includes("other") || method.includes("cash") || method.includes("bank")) {
    paymentType = booking.payment_method || booking.paymentMethod || "Other";
    cardDetails =
      booking.payment_details?.reference_id ||
      booking.reference_id ||
      booking.transaction_id ||
      booking.bank_name ||
      "Payment Pending";
  } else if (booking.payment_method || booking.paymentMethod) {
    paymentType = booking.payment_method || booking.paymentMethod;
    cardDetails =
      booking.payment_details?.id ||
      booking.payment_id ||
      booking.transaction_id ||
      "N/A";
  }

  return { paymentType, cardDetails };
};

const getFullAddress = (booking) => {
  if (booking.address_street || booking.address_city || booking.address_state || booking.address_postal_code) {
    return `${booking.address_street || ""}, ${booking.address_city || ""}, ${booking.address_state || ""}, ${booking.address_postal_code || ""}`
      .replace(/^,\s*|,\s*$/g, "")
      .trim();
  }
  if (booking.address) {
    if (typeof booking.address === "string") return booking.address;
    return `${booking.address.street || ""}, ${booking.address.city || ""}, ${booking.address.state || ""}, ${booking.address.postalCode || ""}`
      .replace(/^,\s*|,\s*$/g, "")
      .trim();
  }
  if (booking.full_address) return booking.full_address;
  return "N/A";
};

const paymentStatusBadge = (status) => {
  const val = String(status || "").toLowerCase();
  if (val === "completed" || val === "success" || val === "paid") return "bg-green-100 text-green-800";
  if (val === "failed") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
};

const buildCsv = (rows) => {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return rows.map((row) => row.map(escape).join(",")).join("\n");
};

export default function SuperadminBooking() {
  useHtmlPage({
    title: "Roomhy - Bookings",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    bases: [],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/superadmin/assets/css/booking.css" }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const apiUrl = getApiUrl();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const pollRef = useRef(null);
  const visibilityRef = useRef(null);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [bookings, loading, showCreate, showView, mobileOpen, financeOpen, settingsOpen, showNotif, notifications]);

  useEffect(() => {
    loadBookings();
    startPolling();
    return () => stopPolling();
  }, []);

  const startPolling = () => {
    stopPolling();
    // Badge-only poll: skipped while the tab is hidden (nothing to show), and
    // refreshed as soon as the tab is visible again.
    pollRef.current = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      fetchNotifications();
    }, 5000);
    visibilityRef.current = () => {
      if (document.visibilityState === "visible") fetchNotifications();
    };
    document.addEventListener("visibilitychange", visibilityRef.current);
    fetchNotifications();
  };

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    if (visibilityRef.current) document.removeEventListener("visibilitychange", visibilityRef.current);
    visibilityRef.current = null;
  };

  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      const res = await fetch(`${apiUrl}/api/notifications?unread=true&toLoginId=superadmin`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const payload = await res.json();
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload.notifications) ? payload.notifications : []);
      setNotifications(list);
      setUnreadCount(list.length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      await fetch(`${apiUrl}/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ toLoginId: "superadmin", toRole: "superadmin" })
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const clearAll = async () => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      await fetch(`${apiUrl}/api/notifications/delete-read?toLoginId=superadmin`, { 
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/api/booking/requests?status=confirmed`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const list = payload.data || payload.bookings || payload || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Error loading bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return bookings.filter((b) => {
      const statusVal = String(b.payment_status || b.status || "").toLowerCase();
      if (statusFilter && statusVal !== statusFilter) return false;
      if (!term) return true;
      const fields = [
        b._id,
        b.bookingId,
        b.property_id,
        b.property_name,
        b.name,
        b.tenant_name,
        b.phone,
        b.email
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(term);
    });
  }, [bookings, searchTerm, statusFilter]);

  const exportCsv = () => {
    if (!filteredBookings.length) {
      alert("No data to export.");
      return;
    }
    const rows = [
      [
        "Property ID",
        "Property Name",
        "Area",
        "Type",
        "Rent",
        "User ID",
        "Tenant Name",
        "Phone",
        "Email",
        "Guardian Name",
        "Guardian Phone",
        "Address",
        "Payment ID",
        "Payment Amount",
        "Payment Method",
        "Payment Type",
        "Card/UPI Details",
        "Payment Status",
        "Request Type",
        "Bid Amount",
        "Message"
      ],
      ...filteredBookings.map((b) => {
        const { paymentType, cardDetails } = getPaymentInfo(b);
        return [
          b.property_id || b.propertyId || b.property || "N/A",
          b.property_name || b.propertyName || "N/A",
          b.area || b.location || b.city || "N/A",
          b.property_type || b.roomType || b.type || "N/A",
          formatCurrency(b.rent_amount || b.rent || b.monthly_rent || 0),
          b.user_id || b.userId || b.customer_id || "N/A",
          b.name || b.tenant_name || b.full_name || b.fullName || "N/A",
          b.phone || b.contact_phone || b.mobile || "N/A",
          b.email || b.contact_email || "N/A",
          b.guardian_name || b.guardianName || "N/A",
          b.guardian_phone || b.guardianPhone || "N/A",
          getFullAddress(b),
          b.payment_id || b.paymentId || b.razorpay_payment_id || b.transaction_id || "N/A",
          formatCurrency(b.payment_amount || b.paymentAmount || b.advance_amount || b.amount || 0),
          b.payment_method || b.paymentMethod || "N/A",
          paymentType,
          cardDetails,
          b.payment_status || b.status || "Pending",
          b.request_type || b.requestType || b.type || "Booking",
          formatCurrency(b.bid_amount || b.bidAmount || 0),
          b.message || b.notes || b.comment || "N/A"
        ];
      })
    ];
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Roomhy_Bookings_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openView = (booking) => {
    setSelectedBooking(booking);
    setShowView(true);
  };

  const closeView = () => {
    setShowView(false);
    setSelectedBooking(null);
  };

  const currentPage = "booking";
  const selectedPayment = selectedBooking ? getPaymentInfo(selectedBooking) : { paymentType: "N/A", cardDetails: "N/A" };

  return (
    <div className="html-page">
      <div
        id="mobile-sidebar-overlay"
        className={`fixed inset-0 bg-black/50 z-30 md:hidden ${mobileOpen ? "" : "hidden"}`}
        onClick={() => setMobileOpen(false)}
      ></div>

      <div className="flex h-screen overflow-hidden">
        <aside className={`sidebar w-72 flex-shrink-0 ${mobileOpen ? "flex" : "hidden"} md:flex flex-col z-20 overflow-y-auto custom-scrollbar fixed md:static inset-y-0 left-0 transform ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} transition-transform duration-300`}>
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div>
                <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
                <span className="text-[10px] text-gray-500">SUPER ADMIN</span>
              </div>
            </div>
            <button className="md:hidden ml-auto p-2 text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>
              <i data-lucide="x" className="w-5 h-5"></i>
            </button>
          </div>
          <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center">
              <button className="md:hidden mr-4 text-slate-500" onClick={() => setMobileOpen(true)}>
                <i data-lucide="menu" className="w-6 h-6"></i>
              </button>
              <div className="flex items-center text-sm">
                <span className="text-slate-500 font-medium">Operations</span>
                <i data-lucide="chevron-right" className="w-4 h-4 mx-2 text-slate-400"></i>
                <span className="text-slate-800 font-semibold">Bookings</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => setShowNotif((v) => !v)} className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <i data-lucide="bell" className="w-5 h-5"></i>
                  {unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </button>
                {showNotif ? (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                      <div className="flex gap-2">
                        <button onClick={markAllRead} className="text-xs text-purple-600 hover:text-purple-800">Mark all read</button>
                        <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-400">
                          <i data-lucide="bell-off" className="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((n) => {
                          const ts = new Date(n.createdAt || Date.now()).toLocaleString();
                          const title =
                            n.type === "new_booking" ? "New Booking" :
                            n.type === "new_enquiry" ? "New Enquiry" :
                            n.type === "new_signup" ? "New Signup" : "Notification";
                          const body =
                            n.type === "new_booking"
                              ? `Property: ${n.meta?.propertyName || "Unknown"} | Guest: ${n.meta?.guestName || n.meta?.userName || "Unknown"}`
                              : n.type === "new_enquiry"
                                ? `${n.meta?.userName || "Someone"} enquired about ${n.meta?.propertyName || "a property"}`
                                : n.type === "new_signup"
                                  ? `${n.meta?.firstName || n.meta?.userName || "A user"} signed up (${n.meta?.email || "no email"})`
                                  : n.from || "New notification";
                          return (
                            <div key={n._id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1"><i data-lucide="bell" className="w-5 h-5 text-gray-500"></i></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                                  <p className="text-xs text-gray-600 mt-1">{body}</p>
                                  <p className="text-xs text-gray-400 mt-2">{ts}</p>
                                </div>
                                {!n.read ? <span className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full"></span> : null}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative group">
                <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-xs">SP</div>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Booking Requests</h1>
                  <p className="text-sm text-slate-500 mt-1">Manage new booking requests, verify payments, and schedule move-ins.</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center shadow-md transition-all hover:shadow-lg">
                  <i data-lucide="plus" className="w-4 h-4 mr-2"></i> Create Booking
                </button>
              </div>

              <div className="bg-white p-4 rounded-t-xl border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="relative w-full md:w-96">
                  <input
                    type="text"
                    placeholder="Search Booking ID, Tenant Name..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <i data-lucide="search" className="w-4 h-4 text-gray-400 absolute left-3 top-3"></i>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
                  <select
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending Approval</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button onClick={exportCsv} className="p-2 hover:bg-white rounded-md text-gray-600 transition-all shadow-sm" title="Export">
                      <i data-lucide="download" className="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-b-xl shadow-sm overflow-hidden border border-gray-200 border-t-0">
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Property ID</th>
                        <th>Property Name</th>
                        <th>Area</th>
                        <th>Type</th>
                        <th>Rent</th>
                        <th>User ID</th>
                        <th>Tenant Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Guardian Name</th>
                        <th>Guardian Phone</th>
                        <th>Address</th>
                        <th>Payment ID</th>
                        <th>Payment Amount</th>
                        <th>Payment Method</th>
                        <th>Payment Type</th>
                        <th>Card/UPI Details</th>
                        <th>Payment Status</th>
                        <th>Request Type</th>
                        <th>Bid Amount</th>
                        <th>Message</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr className="text-center py-8 text-gray-500">
                          <td colSpan={22} className="py-8">
                            <i data-lucide="inbox" className="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                            <p>Loading bookings...</p>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={22} className="py-8 text-center text-red-500">
                            <i data-lucide="alert-circle" className="w-12 h-12 mx-auto mb-3"></i>
                            <p>{error}</p>
                          </td>
                        </tr>
                      ) : filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={22} className="py-8 text-center text-gray-500">
                            <i data-lucide="inbox" className="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                            <p>No confirmed bookings found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((booking) => {
                          const paymentAmt = booking.payment_amount || booking.paymentAmount || booking.advance_amount || booking.amount || 0;
                          const rentAmt = booking.rent_amount || booking.rent || booking.monthly_rent || 0;
                          const guardianName = booking.guardian_name || booking.guardianName || "N/A";
                          const guardianPhone = booking.guardian_phone || booking.guardianPhone || "N/A";
                          const tenantName = booking.name || booking.tenant_name || booking.full_name || booking.fullName || "N/A";
                          const tenantPhone = booking.phone || booking.contact_phone || booking.mobile || "N/A";
                          const tenantEmail = booking.email || booking.contact_email || "N/A";
                          const address = getFullAddress(booking);
                          const { paymentType, cardDetails } = getPaymentInfo(booking);
                          const paymentStatus = booking.payment_status || booking.status || "Pending";
                          const message = booking.message || booking.notes || booking.comment || "N/A";

                          return (
                            <tr key={booking._id || booking.id || `${booking.property_id}-${tenantEmail}`} className="hover:bg-gray-50 text-sm border-b border-gray-200">
                              <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{booking.property_id || booking.propertyId || booking.property || "N/A"}</td>
                              <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{booking.property_name || booking.propertyName || "N/A"}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{booking.area || booking.location || booking.city || "N/A"}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{booking.property_type || booking.roomType || booking.type || "N/A"}</td>
                              <td className="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">{"\u20B9"}{formatCurrency(rentAmt)}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-medium">{booking.user_id || booking.userId || booking.customer_id || "N/A"}</td>
                              <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{tenantName}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-semibold">{tenantPhone}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-sm">{tenantEmail}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{guardianName}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-semibold">{guardianPhone}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs max-w-xs truncate" title={address}>{address}</td>
                              <td className="px-4 py-3 text-gray-900 font-mono whitespace-nowrap text-xs">{booking.payment_id || booking.paymentId || booking.razorpay_payment_id || booking.transaction_id || "N/A"}</td>
                              <td className="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">{"\u20B9"}{formatCurrency(paymentAmt)}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap capitalize">{booking.payment_method || booking.paymentMethod || "N/A"}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-medium">{paymentType}</td>
                              <td className="px-4 py-3 text-gray-900 whitespace-nowrap font-mono text-xs" title={cardDetails}>{String(cardDetails).length > 15 ? `${String(cardDetails).slice(0, 15)}...` : cardDetails}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${paymentStatusBadge(paymentStatus)}`}>
                                  {paymentStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{booking.request_type || booking.requestType || booking.type || "Booking"}</td>
                              <td className="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">{"\u20B9"}{formatCurrency(booking.bid_amount || booking.bidAmount || 0)}</td>
                              <td className="px-4 py-3 text-gray-600 whitespace-nowrap max-w-xs truncate" title={message}>{message}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <button onClick={() => openView(booking)} className="px-3 py-1 rounded bg-purple-100 text-purple-700 text-sm hover:bg-purple-200 transition-colors">View</button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {showView && selectedBooking ? (
        <div className="modal fixed inset-0 z-50 overflow-y-auto flex" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 w-full">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeView}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-lg leading-6 font-bold text-gray-900">
                    Booking #{selectedBooking.bookingId || selectedBooking._id || "N/A"}
                  </h3>
                  <button onClick={closeView} className="text-gray-400 hover:text-gray-500"><i data-lucide="x" className="w-5 h-5"></i></button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Tenant Info</h4>
                    <p className="text-sm font-medium text-gray-900">{selectedBooking.name || selectedBooking.tenant_name || "N/A"}</p>
                    <p className="text-sm text-gray-600">
                      {selectedBooking.phone || selectedBooking.contact_phone || "N/A"} | {selectedBooking.email || selectedBooking.contact_email || "N/A"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Property</h4>
                      <p className="text-sm text-gray-800">{selectedBooking.property_name || selectedBooking.propertyName || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Room Type</h4>
                      <p className="text-sm text-gray-800">{selectedBooking.property_type || selectedBooking.roomType || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Move-in Date</h4>
                      <p className="text-sm text-gray-800">{selectedBooking.move_in_date || selectedBooking.moveInDate || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Duration</h4>
                      <p className="text-sm text-gray-800">{selectedBooking.duration || selectedBooking.stayDuration || "N/A"}</p>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <h4 className="text-xs font-bold text-green-700 uppercase mb-2">Payment Details</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Booking Amount Paid:</span>
                      <span className="font-bold text-gray-900">{"\u20B9"}{formatCurrency(selectedBooking.payment_amount || selectedBooking.paymentAmount || selectedBooking.advance_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Payment Mode:</span>
                      <span className="text-gray-800">{selectedPayment.paymentType} ({selectedPayment.cardDetails})</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:w-auto sm:text-sm">
                  Approve Booking
                </button>
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:w-auto sm:text-sm">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreate ? (
        <div className="modal fixed inset-0 z-50 overflow-y-auto flex" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 w-full">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCreate(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5 border-b pb-2">
                  <h3 className="text-lg leading-6 font-bold text-gray-900">Create Manual Booking</h3>
                  <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-500"><i data-lucide="x" className="w-5 h-5"></i></button>
                </div>

                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Select Property</label>
                      <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                        <option>Sai Residency (Koramangala)</option>
                        <option>Green View PG (Indiranagar)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tenant Name</label>
                      <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Room Type</label>
                      <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                        <option>Single</option>
                        <option>Double Sharing</option>
                        <option>Triple Sharing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Move-in Date</label>
                      <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Advance Payment Amount</label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">{"\u20B9"}</span>
                        </div>
                        <input type="text" className="block w-full rounded-md border-gray-300 pl-7 focus:border-purple-500 focus:ring-purple-500 sm:text-sm" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                  Confirm Booking
                </button>
                <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}




