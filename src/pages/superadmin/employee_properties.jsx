import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Hourglass,
  Check, X, Eye, ClipboardCheck, AlertTriangle, AlertCircle,
  Camera, Map as MapIcon, Star, Edit3, Trash, Bell, BellOff,
  RefreshCw, Download, PauseCircle, ShieldCheck,
  Plus, Loader2, Save, Sparkles, Layers, Box,
  Globe2, IndianRupee, Inbox, Smartphone, Monitor, Info,
  UploadCloud, FileText, Send
} from "lucide-react";
import * as XLSX from "xlsx";
import { PageHeader } from "../../components/superadmin/PageHeader";

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001" : window.location.origin);

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

export default function EmployeePropertyApprovals() {
  const apiUrl = getApiUrl();
  const [visits, setVisits] = useState([]);
  const [propertyUnderOwner, setPropertyUnderOwner] = useState([]);
  const [activeTab, setActiveTab] = useState("properties");
  const [search, setSearch] = useState("");
  const [currentApprovingId, setCurrentApprovingId] = useState(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState({ loginId: "--", password: "--" });
  const [galleryImages, setGalleryImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showVisitDetails, setShowVisitDetails] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [detailsOwnerFresh, setDetailsOwnerFresh] = useState(null);
  const [ownerByLogin, setOwnerByLogin] = useState({});
  const [actionModal, setActionModal] = useState({
    open: false,
    type: "hold",
    visitId: "",
    reason: "",
    action: "edit"
  });
  const [kycLinkSending, setKycLinkSending] = useState(null);

  useEffect(() => {
    fetchEnquiries();
    fetchPropertyUnderOwner();
    const interval = setInterval(fetchEnquiries, 15000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchEnquiries = async () => {
    let list = [];
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      const response = await fetch(`${apiUrl}/api/visits/pending`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
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

  const fetchPropertyUnderOwner = async () => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      const ownerResponse = await fetch(`${apiUrl}/api/owners`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!ownerResponse.ok) throw new Error("Failed to load owners");

      const ownerPayload = await ownerResponse.json();
      const owners = Array.isArray(ownerPayload?.owners) ? ownerPayload.owners : [];
      const ownerMap = {};
      owners.forEach((owner) => {
        if (owner?.loginId) ownerMap[owner.loginId] = owner;
      });
      setOwnerByLogin(ownerMap);
      const rows = (
        await Promise.all(
          owners
            .filter((owner) => owner?.loginId)
            .map(async (owner) => {
              try {
                const propertyResponse = await fetch(`${apiUrl}/api/owners/${encodeURIComponent(owner.loginId)}/properties`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (!propertyResponse.ok) return [];
                const propertyPayload = await propertyResponse.json();
                const properties = Array.isArray(propertyPayload?.properties) ? propertyPayload.properties : [];
                return properties.map((property) => ({
                  ownerLoginId: owner.loginId,
                  ownerName: owner.name || owner.profile?.name || property.ownerName || "-",
                  ownerEmail: owner.email || owner.profile?.email || property.ownerEmail || "-",
                  propertyId: property._id,
                  propertyTitle: property.title || "-",
                  propertyType: property.propertyType || "-",
                  address: property.address || "-",
                  area: property.area || "-",
                  city: property.city || owner.city || owner.profile?.city || "-",
                  locationCode: property.locationCode || "-",
                  monthlyRent: property.monthlyRent ?? 0,
                  vacantRooms: property.vacantRooms ?? owner.vacantRooms ?? 0,
                  vacantBeds: property.vacantBeds ?? owner.vacantBeds ?? 0,
                  occupiedRooms: property.occupiedRooms ?? owner.occupiedRooms ?? 0,
                  occupiedBeds: property.occupiedBeds ?? owner.occupiedBeds ?? 0,
                  status: property.status || "-",
                  createdAt: property.createdAt
                }));
              } catch (_) {
                return [];
              }
            })
        )
      ).flat();

      setPropertyUnderOwner(rows);
    } catch (error) {
      console.error("Error fetching property under owner data:", error);
      setPropertyUnderOwner([]);
      setOwnerByLogin({});
    }
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
    let finalLoginId = loginId;
    let finalPassword = password;
    let backendApprovedVisit = null;

    let localVisits = loadLocalVisits();
    const idx = localVisits.findIndex((v) => v._id === currentApprovingId || v.visitId === currentApprovingId);
    const visitData = idx !== -1 ? localVisits[idx] : { _id: currentApprovingId, visitId: currentApprovingId };

    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      const response = await fetch(`${apiUrl}/api/visits/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          visitId: currentApprovingId,
          status: "approved",
          isLiveOnWebsite: shouldUpload,
          loginId,
          tempPassword: password,
          ownerName:
            visitData.ownerName ||
            visitData.propertyInfo?.ownerName ||
            visitData.owner ||
            visitData.contactPerson ||
            visitData.name ||
            visitData.submittedBy ||
            "Owner",
          name:
            visitData.ownerName ||
            visitData.propertyInfo?.ownerName ||
            visitData.owner ||
            visitData.contactPerson ||
            visitData.name ||
            visitData.submittedBy ||
            "Owner"
        })
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Approve failed");
      }
      finalLoginId = data?.credentials?.loginId || finalLoginId;
      finalPassword = data?.credentials?.tempPassword || finalPassword;
      backendApprovedVisit = data?.visit || null;
    } catch (err) {
      console.warn("Backend sync failed:", err);
      window.alert(err?.message || "Property approval failed. MongoDB save did not complete.");
      return;
    }

    if (idx !== -1) {
      const resolvedOwnerName =
        localVisits[idx].ownerName ||
        localVisits[idx].propertyInfo?.ownerName ||
        localVisits[idx].owner ||
        localVisits[idx].contactPerson ||
        localVisits[idx].name ||
        localVisits[idx].submittedBy ||
        "Owner";
      localVisits[idx].status = "approved";
      localVisits[idx].isLiveOnWebsite = shouldUpload;
      localVisits[idx].generatedCredentials = { loginId: finalLoginId, tempPassword: finalPassword };
      localVisits[idx].ownerName = resolvedOwnerName;
      persistLocalVisits(localVisits);
    } else {
      const backendVisitId =
        backendApprovedVisit?.visitId || backendApprovedVisit?._id || currentApprovingId;
      localVisits = mergeVisitsByIdentity(localVisits, [
        backendApprovedVisit
          ? {
              ...backendApprovedVisit,
              _id: backendVisitId,
              visitId: backendVisitId,
              status: "approved",
              isLiveOnWebsite: shouldUpload,
              generatedCredentials: { loginId: finalLoginId, tempPassword: finalPassword }
            }
          : {
              _id: currentApprovingId,
              visitId: currentApprovingId,
              status: "approved",
              isLiveOnWebsite: shouldUpload,
              approvedAt: new Date().toISOString(),
              submittedAt: new Date().toISOString(),
              generatedCredentials: { loginId: finalLoginId, tempPassword: finalPassword }
            }
      ]);
      persistLocalVisits(localVisits);
    }

    setGeneratedCreds({ loginId: finalLoginId, password: finalPassword });
    setShowApprove(false);
    setShowSuccess(true);
    setCurrentApprovingId(null);
    fetchEnquiries();
    fetchPropertyUnderOwner();
  };

  const openActionModal = (type, visitId) => {
    setActionModal({
      open: true,
      type,
      visitId,
      reason: "",
      action: type === "reject" ? "reupload" : "edit"
    });
  };

  const closeActionModal = () => {
    setActionModal({
      open: false,
      type: "hold",
      visitId: "",
      reason: "",
      action: "edit"
    });
  };

  const submitActionModal = async () => {
    if (!actionModal.visitId) return;
    if (!actionModal.reason.trim()) {
      window.alert(actionModal.type === "reject" ? "Please enter reason for reject." : "Please enter reason for hold.");
      return;
    }

    try {
      const endpoint = actionModal.type === "reject" ? `${apiUrl}/api/visits/reject` : `${apiUrl}/api/visits/hold`;
      const body =
        actionModal.type === "reject"
          ? {
              visitId: actionModal.visitId,
              rejectReason: actionModal.reason.trim(),
              rejectAction: actionModal.action
            }
          : {
              visitId: actionModal.visitId,
              holdReason: actionModal.reason.trim(),
              holdAction: actionModal.action
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        window.alert(actionModal.type === "reject" ? "Visit rejected successfully" : "Visit held successfully");
        closeActionModal();
        fetchEnquiries();
        fetchPropertyUnderOwner();
      } else {
        window.alert((actionModal.type === "reject" ? "Error rejecting visit: " : "Error holding visit: ") + data.message);
      }
    } catch (error) {
      console.error(`Error ${actionModal.type} visit:`, error);
      window.alert((actionModal.type === "reject" ? "Error rejecting visit: " : "Error holding visit: ") + error.message);
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

  const sendKycLink = async (visitId) => {
    if (!visitId || kycLinkSending) return;
    setKycLinkSending(visitId);
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      const res = await fetch(`${apiUrl}/api/visits/${encodeURIComponent(visitId)}/send-kyc-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        window.alert("KYC link sent to owner's email successfully.");
        fetchEnquiries();
      } else {
        window.alert("Failed to send KYC link: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      window.alert("Error sending KYC link: " + err.message);
    } finally {
      setKycLinkSending(null);
    }
  };

  const openVisitDetails = async (visit) => {
    setSelectedVisit(visit || null);
    setDetailsOwnerFresh(null);
    setShowVisitDetails(true);
    const loginId = visit?.generatedCredentials?.loginId || visit?.ownerLoginId || visit?.ownerId;
    if (loginId) {
      try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
        const res = await fetch(`${apiUrl}/api/owners/${encodeURIComponent(loginId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setDetailsOwnerFresh(data);
        }
      } catch (_) {}
    }
  };

  const closeVisitDetails = () => {
    setShowVisitDetails(false);
    setSelectedVisit(null);
    setDetailsOwnerFresh(null);
  };

  const exportVisitsExcel = () => {
    const rows = visits.map((v) => ({
      VisitId: v.visitId || v._id,
      Property: v.propertyName || v.propertyInfo?.name || "-",
      Owner: v.ownerName || v.propertyInfo?.ownerName || "-",
      Status: v.status || "-"
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visits");
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Roomhy_Visits_${date}.xlsx`);
  };

  const filteredVisits = useMemo(() => {
    if (!search) return visits;
    const s = search.toLowerCase();
    return visits.filter((v) => {
      const propName = (v.propertyName || v.propertyInfo?.name || "").toLowerCase();
      const ownerName = (v.ownerName || v.propertyInfo?.ownerName || "").toLowerCase();
      const staffName = (v.staffName || v.propertyInfo?.staffName || "").toLowerCase();
      const visitId = (v.visitId || v._id || "").toLowerCase();
      return propName.includes(s) || ownerName.includes(s) || staffName.includes(s) || visitId.includes(s);
    });
  }, [visits, search]);

  const filteredProperties = useMemo(() => {
    if (!search) return propertyUnderOwner;
    const s = search.toLowerCase();
    return propertyUnderOwner.filter((p) => {
      const propTitle = (p.propertyTitle || "").toLowerCase();
      const ownerName = (p.ownerName || "").toLowerCase();
      const ownerLoginId = (p.ownerLoginId || "").toLowerCase();
      const address = (p.address || "").toLowerCase();
      return propTitle.includes(s) || ownerName.includes(s) || ownerLoginId.includes(s) || address.includes(s);
    });
  }, [propertyUnderOwner, search]);

  const detailsOwnerLoginId = selectedVisit?.generatedCredentials?.loginId || selectedVisit?.ownerLoginId || selectedVisit?.ownerId || "";
  const detailsOwnerRecord = detailsOwnerFresh || (detailsOwnerLoginId ? ownerByLogin[detailsOwnerLoginId] : null);
  const detailsAadhaar = detailsOwnerRecord?.checkinAadhaarNumber || detailsOwnerRecord?.aadharNumber || detailsOwnerRecord?.aadhaarNumber || selectedVisit?.kycAadhaarNumber || "-";
  const detailsPhone = detailsOwnerRecord?.checkinPhone || detailsOwnerRecord?.checkinAadhaarLinkedPhone || detailsOwnerRecord?.phone || selectedVisit?.kycPhone || "-";
  const ownerKycDone = detailsAadhaar !== "-" || !!(
    detailsOwnerRecord?.kycStatus === "verified" ||
    detailsOwnerRecord?.kycStatus === "completed"
  );
  const detailsKycStatus = ownerKycDone ? "completed" : (selectedVisit?.kycStatus || "not_sent");
  const detailsIsKycDone = detailsKycStatus === "completed";
  const detailsIsKycSent = detailsKycStatus === "sent";

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Employee Added Properties"
        subtitle="Review and approve properties added by employees during visits."
        breadcrumbs={[ { label: "Dashboard" }, { label: "Employee Properties", active: true } ]}
        actions={
          <div className="flex items-center gap-3">
            <button onClick={() => { fetchEnquiries(); fetchPropertyUnderOwner(); }} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-purple-600/10 hover:bg-purple-700 transition-all flex items-center gap-1.5">
               <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button onClick={exportVisitsExcel} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all flex items-center gap-1.5">
               <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:translate-y-[-2px] hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved</p>
            <p className="text-2xl font-black text-slate-800">{statusCounts.approved}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:translate-y-[-2px] hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <PauseCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">On Hold</p>
            <p className="text-2xl font-black text-slate-800">{statusCounts.hold}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:translate-y-[-2px] hover:shadow-md transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rejected</p>
            <p className="text-2xl font-black text-slate-800">{statusCounts.rejected}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-slate-50 gap-4">
          {/* Visit report review + KYC + approval now lives solely on Visit Reports,
              so there is one place to act on a report. This page keeps the
              owner→property rollup, which exists nowhere else. */}
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-purple-600 text-white shadow-sm">Property Under Owner</span>
            <a href="/superadmin/visit" className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-all border border-slate-200">
              Visit Reports →
            </a>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports or owners..." className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm" />
          </div>
        </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b">
                <tr>
                  <th className="px-6 py-4">Owner Login ID</th>
                  <th className="px-6 py-4">Owner Name</th>
                  <th className="px-6 py-4">Property Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Area</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Location Code</th>
                  <th className="px-6 py-4">Rent/mo</th>
                  <th className="px-6 py-4 text-center">Vacant Rooms</th>
                  <th className="px-6 py-4 text-center">Vacant Beds</th>
                  <th className="px-6 py-4 text-center">Occupied Rooms</th>
                  <th className="px-6 py-4 text-center">Occupied Beds</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-6 py-12 text-center text-slate-400 font-bold uppercase">No property-under-owner records found.</td>
                  </tr>
                ) : (
                  filteredProperties.map((property) => (
                    <tr key={`${property.ownerLoginId}-${property.propertyId}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-purple-700">{property.ownerLoginId}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{property.ownerName}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{property.propertyTitle}</td>
                      <td className="px-6 py-4 text-slate-600 capitalize">{property.propertyType}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={property.address}>{property.address}</td>
                      <td className="px-6 py-4 text-slate-600">{property.area}</td>
                      <td className="px-6 py-4 text-slate-600">{property.city}</td>
                      <td className="px-6 py-4 font-mono text-slate-500">{property.locationCode}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">₹{property.monthlyRent || 0}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-700">{property.vacantRooms || 0}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-700">{property.vacantBeds || 0}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-700">{property.occupiedRooms || 0}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-700">{property.occupiedBeds || 0}</td>
                      <td className="px-6 py-4 text-slate-600 capitalize">{property.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>

      {/* Modals */}
      {showApprove && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <UploadCloud className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Approve Property</h3>
            <p className="text-sm text-slate-500 mt-2 mb-6">Would you like to upload this property and make it live on the website?</p>
            <div className="flex gap-3">
              <button onClick={() => confirmApproval(true)} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/10">Yes, Upload</button>
              <button onClick={() => confirmApproval(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl hover:bg-slate-200 transition font-bold text-xs uppercase tracking-wider border border-slate-200">Keep Offline</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Approved!</h3>
            <p className="text-sm text-slate-500 mt-2 mb-4">Credentials generated successfully for the owner.</p>
            <div className="bg-slate-50 p-4 rounded-xl text-left mb-6 border border-slate-200 shadow-inner">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login ID:</div>
              <div className="font-mono font-bold text-purple-700 text-sm mt-0.5">{generatedCreds.loginId}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Password:</div>
              <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">{generatedCreds.password}</div>
            </div>
            <button onClick={() => { setShowSuccess(false); fetchEnquiries(); }} className="w-full bg-purple-600 text-white py-2.5 rounded-xl hover:bg-purple-700 transition font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-600/10">Close</button>
          </div>
        </div>
      )}

      {actionModal.open && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800">
              {actionModal.type === "reject" ? "Reject Property" : "Hold Property"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {actionModal.type === "reject"
                ? "Enter reason for rejection and choose the next workflow step."
                : "Enter reason for hold and choose the next action step."}
            </p>
            <textarea
              rows={4}
              value={actionModal.reason}
              onChange={(event) => setActionModal((prev) => ({ ...prev, reason: event.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-purple-100 transition shadow-inner bg-slate-50"
              placeholder={actionModal.type === "reject" ? "Enter rejection reason here..." : "Enter hold reason here..."}
            />
            <div className="mt-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {actionModal.type === "reject" ? "Next Step" : "Action"}
              </label>
              <div className="mt-2 flex gap-2">
                {actionModal.type === "reject" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActionModal((prev) => ({ ...prev, action: "reupload" }))}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition ${actionModal.action === "reupload" ? "border-red-500 bg-red-50 text-red-700 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      Reupload
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionModal((prev) => ({ ...prev, action: "cancel" }))}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition ${actionModal.action === "cancel" ? "border-slate-800 bg-slate-100 text-slate-800 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      Cancel Property
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setActionModal((prev) => ({ ...prev, action: "edit" }))}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition ${actionModal.action === "edit" ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      Ask to Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionModal((prev) => ({ ...prev, action: "none" }))}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition ${actionModal.action === "none" ? "border-slate-800 bg-slate-100 text-slate-800 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      Hold Only
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeActionModal} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl hover:bg-slate-200 transition font-bold text-xs uppercase tracking-wider border border-slate-200">Close</button>
              <button
                onClick={submitActionModal}
                className={`flex-1 py-2 rounded-xl text-white transition font-bold text-xs uppercase tracking-wider shadow-md ${actionModal.type === "reject" ? "bg-red-600 hover:bg-red-700 shadow-red-600/10" : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10"}`}
              >
                {actionModal.type === "reject" ? "Reject" : "Hold"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGallery && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[110] backdrop-blur-md" onClick={closeGallery}>
          <div className="relative w-full max-w-4xl p-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeGallery} className="absolute -top-10 right-2 text-white hover:text-slate-300 transition">
              <X className="w-8 h-8" />
            </button>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto p-4 custom-scrollbar">
              {galleryImages.length > 0 ? galleryImages.map((src, idx) => (
                <img key={`${src}-${idx}`} src={src} className="w-full h-48 object-cover rounded-2xl shadow-2xl border border-white/10 hover:scale-[1.02] transition duration-200" alt="" />
              )) : (
                <p className="text-white text-center py-20 col-span-3 font-semibold">No images available for this section.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showVisitDetails && selectedVisit && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeVisitDetails}>
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 transform transition-all animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-black text-slate-800">Visit Report Details</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Visit ID: {selectedVisit.visitId || selectedVisit._id || "-"}</p>
              </div>
              <button onClick={closeVisitDetails} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Property Name</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.propertyName || selectedVisit.propertyInfo?.name || "-"}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Type</p>
                  <p className="font-bold text-slate-800 text-sm capitalize">{selectedVisit.propertyType || selectedVisit.propertyInfo?.propertyType || "-"}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Status</p>
                  <p className="font-bold text-slate-800 text-sm capitalize">{selectedVisit.status || "-"}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Owner</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.ownerName || "-"}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Contact</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.contactPhone || "-"}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Email</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.ownerEmail || "-"}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 md:col-span-2">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Address</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.address || "-"}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Area / City</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.area || "-"} {selectedVisit.city ? `, ${selectedVisit.city}` : ""}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Landmark</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.landmark || "-"}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Nearby Location</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.nearbyLocation || "-"}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Monthly Rent</p>
                  <p className="font-bold text-slate-800 text-sm">₹{selectedVisit.monthlyRent || 0}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Deposit</p>
                  <p className="font-bold text-slate-800 text-sm">₹{selectedVisit.deposit || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Vacant Rooms</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.vacantRooms || 0}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Vacant Beds</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.vacantBeds || 0}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Occupied Rooms</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.occupiedRooms || 0}</p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Occupied Beds</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedVisit.occupiedBeds || 0}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-3xl p-5 bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-sm font-bold text-slate-800">Owner KYC Verification</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${detailsIsKycDone ? "bg-green-50 text-green-700 border border-green-100" : detailsIsKycSent ? "bg-yellow-50 text-yellow-700 border border-yellow-100" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                      {detailsIsKycDone ? "Completed" : detailsIsKycSent ? "Link Sent" : "Not Sent"}
                    </span>
                    {!detailsIsKycDone && selectedVisit && (
                      <button
                        onClick={() => { sendKycLink(selectedVisit.visitId || selectedVisit._id); }}
                        disabled={kycLinkSending === (selectedVisit.visitId || selectedVisit._id)}
                        className="text-[10px] font-black uppercase tracking-wider px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50 shadow-md shadow-blue-600/10"
                      >
                        {kycLinkSending === (selectedVisit.visitId || selectedVisit._id) ? "Sending..." : detailsIsKycSent ? "Resend KYC Link" : "Send KYC Link"}
                      </button>
                    )}
                  </div>
                </div>
                {!detailsIsKycDone && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    KYC must be completed before this property can be approved.
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">Owner Login ID</p><p className="font-bold font-mono text-purple-700 text-sm">{detailsOwnerLoginId || "-"}</p></div>
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">KYC Status</p><p className="font-bold text-slate-800 text-sm capitalize">{detailsKycStatus.replace("_", " ")}</p></div>
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">KYC Link Sent At</p><p className="font-bold text-slate-800 text-sm">{selectedVisit?.kycSentAt ? new Date(selectedVisit.kycSentAt).toLocaleString() : "-"}</p></div>
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">Aadhaar Number</p><p className="font-bold text-slate-800 text-sm">{detailsAadhaar}</p></div>
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">KYC Phone</p><p className="font-bold text-slate-800 text-sm">{detailsPhone}</p></div>
                </div>
              </div>

              <div className="border border-slate-100 rounded-3xl p-5 bg-white shadow-sm">
                <p className="font-bold text-slate-800 text-sm mb-4">Owner Bank Details</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">Account Holder</p><p className="font-bold text-slate-800 text-sm">{selectedVisit.bankAccountHolderName || detailsOwnerRecord?.checkinAccountHolderName || "-"}</p></div>
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">Account Number</p><p className="font-bold text-slate-800 text-sm font-mono">{selectedVisit.bankAccountNumber || detailsOwnerRecord?.checkinBankAccountNumber || "-"}</p></div>
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">IFSC Code</p><p className="font-bold text-slate-800 text-sm font-mono">{selectedVisit.bankIfscCode || detailsOwnerRecord?.checkinIfscCode || "-"}</p></div>
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">Bank Name</p><p className="font-bold text-slate-800 text-sm">{selectedVisit.bankName || detailsOwnerRecord?.checkinBankName || "-"}</p></div>
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">Branch Name</p><p className="font-bold text-slate-800 text-sm">{selectedVisit.bankBranchName || detailsOwnerRecord?.checkinBranchName || "-"}</p></div>
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-1">UPI ID</p><p className="font-bold text-slate-800 text-sm font-mono">{selectedVisit.bankUpiId || detailsOwnerRecord?.checkinUpiId || "-"}</p></div>
                </div>
              </div>

              {(detailsOwnerRecord?.checkinOwnerPhoto || detailsOwnerRecord?.checkinBankProof || detailsOwnerRecord?.checkinAadhaarImage) && (
                <div className="border border-slate-100 rounded-3xl p-5 bg-white shadow-sm">
                  <p className="font-bold text-slate-800 text-sm mb-4">Owner Documents</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {detailsOwnerRecord?.checkinOwnerPhoto && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Owner Photo</p>
                        <img src={detailsOwnerRecord.checkinOwnerPhoto} className="w-36 h-36 object-cover rounded-2xl border shadow-sm" alt="Owner Photo" />
                        {detailsOwnerRecord.checkinOwnerPhotoName && <p className="text-[10px] text-slate-400 font-medium mt-1.5 truncate max-w-[150px]">{detailsOwnerRecord.checkinOwnerPhotoName}</p>}
                      </div>
                    )}
                    {detailsOwnerRecord?.checkinBankProof && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bank Verification Proof</p>
                        {String(detailsOwnerRecord.checkinBankProofType || "").includes("pdf") ? (
                          <a href={detailsOwnerRecord.checkinBankProof} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 underline text-sm border border-blue-200 px-4 py-2.5 rounded-xl hover:bg-blue-50 transition font-semibold">
                            <FileText className="w-4.5 h-4.5 text-blue-500" /> View PDF Proof
                          </a>
                        ) : (
                          <img src={detailsOwnerRecord.checkinBankProof} className="w-48 h-36 object-cover rounded-2xl border shadow-sm" alt="Bank Proof" />
                        )}
                        {detailsOwnerRecord.checkinBankProofName && <p className="text-[10px] text-slate-400 font-medium mt-1.5 truncate max-w-[200px]">{detailsOwnerRecord.checkinBankProofName}</p>}
                      </div>
                    )}
                    {detailsOwnerRecord?.checkinAadhaarImage && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Aadhaar Card</p>
                        <img src={detailsOwnerRecord.checkinAadhaarImage} className="w-48 h-36 object-contain rounded-2xl border shadow-sm bg-slate-50 p-1" alt="Aadhaar Card" />
                        {detailsOwnerRecord.checkinAadhaarImageName && <p className="text-[10px] text-slate-400 font-medium mt-1.5 truncate max-w-[200px]">{detailsOwnerRecord.checkinAadhaarImageName}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border border-slate-100 rounded-3xl p-5 bg-white shadow-sm">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-2">Amenities</p>
                <p className="font-semibold text-slate-800 text-sm">{(selectedVisit.amenities || []).length ? selectedVisit.amenities.join(", ") : "-"}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Student Rating</p><p className="font-bold text-slate-800 text-sm">{selectedVisit.studentReviewsRating || "-"}</p></div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Employee Rating</p><p className="font-bold text-slate-800 text-sm">{selectedVisit.employeeRating || "-"}</p></div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Cleanliness</p><p className="font-bold text-slate-800 text-sm">{selectedVisit.cleanlinessRating || "-"}</p></div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50"><p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1">Owner Behaviour</p><p className="font-bold text-slate-800 text-sm">{selectedVisit.ownerBehaviourPublic || selectedVisit.ownerBehaviour || "-"}</p></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-100 rounded-3xl p-5 bg-white shadow-sm">
                  <p className="font-bold text-slate-800 text-sm mb-3">Field Photos ({(selectedVisit.photos || []).length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(selectedVisit.photos || []).map((src, idx) => (
                      <img key={`fp-${idx}`} src={src} className="w-full h-24 object-cover rounded-xl border border-slate-200 cursor-zoom-in hover:opacity-90" onClick={() => viewGallery(selectedVisit.photos)} alt="" />
                    ))}
                  </div>
                </div>
                <div className="border border-slate-100 rounded-3xl p-5 bg-white shadow-sm">
                  <p className="font-bold text-slate-800 text-sm mb-3">Professional Photos ({(selectedVisit.professionalPhotos || []).length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(selectedVisit.professionalPhotos || []).map((src, idx) => (
                      <img key={`pp-${idx}`} src={src} className="w-full h-24 object-cover rounded-xl border border-slate-200 cursor-zoom-in hover:opacity-90" onClick={() => viewGallery(selectedVisit.professionalPhotos)} alt="" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
