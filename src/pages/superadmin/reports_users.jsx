import React, { useState, useEffect } from "react";
import { 
  Users, ArrowUpRight, ArrowDownRight, Globe, ChevronRight, 
  Activity, TrendingUp, UserPlus, UserCheck
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReportsUsers() {
  const [dist, setDist] = useState([0, 0, 0]);

  useEffect(() => {
    fetchJson("/api/superadmin/user-distribution")
      .then((res) => {
        if (res?.success && Array.isArray(res.distribution?.data)) {
          setDist(res.distribution.data);
        }
      })
      .catch((err) => console.error("Failed to load user distribution:", err));
  }, []);

  const totalUsers = dist.reduce((a, b) => a + (Number(b) || 0), 0);
  const pct = (val) => (totalUsers > 0 ? `${Math.round((val / totalUsers) * 100)}%` : "0%");

  const userTypes = [
    { name: "Tenants", value: dist[0] || 0, color: "#3B82F6", percent: pct(dist[0] || 0) },
    { name: "Owners", value: dist[1] || 0, color: "#10B981", percent: pct(dist[1] || 0) },
    { name: "Staff", value: dist[2] || 0, color: "#6366F1", percent: pct(dist[2] || 0) },
  ];

  const growthData = [
    { name: "Current", newUsers: totalUsers, activeUsers: totalUsers }
  ];

  return (
    <div className="p-8 space-y-10 bg-[#F8FAFC] min-h-full">
      <div className="flex flex-col gap-2">
         <h1 className="text-4xl font-bold text-slate-800 tracking-tight leading-none">User Demographic Intelligence</h1>
         <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase mt-2">
            <span>Reports</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600">User Growth Analytics</span>
         </div>
      </div>

      <p className="text-sm font-bold text-slate-400">Comprehensive analysis of user acquisition trends, retention velocity and platform demographic distribution.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCardLarge label="Total Ecosystem" value={String(totalUsers)} trend="Scoped Users" up icon={Users} color="blue" />
        <StatCardLarge label="Tenants" value={String(dist[0] || 0)} trend="Active Tenants" up icon={UserPlus} color="indigo" />
        <StatCardLarge label="Owners" value={String(dist[1] || 0)} trend="Verified Owners" up icon={UserCheck} color="green" />
        <StatCardLarge label="Staff" value={String(dist[2] || 0)} trend="Assigned Staff" up icon={Globe} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Acquisition Velocity</h3>
            </div>
            <div className="flex-1 min-h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} />
                     <YAxis axisLine={false} tickLine={false} />
                     <Tooltip />
                     <Area type="monotone" dataKey="newUsers" stroke="#3B82F6" strokeWidth={5} fillOpacity={0.1} fill="#3B82F6" />
                     <Area type="monotone" dataKey="activeUsers" stroke="#10B981" strokeWidth={5} fill="transparent" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-10">User Distribution</h3>
            <div className="relative h-64 w-full flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={userTypes} dataKey="value" innerRadius={80} outerRadius={110} paddingAngle={8} stroke="none">
                        {userTypes.map((c, i) => <Cell key={i} fill={c.color} />)}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-4xl font-bold text-slate-800 tracking-tighter">{totalUsers}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Total Users</p>
               </div>
            </div>
            <div className="mt-10 space-y-6">
               {userTypes.map(c => (
                 <div key={c.name} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-4">
                       <div className="w-3 h-3 rounded-full" style={{backgroundColor: c.color}} />
                       <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-bold text-slate-400">{c.value}</span>
                       <span className="text-sm font-bold text-slate-800">{c.percent}</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <InsightCard icon={TrendingUp} title="Total Users" value={String(totalUsers)} sub="Scoped ecosystem" color="blue" />
         <InsightCard icon={UserCheck} title="Verified Owners" value={String(dist[1] || 0)} sub="Approved property owners" color="green" />
         <InsightCard icon={Activity} title="Active Tenants" value={String(dist[0] || 0)} sub="Scoped tenants" color="red" />
      </div>
    </div>
  );
}

function StatCardLarge({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-600 shadow-blue-200", 
    indigo: "bg-indigo-600 shadow-indigo-200", 
    green: "bg-emerald-600 shadow-emerald-200", 
    orange: "bg-amber-600 shadow-amber-200" 
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

function InsightCard({ icon: Icon, title, value, sub, color }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-emerald-600 bg-emerald-50",
    red: "text-rose-600 bg-rose-50"
  };
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/50 flex items-center gap-6 group hover:bg-slate-800 transition-all cursor-default">
       <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", colors[color])}>
          <Icon className="w-7 h-7" />
       </div>
       <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 group-hover:text-slate-300 transition-colors">{title}</p>
          <p className="text-2xl font-bold text-slate-800 group-hover:text-white transition-colors">{value}</p>
          <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">{sub}</p>
       </div>
    </div>
  );
}
