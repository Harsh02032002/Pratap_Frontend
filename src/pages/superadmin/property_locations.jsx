import React, { useState, useEffect } from "react";
import { 
  MapPin, Plus, Edit, Trash2, TrendingUp, X, Loader2,
  Globe, Search, ChevronRight, LayoutGrid, Building2,
  RefreshCw, Map, Sparkles, Navigation, ArrowUpRight,
  ArrowDownRight, Layers, Activity
} from "lucide-react";

import { fetchJson, getAuthHeader } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://roohmy-backend-xwa9.vercel.app");

const colorStyles = [
  "bg-blue-600 shadow-blue-50",
  "bg-emerald-600 shadow-emerald-50",
  "bg-indigo-600 shadow-indigo-50",
  "bg-amber-600 shadow-amber-50",
  "bg-rose-600 shadow-rose-50",
  "bg-purple-600 shadow-purple-50",
];

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", state: "", country: "India", propertyCount: 0, description: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/locations/cities`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) setLocations(data.data);
    } catch (err) { console.error("Error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `${getApiUrl()}/api/locations/cities/${editingId}` : `${getApiUrl()}/api/locations/cities`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...getAuthHeader() }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) { fetchLocations(); closeModal(); }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this location?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/locations/cities/${id}`, { method: "DELETE", headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) fetchLocations();
    } catch (err) { console.error(err); }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setFormData({ name: item.name, state: item.state || "", country: item.country || "India", propertyCount: item.propertyCount || 0, description: item.description || "" });
    } else {
      setEditingId(null);
      setFormData({ name: "", state: "", country: "India", propertyCount: 0, description: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const filteredLocations = locations.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Cities & Locations...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Location Wise Data</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">View active cities, states, and property distribution across locations.</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative group w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
               <input 
                 value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="Search cities, states..." 
                 className="w-full bg-white border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
               />
            </div>
            <button onClick={() => openModal()} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all flex items-center gap-2">
               <MapPin className="w-3.5 h-3.5" /> Add City / Location
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal label="Active Cities" value={locations.length} trend="Active Cities" up icon={Map} color="blue" />
        <StatCardHorizontal label="States Covered" value={new Set(locations.map(l => l.state)).size} trend="States" up icon={Globe} color="emerald" />
        <StatCardHorizontal label="Avg Properties / City" value={Math.round(locations.reduce((s, l) => s + (l.propertyCount || 0), 0) / (locations.length || 1))} trend="Average" up icon={Building2} color="indigo" />
        <StatCardHorizontal label="Total Properties" value={locations.reduce((s, l) => s + (l.propertyCount || 0), 0)} trend="Live Properties" up icon={Activity} color="amber" />
      </div>

      {/* Territory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-10">
        {filteredLocations.map((l, idx) => (
          <div key={l._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md flex flex-col group relative hover:translate-y-[-4px] transition-all duration-300">
            <div className="flex items-start justify-between mb-5">
               <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 group-hover:rotate-3", colorStyles[idx % colorStyles.length])}>
                  <MapPin className="w-5 h-5" />
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openModal(l)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(l._id)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-100 shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
               </div>
            </div>
            
            <div className="space-y-0.5">
               <h3 className="text-[13px] font-bold text-slate-800 tracking-tight leading-tight truncate">{l.name}</h3>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate leading-none mt-0.5">{l.state}, {l.country}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex items-end justify-between">
               <div>
                  <p className="text-xl font-black text-slate-900 tracking-tight leading-none">{l.propertyCount || 0}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider leading-none">Properties</p>
               </div>
               <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-100 text-[8px] font-bold uppercase shadow-sm">
                  <TrendingUp className="w-2.5 h-2.5" />
                  Active
               </div>
            </div>
          </div>
        ))}
        <button onClick={() => openModal()} className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-slate-800 hover:bg-white hover:shadow-lg transition-all group min-h-[160px]">
           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-sm">
              <Plus className="w-5 h-5" />
           </div>
           <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider leading-none">Add New City</p>
              <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-tight font-semibold">Add Location</p>
           </div>
        </button>
      </div>

      {/* Modern Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm"><Navigation className="w-4 h-4" /></div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{editingId ? "Edit City Details" : "Add New City"}</h3>
                 </div>
                 <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider leading-none pl-1">City Name</label>
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" placeholder="e.g. Jaipur" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider leading-none pl-1">State</label>
                       <input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" placeholder="e.g. Rajasthan" required />
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider leading-none pl-1">Country</label>
                       <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider leading-none pl-1">Total Properties</label>
                    <input type="number" value={formData.propertyCount} onChange={e => setFormData({...formData, propertyCount: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-50 text-xs font-bold capitalize text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-[2] py-2.5 rounded-xl bg-slate-800 text-xs font-bold uppercase text-white shadow-lg shadow-slate-800/10 hover:bg-black transition-all flex items-center justify-center gap-2">
                       {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                       {editingId ? "Save Changes" : "Add City"}
                    </button>
                 </div>
              </form>
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
