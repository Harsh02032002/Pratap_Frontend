import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { 
  TrendingUp, Users, Calendar, MapPin, Building
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReportsOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/superadmin/reports/overview");
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load reports overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = data?.summary || {
    totalProperties: 0,
    totalTenants: 0,
    occupancyRate: 0,
    monthlyRevenue: 0,
    netProfit: 0,
    growthRate: 0
  };
  const charts = data?.charts || {};
  
  const activeRevenueData = charts.revenueOverviewData || [];
  const activeOccupancyData = charts.occupancyData || [
    { name: "Occupied", value: 0, color: "#0E7C86", percent: "0%" },
    { name: "Vacant", value: 0, color: "#E1E6EA", percent: "0%" }
  ];
  const activePropertyPerformance = charts.propertyPerformance || [];
  const activeLocationWiseData = charts.locationWiseData || [];
  const activeStaffPerformance = (charts.staffPerformance || []).map(s => ({
    ...s,
    managed: s.managed ?? s.resolved ?? 0,
    leads: s.leads ?? s.tasks ?? 0,
    perf: s.perf ?? s.score ?? "0%"
  }));

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Report & Analytics Overview</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Consolidated performance dashboard across properties, bookings, and revenue streams.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#CBD3D9] px-3.5 py-1.5 rounded-[8px] shadow-xs text-[13px] font-semibold text-[#10242A]">
          <Calendar className="w-4 h-4 text-[#0E7C86]" />
          <span>Last 30 Days</span>
        </div>
      </div>

      {/* TOP ROW: 6 STATISTICAL CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
         <ReportStatCard label="Total Properties" val={summary.totalProperties} trend="+12.6%" />
         <ReportStatCard label="Total Tenants" val={summary.totalTenants} trend="+9.8%" />
         <ReportStatCard label="Occupancy Rate" val={`${summary.occupancyRate}%`} trend="+4.3%" />
         <ReportStatCard label="Monthly Revenue" val={`₹${Number(summary.monthlyRevenue || 0).toLocaleString('en-IN')}`} trend="+14.7%" />
         <ReportStatCard label="Net Profit" val={`₹${Number(summary.netProfit || 0).toLocaleString('en-IN')}`} trend="+18.2%" />
         <ReportStatCard label="Growth Rate" val={`${summary.growthRate}%`} trend="+3.6%" />
      </div>

      {/* MIDDLE ROW: REVENUE, OCCUPANCY, PERFORMANCE */}
      <div className="grid grid-cols-12 gap-4">
         {/* Revenue Overview */}
         <div className="col-span-12 lg:col-span-5 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col h-[360px]">
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-[15px] font-bold text-[#10242A]">Revenue Overview</h3>
               <span className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-2.5 py-1 text-[11px] font-semibold text-[#4A5961]">Last 6 Months</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
               <div className="w-2.5 h-2.5 rounded-full bg-[#0E7C86]" />
               <span className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Revenue (₹ Lakhs)</span>
            </div>
            <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeRevenueData}>
                     <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#0E7C86" stopOpacity={0.15}/>
                           <stop offset="95%" stopColor="#0E7C86" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 10, fontWeight: 600}} dy={8} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 10, fontWeight: 600}} dx={-8} tickFormatter={(v) => `₹${v}L`} />
                     <Tooltip />
                     <Area type="monotone" dataKey="val" stroke="#0E7C86" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" dot={{fill: '#0E7C86', r: 3}} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Occupancy Rate Trend */}
         <div className="col-span-12 lg:col-span-3 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col items-center h-[360px]">
            <div className="flex items-center justify-between w-full mb-3">
               <h3 className="text-[15px] font-bold text-[#10242A]">Occupancy Rate</h3>
               <span className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-2.5 py-1 text-[11px] font-semibold text-[#4A5961]">Real-Time</span>
            </div>
            <div className="relative h-40 w-40 flex items-center justify-center mb-3">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={activeOccupancyData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                        {activeOccupancyData.map((e, idx) => <Cell key={idx} fill={e.color || '#0E7C86'} />)}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-[#10242A]">{summary.occupancyRate}%</p>
                  <p className="text-[9px] font-bold text-[#4A5961] uppercase tracking-wider mt-0.5">Occupancy Rate</p>
               </div>
            </div>
            <div className="w-full space-y-2 mt-auto">
               {activeOccupancyData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}} />
                        <span className="text-[11px] font-semibold text-[#4A5961]">{item.name}</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-[#10242A]">{item.value}%</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Property Performance */}
         <div className="col-span-12 lg:col-span-4 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col h-[360px] overflow-hidden">
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-[15px] font-bold text-[#10242A]">Property Performance <span className="text-[#4A5961] text-xs font-normal ml-1">(Top 5)</span></h3>
            </div>
            <div className="overflow-x-auto flex-1">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Property Name</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">City</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Occupancy</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Revenue</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                     {activePropertyPerformance.map((p, i) => (
                        <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                           <td className="py-2.5 pl-2 font-semibold text-[#10242A] truncate max-w-[140px]">{p.name}</td>
                           <td className="py-2.5 text-center text-[#4A5961]">{p.loc}</td>
                           <td className="py-2.5 text-center font-semibold text-emerald-600">{p.occupancy}</td>
                           <td className="py-2.5 pr-2 text-right font-semibold text-[#0E7C86]">{p.revenue}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* FOOTER SECTION: STAFF & INSIGHTS */}
      <div className="grid grid-cols-12 gap-4">
         {/* Staff Performance Reports */}
         <div className="col-span-12 lg:col-span-7 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-[15px] font-bold text-[#10242A]">Staff Performance Overview</h3>
            </div>
            <div className="overflow-x-auto flex-1">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Staff Name</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Role</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Managed</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Leads</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Performance</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                     {activeStaffPerformance.map((s, i) => (
                        <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                           <td className="py-2.5 pl-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-7 h-7 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-[10px]">{(s.name || "E").split(' ').map(n=>n[0]).join('')}</div>
                                 <span className="font-semibold text-[#10242A]">{s.name}</span>
                              </div>
                           </td>
                           <td className="py-2.5 text-[#4A5961]">{s.role}</td>
                           <td className="py-2.5 text-center font-semibold text-[#10242A]">{s.managed}</td>
                           <td className="py-2.5 text-center font-semibold text-[#10242A]">{s.leads}</td>
                           <td className="py-2.5 pr-2 text-right font-semibold text-emerald-600">{s.perf}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Key Insights */}
         <div className="col-span-12 lg:col-span-5 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#10242A] mb-3">Platform Intelligence</h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-[#F4F6F8] rounded-[12px] p-3.5 border border-[#E1E6EA] flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center mb-2"><Users size={16} /></div>
                    <p className="text-[11px] font-semibold text-[#4A5961] leading-tight">
                       Occupancy rate verified at {summary.occupancyRate}% globally.
                    </p>
                 </div>
                 <div className="bg-[#F4F6F8] rounded-[12px] p-3.5 border border-[#E1E6EA] flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center mb-2"><MapPin size={16} /></div>
                    <p className="text-[11px] font-semibold text-[#4A5961] leading-tight">
                       {activeLocationWiseData[0]?.name ? `${activeLocationWiseData[0].name} is top performing location.` : "No top location data yet."}
                    </p>
                 </div>
                 <div className="bg-[#F4F6F8] rounded-[12px] p-3.5 border border-[#E1E6EA] flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center mb-2"><Building size={16} /></div>
                    <p className="text-[11px] font-semibold text-[#4A5961] leading-tight">
                       {summary.totalProperties} properties active in core database.
                    </p>
                 </div>
                 <div className="bg-[#F4F6F8] rounded-[12px] p-3.5 border border-[#E1E6EA] flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center mb-2"><TrendingUp size={16} /></div>
                    <p className="text-[11px] font-semibold text-[#4A5961] leading-tight">
                       Revenue flow tracking active across cities.
                    </p>
                 </div>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function ReportStatCard({ label, val, trend }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
       <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
       <div className="mt-2">
         <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{val}</h3>
       </div>
    </div>
  );
}
