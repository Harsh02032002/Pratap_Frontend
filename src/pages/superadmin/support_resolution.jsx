import React, { useState, useEffect, useMemo } from "react";
import { fetchJson } from "../../utils/api";
import {
  CheckCircle, Clock, TrendingUp, AlertTriangle, ChevronRight, ChevronDown,
  Download, BarChart3, Layers, Search, Eye, X, Building, User, Calendar, FileText
} from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const cn = (...c) => c.filter(Boolean).join(" ");

const RES_STATUS_CFG = {
  "Pending Review":           { cls: "bg-slate-100 text-slate-600 border border-slate-200",    bar: "#94A3B8" },
  "Under Investigation":      { cls: "bg-[#E6F4F5] text-[#0E7C86] border border-[#0E7C86]/20", bar: "#0E7C86" },
  "Awaiting User Response":   { cls: "bg-purple-50 text-purple-700 border border-purple-200",   bar: "#8B5CF6" },
  "Awaiting Owner Response":  { cls: "bg-amber-50 text-amber-700 border border-amber-200",     bar: "#F59E0B" },
  "Resolution Proposed":      { cls: "bg-cyan-50 text-cyan-700 border border-cyan-200",       bar: "#06B6D4" },
  "Resolved":                 { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", bar: "#10B981" },
  "Closed":                   { cls: "bg-slate-200 text-slate-600 border border-slate-300",    bar: "#64748B" },
};

const STATUS_OPTIONS = [
  { label: "Pending Review", dbValue: "Open" },
  { label: "Under Investigation", dbValue: "In Progress" },
  { label: "Awaiting User Response", dbValue: "Waiting For Response" },
  { label: "Resolution Proposed", dbValue: "Resolution Proposed" },
  { label: "Resolved", dbValue: "Resolved" },
  { label: "Closed", dbValue: "Closed" }
];

export default function IssuesResolutionTracking() {
  const [activeTab, setActiveTab] = useState("All Issues");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);

  const isEmployeeView = typeof window !== "undefined" && window.location.pathname.startsWith("/employee");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/superadmin/support/resolution-data");
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load resolution tracking data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const counts = data?.counts || { total: 1248, resolved: 1086, pending: 162, escalated: 18 };
  const resRate = data?.resRate || "87";
  const avgTime = data?.avgTime || "2.4 Days";
  const resolutionTrend = data?.resolutionTrend || [
    { name: "May 22", raised: 15, resolved: 12 },
    { name: "May 23", raised: 28, resolved: 18 },
    { name: "May 24", raised: 21, resolved: 20 },
    { name: "May 25", raised: 32, resolved: 24 },
    { name: "May 26", raised: 25, resolved: 22 },
    { name: "May 27", raised: 38, resolved: 31 },
    { name: "May 28", raised: 34, resolved: 29 },
  ];
  const categoryData = data?.categoryData || [
    { name: "Maintenance", count: 512, color: "#0E7C86" },
    { name: "Billing", count: 226, color: "#10B981" },
    { name: "Property", count: 184, color: "#F59E0B" },
    { name: "Amenities", count: 158, color: "#6366F1" },
  ];
  const issues = data?.issues || [];

  const tenantComplaints = useMemo(() => {
    return issues.filter(i => String(i.type || '').toLowerCase().includes('tenant'));
  }, [issues]);

  const ownerComplaints = useMemo(() => {
    return issues.filter(i => String(i.type || '').toLowerCase().includes('owner'));
  }, [issues]);

  const otherComplaints = useMemo(() => {
    return issues.filter(i => 
      !String(i.type || '').toLowerCase().includes('tenant') && 
      !String(i.type || '').toLowerCase().includes('owner')
    );
  }, [issues]);

  const longestPending = useMemo(() => {
    return [...issues]
      .filter(i => !["Resolved", "Closed"].includes(i.res_status))
      .sort((a, b) => parseFloat(b.res_time) - parseFloat(a.res_time));
  }, [issues]);

  const recentlyResolved = useMemo(() => {
    return [...issues].filter(i => ["Resolved", "Closed"].includes(i.res_status));
  }, [issues]);

  const displayList = useMemo(() => {
    let list = issues;
    if (activeTab === "Tenant Complaints") list = tenantComplaints;
    else if (activeTab === "Owner Complaints") list = ownerComplaints;
    else if (activeTab === "Other Complaints") list = otherComplaints;
    else if (activeTab === "Longest Pending") list = longestPending;
    else if (activeTab === "Recently Resolved") list = recentlyResolved;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(i =>
      String(i.id || '').toLowerCase().includes(q) ||
      String(i.ticket_id || '').toLowerCase().includes(q) ||
      String(i.type || '').toLowerCase().includes(q) ||
      String(i.property || '').toLowerCase().includes(q) ||
      String(i.tenant || '').toLowerCase().includes(q) ||
      String(i.owner || '').toLowerCase().includes(q) ||
      String(i.admin || '').toLowerCase().includes(q) ||
      String(i.res_status || '').toLowerCase().includes(q)
    );
  }, [activeTab, issues, tenantComplaints, ownerComplaints, otherComplaints, longestPending, recentlyResolved, searchQuery]);

  const handleStatusChange = async (ticketId, newLabel) => {
    const selectedOption = STATUS_OPTIONS.find(o => o.label === newLabel);
    if (!selectedOption) return;

    setUpdatingId(ticketId);
    try {
      const res = await fetchJson(`/api/superadmin/support/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedOption.dbValue })
      });
      if (res && res.success) {
        setData(prev => {
          if (!prev) return prev;
          const updatedIssues = prev.issues.map(item => {
            if (item.id === ticketId) {
              return { ...item, res_status: selectedOption.label };
            }
            return item;
          });
          return { ...prev, issues: updatedIssues };
        });

        if (viewTicket && viewTicket.id === ticketId) {
          setViewTicket(prev => prev ? { ...prev, res_status: selectedOption.label } : null);
        }
      }
    } catch (err) {
      console.error("Failed to update ticket status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = () => {
    const headers = ["Issue ID","Ticket ID","Type","Property","Tenant","Owner", ...(isEmployeeView ? [] : ["Assigned Admin"]), "Resolution Status","Created Date"];
    const rows = displayList.map(i => [
      i.id, i.ticket_id, i.type, i.property, i.tenant, i.owner,
      ...(isEmployeeView ? [] : [i.admin]),
      i.res_status, i.created
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="issues.csv"; a.click();
  };

  const filterTabs = [
    { id: "All Issues", label: "All Issues", count: issues.length },
    { id: "Tenant Complaints", label: "Tenant Complaints", count: tenantComplaints.length },
    { id: "Owner Complaints", label: "Owner Complaints", count: ownerComplaints.length },
    { id: "Other Complaints", label: "Other Complaints", count: otherComplaints.length },
    { id: "Longest Pending", label: "Longest Pending", count: longestPending.length },
    { id: "Recently Resolved", label: "Recently Resolved", count: recentlyResolved.length },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Issues Resolution Tracking"
          subtitle="Monitor the full complaint lifecycle from creation to closure."
        />
        <button onClick={handleExport} className="bg-[#0E7C86] text-white px-4 py-2 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#09626A] transition-colors shadow-xs">
          <Download size={14}/> Export CSV
        </button>
      </div>

      {/* Workflow Banner */}
      <div className="bg-white rounded-[16px] border border-[#E1E6EA] shadow-xs p-4">
        <div className="flex items-center justify-between overflow-x-auto py-1">
          {["Complaint Raised","Ticket Created","Admin Assigned","Investigation","Resolution Proposed","Resolved","Closed"].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center shrink-0 px-2">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1",
                  i < 4 ? "bg-[#0E7C86] text-white" : i < 6 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                )}>{i+1}</div>
                <p className="text-[10px] font-semibold text-[#4A5961] text-center whitespace-nowrap">{step}</p>
              </div>
              {i < arr.length - 1 && <ChevronRight size={14} className="text-[#4A5961]/40 shrink-0"/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Issues",    val: counts.total,     icon: Layers       },
          { label: "Resolved",        val: counts.resolved,  icon: CheckCircle  },
          { label: "Avg. Resolution", val: avgTime,          icon: Clock        },
          { label: "Resolution Rate", val: `${resRate}%`,    icon: TrendingUp   },
          { label: "Escalated Cases", val: counts.escalated, icon: AlertTriangle},
        ].map(c => (
          <div key={c.label} className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-[10px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center mb-2.5">
                <c.icon size={16}/>
              </div>
              <p className="text-2xl font-bold text-[#10242A] leading-none">{c.val}</p>
              <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mt-1.5">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar & Tabs */}
      <div className="bg-white rounded-[16px] border border-[#E1E6EA] shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-[#F4F6F8] p-1 rounded-[10px] border border-[#E1E6EA] overflow-x-auto max-w-full">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-[6px] text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "bg-[#0E7C86] text-white shadow-xs"
                  : "text-[#4A5961] hover:text-[#10242A]"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5961]" size={14} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search issues..."
            className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] pl-9 pr-4 py-1.5 text-xs outline-none focus:border-[#0E7C86] text-[#10242A]"
          />
        </div>
      </div>

      {/* Table Listing */}
      <div className="bg-white rounded-[16px] border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
              <tr>
                <th className="px-5 py-3">Issue ID / Ticket</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Tenant / Owner</th>
                {!isEmployeeView && <th className="px-5 py-3">Assigned Admin</th>}
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6EA]">
              {displayList.length === 0 ? (
                <tr><td colSpan={isEmployeeView ? 6 : 7} className="px-6 py-12 text-center text-xs font-semibold text-[#4A5961]">No issues tracking records found</td></tr>
              ) : displayList.map(item => {
                const statusCfg = RES_STATUS_CFG[item.res_status] || RES_STATUS_CFG["Pending Review"];
                return (
                  <tr key={item.id} className="hover:bg-[#F4F6F8]/60 transition-colors">
                    <td className="px-5 py-3 font-bold text-[#0E7C86]">
                      {item.ticket_id || item.id}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-semibold text-[#4A5961] bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px]">{item.type}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#10242A]">{item.property || "—"}</td>
                    <td className="px-5 py-3 text-[#4A5961]">{item.tenant || item.owner || "User"}</td>
                    {!isEmployeeView && <td className="px-5 py-3 font-semibold text-[#10242A]">{item.admin || "Unassigned"}</td>}
                    <td className="px-5 py-3">
                      <select
                        value={item.res_status}
                        disabled={updatingId === item.id}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={cn("px-2 py-0.5 rounded-[6px] text-[10px] font-bold outline-none cursor-pointer border", statusCfg.cls)}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.label} value={opt.label}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setViewTicket(item)} className="p-1.5 text-[#4A5961] hover:text-[#0E7C86] hover:bg-[#E6F4F5] rounded-[6px] transition-all cursor-pointer">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
