import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, CheckCircle2, Clock, XCircle, AlertCircle,
  Search, Filter, Download, ChevronLeft, ChevronRight,
  MapPin, Phone, Home, Layers, Users, MoreVertical,
  RefreshCw, Image as ImageIcon, Plus, Eye, Pencil, SlidersHorizontal, X, Trash2, Globe
} from "lucide-react";
import { getApiBase, getAuthHeader } from "../../utils/api";
import WebsitePropertyPreviewModal from "../../components/shared/WebsitePropertyPreviewModal";
import { toast } from "react-hot-toast";
import AddPropertyWizard from "./AddPropertyWizard";

const cn = (...c) => c.filter(Boolean).join(" ");

const STATUS_COLORS = {
  Published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Pending:   "bg-amber-50 text-amber-700 border border-amber-200",
  Inactive:  "bg-slate-100 text-slate-500 border border-slate-200",
  Rejected:  "bg-rose-50 text-rose-700 border border-rose-200",
};

const TYPE_MAP = { pg:"PG", hostel:"Hostel", "co-living":"Co-Living", apartment:"Apartment", room:"Room" };
const GENDER_MAP = { male:"Boys", female:"Girls", any:"Co-ed" };
const GENDER_COLOR = { male:"bg-blue-50 text-blue-600", female:"bg-pink-50 text-pink-600", any:"bg-purple-50 text-purple-600" };

const normalizeGender = (g) => {
  if (!g) return "any";
  const s = String(g).toLowerCase().trim();
  if (s.includes("female") || s.includes("girl") || s === "pink") return "female";
  if (s.includes("male") || s.includes("boy") || s === "blue") return "male";
  return "any";
};

function Avatar({ name="" }) {
  const i = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"?";
  const bg = ["bg-blue-500","bg-purple-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-cyan-500"][(name.charCodeAt(0)||0)%6];
  return <div className={`w-8 h-8 rounded-full ${bg} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>{i}</div>;
}

function Stat({ icon:Icon, label, value, color, pct }) {
  const cfg = { blue:"bg-blue-50 text-blue-600", green:"bg-emerald-50 text-emerald-600", amber:"bg-amber-50 text-amber-600", slate:"bg-slate-100 text-slate-500", rose:"bg-rose-50 text-rose-600" };
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl ${cfg[color]} flex items-center justify-center shrink-0`}><Icon className="w-5 h-5"/></div>
      <div>
        <p className="text-xl font-black text-slate-800 leading-none">{value}</p>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
        {pct && <p className="text-[9px] text-slate-400 mt-0.5">{pct} of total</p>}
      </div>
    </div>
  );
}

function Sel({ value, onChange, children, placeholder }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:border-blue-400 cursor-pointer hover:border-slate-300 transition-all">
      <option value="all">{placeholder}</option>
      {children}
    </select>
  );
}

const LIMIT = 10;

export default function TotalProperties() {
  const navigate = useNavigate();
  const apiUrl = getApiBase();

  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [previewProperty, setPreviewProperty] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null });
  const [editModalOpen, setEditModalOpen] = useState(false);

  // filters
  const [search, setSearch]         = useState("");
  const [fStatus, setFStatus]       = useState("all");
  const [fType, setFType]           = useState("all");
  const [fCity, setFCity]           = useState("all");
  const [fLocation, setFLocation]   = useState("all");
  const [fOwner, setFOwner]         = useState("all");
  const [showMore, setShowMore]     = useState(false);
  const [fGender, setFGender]       = useState("all");
  const [fPriceMin, setFPriceMin]   = useState("");
  const [fPriceMax, setFPriceMax]   = useState("");

  const [apiStats, setApiStats] = useState({ published: 0, pending: 0, inactive: 0, rejected: 0 });

  // Modal State
  const [selectedProp, setSelectedProp] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [fullDetails, setFullDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const openViewModal = async (p) => {
    setSelectedProp(p);
    setViewModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/properties/${p.id}`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) setFullDetails(data.property);
    } catch (e) { console.error(e); }
    finally { setDetailsLoading(false); }
  };

  const fetchProps = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${apiUrl}/api/properties?limit=5000&t=${Date.now()}`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success && data.properties) {
        setAllProperties(data.properties.map(p => ({
          id:         p._id,
          propId:     p.propertyId || p.visitId || (p.locationCode && p.locationCode !== 'GEN' ? p.locationCode : null) || `PROP-${p._id?.slice(-4).toUpperCase()}`,
          title:      p.title || p.propertyInfo?.name || "Unnamed",
          image:      p.featuredImage || p.images?.[0] || "",
          type:       p.propertyType || p.propertyInfo?.propertyType || "pg",
          gender:     normalizeGender(p.gender || p.propertyInfo?.genderSuitability || "any"),
          city:       p.propertyInfo?.city || p.city || "-",
          locality:   p.locality || p.propertyInfo?.area || "-",
          ownerName:  p.owner?.name || p.propertyInfo?.ownerName || p.ownerName || p.contact?.name || "-",
          ownerPhone: p.owner?.phone || p.propertyInfo?.ownerPhone || p.ownerPhone || p.contact?.number || "-",
          price:      p.monthlyRent || p.rent || p.propertyInfo?.rent || p.roomTypes?.[0]?.pricePerBed || 0,
          status:     p.isLiveOnWebsite ? "Published" : p.status==="active" ? "Published" : p.status==="blocked" ? "Rejected" : p.status==="inactive" ? "Inactive" : "Pending",
          listedOn:   p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"}) : "-",
          listedTime: p.createdAt ? new Date(p.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "",
        })));
        if (data.stats) setApiStats(data.stats);
        setCurrentPage(1);
      }
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchProps(); },[]);

  // derive unique values for dropdowns
  const cities    = useMemo(()=>[...new Set(allProperties.map(p=>p.city).filter(c=>c&&c!=="-"))],[allProperties]);
  const locations = useMemo(()=>[...new Set(allProperties.filter(p=>fCity==="all"||p.city===fCity).map(p=>p.locality).filter(l=>l&&l!=="-"))],[allProperties,fCity]);
  const owners    = useMemo(()=>[...new Set(allProperties.map(p=>p.ownerName).filter(o=>o&&o!=="-"))],[allProperties]);

  const filtered = useMemo(()=>{
    let result = allProperties.filter(p=>{
      const s = search.toLowerCase();
      if(s && !p.title.toLowerCase().includes(s) && !p.ownerName.toLowerCase().includes(s) && !p.propId.toLowerCase().includes(s) && !p.city.toLowerCase().includes(s)) return false;
      if(fStatus!=="all"   && p.status!==fStatus)     return false;
      if(fType!=="all"     && p.type!==fType)          return false;
      if(fCity!=="all"     && p.city!==fCity)          return false;
      if(fLocation!=="all" && p.locality!==fLocation)  return false;
      if(fOwner!=="all"    && p.ownerName!==fOwner)    return false;
      if(fGender!=="all"   && p.gender!==fGender)      return false;
      if(fPriceMin && p.price < Number(fPriceMin))     return false;
      if(fPriceMax && p.price > Number(fPriceMax))     return false;
      return true;
    });
    return result;
  },[allProperties,search,fStatus,fType,fCity,fLocation,fOwner,fGender,fPriceMin,fPriceMax]);

  // Frontend Pagination
  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / LIMIT) || 1;
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedProps = useMemo(() => {
    const start = (currentPage - 1) * LIMIT;
    return filtered.slice(start, start + LIMIT);
  }, [filtered, currentPage]);

  const resetAll = () => { setSearch(""); setFStatus("all"); setFType("all"); setFCity("all"); setFLocation("all"); setFOwner("all"); setFGender("all"); setFPriceMin(""); setFPriceMax(""); setSelectedIds(new Set()); };

  const handleDeleteOne = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Property",
      message: "Are you sure you want to delete this property? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        const toastId = toast.loading("Deleting property...");
        try {
          const res = await fetch(`${apiUrl}/api/properties/${id}`, { method: "DELETE", headers: getAuthHeader() });
          const data = await res.json();
          if (data.success || res.ok) {
            toast.success("Property deleted successfully", { id: toastId });
            fetchProps();
          } else {
            toast.error(data.message || "Failed to delete property", { id: toastId });
          }
        } catch (err) {
          console.error(err);
          toast.error("Error deleting property", { id: toastId });
        }
      }
    });
  };

  const handleBulkApprove = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: "Bulk Approve Properties",
      message: `Are you sure you want to approve all ${selectedIds.size} selected properties? They will go live on the website immediately.`,
      type: "info",
      onConfirm: async () => {
        setBulkProcessing(true);
        const toastId = toast.loading(`Publishing ${selectedIds.size} properties...`);
        try {
          let successCount = 0;
          for (const id of selectedIds) {
            const res = await fetch(`${apiUrl}/api/properties/${id}/publish`, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...getAuthHeader() }
            });
            const data = await res.json();
            if (data.success || res.ok) {
              successCount++;
            }
          }
          toast.success(`Successfully approved ${successCount} of ${selectedIds.size} properties!`, { id: toastId });
          setSelectedIds(new Set());
          fetchProps();
        } catch (err) {
          console.error(err);
          toast.error("Error during bulk approval.", { id: toastId });
        } finally {
          setBulkProcessing(false);
        }
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: "Bulk Delete Properties",
      message: `Are you sure you want to permanently delete all ${selectedIds.size} selected properties? This action cannot be undone.`,
      type: "danger",
      onConfirm: async () => {
        setBulkProcessing(true);
        const toastId = toast.loading(`Deleting ${selectedIds.size} properties...`);
        try {
          let successCount = 0;
          for (const id of selectedIds) {
            const res = await fetch(`${apiUrl}/api/properties/${id}`, { method: "DELETE", headers: getAuthHeader() });
            const data = await res.json();
            if (data.success || res.ok) {
              successCount++;
            }
          }
          toast.success(`Successfully deleted ${successCount} of ${selectedIds.size} properties!`, { id: toastId });
          setSelectedIds(new Set());
          fetchProps();
        } catch (err) {
          console.error(err);
          toast.error("Error during bulk deletion.", { id: toastId });
        } finally {
          setBulkProcessing(false);
        }
      }
    });
  };

  const stats = useMemo(()=>({
    total:     allProperties.length,
    published: apiStats.published,
    pending:   apiStats.pending,
    inactive:  apiStats.inactive,
    rejected:  apiStats.rejected,
  }),[apiStats,allProperties.length]);

  const pct = (n) => stats.total ? `${((n/stats.total)*100).toFixed(1)}%` : null;

  return (
    <div className="p-6 space-y-5 bg-white min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 leading-none">Total Properties</h1>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1.5">Manage and view all properties listed on the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProps} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-all">
            <RefreshCw className="w-3.5 h-3.5"/> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-all">
            <Download className="w-3.5 h-3.5"/> Export
          </button>
          <button onClick={()=>setShowMore(v=>!v)} className={cn("flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-bold shadow-sm transition-all", showMore?"bg-blue-600 text-white border-blue-600":"bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
            <SlidersHorizontal className="w-3.5 h-3.5"/> More Filters
          </button>
          <button onClick={() => { setSelectedProp(null); setEditModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
            <Plus className="w-3.5 h-3.5"/> Add Property
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <Stat icon={Building2}    label="Total Properties"  value={stats.total.toLocaleString()}     color="blue"  />
        <Stat icon={CheckCircle2} label="Published"         value={stats.published.toLocaleString()} color="green" pct={pct(stats.published)} />
        <Stat icon={Clock}        label="Pending Approval"  value={stats.pending.toLocaleString()}   color="amber" pct={pct(stats.pending)} />
        <Stat icon={XCircle}      label="Inactive"          value={stats.inactive.toLocaleString()}  color="slate" pct={pct(stats.inactive)} />
        <Stat icon={AlertCircle}  label="Rejected"          value={stats.rejected.toLocaleString()}  color="rose"  pct={pct(stats.rejected)} />
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Main Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 p-4 border-b border-slate-100">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by property name..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"/>
            {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5"/></button>}
          </div>

          <Sel value={fStatus} onChange={setFStatus} placeholder="All Status">
            <option value="Published">Published</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
            <option value="Rejected">Rejected</option>
          </Sel>

          <Sel value={fType} onChange={setFType} placeholder="All Type">
            <option value="pg">PG</option>
            <option value="hostel">Hostel</option>
            <option value="co-living">Co-Living</option>
            <option value="apartment">Apartment</option>
            <option value="room">Room</option>
          </Sel>

          <Sel value={fCity} onChange={v=>{setFCity(v); setFLocation("all");}} placeholder="All City">
            {cities.map(c=><option key={c} value={c}>{c}</option>)}
          </Sel>

          <Sel value={fLocation} onChange={setFLocation} placeholder="All Location">
            {locations.map(l=><option key={l} value={l}>{l}</option>)}
          </Sel>

          <Sel value={fOwner} onChange={setFOwner} placeholder="All Owner">
            {owners.map(o=><option key={o} value={o}>{o}</option>)}
          </Sel>

          {(search||fStatus!=="all"||fType!=="all"||fCity!=="all"||fLocation!=="all"||fOwner!=="all"||fGender!=="all"||fPriceMin||fPriceMax) && (
            <button onClick={resetAll} className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-rose-500 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all">
              <X className="w-3 h-3"/> Reset
            </button>
          )}
        </div>

        {/* More Filters Panel */}
        {showMore && (
          <div className="flex flex-wrap items-end gap-4 px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Gender</p>
              <Sel value={fGender} onChange={setFGender} placeholder="All Gender">
                <option value="male">Boys</option>
                <option value="female">Girls</option>
                <option value="any">Unisex</option>
              </Sel>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Min Price (₹)</p>
              <input type="number" value={fPriceMin} onChange={e=>setFPriceMin(e.target.value)} placeholder="0"
                className="w-32 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 transition-all"/>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Max Price (₹)</p>
              <input type="number" value={fPriceMax} onChange={e=>setFPriceMax(e.target.value)} placeholder="Any"
                className="w-32 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-400 transition-all"/>
            </div>
            <p className="text-[10px] text-slate-400 font-medium self-center">
              Showing <span className="font-bold text-slate-700">{filtered.length}</span> matching properties
            </p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500"/>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Properties...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Building2 className="w-12 h-12 text-slate-200"/>
            <p className="text-sm font-bold text-slate-400">No properties found</p>
            <button onClick={resetAll} className="text-xs text-blue-500 font-bold hover:underline">Clear filters</button>
          </div>
        ) : (
          <div>
            {/* Bulk Actions Banner */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-blue-100/50 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 flex-wrap gap-3">
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
                    onClick={handleBulkDelete} 
                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl text-[11px] font-bold shadow-md shadow-rose-100 hover:shadow-lg hover:from-rose-600 hover:to-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkProcessing ? "Deleting..." : "Bulk Delete"}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-5 py-3.5 w-10">
                      <input
                        type="checkbox"
                        disabled={bulkProcessing}
                        className="rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        checked={paginatedProps.length > 0 && paginatedProps.every(p => selectedIds.has(p.id))}
                        onChange={() => {
                          const allSelected = paginatedProps.every(p => selectedIds.has(p.id));
                          const next = new Set(selectedIds);
                          if (allSelected) {
                            paginatedProps.forEach(p => next.delete(p.id));
                          } else {
                            paginatedProps.forEach(p => next.add(p.id));
                          }
                          setSelectedIds(next);
                        }}
                      />
                    </th>
                    <th className="text-left px-4 py-3.5">Property Details</th>
                    <th className="text-left px-4 py-3.5">Owner</th>
                    <th className="text-left px-4 py-3.5">Type</th>
                    <th className="text-left px-4 py-3.5">Location</th>
                    <th className="text-left px-4 py-3.5">Price</th>
                    <th className="text-left px-4 py-3.5">Status</th>
                    <th className="text-left px-4 py-3.5">Listed On</th>
                    <th className="px-4 py-3.5 text-right w-48 min-w-[190px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedProps.map(p => (
                    <tr key={p.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          disabled={bulkProcessing}
                          className="rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          checked={selectedIds.has(p.id)}
                          onChange={() => {
                            const next = new Set(selectedIds);
                            if (next.has(p.id)) next.delete(p.id);
                            else next.add(p.id);
                            setSelectedIds(next);
                          }}
                        />
                      </td>

                    {/* Property */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-11 rounded-lg overflow-hidden border border-slate-100 bg-slate-100 shrink-0">
                          {p.image ? <img src={p.image} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-4 h-4"/></div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-800 truncate max-w-[180px]">{p.title}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">ID: {p.propId}</p>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">{TYPE_MAP[p.type]||p.type}</span>
                            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md", GENDER_COLOR[p.gender]||"")}>{GENDER_MAP[p.gender]||p.gender}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.ownerName}/>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-slate-800 truncate max-w-[110px]">{p.ownerName}</p>
                          {p.ownerPhone&&p.ownerPhone!=="-" && <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-2.5 h-2.5"/>{p.ownerPhone}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building2 className="w-3.5 h-3.5 text-blue-500"/>
                        </div>
                        <span className="text-[12px] font-bold text-slate-700">{TYPE_MAP[p.type]||p.type}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0"/>
                        <div>
                          {p.locality!=="-" && <p className="text-[12px] font-bold text-slate-700 leading-tight">{p.locality}</p>}
                          <p className="text-[11px] text-slate-500 font-medium">{p.city}</p>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-4">
                      <p className="text-[13px] font-black text-slate-800">{p.price ? `₹${Number(p.price).toLocaleString("en-IN")} / bed` : "—"}</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-lg", STATUS_COLORS[p.status]||"bg-slate-100 text-slate-500")}>{p.status}</span>
                    </td>

                    {/* Listed On */}
                    <td className="px-4 py-4">
                      <p className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{p.listedOn}</p>
                      {p.listedTime && <p className="text-[9px] text-slate-400 mt-0.5">{p.listedTime}</p>}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={async () => {
                            setPreviewLoading(true);
                            try {
                              const res = await fetch(`${apiUrl}/api/properties/${p.id}`, { headers: getAuthHeader() });
                              const data = await res.json();
                              if (data.success && data.property) setPreviewProperty(data.property);
                              else toast.error("Failed to load preview");
                            } catch { toast.error("Error loading preview"); }
                            finally { setPreviewLoading(false); }
                          }}
                          className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-100/50 shadow-sm flex items-center justify-center transition-all hover:scale-110"
                          title="Preview on Website"
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={()=>openViewModal(p)} 
                          className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100/60 shadow-sm flex items-center justify-center transition-all hover:scale-110" 
                          title="View Details"
                        >
                          <Eye className="w-4 h-4"/>
                        </button>
                        <button 
                          onClick={() => { setSelectedProp(p); setEditModalOpen(true); }} 
                          className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-100/60 shadow-sm flex items-center justify-center transition-all hover:scale-110" 
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4"/>
                        </button>
                        <button 
                          onClick={()=>handleDeleteOne(p.id)} 
                          className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100/50 shadow-sm flex items-center justify-center transition-all hover:scale-110" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                        <button className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 border border-slate-100/60 shadow-sm flex items-center justify-center transition-all"><MoreVertical className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-white">
          <p className="text-[11px] font-bold text-slate-400">
            Showing {filtered.length>0?((currentPage-1)*LIMIT)+1:0} to {Math.min(currentPage*LIMIT,totalRecords)} of{" "}
            <span className="text-slate-700">{totalRecords.toLocaleString()}</span> properties
          </p>
          <div className="flex items-center gap-1.5">
            <button disabled={currentPage===1} onClick={()=>setCurrentPage(currentPage-1)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="w-3.5 h-3.5"/> Prev
            </button>
            {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
              let n;
              if(totalPages<=7) n=i+1;
              else if(currentPage<=4) n=i+1;
              else if(currentPage>=totalPages-3) n=totalPages-6+i;
              else n=currentPage-3+i;
              return (
                <button key={n} onClick={()=>setCurrentPage(n)}
                  className={cn("w-9 h-9 rounded-xl text-[11px] font-bold transition-all",
                    currentPage===n?"bg-blue-600 text-white shadow-lg shadow-blue-200":"text-slate-500 hover:bg-slate-100 border border-slate-200")}>
                  {n}
                </button>
              );
            })}
            <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(currentPage+1)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              Next <ChevronRight className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* FULL DETAIL VIEW MODAL — same as superadmin properties.jsx style  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {viewModalOpen && selectedProp && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && (setViewModalOpen(false), setFullDetails(null))}>
          <div className="bg-[#F8FAFC] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 leading-tight">{selectedProp.title}</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {selectedProp.city}{selectedProp.locality && selectedProp.locality !== "-" ? ` • ${selectedProp.locality}` : ""} • ID: {selectedProp.propId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-[8px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider", STATUS_COLORS[selectedProp.status] || "bg-slate-100 text-slate-500 border-slate-200")}>
                  {selectedProp.status}
                </span>
                {fullDetails?.pendingChanges?.status === "pending" && (
                  <span className="text-[8px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Pending Changes
                  </span>
                )}
                <button onClick={() => { setViewModalOpen(false); setFullDetails(null); }}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading full details...</p>
                </div>
              ) : fullDetails ? (
                <>
                  {fullDetails.pendingChanges?.status === "pending" && (
                    <PendingChangesSection prop={fullDetails} apiUrl={apiUrl} onRefresh={() => { fetchProps(); openViewModal(selectedProp); }} setConfirmModal={setConfirmModal} />
                  )}

                  {/* Images */}
                  {(() => {
                    const imgs = [...(fullDetails.images || []), ...((fullDetails.propertyViews || []).flatMap(v => v.images || []))].filter(Boolean);
                    return imgs.length > 0 && <ImageGallerySection images={imgs} />;
                  })()}

                  {/* Basic Info */}
                  <InfoSection title="Basic Information" icon={Building2} colorClass="blue">
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <F label="Title" val={fullDetails.title} />
                      <F label="Property Type" val={fullDetails.propertyType} />
                      <F label="Gender" val={fullDetails.gender} />
                      <F label="City" val={fullDetails.city} />
                      <F label="Locality" val={fullDetails.locality} />
                      <F label="Location Code" val={fullDetails.locationCode} />
                      <F label="Address" val={fullDetails.address} />
                      <F label="Landmark" val={fullDetails.landmark} />
                      <F label="State" val={fullDetails.state} />
                      <F label="Pincode" val={fullDetails.pincode} />
                      <F label="Latitude" val={fullDetails.latitude} />
                      <F label="Longitude" val={fullDetails.longitude} />
                    </div>
                  </InfoSection>

                  {/* Contact & Owner */}
                  <InfoSection title="Contact & Owner" icon={Home} colorClass="emerald">
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <F label="Owner Name" val={fullDetails.ownerName} />
                      <F label="Owner Phone" val={fullDetails.ownerPhone} />
                      <F label="Owner Login ID" val={fullDetails.ownerLoginId} />
                      <F label="Contact Name" val={fullDetails.contact?.name} />
                      <F label="Contact Number" val={fullDetails.contact?.number} />
                      <F label="Contact Email" val={fullDetails.contact?.email} />
                    </div>
                  </InfoSection>

                  {/* Pricing */}
                  <InfoSection title="Pricing" icon={Layers} colorClass="indigo">
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <F label="Monthly Rent" val={fullDetails.monthlyRent ? `₹${fullDetails.monthlyRent?.toLocaleString()}` : null} />
                      <F label="Discount" val={fullDetails.discount ? `₹${fullDetails.discount}` : "0"} />
                      <F label="Rent Type" val={fullDetails.pricing?.rentType} />
                      <F label="Security Deposit" val={fullDetails.pricing?.securityDeposit} />
                      <F label="Advance Rent" val={fullDetails.pricing?.advanceRent} />
                      <F label="Notice Period" val={fullDetails.pricing?.noticePeriod} />
                      <F label="Lock-in Period" val={fullDetails.pricing?.lockInPeriod} />
                      <F label="Discount %" val={fullDetails.pricing?.discountPercent} />
                      {(fullDetails.pricing?.additionalCharges || []).length > 0 && (
                        <div className="md:col-span-3 space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Additional Charges</p>
                          <div className="flex flex-wrap gap-2">
                            {(fullDetails.pricing?.additionalCharges || []).map((c, i) => (
                              <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100 font-semibold">{c.name}: ₹{c.amount}/{c.per}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </InfoSection>

                  {/* Property Details */}
                  {fullDetails.propertyDetails && Object.values(fullDetails.propertyDetails).some(v => v) && (
                    <InfoSection title="Property Details" icon={Home} colorClass="amber">
                      <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <F label="Total Area" val={fullDetails.propertyDetails?.totalArea} />
                        <F label="Year Built" val={fullDetails.propertyDetails?.yearBuilt} />
                        <F label="Property Age" val={fullDetails.propertyDetails?.propertyAge} />
                        <F label="Floors" val={fullDetails.propertyDetails?.floors} />
                        <F label="Lift Available" val={fullDetails.propertyDetails?.liftAvailable} />
                        <F label="Parking" val={fullDetails.propertyDetails?.parkingAvailable} />
                        <F label="Notice Period" val={fullDetails.propertyDetails?.noticePeriod} />
                        <F label="Gender Pref" val={fullDetails.propertyDetails?.genderPref} />
                        <F label="Preferred For" val={fullDetails.propertyDetails?.preferredFor} />
                      </div>
                    </InfoSection>
                  )}

                  {/* Policies */}
                  {fullDetails.policies && Object.values(fullDetails.policies).some(v => v) && (
                    <InfoSection title="Policies / House Rules" icon={Home} colorClass="rose">
                      <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <F label="Smoking" val={fullDetails.policies?.smokingAllowed} />
                        <F label="Alcohol" val={fullDetails.policies?.alcoholAllowed} />
                        <F label="Pets" val={fullDetails.policies?.petsAllowed} />
                        <F label="Cooking" val={fullDetails.policies?.cookingAllowed} />
                        <F label="Visitors" val={fullDetails.policies?.visitorsAllowed} />
                        <F label="Visitor Timing" val={fullDetails.policies?.visitorTiming} />
                        <F label="Party" val={fullDetails.policies?.partyAllowed} />
                        <F label="Outside Food" val={fullDetails.policies?.outsideFood} />
                        <F label="Quiet Hours" val={fullDetails.policies?.quietHours} />
                        <F label="Quiet Hours Timing" val={fullDetails.policies?.quietHoursTiming} />
                        <F label="Early Check-in" val={fullDetails.policies?.earlyCheckIn} />
                      </div>
                    </InfoSection>
                  )}

                  {/* Facilities */}
                  {fullDetails.facilities && Object.values(fullDetails.facilities).some(Boolean) && (
                    <InfoSection title="Facilities" icon={Home} colorClass="teal">
                      <div className="p-4 flex flex-wrap gap-2">
                        {Object.entries(fullDetails.facilities || {}).map(([k, v]) => (
                          <span key={k} className={cn("text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider",
                            v ? "bg-teal-50 text-teal-600 border-teal-100" : "bg-slate-50 text-slate-400 border-slate-100")}>
                            {v ? "✓" : "✗"} {k.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        ))}
                      </div>
                    </InfoSection>
                  )}

                  {/* Amenities */}
                  {(fullDetails.amenities || []).length > 0 && (
                    <InfoSection title={`Amenities (${fullDetails.amenities.length})`} icon={Home} colorClass="purple">
                      <div className="p-4 flex flex-wrap gap-2">
                        {(fullDetails.amenities || []).map((am, i) => (
                          <span key={i} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wider">
                            {typeof am === "string" ? am : am.name}
                          </span>
                        ))}
                      </div>
                    </InfoSection>
                  )}

                  {/* Room Types */}
                  {(fullDetails.roomTypes || []).length > 0 && (
                    <InfoSection title="Room Types" icon={Users} colorClass="slate">
                      <div className="p-4 space-y-3">
                        {(fullDetails.roomTypes || []).map((rt, i) => (
                          <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-xs font-bold text-slate-700 mb-2">{rt.type || `Room Type ${i + 1}`}</p>
                            <div className="grid grid-cols-3 gap-2">
                              <F label="Occupancy" val={rt.occupancy} />
                              <F label="Price/Bed" val={rt.pricePerBed ? `₹${rt.pricePerBed}` : null} />
                              <F label="Price/Room" val={rt.pricePerRoom ? `₹${rt.pricePerRoom}` : null} />
                              <F label="Total Rooms" val={rt.totalRooms} />
                              <F label="Total Beds" val={rt.totalBeds} />
                              <F label="Description" val={rt.desc} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </InfoSection>
                  )}

                  {/* Occupancy Stats */}
                  <InfoSection title="Occupancy & Stats" icon={Users} colorClass="slate">
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <F label="Total Rooms" val={fullDetails.totalRooms || fullDetails.roomCount} />
                      <F label="Occupied Rooms" val={fullDetails.occupiedRooms} />
                      <F label="Vacant Rooms" val={fullDetails.vacantRooms} />
                      <F label="Total Beds" val={fullDetails.bedCount} />
                      <F label="Occupied Beds" val={fullDetails.occupiedBeds} />
                      <F label="Vacant Beds" val={fullDetails.vacantBeds} />
                      <F label="Views" val={fullDetails.views} />
                      <F label="Clicks" val={fullDetails.clicks} />
                    </div>
                  </InfoSection>

                  {/* Description */}
                  {(fullDetails.description || fullDetails.tenantDescription) && (
                    <InfoSection title="Description" icon={Home} colorClass="slate">
                      <div className="p-4 space-y-3">
                        {fullDetails.description && <F label="Property Description" val={fullDetails.description} />}
                        {fullDetails.tenantDescription && <F label="Tenant Description" val={fullDetails.tenantDescription} />}
                      </div>
                    </InfoSection>
                  )}

                  {/* Status & Admin */}
                  <InfoSection title="Status & Admin" icon={Home} colorClass="slate">
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <F label="Status" val={fullDetails.status} />
                      <F label="Is Published" val={fullDetails.isPublished} />
                      <F label="Is Live on Website" val={fullDetails.isLiveOnWebsite} />
                      <F label="Property Category" val={fullDetails.propertyCategory} />
                      <F label="Created At" val={fullDetails.createdAt ? new Date(fullDetails.createdAt).toLocaleDateString("en-IN") : null} />
                      <F label="Updated At" val={fullDetails.updatedAt ? new Date(fullDetails.updatedAt).toLocaleDateString("en-IN") : null} />
                    </div>
                  </InfoSection>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">Data unavailable for this property</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 shrink-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {selectedProp.id}</p>
              <div className="flex gap-3">
                <button onClick={() => { setViewModalOpen(false); setFullDetails(null); }}
                  className="px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200">
                  Close
                </button>
                <button onClick={() => { setViewModalOpen(false); setEditModalOpen(true); }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200/50">
                  <Pencil className="w-3.5 h-3.5" /> Edit Property
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Preview Loading Overlay */}
      {previewLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Loading Preview...</p>
          </div>
        </div>
      )}

      {/* Website Preview Modal */}
      {previewProperty && !previewLoading && (
        <WebsitePropertyPreviewModal
          property={previewProperty}
          onClose={() => setPreviewProperty(null)}
        />
      )}

      {editModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] overflow-y-auto p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-[1300px] h-[90vh] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setEditModalOpen(false)} 
              className="absolute top-6 right-8 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-2xl transition-colors z-[180]"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-y-auto">
              <AddPropertyWizard 
                propEditId={selectedProp?.id} 
                isModal={true} 
                onClose={() => {
                  setEditModalOpen(false);
                  fetchProps();
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm",
                confirmModal.type === "danger" ? "bg-rose-50 border-rose-100 text-rose-600" :
                confirmModal.type === "warning" ? "bg-amber-50 border-amber-100 text-amber-600" :
                "bg-blue-50 border-blue-100 text-blue-600"
              )}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800 text-base leading-tight">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">{confirmModal.message}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", type: "info", onConfirm: null })} 
                className="px-5 py-2.5 rounded-xl text-[10px] font-bold text-slate-500 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ isOpen: false, title: "", message: "", type: "info", onConfirm: null });
                }} 
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-bold text-white shadow-lg transition-all uppercase tracking-widest active:scale-95",
                  confirmModal.type === "danger" ? "bg-rose-600 shadow-rose-200 hover:bg-rose-700" :
                  confirmModal.type === "warning" ? "bg-amber-600 shadow-amber-200 hover:bg-amber-700" :
                  "bg-blue-600 shadow-blue-200 hover:bg-blue-700"
                )}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper components for the full-detail modal ──────────────────────────────
const fmtVal = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) {
    if (val.length === 0) return "—";
    return val.map(item => {
      if (typeof item === "object" && item !== null)
        return item.name || item.title || item.label || Object.values(item).filter(v => typeof v === "string").join(" ") || JSON.stringify(item);
      return String(item);
    }).join(", ");
  }
  if (typeof val === "object") {
    return Object.entries(val).filter(([, v]) => v !== null && v !== "" && v !== undefined)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").trim()}: ${typeof v === "boolean" ? (v ? "Yes" : "No") : v}`)
      .join(" • ");
  }
  return String(val);
};

function F({ label, val }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="text-[11px] font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 break-words">
        {fmtVal(val) || "—"}
      </div>
    </div>
  );
}

const colorCfg = {
  blue:    ["bg-blue-50 border-blue-100",   "text-blue-600",   "text-blue-700"],
  emerald: ["bg-emerald-50 border-emerald-100", "text-emerald-600", "text-emerald-700"],
  indigo:  ["bg-indigo-50 border-indigo-100",  "text-indigo-600",  "text-indigo-700"],
  amber:   ["bg-amber-50 border-amber-100",    "text-amber-600",   "text-amber-700"],
  rose:    ["bg-rose-50 border-rose-100",      "text-rose-600",    "text-rose-700"],
  teal:    ["bg-teal-50 border-teal-100",      "text-teal-600",    "text-teal-700"],
  purple:  ["bg-purple-50 border-purple-100",  "text-purple-600",  "text-purple-700"],
  slate:   ["bg-slate-50 border-slate-100",    "text-slate-600",   "text-slate-700"],
};

function InfoSection({ title, icon: Icon, colorClass = "blue", children }) {
  const [bg, iconCls, textCls] = colorCfg[colorClass] || colorCfg.slate;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={cn("p-4 border-b flex items-center gap-2", bg)}>
        <Icon className={cn("w-4 h-4", iconCls)} />
        <span className={cn("text-xs font-bold uppercase tracking-widest", textCls)}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ImageGallerySection({ images }) {
  const [activeImg, setActiveImg] = useState(0);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-purple-600" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Property Images ({images.length})</span>
      </div>
      <div className="p-4">
        <div className="relative w-full h-56 rounded-xl overflow-hidden mb-3 bg-slate-100">
          <img src={images[activeImg]} alt="Property" className="w-full h-full object-cover" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActiveImg(i)}
              className={cn("shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all", i === activeImg ? "border-blue-500" : "border-slate-200 opacity-60 hover:opacity-100")}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PendingChangesSection({ prop, apiUrl, onRefresh, setConfirmModal }) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const approve = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Approve Changes",
      message: "Approve these changes? They will go live immediately.",
      type: "info",
      onConfirm: async () => {
        setApproving(true);
        const toastId = toast.loading("Approving changes...");
        try {
          const res = await fetch(`${apiUrl}/api/properties/${prop._id}/approve-changes`, { method: "PUT", headers: { "Content-Type": "application/json" } });
          const data = await res.json();
          if (data.success) { toast.success("Changes approved & live!", { id: toastId }); onRefresh(); }
          else toast.error(data.message || "Failed to approve", { id: toastId });
        } catch { toast.error("Error approving changes", { id: toastId }); } finally { setApproving(false); }
      }
    });
  };

  const reject = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Reject Changes",
      message: "Are you sure you want to reject these proposed changes?",
      type: "warning",
      onConfirm: async () => {
        setRejecting(true);
        const toastId = toast.loading("Rejecting changes...");
        try {
          const res = await fetch(`${apiUrl}/api/properties/${prop._id}/reject-changes`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rejectReason: reason }) });
          const data = await res.json();
          if (data.success) { toast.success("Changes rejected", { id: toastId }); setShowReject(false); onRefresh(); }
          else toast.error(data.message || "Failed to reject", { id: toastId });
        } catch { toast.error("Error rejecting changes", { id: toastId }); } finally { setRejecting(false); }
      }
    });
  };

  return (
    <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-bold text-amber-800 uppercase tracking-tight">Owner Edit Request — Pending Approval</span>
        </div>
        <span className="text-[9px] text-amber-600 font-bold">
          {prop.pendingChanges?.requestedBy} • {prop.pendingChanges?.requestedAt ? new Date(prop.pendingChanges.requestedAt).toLocaleDateString("en-IN") : ""}
        </span>
      </div>
      {prop.pendingChanges?.reason && (
        <p className="text-xs text-amber-700 bg-amber-100 px-3 py-2 rounded-lg mb-4 border border-amber-200"><strong>Reason:</strong> {prop.pendingChanges.reason}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {Object.entries(prop.pendingChanges?.data || {}).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([key, val]) => (
          <div key={key} className="space-y-1">
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">{key.replace(/([A-Z])/g, " $1").trim()} (Proposed)</p>
            <div className="text-[11px] font-semibold text-amber-900 bg-white px-3 py-2 rounded-lg border border-amber-300 break-words">{fmtVal(val)}</div>
          </div>
        ))}
      </div>
      {!showReject ? (
        <div className="flex gap-3">
          <button onClick={approve} disabled={approving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50">
            {approving ? "Approving..." : "✓ Approve & Go Live"}
          </button>
          <button onClick={() => setShowReject(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100">
            ✗ Reject Changes
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection (optional)..."
            className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-100" />
          <div className="flex gap-3">
            <button onClick={() => setShowReject(false)} className="flex-1 py-2 rounded-xl text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">Cancel</button>
            <button onClick={reject} disabled={rejecting} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50">
              {rejecting ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
