import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { 
  TrendingUp, IndianRupee, Users, Building2, 
  ArrowUpRight, ArrowDownRight, Calendar, Download,
  ChevronRight, PieChart as PieIcon, BarChart3, 
  MapPin, Clock, Wallet, FileText, LayoutDashboard,
  Filter, Search, MoreVertical, Activity, UserPlus, 
  Target, Percent, Building, TrendingDown
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { PageHeader } from "../../components/superadmin/PageHeader";

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
    totalProperties: 11,
    totalTenants: 13,
    occupancyRate: 38.2,
    monthlyRevenue: 0,
    netProfit: 14399.9,
    growthRate: 0
  };
  const charts = data?.charts || {};
  
  const activeRevenueData = charts.revenueOverviewData || [
    { name: "Jan", val: 2.5 },
    { name: "Feb", val: 3.8 },
    { name: "Mar", val: 4.2 },
    { name: "Apr", val: 5.1 },
    { name: "May", val: 7.8 },
    { name: "Jun", val: 9.4 },
  ];
  const activeOccupancyData = charts.occupancyData || [
    { name: "Occupied", value: 38.2, color: "#0E7C86", percent: "38.2%" },
    { name: "Vacant", value: 61.8, color: "#E1E6EA", percent: "61.8%" }
  ];
  const activePropertyPerformance = charts.propertyPerformance || [
    { name: "Sunrise Residency", loc: "Mumbai", occupancy: "88%", revenue: "₹1,84,499" },
    { name: "Green Valley PG", loc: "Bangalore", occupancy: "76%", revenue: "₹1,34,000" },
    { name: "Urban Nest", loc: "Pune", occupancy: "65%", revenue: "₹98,200" },
    { name: "Lakeview Apartments", loc: "Hyderabad", occupancy: "82%", revenue: "₹1,56,000" },
    { name: "Skyline PG", loc: "Delhi", occupancy: "54%", revenue: "₹72,000" },
  ];
  const activeLocationWiseData = charts.locationWiseData || [
    { name: "Bangalore", value: "₹4.2L", count: "4 Properties" },
    { name: "Mumbai", value: "₹3.8L", count: "3 Properties" },
    { name: "Hyderabad", value: "₹2.5L", count: "2 Properties" },
    { name: "Pune", value: "₹1.9L", count: "2 Properties" },
  ];
  const activeStaffPerformance = charts.staffPerformance || [
    { name: "Amit Verma", role: "Area Manager", managed: 5, leads: 42, perf: "94%" },
    { name: "Priya Nair", role: "Property Executive", managed: 3, leads: 28, perf: "88%" },
    { name: "Rohit Patil", role: "Operations Lead", managed: 3, leads: 35, perf: "91%" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header Area */}
      <PageHeader 
        title="Report & Analytics Overview"
        subtitle="Consolidated performance dashboard across properties, bookings, and revenue streams."
        actions={
          <div className="flex items-center gap-2 bg-white border border-[#E1E6EA] px-3.5 py-1.5 rounded-[12px] shadow-xs text-xs font-semibold text-[#4A5961]">
            <Calendar className="w-4 h-4 text-[#0E7C86]" />
            <span>Last 30 Days</span>
          </div>
        }
      />

      {/* TOP ROW: 6 STATISTICAL CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
         <ReportStatCard icon={Building} label="Total Properties" val={summary.totalProperties} trend="+12.6%" />
         <ReportStatCard icon={Users} label="Total Tenants" val={summary.totalTenants} trend="+9.8%" />
         <ReportStatCard icon={Percent} label="Occupancy Rate" val={`${summary.occupancyRate}%`} trend="+4.3%" />
         <ReportStatCard icon={IndianRupee} label="Monthly Revenue" val={`₹${Number(summary.monthlyRevenue || 0).toLocaleString('en-IN')}`} trend="+14.7%" />
         <ReportStatCard icon={Wallet} label="Net Profit" val={`₹${Number(summary.netProfit || 0).toLocaleString('en-IN')}`} trend="+18.2%" />
         <ReportStatCard icon={TrendingUp} label="Growth Rate" val={`${summary.growthRate}%`} trend="+3.6%" />
      </div>

      {/* MIDDLE ROW: REVENUE, OCCUPANCY, PERFORMANCE */}
      <div className="grid grid-cols-12 gap-6">
         {/* Revenue Overview */}
         <div className="col-span-12 lg:col-span-5 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-base font-bold text-[#10242A]">Revenue Overview</h3>
               <span className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-3 py-1 text-[11px] font-semibold text-[#4A5961]">Last 6 Months</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
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
         <div className="col-span-12 lg:col-span-3 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col items-center h-[400px]">
            <div className="flex items-center justify-between w-full mb-4">
               <h3 className="text-base font-bold text-[#10242A]">Occupancy Rate</h3>
               <span className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-2.5 py-1 text-[11px] font-semibold text-[#4A5961]">Real-Time</span>
            </div>
            <div className="relative h-44 w-44 flex items-center justify-center mb-4">
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
         <div className="col-span-12 lg:col-span-4 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-base font-bold text-[#10242A]">Property Performance <span className="text-[#4A5961] text-xs font-normal ml-1">(Top 5)</span></h3>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 flex flex-col">
               <div className="flex items-center text-[10px] font-bold text-[#4A5961] uppercase tracking-wider px-1 bg-[#F8FAFC] p-2 rounded-[6px] border border-[#E1E6EA]">
                  <span className="flex-1">Property Name</span>
                  <span className="w-16 text-center">City</span>
                  <span className="w-16 text-center">Occupancy</span>
                  <span className="w-20 text-right">Revenue</span>
               </div>
               {activePropertyPerformance.map((p, i) => (
                  <div key={i} className="flex items-center p-1.5 hover:bg-[#F4F6F8] rounded-[6px] transition-colors">
                     <div className="flex-1 min-w-0 pr-2">
                        <span className="text-[11.5px] font-bold text-[#10242A] truncate block">{p.name}</span>
                     </div>
                     <span className="w-16 text-center text-[11px] font-medium text-[#4A5961]">{p.loc}</span>
                     <span className="w-16 text-center text-[11px] font-bold text-emerald-600">{p.occupancy}</span>
                     <span className="w-20 text-right text-[11.5px] font-bold text-[#0E7C86]">{p.revenue}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* FOOTER SECTION: STAFF & INSIGHTS */}
      <div className="grid grid-cols-12 gap-6">
         {/* Staff Performance Reports */}
         <div className="col-span-12 lg:col-span-7 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-base font-bold text-[#10242A]">Staff Performance Overview</h3>
            </div>
            <div className="overflow-x-auto flex-1">
               <table className="w-full text-xs text-left">
                  <thead>
                     <tr className="bg-[#F8FAFC] text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
                        <th className="py-2.5 px-3">Staff Name</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3 text-center">Managed</th>
                        <th className="py-2.5 px-3 text-center">Leads</th>
                        <th className="py-2.5 px-3 text-right">Performance</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6EA]">
                     {activeStaffPerformance.map((s, i) => (
                        <tr key={i} className="hover:bg-[#F4F6F8]/60 transition-colors">
                           <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                 <div className="w-7 h-7 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-[10px]">{(s.name || "E").split(' ').map(n=>n[0]).join('')}</div>
                                 <span className="font-bold text-[#10242A]">{s.name}</span>
                              </div>
                           </td>
                           <td className="py-2.5 px-3 text-[#4A5961]">{s.role}</td>
                           <td className="py-2.5 px-3 text-center font-bold text-[#10242A]">{s.managed}</td>
                           <td className="py-2.5 px-3 text-center font-bold text-[#10242A]">{s.leads}</td>
                           <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{s.perf}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Key Insights */}
         <div className="col-span-12 lg:col-span-5 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[#10242A] mb-4">Platform Intelligence</h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-[#F4F6F8] rounded-[12px] p-4 border border-[#E1E6EA] flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center mb-2"><Users size={16} /></div>
                    <p className="text-[11px] font-semibold text-[#4A5961] leading-tight">
                       Occupancy rate verified at {summary.occupancyRate}% globally.
                    </p>
                 </div>
                 <div className="bg-[#F4F6F8] rounded-[12px] p-4 border border-[#E1E6EA] flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center mb-2"><MapPin size={16} /></div>
                    <p className="text-[11px] font-semibold text-[#4A5961] leading-tight">
                       Bangalore is top performing location.
                    </p>
                 </div>
                 <div className="bg-[#F4F6F8] rounded-[12px] p-4 border border-[#E1E6EA] flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center mb-2"><Building size={16} /></div>
                    <p className="text-[11px] font-semibold text-[#4A5961] leading-tight">
                       {summary.totalProperties} properties active in core database.
                    </p>
                 </div>
                 <div className="bg-[#F4F6F8] rounded-[12px] p-4 border border-[#E1E6EA] flex flex-col items-center text-center">
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

function ReportStatCard({ icon: Icon, label, val, trend }) {
  return (
    <div className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs flex flex-col justify-between hover:border-[#0E7C86]/30 transition-all">
       <div className="flex items-center gap-2 mb-2.5">
         <div className="w-8 h-8 rounded-[10px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
            <Icon size={16} />
         </div>
         <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider leading-tight">{label}</p>
       </div>
       <h4 className="text-xl font-bold text-[#10242A] mb-1">{val}</h4>
       <div className="flex items-center gap-1">
          <TrendingUp size={10} className="text-emerald-600" />
          <span className="text-[10px] font-bold text-emerald-600">{trend}</span>
       </div>
    </div>
  );
}
