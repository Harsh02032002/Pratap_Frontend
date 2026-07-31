import React, { useState, useEffect } from "react";
import { Users, Calendar, ChevronRight, TrendingUp, ArrowUpRight, MapPin, IndianRupee, Clock, Percent } from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
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
    <div className="space-y-6">
      <PageHeader 
        title="Booking & Leads Overview"
        subtitle="Track your leads, bookings and conversion performance."
        actions={
          <div className="flex items-center gap-2 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-600">
            <Calendar size={14} className="text-slate-400" />
            <span>Live Database Metrics</span>
          </div>
        }
      />

      {/* 6 STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 mb-8">
        {[
          { icon: Users,    label: "Total Leads (Today)",      val: (summary.todayLeads || 0).toLocaleString(),      source: "Leads" },
          { icon: Users,    label: "Total Leads (This Week)",  val: (summary.weekLeads || 0).toLocaleString(),      source: "Leads" },
          { icon: Users,    label: "Total Leads (This Month)", val: (summary.monthLeads || 0).toLocaleString(),    source: "Leads" },
          { icon: Calendar, label: "Bookings (Today)",         val: (summary.todayBookings || 0).toLocaleString(),  source: "Bookings" },
          { icon: Calendar, label: "Bookings (This Week)",     val: (summary.weekBookings || 0).toLocaleString(),  source: "Bookings" },
          { icon: Calendar, label: "Bookings (This Month)",    val: (summary.monthBookings || 0).toLocaleString(), source: "Bookings" },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <c.icon size={16} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{c.label}</p>
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-1">{c.val}</h4>
            </div>
            {c.source && (
              <div className="text-[9px] font-bold text-blue-500/80 uppercase tracking-widest mt-3">Source: {c.source}</div>
            )}
          </div>
        ))}
      </div>

      {/* MAIN ROW: Chart + Conversion + Funnel */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Leads vs Bookings Trend */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col" style={{height: 400}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Leads vs Bookings Trend</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Source: Leads + Bookings</p>
            </div>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-600"/><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bookings</span></div>
          </div>
          <div className="flex-1 min-h-0">
            {trends.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-50/50 rounded-2xl">
                No Data Available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#94A3B8',fontSize:9,fontWeight:600}} dy={8}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#94A3B8',fontSize:9,fontWeight:600}} dx={-8}/>
                  <Tooltip/>
                  <Area type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2.5} fill="url(#gLeads)" dot={{fill:'#3B82F6',r:3}}/>
                  <Area type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2.5} fill="none" dot={{fill:'#10B981',r:3}}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center" style={{height: 400}}>
          <div className="self-start mb-6">
            <h3 className="text-base font-bold text-slate-900">Conversion Rate %</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Source: Leads + Bookings</p>
          </div>
          <div className="relative flex items-center justify-center" style={{width:180,height:160}}>
            {totalLeads === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-50/50 rounded-2xl">
                No Data Available
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{name:'r',value:rawConvRate,fill:'#3B82F6'}]} startAngle={180} endAngle={0}>
                    <RadialBar background dataKey="value" cornerRadius={8}/>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                  <p className="text-xl font-black text-slate-900">{convRateStr}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Conversion Rate</p>
                </div>
                <div className="absolute bottom-0 left-2 text-[9px] font-bold text-slate-300">0%</div>
                <div className="absolute bottom-0 right-2 text-[9px] font-bold text-slate-300">100%</div>
              </>
            )}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col" style={{height: 400}}>
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">Conversion Funnel</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Source: Leads + Bookings</p>
          </div>
          {/* Visual Funnel */}
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            {funnel.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-50/50 rounded-2xl">
                No Data Available
              </div>
            ) : (
              funnel.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex justify-center" style={{width: '100%'}}>
                    <div
                      className="flex items-center justify-between px-4 rounded-lg transition-all"
                      style={{
                        backgroundColor: f.color,
                        width: `${Math.max(45, Math.min(100, f.w || 0))}%`,
                        height: 36,
                        opacity: 0.85 + i * 0.03,
                      }}
                    >
                      <span className="text-white text-[11px] font-bold whitespace-nowrap mr-2">{f.label}</span>
                      <span className="text-white text-[11px] font-black whitespace-nowrap">{f.val.toLocaleString()}{f.pct ? ` (${f.pct})` : ''}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {funnel.length > 0 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
              <span className="text-[11px] font-bold text-slate-400">Overall Conversion Rate</span>
              <span className="text-base font-black text-blue-600">{convRateStr}</span>
            </div>
          )}
        </div>
      </div>

      {/* TABLES ROW */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Recent Leads */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Leads</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Source: Leads</p>
            </div>
          </div>
          {recentLeads.length === 0 ? (
            <div className="w-full py-12 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-50/50 rounded-2xl">
              No Data Available
            </div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-widest text-[9px] border-b border-slate-50">
                  <th className="text-left py-3">Lead Name</th>
                  <th className="text-left py-3">Location</th>
                  <th className="text-left py-3">Source</th>
                  <th className="text-left py-3">Budget</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-right py-3">Created On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentLeads.map((l, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[9px] shrink-0">
                          {l.name ? l.name.split(' ').map(n=>n[0]).join('') : 'UN'}
                        </div>
                        <span className="font-bold text-slate-900">{l.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400">{l.loc}</td>
                    <td className="py-3 font-bold text-slate-600">{l.src}</td>
                    <td className="py-3 font-black text-slate-900">{l.budget}</td>
                    <td className="py-3">
                      <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600")}>{l.status}</span>
                    </td>
                    <td className="py-3 text-right text-slate-300">{l.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Performing Locations */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Performing Locations</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Source: Leads + Bookings</p>
            </div>
          </div>
          {topLocations.length === 0 ? (
            <div className="w-full flex-1 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-50/50 rounded-2xl py-12">
              No Data Available
            </div>
          ) : (
            <>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest grid grid-cols-12 gap-2 px-1 mb-3">
                <span className="col-span-1">#</span>
                <span className="col-span-4">Location</span>
                <span className="col-span-2 text-center">Leads</span>
                <span className="col-span-2 text-center">Bookings</span>
                <span className="col-span-3 text-right">Conv. Rate</span>
              </div>
              <div className="space-y-4 flex-1">
                {topLocations.map((t, i) => (
                  <div key={i}>
                    <div className="grid grid-cols-12 gap-2 items-center px-1 mb-1">
                      <span className="col-span-1 text-[11px] font-bold text-slate-300">{i+1}</span>
                      <span className="col-span-4 text-[11px] font-bold text-slate-900 truncate">{t.loc}</span>
                      <span className="col-span-2 text-center text-[11px] font-bold text-slate-600">{t.leads}</span>
                      <span className="col-span-2 text-center text-[11px] font-bold text-slate-600">{t.bookings}</span>
                      <span className="col-span-3 text-right text-[11px] font-black text-blue-600">{t.rate}</span>
                    </div>
                    <div className="h-1 bg-slate-50 rounded-full overflow-hidden mx-1">
                      <div className="h-full bg-blue-500 rounded-full" style={{width: t.w}}/>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* FOOTER ROW: 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Lead Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-bold text-slate-900">Lead Status</h4>
              <span className="text-[9px] text-slate-400 font-bold">All Time</span>
            </div>
            {statusData.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-50/50 rounded-xl">
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
                    <div key={s.name} className="flex justify-between text-[9px] font-bold">
                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:s.color}}/><span className="text-slate-400 truncate max-w-[45px]">{s.name}</span></div>
                      <span className="text-slate-900">{s.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="text-[9px] font-bold text-blue-500/80 uppercase tracking-widest mt-3">Source: Leads</div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-bold text-slate-900 mb-3">Avg. Response Time</h4>
            <p className="text-xl font-black text-slate-900 mb-1">No Data Available</p>
          </div>
          <div className="text-[9px] font-bold text-blue-500/80 uppercase tracking-widest mt-3">Source: Support</div>
        </div>

        {/* Bookings Value */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-bold text-slate-900 mb-3">Bookings Value</h4>
            <p className="text-xl font-black text-slate-900 mb-1">
              {bookingsValue > 0 ? `₹${bookingsValue.toLocaleString('en-IN')}` : "No Revenue Data Available"}
            </p>
          </div>
          <div className="text-[9px] font-bold text-blue-500/80 uppercase tracking-widest mt-3">Source: Payments</div>
        </div>

        {/* Top Converting Agents */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-bold text-slate-900">Top Converting Agents</h4>
            </div>
            <div className="text-xs font-bold text-slate-400 bg-slate-50/50 rounded-xl p-4 text-center">
              No Data Available
            </div>
          </div>
          <div className="text-[9px] font-bold text-blue-500/80 uppercase tracking-widest mt-3">Source: Support</div>
        </div>
      </div>
    </div>
  );
}

