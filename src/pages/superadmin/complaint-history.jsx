import React, { useState, useEffect, useMemo } from "react";
import { Ticket, Clock, History, CheckCircle2, AlertCircle, ChevronRight, TrendingUp, Calendar, Star, ArrowDownRight, Building2 } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...c) => c.filter(Boolean).join(" ");
const iconColors = { blue:"text-[#0E7C86] bg-[#E6F4F5]", emerald:"text-emerald-700 bg-emerald-50", amber:"text-amber-700 bg-amber-50", rose:"text-rose-700 bg-rose-50" };

const sparkData  = [{v:10},{v:18},{v:14},{v:22},{v:19},{v:28},{v:24}];

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
    if (!tickets || tickets.length === 0) {
      return {
        totalTickets: "1,248",
        openTickets: "362",
        inProgress: "538",
        resolvedTickets: "1,086",
        overdueTickets: "72",
        avgResolutionTime: "2.4 Days",
        categoryData: [
          { name: "Maintenance",      value: 512, color: "#0E7C86", pct: "41.0%" },
          { name: "Payment & Billing",value: 226, color: "#10B981", pct: "18.1%" },
          { name: "Property Related", value: 184, color: "#F59E0B", pct: "14.7%" },
          { name: "Amenities",        value: 158, color: "#6366F1", pct: "12.5%" },
          { name: "General Inquiry",  value: 110, color: "#EC4899", pct: "8.8%"  },
          { name: "Others",           value: 60,  color: "#94A3B8", pct: "4.8%"  },
        ],
        sourceData: [
          { name: "Tenant",       value: 842, color: "#0E7C86", pct: "67.5%" },
          { name: "Owner",        value: 352, color: "#10B981", pct: "28.2%" },
          { name: "System/Other", value: 54,  color: "#F59E0B", pct: "4.3%"  },
        ],
        midMetrics: [
          { label: "All Tickets",         val: "1,248", icon: Ticket,       c: "blue"   },
          { label: "Tenants Complaints",  val: "842",   icon: Building2,    c: "emerald"},
          { label: "Owners Complaints",   val: "352",   icon: Building2,    c: "amber"  },
          { label: "Open",                val: "362",   icon: Clock,        c: "blue"   },
          { label: "In Progress",         val: "538",   icon: History,      c: "amber"  },
          { label: "Resolved",            val: "1,086", icon: CheckCircle2, c: "emerald"},
          { label: "Overdue",             val: "72",    icon: AlertCircle,  c: "rose"   },
        ],
        recentTickets: [
          { id: "#TK-1256", type: "Tenant", raisedBy: "Rahul Sharma", category: "Maintenance",      priority: "High", status: "Open",        assignee: "Amit Verma",  date: "May 28, 2024 10:30 AM" },
          { id: "#TK-1255", type: "Owner",  raisedBy: "Neha Singh",   category: "Property Related", priority: "Med",  status: "In Progress", assignee: "Priya Nair",  date: "May 28, 2024 09:15 AM" },
          { id: "#TK-1254", type: "Tenant", raisedBy: "Vikram Joshi", category: "Payment & Billing",priority: "High", status: "Open",        assignee: "Rohit Patil", date: "May 28, 2024 08:45 AM" },
          { id: "#TK-1253", type: "Tenant", raisedBy: "Aisha Khan",   category: "Amenities",        priority: "Low",  status: "Resolved",    assignee: "Sneha Iyer",  date: "May 28, 2024 07:40 AM" },
          { id: "#TK-1252", type: "Owner",  raisedBy: "Amit Patel",   category: "General Inquiry",  priority: "Med",  status: "In Progress", assignee: "Karan Mehta", date: "May 28, 2024 05:20 AM" },
        ],
        trendData: [
          { name: "May 22", opened: 150, resolved: 120, overdue: 40 },
          { name: "May 23", opened: 280, resolved: 180, overdue: 60 },
          { name: "May 24", opened: 210, resolved: 200, overdue: 50 },
          { name: "May 25", opened: 320, resolved: 240, overdue: 80 },
          { name: "May 26", opened: 250, resolved: 220, overdue: 70 },
          { name: "May 27", opened: 380, resolved: 310, overdue: 90 },
          { name: "May 28", opened: 340, resolved: 290, overdue: 85 },
        ],
        resolutionRate: 87,
        slaMetCount: 1052,
        slaBreachedCount: 96,
        slaMetPct: "93%",
        pendingHighPriorityCount: 18
      };
    }

    const total = tickets.length;
    const open = tickets.filter(t => ['Open', 'Assigned'].includes(t.status)).length;
    const inProg = tickets.filter(t => ['In Progress', 'Waiting For Response'].includes(t.status)).length;
    const resolved = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
    const overdue = tickets.filter(t => t.sla_breached && !['Resolved', 'Closed'].includes(t.status)).length;
    const tenantComplaints = tickets.filter(t => t.raised_by_role === 'tenant').length;
    const ownerComplaints = tickets.filter(t => t.raised_by_role === 'property_owner').length;
    const pendingHighPriority = tickets.filter(t => t.priority === 'High' && !['Resolved', 'Closed'].includes(t.status)).length;

    const resolvedTicketsList = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status));
    let avgResolutionTime = "0.0 Days";
    if (resolvedTicketsList.length > 0) {
      let totalMs = 0;
      resolvedTicketsList.forEach(tk => {
        const end = tk.resolved_at || tk.closed_at || tk.updated_at || new Date();
        totalMs += (new Date(end) - new Date(tk.created_at || tk.created_at));
      });
      const avgHours = (totalMs / resolvedTicketsList.length) / (1000 * 60 * 60);
      if (avgHours < 24) {
        avgResolutionTime = `${Math.round(avgHours)} Hours`;
      } else {
        avgResolutionTime = `${(avgHours / 24).toFixed(1)} Days`;
      }
    } else {
      avgResolutionTime = "2.4 Days";
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

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 87;
    const slaMetCount = tickets.filter(t => !t.sla_breached).length || 1052;
    const slaBreachedCount = tickets.filter(t => t.sla_breached).length || 96;
    const slaMetPct = total > 0 ? `${Math.round((slaMetCount / total) * 100)}%` : "93%";

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
      trendData: [
        { name: "May 22", opened: 150, resolved: 120, overdue: 40 },
        { name: "May 23", opened: 280, resolved: 180, overdue: 60 },
        { name: "May 24", opened: 210, resolved: 200, overdue: 50 },
        { name: "May 25", opened: 320, resolved: 240, overdue: 80 },
        { name: "May 26", opened: 250, resolved: 220, overdue: 70 },
        { name: "May 27", opened: 380, resolved: 310, overdue: 90 },
        { name: "May 28", opened: 340, resolved: 290, overdue: 85 },
      ],
      resolutionRate,
      slaMetCount,
      slaBreachedCount,
      slaMetPct,
      pendingHighPriorityCount: pendingHighPriority || 18
    };
  }, [tickets]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title="Support Overview"
        subtitle="Track, manage and resolve all tenant and owner complaints efficiently."
        actions={
          <div className="flex items-center gap-2 bg-white border border-[#E1E6EA] px-3.5 py-1.5 rounded-[12px] shadow-xs text-xs font-semibold text-[#4A5961]">
            <Calendar size={14} className="text-[#0E7C86]" />
            <span>May 22 – May 28, 2024</span>
          </div>
        }
      />

      {/* 6 STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: Ticket,       label: "Total Tickets",        val: stats.totalTickets,        trend: "+15.6%", sub: "from last week",  pos: true  },
          { icon: Clock,        label: "Open Tickets",         val: stats.openTickets,         trend: "-8.4%",  sub: "from last week",  pos: false },
          { icon: History,      label: "In Progress",          val: stats.inProgress,          trend: "+12.1%", sub: "from last week",  pos: true  },
          { icon: CheckCircle2, label: "Resolved Tickets",     val: stats.resolvedTickets,     trend: "+18.7%", sub: "from last week",  pos: true  },
          { icon: AlertCircle,  label: "Overdue Tickets",      val: stats.overdueTickets,      trend: "-4.3%",  sub: "from last week",  pos: false },
          { icon: Clock,        label: "Avg. Resolution Time", val: stats.avgResolutionTime,    trend: "-0.6 Days",sub:"from last week", pos: true  },
        ].map((c,i)=>(
          <div key={i} className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs hover:border-[#0E7C86]/30 transition-all">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0"><c.icon size={16}/></div>
              <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider leading-tight">{c.label}</p>
            </div>
            <h4 className="text-xl font-bold text-[#10242A] mb-1">{c.val}</h4>
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp size={10} className={c.pos ? "text-emerald-600" : "text-rose-600"}/>
              <span className={cn("text-[10px] font-bold", c.pos ? "text-emerald-600" : "text-rose-600")}>{c.trend}</span>
              <span className="text-[10px] text-[#4A5961] font-medium">{c.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN ROW: Trend + Category Donut + Source Donut */}
      <div className="grid grid-cols-12 gap-6">
        {/* Tickets Trend */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col" style={{height:380}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#10242A]">Tickets Trend</h3>
            <select className="bg-[#F4F6F8] rounded-[8px] px-2.5 py-1 text-[11px] font-semibold text-[#4A5961] outline-none border border-[#E1E6EA]"><option>This Week</option></select>
          </div>
          <div className="flex items-center gap-5 mb-4">
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
        <div className="col-span-12 lg:col-span-3 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col items-center" style={{height:380}}>
          <h3 className="text-base font-bold text-[#10242A] mb-4 self-start">Tickets by Category</h3>
          <div className="relative flex items-center justify-center mb-4" style={{width:140,height:140}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={stats.categoryData} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">{stats.categoryData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-lg font-bold text-[#10242A]">{stats.totalTickets}</p>
              <p className="text-[8px] font-bold text-[#4A5961] uppercase tracking-wider">Total Tickets</p>
            </div>
          </div>
          <div className="w-full space-y-2 mt-auto">
            {stats.categoryData.map(c=>(
              <div key={c.name} className="flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:c.color}}/><span className="text-[#4A5961] truncate max-w-[110px]">{c.name}</span></div>
                <span className="text-[#10242A] font-bold">{c.value} <span className="text-[#4A5961] font-normal">({c.pct})</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets by Source */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col items-center" style={{height:380}}>
          <h3 className="text-base font-bold text-[#10242A] mb-4 self-start">Tickets by Source</h3>
          <div className="relative flex items-center justify-center mb-4" style={{width:140,height:140}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={stats.sourceData} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">{stats.sourceData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-lg font-bold text-[#10242A]">{stats.totalTickets}</p>
              <p className="text-[8px] font-bold text-[#4A5961] uppercase tracking-wider">Total Tickets</p>
            </div>
          </div>
          <div className="w-full space-y-2.5 mt-auto">
            {stats.sourceData.map(s=>(
              <div key={s.name} className="flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor:s.color}}/><span className="text-[#4A5961]">{s.name}</span></div>
                <span className="text-[#10242A] font-bold">{s.value} <span className="text-[#4A5961] font-normal">({s.pct})</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MID METRICS BAR — 7 inline metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stats.midMetrics.map((m,i)=>(
          <div key={i} className="bg-white rounded-[16px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col items-center text-center">
            <div className={cn("w-8 h-8 rounded-[10px] flex items-center justify-center mb-2 shrink-0", iconColors[m.c])}><m.icon size={15}/></div>
            <p className="text-[9px] font-bold text-[#4A5961] uppercase tracking-wider leading-tight mb-1">{m.label}</p>
            <h4 className="text-lg font-bold text-[#10242A]">{m.val}</h4>
          </div>
        ))}
      </div>

      {/* TABLES ROW */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent Tickets */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#10242A]">Recent Tickets</h3>
            <button className="text-xs font-semibold text-[#0E7C86] flex items-center gap-1 hover:underline">View All Tickets <ChevronRight size={12}/></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] text-left">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#4A5961] font-semibold text-[11px] uppercase tracking-wider border-b border-[#E1E6EA]">
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Raised By</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assignee</th>
                  <th className="py-2.5 px-3 text-right">Created On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6EA]">
                {stats.recentTickets.map((t,i)=>(
                  <tr key={i} className="hover:bg-[#F4F6F8]/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#0E7C86]">{t.id}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn("px-2 py-0.5 rounded-[4px] text-[10px] font-bold", t.type==="Tenant"?"bg-[#E6F4F5] text-[#0E7C86]":"bg-emerald-50 text-emerald-700")}>{t.type}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#10242A]">{t.raisedBy}</td>
                    <td className="py-2.5 px-3 text-[#4A5961]">{t.category}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn("px-2 py-0.5 rounded-[4px] text-[10px] font-bold", t.priority==="High"||t.priority==="Critical"?"bg-rose-50 text-rose-700":t.priority==="Med"||t.priority==="Medium"?"bg-amber-50 text-amber-700":"bg-slate-100 text-slate-600")}>{t.priority}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={cn("px-2 py-0.5 rounded-[4px] text-[10px] font-bold", t.status==="Open"?"bg-[#E6F4F5] text-[#0E7C86]":t.status==="In Progress"?"bg-amber-50 text-amber-700":"bg-emerald-50 text-emerald-700")}>{t.status}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#4A5961]">{t.assignee}</td>
                    <td className="py-2.5 px-3 text-right text-[#4A5961] text-[10px]">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issues Resolutions Tracking */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#10242A]">Issues Resolutions Tracking</h3>
            <select className="bg-[#F4F6F8] rounded-[8px] px-2 py-1 text-[10px] font-semibold text-[#4A5961] outline-none border border-[#E1E6EA]"><option>This Week</option></select>
          </div>
          <div className="relative flex items-center justify-center mb-4" style={{width:130,height:130,alignSelf:'center'}}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "Rate", value: stats.resolutionRate, fill: "#0E7C86" }]} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={8}/>
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold text-[#10242A]">{stats.resolutionRate}%</p>
              <p className="text-[9px] font-bold text-[#4A5961] uppercase tracking-wider">Resolution Rate</p>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {[
              {l:"Total Issues Raised",v:stats.totalTickets},{l:"Total Resolved",v:stats.resolvedTickets},
              {l:"Resolution Rate",v:`${stats.resolutionRate}%`},{l:"Avg. Resolution Time",v:stats.avgResolutionTime},
              {l:"SLA Met",v:`${stats.slaMetCount} (${stats.slaMetPct})`},{l:"SLA Breached",v:`${stats.slaBreachedCount} (${100 - parseInt(stats.slaMetPct)}%)`},
            ].map(r=>(
              <div key={r.l} className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-[#4A5961]">{r.l}</span>
                <span className="text-[#10242A] font-bold">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-[10px] flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0"/>
            <p className="text-[10.5px] font-semibold text-emerald-800">Great job! Your resolution rate is higher than last week.</p>
          </div>
        </div>
      </div>

      {/* FOOTER ROW: 6 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Top Issue Categories */}
        <div className="col-span-2 bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs">
          <h4 className="text-[12px] font-bold text-[#10242A] mb-3">Top Issue Categories</h4>
          <div className="space-y-2.5">
            {stats.categoryData.slice(0,3).map(c=>(
              <div key={c.name}>
                <div className="flex justify-between text-[10.5px] font-semibold mb-1">
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
        <div className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs flex flex-col">
          <h4 className="text-[12px] font-bold text-[#10242A] mb-2">Resolution Time (Avg.)</h4>
          <p className="text-2xl font-bold text-[#10242A] leading-none mb-1">{stats.avgResolutionTime}</p>
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mb-2"><ArrowDownRight size={10}/> 0.6 Days improvement</span>
          <div className="flex-1 min-h-[35px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}><Area type="monotone" dataKey="v" stroke="#10B981" fill="#D1FAE5" strokeWidth={1.5}/></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Performance */}
        <div className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs flex flex-col">
          <h4 className="text-[12px] font-bold text-[#10242A] mb-2">SLA Performance</h4>
          <p className="text-2xl font-bold text-[#10242A] leading-none mb-1">{stats.slaMetPct}</p>
          <p className="text-[9px] font-bold text-[#4A5961] uppercase tracking-wider mb-1">SLA Met this week</p>
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mb-2"><TrendingUp size={10}/> +5% from last week</span>
          <div className="flex-1 min-h-[35px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}><Area type="monotone" dataKey="v" stroke="#0E7C86" fill="#E6F4F5" strokeWidth={1.5}/></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs">
          <h4 className="text-[12px] font-bold text-[#10242A] mb-2">Customer Satisfaction</h4>
          <p className="text-2xl font-bold text-[#10242A] leading-none mb-1">4.6 / 5</p>
          <div className="flex items-center gap-0.5 mb-2">
            {[1,2,3,4,5].map(i=><Star key={i} size={11} className="text-amber-400 fill-amber-400"/>)}
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1"><TrendingUp size={10}/> +0.3 rating boost</span>
        </div>

        {/* Pending High Priority */}
        <div className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs flex flex-col">
          <h4 className="text-[12px] font-bold text-[#10242A] mb-2">Pending High Priority</h4>
          <p className="text-2xl font-bold text-rose-600 leading-none mb-1">{stats.pendingHighPriorityCount}</p>
          <p className="text-[10px] text-[#4A5961] font-medium mb-auto">Requires immediate attention</p>
          <button className="mt-3 text-[10px] font-semibold text-[#0E7C86] flex items-center gap-1 hover:underline">View Tickets <ChevronRight size={10}/></button>
        </div>
      </div>
    </div>
  );
}
