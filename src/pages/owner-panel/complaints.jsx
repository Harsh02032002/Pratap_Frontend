import React, { useState, useEffect, useMemo } from "react";
import OwnerLayout from "../../components/OwnerLayout";
import { AlertCircle, Clock, CheckCircle2, Home, User, Filter, ArrowRight, Loader2 } from "lucide-react";
import { getOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { fetchJson } from "../../utils/api";
import { getOwnerComplaints } from "../../api/complaints";
import { toast } from "react-hot-toast";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function OwnerComplaints() {
  const owner = getOwnerRuntimeSession();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const propertyId = getActiveOwnerPropertyId();
      const data = await getOwnerComplaints(owner.loginId, { propertyId });
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [owner.loginId]);

  const updateStatus = async (id, newStatus) => {
    try {
      const data = await fetchJson(`/api/complaints/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      if (data && data.success) {
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
        toast.success(`Complaint status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Failed to update status");
    }
  };

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      const cStatus = (c.status || "Open").toLowerCase().replace(" ", "-");
      const matchesTab = tab === "all" || cStatus === tab || (tab === "in-progress" && cStatus === "taken");
      const term = search.toLowerCase();
      const matchesSearch = !search || 
        (c.tenantName || "").toLowerCase().includes(term) || 
        (c.category || "").toLowerCase().includes(term) ||
        (c.description || "").toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [complaints, tab, search]);

  const counts = useMemo(() => {
    const total = complaints.length;
    return {
      total,
      pending: complaints.filter(c => ["Open", "In Progress", "Taken"].includes(c.status || "Open")).length,
      resolved: complaints.filter(c => c.status === "Resolved").length
    };
  }, [complaints]);

  return (
    <OwnerLayout 
      title="Complaints"
      subtitle="Track and fix issues reported by your residents."
    >
      <div className="space-y-12">
        {/* Modern Support Overview */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
           <div className="flex flex-wrap gap-3">
              <ComplaintTab label="All Tickets" active={tab === "all"} onClick={() => setTab("all")} count={counts.total} />
              <ComplaintTab label="Pending" active={tab === "open"} onClick={() => setTab("open")} count={counts.pending} color="rose" />
              <ComplaintTab label="Resolved" active={tab === "resolved"} onClick={() => setTab("resolved")} count={counts.resolved} color="emerald" />
           </div>
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 w-full md:w-[320px] shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                <Filter size={16} className="text-indigo-600" />
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter Complaints..." 
                  className="text-xs font-bold text-slate-900 placeholder-slate-400 outline-none w-full"
                />
              </div>
           </div>
        </div>

        {/* Complaint Feed - Premium Style */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="size-8 animate-spin mx-auto text-indigo-600" />
            <p className="mt-2 text-sm text-slate-500 font-medium">Loading complaints...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-8">
            <AlertCircle className="size-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No complaints found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((item, i) => (
              <div key={item._id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-700 group relative overflow-hidden">
                 <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                         item.priority === 'High' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
                       }`}>
                         <AlertCircle size={20} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{`#CMP-${item._id.substring(item._id.length - 6).toUpperCase()}`}</span>
                             <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                               item.status === 'Open' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                               item.status === 'In Progress' || item.status === 'Taken' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                             }`}>{item.status || 'Open'}</span>
                          </div>
                          <h4 className="text-lg font-black text-slate-900 tracking-tighter italic mb-1 group-hover:text-indigo-600 transition-colors">{item.description}</h4>
                          <div className="flex flex-wrap gap-5 items-center">
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                <Home size={12} className="text-indigo-500" /> {item.property}
                             </div>
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                <User size={12} className="text-indigo-500" /> {item.tenantName}
                             </div>
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                <Clock size={12} className="text-indigo-500" /> {new Date(item.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <div className="text-right mr-4 hidden md:block">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-0.5">Category</p>
                          <p className="text-xs font-black text-slate-900 italic">{item.category}</p>
                       </div>
                       {item.status === "Open" && (
                          <button onClick={() => updateStatus(item._id, "In Progress")} className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all border border-indigo-100 flex items-center gap-1.5 group/btn">
                             Start Work <ArrowRight size={10} className="group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                       )}
                       {(item.status === "In Progress" || item.status === "Taken") && (
                          <button onClick={() => updateStatus(item._id, "Resolved")} className="px-5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all border border-emerald-100 flex items-center gap-1.5 group/btn">
                             Resolve <CheckCircle2 size={10} />
                          </button>
                       )}
                       {item.status === "Resolved" && (
                          <button onClick={() => updateStatus(item._id, "Open")} className="px-5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all border border-slate-100 flex items-center gap-1.5 group/btn">
                             Reopen
                          </button>
                       )}
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}

        {/* Global Efficiency Score */}
        <div className="bg-indigo-50/30 rounded-3xl p-6 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                 <div className="relative w-10 h-10">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="20" cy="20" r="18" stroke="#F1F5F9" strokeWidth="4" fill="transparent" />
                       <circle cx="20" cy="20" r="18" stroke="#4F46E5" strokeWidth="4" fill="transparent" strokeDasharray="113.1" strokeDashoffset="17" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-indigo-600">85%</div>
                 </div>
              </div>
              <div>
                 <h4 className="text-lg font-black text-slate-900 italic mb-0.5">Efficiency Score</h4>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Tickets resolved within 24 hours.</p>
              </div>
           </div>
        </div>
      </div>
    </OwnerLayout>
  );
}

function ComplaintTab({ label, active, count, color, onClick }) {
   const colors = {
      rose: 'bg-rose-50 text-rose-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      indigo: 'bg-indigo-50 text-indigo-600'
   };
   return (
      <button 
         onClick={onClick}
         className={cn(
            "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border italic",
            active ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
         )}
      >
         {label}
         <span className={cn(
            "px-2 py-0.5 rounded-md text-[8px] font-black",
            active ? "bg-white/20 text-white" : color ? colors[color] : "bg-slate-100 text-slate-500"
         )}>{count}</span>
      </button>
   );
}
