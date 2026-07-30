import React, { useState, useEffect } from "react";
import { 
  Check, Plus, Star, Edit, Trash2, X, Loader2, Eye,
  Search, Filter, ChevronRight, LayoutGrid, 
  Activity, Zap, Shield, Home, Building2,
  RefreshCw, Download, Settings2, Sparkles,
  CreditCard, Wallet, BarChart3, Globe,
  ShieldCheck, Smartphone, Monitor, Info,
  ArrowUpRight, ArrowDownRight, Layers
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
];

export default function PricingPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", billingCycle: "monthly", features: [], maxProperties: 1, maxPhotos: 10,
    prioritySupport: false, analytics: false, customBranding: false, isPopular: false, status: "Active"
  });
  const [featureInput, setFeatureInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/pricing`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) setPlans(data.data);
    } catch (err) { console.error("Error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, price: Number(formData.price), maxProperties: Number(formData.maxProperties), maxPhotos: Number(formData.maxPhotos) };
      const url = editingId ? `${getApiUrl()}/api/pricing/${editingId}` : `${getApiUrl()}/api/pricing`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...getAuthHeader() }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { fetchPlans(); closeModal(); }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this pricing plan?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/pricing/${id}`, { method: "DELETE", headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) fetchPlans();
    } catch (err) { console.error(err); }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setFormData({
        name: item.name, description: item.description || "", price: item.price, billingCycle: item.billingCycle || "monthly",
        features: item.features || [], maxProperties: item.maxProperties || 1, maxPhotos: item.maxPhotos || 10,
        prioritySupport: item.prioritySupport || false, analytics: item.analytics || false, customBranding: item.customBranding || false,
        isPopular: item.isPopular || false, status: item.status || "Active"
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "", description: "", price: "", billingCycle: "monthly", features: [], maxProperties: 1, maxPhotos: 10,
        prioritySupport: false, analytics: false, customBranding: false, isPopular: false, status: "Active"
      });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); setFeatureInput(""); };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({ ...formData, features: [...formData.features, featureInput.trim()] });
      setFeatureInput("");
    }
  };

  const removeFeature = (idx) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== idx) });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing Revenue Schema...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Commercial Hub</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Platform Revenue Architecture & Dynamic Pricing Model Governance</p>
         </div>
         <div className="flex items-center gap-3">
            <button onClick={() => openModal()} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all flex items-center gap-2">
               <Plus className="w-3.5 h-3.5" /> Define Tier
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal label="Pricing Tiers" value={plans.length} trend="Active Schema" up icon={Layers} color="blue" />
        <StatCardHorizontal label="Avg Plan Value" value={`₹${Math.round(plans.reduce((s, p) => s + p.price, 0) / (plans.length || 1))}`} trend="Yield Index" up icon={Wallet} color="emerald" />
        <StatCardHorizontal label="Premium Adoption" value={`${plans.filter(p => p.price > 1000).length} Segments`} trend="Market Share" up icon={Sparkles} color="indigo" />
        <StatCardHorizontal label="Revenue Pulse" value="Live" trend="+14% Alpha" up icon={Activity} color="amber" />
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
        {plans.map((p, idx) => (
          <div key={p._id} className={cn(
            "bg-white rounded-2xl p-5 border shadow-md group hover:translate-y-[-4px] transition-all duration-300 flex flex-col relative overflow-hidden",
            p.isPopular ? "border-blue-600 ring-2 ring-blue-50" : "border-slate-100"
          )}>
            {p.isPopular && (
              <div className="absolute top-0 right-0 z-10">
                 <div className="bg-blue-600 text-white text-[7px] font-bold uppercase py-1 px-8 rotate-45 translate-x-8 translate-y-1 shadow-sm">Popular</div>
              </div>
            )}

            <div className="mb-6 relative z-0">
               <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3", colorStyles[idx % colorStyles.length])}>
                  <Zap className="w-5 h-5" />
               </div>
               <h3 className="text-[13px] font-bold text-slate-800 tracking-tight leading-none truncate">{p.name}</h3>
               <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest opacity-60">Revenue Tier {idx + 1}</p>
            </div>

            <div className="mb-6">
               <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-800 tracking-tight leading-none">₹{p.price}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest opacity-60">/{p.billingCycle}</span>
               </div>
               <p className="text-[9px] font-bold text-slate-500 mt-2 leading-relaxed line-clamp-2 min-h-[2.25rem]">{p.description || "Comprehensive platform access protocols for optimized deployment."}</p>
            </div>

            <div className="space-y-3 mb-8 flex-1">
               <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 leading-none">Entitlements Matrix</p>
               <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[9px] font-bold text-slate-700">
                     <div className="w-4 h-4 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><Check className="w-2.5 h-2.5" /></div>
                     {p.maxProperties} Asset Slots
                  </li>
                  <li className="flex items-center gap-2 text-[9px] font-bold text-slate-700">
                     <div className="w-4 h-4 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><Check className="w-2.5 h-2.5" /></div>
                     {p.maxPhotos} Media Capacity
                  </li>
                  {(p.features || []).slice(0, 2).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-[9px] font-bold text-slate-700 truncate">
                       <div className="w-4 h-4 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><Check className="w-2.5 h-2.5" /></div>
                       {f}
                    </li>
                  ))}
               </ul>
            </div>

            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50">
               <button onClick={() => setViewingPlan(p)} className="flex-1 p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm flex items-center justify-center gap-1.5 text-[8px] font-bold uppercase tracking-widest"><Eye className="w-3.5 h-3.5" /> View</button>
               <div className="flex gap-1.5">
                  <button onClick={() => openModal(p)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 shadow-sm flex items-center justify-center"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(p._id)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-100 shadow-sm flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
               </div>
            </div>
          </div>
        ))}
        <button onClick={() => openModal()} className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-slate-800 hover:bg-white hover:shadow-lg transition-all group min-h-[250px]">
           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-sm">
              <Plus className="w-5 h-5" />
           </div>
           <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest leading-none">Architect Tier</p>
              <p className="text-[7px] text-slate-400 mt-1 uppercase tracking-tighter opacity-60">Expand Revenue Grid</p>
           </div>
        </button>
      </div>

      {/* Modern Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm"><Sparkles className="w-4 h-4" /></div>
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{editingId ? "Refine Tier Intelligence" : "Define Tier Architecture"}</h3>
                 </div>
                 <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Plan Identity</label>
                       <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" placeholder="e.g. Enterprise Elite" required />
                    </div>
                    <div>
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Fiscal Stake (INR)</label>
                       <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" placeholder="0.00" required />
                    </div>
                    <div>
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Settlement Cycle</label>
                       <select value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-[10px] font-bold outline-none cursor-pointer shadow-sm">
                          <option value="monthly">Monthly Cycle</option>
                          <option value="quarterly">Quarterly Pulse</option>
                          <option value="yearly">Yearly Settlement</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Asset Capacity</label>
                       <input type="number" value={formData.maxProperties} onChange={e => setFormData({...formData, maxProperties: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
                    </div>
                    <div>
                       <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest leading-none pl-1">Media Slots</label>
                       <input type="number" value={formData.maxPhotos} onChange={e => setFormData({...formData, maxPhotos: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none pl-1">Entitlements Matrix</label>
                    <div className="flex gap-2">
                       <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyPress={e => e.key === "Enter" && (e.preventDefault(), addFeature())} className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" placeholder="Define entitlement..." />
                       <button type="button" onClick={addFeature} className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center hover:bg-black transition-all shadow-sm"><Plus className="w-5 h-5" /></button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                       {formData.features.map((f, i) => (
                         <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-bold uppercase flex items-center gap-1.5 border border-blue-100 shadow-sm animate-in zoom-in-50">
                           {f} <button type="button" onClick={() => removeFeature(i)} className="hover:text-rose-600 transition-colors"><X className="w-2.5 h-2.5" /></button>
                         </span>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 pb-2">
                    <ToggleCard label="Priority Hub" checked={formData.prioritySupport} onChange={e => setFormData({...formData, prioritySupport: e.target.checked})} />
                    <ToggleCard label="Market Popular" checked={formData.isPopular} onChange={e => setFormData({...formData, isPopular: e.target.checked})} />
                 </div>

                 <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2">
                    <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-50 text-[9px] font-bold uppercase text-slate-400 hover:bg-slate-100 transition-all">Dismiss</button>
                    <button type="submit" disabled={saving} className="flex-[2] py-2.5 rounded-xl bg-slate-800 text-[9px] font-bold uppercase text-white shadow-lg shadow-slate-800/10 hover:bg-black transition-all flex items-center justify-center gap-2">
                       {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                       {editingId ? "Update Intelligence" : "Activate Tier"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Viewing Details */}
      {viewingPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg text-white transition-all", colorStyles[0])}>
                 <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{viewingPlan.name}</h3>
              <p className="text-4xl font-bold text-slate-800 tracking-tighter mt-4 leading-none">₹{viewingPlan.price}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2 leading-none opacity-60">{viewingPlan.billingCycle} Cycle</p>
              
              <div className="mt-8 w-full grid grid-cols-2 gap-3">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-1 shadow-inner">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <p className="text-xl font-bold text-slate-800 leading-none">{viewingPlan.maxProperties}</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">Asset Slots</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-1 shadow-inner">
                    <Monitor className="w-5 h-5 text-indigo-600" />
                    <p className="text-xl font-bold text-slate-800 leading-none">{viewingPlan.maxPhotos}</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">Media Slots</p>
                 </div>
              </div>

              <div className="w-full mt-8 space-y-3">
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none opacity-60">Entitlements Matrix</p>
                 <div className="flex flex-wrap justify-center gap-1.5">
                    {viewingPlan.features.map((f, i) => (
                      <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-bold uppercase border border-emerald-100 flex items-center gap-1 shadow-sm">
                         <Check className="w-2.5 h-2.5" /> {f}
                      </span>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-10">
                 <button onClick={() => { setViewingPlan(null); openModal(viewingPlan); }} className="py-3 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-blue-600 hover:shadow-sm transition-all flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest"><Edit className="w-3.5 h-3.5" /> Refine</button>
                 <button onClick={() => setViewingPlan(null)} className="py-3 rounded-xl bg-slate-800 text-white shadow-lg shadow-slate-800/10 text-[9px] font-bold uppercase hover:bg-black transition-all">Dismiss</button>
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

function ToggleCard({ label, checked, onChange }) {
  return (
    <label className={cn(
      "flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm",
      checked ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100 hover:bg-white"
    )}>
       <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-0" />
       <span className={cn("text-[10px] font-bold uppercase tracking-widest leading-none", checked ? "text-blue-600" : "text-slate-500")}>{label}</span>
    </label>
  );
}
