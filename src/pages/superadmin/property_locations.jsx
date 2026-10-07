import React, { useState, useEffect } from "react";
import { 
  MapPin, Plus, Edit, Trash2, TrendingUp, X, Loader2,
  Globe, Search, Building2, RefreshCw, Activity, Navigation
} from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://roohmy-backend-xwa9.vercel.app");

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
      setLoading(true);
      const res = await fetch(`${getApiUrl()}/api/locations/cities`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) setLocations(data.data || []);
    } catch (err) { 
      console.error("Error fetching locations:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `${getApiUrl()}/api/locations/cities/${editingId}` : `${getApiUrl()}/api/locations/cities`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { 
        method, 
        headers: { "Content-Type": "application/json", ...getAuthHeader() }, 
        body: JSON.stringify(formData) 
      });
      const data = await res.json();
      if (data.success) { fetchLocations(); closeModal(); }
    } catch (err) { 
      console.error("Error saving location:", err); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/locations/cities/${id}`, { method: "DELETE", headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) fetchLocations();
    } catch (err) { 
      console.error("Error deleting location:", err); 
    }
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

  const filteredLocations = locations.filter(l => (l.name || "").toLowerCase().includes(search.toLowerCase()) || (l.state || "").toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="p-12 space-y-6 flex flex-col items-center justify-center py-40 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-12 h-12 border-4 border-[#0E7C86]/20 border-t-[#0E7C86] rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#4A5961] uppercase tracking-wider">Accessing Location Wise Intelligence...</p>
      </div>
    );
  }

  const totalProps = locations.reduce((s, l) => s + (l.propertyCount || 0), 0);
  const uniqueStates = new Set(locations.map(l => l.state)).size;
  const avgProps = locations.length > 0 ? Math.round(totalProps / locations.length) : 0;

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <PageHeader 
        title="Location Wise Data"
        subtitle="Active cities, states, and property distribution matrix across operational zones."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative group w-64">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5961]" />
               <input 
                 value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="Search cities, states..." 
                 className="w-full bg-white border border-[#E1E6EA] rounded-[12px] py-2 pl-10 pr-4 text-xs font-medium text-[#10242A] shadow-xs outline-none focus:border-[#0E7C86] transition-all placeholder:text-[#4A5961]" 
               />
            </div>
            <button 
              onClick={() => openModal()} 
              className="bg-[#0E7C86] hover:bg-[#0B656D] text-white px-4 py-2 rounded-[12px] text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
               <Plus className="w-4 h-4" />
               <span>Add City / Location</span>
            </button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
            <MapPin size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Active Cities</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{locations.length}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Globe size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">States Covered</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{uniqueStates}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Avg Props / City</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{avgProps}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Total Live Properties</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{totalProps}</h4>
          </div>
        </div>
      </div>

      {/* Territory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredLocations.map((l, idx) => (
          <div key={l._id} className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs flex flex-col group relative hover:border-[#0E7C86] transition-all">
            <div className="flex items-start justify-between mb-4">
               <div className="w-10 h-10 rounded-[10px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
               </div>
               <div className="flex gap-1">
                  <button onClick={() => openModal(l)} className="p-1.5 rounded-[8px] bg-[#F4F6F8] text-[#4A5961] hover:text-[#0E7C86] hover:bg-[#E6F4F5] transition-all border border-[#E1E6EA] cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(l._id)} className="p-1.5 rounded-[8px] bg-[#F4F6F8] text-[#4A5961] hover:text-rose-600 hover:bg-rose-50 transition-all border border-[#E1E6EA] cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
               </div>
            </div>
            
            <div className="space-y-0.5">
               <h3 className="text-sm font-bold text-[#10242A] tracking-tight leading-tight truncate">{l.name}</h3>
               <p className="text-[11px] font-semibold text-[#4A5961] mt-0.5 truncate">{l.state}, {l.country}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E1E6EA] flex items-end justify-between">
               <div>
                  <p className="text-lg font-bold text-[#10242A] leading-none">{l.propertyCount || 0}</p>
                  <p className="text-[10px] font-semibold text-[#4A5961] uppercase mt-1">Properties</p>
               </div>
               <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-100 text-[10px] font-bold">
                  <TrendingUp className="w-3 h-3" />
                  Active
               </div>
            </div>
          </div>
        ))}
        <button 
          onClick={() => openModal()} 
          className="bg-[#F4F6F8] border-2 border-dashed border-[#E1E6EA] rounded-[16px] p-5 flex flex-col items-center justify-center gap-2 hover:border-[#0E7C86] hover:bg-white transition-all group min-h-[150px] cursor-pointer"
        >
           <div className="w-9 h-9 rounded-[10px] bg-white border border-[#E1E6EA] flex items-center justify-center text-[#4A5961] group-hover:bg-[#0E7C86] group-hover:text-white group-hover:border-[#0E7C86] transition-all">
              <Plus className="w-5 h-5" />
           </div>
           <div className="text-center">
              <p className="text-xs font-bold text-[#10242A]">Add New City</p>
              <p className="text-[11px] font-semibold text-[#4A5961] mt-0.5">Expand territory</p>
           </div>
        </button>
      </div>

      {/* Add / Edit Location Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#10242A]/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[20px] w-full max-w-md border border-[#E1E6EA] shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E1E6EA] flex items-center justify-between bg-white shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center border border-[#0E7C86]/20">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-[#10242A] uppercase tracking-wider">{editingId ? "Edit City Details" : "Add New City"}</h3>
                 </div>
                 <button onClick={closeModal} className="p-1.5 rounded-[8px] hover:bg-[#F4F6F8] text-[#4A5961] transition-all cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div>
                    <label className="block text-[11px] font-semibold text-[#4A5961] uppercase mb-1.5 tracking-wider">City Name</label>
                    <input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] py-2.5 px-3.5 text-xs font-semibold text-[#10242A] outline-none focus:border-[#0E7C86] focus:bg-white transition-all" 
                      placeholder="e.g. Jaipur" 
                      required 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[11px] font-semibold text-[#4A5961] uppercase mb-1.5 tracking-wider">State</label>
                       <input 
                         value={formData.state} 
                         onChange={e => setFormData({...formData, state: e.target.value})} 
                         className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] py-2.5 px-3.5 text-xs font-semibold text-[#10242A] outline-none focus:border-[#0E7C86] focus:bg-white transition-all" 
                         placeholder="e.g. Rajasthan" 
                         required 
                       />
                    </div>
                    <div>
                       <label className="block text-[11px] font-semibold text-[#4A5961] uppercase mb-1.5 tracking-wider">Country</label>
                       <input 
                         value={formData.country} 
                         onChange={e => setFormData({...formData, country: e.target.value})} 
                         className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] py-2.5 px-3.5 text-xs font-semibold text-[#10242A] outline-none focus:border-[#0E7C86] focus:bg-white transition-all" 
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[11px] font-semibold text-[#4A5961] uppercase mb-1.5 tracking-wider">Total Properties</label>
                    <input 
                      type="number" 
                      value={formData.propertyCount} 
                      onChange={e => setFormData({...formData, propertyCount: e.target.value})} 
                      className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] py-2.5 px-3.5 text-xs font-semibold text-[#10242A] outline-none focus:border-[#0E7C86] focus:bg-white transition-all" 
                    />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-[10px] bg-[#F4F6F8] text-xs font-bold text-[#4A5961] hover:bg-[#E1E6EA] transition-all cursor-pointer">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-[2] py-2.5 rounded-[10px] bg-[#0E7C86] hover:bg-[#0B656D] text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
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
