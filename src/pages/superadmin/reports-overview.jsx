import React, { useState, useEffect } from "react";
import { 
  BarChart3, Building2, Users, TrendingUp, 
  DollarSign, PieChart as PieChartIcon, 
  MapPin, ArrowUpRight, ArrowDownRight,
  Target, Zap, Briefcase, ChevronRight,
  LayoutDashboard, MoreVertical, Globe, Wallet, AlertCircle,
  Activity, Star, PieChart
} from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { DateRangePill } from "../../components/dashboard/DateRangePill";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Pie as RePie, Cell, PieChart as RePieChart
} from "recharts";
import { fetchReportOverviewStats } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// --- MOCK DATA FOR CHARTS/TABLES ---
const revData = [
  { name: "Jan", rev: 45000, prof: 12000 },
  { name: "Feb", rev: 52000, prof: 15000 },
  { name: "Mar", rev: 48000, prof: 14000 },
  { name: "Apr", rev: 61000, prof: 18000 },
  { name: "May", rev: 55000, prof: 17000 },
  { name: "Jun", rev: 72000, prof: 22000 },
];

const occPieData = [
  { name: "Occupied", value: 12845, color: "#3B82F6" },
  { name: "Vacant", value: 4560, color: "#10B981" },
  { name: "Maintenance", value: 856, color: "#F59E0B" },
];

const topProperties = [
  { name: "Ocean View Apartment", loc: "Kota, Rajasthan", occ: 98, rev: 45000 },
  { name: "Green Park Residency", loc: "Jaipur, Rajasthan", occ: 85, rev: 32000 },
  { name: "Sunrise Heights", loc: "Udaipur, Rajasthan", occ: 92, rev: 28000 },
  { name: "Prime City Homes", loc: "Jaipur, Rajasthan", occ: 78, rev: 24000 },
];

const locationData = [
  { name: "Kota, Rajasthan", revenue: 450000, percent: 85 },
  { name: "Jaipur, Rajasthan", revenue: 320000, percent: 65 },
  { name: "Udaipur, Rajasthan", revenue: 180000, percent: 45 },
  { name: "Others", revenue: 95000, percent: 25 },
];

export default function ReportsOverview() {
  const [stats, setStats] = useState({ totalProperties: 0, totalTenants: 0, occupancyRate: 0, monthlyRevenue: 0, netProfit: 0, growthRate: 0 });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [occupancyPieData, setOccupancyPieData] = useState([]);
  const [topPropertiesList, setTopPropertiesList] = useState([]);
  const [locationRevenueList, setLocationRevenueList] = useState([]);

  const userObj = (() => { try { return JSON.parse(sessionStorage.getItem("manager_user") || sessionStorage.getItem("user") || localStorage.getItem("staff_user") || localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const userRole = String(userObj.role || "").toLowerCase();
  const isSuperadmin = userRole === "superadmin" || userRole === "admin";

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const res = await fetchReportOverviewStats();
        if (res.success) {
          setStats(res.summary);
          if (res.charts) {
            setRevenueData(res.charts.revenueOverviewData || []);
            setOccupancyPieData(res.charts.occupancyData || []);
            setTopPropertiesList(res.charts.propertyPerformance || []);
            setLocationRevenueList(res.charts.locationWiseData || []);
          }
        }
      } catch (error) {
        console.error("Reports Stats Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="p-8 space-y-8 bg-[#F8FAFC] min-h-full font-inter text-slate-900">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
               <BarChart3 className="w-6 h-6" />
            </div>
            <div>
               <h1 className="text-2xl font-black text-slate-800 tracking-tight">Report & Analytics Overview</h1>
               <p className="text-xs font-bold text-slate-400">Track, manage and analyze all property reports and analytics in real-time.</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <DateRangePill value={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
         </div>
      </div>

      {/* Hero Stats Row - DYNAMIC CARDS ONLY */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
         <ReportStatCard label="Total Properties" value={stats.totalProperties.toLocaleString()} trend="+ 12.5%" icon={Building2} color="blue" loading={loading} />
         <ReportStatCard label="Total Tenants" value={stats.totalTenants.toLocaleString()} trend="+ 9.8%" icon={Users} color="purple" loading={loading} />
         <ReportStatCard label="Occupancy Rate" value={`${stats.occupancyRate}%`} trend="+ 4.2%" icon={Target} color="emerald" loading={loading} />
         {isSuperadmin && <ReportStatCard label="Monthly Revenue" value={`₹ ${stats.monthlyRevenue.toLocaleString()}`} trend="+ 16.7%" icon={DollarSign} color="amber" loading={loading} />}
         {isSuperadmin && <ReportStatCard label="Net Profit" value={`₹ ${stats.netProfit.toLocaleString()}`} trend="+ 12.1%" icon={Zap} color="rose" loading={loading} />}
         <ReportStatCard label="Conversion Rate" value={`${stats.growthRate}%`} trend="Steady" icon={TrendingUp} color="blue" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Revenue Overview Chart - STATIC */}
         <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">Revenue Overview</h3>
               <div className="flex items-center gap-6">
                  <LegendSmall label="Revenue" color="bg-blue-500" />
                  <LegendSmall label="Profit" color="bg-emerald-500" />
               </div>
            </div>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData.length > 0 ? revenueData : revData}>
                     <defs>
                        <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={15} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dx={-15} />
                     <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                     <Area type="monotone" dataKey="rev" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorR)" />
                     <Area type="monotone" dataKey="prof" stroke="#10B981" strokeWidth={4} fillOpacity={0} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Occupancy Pulse - STATIC */}
         <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl flex flex-col items-center">
            <h3 className="text-xl font-black text-slate-800 tracking-tight w-full mb-8">Occupancy Pulse</h3>
            <div className="relative w-56 h-56 mb-10">
               <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                     <RePie data={occupancyPieData.length > 0 ? occupancyPieData : occPieData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                        {(occupancyPieData.length > 0 ? occupancyPieData : occPieData).map((entry, index) => <Cell key={index} fill={entry.color || (index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : '#F59E0B')} />)}
                     </RePie>
                  </RePieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-black text-slate-800">{stats.occupancyRate}%</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-1">Occupancy Rate</p>
               </div>
            </div>
            <div className="w-full space-y-4">
               {occupancyPieData.length > 0 ? occupancyPieData.map(item => (
                  <LegendRow key={item.name} label={item.name} value={item.value.toLocaleString()} color={item.name === "Occupied" ? "bg-blue-500" : item.name === "Vacant" ? "bg-emerald-500" : "bg-amber-500"} />
               )) : (
                  <>
                     <LegendRow label="Occupied" value="12,845" color="bg-blue-500" />
                     <LegendRow label="Vacant" value="4,560" color="bg-emerald-500" />
                     <LegendRow label="Maintenance" value="856" color="bg-amber-500" />
                  </>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
         {/* Top Performing Properties - STATIC */}
         <div className="lg:col-span-6 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-10">Top Performing Properties</h3>
            <div className="space-y-6">
               {topPropertiesList.length > 0 ? topPropertiesList.map((prop, i) => (
                  <PropPerfRow key={i} name={prop.name} loc={prop.loc} occ={prop.occ} rev={prop.rev} />
               )) : topProperties.map((prop, i) => (
                  <PropPerfRow key={i} name={prop.name} loc={prop.loc} occ={prop.occ} rev={prop.rev} />
               ))}
            </div>
         </div>

         {/* Location Revenue Breakdown - STATIC */}
         <div className="lg:col-span-6 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-10">Location Revenue Breakdown</h3>
            <div className="space-y-6">
               {locationRevenueList.length > 0 ? locationRevenueList.map((loc, i) => (
                  <div key={i} className="space-y-2">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-800">{loc.name}</span>
                        <span className="text-sm font-black text-blue-600">₹ {loc.revenue.toLocaleString()}</span>
                     </div>
                     <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{width: `${loc.percent}%`}} />
                      </div>
                  </div>
               )) : locationData.map((loc, i) => (
                  <div key={i} className="space-y-2">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-800">{loc.name}</span>
                        <span className="text-sm font-black text-blue-600">₹ {loc.revenue.toLocaleString()}</span>
                     </div>
                     <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{width: `${loc.percent}%`}} />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function ReportStatCard({ label, value, trend, icon: Icon, color, loading }) {
  const colors = {
    blue: "bg-blue-500 shadow-blue-200",
    purple: "bg-purple-500 shadow-purple-200",
    emerald: "bg-emerald-500 shadow-emerald-200",
    amber: "bg-amber-500 shadow-amber-200",
    rose: "bg-rose-500 shadow-rose-200",
  };
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md group hover:-translate-y-1 transition-all min-w-0">
       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg", colors[color])}>
          <Icon className="w-6 h-6" />
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
       {loading ? (
         <div className="h-6 w-16 bg-slate-100 animate-pulse rounded-md" />
       ) : (
         <p className="text-lg font-black text-slate-800 mb-2 truncate">{value}</p>
       )}
       <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
          <ArrowUpRight className="w-3 h-3" /> {trend}
       </div>
    </div>
  );
}

function LegendSmall({ label, color }) {
  return (
    <div className="flex items-center gap-2">
       <div className={cn("w-2 h-2 rounded-full", color)} />
       <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
    </div>
  );
}

function LegendRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between text-[10px] font-black group">
       <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", color)} />
          <span className="text-slate-500 group-hover:text-slate-800 transition-colors uppercase tracking-tight">{label}</span>
       </div>
       <span className="text-slate-800">{value}</span>
    </div>
  );
}

function PropPerfRow({ name, loc, occ, rev }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
       <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center font-black text-[10px] text-blue-600 shrink-0">PV</div>
          <div className="min-w-0">
             <p className="text-[11px] font-black text-slate-800 truncate">{name}</p>
             <p className="text-[9px] text-slate-400 font-bold">{loc}</p>
          </div>
       </div>
       <div className="text-right shrink-0">
          <p className="text-[11px] font-black text-slate-800">₹ {rev.toLocaleString()}</p>
          <span className="text-[9px] font-black text-emerald-600">{occ}% Occupied</span>
       </div>
    </div>
  );
}
