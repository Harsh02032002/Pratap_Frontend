import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Users, IndianRupee, Clock, 
  ArrowUpRight, ArrowDownRight, ChevronRight, 
  MoreVertical, Search, Calendar, Bell,
  CheckCircle2, AlertCircle, Activity,
  TrendingUp, Home, LayoutGrid, MapPin,
  ShieldCheck, Globe, Star, PieChart as PieIcon,
  ShoppingBag, UserCircle, MessageSquare
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { fetchHomeOverviewStats, fetchCities, fetchAccountingOverviewStats } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// --- STATIC FALLBACK for revenue chart (used only when API returns no data) ---
const revenueLineData = [
  { name: "No Data", revenue: 0 },
];

export default function HomeOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ properties: 0, tenants: 0, revenue: 0, alerts: 0 });
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [propStatusData, setPropStatusData] = useState([]);
  const [tenantTypeData, setTenantTypeData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [acctStats, setAcctStats] = useState({ totalCollection: 0, totalPayout: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("All Cities");

  useEffect(() => {
    const loadCities = async () => {
      try {
        const data = await fetchCities();
        const cityNames = data.map(c => typeof c === 'object' ? (c.name || c.cityName || '') : c).filter(Boolean);
        setCities(["All Cities", ...new Set(cityNames)]);
      } catch (err) {
        console.error("Failed to load cities for overview:", err);
      }
    };
    loadCities();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [res, acct] = await Promise.all([
          fetchHomeOverviewStats(selectedCity),
          fetchAccountingOverviewStats()
        ]);
        const commissionRevenue = (acct?.success && acct?.summary?.revenue !== undefined) 
          ? acct.summary.revenue 
          : (res?.summary?.monthlyRevenue || 0);

        if (res.success && res.summary) {
          setStats({
            properties: res.summary.totalProperties || 0,
            tenants: res.summary.totalTenants || 0,
            revenue: commissionRevenue,
            alerts: res.summary.alerts || 0
          });
          setRevenueTrend(res.revenueTrend || acct?.trends || []);
          setPendingAlerts(res.pendingAlerts || []);
          setPropStatusData(res.propertiesByStatus || []);
          setTenantTypeData(res.tenantsByType || []);
          setRecentActivities(res.activities || []);
        }
        if (acct?.success && acct?.summary) {
          setAcctStats(acct.summary);
          setStats(prev => ({
            ...prev,
            revenue: commissionRevenue
          }));
          if (!res.revenueTrend?.length && acct.trends?.length) {
            setRevenueTrend(acct.trends);
          }
        }
      } catch (error) {
        console.error("Home Overview Stats Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [selectedCity]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Overview"
        subtitle="Welcome back, Aman! Here's an overview of your platform."
        breadcrumbs={[
          { label: "Home" },
          { label: "Overview", active: true }
        ]}
        actions={
          <div className="flex items-center gap-3">
            {cities.length > 0 && (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-600 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20"
              >
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-3 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>May 22 - May 28, 2024</span>
            </div>
          </div>
        }
      />


      {/* Stats Row - LIVE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         <HomeStatCard label="Total Properties" value={loading ? "..." : stats.properties.toLocaleString()} trend="+8.3% from last week" icon={Building2} color="blue" up loading={loading} onClick={() => navigate('/superadmin/total-properties')} viewAllLabel="View All Properties" viewAllPath="/superadmin/total-properties" />
         <HomeStatCard label="Total Tenants" value={loading ? "..." : stats.tenants.toLocaleString()} trend="+12.5% from last week" icon={Users} color="emerald" up loading={loading} onClick={() => navigate('/superadmin/tenant')} viewAllLabel="View All Tenants" viewAllPath="/superadmin/tenant" />
         <HomeStatCard label="Revenue Overview" value={loading ? "..." : `₹${stats.revenue.toLocaleString('en-IN')}`} trend="+18.6% from last week" icon={IndianRupee} color="purple" up loading={loading} onClick={() => navigate('/superadmin/home/revenue-overview')} viewAllLabel="View Detailed Report" viewAllPath="/superadmin/home/revenue-overview" />
         <HomeStatCard label="Alerts (Pending Rent)" value={loading ? "..." : stats.alerts.toString()} trend="Tenants with pending rent" icon={Bell} color="amber" up loading={loading} onClick={() => navigate('/superadmin/rentcollection')} viewAllLabel="View All Alerts" viewAllPath="/superadmin/rentcollection" />
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
         {/* Revenue Overview Chart */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold text-slate-900">Earnings</h3>
               <select className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-1.5 text-xs font-bold text-slate-500 outline-none cursor-pointer">
                  <option>This Month</option>
               </select>
            </div>
            <div className="flex items-center gap-4 mb-8">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Earnings (₹)</span>
               </div>
            </div>
            <div className="h-[250px] mb-8">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend.length > 0 ? revenueTrend : revenueLineData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} dy={15} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} dx={-15} tickFormatter={(v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}`} />
                     <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: 12 }} />
                     <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{fill: '#3B82F6', r: 4}} activeDot={{r: 6}} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-4 pt-8 border-t border-slate-50">
               <MiniMetric label="Total Earnings" value={`₹${stats.revenue.toLocaleString('en-IN')}`} />
               <MiniMetric label="Collected" value={acctStats.totalCollection ? `₹${Number(acctStats.totalCollection).toLocaleString('en-IN')}` : `₹${Math.round(stats.revenue * 0.84).toLocaleString('en-IN')}`} color="text-emerald-500" />
               <MiniMetric label="Pending" value={acctStats.dueRent ? `₹${Number(acctStats.dueRent).toLocaleString('en-IN')}` : `₹${Math.round(stats.revenue * 0.16).toLocaleString('en-IN')}`} color="text-amber-500" />
               <MiniMetric label="Growth" value="+18.6%" color="text-emerald-500" />
            </div>
         </div>

         {/* Pending Rent Alerts Sidebar */}
         <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold text-slate-900">Pending Rent</h3>
               <button onClick={() => navigate('/superadmin/rentcollection')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-6 flex-1">
               {pendingAlerts.length > 0 ? pendingAlerts.map((alert, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                     <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                        {alert.name.charAt(0)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[13px] font-bold text-slate-900 truncate leading-none mb-1.5">{alert.name}</h4>
                           <span className="text-[13px] font-bold text-slate-900">₹{alert.amount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] text-slate-400 font-medium truncate">{alert.property}</p>
                           <span className={cn("text-[10px] font-bold", alert.overdue > 0 ? "text-rose-500" : "text-emerald-500")}>
                             {alert.overdue > 0 ? `${alert.overdue} days overdue` : 'Due Today'}
                           </span>
                        </div>
                     </div>
                     <button className="p-1.5 bg-rose-50 text-rose-500 rounded-lg shrink-0">
                        <Bell size={14} />
                     </button>
                  </div>
               )) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                    <Bell size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">No Pending Rent</p>
                 </div>
               )}
            </div>
            <button onClick={() => navigate('/superadmin/rentcollection')} className="w-full mt-8 py-3 text-xs font-bold text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-50 transition-all uppercase tracking-widest">
               View All
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {/* Donut Charts & Activity Section */}
         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-8">Properties</h3>
            <div className="relative h-48 flex items-center justify-center mb-8">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={propStatusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {propStatusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-slate-900">{stats.properties.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</p>
               </div>
            </div>
            <div className="space-y-3">
               {propStatusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                        <span className="text-xs font-semibold text-slate-500">{item.name}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900">{item.value.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400">({item.percent})</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-8">Tenants</h3>
            <div className="relative h-48 flex items-center justify-center mb-8">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={tenantTypeData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {tenantTypeData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-slate-900">{stats.tenants.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</p>
               </div>
            </div>
            <div className="space-y-3">
               {tenantTypeData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                        <span className="text-xs font-semibold text-slate-500">{item.name}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900">{item.value.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400">({item.percent})</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
               <button onClick={() => navigate('/superadmin/log')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
            </div>
             <div className="space-y-6 flex-1 overflow-y-auto">
               {recentActivities.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                   <Activity size={28} className="mb-2 opacity-30" />
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Recent Activity</p>
                 </div>
               ) : recentActivities.map((act, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                     <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0", act.color || "bg-blue-50 text-blue-600")}>
                        {act.icon ? <act.icon size={18} /> : <Activity size={18} />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-slate-900 leading-none mb-1">{act.title}</h4>
                        <p className="text-[11px] text-slate-400 font-medium">{act.desc || act.description || ""}</p>
                     </div>
                     <span className="text-[10px] font-bold text-slate-300 shrink-0">{act.time}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

// --- UTILITY COMPONENTS ---

function HomeStatCard({ label, value, trend, icon: Icon, color, up, loading, onClick, viewAllLabel, viewAllPath }) {
  const navigate = useNavigate();
  const iconBg = {
    blue:    "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple:  "bg-purple-50 text-purple-600",
    amber:   "bg-amber-50 text-amber-600",
  };
  const viewAllColor = {
    blue:    "text-blue-600 hover:text-blue-700",
    emerald: "text-emerald-600 hover:text-emerald-700",
    purple:  "text-purple-600 hover:text-purple-700",
    amber:   "text-amber-600 hover:text-amber-700",
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col transition-all hover:shadow-md group">
      {/* Main Card Body */}
      <div onClick={onClick} className="flex items-center gap-4 p-6 cursor-pointer">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0", iconBg[color])}>
          <Icon size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
          {loading
            ? <div className="h-6 w-20 bg-slate-100 animate-pulse rounded-md" />
            : <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</h4>
          }
          <div className="flex items-center gap-1.5 mt-2">
            {up
              ? <ArrowUpRight size={12} className="text-emerald-500" />
              : <ArrowDownRight size={12} className="text-rose-500" />
            }
            <span className="text-[10px] font-bold text-slate-400 truncate">{trend}</span>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
      </div>
      {/* View All Link */}
      {viewAllLabel && viewAllPath && (
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            const isEmp = window.location.pathname.startsWith('/employee/');
            const target = isEmp ? viewAllPath.replace(/^\/superadmin\//, '/employee/') : viewAllPath;
            navigate(target); 
          }}
          className={cn(
            "flex items-center justify-between px-6 py-3 border-t border-slate-50 text-xs font-bold transition-colors rounded-b-3xl hover:bg-slate-50",
            viewAllColor[color]
          )}
        >
          <span>{viewAllLabel}</span>
          <ArrowUpRight size={13} className="rotate-45" />
        </button>
      )}
    </div>
  );
}

function MiniMetric({ label, value, color = "text-slate-900" }) {
  return (
    <div className="flex flex-col">
       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
       <span className={cn("text-lg font-black tracking-tight", color)}>{value}</span>
    </div>
  );
}
