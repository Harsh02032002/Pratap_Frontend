import React, { useState, useEffect, useMemo } from "react";
import { Ticket, Clock, History, CheckCircle2, AlertCircle, ChevronRight, TrendingUp, Calendar, Star, ArrowDownRight, Building2 } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...c) => c.filter(Boolean).join(" ");
const iconColors = { blue:"text-[#0E7C86] bg-[#E6F4F5]", emerald:"text-emerald-700 bg-emerald-50", amber:"text-amber-700 bg-amber-50", rose:"text-rose-700 bg-rose-50" };

export default function SupportOverview() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchJson("/api/superadmin/support/tickets");
        if (res && res.success) {
          setTickets(res.tickets || []);
        }
      } catch (err) {
        console.error("Failed to load support tickets:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => ['Open', 'Assigned'].includes(t.status)).length;
    const inProg = tickets.filter(t => ['In Progress', 'Waiting For Response'].includes(t.status)).length;
    const resolved = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
    const overdue = tickets.filter(t => t.sla_breached && !['Resolved', 'Closed'].includes(t.status)).length;
    const tenantComplaints = tickets.filter(t => t.raised_by_role === 'tenant').length;
    const ownerComplaints = tickets.filter(t => t.raised_by_role === 'property_owner').length;
    const pendingHighPriority = tickets.filter(t => t.priority === 'High' && !['Resolved', 'Closed'].includes(t.status)).length;

    const resolvedTicketsList = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status));
    let avgResolutionTime = "0 Days";
    if (resolvedTicketsList.length > 0) {
      let totalMs = 0;
      resolvedTicketsList.forEach(tk => {
        const end = tk.resolved_at || tk.closed_at || tk.updated_at || new Date();
        totalMs += (new Date(end) - new Date(tk.created_at || new Date()));
      });
      const avgHours = (totalMs / resolvedTicketsList.length) / (1000 * 60 * 60);
      if (avgHours < 24) {
        avgResolutionTime = `${Math.max(0, Math.round(avgHours))} Hours`;
      } else {
        avgResolutionTime = `${(avgHours / 24).toFixed(1)} Days`;
      }
    }

    const catMap = {
      "Maintenance": 0,
      "Payment & Billing": 0,
      "Property Related": 0,
      "Amenities": 0,
      "General Inquiry": 0,
      "Others": 0
    };
    tickets.forEach(t => {
      const type = t.ticket_type;
      if (['Property Issue', 'Tenant Complaint', 'Owner Complaint'].includes(type)) catMap["Maintenance"]++;
      else if (['Payment Issue', 'Refund Request'].includes(type)) catMap["Payment & Billing"]++;
      else if (['Move-in Issue', 'Booking Dispute'].includes(type)) catMap["Property Related"]++;
      else if (['Technical Issue'].includes(type)) catMap["Amenities"]++;
      else if (['Other'].includes(type)) catMap["General Inquiry"]++;
      else catMap["Others"]++;
    });

    const categoryColors = {
      "Maintenance": "#0E7C86",
      "Payment & Billing": "#10B981",
      "Property Related": "#F59E0B",
      "Amenities": "#6366F1",
      "General Inquiry": "#EC4899",
      "Others": "#94A3B8"
    };

    const computedCategoryData = Object.entries(catMap).map(([name, val]) => ({
      name,
      value: val,
      color: categoryColors[name] || "#94A3B8",
      pct: total > 0 ? `${((val / total) * 100).toFixed(1)}%` : "0.0%"
    }));

    let tenantSrc = 0, ownerSrc = 0, systemSrc = 0;
    tickets.forEach(t => {
      if (t.raised_by_role === 'tenant') tenantSrc++;
      else if (t.raised_by_role === 'property_owner') ownerSrc++;
      else systemSrc++;
    });

    const computedSourceData = [
      { name: "Tenant", value: tenantSrc, color: "#0E7C86", pct: total > 0 ? `${((tenantSrc / total) * 100).toFixed(1)}%` : "0.0%" },
      { name: "Owner", value: ownerSrc, color: "#10B981", pct: total > 0 ? `${((ownerSrc / total) * 100).toFixed(1)}%` : "0.0%" },
      { name: "System/Other", value: systemSrc, color: "#F59E0B", pct: total > 0 ? `${((systemSrc / total) * 100).toFixed(1)}%` : "0.0%" }
    ];

    const computedMidMetrics = [
      { label: "All Tickets",         val: String(total), icon: Ticket,       c: "blue"   },
      { label: "Tenants Complaints",  val: String(tenantComplaints), icon: Building2, c: "emerald"},
      { label: "Owners Complaints",   val: String(ownerComplaints), icon: Building2,  c: "amber"  },
      { label: "Open",                val: String(open),   icon: Clock,        c: "blue"   },
      { label: "In Progress",         val: String(inProg),   icon: History,      c: "amber"  },
      { label: "Resolved",            val: String(resolved), icon: CheckCircle2, c: "emerald"},
      { label: "Overdue",             val: String(overdue),    icon: AlertCircle,  c: "rose"   },
    ];

    const computedRecentTickets = [...tickets]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(t => ({
        id: t.ticket_id || `#TK-${t._id.toString().substring(0, 4)}`,
        type: t.raised_by_role === 'tenant' ? 'Tenant' : t.raised_by_role === 'property_owner' ? 'Owner' : 'Other',
        raisedBy: t.raised_by_name || 'User',
        category: t.ticket_type,
        priority: t.priority === 'Critical' ? 'High' : t.priority,
        status: t.status,
        assignee: t.assigned_admin_name || 'Unassigned',
        date: new Date(t.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
      }));

    // Last 7 days trend
    const now = new Date();
    const trendData = [];
    const sparkData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayTks = tickets.filter(t => {
        if (!t.created_at) return false;
        const dt = new Date(t.created_at);
        return dt >= d && dt < nextD;
      });
      const dayResolved = dayTks.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
      const dayOverdue = dayTks.filter(t => t.sla_breached && !['Resolved', 'Closed'].includes(t.status)).length;
      trendData.push({ name: label, opened: dayTks.length, resolved: dayResolved, overdue: dayOverdue });
      sparkData.push({ v: dayTks.length });
    }

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const slaMetCount = tickets.filter(t => !t.sla_breached).length;
    const slaBreachedCount = tickets.filter(t => t.sla_breached).length;
    const slaMetPct = total > 0 ? `${Math.round((slaMetCount / total) * 100)}%` : "0%";
    const slaBreachedPct = total > 0 ? `${100 - Math.round((slaMetCount / total) * 100)}%` : "0%";

    return {
      totalTickets: String(total),
      openTickets: String(open),
      inProgress: String(inProg),
      resolvedTickets: String(resolved),
      overdueTickets: String(overdue),
      avgResolutionTime,
      categoryData: computedCategoryData,
      sourceData: computedSourceData,
      midMetrics: computedMidMetrics,
      recentTickets: computedRecentTickets,
      trendData,
      sparkData,
      resolutionRate,
      slaMetCount,
      slaBreachedCount,
      slaMetPct,
      slaBreachedPct,
      pendingHighPriorityCount: pendingHighPriority
    };
  }, [tickets]);

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Support Overview</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Track, manage and resolve all tenant and owner complaints efficiently.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#CBD3D9] px-3 py-1.5 rounded-[8px] shadow-xs text-[13px] font-medium text-[#10242A]">
          <Calendar size={14} className="text-[#0E7C86]" />
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* 6 STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Tickets",        val: stats.totalTickets,      trend: "Live",   sub: "total volume" },
          { label: "Open Tickets",         val: stats.openTickets,       trend: "Active", sub: "open queue"   },
          { label: "In Progress",          val: stats.inProgress,        trend: "Active", sub: "being worked" },
          { label: "Resolved Tickets",     val: stats.resolvedTickets,   trend: "Closed", sub: "completed"    },
          { label: "Overdue Tickets",      val: stats.overdueTickets,    trend: "SLA",    sub: "breached"     },
          { label: "Avg. Resolution Time", val: stats.avgResolutionTime, trend: "Avg",    sub: "turnaround"   },
        ].map((c,i)=>(
          <div key={i} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{c.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{loading ? "..." : c.val}</h3>
              <p className="text-[11px] text-[#708088] mt-1">{c.trend} · {c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN ROW: Trend + Category Donut + Source Donut */}
      <div className="grid grid-cols-12 gap-4">
        {/* Tickets Trend */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col" style={{height:340}}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-[#10242A]">Tickets Trend</h3>
            <select className="bg-white border border-[#CBD3D9] rounded-[8px] px-2.5 py-1 text-[12px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"><option>This Week</option></select>
          </div>
          <div className="flex items-center gap-5 mb-3">
            {[{c:"bg-[#0E7C86]",l:"Opened"},{c:"bg-emerald-500",l:"Resolved"},{c:"bg-rose-500",l:"Overdue"}].map(l=>(
              <div key={l.l} className="flex items-center gap-1.5"><div className={cn("w-2 h-2 rounded-full",l.c)}/><span className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">{l.l}</span></div>
            ))}
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}} dy={8}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}} dx={-8}/>
                <Tooltip/>
                <Line type="monotone" dataKey="opened"  stroke="#0E7C86" strokeWidth={2.5} dot={{fill:'#0E7C86',r:3}}/>
                <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2.5} dot={{fill:'#10B981',r:3}}/>
                <Line type="monotone" dataKey="overdue"  stroke="#EF4444" strokeWidth={2.5} dot={{fill:'#EF4444',r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tickets by Category */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col items-center" style={{height:340}}>
          <h3 className="text-[15px] font-bold text-[#10242A] mb-3 self-start">Tickets by Category</h3>
          <div className="relative flex items-center justify-center mb-3" style={{width:130,height:130}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={stats.categoryData} innerRadius={42} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">{stats.categoryData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-lg font-bold text-[#10242A]">{stats.totalTickets}</p>
              <p className="text-[8px] font-bold text-[#4A5961] uppercase tracking-wider">Total Tickets</p>
            </div>
          </div>
          <div className="w-full space-y-1.5 mt-auto">
            {stats.categoryData.map(c=>(
              <div key={c.name} className="flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:c.color}}/><span className="text-[#4A5961] truncate max-w-[110px]">{c.name}</span></div>
                <span className="text-[#10242A] font-bold">{c.value} <span className="text-[#4A5961] font-normal">({c.pct})</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets by Source */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col items-center" style={{height:340}}>
          <h3 className="text-[15px] font-bold text-[#10242A] mb-3 self-start">Tickets by Source</h3>
          <div className="relative flex items-center justify-center mb-3" style={{width:130,height:130}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={stats.sourceData} innerRadius={42} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">{stats.sourceData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-lg font-bold text-[#10242A]">{stats.totalTickets}</p>
              <p className="text-[8px] font-bold text-[#4A5961] uppercase tracking-wider">Total Tickets</p>
            </div>
          </div>
          <div className="w-full space-y-2 mt-auto">
            {stats.sourceData.map(s=>(
              <div key={s.name} className="flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor:s.color}}/><span className="text-[#4A5961]">{s.name}</span></div>
                <span className="text-[#10242A] font-bold">{s.value} <span className="text-[#4A5961] font-normal">({s.pct})</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MID METRICS BAR — 7 inline metrics (NO ICONS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stats.midMetrics.map((m,i)=>(
          <div key={i} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{m.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{m.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* TABLES ROW */}
      <div className="grid grid-cols-12 gap-4">
        {/* Recent Tickets */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-[#10242A]">Recent Tickets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Ticket ID</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Type</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Raised By</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Category</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Priority</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Assignee</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Created On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {stats.recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#4A5961] text-[13px]">No tickets found.</td>
                  </tr>
                ) : stats.recentTickets.map((t,i)=>(
                  <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 pl-2 font-bold text-[#0E7C86]">{t.id}</td>
                    <td className="py-2.5">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold", t.type==="Tenant"?"bg-[#E0F2FE] text-[#0369A1]":"bg-[#DDF3E4] text-[#14532D]")}>{t.type}</span>
                    </td>
                    <td className="py-2.5 font-semibold text-[#10242A]">{t.raisedBy}</td>
                    <td className="py-2.5 text-[#4A5961]">{t.category}</td>
                    <td className="py-2.5">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold", t.priority==="High"||t.priority==="Critical"?"bg-[#FDE8E8] text-[#991B1B]":t.priority==="Med"||t.priority==="Medium"?"bg-[#FDEBD0] text-[#7A3E00]":"bg-[#E8EDF1] text-[#4A5961]")}>{t.priority}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold", t.status==="Open"?"bg-[#E0F2FE] text-[#0369A1]":t.status==="In Progress"?"bg-[#FDEBD0] text-[#7A3E00]":"bg-[#DDF3E4] text-[#14532D]")}>{t.status}</span>
                    </td>
                    <td className="py-2.5 font-medium text-[#4A5961]">{t.assignee}</td>
                    <td className="py-2.5 pr-2 text-right text-[#4A5961] text-[12px] whitespace-nowrap">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issues Resolutions Tracking */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-[#10242A]">Issues Resolutions Tracking</h3>
            <select className="bg-white border border-[#CBD3D9] rounded-[8px] px-2 py-1 text-[11px] font-medium text-[#10242A] outline-none cursor-pointer"><option>This Week</option></select>
          </div>
          <div className="relative flex items-center justify-center mb-3" style={{width:120,height:120,alignSelf:'center'}}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "Rate", value: stats.resolutionRate, fill: "#0E7C86" }]} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={8}/>
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xl font-bold text-[#10242A]">{stats.resolutionRate}%</p>
              <p className="text-[9px] font-bold text-[#4A5961] uppercase tracking-wider">Resolution Rate</p>
            </div>
          </div>
          <div className="space-y-1.5 flex-1">
            {[
              {l:"Total Issues Raised",v:stats.totalTickets},{l:"Total Resolved",v:stats.resolvedTickets},
              {l:"Resolution Rate",v:`${stats.resolutionRate}%`},{l:"Avg. Resolution Time",v:stats.avgResolutionTime},
              {l:"SLA Met",v:`${stats.slaMetCount} (${stats.slaMetPct})`},{l:"SLA Breached",v:`${stats.slaBreachedCount} (${stats.slaBreachedPct})`},
            ].map(r=>(
              <div key={r.l} className="flex items-center justify-between text-[12px] font-semibold">
                <span className="text-[#4A5961]">{r.l}</span>
                <span className="text-[#10242A] font-bold">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER ROW: 6 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Top Issue Categories */}
        <div className="col-span-2 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs">
          <h4 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider mb-3">Top Issue Categories</h4>
          <div className="space-y-2.5">
            {stats.categoryData.slice(0,3).map(c=>(
              <div key={c.name}>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-[#4A5961]">{c.name}</span>
                  <span className="text-[#10242A] font-bold">{c.value} ({c.pct})</span>
                </div>
                <div className="h-1.5 bg-[#F4F6F8] rounded-full overflow-hidden border border-[#E1E6EA]">
                  <div className="h-full rounded-full" style={{backgroundColor:c.color,width:c.pct}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resolution Time */}
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Resolution Time (Avg.)</p>
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none mt-2">{stats.avgResolutionTime}</h3>
            <p className="text-[11px] text-[#708088] mt-1">Live tracking</p>
          </div>
          <div className="h-[35px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sparkData}><Area type="monotone" dataKey="v" stroke="#10B981" fill="#D1FAE5" strokeWidth={1.5}/></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Performance */}
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">SLA Performance</p>
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none mt-2">{stats.slaMetPct}</h3>
            <p className="text-[11px] text-[#708088] mt-1">SLA Met</p>
          </div>
          <div className="h-[35px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sparkData}><Area type="monotone" dataKey="v" stroke="#0E7C86" fill="#E6F4F5" strokeWidth={1.5}/></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Resolution Score</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{tickets.length > 0 ? `${(stats.resolutionRate / 20).toFixed(1)} / 5` : "0.0 / 5"}</h3>
            <div className="flex items-center gap-0.5 mt-1.5">
              {[1,2,3,4,5].map(i=><Star key={i} size={11} className={tickets.length > 0 && i <= Math.round(stats.resolutionRate / 20) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}/>)}
            </div>
            <p className="text-[11px] text-[#708088] mt-1">Based on resolved tickets</p>
          </div>
        </div>

        {/* Pending High Priority */}
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Pending High Priority</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-rose-600 tracking-tight leading-none">{stats.pendingHighPriorityCount}</h3>
            <p className="text-[11px] text-[#708088] mt-1">Requires immediate attention</p>
          </div>
        </div>
      </div>
    </div>
  );
}
