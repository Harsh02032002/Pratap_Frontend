import React, { useState, useEffect, useMemo } from "react";
import {
  Search, Filter, Download, ChevronDown, MapPin, User,
  Check, X, Eye, RefreshCw, Clock, CheckCircle2, XCircle,
  AlertCircle, ChevronLeft, ChevronRight, CalendarDays,
  IndianRupee, Home, ClipboardList, ArrowRight, Image as ImageIcon
} from "lucide-react";
import * as XLSX from 'xlsx';
import { toast } from "react-hot-toast";
import AddPropertyWizard from "./AddPropertyWizard";

import { getAuthHeader } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001" : "https://roohmy-backend-xwa9.vercel.app");

const STATUS_TABS = ["All", "Pending", "Approved", "Rejected"];

export default function SuperadminPropertyApprovals() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Pending");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  // Selection & Bulk actions & Filters state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fType, setFType] = useState("all");
  const [fCity, setFCity] = useState("all");
  const [fGender, setFGender] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [approvedPopup, setApprovedPopup] = useState(null); // { title, id }
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPropertyId, setEditPropertyId] = useState(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiUrl()}/api/properties?t=${Date.now()}`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success && data.properties) {
        setProperties(data.properties.map(p => ({
          id: p._id,
          propId: `PROP-${p._id.slice(-8).toUpperCase()}`,
          title: p.title || p.propertyInfo?.name || "Unknown Property",
          type: p.propertyType || "Property",
          roomType: p.sharingType || p.roomType || "Single Sharing",
          owner: p.owner?.name || p.ownerName || "Unknown Owner",
          location: [p.locality, p.city, p.state].filter(Boolean).join(", ") || "Location N/A",
          totalRooms: p.totalRooms || p.roomCount || "—",
          minRent: p.rent || p.minRent || null,
          maxRent: p.maxRent || null,
          submittedBy: p.owner?.name || p.ownerName || "Owner",
          submittedOn: new Date(p.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          status: p.isPublished ? "Approved" : (p.status === "blocked" || p.status === "rejected" ? "Rejected" : "Pending"),
          photos: p.images || [],
          raw: p,
        })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleApprove = async (id) => {
    try {
      // Try publish endpoint first, then fallback to PUT
      const res = await fetch(`${getApiUrl()}/api/properties/${id}/publish`, { method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeader() } });
      const data = await res.json();
      if (data.success || res.ok) {
        // Also try to update status to approved
        try {
          await fetch(`${getApiUrl()}/api/properties/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...getAuthHeader() },
            body: JSON.stringify({ status: "approved", isPublished: true })
          });
        } catch (_) {}
        setProperties(prev => prev.map(p => p.id === id ? { ...p, status: "Approved" } : p));
        if (selected?.id === id) setSelected(prev => ({ ...prev, status: "Approved" }));
        const approvedProp = properties.find(p => p.id === id);
        setApprovedPopup({ title: approvedProp?.title || "Property", id });
        toast.success("Property approved successfully");
      } else {
        toast.error(data.message || "Approval failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve property");
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ status: "blocked", isPublished: false, isLiveOnWebsite: false })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setProperties(prev => prev.map(p => p.id === id ? { ...p, status: "Rejected" } : p));
        if (selected?.id === id) setSelected(prev => ({ ...prev, status: "Rejected" }));
        toast.success("Property rejected successfully");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject property");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const pendingSelected = [...selectedIds].filter(id => {
      const p = properties.find(prop => prop.id === id);
      return p && p.status === "Pending";
    });
    if (pendingSelected.length === 0) {
      toast.error("No pending properties selected for approval");
      setBulkProcessing(false);
      return;
    }
    const toastId = toast.loading(`Approving ${pendingSelected.length} properties...`);
    try {
      let successCount = 0;
      for (const id of pendingSelected) {
        const res = await fetch(`${getApiUrl()}/api/properties/${id}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeader() }
        });
        const data = await res.json();
        if (data.success || res.ok) {
          successCount++;
          setProperties(prev => prev.map(p => p.id === id ? { ...p, status: "Approved" } : p));
        }
      }
      toast.success(`Successfully approved ${successCount} of ${pendingSelected.length} properties!`, { id: toastId });
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error("Error during bulk approval.", { id: toastId });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const pendingSelected = [...selectedIds].filter(id => {
      const p = properties.find(prop => prop.id === id);
      return p && p.status === "Pending";
    });
    if (pendingSelected.length === 0) {
      toast.error("No pending properties selected for rejection");
      setBulkProcessing(false);
      return;
    }
    const toastId = toast.loading(`Rejecting ${pendingSelected.length} properties...`);
    try {
      let successCount = 0;
      for (const id of pendingSelected) {
        const res = await fetch(`${getApiUrl()}/api/properties/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeader() },
          body: JSON.stringify({ status: "blocked", isPublished: false, isLiveOnWebsite: false })
        });
        const data = await res.json();
        if (data.success || res.ok) {
          successCount++;
          setProperties(prev => prev.map(p => p.id === id ? { ...p, status: "Rejected" } : p));
        }
      }
      toast.success(`Successfully rejected ${successCount} of ${pendingSelected.length} properties!`, { id: toastId });
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error("Error during bulk rejection.", { id: toastId });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExport = () => {
    const data = filtered.map(p => ({
      "Property ID": p.propId,
      "Property Name": p.title,
      "Type": p.type,
      "Room Type": p.roomType,
      "Owner": p.owner,
      "Location": p.location,
      "Total Rooms": p.totalRooms,
      "Min Rent": p.minRent || "—",
      "Max Rent": p.maxRent || "—",
      "Submitted By": p.submittedBy,
      "Submitted On": p.submittedOn,
      "Status": p.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PropertyApprovals");
    XLSX.writeFile(wb, `Roomhy_PropertyApprovals_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, search, fType, fCity, fGender, filterType]);

  const counts = {
    All: properties.length,
    Pending: properties.filter(p => p.status === "Pending").length,
    Approved: properties.filter(p => p.status === "Approved").length,
    Rejected: properties.filter(p => p.status === "Rejected").length,
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const filtered = properties.filter(p => {
    const matchTab = activeTab === "All" || p.status === activeTab;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.owner.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase()) || p.propId.toLowerCase().includes(search.toLowerCase());
    
    // Quick Filters (filterType)
    let matchQuick = true;
    if (filterType === "today") {
      matchQuick = new Date(p.raw.createdAt).getTime() >= todayStart;
    } else if (filterType === "week") {
      matchQuick = new Date(p.raw.createdAt).getTime() >= weekStart;
    } else if (filterType === "highRent") {
      matchQuick = p.minRent >= 15000;
    } else if (filterType === "fewPhotos") {
      matchQuick = p.photos.length < 5;
    } else if (filterType === "missingInfo") {
      matchQuick = !p.raw.locality || !p.minRent;
    }
    
    // Dropdown Filters
    const matchType = fType === "all" || String(p.type).toLowerCase() === fType.toLowerCase();
    
    const propCity = p.raw.city || p.raw.propertyInfo?.city || "";
    const matchCity = fCity === "all" || propCity.toLowerCase() === fCity.toLowerCase();
    
    const propGender = p.raw.gender || p.raw.propertyInfo?.genderSuitability || "";
    const matchGender = fGender === "all" || propGender.toLowerCase() === fGender.toLowerCase();

    return matchTab && matchSearch && matchQuick && matchType && matchCity && matchGender;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const statusBadge = (status) => {
    if (status === "Approved") return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    if (status === "Rejected") return "bg-rose-50 text-rose-600 border border-rose-100";
    return "bg-amber-50 text-amber-600 border border-amber-100";
  };

  const roomTypeBadge = (type) => {
    const map = { "Single Sharing": "bg-blue-50 text-blue-600", "Double Sharing": "bg-indigo-50 text-indigo-600", "Triple Sharing": "bg-purple-50 text-purple-600", "Private Room (No Sharing)": "bg-teal-50 text-teal-600", "Co-living": "bg-cyan-50 text-cyan-600" };
    return map[type] || "bg-slate-50 text-slate-600";
  };

  const quickFilters = {
    today: properties.filter(p => new Date(p.raw.createdAt).getTime() >= todayStart).length,
    week: properties.filter(p => new Date(p.raw.createdAt).getTime() >= weekStart).length,
    highRent: properties.filter(p => p.minRent >= 15000).length,
    fewPhotos: properties.filter(p => p.photos.length < 5).length,
    missingInfo: properties.filter(p => !p.raw.locality || !p.minRent).length
  };

  const cities = useMemo(() => {
    return [...new Set(properties.map(p => p.raw.city || p.raw.propertyInfo?.city).filter(Boolean))].sort();
  }, [properties]);

  const recentActivity = properties
    .slice()
    .sort((a, b) => new Date(b.raw.createdAt) - new Date(a.raw.createdAt))
    .slice(0, 4)
    .map(p => ({
      name: p.title,
      type: p.type,
      action: p.status === "Approved" ? "approved" : p.status === "Rejected" ? "rejected" : "pending review",
      time: p.submittedOn,
      ok: p.status === "Approved" ? true : p.status === "Rejected" ? false : null
    }));

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Pending Approvals</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Review and approve or reject property listings submitted by property owners.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Main Content */}
        <div className="col-span-9 space-y-4">

          {/* Search + Actions Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by property name, owner, location or ID..." className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
            </div>
            <button onClick={() => setShowFilters(v => !v)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black shadow-sm transition-all", showFilters ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 hover:bg-slate-50")}>
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Dynamic Filters Panel */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm animate-in slide-in-from-top-2 duration-200 animate-in">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Property Type</span>
                <select value={fType} onChange={e => { setFType(e.target.value); setPage(1); }} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:border-blue-400 cursor-pointer">
                  <option value="all">All Types</option>
                  <option value="pg">PG</option>
                  <option value="hostel">Hostel</option>
                  <option value="co-living">Co-Living</option>
                  <option value="apartment">Apartment</option>
                  <option value="room">Room</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">City</span>
                <select value={fCity} onChange={e => { setFCity(e.target.value); setPage(1); }} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:border-blue-400 cursor-pointer">
                  <option value="all">All Cities</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Gender</span>
                <select value={fGender} onChange={e => { setFGender(e.target.value); setPage(1); }} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:border-blue-400 cursor-pointer">
                  <option value="all">All Genders</option>
                  <option value="male">Boys</option>
                  <option value="female">Girls</option>
                  <option value="any">Co-ed</option>
                </select>
              </div>

              {(fType !== "all" || fCity !== "all" || fGender !== "all") && (
                <button onClick={() => { setFType("all"); setFCity("all"); setFGender("all"); setPage(1); }} className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] font-bold text-rose-600 hover:bg-rose-100 transition-all flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Bulk Actions Banner */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 rounded-2xl backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                  {selectedIds.size}
                </div>
                <span className="text-xs font-bold text-blue-900 tracking-wide">properties selected for bulk operations</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button 
                  disabled={bulkProcessing}
                  onClick={handleBulkApprove} 
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-[11px] font-bold shadow-md shadow-emerald-100 hover:shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkProcessing ? "Publishing..." : "Bulk Approve"}
                </button>
                <button 
                  disabled={bulkProcessing}
                  onClick={handleBulkReject} 
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl text-[11px] font-bold shadow-md shadow-rose-100 hover:shadow-lg hover:from-rose-600 hover:to-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkProcessing ? "Rejecting..." : "Bulk Reject"}
                </button>
                <button 
                  disabled={bulkProcessing}
                  onClick={() => setSelectedIds(new Set())} 
                  className="px-3.5 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Tabs + Sort + Select Page Checkbox */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-50 select-none shadow-sm">
                <input
                  type="checkbox"
                  disabled={bulkProcessing}
                  checked={paginated.length > 0 && paginated.every(p => selectedIds.has(p.id))}
                  onChange={() => {
                    const allSelected = paginated.every(p => selectedIds.has(p.id));
                    const next = new Set(selectedIds);
                    if (allSelected) {
                      paginated.forEach(p => next.delete(p.id));
                    } else {
                      paginated.forEach(p => next.add(p.id));
                    }
                    setSelectedIds(next);
                  }}
                  className="rounded border-slate-300 cursor-pointer disabled:opacity-50 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                Select Page
              </label>

              <div className="flex items-center gap-1">
                {STATUS_TABS.map(tab => (
                  <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                      activeTab === tab ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100")}>
                    {tab} {counts[tab] > 0 && <span className={cn("ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-black", activeTab === tab ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>({counts[tab]})</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              Sort by:
              <button className="flex items-center gap-1 text-slate-600 hover:text-slate-800">Newest First <ChevronDown className="w-3 h-3" /></button>
            </div>
          </div>

          {/* Property Cards */}
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-[10px] font-bold">Loading properties...</div>
            ) : paginated.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <ClipboardList className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">No properties found</p>
              </div>
            ) : paginated.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex items-center pr-4">
                <div className="pl-4 pr-1 shrink-0">
                  <input
                    type="checkbox"
                    disabled={bulkProcessing}
                    checked={selectedIds.has(p.id)}
                    onChange={() => {
                      const next = new Set(selectedIds);
                      if (next.has(p.id)) next.delete(p.id);
                      else next.add(p.id);
                      setSelectedIds(next);
                    }}
                    className="rounded border-slate-300 cursor-pointer disabled:opacity-50 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                </div>
                <div className="flex flex-1">
                  {/* Thumbnail */}
                  <div className="w-40 h-32 flex-shrink-0 bg-slate-100 relative">
                    {p.photos[0] ? (
                      <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Home className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[7px] font-black text-white flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5" /> {p.photos.length} Photos
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 grid grid-cols-12 gap-4 items-center">
                    {/* Property Info */}
                    <div className="col-span-4">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-[11px] font-black text-slate-800 leading-tight">{p.title}</h3>
                        <span className={cn("ml-2 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wide flex-shrink-0", statusBadge(p.status))}>{p.status}</span>
                      </div>
                      <span className={cn("inline-block px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wide mb-2", roomTypeBadge(p.roomType))}>{p.roomType}</span>
                      <p className="text-[8px] font-bold text-slate-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {p.location}</p>
                      <p className="text-[8px] font-bold text-slate-300 mt-0.5">{p.propId}</p>
                    </div>

                    {/* Stats */}
                    <div className="col-span-3 space-y-1.5">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Property Type</p>
                        <p className="text-[10px] font-black text-slate-700">{p.type}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Rooms</p>
                        <p className="text-[10px] font-black text-slate-700">{p.totalRooms} Rooms</p>
                      </div>
                      {(p.minRent || p.maxRent) && (
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Rent Range</p>
                          <p className="text-[10px] font-black text-slate-700 flex items-center">
                            <IndianRupee className="w-2.5 h-2.5" />
                            {p.minRent && `${Number(p.minRent).toLocaleString("en-IN")}`}
                            {p.maxRent && ` – ₹ ${Number(p.maxRent).toLocaleString("en-IN")}`}
                            /bed
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submission Info */}
                    <div className="col-span-3 space-y-1.5">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Submitted by</p>
                        <p className="text-[10px] font-black text-slate-700 flex items-center gap-1"><User className="w-2.5 h-2.5 text-slate-400" /> {p.submittedBy}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Submitted on</p>
                        <p className="text-[10px] font-black text-slate-700">{p.submittedOn}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex flex-col gap-2 items-end">
                      <button onClick={() => setSelected(p)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[9px] font-black text-slate-600 hover:bg-slate-50 transition-all text-center">
                        View Details
                      </button>
                      {p.status === "Pending" && (
                        <>
                          <button onClick={() => handleApprove(p.id)} className="w-full px-3 py-2 rounded-lg bg-emerald-600 text-white text-[9px] font-black hover:bg-emerald-700 transition-all text-center">
                            Approve
                          </button>
                          <button onClick={() => handleReject(p.id)} className="w-full px-3 py-2 rounded-lg border border-rose-200 text-rose-600 text-[9px] font-black hover:bg-rose-50 transition-all text-center">
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-[10px] font-bold text-slate-400">
                Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-all">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)} className={cn("w-7 h-7 rounded-lg text-[10px] font-black transition-all", page === n ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50")}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-all">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="col-span-3 space-y-4">
          {/* Approval Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">Approval Summary</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { label: "Pending", val: counts.Pending, color: "text-amber-600 bg-amber-50 border-amber-100" },
                { label: "Approved", val: counts.Approved, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                { label: "Rejected", val: counts.Rejected, color: "text-rose-600 bg-rose-50 border-rose-100" },
                { label: "Total", val: counts.All, color: "text-blue-600 bg-blue-50 border-blue-100" },
              ].map(s => (
                <div key={s.label} className={cn("rounded-xl border p-3 text-center", s.color)}>
                  <p className="text-lg font-black leading-none">{s.val}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">Quick Filters</h3>
            <div className="space-y-2">
              {[
                { type: "today", icon: CalendarDays, label: "Submitted Today", count: quickFilters.today, color: "text-blue-600" },
                { type: "week", icon: CalendarDays, label: "Submitted This Week", count: quickFilters.week, color: "text-blue-600" },
                { type: "highRent", icon: IndianRupee, label: "High Rent (₹15,000+)", count: quickFilters.highRent, color: "text-amber-500" },
                { type: "fewPhotos", icon: ImageIcon, label: "Properties with Few Photos (<5)", count: quickFilters.fewPhotos, color: "text-rose-500" },
                { type: "missingInfo", icon: AlertCircle, label: "Missing Information", count: quickFilters.missingInfo, color: "text-orange-500" },
              ].map(f => (
                <button key={f.label} 
                  onClick={() => {
                    setFilterType(prev => prev === f.type ? "all" : f.type);
                    setPage(1);
                  }}
                  className={cn("w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all group text-left",
                    filterType === f.type ? "bg-blue-50 border-blue-100 text-blue-700 font-bold" : "hover:bg-slate-50 border-transparent text-slate-600")}
                >
                  <div className="flex items-center gap-2">
                    <f.icon className={cn("w-3.5 h-3.5", f.color)} />
                    <span className="text-[10px] font-bold">{f.label}</span>
                  </div>
                  <span className="text-[9px] font-black bg-slate-100 text-slate-400 rounded px-1.5 py-0.5">{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    a.ok === true ? "bg-emerald-100" : a.ok === false ? "bg-rose-100" : "bg-amber-100")}>
                    {a.ok === true ? <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      : a.ok === false ? <XCircle className="w-3 h-3 text-rose-600" />
                      : <Clock className="w-3 h-3 text-amber-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-700 leading-tight">{a.name}
                      <span className="ml-1 text-[8px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{a.type}</span>
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{a.action}</p>
                    <p className="text-[8px] font-bold text-slate-300">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Checklist */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Review Checklist</h3>
            </div>
            <p className="text-[9px] font-bold text-blue-500 leading-relaxed mb-3">Verify property details, photos, pricing, amenities, and policies before approving.</p>
            <button className="flex items-center gap-1 text-[9px] font-black text-blue-600 hover:text-blue-700 transition-all">
              View Checklist <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-800">{selected.title}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selected.type} • {selected.propId}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase", statusBadge(selected.status))}>{selected.status}</span>
                <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {selected.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selected.photos.map((img, i) => <img key={i} src={img} className="w-24 h-20 rounded-xl object-cover flex-shrink-0 border border-slate-100" />)}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Location", val: selected.location },
                  { label: "Submitted by", val: selected.submittedBy },
                  { label: "Total Rooms", val: selected.totalRooms },
                  { label: "Submitted on", val: selected.submittedOn },
                  { label: "Property Type", val: selected.type },
                  { label: "Room Type", val: selected.roomType },
                ].map(f => (
                  <div key={f.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{f.label}</p>
                    <p className="text-[11px] font-black text-slate-700">{f.val || "—"}</p>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-blue-600">Approving this property will publish it to the public website immediately.</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl text-[10px] font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all">Close</button>
              {selected.status === "Pending" && (
                <>
                  <button onClick={() => { handleReject(selected.id); setSelected(null); }} className="px-4 py-2 rounded-xl text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all">Reject</button>
                  <button onClick={() => { handleApprove(selected.id); setSelected(null); }} className="px-4 py-2 rounded-xl text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Approve</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Property Approved Success Popup */}
      {approvedPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-emerald-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 shadow-lg shadow-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Property Approved!</h3>
              <p className="text-xs font-bold text-slate-500 mb-1">
                <span className="text-emerald-700 font-black">{approvedPopup.title}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-semibold">
                Property is now live. You can now edit rooms & add photos.
              </p>
            </div>
            <div className="p-5 space-y-3">
              <button
                onClick={() => {
                  setEditPropertyId(approvedPopup.id);
                  setEditModalOpen(true);
                  setApprovedPopup(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
              >
                <ClipboardList className="w-4 h-4" /> Edit Property & Add Photos
              </button>
              <button
                onClick={() => setApprovedPopup(null)}
                className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ✅ Direct Property Editing Modal */}
      {editModalOpen && editPropertyId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] overflow-y-auto p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-[1300px] h-[90vh] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setEditModalOpen(false); setEditPropertyId(null); }} 
              className="absolute top-6 right-8 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-2xl transition-colors z-[180]"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-y-auto">
              <AddPropertyWizard 
                propEditId={editPropertyId} 
                isModal={true} 
                onClose={() => {
                  setEditModalOpen(false);
                  setEditPropertyId(null);
                  fetchProperties();
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
