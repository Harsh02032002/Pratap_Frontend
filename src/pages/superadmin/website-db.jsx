import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Hourglass,
  Check, X, Eye, ClipboardCheck, AlertTriangle,
  Camera, Star, Edit3, Trash, UserCheck,
  RefreshCw, Download, Inbox, CreditCard, Tag,
  BarChart3, Plus, Loader2, Sparkles, Globe2,
  ExternalLink, Layers
} from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function WebsiteDb() {
  const [filter, setFilter] = useState("online");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [gallery, setGallery] = useState([]);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const loadWebsite = async () => {
    try {
      setErrorMsg("");
      setLoading(true);
      const data = await fetchJson("/api/approved-properties/public/approved");
      const list = Array.isArray(data) ? data : (data.properties || data.visits || []);
      setProperties(list);
    } catch (err) {
      setErrorMsg(err?.message || "Error loading properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWebsite(); }, []);

  const filtered = useMemo(() => {
    return properties.filter((v) =>
      filter === "online" ? v.isLiveOnWebsite === true : v.isLiveOnWebsite === false
    );
  }, [properties, filter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const withPhotos = filtered.filter((v) => (v.propertyInfo?.photos || v.photos || []).length > 0).length;
    const withoutPhotos = total - withPhotos;
    return { total, withPhotos, withoutPhotos };
  }, [filtered]);

  const toggleLive = async (propertyId) => {
    try {
      await fetchJson(`/api/approved-properties/${propertyId}/toggle-live`, { method: "PUT" });
      await loadWebsite();
    } catch (err) {
      window.alert(err?.message || "Failed to toggle status");
    }
  };

  const openGallery = (photos) => {
    const list = Array.isArray(photos) ? photos : [];
    setGallery(list);
    setGalleryOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Digital Inventory...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Digital Inventory</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Public Asset Visibility & Media Density Ledger</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
               {["online", "offline"].map(m => (
                 <button 
                   key={m} onClick={() => setFilter(m)}
                   className={cn(
                     "px-4 py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all",
                     filter === m ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                    {m}
                 </button>
               ))}
            </div>
            <button className="bg-white text-slate-400 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
               <Download className="w-3.5 h-3.5" /> Export Ledger
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCardHorizontal label="Digital Assets" value={stats.total} trend="Global Index" up icon={Layers} color="blue" />
        <StatCardHorizontal label="Visual Density" value={stats.withPhotos} trend="Media Rich" up icon={Camera} color="emerald" />
        <StatCardHorizontal label="Awaiting Media" value={stats.withoutPhotos} trend="Pending Uploads" up={false} icon={AlertTriangle} color="amber" />
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Visibility Ledger</h3>
            <button onClick={loadWebsite} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
               <RefreshCw className="w-3.5 h-3.5" />
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                     <th className="pb-4">Asset Profile</th>
                     <th className="pb-4">Geographic Context</th>
                     <th className="pb-4">Stakeholder Pulse</th>
                     <th className="pb-4 text-center">Rental Yield</th>
                     <th className="pb-4 text-center">Digital Pulse</th>
                     <th className="pb-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filtered.map((v) => {
                    const prop = v.propertyInfo || {};
                    const photos = prop.photos || v.photos || [];
                    const visitId = v.visitId || v._id || "";
                    const rent = prop.rent || v.monthlyRent || 0;
                    return (
                      <tr key={visitId} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                         <td className="py-3">
                            <div className="flex items-center gap-3">
                               <div className="w-12 h-8 rounded-lg bg-slate-100 overflow-hidden shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-500 relative shrink-0">
                                  {photos[0] ? (
                                    <img src={photos[0]} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                       <ImageIcon className="w-4 h-4" />
                                    </div>
                                  )}
                                  {photos.length > 0 && (
                                    <button onClick={(e) => { e.stopPropagation(); openGallery(photos); }} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[7px] font-bold uppercase backdrop-blur-sm">
                                       {photos.length} Assets
                                    </button>
                                  )}
                               </div>
                               <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[150px]">{prop.name || "Unnamed Asset"}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {visitId.slice(-8).toUpperCase()}</p>
                               </div>
                            </div>
                         </td>
                         <td className="py-3">
                            <p className="text-[10px] font-bold text-slate-700 leading-tight truncate max-w-[120px]">{prop.type || "-"}</p>
                            <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                               <MapPin className="w-3 h-3" />
                               <span className="text-[8px] font-bold uppercase tracking-widest">{prop.area || "-"}</span>
                            </div>
                         </td>
                         <td className="py-3">
                            <p className="text-[10px] font-bold text-slate-800 leading-tight">{prop.ownerName || "-"}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{prop.ownerPhone || "-"}</p>
                         </td>
                         <td className="py-3 text-center">
                            <p className="text-[11px] font-bold text-slate-800 tracking-tight">₹{rent.toLocaleString()}</p>
                         </td>
                         <td className="py-3 text-center">
                            <span className={cn(
                              "text-[7px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm",
                              v.isLiveOnWebsite ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                            )}>
                               {v.isLiveOnWebsite ? "Live" : "Offline"}
                            </span>
                         </td>
                         <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                               <button onClick={() => toggleLive(v.propertyId || visitId)} className="px-3 py-1.5 rounded-lg border border-slate-100 bg-white text-slate-400 hover:text-blue-600 hover:shadow-md transition-all text-[8px] font-bold uppercase shadow-sm">Toggle</button>
                               <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md transition-all border border-slate-100 shadow-sm">
                                  <ExternalLink className="w-3.5 h-3.5" />
                               </button>
                            </div>
                         </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modern Gallery Modal */}
      {galleryOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300" onClick={() => setGalleryOpen(false)}>
           <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4 text-white">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-lg"><Camera className="w-5 h-5" /></div>
                    <div>
                       <h3 className="text-xl font-bold tracking-tight">Asset Gallery</h3>
                       <p className="text-[8px] font-bold uppercase opacity-50 tracking-widest">{gallery.length} Media Entities Found</p>
                    </div>
                 </div>
                 <button onClick={() => setGalleryOpen(false)} className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[70vh] overflow-y-auto p-2 custom-scrollbar">
                 {gallery.map((src, idx) => (
                   <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl group relative hover:scale-105 transition-all duration-500">
                      <img src={src} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100" 
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md flex items-start gap-3 group hover:translate-y-[-2px] transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none truncate">{label}</p>
         <p className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-2">{value}</p>
         <div className={cn(
           "flex items-center gap-1 text-[7px] font-bold uppercase",
           up ? "text-emerald-600" : "text-rose-600"
         )}>
            {up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {trend}
         </div>
      </div>
    </div>
  );
}
