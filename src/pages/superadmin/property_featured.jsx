import React, { useState, useEffect } from "react";
import { 
  Sparkles, TrendingUp, Eye, MousePointerClick, 
  Plus, Calendar, MoreVertical, Edit, Trash2, 
  X, Loader2, Search, Filter, RefreshCw,
  ArrowUpRight, ArrowDownRight, Layers, ChevronRight,
  Check, Info, MapPin, Globe
} from "lucide-react";

import { fetchJson, getAuthHeader } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://roohmy-backend-xwa9.vercel.app");

export default function FeaturedListings() {
  const [featured, setFeatured] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    propertyId: "", propertyTitle: "", propertyImage: "", city: "", startDate: "", endDate: "", position: 0, paymentAmount: 0, paymentStatus: "pending", notes: "", isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [listRes, propRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/featured`, { headers: getAuthHeader() }),
        fetch(`${getApiUrl()}/api/featured/available-properties`, { headers: getAuthHeader() })
      ]);
      const listData = await listRes.json();
      const propData = await propRes.json();
      if (listData.success) setFeatured(listData.data);
      if (propData.success) setProperties(propData.data);
    } catch (err) { console.error("Error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `${getApiUrl()}/api/featured/${editingId}` : `${getApiUrl()}/api/featured`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...getAuthHeader() }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) { fetchData(); closeModal(); }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this featured listing?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/featured/${id}`, { method: "DELETE", headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) { console.error(err); }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setFormData({
        propertyId: item.propertyId?._id || item.propertyId || "",
        propertyTitle: item.propertyTitle,
        propertyImage: item.propertyImage || "",
        city: item.city || "",
        startDate: item.startDate?.split("T")[0] || "",
        endDate: item.endDate?.split("T")[0] || "",
        position: item.position || 0,
        paymentAmount: item.paymentAmount || 0,
        paymentStatus: item.paymentStatus || "pending",
        notes: item.notes || "",
        isActive: item.isActive
      });
    } else {
      setEditingId(null);
      setFormData({
        propertyId: "", propertyTitle: "", propertyImage: "", city: "", startDate: "", endDate: "", position: 0, paymentAmount: 0, paymentStatus: "pending", notes: "", isActive: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const handlePropertySelect = (e) => {
    const prop = properties.find(p => p._id === e.target.value);
    if (prop) {
      setFormData({
        ...formData,
        propertyId: prop._id,
        propertyTitle: prop.title,
        propertyImage: prop.image || "",
        city: prop.city || ""
      });
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' }) : "-";
  const isExpired = (d) => d && new Date(d) < new Date();
  
  const stats = {
    activeCount: featured.filter(l => l.isActive && !isExpired(l.endDate)).length,
    totalViews: featured.reduce((sum, f) => sum + (f.views || 0), 0),
    totalClicks: featured.reduce((sum, f) => sum + (f.clicks || 0), 0),
    get conversion() { return this.totalViews > 0 ? ((this.totalClicks / this.totalViews) * 100).toFixed(2) : "0.00" }
  };

  const filteredFeatured = featured.filter(f => f.propertyTitle.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Featured Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Spotlight Hub</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Premium Inventory Optimization & Global Visibility Performance Matrix</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative group w-48">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
               <input 
                 value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="Search premiums..." 
                 className="w-full bg-white border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
               />
            </div>
            <button onClick={() => openModal()} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all flex items-center gap-2">
               <Sparkles className="w-3.5 h-3.5" /> Boost Asset
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal label="Active Spots" value={stats.activeCount} trend="+6 Monthly" up icon={Sparkles} color="indigo" />
        <StatCardHorizontal label="Spotlight Views" value={stats.totalViews.toLocaleString()} trend="+18.4% Delta" up icon={Eye} color="blue" />
        <StatCardHorizontal label="Click Yield" value={stats.totalClicks.toLocaleString()} trend="+12.6% Yield" up icon={MousePointerClick} color="emerald" />
        <StatCardHorizontal label="Conversion Index" value={`${stats.conversion}%`} trend="+0.8% Alpha" up icon={TrendingUp} color="amber" />
      </div>

      {/* Featured Ledger */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Visibility Registry</h3>
            <div className="flex items-center gap-3">
               <button className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
                  <Filter className="w-3.5 h-3.5" />
               </button>
               <button className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
                  <RefreshCw className="w-3.5 h-3.5" />
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                     <th className="pb-4">Asset Identity Hub</th>
                     <th className="pb-4 text-center">Engagement Pulse</th>
                     <th className="pb-4">Temporal Cycle</th>
                     <th className="pb-4">Visibility Status</th>
                     <th className="pb-4 text-right">Audit Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredFeatured.map((f, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                       <td className="py-3">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 shrink-0 transition-transform group-hover:scale-105">
                                <img src={f.propertyImage || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=40"} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[200px]">{f.propertyTitle}</p>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">{f.city} • ID-{String(f._id || "").slice(-4)}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-3 text-center">
                          <div className="inline-flex items-center gap-4">
                             <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-800 leading-none">{f.views || 0}</p>
                                <p className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Views</p>
                             </div>
                             <div className="text-center">
                                <p className="text-[10px] font-bold text-blue-600 leading-none">{f.clicks || 0}</p>
                                <p className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Clicks</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-3">
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 leading-none">
                             <Calendar className="w-3 h-3 text-slate-300" />
                             {formatDate(f.startDate)} — {formatDate(f.endDate)}
                          </div>
                       </td>
                       <td className="py-3">
                          <span className={cn(
                             "text-[7px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm",
                             isExpired(f.endDate) ? "bg-rose-50 text-rose-600 border-rose-100" : (f.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100")
                          )}>
                             {isExpired(f.endDate) ? "Cycle Expired" : (f.isActive ? "Live Pulse" : "Inactive Spot")}
                          </span>
                       </td>
                       <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                             <button onClick={() => openModal(f)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                             <button onClick={() => handleDelete(f._id)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-100 shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modern Boost Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm"><Sparkles className="w-4 h-4" /></div>
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{editingId ? "Refine Spotlight" : "Activate Asset Boost"}</h3>
                 </div>
                 <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Target Inventory</label>
                    <select value={formData.propertyId} onChange={handlePropertySelect} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm cursor-pointer" required>
                       <option value="">Select inventory asset...</option>
                       {properties.map(p => <option key={p._id} value={p._id}>{p.title} • {p.city}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Start Cycle</label>
                       <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" required />
                    </div>
                    <div>
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">End Cycle</label>
                       <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" required />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Rank Position</label>
                       <input type="number" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" placeholder="0" />
                    </div>
                    <div>
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Fiscal Yield (Rs.)</label>
                       <input type="number" value={formData.paymentAmount} onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" placeholder="0.00" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Settlement Status</label>
                    <select value={formData.paymentStatus} onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-[10px] font-bold outline-none cursor-pointer shadow-sm">
                       <option value="pending">Awaiting Pulse</option>
                       <option value="paid">Verified Paid</option>
                       <option value="expired">Expired Spot</option>
                       <option value="cancelled">Cancelled</option>
                    </select>
                 </div>
                 <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white transition-all shadow-sm">
                       <div className={cn("w-4 h-4 rounded border transition-all flex items-center justify-center", formData.isActive ? "bg-blue-600 border-blue-600" : "bg-white border-slate-200")}>
                          {formData.isActive && <Check className="w-3 h-3 text-white" />}
                       </div>
                       <input type="checkbox" className="hidden" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                       <span className={cn("text-[10px] font-bold uppercase tracking-widest leading-none", formData.isActive ? "text-blue-600" : "text-slate-500")}>Activate Spot Pulse</span>
                    </label>
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-50 text-[9px] font-bold uppercase text-slate-400 hover:bg-slate-100 transition-all">Dismiss</button>
                    <button type="submit" disabled={saving} className="flex-[2] py-2.5 rounded-xl bg-slate-800 text-[9px] font-bold uppercase text-white shadow-lg shadow-slate-800/10 hover:bg-black transition-all flex items-center justify-center gap-2">
                       {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                       {editingId ? "Update Intelligence" : "Activate Boost"}
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
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100", 
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
