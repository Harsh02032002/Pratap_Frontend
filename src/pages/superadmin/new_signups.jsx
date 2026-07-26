import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Hourglass,
  Check, X, Eye, UserPlus, ShieldCheck, ShieldAlert,
  RefreshCw, Download, Inbox, CreditCard, Tag,
  BarChart3, Plus, Loader2, Save, Sparkles, Layers,
  Box, Globe2, IndianRupee
} from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function NewSignups() {
  const [signups, setSignups] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSignups = async () => {
    try {
      setLoading(true);
      const data = await fetchJson("/api/kyc");
      const list = Array.isArray(data) ? data : data?.data || data?.users || [];
      setSignups(list);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadSignups(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return signups.filter(s => {
      const name = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      const matchesSearch = name.includes(q) || (s.email || "").toLowerCase().includes(q);
      const status = (s.status || s.kycStatus || "pending").toLowerCase();
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [signups, query, statusFilter]);

  const stats = useMemo(() => {
    const total = signups.length;
    const pending = signups.filter(s => (s.status || s.kycStatus || "pending") === "pending").length;
    const verified = signups.filter(s => (s.status || s.kycStatus) === "verified").length;
    return { total, pending, verified, rejected: total - pending - verified };
  }, [signups]);

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">New User Signups</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">Manage and verify newly registered users and tenants.</p>
         </div>
         <div className="flex items-center gap-3">
            <button className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all flex items-center gap-2">
               <Download className="w-3.5 h-3.5" /> Export Signups
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal label="Total Signups" value={stats.total} trend="Total Registered" up icon={UserPlus} color="blue" />
        <StatCardHorizontal label="Pending KYC" value={stats.pending} trend="Action Required" up icon={Hourglass} color="amber" />
        <StatCardHorizontal label="Verified Users" value={stats.verified} trend="Verified" up icon={ShieldCheck} color="emerald" />
        <StatCardHorizontal label="Active Tenants" value={stats.total} trend="Live Users" up icon={Users} color="indigo" />
      </div>

      {/* Main Pulse Ledger */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
               <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider leading-none">Signups List</h3>
               <div className="hidden xl:flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner">
                  {["all", "pending", "verified"].map(f => (
                    <button 
                      key={f} onClick={() => setStatusFilter(f)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all leading-none",
                        statusFilter === f ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                       {f === "all" ? "All Users" : f}
                    </button>
                  ))}
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="relative group w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input 
                    value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search name, email, phone..." 
                    className="bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all w-full shadow-sm" 
                  />
               </div>
               <button onClick={loadSignups} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-400 text-[9px] font-bold uppercase border-b border-slate-50 tracking-wider">
                     <th className="pb-4">User ID</th>
                     <th className="pb-4">User Details</th>
                     <th className="pb-4">Contact Info</th>
                     <th className="pb-4 text-center">Status</th>
                     <th className="pb-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="5" className="py-20 text-center">
                       <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Signups...</p>
                    </td></tr>
                  ) : filtered.map((s, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                       <td className="py-3">
                          <p className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 shadow-sm inline-block">#{s.id || s.loginId || s._id?.substring(0,6) || "N/A"}</p>
                          <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider leading-none">Registered Recently</p>
                       </td>
                       <td className="py-3">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-blue-600 flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-105 shrink-0 overflow-hidden">
                                {(s.firstName || s.name || "U").charAt(0).toUpperCase()}
                             </div>
                             <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[160px]">{s.firstName || s.name ? `${s.firstName || s.name} ${s.lastName || ""}` : "Tenant User"}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-1 truncate">{s.role || "Tenant"}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-3">
                          <div className="space-y-1">
                             <p className="text-xs font-bold text-slate-700 leading-none">{s.email}</p>
                             <p className="text-[10px] font-bold text-slate-500 leading-none">{s.phone || "+91-XXXXXXXXXX"}</p>
                          </div>
                       </td>
                       <td className="py-3 text-center">
                          <span className={cn(
                             "text-[9px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider shadow-sm",
                             (s.status || s.kycStatus) === "verified" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                             (s.status || s.kycStatus) === "rejected" ? "bg-rose-50 text-rose-600 border-rose-100" :
                             "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                             {s.status || s.kycStatus || "Pending"}
                          </span>
                       </td>
                       <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                             {(s.status || s.kycStatus) !== "verified" && (
                               <button className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm group/btn">
                                  <Check className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" /> Verify
                               </button>
                             )}
                             <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"><Eye className="w-3.5 h-3.5" /></button>
                             <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-100 shadow-sm"><MoreVertical className="w-3.5 h-3.5" /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
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
