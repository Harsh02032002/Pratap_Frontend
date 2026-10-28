import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, Search, ArrowUpRight, ArrowDownRight, MoreVertical, 
  MapPin, ChevronRight, Home, CheckCircle2, Download, Eye, Edit, Flag, Trash2
} from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const COLORS = ["blue", "amber", "indigo", "emerald", "rose", "purple", "slate"];

export default function ReportsListings() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchJson("/api/properties")
      .then((res) => {
        const list = res?.properties || res?.data || (Array.isArray(res) ? res : []);
        setProperties(list);
      })
      .catch((err) => console.error("Failed to load listings:", err));
  }, []);

  const allListings = useMemo(() => {
    return properties
      .filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          String(p.title || "").toLowerCase().includes(q) ||
          String(p.city || "").toLowerCase().includes(q) ||
          String(p.ownerName || "").toLowerCase().includes(q)
        );
      })
      .map((p, idx) => ({
        id: p.propertyId || p.visitId || `L-${String(p._id || idx).slice(-4).toUpperCase()}`,
        title: p.title || p.propertyName || "Property",
        type: p.propertyType || "PG",
        owner: p.ownerName || p.ownerLoginId || "Owner",
        loc: p.city || p.area || "—",
        price: `₹ ${Number(p.monthlyRent || p.price || 0).toLocaleString("en-IN")}`,
        status: p.isPublished || p.status === "published" || p.status === "active" ? "Active" : (p.status || "Pending"),
        views: p.views || 0,
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "—",
        color: COLORS[idx % COLORS.length],
      }));
  }, [properties, search]);

  const totalCount = properties.length;
  const activeCount = properties.filter((p) => p.isPublished || p.status === "published" || p.status === "active").length;
  const totalViews = properties.reduce((acc, p) => acc + (Number(p.views) || 0), 0);
  const flaggedCount = properties.filter((p) => p.status === "flagged" || p.status === "rejected").length;

  return (
    <div className="p-8 space-y-10 bg-[#F8FAFC] min-h-full">
      <div className="flex flex-col gap-2">
         <h1 className="text-4xl font-bold text-slate-800 tracking-tight leading-none">Inventory Intelligence Hub</h1>
         <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase mt-2">
            <span>Reports</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600">Property Performance</span>
         </div>
      </div>

      <p className="text-sm font-bold text-slate-400">Detailed performance audit of property listings, market reach and engagement velocity.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCardLarge label="Total Inventory" value={String(totalCount)} trend="Scoped Inventory" up icon={Home} color="blue" />
        <StatCardLarge label="Active Listings" value={String(activeCount)} trend={totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% Health` : "0% Health"} up icon={CheckCircle2} color="green" />
        <StatCardLarge label="Global Reach" value={String(totalViews)} trend="Total Views" up icon={Eye} color="indigo" />
        <StatCardLarge label="Flagged Assets" value={String(flaggedCount)} trend="Audit Queue" up={false} icon={Flag} color="red" />
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
         <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Property Ledger</h3>
            <div className="flex items-center gap-4">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search properties..." className="bg-slate-50 border-none rounded-2xl py-3 pl-11 pr-4 text-xs font-bold shadow-sm w-64 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
               </div>
               <button className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                  <Download className="w-4 h-4" /> Export Ledger
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1100px]">
               <thead>
                  <tr className="text-slate-400 text-[10px] font-bold uppercase border-b border-slate-50">
                     <th className="pb-6">Property Identity</th>
                     <th className="pb-6">Listed Asset</th>
                     <th className="pb-6">Owner / Loc</th>
                     <th className="pb-6 text-center">Rental (₹)</th>
                     <th className="pb-6 text-center">Velocity (Views)</th>
                     <th className="pb-6 text-center">Status</th>
                     <th className="pb-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {allListings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs font-bold text-slate-400 uppercase">No listings found</td>
                    </tr>
                  ) : allListings.map((l, i) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                       <td className="py-6">
                          <span className="text-xs font-mono bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-100 font-bold group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-md transition-all">
                             {l.id}
                          </span>
                       </td>
                       <td className="py-6">
                          <div className="flex items-center gap-4">
                             <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg transition-transform group-hover:scale-110",
                                l.color === "blue" ? "bg-blue-600 shadow-blue-100" :
                                l.color === "amber" ? "bg-amber-600 shadow-amber-100" :
                                l.color === "indigo" ? "bg-indigo-600 shadow-indigo-100" :
                                l.color === "emerald" ? "bg-emerald-600 shadow-emerald-100" :
                                l.color === "rose" ? "bg-rose-600 shadow-rose-100" :
                                l.color === "purple" ? "bg-purple-600 shadow-purple-100" : "bg-slate-600"
                             )}>
                                <Building2 className="w-6 h-6" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-800">{l.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{l.type}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-6">
                          <p className="text-xs font-bold text-slate-700">{l.owner}</p>
                          <div className="flex items-center gap-1 mt-1 opacity-70">
                             <MapPin className="w-3 h-3 text-slate-400" />
                             <p className="text-[10px] font-bold text-slate-400 uppercase">{l.loc}</p>
                          </div>
                       </td>
                       <td className="py-6 text-center font-bold text-slate-800">
                          {l.price}
                       </td>
                       <td className="py-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                             <p className="text-base font-bold text-blue-600">{l.views}</p>
                             <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-blue-500" /></div>
                          </div>
                       </td>
                       <td className="py-6 text-center">
                          <span className={cn(
                            "text-[9px] font-bold px-3 py-1 rounded-full border shadow-sm uppercase",
                            l.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                            l.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                            l.status === "Flagged" ? "bg-rose-50 text-rose-600 border-rose-100" :
                            "bg-slate-50 text-slate-400 border-slate-100"
                          )}>
                             {l.status}
                          </span>
                       </td>
                       <td className="py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                             <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md transition-all">
                                <Edit className="w-4 h-4" />
                             </button>
                             <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-md transition-all">
                                <Trash2 className="w-4 h-4" />
                             </button>
                             <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md transition-all">
                                <MoreVertical className="w-4 h-4" />
                             </button>
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

function StatCardLarge({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-600 shadow-blue-200", 
    indigo: "bg-indigo-600 shadow-indigo-200", 
    green: "bg-emerald-600 shadow-emerald-200", 
    red: "bg-rose-600 shadow-rose-200" 
  };
  
  return (
    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-8 group hover:translate-y-[-8px] transition-all duration-500">
      <div className={cn("w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl transition-transform group-hover:rotate-6", bgColors[color])}>
         <Icon className="w-10 h-10" />
      </div>
      <div>
         <p className="text-[11px] font-bold text-slate-400 uppercase mb-4 leading-none truncate">{label}</p>
         <p className="text-5xl font-bold text-slate-800 tracking-tighter leading-none">{value}</p>
      </div>
      <div className={cn(
        "flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-2xl w-fit",
        up ? "text-emerald-600 bg-emerald-50 border border-emerald-100" : "text-rose-600 bg-rose-50 border border-rose-100"
      )}>
         {up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
         {trend}
      </div>
    </div>
  );
}
