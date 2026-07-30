import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Hourglass,
  Check, X, Eye, ClipboardCheck, AlertTriangle,
  Camera, Map, Star, Edit3, Trash, Bell, BellOff,
  RefreshCw, Download, PauseCircle, ShieldCheck,
  Plus, Loader2, Save, Sparkles, Layers, Box,
  Globe2, IndianRupee, Inbox, Smartphone, Monitor, Info
} from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import { fetchJson, getAuthHeader } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const enquiryStatus = [
  { name: "Approved", value: 1283, color: "#10b981", percent: "45.1%" },
  { name: "Pending", value: 424, color: "#f59e0b", percent: "14.9%" },
  { name: "Rejected", value: 233, color: "#ef4444", percent: "8.2%" },
  { name: "On Hold", value: 156, color: "#2563eb", percent: "5.5%" },
];

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001" : "https://roohmy-backend-xwa9.vercel.app");

export default function SuperadminEnquiry() {
  const [search, setSearch] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const handleBulkUpdate = async (status) => {
    if (selectedIds.size === 0) return;
    const confirmMsg = `Are you sure you want to mark all ${selectedIds.size} selected enquiries as ${status}?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await fetchJson(`/api/website-enquiries/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status: status.toLowerCase() })
        });
      }
      setSelectedIds(new Set());
      fetchEnquiries();
    } catch (err) {
      console.error(err);
      alert("Failed to update some enquiries");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmMsg = `Are you sure you want to permanently delete all ${selectedIds.size} selected enquiries?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await fetchJson(`/api/website-enquiries/${id}`, {
          method: "DELETE"
        });
      }
      setSelectedIds(new Set());
      fetchEnquiries();
    } catch (err) {
      console.error(err);
      alert("Failed to delete some enquiries");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiUrl()}/api/website-enquiries?t=${Date.now()}`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.enquiries) {
        setEnquiries(data.enquiries.map(enq => ({
          id: enq._id || `ENQ-${Math.floor(Math.random()*10000)}`,
          name: enq.name || enq.owner_name || "Unknown",
          property: enq.property_name || enq.property || "Unknown Property",
          status: enq.status === "approved" ? "Approved" : 
                  enq.status === "rejected" ? "Rejected" : 
                  enq.status === "on_hold" ? "On Hold" : "Pending",
          date: new Date(enq.created_at || enq.createdAt || Date.now()).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }),
          initial: (enq.name || enq.owner_name || "U")[0].toUpperCase(),
          color: ["blue", "indigo", "amber", "rose", "emerald"][Math.floor(Math.random() * 5)]
        })));
      }
    } catch (err) {
      console.error("Error fetching enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const filteredEnquiries = enquiries.filter(enq => 
    enq.name.toLowerCase().includes(search.toLowerCase()) || 
    enq.property.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Enquiry List"
        subtitle="Track and manage customer leads received from the website."
        breadcrumbs={[
          { label: "Dashboard" },
          { label: "Enquiry List", active: true }
        ]}
        actions={
          <button className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all flex items-center gap-2">
             <Plus className="w-3.5 h-3.5" /> Provision Enquiry
          </button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCardHorizontal label="Total Enquiries" value={enquiries.length} trend="+15.2%" up icon={Inbox} color="blue" />
        <StatCardHorizontal label="Pending" value={enquiries.filter(e => e.status === "Pending").length} trend="+5.3%" up icon={Hourglass} color="amber" />
        <StatCardHorizontal label="Approved" value={enquiries.filter(e => e.status === "Approved").length} trend="+12.4%" up icon={CheckCircle2} color="emerald" />
        <StatCardHorizontal label="Rejected" value={enquiries.filter(e => e.status === "Rejected").length} trend="-2.1%" up={false} icon={XCircle} color="rose" />
        <StatCardHorizontal label="On Hold" value={enquiries.filter(e => e.status === "On Hold").length} trend="+1.2%" up icon={PauseCircle} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Yield Matrix Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Lead Yield Matrix</h3>
              <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
                 <RefreshCw className="w-3.5 h-3.5" />
              </button>
           </div>
           <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={enquiryStatus} dataKey="value" innerRadius={35} outerRadius={55} paddingAngle={10} stroke="none">
                          {enquiryStatus.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-bold text-slate-800 tracking-tight leading-none">2.8k</p>
                    <p className="text-[7px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Total Pipeline</p>
                 </div>
              </div>
              <div className="w-full mt-8 space-y-2">
                 {enquiryStatus.map(s => (
                    <div key={s.name} className="flex items-center justify-between group p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-100">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full shadow-sm" style={{backgroundColor: s.color}} />
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none">{s.name}</span>
                       </div>
                       <p className="text-[10px] font-bold text-slate-800 leading-none">{s.value} <span className="text-[8px] text-slate-400 ml-1 font-medium opacity-60">({s.percent})</span></p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Lead Pulse Ledger */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Inbound Pulse Ledger</h3>
              <div className="flex items-center gap-3">
                 <div className="relative group w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <input 
                      value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search leads..." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
                   />
                 </div>
                 <button onClick={fetchEnquiries} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                 </button>
              </div>
           </div>

           {filteredEnquiries.length > 0 && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                 <input
                   type="checkbox"
                   disabled={isBulkProcessing}
                   className="rounded border-slate-300 cursor-pointer"
                   checked={filteredEnquiries.every(enq => selectedIds.has(enq.id))}
                   onChange={() => {
                     const allSelected = filteredEnquiries.every(enq => selectedIds.has(enq.id));
                     const next = new Set(selectedIds);
                     if (allSelected) {
                       filteredEnquiries.forEach(enq => next.delete(enq.id));
                     } else {
                       filteredEnquiries.forEach(enq => next.add(enq.id));
                     }
                     setSelectedIds(next);
                   }}
                 />
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Select All ({filteredEnquiries.length})</span>
              </div>
           )}

           <div className="space-y-3 h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-[10px] font-bold">Scanning Pipeline...</span>
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <span className="text-[10px] font-bold">No Leads Found</span>
                </div>
              ) : filteredEnquiries.map(enq => (
                <div key={enq.id} className="flex items-center gap-4 group cursor-pointer p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all duration-300"
                  onClick={() => {
                    const next = new Set(selectedIds);
                    if (next.has(enq.id)) next.delete(enq.id);
                    else next.add(enq.id);
                    setSelectedIds(next);
                  }}
                >
                   <input
                     type="checkbox"
                     disabled={isBulkProcessing}
                     className="rounded border-slate-300 cursor-pointer shrink-0"
                     checked={selectedIds.has(enq.id)}
                     onClick={(e) => e.stopPropagation()}
                     onChange={() => {
                       const next = new Set(selectedIds);
                       if (next.has(enq.id)) next.delete(enq.id);
                       else next.add(enq.id);
                       setSelectedIds(next);
                     }}
                   />
                   <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm transition-transform group-hover:scale-105 shrink-0",
                      enq.color === "blue" ? "bg-blue-600 shadow-blue-50" :
                      enq.color === "amber" ? "bg-amber-600 shadow-amber-50" :
                      enq.color === "indigo" ? "bg-indigo-600 shadow-indigo-50" :
                      enq.color === "emerald" ? "bg-emerald-600 shadow-emerald-50" : "bg-rose-600 shadow-rose-50"
                   )}>
                      {enq.initial}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold text-slate-800 truncate leading-none">{enq.name}</p>
                        <span className={cn(
                           "text-[7px] font-bold px-1.5 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm whitespace-nowrap",
                           enq.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                           enq.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                           enq.status === "On Hold" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          {enq.status}
                        </span>
                      </div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate mt-1.5 opacity-60 leading-none">{enq.property} Portfolio</p>
                   </div>
                   <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-slate-800 leading-none">{enq.date}</p>
                      <p className="text-[8px] font-mono font-bold text-blue-600 mt-1.5 uppercase tracking-tighter opacity-70 leading-none truncate max-w-[80px]">{enq.id}</p>
                   </div>
                   <button className="p-1.5 rounded-lg text-slate-300 hover:text-slate-800 hover:bg-white hover:shadow-sm transition-all" onClick={(e) => e.stopPropagation()}><ChevronRight className="w-4 h-4" /></button>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Conversion Suite Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10">
         <ActionTile icon={CheckCircle2} label="Approved" count="1,283" color="emerald" sub="Verified Enquiries" />
         <ActionTile icon={PauseCircle} label="On Hold" count="156" color="indigo" sub="Awaiting Review" />
         <ActionTile icon={XCircle} label="Rejected" count="233" color="rose" sub="Failed Enquiries" />
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-8 py-4 rounded-3xl border border-slate-800 shadow-2xl flex items-center gap-6 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 border-r border-slate-850 pr-6">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shadow-lg animate-pulse">
              {selectedIds.size}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={isBulkProcessing}
              onClick={() => handleBulkUpdate("Approved")}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isBulkProcessing ? "Processing..." : <><Check size={14} /> Approve</>}
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={() => handleBulkUpdate("Rejected")}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isBulkProcessing ? "Processing..." : <><X size={14} /> Reject</>}
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={() => handleBulkUpdate("On Hold")}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isBulkProcessing ? "Processing..." : <><PauseCircle size={14} /> Hold</>}
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isBulkProcessing ? "Processing..." : <><Trash2 size={14} /> Delete</>}
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors pl-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100" 
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

function ActionTile({ icon: Icon, label, count, color, sub }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-200/50 group cursor-pointer hover:translate-y-[-4px] transition-all duration-300">
       <div className="flex items-center justify-between mb-6">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-transform group-hover:scale-110 group-hover:rotate-3", colors[color])}>
             <Icon className="w-5 h-5" />
          </div>
          <button className="text-[8px] font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 flex items-center gap-1 leading-none">Audit Flow <ChevronRight className="w-3 h-3" /></button>
       </div>
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none opacity-60">{label}</p>
       <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-slate-800 tracking-tight leading-none">{count}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest opacity-60 leading-none">{sub}</p>
       </div>
    </div>
  );
}
