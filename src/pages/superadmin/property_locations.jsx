import React, { useState, useEffect } from "react";
import { 
  MapPin, Plus, Edit, Trash2, TrendingUp, X, Loader2,
  Search, Navigation
} from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";

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
  const [stateFilter, setStateFilter] = useState("all");

  useEffect(() => { fetchLocations(); }, []);

  const isEmployeeView = typeof window !== "undefined" && window.location.pathname.startsWith("/employee");

  const fetchLocations = async () => {
    try {
      setLoading(true);
      if (isEmployeeView) {
        const propRes = await fetchJson("/api/properties");
        const props = propRes?.properties || propRes?.data || (Array.isArray(propRes) ? propRes : []);
        const cityMap = {};
        props.forEach(p => {
          const cityName = String(p.city || p.location?.city || "").trim();
          if (!cityName) return;
          const key = cityName.toLowerCase();
          if (!cityMap[key]) {
            cityMap[key] = {
              _id: key,
              name: cityName,
              state: p.state || p.location?.state || "India",
              country: "India",
              propertyCount: 0,
              status: "Active"
            };
          }
          cityMap[key].propertyCount += 1;
        });
        setLocations(Object.values(cityMap));
      } else {
        const res = await fetch(`${getApiUrl()}/api/locations/cities`, { headers: getAuthHeader() });
        const data = await res.json();
        if (data.success) setLocations(data.data || []);
      }
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

  const statesList = Array.from(new Set(locations.map(l => l.state).filter(Boolean))).sort();

  const filteredLocations = locations.filter(l => {
    const matchSearch = (l.name || "").toLowerCase().includes(search.toLowerCase()) || (l.state || "").toLowerCase().includes(search.toLowerCase());
    const matchState = stateFilter === "all" || l.state === stateFilter;
    return matchSearch && matchState;
  });

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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Location Wise Data</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Active cities, states, and property distribution matrix across operational zones.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-[#0E7C86] hover:bg-[#0B656D] text-white px-4 py-1.5 rounded-[8px] text-[13px] font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
           <Plus className="w-4 h-4" />
           <span>Add City / Location</span>
        </button>
      </div>

      {/* Metrics Row (No Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Active Cities</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{locations.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">States Covered</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{uniqueStates}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Avg Props / City</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{avgProps}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Live Properties</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{totalProps}</h3>
          </div>
        </div>
      </div>

      {/* Outside Search & Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search cities, states..." 
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
          />
        </div>
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
        >
          <option value="all">All States</option>
          {statesList.map(st => <option key={st} value={st}>{st}</option>)}
        </select>
      </div>

      {/* Locations Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">City</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">State</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Country</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Properties</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Status</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[13px] text-[#4A5961]">No locations found.</td>
                </tr>
              ) : filteredLocations.map((l) => (
                <tr key={l._id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5 pl-2 font-semibold text-[#10242A]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0E7C86] shrink-0" />
                      <span>{l.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-[#4A5961]">{l.state}</td>
                  <td className="py-2.5 text-[#4A5961]">{l.country}</td>
                  <td className="py-2.5 text-center font-semibold text-[#10242A]">{l.propertyCount || 0}</td>
                  <td className="py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 text-[11px] font-semibold">
                      <TrendingUp className="w-3 h-3" /> Active
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openModal(l)} className="p-1.5 rounded-[8px] bg-[#F4F6F8] text-[#4A5961] hover:text-[#0E7C86] hover:bg-[#E6F4F5] transition-all border border-[#E1E6EA] cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(l._id)} className="p-1.5 rounded-[8px] bg-[#F4F6F8] text-[#4A5961] hover:text-rose-600 hover:bg-rose-50 transition-all border border-[#E1E6EA] cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
