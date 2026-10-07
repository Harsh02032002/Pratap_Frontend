import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://roohmy-backend-xwa9.vercel.app");

const mergeVisitsByIdentity = (primary = [], secondary = []) => {
  const map = new Map();
  [...(primary || []), ...(secondary || [])].forEach((visit) => {
    if (!visit) return;
    const key = visit._id || visit.visitId;
    if (!key) return;
    map.set(key, { ...(map.get(key) || {}), ...visit });
  });
  return Array.from(map.values());
};

const toStorageSafeVisit = (visit) => {
  if (!visit || typeof visit !== "object") return visit;

  const propertyInfo = visit.propertyInfo && typeof visit.propertyInfo === "object"
    ? {
        ...visit.propertyInfo,
        photos: [],
        professionalPhotos: [],
        imageBase64: "",
        image: "",
        photo_building: [],
        photo_room: [],
        photo_bathroom: [],
        photo_bed: [],
        photo_extra: []
      }
    : visit.propertyInfo;

  return {
    ...visit,
    photos: [],
    professionalPhotos: [],
    fieldPhotos: [],
    profPhotos: [],
    imageBase64: "",
    image: "",
    studentReviews: typeof visit.studentReviews === "string" ? visit.studentReviews.slice(0, 500) : visit.studentReviews,
    internalRemarks: typeof visit.internalRemarks === "string" ? visit.internalRemarks.slice(0, 500) : visit.internalRemarks,
    cleanlinessNote: typeof visit.cleanlinessNote === "string" ? visit.cleanlinessNote.slice(0, 500) : visit.cleanlinessNote,
    ownerBehaviour: typeof visit.ownerBehaviour === "string" ? visit.ownerBehaviour.slice(0, 500) : visit.ownerBehaviour,
    propertyInfo
  };
};

const persistLocalVisits = (list) => {
  const safeList = (Array.isArray(list) ? list : []).map(toStorageSafeVisit);
  const payload = JSON.stringify(safeList);

  try {
    localStorage.setItem("roomhy_visits", payload);
  } catch (error) {
    console.warn("Failed to persist roomhy_visits in localStorage:", error);
    try {
      localStorage.removeItem("roomhy_visits");
    } catch (_) {}
  }

  try {
    sessionStorage.setItem("roomhy_visits", payload);
  } catch (error) {
    console.warn("Failed to persist roomhy_visits in sessionStorage:", error);
    try {
      sessionStorage.removeItem("roomhy_visits");
    } catch (_) {}
  }
};

export default function SuperadminEnquiry() {
  useHtmlPage({
    title: "Roomhy - Admin Enquiry",
    bodyClass: "bg-gray-50 text-slate-800",
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
      { rel: "stylesheet", href: "/superadmin/assets/css/enquiry.css" }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" },
      { src: "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js" }
    ],
    inlineScripts: []
  });

  const apiUrl = getApiUrl();
  const [visits, setVisits] = useState([]);
  const [roomApprovals, setRoomApprovals] = useState([]);
  const [activeTab, setActiveTab] = useState("visits");
  const [currentApprovingId, setCurrentApprovingId] = useState(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState({ loginId: "--", password: "--" });
  const [galleryImages, setGalleryImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const pollRef = useRef(null);
  const visibilityRef = useRef(null);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [visits, roomApprovals, activeTab, showApprove, showSuccess, showGallery, notifications, showNotif]);

  useEffect(() => {
    fetchEnquiries();
    fetchRoomApprovals();
    startPolling();
    const interval = setInterval(fetchEnquiries, 15000);
    return () => {
      clearInterval(interval);
      stopPolling();
    };
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
    } catch (error) {
      console.error("Error fetching notifications:", error);
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
    } catch (error) {
      console.error("Error marking all as read:", error);
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
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const loadLocalVisits = () => {
    let localList = [];
    let sessionList = [];
    try {
      localList = JSON.parse(localStorage.getItem("roomhy_visits") || "[]");
    } catch (_) {}
    try {
      sessionList = JSON.parse(sessionStorage.getItem("roomhy_visits") || "[]");
    } catch (_) {}
    return mergeVisitsByIdentity(localList, sessionList);
  };

  const fetchEnquiries = async () => {
    let list = [];
    try {
      const response = await fetch(`${apiUrl}/api/visits/pending`);
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      const allVisits = data.visits || data || [];
      list = allVisits.filter((v) => ["submitted", "pending", "pending_review"].includes(v.status));
    } catch (_) {
      list = loadLocalVisits();
    }
    list = list.filter((v) => ["pending", "submitted"].includes(v.status));
    setVisits(list);
  };

  const fetchRoomApprovals = () => {
    const list = loadLocalVisits();
    const pending = list.filter((v) => v.status === "pending" && (v.type === "room_add" || v.type === "bed_add"));
    setRoomApprovals(pending);
  };

  const statusCounts = useMemo(() => {
    const list = loadLocalVisits();
    return {
      approved: list.filter((v) => v.status === "approved").length,
      hold: list.filter((v) => v.status === "hold").length,
      rejected: list.filter((v) => v.status === "rejected").length
    };
  }, [visits]);

  const openApproveModal = (visitId) => {
    setCurrentApprovingId(visitId);
    setShowApprove(true);
  };

  const confirmApproval = async (shouldUpload) => {
    if (!currentApprovingId) return;
    const loginId = `ROOMHY${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    const password = Math.random().toString(36).slice(-8);

    let localVisits = loadLocalVisits();
    const idx = localVisits.findIndex((v) => v._id === currentApprovingId || v.visitId === currentApprovingId);
    const visitData = idx !== -1 ? localVisits[idx] : { _id: currentApprovingId, visitId: currentApprovingId };

    if (idx !== -1) {
      localVisits[idx].status = "approved";
      localVisits[idx].isLiveOnWebsite = shouldUpload;
      localVisits[idx].generatedCredentials = { loginId, tempPassword: password };
      persistLocalVisits(localVisits);
    }

    try {
      await fetch(`${apiUrl}/api/visits/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId: currentApprovingId,
          status: "approved",
          isLiveOnWebsite: shouldUpload,
          loginId,
          tempPassword: password,
          ownerName: visitData.ownerName || visitData.name || "Owner",
          name: visitData.ownerName || visitData.name || "Owner"
        })
      });
    } catch (err) {
      console.warn("Backend sync failed:", err);
    }

    setGeneratedCreds({ loginId, password });
    setShowApprove(false);
    setShowSuccess(true);
    setCurrentApprovingId(null);
    fetchEnquiries();
  };

  const holdVisit = async (id) => {
    const reason = prompt("Enter hold reason:");
    if (reason === null) return;
    try {
      const response = await fetch(`${apiUrl}/api/visits/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: id, holdReason: reason })
      });
      const data = await response.json();
      if (data.success) {
        alert("Visit held successfully");
        fetchEnquiries();
      } else {
        alert("Error holding visit: " + data.message);
      }
    } catch (error) {
      console.error("Error holding visit:", error);
      alert("Error holding visit: " + error.message);
    }
  };

  const viewGallery = (photos) => {
    setGalleryImages(Array.isArray(photos) ? photos : []);
    setShowGallery(true);
  };

  const closeGallery = () => {
    setShowGallery(false);
    setGalleryImages([]);
  };

  const openMap = (id) => {
    const list = loadLocalVisits();
    const v = list.find((x) => x._id === id || x.visitId === id);
    if (!v || !v.latitude || !v.longitude) {
      alert("No geo-location available for this visit.");
      return;
    }
    const url = `https://www.google.com/maps?q=${v.latitude},${v.longitude}`;
    window.open(url, "_blank");
  };

  const exportVisitsExcel = () => {
    if (!window.XLSX) {
      alert("Excel export library not loaded.");
      return;
    }
    const rows = visits.map((v) => ({
      VisitId: v.visitId || v._id,
      Property: v.propertyName || v.propertyInfo?.name || "-",
      Owner: v.ownerName || v.propertyInfo?.ownerName || "-",
      Status: v.status || "-"
    }));
    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Visits");
    const date = new Date().toISOString().split("T")[0];
    window.XLSX.writeFile(wb, `Roomhy_Visits_${date}.xlsx`);
  };

  const approveRoomNotification = (id, approve) => {
    const list = loadLocalVisits();
    const idx = list.findIndex((v) => v._id === id);
    if (idx === -1) return;
    list[idx].status = approve ? "approved" : "rejected";
    persistLocalVisits(list);
    fetchRoomApprovals();
  };

  const currentPage = "enquiry";

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div><img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" /><span className="text-[10px] text-gray-500">SUPER ADMIN</span></div>
            </div>
          </div>
          <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white h-16 shadow-sm flex items-center justify-between px-8 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button className="md:hidden text-slate-500"><i data-lucide="menu" className="w-6 h-6"></i></button>
              <h1 className="text-xl font-bold text-gray-800">Pending Approvals</h1>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={fetchEnquiries} className="text-sm text-purple-600 hover:underline flex items-center gap-1">
                <i data-lucide="refresh-cw" className="w-3 h-3"></i> Refresh
              </button>
              <button onClick={exportVisitsExcel} className="text-sm text-gray-600 hover:underline flex items-center gap-1">
                <i data-lucide="download" className="w-3 h-3"></i> Export
              </button>
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
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="status-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Approved</p><h3 className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.approved}</h3></div>
                    <div className="bg-green-50 p-4 rounded-full"><i data-lucide="check-circle" className="w-8 h-8 text-green-600"></i></div>
                  </div>
                  <div className="h-1 bg-green-500"></div>
                </div>
                <div className="status-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-500 uppercase tracking-wider">On Hold</p><h3 className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.hold}</h3></div>
                    <div className="bg-orange-50 p-4 rounded-full"><i data-lucide="pause-circle" className="w-8 h-8 text-orange-600"></i></div>
                  </div>
                  <div className="h-1 bg-orange-500"></div>
                </div>
                <div className="status-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Rejected</p><h3 className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.rejected}</h3></div>
                    <div className="bg-red-50 p-4 rounded-full"><i data-lucide="x-circle" className="w-8 h-8 text-red-600"></i></div>
                  </div>
                  <div className="h-1 bg-red-500"></div>
                </div>
              </div>

              <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-4 pt-4">
                <button onClick={() => setActiveTab("visits")} className={`px-6 py-3 font-semibold transition-all ${activeTab === "visits" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500 border-b-2 border-transparent"}`}>Visit Reports</button>
                <button onClick={() => setActiveTab("rooms")} className={`px-6 py-3 font-semibold transition-all ${activeTab === "rooms" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500 border-b-2 border-transparent"}`}>Room Approvals</button>
              </div>

              {activeTab === "visits" ? (
                <div className="bg-white rounded-b-lg shadow border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase border-b">
                        <tr>
                          <th className="px-4 py-3">Visit ID</th>
                          <th className="px-4 py-3">Visit Date & Time</th>
                          <th className="px-4 py-3">Staff Name</th>
                          <th className="px-4 py-3">Staff ID</th>
                          <th className="px-4 py-3">Property Name</th>
                          <th className="px-4 py-3">Property Type</th>
                          <th className="px-4 py-3">Full Address</th>
                          <th className="px-4 py-3">Area / Locality</th>
                          <th className="px-4 py-3">Landmark</th>
                          <th className="px-4 py-3">Nearby Location</th>
                          <th className="px-4 py-3">Owner Name</th>
                          <th className="px-4 py-3">Owner Contact</th>
                          <th className="px-4 py-3">Owner Gmail</th>
                          <th className="px-4 py-3">Gender</th>
                          <th className="px-4 py-3">Student Reviews</th>
                          <th className="px-4 py-3">Employee Rating</th>
                          <th className="px-4 py-3 text-center">Monthly Rent</th>
                          <th className="px-4 py-3">Amenities</th>
                          <th className="px-4 py-3">Cleanliness</th>
                          <th className="px-4 py-3">Owner Behaviour</th>
                          <th className="px-4 py-3">Field Photos</th>
                          <th className="px-4 py-3">Prof. Photos</th>
                          <th className="px-4 py-3">Geo Status</th>
                          <th className="px-4 py-3">Map</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Login ID</th>
                          <th className="px-4 py-3">Password</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {visits.length === 0 ? (
                          <tr><td colSpan={28} className="px-6 py-12 text-center text-gray-400">No pending reports found.</td></tr>
                        ) : (
                          visits.map((v) => {
                            const prop = v.propertyInfo || {};
                            const fieldPhotos = v.photos || [];
                            const profPhotos = v.professionalPhotos || [];
                            const amenities = (prop.amenities || v.amenities || []).length ? (prop.amenities || v.amenities).join(", ") : "-";
                            const cleanliness = v.cleanlinessRating || v.cleanliness || "-";
                            const ownerBehaviour = v.ownerBehaviourPublic || v.ownerBehaviour || "-";
                            const geoOk = v.latitude && v.longitude ? "OK" : "No Geo";
                            const loginId = v.generatedCredentials ? v.generatedCredentials.loginId || "-" : "-";
                            const password = v.generatedCredentials ? v.generatedCredentials.tempPassword || "-" : "-";

                            return (
                              <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-xs font-mono text-gray-600">{v.visitId || v._id?.slice(-8).toUpperCase()}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{v.submittedAt ? new Date(v.submittedAt).toLocaleString() : "-"}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-slate-700">{v.staffName || prop.staffName || "-"}</td>
                                <td className="px-4 py-3 text-sm">{v.staffId || prop.staffId || "-"}</td>
                                <td className="px-4 py-3"><div className="text-sm font-bold text-slate-700">{v.propertyName || prop.name || "-"}</div></td>
                                <td className="px-4 py-3">{v.propertyType || prop.propertyType || "-"}</td>
                                <td className="px-4 py-3">{v.address || prop.address || "-"}</td>
                                <td className="px-4 py-3">{v.area || prop.area || "-"}</td>
                                <td className="px-4 py-3">{v.landmark || prop.landmark || "-"}</td>
                                <td className="px-4 py-3">{v.nearbyLocation || prop.nearbyLocation || "-"}</td>
                                <td className="px-4 py-3">{v.ownerName || prop.ownerName || "-"}</td>
                                <td className="px-4 py-3">{v.contactPhone || prop.contactPhone || "-"}</td>
                                <td className="px-4 py-3">{v.ownerEmail || prop.ownerEmail || "-"}</td>
                                <td className="px-4 py-3">{v.gender || "-"}</td>
                                <td className="px-4 py-3 text-center bg-amber-50 border-x border-amber-200">
                                  <div className="flex items-center justify-center">
                                    <span className="text-lg font-bold text-amber-600">{v.studentReviewsRating ? "\u2605".repeat(Math.floor(v.studentReviewsRating)) + "\u2606".repeat(5 - Math.floor(v.studentReviewsRating)) : "-"}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center bg-emerald-50 border-x border-emerald-200">
                                  <div className="flex items-center justify-center">
                                    <span className="text-lg font-bold text-emerald-600">{v.employeeRating ? "\u2605".repeat(Math.floor(v.employeeRating)) + "\u2606".repeat(5 - Math.floor(v.employeeRating)) : "-"}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center font-bold">{"\u20B9"}{v.monthlyRent || prop.monthlyRent || 0}</td>
                                <td className="px-4 py-3 text-sm">{amenities}</td>
                                <td className="px-4 py-3">{cleanliness}</td>
                                <td className="px-4 py-3">{ownerBehaviour}</td>
                                <td className="px-4 py-3">
                                  <button onClick={() => viewGallery(fieldPhotos)} className="text-[10px] text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-200 font-medium hover:bg-purple-100 transition">{fieldPhotos.length}</button>
                                </td>
                                <td className="px-4 py-3">
                                  <button onClick={() => viewGallery(profPhotos)} className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 font-medium hover:bg-blue-100 transition">{profPhotos.length}</button>
                                </td>
                                <td className="px-4 py-3">{geoOk}</td>
                                <td className="px-4 py-3">
                                  <button onClick={() => openMap(v.visitId || v._id)} className="text-xs px-2 py-1 bg-gray-50 rounded border text-gray-600 hover:bg-gray-100" disabled={!(v.latitude && v.longitude)}>Map</button>
                                </td>
                                <td className="px-4 py-3">{v.status || "-"}</td>
                                <td className="px-4 py-3 font-mono text-sm text-purple-700">{loginId}</td>
                                <td className="px-4 py-3 font-mono text-sm">{password}</td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => openApproveModal(v.visitId || v._id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Approve"><i data-lucide="check" className="w-4 h-4"></i></button>
                                    <button onClick={() => holdVisit(v.visitId || v._id)} className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors" title="Hold"><i data-lucide="pause" className="w-4 h-4"></i></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-b-lg shadow border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase border-b">
                        <tr>
                          <th className="px-6 py-4">Owner Name</th>
                          <th className="px-6 py-4">Room No</th>
                          <th className="px-6 py-4">Rent/mo</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {roomApprovals.length === 0 ? (
                          <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No room approvals pending.</td></tr>
                        ) : (
                          roomApprovals.map((n) => (
                            <tr key={n._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm">{n.submittedBy || n.propertyInfo?.ownerName || "-"}</td>
                              <td className="px-6 py-4 text-sm font-mono">{n.room?.number || n.room?.id || "-"}</td>
                              <td className="px-6 py-4 text-right font-bold">{"\u20B9"}{n.room?.rent ?? "-"}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => approveRoomNotification(n._id, true)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">Approve</button>
                                  <button onClick={() => approveRoomNotification(n._id, false)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      {showApprove ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-xl">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3"><i data-lucide="upload-cloud" className="w-6 h-6 text-blue-600"></i></div>
            <h3 className="text-lg font-bold text-gray-900">Approve Property</h3>
            <p className="text-sm text-gray-600 mb-6">Would you like to upload this property to the website?</p>
            <div className="flex gap-3">
              <button onClick={() => confirmApproval(true)} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium">Yes, Upload</button>
              <button onClick={() => confirmApproval(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition font-medium">No, Keep Offline</button>
            </div>
          </div>
        </div>
      ) : null}

      {showSuccess ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-xl">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><i data-lucide="check" className="w-6 h-6 text-green-600"></i></div>
            <h3 className="text-lg font-bold text-gray-900">Approved!</h3>
            <p className="text-sm text-gray-500 mb-4">Credentials generated successfully.</p>
            <div className="bg-gray-50 p-3 rounded text-left mb-4 border border-gray-200">
              <div className="text-xs text-gray-500">Login ID:</div><div className="font-mono font-bold text-purple-600">{generatedCreds.loginId}</div>
              <div className="text-xs text-gray-500 mt-2">Password:</div><div className="font-mono font-bold text-slate-600">{generatedCreds.password}</div>
            </div>
            <button onClick={() => { setShowSuccess(false); fetchEnquiries(); }} className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition">Close</button>
          </div>
        </div>
      ) : null}

      {showGallery ? (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] backdrop-blur-sm" onClick={closeGallery}>
          <div className="relative w-full max-w-4xl p-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeGallery} className="absolute -top-10 right-0 text-white"><i data-lucide="x" className="w-8 h-8"></i></button>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto p-4">
              {galleryImages.length > 0 ? galleryImages.map((src, idx) => (
                <img key={`${src}-${idx}`} src={src} className="w-full h-48 object-cover rounded-xl shadow-lg border border-gray-200" />
              )) : (
                <p className="text-white text-center py-20">No images available for this section.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}




