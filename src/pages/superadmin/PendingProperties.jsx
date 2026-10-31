import React, { useState, useEffect } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Hourglass,
  Check, X, Eye, ShieldCheck, ClipboardCheck,
  RefreshCw, AlertCircle, Sparkles, Layers,
  Box, Globe2, IndianRupee, Inbox
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
  const [selectedProperty, setSelectedProperty] = useState(null);

  const fetchPendingProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiUrl()}/api/properties?hasVisitReport=true&t=${Date.now()}`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success && data.properties) {
        // Filter for properties that are NOT published OR NOT active
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

  const filteredQueue = queue.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Properties</h1>
            <p className="text-sm text-slate-500 mt-0.5">Review and approve new property listings submitted by owners</p>
         </div>
         <div className="flex items-center gap-3">
            <button onClick={fetchPendingProperties} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-50 shadow-2xs transition-all cursor-pointer">
               <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", loading && "animate-spin")} /> Refresh Queue
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal label="Pending Approval" value={queue.length} trend="Awaiting Action" up icon={Hourglass} color="amber" />
        <StatCardHorizontal label="High Priority" value={queue.filter(q => q.status === "Priority Review").length} trend="Review First" up icon={Zap} color="rose" />
        <StatCardHorizontal label="Sync Ready" value={queue.length} trend="Auto-Live Enabled" up icon={Globe} color="blue" />
        <StatCardHorizontal label="SLA Status" value="Healthy" trend="Under 4h" up icon={ShieldCheck} color="indigo" />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm">
         <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <div className="relative flex-1 w-full">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5961]" />
               <input 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)} 
                 placeholder="Search properties or owners..." 
                 className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] pl-10 pr-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]" 
               />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-[#E1E6EA]">
                     <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Property & Owner</th>
                     <th className="text-xs font-semibold text-[#4A5961] py-3 px-4 text-center">Submitted</th>
                     <th className="text-xs font-semibold text-[#4A5961] py-3 px-4 text-center">Status</th>
                     <th className="text-xs font-semibold text-[#4A5961] py-3 px-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#E1E6EA] text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                           <RefreshCw className="w-6 h-6 text-slate-200 animate-spin" />
                           <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Scanning Database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                           <Inbox className="w-8 h-8 text-slate-100" />
                           <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Queue is Clear</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredQueue.map((q, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                       <td className="py-3.5 px-4 font-medium text-[#10242A]">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-[#E1E6EA] flex items-center justify-center font-bold text-xs text-[#10242A] shrink-0">
                                {q.initial}
                             </div>
                             <div className="min-w-0">
                                <span className="font-semibold text-[#10242A] block truncate max-w-[250px]">{q.title}</span>
                                <span className="text-xs text-[#4A5961] block truncate">{q.raw.city || "Indore"} • {q.owner}</span>
                             </div>
                          </div>
                       </td>
                       <td className="py-3.5 px-4 text-center text-[#4A5961]">
                          <span className="text-xs font-medium text-[#4A5961]">{q.submitted}</span>
                       </td>
                       <td className="py-3.5 px-4 text-center">
                          <span className={cn(
                             "text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center",
                             q.status === "Priority Review" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                          )}>
                             {q.status}
                          </span>
                       </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={() => handleApprove(q.id)} className="bg-[#0E7C86] hover:bg-[#0B666E] text-white text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Approve
                             </button>
                             <button onClick={() => setSelectedProperty(q)} className="border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer">
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
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Locality" value={selectedProperty.raw.locality || selectedProperty.raw.city || "Unknown"} icon={MapPin} />
                <DataField label="Monthly Rent" value={selectedProperty.raw.rent || selectedProperty.raw.monthlyRent || "0"} icon={IndianRupee} isPrice />
                <DataField label="Gender" value={selectedProperty.raw.gender || "Any"} icon={Users} />
                <DataField label="Status" value={selectedProperty.status} icon={Hourglass} />
              </div>

              {/* Description */}
              <div>
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Property Description</h4>
                 <div className="bg-slate-50 rounded-2xl p-4 text-[13px] text-slate-600 font-medium leading-relaxed border border-slate-100">
                    {selectedProperty.raw.description || "No description provided by the owner."}
                 </div>
              </div>

              {/* Photos */}
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

              {/* Safety Alert */}
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

function StatCardHorizontal({ label, value, trend, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3.5 group hover:translate-y-[-2px] transition-all">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5 truncate">{label}</p>
         <p className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-none truncate">{value}</p>
         {trend && (
           <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 truncate">
              {trend}
           </div>
         )}
      </div>
    </div>
  );
}
