import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { fetchJson, getAuthHeader } from "../../utils/api";
import {
  Check, X, Eye, UserCheck, Search, Filter, RefreshCw,
  Building2, Calendar, User, FileText, Image as ImageIcon,
  MapPin, IndianRupee, Clock, ArrowRight, CheckCircle2,
  XCircle, AlertCircle, ChevronLeft, ChevronRight, UserPlus, Info
} from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { toast } from "react-hot-toast";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001" : "https://roohmy-backend-xwa9.vercel.app");

export default function VerificationCenter() {
  const location = useLocation();
  const isEmployeeView = typeof window !== "undefined" && window.location.pathname.startsWith("/employee");
  const initialTab = location.pathname.includes("room-edit-requests") ? "room_edits" : "property_edits";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (location.pathname.includes("room-edit-requests")) {
      setActiveTab("room_edits");
    } else {
      setActiveTab("property_edits");
    }
  }, [location.pathname]);
  const [propertyEdits, setPropertyEdits] = useState([]);
  const [roomEdits, setRoomEdits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModifiedOnly, setShowModifiedOnly] = useState(true);
  const [assignModal, setAssignModal] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // pendingChanges.data values can be text, numbers, booleans, arrays or objects.
  // 0 and false are real values, so only null/undefined/"" read as empty.
  const fmtVal = (v) => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (Array.isArray(v)) {
      if (v.length === 0) return "—";
      return v
        .map((item) => {
          if (item === null || item === undefined) return "";
          if (typeof item === "object") {
            return Object.entries(item)
              .filter(([k, val]) => val !== null && val !== undefined && val !== "" && k !== "_id")
              .map(([k, val]) => `${k}: ${typeof val === "object" ? JSON.stringify(val) : val}`)
              .join(", ");
          }
          return String(item);
        })
        .filter(Boolean)
        .join(" | ");
    }
    if (typeof v === "object") {
      const entries = Object.entries(v).filter(([k, val]) => val !== null && val !== undefined && val !== "" && k !== "_id");
      if (entries.length === 0) return "—";
      return entries.map(([k, val]) => `${k}: ${typeof val === "object" ? JSON.stringify(val) : val}`).join(", ");
    }
    return String(v);
  };

  const formatFieldLabel = (field) => {
    if (field === "media") return "ROOM MEDIA";
    if (field === "propertyViews") return "CATEGORIZED PHOTOS";
    return String(field || "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .toUpperCase();
  };

  const resolveMediaUrl = (raw) => {
    const u = raw && typeof raw === "object" ? (raw.url || raw.secure_url || raw.src || raw.path || "") : String(raw || "");
    const clean = u.trim();
    if (!clean) return "";
    if (/^(https?:|data:|blob:)/i.test(clean)) return clean;
    const base = getApiUrl().replace(/\/+$/, "");
    return clean.startsWith("/") ? `${base}${clean}` : `${base}/${clean}`;
  };

  const imgUrl = (img) => resolveMediaUrl(img);

  const extractMediaList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(resolveMediaUrl).filter(Boolean);
    if (typeof val === "object") {
      const urls = [];
      Object.values(val).forEach((arr) => {
        if (Array.isArray(arr)) {
          arr.forEach((entry) => {
            const u = resolveMediaUrl(entry);
            if (u) urls.push(u);
          });
        } else {
          const u = resolveMediaUrl(arr);
          if (u) urls.push(u);
        }
      });
      return urls;
    }
    const single = resolveMediaUrl(val);
    return single ? [single] : [];
  };

  const isMediaField = (field) =>
    ["images", "media", "photos", "roomPhotos", "propertyPhotos", "propertyViews", "featuredImage"].includes(field);

  const CURRENCY_FIELDS = new Set([
    "monthlyRent", "rent", "price", "deposit", "securityDeposit", "maintenanceCharges", "electricityCharges"
  ]);

  const IGNORED_DIFF_FIELDS = new Set([
    "_id", "__v", "createdAt", "updatedAt", "pendingChanges", "visitId"
  ]);

  const formatShortDiffVal = (field, rawVal, strVal) => {
    if (isMediaField(field)) {
      const count = extractMediaList(rawVal).length;
      return `${count} photo${count === 1 ? "" : "s"}`;
    }
    if (strVal === "—") return "—";
    if (CURRENCY_FIELDS.has(field) && !Number.isNaN(Number(rawVal)) && rawVal !== "" && rawVal !== null) {
      return `₹${Number(rawVal).toLocaleString("en-IN")}`;
    }
    return strVal.length > 26 ? `${strVal.slice(0, 24)}…` : strVal;
  };

  const getEditDiffEntries = (item) => {
    const pendingData = item?.pendingChanges?.data;
    if (!pendingData || typeof pendingData !== "object") return { all: [], modified: [] };

    const entries = Object.keys(pendingData)
      .filter((field) => !IGNORED_DIFF_FIELDS.has(field))
      .map((field) => {
        const liveVal = item?.[field];
        const requestedVal = pendingData[field];
        if (isMediaField(field)) {
          const liveList = extractMediaList(liveVal);
          const reqList = extractMediaList(requestedVal);
          const isChanged = JSON.stringify(liveList) !== JSON.stringify(reqList);
          return {
            field,
            label: formatFieldLabel(field),
            liveVal,
            requestedVal,
            liveStr: liveList.length ? `${liveList.length} photo${liveList.length === 1 ? "" : "s"}` : "0 photos",
            reqStr: reqList.length ? `${reqList.length} photo${reqList.length === 1 ? "" : "s"}` : "0 photos",
            shortOld: `${liveList.length} photo${liveList.length === 1 ? "" : "s"}`,
            shortNew: `${reqList.length} photo${reqList.length === 1 ? "" : "s"}`,
            isMedia: true,
            isChanged,
          };
        }

        const liveStr = fmtVal(liveVal);
        const reqStr = fmtVal(requestedVal);
        const isChanged = liveStr !== reqStr;
        return {
          field,
          label: formatFieldLabel(field),
          liveVal,
          requestedVal,
          liveStr,
          reqStr,
          shortOld: formatShortDiffVal(field, liveVal, liveStr),
          shortNew: formatShortDiffVal(field, requestedVal, reqStr),
          isMedia: false,
          isChanged,
        };
      });

    // Sort modified fields first so reviewers immediately see what changed
    entries.sort((a, b) => (a.isChanged === b.isChanged ? 0 : a.isChanged ? -1 : 1));
    return {
      all: entries,
      modified: entries.filter((e) => e.isChanged),
    };
  };

  const loadData = async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      window.location.href = "/superadmin/login";
      return;
    }

    setLoading(true);
    try {
      const [propEditsRes, roomEditsRes, empRes] = await Promise.all([
        fetchJson(`/api/properties?pendingChanges=true&limit=1000&t=${Date.now()}`),
        fetchJson(`/api/rooms/all?pendingChanges=true&limit=1000&t=${Date.now()}`),
        fetchJson("/api/employees").catch(() => ({ success: false, data: [] })),
      ]);

      if (propEditsRes?.success) {
        setPropertyEdits(propEditsRes.properties || []);
      }

      if (roomEditsRes?.success) {
        setRoomEdits(roomEditsRes.rooms || []);
      }

      if (empRes?.success) {
        setEmployees(empRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load verification center data:", err);
      if (err?.message?.includes("Not authorized") || err?.status === 401) {
        window.location.href = "/superadmin/login";
      }
      toast.error("Error loading verification requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprovePropertyEdit = async (id) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/properties/${id}/approve-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Property edits approved & applied live!");
        setPropertyEdits(prev => prev.filter(p => p._id !== id));
        setSelectedItem(null);
      } else {
        toast.error(data.message || "Failed to approve changes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve changes");
    }
  };

  const handleRejectPropertyEdit = async (id, reason = "Rejected by admin") => {
    try {
      const res = await fetch(`${getApiUrl()}/api/properties/${id}/reject-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({ rejectReason: reason })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Property edits rejected");
        setPropertyEdits(prev => prev.filter(p => p._id !== id));
        setSelectedItem(null);
      } else {
        toast.error(data.message || "Failed to reject changes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject changes");
    }
  };

  const handleApproveRoomEdit = async (id) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/rooms/${id}/approve-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Room edits approved & applied live!");
        setRoomEdits(prev => prev.filter(r => r._id !== id));
        setSelectedItem(null);
      } else {
        toast.error(data.message || "Failed to approve room changes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve room changes");
    }
  };

  const handleRejectRoomEdit = async (id) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/rooms/${id}/reject-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Room edits rejected");
        setRoomEdits(prev => prev.filter(r => r._id !== id));
        setSelectedItem(null);
      } else {
        toast.error(data.message || "Failed to reject room changes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject room changes");
    }
  };

  const handleAssignVerification = async (itemId, employeeId, employeeName) => {
    try {
      const isPropertyAssign = assignModal?.type ? assignModal.type !== "room" : activeTab === "property_edits";
      const endpoint = isPropertyAssign
        ? `${getApiUrl()}/api/properties/${itemId}/assign-verification`
        : `${getApiUrl()}/api/rooms/${itemId}/assign-verification`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ employeeId, employeeName })
      });
      const data = await res.json();

      if (data.success || res.ok) {
        toast.success(data.message || `Successfully assigned to ${employeeName || "Staff"}`);

        const assignedId = data.property?.assignedTo || employeeId;
        const assignedName = data.property?.assignedToName || employeeName;

        if (isPropertyAssign) {
          setPropertyEdits(prev => prev.map(p => p._id === itemId ? {
            ...p,
            assignedTo: assignedId,
            assignedToName: assignedName,
            pendingChanges: { ...p.pendingChanges, assignedTo: assignedId, assignedToName: assignedName }
          } : p));
        } else {
          setRoomEdits(prev => prev.map(r => r._id === itemId ? {
            ...r,
            pendingChanges: { ...r.pendingChanges, assignedTo: assignedId, assignedToName: assignedName }
          } : r));
        }

        setSelectedItem(null);
        setAssignModal(null);
        loadData();
      } else {
        toast.error(data.message || "Assignment failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to assign verification");
    }
  };

  const searchFilter = (items, keySelector) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => keySelector(item).toLowerCase().includes(query));
  };

  const filteredPropertyEdits = useMemo(() => {
    return searchFilter(propertyEdits, p => `${p.title} ${p.ownerName || ""} ${p.ownerLoginId || ""} ${p.city || ""}`);
  }, [propertyEdits, searchQuery]);

  const filteredRoomEdits = useMemo(() => {
    return searchFilter(roomEdits, r => `${r.title} ${r.property?.title || ""} ${r.property?.ownerLoginId || ""}`);
  }, [roomEdits, searchQuery]);

  const openReviewModal = (type, data) => {
    const diff = getEditDiffEntries(data);
    setShowModifiedOnly(diff.modified.length > 0);
    setSelectedItem({ type, data });
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Property & Room Edit Requests</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Review and approve owner-submitted property modification requests and room edit/photo requests.</p>
        </div>
        <button onClick={loadData} className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#CBD3D9] text-[13px] font-semibold text-[#10242A] hover:bg-[#F4F6F8] transition-all flex items-center gap-2 shadow-xs cursor-pointer">
          <RefreshCw className={cn("w-3.5 h-3.5 text-[#4A5961]", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Stats Quick Cards (NO ICONS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: "property_edits", label: "Property Edit Requests", count: propertyEdits.length },
          { key: "room_edits", label: "Room Edit Requests", count: roomEdits.length }
        ].map(tab => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "bg-white rounded-[12px] p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all",
              activeTab === tab.key
                ? "border-[#095256] ring-1 ring-[#095256]/20"
                : "border-[#E1E6EA] hover:border-[#CBD3D9]"
            )}
          >
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{tab.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{tab.count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Row (Outside & Above Table Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9BA5]" size={15} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, owner details, location..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="property_edits">Property Edit Requests ({filteredPropertyEdits.length})</option>
            <option value="room_edits">Room Edit Requests ({filteredRoomEdits.length})</option>
          </select>
        </div>
      </div>

      {/* List Ledger */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 pr-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property / Room & Requested Changes</th>
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner Details</th>
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Location</th>
                {!isEmployeeView && <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Assigned Employee</th>}
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Date Requested</th>
                <th className="pb-2 pl-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {/* Tab 1: Property Edit Requests ONLY */}
              {activeTab === "property_edits" && (
                filteredPropertyEdits.length === 0 ? (
                  <tr><td colSpan={isEmployeeView ? 5 : 6} className="py-12 text-center text-[13px] font-medium text-[#4A5961]">No property edit requests pending</td></tr>
                ) : (
                  filteredPropertyEdits.map(p => {
                    const { modified } = getEditDiffEntries(p);
                    return (
                      <tr key={p._id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 pr-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-[#10242A] text-[13px]">{p.title || "No Title"}</p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4F5] text-[#095256] border border-[#CBE6E8]">
                                {modified.length > 0 ? `${modified.length} field${modified.length === 1 ? "" : "s"} modified` : "Edit Request"}
                              </span>
                            </div>
                            {modified.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {modified.slice(0, 3).map((m) => (
                                  <span
                                    key={m.field}
                                    onClick={() => openReviewModal("property_edit", p)}
                                    className="inline-flex items-center gap-1 text-[11px] bg-amber-50 hover:bg-amber-100/80 text-[#10242A] border border-amber-200 px-2 py-0.5 rounded-[6px] cursor-pointer transition-colors"
                                    title={`Click to review ${m.label}`}
                                  >
                                    <span className="font-bold text-amber-900">{m.label}:</span>
                                    <span className="line-through text-[#708088]">{m.shortOld}</span>
                                    <ArrowRight size={10} className="text-[#0E7C86] shrink-0" />
                                    <span className="font-bold text-[#095256]">{m.shortNew}</span>
                                  </span>
                                ))}
                                {modified.length > 3 && (
                                  <span
                                    onClick={() => openReviewModal("property_edit", p)}
                                    className="inline-flex items-center text-[11px] font-bold text-[#0E7C86] bg-[#E6F4F5] border border-[#CBE6E8] px-2 py-0.5 rounded-[6px] cursor-pointer"
                                  >
                                    +{modified.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-[#4A5961] mt-0.5">Property Modification Request</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-[13px] font-semibold text-[#10242A]">{p.ownerName || "Unknown Owner"}</p>
                          <p className="text-[11px] text-[#4A5961] font-mono mt-0.5">{p.ownerLoginId || "N/A"}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-[13px] font-medium text-[#4A5961] flex items-center gap-1"><MapPin size={12} className="text-[#0E7C86]" /> {p.city || "N/A"}</p>
                        </td>
                        {!isEmployeeView && (
                          <td className="py-3 px-4">
                            {p.pendingChanges?.assignedToName || p.pendingChanges?.assignedTo || p.assignedToName || p.assignedTo ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-[#10242A] bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                                  <User size={11} className="text-[#0E7C86]" /> {p.pendingChanges?.assignedToName || p.assignedToName || p.pendingChanges?.assignedTo || p.assignedTo}
                                </span>
                                <button onClick={() => setAssignModal({ type: "property", id: p._id, city: p.city, title: p.title })} className="text-[11px] text-[#4A5961] hover:text-[#0E7C86] underline cursor-pointer" title="Reassign">Edit</button>
                              </div>
                            ) : (
                              <button onClick={() => setAssignModal({ type: "property", id: p._id, city: p.city, title: p.title })} className="text-[12px] font-semibold text-[#0E7C86] hover:underline flex items-center gap-1 cursor-pointer"><UserPlus size={12} /> Assign</button>
                            )}
                          </td>
                        )}
                        <td className="py-3 px-4 text-[12px] text-[#4A5961]">
                          {new Date(p.pendingChanges?.requestedAt || p.updatedAt || p.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openReviewModal("property_edit", p)} className="px-2.5 py-1 bg-white hover:bg-[#F4F6F8] text-[#10242A] border border-[#CBD3D9] rounded-[6px] text-[12px] font-semibold transition-all flex items-center gap-1 cursor-pointer">
                              <Eye size={12} /> Review
                            </button>
                            <button onClick={() => handleApprovePropertyEdit(p._id)} className="px-2.5 py-1 bg-[#095256] hover:bg-[#073E42] text-white rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer">
                              Approve
                            </button>
                            <button onClick={() => handleRejectPropertyEdit(p._id)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer">
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              )}

              {/* Tab 2: Room Edit Requests */}
              {activeTab === "room_edits" && (
                filteredRoomEdits.length === 0 ? (
                  <tr><td colSpan={isEmployeeView ? 5 : 6} className="py-12 text-center text-[13px] font-medium text-[#4A5961]">No room edit requests pending</td></tr>
                ) : filteredRoomEdits.map(r => {
                  const { modified } = getEditDiffEntries(r);
                  return (
                    <tr key={r._id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 pr-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[#10242A] text-[13px]">{r.title || "Room"}</p>
                            <span className="text-[11px] text-[#4A5961]">• {r.property?.title || "Property"}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4F5] text-[#095256] border border-[#CBE6E8]">
                              {modified.length > 0 ? `${modified.length} field${modified.length === 1 ? "" : "s"} modified` : "Room Edit"}
                            </span>
                          </div>
                          {modified.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {modified.slice(0, 3).map((m) => (
                                <span
                                  key={m.field}
                                  onClick={() => openReviewModal("room_edit", r)}
                                  className="inline-flex items-center gap-1 text-[11px] bg-amber-50 hover:bg-amber-100/80 text-[#10242A] border border-amber-200 px-2 py-0.5 rounded-[6px] cursor-pointer transition-colors"
                                  title={`Click to review ${m.label}`}
                                >
                                  <span className="font-bold text-amber-900">{m.label}:</span>
                                  <span className="line-through text-[#708088]">{m.shortOld}</span>
                                  <ArrowRight size={10} className="text-[#0E7C86] shrink-0" />
                                  <span className="font-bold text-[#095256]">{m.shortNew}</span>
                                </span>
                              ))}
                              {modified.length > 3 && (
                                <span
                                  onClick={() => openReviewModal("room_edit", r)}
                                  className="inline-flex items-center text-[11px] font-bold text-[#0E7C86] bg-[#E6F4F5] border border-[#CBE6E8] px-2 py-0.5 rounded-[6px] cursor-pointer"
                                >
                                  +{modified.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-[13px] font-semibold text-[#10242A]">{r.property?.ownerName || "Unknown Owner"}</p>
                        <p className="text-[11px] text-[#4A5961] font-mono mt-0.5">{r.property?.ownerLoginId || "N/A"}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-[13px] font-medium text-[#4A5961] flex items-center gap-1"><MapPin size={12} className="text-[#0E7C86]" /> {r.property?.city || "N/A"}</p>
                      </td>
                      {!isEmployeeView && (
                        <td className="py-3 px-4">
                          {r.pendingChanges?.assignedToName || r.pendingChanges?.assignedTo ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold text-[#10242A] bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                                <User size={11} className="text-[#0E7C86]" /> {r.pendingChanges?.assignedToName || r.pendingChanges?.assignedTo}
                              </span>
                              <button onClick={() => setAssignModal({ type: "room", id: r._id, city: r.property?.city, title: r.title })} className="text-[11px] text-[#4A5961] hover:text-[#0E7C86] underline cursor-pointer" title="Reassign">Edit</button>
                            </div>
                          ) : (
                            <button onClick={() => setAssignModal({ type: "room", id: r._id, city: r.property?.city, title: r.title })} className="text-[12px] font-semibold text-[#0E7C86] hover:underline flex items-center gap-1 cursor-pointer"><UserPlus size={12} /> Assign</button>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4 text-[12px] text-[#4A5961]">
                        {new Date(r.pendingChanges?.requestedAt || r.updatedAt || r.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openReviewModal("room_edit", r)} className="px-2.5 py-1 bg-white hover:bg-[#F4F6F8] text-[#10242A] border border-[#CBD3D9] rounded-[6px] text-[12px] font-semibold transition-all flex items-center gap-1 cursor-pointer">
                            <Eye size={12} /> Review
                          </button>
                          <button onClick={() => handleApproveRoomEdit(r._id)} className="px-2.5 py-1 bg-[#095256] hover:bg-[#073E42] text-white rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer">
                            Approve
                          </button>
                          <button onClick={() => handleRejectRoomEdit(r._id)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer">
                            Reject
                          </button>
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

      {/* Review Modal — highlights modified fields clearly */}
      {selectedItem && (() => {
        const { all: allDiffs, modified: modifiedDiffs } = getEditDiffEntries(selectedItem.data);
        const visibleRows = showModifiedOnly && modifiedDiffs.length > 0 ? modifiedDiffs : allDiffs;

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] w-full max-w-5xl shadow-2xl border border-[#E1E6EA] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-5 py-4 border-b border-[#E1E6EA] flex items-start justify-between bg-[#F4F6F8] shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-[#10242A]">
                    {selectedItem.type === "property_edit" && `Edit Request: ${selectedItem.data.title}`}
                    {selectedItem.type === "room_edit" && `Room Edit Request: ${selectedItem.data.title}`}
                  </h3>
                  <p className="text-[11px] text-[#4A5961] font-semibold uppercase tracking-wider mt-1">
                    Requested by: {selectedItem.data.pendingChanges?.requestedBy || selectedItem.data.ownerLoginId || selectedItem.data.property?.ownerLoginId || "Owner"}
                  </p>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-1.5 text-[#4A5961] hover:text-[#10242A] hover:bg-white rounded-lg transition-all cursor-pointer"><X size={16} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Highlighted Summary Banner */}
                {modifiedDiffs.length > 0 && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-[12px] p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 text-[11px] font-extrabold uppercase tracking-wider">
                          {modifiedDiffs.length} {modifiedDiffs.length === 1 ? "Change" : "Changes"} Requested
                        </span>
                        <span className="text-[12px] font-semibold text-[#10242A]">
                          Owner modified the highlighted fields below:
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {modifiedDiffs.map((m) => (
                        <div
                          key={`summary-${m.field}`}
                          className="inline-flex items-center gap-1.5 bg-white border border-amber-200 rounded-[8px] px-2.5 py-1 text-[11px] shadow-2xs"
                        >
                          <span className="font-bold text-[#10242A]">{m.label}:</span>
                          <span className="line-through text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-medium">{m.shortOld}</span>
                          <ArrowRight size={11} className="text-[#0E7C86] shrink-0" />
                          <span className="font-bold text-[#095256] bg-[#E6F4F5] px-1.5 py-0.5 rounded">{m.shortNew}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-[11px] font-bold text-[#10242A] uppercase tracking-wider flex items-center gap-1.5">
                      <Info size={14} className="text-[#0E7C86]" /> Requested changes — Current (Live) vs Requested (New)
                    </h4>

                    {allDiffs.length > 0 && modifiedDiffs.length > 0 && (
                      <div className="inline-flex rounded-[8px] border border-[#CBD3D9] bg-[#F4F6F8] p-0.5">
                        <button
                          type="button"
                          onClick={() => setShowModifiedOnly(true)}
                          className={cn(
                            "px-3 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer",
                            showModifiedOnly
                              ? "bg-[#095256] text-white shadow-2xs"
                              : "text-[#4A5961] hover:text-[#10242A]"
                          )}
                        >
                          Modified Only ({modifiedDiffs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowModifiedOnly(false)}
                          className={cn(
                            "px-3 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer",
                            !showModifiedOnly
                              ? "bg-[#095256] text-white shadow-2xs"
                              : "text-[#4A5961] hover:text-[#10242A]"
                          )}
                        >
                          Show All Fields ({allDiffs.length})
                        </button>
                      </div>
                    )}
                  </div>

                  {allDiffs.length === 0 ? (
                    <div className="py-8 bg-[#F4F6F8] rounded-xl text-center text-xs font-semibold text-[#4A5961]">
                      This request has no field changes recorded.
                    </div>
                  ) : (
                    <div className="border border-[#E1E6EA] rounded-xl overflow-x-auto">
                      <table className="w-full table-fixed min-w-[620px] text-xs border-collapse">
                        <thead className="bg-[#F4F6F8] font-bold text-[#4A5961] uppercase tracking-wider text-[10px] border-b border-[#E1E6EA]">
                          <tr>
                            <th className="w-[24%] px-4 py-3 text-left">Field</th>
                            <th className="w-[38%] px-4 py-3 text-left border-l border-[#E1E6EA]">Current (Live)</th>
                            <th className="w-[38%] px-4 py-3 text-left bg-[#E6F4F5] text-[#09626A] border-l border-[#CBE6E8]">Requested (New)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E1E6EA]">
                          {visibleRows.map(({ field, label, liveVal, requestedVal, liveStr, reqStr, isMedia, isChanged }) => {
                            if (isMedia) {
                              const renderMediaStrip = (val, extra) => {
                                const arr = extractMediaList(val);
                                if (arr.length === 0) return <span className="text-[#4A5961]">No photos (0)</span>;
                                return (
                                  <div className="flex flex-wrap gap-2 py-1">
                                    {arr.map((u, i) => (
                                      <img
                                        key={i}
                                        src={u}
                                        alt=""
                                        className={cn("w-16 h-14 object-cover rounded-lg cursor-pointer shrink-0 shadow-2xs", extra)}
                                        onClick={() => setFullscreenImage({ url: u, index: i })}
                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                      />
                                    ))}
                                  </div>
                                );
                              };
                              return (
                                <tr key={field} className={cn("align-top", isChanged ? "bg-amber-50/40" : "bg-white")}>
                                  <td className={cn(
                                    "px-4 py-3.5 font-bold text-[#10242A] uppercase tracking-wider text-[10px] break-words",
                                    isChanged && "border-l-4 border-l-[#0E7C86]"
                                  )}>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span>{label}</span>
                                      {isChanged && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 text-[9px] font-extrabold uppercase">
                                          Modified
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 border-l border-[#F0F4F6]">
                                    {renderMediaStrip(liveVal, "border border-[#E1E6EA]")}
                                  </td>
                                  <td className={cn(
                                    "px-4 py-3.5 border-l border-[#CBE6E8]",
                                    isChanged ? "bg-[#E6F4F5]/65" : "bg-[#E6F4F5]/25"
                                  )}>
                                    {renderMediaStrip(requestedVal, "border-2 border-[#0E7C86]")}
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={field} className={cn("align-top", isChanged ? "bg-amber-50/40" : "bg-[#FAFCFD]")}>
                                <td className={cn(
                                  "px-4 py-3 font-bold uppercase tracking-wider text-[10px] break-words",
                                  isChanged ? "text-[#10242A] border-l-4 border-l-[#0E7C86]" : "text-[#4A5961]"
                                )}>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span>{label}</span>
                                    {isChanged && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 text-[9px] font-extrabold uppercase">
                                        Modified
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-medium text-[#4A5961] border-l border-[#F0F4F6] break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                                  {isChanged ? (
                                    <span className="inline-block line-through text-rose-700 bg-rose-50/80 border border-rose-200/70 px-2 py-0.5 rounded">
                                      {liveStr}
                                    </span>
                                  ) : (
                                    liveStr
                                  )}
                                </td>
                                <td className={cn(
                                  "px-4 py-3 border-l border-[#CBE6E8] break-words [overflow-wrap:anywhere] whitespace-pre-wrap",
                                  isChanged ? "font-bold text-[#095256] bg-[#E6F4F5]/75" : "font-semibold text-[#10242A] bg-[#E6F4F5]/20"
                                )}>
                                  {isChanged ? (
                                    <span className="inline-block bg-white border border-[#0E7C86]/40 text-[#095256] font-extrabold px-2.5 py-0.5 rounded shadow-2xs">
                                      {reqStr}
                                    </span>
                                  ) : (
                                    reqStr
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-[#E1E6EA] bg-[#F4F6F8] flex gap-2 justify-end shrink-0">
                <button onClick={() => setSelectedItem(null)} className="px-3.5 py-2 bg-white border border-[#E1E6EA] text-[#10242A] rounded-lg text-xs font-semibold hover:bg-[#F4F6F8] transition-all cursor-pointer">Cancel</button>
                {!isEmployeeView && (
                  <button
                    onClick={() => setAssignModal({
                      type: selectedItem.type === "room_edit" ? "room" : "property",
                      id: selectedItem.data._id,
                      city: selectedItem.data.city || selectedItem.data.property?.city,
                      title: selectedItem.data.title
                    })}
                    className="px-3.5 py-2 bg-white border border-[#E1E6EA] text-[#0E7C86] rounded-lg text-xs font-semibold hover:bg-[#E6F4F5] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus size={13} /> Assign Verification
                  </button>
                )}
                <button
                  onClick={() => {
                    const id = selectedItem.data._id;
                    if (selectedItem.type === "property_edit") handleRejectPropertyEdit(id);
                    else handleRejectRoomEdit(id);
                  }}
                  className="px-3.5 py-2 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50 transition-all cursor-pointer"
                >
                  Reject Changes
                </button>
                <button
                  onClick={() => {
                    const id = selectedItem.data._id;
                    if (selectedItem.type === "property_edit") handleApprovePropertyEdit(id);
                    else handleApproveRoomEdit(id);
                  }}
                  className="px-3.5 py-2 bg-[#0E7C86] hover:bg-[#09626A] text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={13} /> Approve Changes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={() => setFullscreenImage(null)}>
          <button onClick={() => setFullscreenImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"><X size={22} /></button>
          <img src={fullscreenImage.url} alt="Fullscreen view" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-[16px] shadow-2xl p-5 w-full max-w-sm border border-[#E1E6EA] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-[#10242A]">Assign Verification Staff</h4>
                {assignModal.title && (
                  <p className="text-[11px] text-[#4A5961] truncate max-w-[220px]">
                    {assignModal.title} {assignModal.city ? `(${assignModal.city})` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => setAssignModal(null)}
                className="text-xs text-[#4A5961] hover:text-[#10242A] p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Auto Assign Action */}
            <button
              onClick={() => handleAssignVerification(assignModal.id, null, null)}
              className="w-full mb-3 px-3 py-2 bg-[#E6F4F5] hover:bg-[#d0edef] text-[#0E7C86] rounded-[8px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#0E7C86]/20"
            >
              <span>🤖</span> Auto-Assign (Visit Creator / Local Agent)
            </button>

            <div className="text-[11px] font-semibold text-[#4A5961] mb-1.5 flex items-center justify-between">
              <span>Or pick an employee:</span>
              {assignModal.city && <span className="text-[10px] text-[#0E7C86]">Local first</span>}
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-64 flex-1 pr-1">
              {(() => {
                // Filter out non-verification / service staff roles and owner hostel staff
                const NON_FIELD_ROLES = ['cook', 'cleaner', 'hostel staff', 'sweeper', 'housekeeping', 'driver', 'security', 'maintenance', 'peon', 'maid', 'warden', 'staff', 'helper', 'guard'];
                const eligible = employees.filter(emp => {
                  if (emp.parentLoginId) return false;
                  if (emp.isActive === false || emp.isDeleted === true) return false;
                  const r = (emp.role || '').toLowerCase();
                  return !NON_FIELD_ROLES.some(nfr => r === nfr || r.includes(nfr));
                });

                // Sort local city employees to top
                const modalCity = (assignModal.city || '').toLowerCase().trim();
                const sorted = [...eligible].sort((a, b) => {
                  const aLocal = modalCity && (a.city || '').toLowerCase().includes(modalCity);
                  const bLocal = modalCity && (b.city || '').toLowerCase().includes(modalCity);
                  if (aLocal && !bLocal) return -1;
                  if (!aLocal && bLocal) return 1;
                  return (a.name || '').localeCompare(b.name || '');
                });

                if (sorted.length === 0) {
                  return <p className="text-xs text-[#4A5961] text-center py-4">No verification staff available.</p>;
                }

                return sorted.map(emp => {
                  const isLocal = modalCity && (emp.city || '').toLowerCase().includes(modalCity);
                  return (
                    <button
                      key={emp._id || emp.loginId}
                      onClick={() => handleAssignVerification(assignModal.id, emp.loginId, emp.name)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-[8px] transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                        isLocal
                          ? 'bg-[#F0FDF4] border-emerald-200 hover:bg-[#DCFCE7]'
                          : 'hover:bg-[#E6F4F5] hover:text-[#0E7C86] border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          isLocal ? 'bg-emerald-100 text-emerald-800' : 'bg-[#E6F4F5] text-[#0E7C86]'
                        }`}>
                          {emp.name?.split(" ").map(n=>n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#10242A] leading-tight truncate">{emp.name}</p>
                          <p className="text-[10px] text-[#4A5961] truncate">
                            {emp.loginId} {emp.role ? `• ${emp.role}` : ''} {emp.city ? `• ${emp.city}` : ''}
                          </p>
                        </div>
                      </div>
                      {isLocal && (
                        <span className="text-[9px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                          📍 Local
                        </span>
                      )}
                    </button>
                  );
                });
              })()}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
