import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { fetchBookingOverviewStats } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...c) => c.filter(Boolean).join(" ");

export default function BookingOverview() {
  const [data, setData] = useState({
    summary: {
      todayLeads: 0,
      weekLeads: 0,
      monthLeads: 0,
      todayBookings: 0,
      weekBookings: 0,
      monthBookings: 0
    },
    funnel: [],
    recentLeads: [],
    trends: [],
    distributions: {
      sources: [],
      status: []
    },
    bookingsValue: 0,
    topLocations: []
  });
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Booking & Leads Overview - Roomhy Super Admin",
    description: "Track leads, bookings, conversion funnel, and locations with database-driven analytics.",
    canonical: "https://roomhy.com/superadmin/booking"
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchBookingOverviewStats();
        if (res.success) {
          setData(res);
        }
      } catch (error) {
        console.error("Error fetching booking overview stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const { summary, funnel, recentLeads, trends, distributions, bookingsValue, topLocations } = data;

  const totalLeads = summary.monthLeads || 0;
  const totalBookings = summary.monthBookings || 0;
  
  // Calculate conversion rate dynamically: totalBookings / totalLeads
  const rawConvRate = totalLeads > 0 ? (totalBookings / totalLeads) * 100 : 0;
  const convRateStr = `${rawConvRate.toFixed(2)}%`;

  const statusData = distributions?.status || [];

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Booking & Leads Overview</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Track your leads, bookings and conversion performance.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#CBD3D9] px-3.5 py-1.5 rounded-[8px] shadow-xs text-[13px] font-semibold text-[#10242A]">
          <Calendar size={14} className="text-[#0E7C86]" />
          <span>Live Database Metrics</span>
        </div>
      </div>

      {/* 6 STAT CARDS (No Icons) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Today Leads",      val: (summary.todayLeads || 0).toLocaleString() },
          { label: "Weekly Leads",     val: (summary.weekLeads || 0).toLocaleString() },
          { label: "Monthly Leads",    val: (summary.monthLeads || 0).toLocaleString() },
          { label: "Today Bookings",   val: (summary.todayBookings || 0).toLocaleString() },
          { label: "Weekly Bookings",  val: (summary.weekBookings || 0).toLocaleString() },
          { label: "Monthly Bookings", val: (summary.monthBookings || 0).toLocaleString() },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{c.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{c.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* TABLES ROW */}
      <div className="grid grid-cols-12 gap-4">
        {/* Recent Leads Card */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-[#10242A]">Recent Leads</h3>
          </div>
          {recentLeads.length === 0 ? (
            <div className="w-full py-10 flex items-center justify-center text-[13px] text-[#4A5961]">
              No Data Available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#E1E6EA]">
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Lead Name</th>
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Location</th>
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Source</th>
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Budget</th>
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Created On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                  {recentLeads.map((l, i) => (
                    <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-2.5 pl-2 font-medium text-[#10242A]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {l.name ? l.name.split(' ').map(n=>n[0]).join('') : 'UN'}
                          </div>
                          <span className="font-semibold text-[#10242A]">{l.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-[#4A5961]">{l.loc}</td>
                      <td className="py-2.5 font-semibold text-[#10242A]">{l.src}</td>
                      <td className="py-2.5 font-semibold text-[#10242A]">{l.budget}</td>
                      <td className="py-2.5">
                        <span className="bg-[#E6F4F5] text-[#0E7C86] text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center">{l.status}</span>
                      </td>
                      <td className="py-2.5 pr-2 text-right text-[#4A5961] text-[12px]">{l.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Performing Locations */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-[#10242A]">Top Performing Locations</h3>
          </div>
          {topLocations.length === 0 ? (
            <div className="w-full flex-1 flex items-center justify-center text-[13px] text-[#4A5961] py-10">
              No Data Available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E1E6EA]">
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">#</th>
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Location</th>
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Leads</th>
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Bookings</th>
                    <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                  {topLocations.map((t, i) => (
                    <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-2.5 pl-2 text-[#708088] font-semibold">{i+1}</td>
                      <td className="py-2.5 font-semibold text-[#10242A] truncate max-w-[140px]">{t.loc}</td>
                      <td className="py-2.5 text-center text-[#4A5961]">{t.leads}</td>
                      <td className="py-2.5 text-center text-[#4A5961]">{t.bookings}</td>
                      <td className="py-2.5 pr-2 text-right font-semibold text-[#0E7C86]">{t.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MAIN ROW: Chart + Conversion + Funnel */}
      <div className="grid grid-cols-12 gap-4">
        {/* Leads vs Bookings Trend */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col h-[360px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-[#10242A]">Leads vs Bookings Trend</h3>
          </div>
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#0E7C86]"/><span className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Leads</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/><span className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Bookings</span></div>
          </div>
          <div className="flex-1 min-h-0">
            {trends.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#4A5961] bg-[#F4F6F8] rounded-[8px]">
                No Data Available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0E7C86" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0E7C86" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}} dy={8}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}} dx={-8}/>
                  <Tooltip/>
                  <Area type="monotone" dataKey="leads" stroke="#0E7C86" strokeWidth={2.5} fill="url(#gLeads)" dot={{fill:'#0E7C86',r:3}}/>
                  <Area type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2.5} fill="none" dot={{fill:'#10B981',r:3}}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col items-center h-[360px]">
          <div className="self-start mb-4">
            <h3 className="text-[15px] font-bold text-[#10242A]">Conversion Rate %</h3>
          </div>
          <div className="relative flex items-center justify-center my-auto" style={{width:180,height:160}}>
            {totalLeads === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#4A5961] bg-[#F4F6F8] rounded-[8px]">
                No Data Available
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{name:'r',value:rawConvRate,fill:'#0E7C86'}]} startAngle={180} endAngle={0}>
                    <RadialBar background dataKey="value" cornerRadius={8}/>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                  <p className="text-xl font-bold text-[#10242A]">{convRateStr}</p>
                  <p className="text-[10px] font-semibold text-[#4A5961] uppercase tracking-wider">Conversion Rate</p>
                </div>
                <div className="absolute bottom-0 left-2 text-[9px] font-bold text-[#708088]">0%</div>
                <div className="absolute bottom-0 right-2 text-[9px] font-bold text-[#708088]">100%</div>
              </>
            )}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col h-[360px]">
          <div className="mb-3">
            <h3 className="text-[15px] font-bold text-[#10242A]">Conversion Funnel</h3>
          </div>
          {/* Visual Funnel */}
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            {funnel.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#4A5961] bg-[#F4F6F8] rounded-[8px]">
                No Data Available
              </div>
            ) : (
              funnel.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex justify-center" style={{width: '100%'}}>
                    <div
                      className="flex items-center justify-between px-4 rounded-[8px] transition-all"
                      style={{
                        backgroundColor: f.color,
                        width: `${Math.max(45, Math.min(100, f.w || 0))}%`,
                        height: 34,
                        opacity: 0.85 + i * 0.03,
                      }}
                    >
                      <span className="text-white text-[11px] font-bold whitespace-nowrap mr-2">{f.label}</span>
                      <span className="text-white text-[11px] font-bold whitespace-nowrap">{f.val.toLocaleString()}{f.pct ? ` (${f.pct})` : ''}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {funnel.length > 0 && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#E1E6EA]">
              <span className="text-[12px] font-semibold text-[#4A5961]">Overall Conversion Rate</span>
              <span className="text-[15px] font-bold text-[#0E7C86]">{convRateStr}</span>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ROW: 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lead Status */}
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Lead Status</h4>
              <span className="text-[11px] text-[#708088] font-medium">All Time</span>
            </div>
            {statusData.length === 0 ? (
              <div className="h-20 flex items-center justify-center text-[11px] font-semibold text-[#4A5961] bg-[#F4F6F8] rounded-[8px]">
                No Data Available
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div style={{width:70,height:70}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} innerRadius={20} outerRadius={32} paddingAngle={3} dataKey="value" stroke="none">
                        {statusData.map((e,idx)=><Cell key={idx} fill={e.color}/>)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {statusData.map(s=>(
                    <div key={s.name} className="flex justify-between text-[11px] font-semibold">
                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:s.color}}/><span className="text-[#4A5961] truncate max-w-[60px]">{s.name}</span></div>
                      <span className="text-[#10242A]">{s.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Avg. Response Time</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">No Data Available</h3>
          </div>
        </div>

        {/* Bookings Value */}
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Bookings Value</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">
              {bookingsValue > 0 ? `₹${bookingsValue.toLocaleString('en-IN')}` : "0"}
            </h3>
          </div>
        </div>

        {/* Top Converting Agents */}
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Top Converting Agents</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">No Data Available</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
