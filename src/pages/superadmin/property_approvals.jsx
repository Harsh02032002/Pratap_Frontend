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
      const res = await fetch(`${getApiUrl()}/api/properties?hasVisitReport=true&t=${Date.now()}`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success && data.properties) {
        const visitBackedProperties = data.properties.filter(
          (p) => Boolean(p.visitId && String(p.visitId).trim())
        );
        setProperties(visitBackedProperties.map(p => ({
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
        // Null-safe: the modal footer calls setSelected(null) before this await
        // resolves, so `prev` is already null. Spreading null would produce a
        // truthy {status} object, remounting the modal without `photos`.
        if (selected?.id === id) setSelected(prev => (prev ? { ...prev, status: "Approved" } : null));

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
        if (selected?.id === id) setSelected(prev => (prev ? { ...prev, status: "Rejected" } : null));

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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Approve / Reject Properties</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Review and approve or reject property listings submitted by property owners.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={fetchProperties} className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#CBD3D9] text-[#10242A] rounded-[8px] text-[13px] font-semibold hover:bg-[#F4F6F8] shadow-xs transition-all cursor-pointer">
            <RefreshCw className={cn("w-3.5 h-3.5 text-[#4A5961]", loading && "animate-spin")} /> Refresh
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#CBD3D9] text-[#10242A] rounded-[8px] text-[13px] font-semibold hover:bg-[#F4F6F8] shadow-xs transition-all cursor-pointer">
            <Download className="w-3.5 h-3.5 text-[#4A5961]" /> Export
          </button>
        </div>
      </div>

      {/* Stat Cards (NO ICONS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_TABS.map(tab => (
          <div
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={cn(
              "bg-white rounded-[12px] p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all",
              activeTab === tab ? "border-[#095256] ring-1 ring-[#095256]/20" : "border-[#E1E6EA] hover:border-[#CBD3D9]"
            )}
          >
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{tab} Properties</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{counts[tab]}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Row (Outside & Above Table Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by property name, owner, location or ID..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={activeTab}
            onChange={e => { setActiveTab(e.target.value); setPage(1); }}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            {STATUS_TABS.map(tab => (
              <option key={tab} value={tab}>{tab} ({counts[tab]})</option>
            ))}
          </select>

          <select
            value={fType}
            onChange={e => { setFType(e.target.value); setPage(1); }}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">All Types</option>
            <option value="pg">PG</option>
            <option value="hostel">Hostel</option>
            <option value="co-living">Co-Living</option>
            <option value="apartment">Apartment</option>
            <option value="room">Room</option>
          </select>

          <select
            value={fCity}
            onChange={e => { setFCity(e.target.value); setPage(1); }}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={fGender}
            onChange={e => { setFGender(e.target.value); setPage(1); }}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">All Genders</option>
            <option value="male">Boys</option>
            <option value="female">Girls</option>
            <option value="any">Co-ed</option>
          </select>

          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">Quick Filter: All</option>
            <option value="today">Submitted Today ({quickFilters.today})</option>
            <option value="week">Submitted This Week ({quickFilters.week})</option>
            <option value="highRent">High Rent ₹15,000+ ({quickFilters.highRent})</option>
            <option value="fewPhotos">Few Photos &lt;5 ({quickFilters.fewPhotos})</option>
            <option value="missingInfo">Missing Info ({quickFilters.missingInfo})</option>
          </select>

          {(fType !== "all" || fCity !== "all" || fGender !== "all" || filterType !== "all" || search) && (
            <button
              onClick={() => { setFType("all"); setFCity("all"); setFGender("all"); setFilterType("all"); setSearch(""); setPage(1); }}
              className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-[8px] text-[13px] font-medium text-rose-600 hover:bg-rose-100 transition-all flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#095256] text-white flex items-center justify-center text-[10px] font-bold">
              {selectedIds.size}
            </div>
            <span className="text-[12px] font-semibold text-[#10242A]">properties selected for bulk operations</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={bulkProcessing}
              onClick={handleBulkApprove}
              className="px-3 py-1.5 bg-[#095256] text-white rounded-[6px] text-[12px] font-semibold hover:bg-[#073E42] transition-all disabled:opacity-50 cursor-pointer"
            >
              {bulkProcessing ? "Publishing..." : "Bulk Approve"}
            </button>
            <button
              disabled={bulkProcessing}
              onClick={handleBulkReject}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-[6px] text-[12px] font-semibold hover:bg-rose-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              {bulkProcessing ? "Rejecting..." : "Bulk Reject"}
            </button>
            <button
              disabled={bulkProcessing}
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 text-[12px] font-semibold text-[#4A5961] hover:text-[#10242A] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 pr-3 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider w-8">
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
                    className="rounded border-[#CBD3D9] cursor-pointer disabled:opacity-50"
                  />
                </th>
                <th className="pb-2 pr-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Type & Rooms</th>
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Rent Range</th>
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Submitted By</th>
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                <th className="pb-2 pl-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[13px] font-medium text-[#4A5961]">Loading properties...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[13px] font-medium text-[#4A5961]">No properties found</td>
                </tr>
              ) : paginated.map(p => (
                <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5 pr-3">
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
                      className="rounded border-[#CBD3D9] cursor-pointer disabled:opacity-50"
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 rounded-[6px] overflow-hidden bg-[#F4F6F8] border border-[#E1E6EA] shrink-0 relative">
                        {p.photos[0] ? (
                          <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8C9BA5]">
                            <Home className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold text-[#10242A] truncate max-w-[200px]">{p.title}</p>
                          <span className="text-[10px] font-semibold text-[#4A5961] bg-[#F4F6F8] px-1.5 py-0.5 rounded-[4px]">{p.photos.length} photos</span>
                        </div>
                        <p className="text-[11px] text-[#4A5961] flex items-center gap-1 truncate max-w-[240px] mt-0.5">
                          <MapPin className="w-3 h-3 text-[#8C9BA5] shrink-0" /> {p.location} • <span className="font-mono">{p.propId}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <p className="text-[13px] font-medium text-[#10242A]">{p.type}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn("inline-block px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold", roomTypeBadge(p.roomType))}>{p.roomType}</span>
                      <span className="text-[11px] text-[#4A5961]">• {p.totalRooms} Rooms</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    {(p.minRent || p.maxRent) ? (
                      <p className="text-[13px] font-semibold text-[#10242A]">
                        ₹{p.minRent ? Number(p.minRent).toLocaleString("en-IN") : "0"}
                        {p.maxRent ? ` – ₹${Number(p.maxRent).toLocaleString("en-IN")}` : ""}
                        <span className="text-[11px] font-normal text-[#4A5961]">/bed</span>
                      </p>
                    ) : (
                      <span className="text-[12px] text-[#8C9BA5]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <p className="text-[13px] font-medium text-[#10242A]">{p.submittedBy}</p>
                    <p className="text-[11px] text-[#4A5961] mt-0.5">{p.submittedOn}</p>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", statusBadge(p.status))}>{p.status}</span>
                  </td>
                  <td className="py-2.5 pl-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setSelected(p)} className="px-2.5 py-1 rounded-[6px] border border-[#CBD3D9] bg-white text-[12px] font-semibold text-[#10242A] hover:bg-[#F4F6F8] transition-all cursor-pointer">
                        View Details
                      </button>
                      {p.status === "Pending" && (
                        <>
                          <button onClick={() => handleApprove(p.id)} className="px-2.5 py-1 rounded-[6px] bg-[#095256] text-white text-[12px] font-semibold hover:bg-[#073E42] transition-all cursor-pointer">
                            Approve
                          </button>
                          <button onClick={() => handleReject(p.id)} className="px-2.5 py-1 rounded-[6px] border border-rose-200 bg-rose-50 text-rose-600 text-[12px] font-semibold hover:bg-rose-100 transition-all cursor-pointer">
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E1E6EA]">
            <p className="text-[12px] text-[#4A5961]">
              Showing <span className="font-semibold text-[#10242A]">{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}</span> to <span className="font-semibold text-[#10242A]">{Math.min(page * PER_PAGE, filtered.length)}</span> of <span className="font-semibold text-[#10242A]">{filtered.length}</span> entries
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-[6px] border border-[#CBD3D9] text-[#4A5961] hover:bg-[#F4F6F8] disabled:opacity-40 transition-all cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={cn("w-7 h-7 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer", page === n ? "bg-[#095256] text-white" : "border border-[#CBD3D9] text-[#4A5961] hover:bg-[#F4F6F8]")}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded-[6px] border border-[#CBD3D9] text-[#4A5961] hover:bg-[#F4F6F8] disabled:opacity-40 transition-all cursor-pointer">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity & Review Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4">
          <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider mb-3">Recent Activity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-[8px] bg-[#F9FAFB] border border-[#E1E6EA]">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#10242A] leading-tight truncate">
                    {a.name}
                    <span className="ml-1.5 text-[10px] font-semibold text-[#4A5961] bg-white border border-[#E1E6EA] px-1.5 py-0.5 rounded-[4px]">{a.type}</span>
                  </p>
                  <p className="text-[12px] text-[#4A5961] mt-0.5 capitalize">{a.action} • <span className="text-[11px]">{a.time}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider mb-1.5">Review Checklist</h3>
            <p className="text-[13px] text-[#4A5961] leading-relaxed">Verify property details, photos, pricing, amenities, and policies before approving.</p>
          </div>
          <button className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-[#0E7C86] hover:underline transition-all">
            View Checklist <ArrowRight className="w-3.5 h-3.5" />
          </button>
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
              {selected.photos && selected.photos.length > 0 && (
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
