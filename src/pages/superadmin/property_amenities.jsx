import React, { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { 
  Loader2, Plus, X, Trash2, Edit, Eye, 
  Search, Filter, ChevronRight, LayoutGrid, 
  Activity, Zap, Shield, Home, Building2,
  RefreshCw, Download, Settings2, Sparkles,
  Layers, ArrowUpRight, ArrowDownRight
} from "lucide-react";

import { fetchJson, getAuthHeader } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://roohmy-backend-xwa9.vercel.app");

const getIconComponent = (iconName) => {
  const iconKey = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-./g, x => x[1].toUpperCase());
  return LucideIcons[iconKey] || LucideIcons.Circle;
};

const iconOptions = [
  { value: "wifi", label: "WiFi" },
  { value: "car", label: "Parking" },
  { value: "dumbbell", label: "Gym" },
  { value: "waves", label: "Swimming Pool" },
  { value: "wind", label: "Air Conditioning" },
  { value: "tv", label: "Television" },
  { value: "coffee", label: "Kitchen" },
  { value: "shield", label: "Security" },
  { value: "zap", label: "Power Backup" },
  { value: "bed", label: "Bed" },
  { value: "bath", label: "Bathroom" },
  { value: "washing-machine", label: "Laundry" },
  { value: "refrigerator", label: "Fridge" },
  { value: "armchair", label: "Furniture" },
  { value: "lock", label: "Lock" },
  { value: "camera", label: "CCTV" },
  { value: "tree-deciduous", label: "Garden" },
  { value: "users", label: "Common Area" },
  { value: "utensils", label: "Mess" },
  { value: "bus", label: "Transport" },
];

const catStyles = {
  basic: "bg-blue-50 text-blue-600 border-blue-100",
  comfort: "bg-emerald-50 text-emerald-600 border-emerald-100",
  luxury: "bg-indigo-50 text-indigo-600 border-indigo-100",
  safety: "bg-rose-50 text-rose-600 border-rose-100",
  other: "bg-slate-50 text-slate-600 border-slate-100",
};

export default function Amenities() {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingAmenity, setViewingAmenity] = useState(null);
  const [formData, setFormData] = useState({ name: "", icon: "wifi", category: "basic", description: "", status: "Active" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchAmenities(); }, []);

  const fetchAmenities = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/amenities`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) setAmenities(data.data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `${getApiUrl()}/api/amenities/${editingId}` : `${getApiUrl()}/api/amenities`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        fetchAmenities();
        closeModal();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this amenity?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/amenities/${id}`, { method: "DELETE", headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) fetchAmenities();
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setFormData({ name: item.name, icon: item.icon || "wifi", category: item.category || "basic", description: item.description || "", status: item.status });
    } else {
      setEditingId(null);
      setFormData({ name: "", icon: "wifi", category: "basic", description: "", status: "Active" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: "", icon: "wifi", category: "basic", description: "", status: "Active" });
  };

  const filteredAmenities = amenities.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing Amenity Schema...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Amenity Registry</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Infrastructure Inventory & Service Asset Governance Hub</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative group w-48">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
               <input 
                 value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="Search assets..." 
                 className="w-full bg-white border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
               />
            </div>
            <button onClick={() => openModal()} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all flex items-center gap-2">
               <Plus className="w-3.5 h-3.5" /> Define Asset
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatCardHorizontal label="Total Schema" value={amenities.length} trend="Active Assets" up icon={Layers} color="blue" />
         <StatCardHorizontal label="Basic Tier" value={amenities.filter(a => a.category === 'basic').length} trend="Core Service" up icon={Zap} color="amber" />
         <StatCardHorizontal label="Luxury Hub" value={amenities.filter(a => a.category === 'luxury').length} trend="Premium Assets" up icon={Sparkles} color="indigo" />
         <StatCardHorizontal label="Safety Pulse" value={amenities.filter(a => a.category === 'safety').length} trend="Verified SLA" up icon={Shield} color="emerald" />
      </div>

      {/* High-Density Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 pb-10">
        {filteredAmenities.map((a) => {
          const Icon = getIconComponent(a.icon);
          const style = catStyles[a.category || "basic"];
          return (
            <div key={a._id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md flex flex-col items-center group relative hover:translate-y-[-4px] transition-all duration-300 overflow-hidden">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-all group-hover:scale-105 group-hover:rotate-3", style)}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold text-slate-800 text-center truncate w-full leading-tight">{a.name}</p>
              <p className="text-[7px] font-bold text-slate-400 uppercase mt-1 tracking-widest opacity-60">{a.category || "basic"}</p>
              
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5 z-10">
                 <button onClick={() => setViewingAmenity(a)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"><Eye className="w-3.5 h-3.5" /></button>
                 <button onClick={() => openModal(a)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                 <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-100 shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          );
        })}
        <button onClick={() => openModal()} className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-slate-800 hover:bg-white hover:shadow-lg transition-all group min-h-[100px]">
           <Plus className="w-5 h-5 text-slate-300 group-hover:text-slate-800 transition-all" />
           <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-800 transition-all">Expand</p>
        </button>
      </div>

      {/* Modern Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm"><Settings2 className="w-4 h-4" /></div>
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{editingId ? "Refine Asset Architecture" : "Define Asset Intelligence"}</h3>
                 </div>
                 <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div className="space-y-4">
                    <div>
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Identity Tag</label>
                       <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" placeholder="e.g. Fiber Optical WiFi" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Icon Signature</label>
                          <select value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-[10px] font-bold outline-none cursor-pointer shadow-sm">
                             {iconOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Tier Category</label>
                          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-[10px] font-bold outline-none cursor-pointer shadow-sm">
                             <option value="basic">Basic Utility</option>
                             <option value="comfort">Comfort Plus</option>
                             <option value="luxury">Luxury Elite</option>
                             <option value="safety">Safety Hub</option>
                          </select>
                       </div>
                    </div>
                    <div>
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Deployment Notes</label>
                       <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm min-h-[80px] resize-none" placeholder="Describe asset parameters..." />
                    </div>
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-50 text-[9px] font-bold uppercase text-slate-400 hover:bg-slate-100 transition-all">Dismiss</button>
                    <button type="submit" disabled={saving} className="flex-[2] py-2.5 rounded-xl bg-slate-800 text-[9px] font-bold uppercase text-white shadow-lg shadow-slate-800/10 hover:bg-black transition-all flex items-center justify-center gap-2">
                       {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                       {editingId ? "Update Intelligence" : "Activate Asset"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Viewing Details */}
      {viewingAmenity && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm border", catStyles[viewingAmenity.category || "basic"])}>
                 {(() => { const Icon = getIconComponent(viewingAmenity.icon); return <Icon className="w-8 h-8" />; })()}
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{viewingAmenity.name}</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{viewingAmenity.category || "basic"} Tier Infrastructure</p>
              
              <div className="mt-6 w-full p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                 <p className="text-[8px] font-bold text-slate-400 uppercase mb-2 tracking-widest leading-none opacity-60">Asset Parameters</p>
                 <p className="text-xs font-bold text-slate-600 leading-relaxed">{viewingAmenity.description || "No specific deployment notes available for this infrastructure asset."}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-8">
                 <button onClick={() => { setViewingAmenity(null); openModal(viewingAmenity); }} className="py-2.5 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-blue-600 hover:shadow-sm transition-all flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase"><Edit className="w-3.5 h-3.5" /> Refine</button>
                 <button onClick={() => setViewingAmenity(null)} className="py-2.5 rounded-xl bg-slate-800 text-white shadow-lg shadow-slate-800/10 text-[9px] font-bold uppercase hover:bg-black transition-all">Dismiss</button>
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
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100", 
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
