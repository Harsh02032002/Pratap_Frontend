import React, { useState, useEffect, useMemo } from "react";
import {
   Building2, Users, Shield, Clock, Search,
   ArrowUpRight, ArrowDownRight, MoreVertical,
   Filter, Globe, MapPin, Zap, Sheet, Trash2,
   ChevronRight, Phone, Mail, User, Image as ImageIcon,
   Activity, Home, CheckCircle2, XCircle, Hourglass,
   Check, X, Eye, ClipboardCheck, AlertTriangle,
   Camera, Map, Star, Edit3, Trash, UserCheck,
   RefreshCw, Download, Inbox, CreditCard, Tag,
   BarChart3, Plus, Loader2, FolderTree, Building, Hotel, Castle, Upload,
   Sparkles
} from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const iconOptions = [
   { value: "pg", label: "PG", icon: Users, color: "blue" },
   { value: "coliving", label: "Co-Living", icon: Users, color: "emerald" },
   { value: "building", label: "Apartment", icon: Building, color: "indigo" },
   { value: "castle", label: "Villa", icon: Castle, color: "amber" },
   { value: "home", label: "Independent House", icon: Home, color: "blue" },
   { value: "hotel", label: "Hotel / Service Apartment", icon: Hotel, color: "rose" },
];

export default function Categories() {
   const [cats, setCats] = useState([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");

   const loadCategories = async () => {
      try {
         setLoading(true);
         const data = await fetchJson("/api/property-types");
         if (data.success) setCats(data.data);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => { loadCategories(); }, []);

   const filteredCats = useMemo(() => {
      const q = search.toLowerCase();
      return cats.filter(c => c.title.toLowerCase().includes(q));
   }, [cats, search]);

   const stats = useMemo(() => {
      return { total: cats.length, popular: "Co-Living", growth: "14%", active: "94%" };
   }, [cats]);

   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center h-[600px] gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing Taxonomy Vault...</p>
         </div>
      );
   }

   return (
      <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
         {/* Header Area */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Property Categories</h1>
               <p className="text-sm text-slate-500 mt-0.5">Manage platform property categories and classification schemas</p>
            </div>
            <div className="flex items-center gap-3">
               <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition shadow-2xs flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-500" /> Export
               </button>
               <button className="bg-[#095256] hover:bg-[#074043] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition shadow-2xs flex items-center gap-2">
                  <Plus className="w-4 h-4" /> + Add Category
               </button>
            </div>
         </div>

         {/* Metrics Row */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCardHorizontal label="Classifications" value={stats.total} trend="Global Schema" up icon={FolderTree} color="blue" />
            <StatCardHorizontal label="Market Leader" value={stats.popular} trend="High Velocity" up icon={Star} color="amber" />
            <StatCardHorizontal label="Growth Index" value={stats.growth} trend="+2.4% MoM" up icon={BarChart3} color="emerald" />
            <StatCardHorizontal label="Active Coverage" value={stats.active} trend="Deployment" up icon={CheckCircle2} color="indigo" />
         </div>

         {/* Search & Filter Row (OUTSIDE) */}
         <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#095256]/20 shadow-2xs"
               />
               {search && <button onClick={()=>setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>}
            </div>
         </div>

         {/* Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
            {filteredCats.map((c, i) => {
               const opt = iconOptions.find(o => o.value === c.category) || iconOptions[2];
               const Icon = opt.icon;
               return (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md group hover:translate-y-[-4px] transition-all duration-300 flex flex-col relative overflow-hidden">
                     <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all group-hover:scale-105 group-hover:rotate-3",
                           opt.color === "blue" ? "bg-blue-600" :
                              opt.color === "emerald" ? "bg-emerald-600" :
                                 opt.color === "indigo" ? "bg-indigo-600" :
                                    opt.color === "amber" ? "bg-amber-600" : "bg-rose-600"
                        )}>
                           <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex gap-1">
                           <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"><Edit3 className="w-3 h-3" /></button>
                           <button className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-100 shadow-sm"><Trash2 className="w-3 h-3" /></button>
                        </div>
                     </div>

                     <div className="flex-1">
                        <h3 className="text-[11px] font-bold text-slate-800 leading-tight truncate">{c.title}</h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60 leading-none">Identity: {c.category}</p>

                        <div className="grid grid-cols-3 gap-1.5 my-4">
                           {(c.images || []).slice(0, 3).map((img, idx) => (
                              <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-50 border border-slate-100 transition-all hover:scale-110">
                                 <img src={img} className="w-full h-full object-cover" alt="" />
                              </div>
                           ))}
                           {(c.images || []).length === 0 && (
                              <div className="col-span-3 aspect-[3/1] rounded-lg bg-slate-50 flex items-center justify-center border border-dashed border-slate-100 text-slate-300">
                                 <ImageIcon className="w-5 h-5 opacity-30" />
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                        <span className={cn(
                           "text-[7px] font-bold px-1.5 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm",
                           c.status === "Active" || !c.status ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                        )}>{c.status || "Active"}</span>
                        <button className="text-[8px] font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 group/btn uppercase tracking-widest">
                           Analytics <ChevronRight className="w-2.5 h-2.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  </div>
               );
            })}

            <button className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-slate-800 hover:bg-white hover:shadow-lg transition-all group min-h-[200px]">
               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-sm">
                  <Plus className="w-5 h-5" />
               </div>
               <div className="text-center">
                  <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Register Tier</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest opacity-60">Expand Global Schema</p>
               </div>
            </button>
         </div>
      </div>
   );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
   const bgColors = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      amber: "bg-amber-50 text-amber-600 border-amber-100",
      emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
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
