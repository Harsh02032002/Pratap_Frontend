import React, { useState, useEffect } from "react";
import { 
  Users, Search, MapPin, Hourglass,
  Check, X, RefreshCw, AlertCircle,
  IndianRupee, Inbox
} from "lucide-react";

import { getAuthHeader } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001" : "https://roohmy-backend-xwa9.vercel.app");

export default function PendingProperties() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProperty, setSelectedProperty] = useState(null);

  const fetchPendingProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiUrl()}/api/properties?hasVisitReport=true&t=${Date.now()}`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success && data.properties) {
        const pending = data.properties.filter(p => Boolean(p.visitId && String(p.visitId).trim()) && (!p.isPublished || p.status !== 'active'));
        setQueue(pending.map(p => ({
          id: p._id,
          displayId: p.visitId || p.locationCode || p._id.slice(-6).toUpperCase(),
          title: p.title || p.propertyInfo?.name || p.propertyName || "Unknown Property",
          owner: p.owner?.name || p.ownerName || p.propertyInfo?.ownerName || "Unknown Owner",
          type: p.propertyType || "Property",
          submitted: new Date(p.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }),
          status: p.status === "pending_review" ? "Priority Review" : "Awaiting Approval",
          initial: (p.owner?.name || p.ownerName || "U")[0].toUpperCase(),
          color: ["blue", "indigo", "amber", "rose", "emerald"][Math.floor(Math.random() * 5)],
          raw: p
        })));
      }
    } catch (err) {
      console.error("Error fetching pending properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProperties();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/properties/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setQueue(queue.filter(q => q.id !== id));
      } else {
        alert("Failed to approve property.");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving property.");
    }
  };

  const filteredQueue = queue.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      q.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Pending Properties</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Review and approve new property listings submitted by owners</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchPendingProperties} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer flex items-center gap-2">
            <RefreshCw className={cn("w-3.5 h-3.5 text-[#4A5961]", loading && "animate-spin")} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Stat Cards (NO ICONS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardHorizontal label="Pending Approval" value={queue.length} />
        <StatCardHorizontal label="High Priority" value={queue.filter(q => q.status === "Priority Review").length} />
        <StatCardHorizontal label="Sync Ready" value={queue.length} />
        <StatCardHorizontal label="SLA Status" value="Healthy" />
      </div>

      {/* Search & Filter Row (Outside & Above the Table Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Search properties or owners..." 
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">Status ▾</option>
            <option value="Awaiting Approval">Awaiting Approval</option>
            <option value="Priority Review">Priority Review</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Property & Owner</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Submitted</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Status</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-[13px] text-[#4A5961]">
                    Loading pending properties...
                  </td>
                </tr>
              ) : filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-[13px] text-[#4A5961]">
                    No pending properties in queue.
                  </td>
                </tr>
              ) : filteredQueue.map((q, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5 pl-2 pr-4 font-medium text-[#10242A]">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#D9E1E7] flex items-center justify-center font-bold text-[11px] text-[#4A5961] shrink-0">
                        {q.initial}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-[#10242A] text-[13px] block truncate max-w-[260px]">{q.title}</span>
                        <span className="text-[12px] text-[#4A5961] block truncate">{q.raw.city || "Indore"} • {q.owner}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-center text-[#4A5961] text-[13px]">
                    {q.submitted}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={cn(
                      "text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center",
                      q.status === "Priority Review" ? "bg-[#FDE8E8] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                    )}>
                      {q.status}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 pr-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleApprove(q.id)} className="bg-[#0E7C86] hover:bg-[#0B666E] text-white text-[11px] font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => setSelectedProperty(q)} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[11px] font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer">
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm", selectedProperty.color === "blue" ? "bg-blue-600 shadow-blue-50" : selectedProperty.color === "indigo" ? "bg-indigo-600 shadow-indigo-50" : selectedProperty.color === "emerald" ? "bg-emerald-600 shadow-emerald-50" : selectedProperty.color === "amber" ? "bg-amber-600 shadow-amber-50" : selectedProperty.color === "rose" ? "bg-rose-600 shadow-rose-50" : "bg-slate-600 shadow-slate-50")}>
                  {selectedProperty.initial}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight">{selectedProperty.title}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedProperty.type} • {selectedProperty.owner}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProperty(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Locality" value={selectedProperty.raw.locality || selectedProperty.raw.city || "Unknown"} icon={MapPin} />
                <DataField label="Monthly Rent" value={selectedProperty.raw.rent || selectedProperty.raw.monthlyRent || "0"} icon={IndianRupee} isPrice />
                <DataField label="Gender" value={selectedProperty.raw.gender || "Any"} icon={Users} />
                <DataField label="Status" value={selectedProperty.status} icon={Hourglass} />
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Property Description</h4>
                <div className="bg-slate-50 rounded-2xl p-4 text-[13px] text-slate-600 font-medium leading-relaxed border border-slate-100">
                  {selectedProperty.raw.description || "No description provided by the owner."}
                </div>
              </div>

              {selectedProperty.raw.images && selectedProperty.raw.images.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Media Gallery ({selectedProperty.raw.images.length})</h4>
                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x custom-scrollbar">
                    {selectedProperty.raw.images.map((img, i) => (
                      <img key={i} src={img} className="w-32 h-32 object-cover rounded-2xl snap-center shrink-0 border border-slate-100 shadow-sm" alt="view" />
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl border border-amber-100 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1">Pre-Approval Warning</p>
                  <p className="text-[11px] font-medium opacity-80">Please ensure all images and descriptions comply with Roomhy guidelines. Approving will publish this listing immediately.</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3">
              <button onClick={() => setSelectedProperty(null)} className="px-6 py-2.5 rounded-2xl text-[10px] font-bold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest">
                Cancel
              </button>
              <button onClick={() => { handleApprove(selectedProperty.id); setSelectedProperty(null); }} className="flex items-center gap-2 px-8 py-2.5 rounded-2xl text-[10px] font-bold text-white bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest">
                <Check className="w-4 h-4" /> Approve Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataField({ label, value, icon: Icon, isPrice }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={cn("text-xs font-bold text-slate-800", isPrice && "text-emerald-600")}>
          {isPrice && "₹"}{value}
        </p>
      </div>
    </div>
  );
}

function StatCardHorizontal({ label, value }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
      <div className="mt-2">
        <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  );
}
