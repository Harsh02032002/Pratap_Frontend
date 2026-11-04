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

  const counts = data?.counts || { total: 0, resolved: 0, pending: 0, escalated: 0 };
  const resRate = String(data?.resRate ?? "0").replace(/%/g, "");
  const avgTime = data?.avgTime && data.avgTime !== "No Data Available" ? data.avgTime : "0 Days";
  const resolutionTrend = (data?.resolutionTrend || []).map(t => ({
    ...t,
    raised: t.raised ?? t.opened ?? 0,
    resolved: t.resolved ?? 0
  }));
  const categoryData = (data?.categoryData || []).map(c => ({
    ...c,
    count: c.count ?? c.value ?? 0
  }));
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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Issues Resolution Tracking</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Monitor the full complaint lifecycle from creation to closure.</p>
        </div>
        <button onClick={handleExport} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] px-4 py-1.5 rounded-[8px] text-[13px] font-semibold flex items-center gap-2 transition-colors shadow-xs cursor-pointer shrink-0">
          <Download size={14}/> Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Issues",    val: counts.total     },
          { label: "Resolved",        val: counts.resolved  },
          { label: "Avg. Resolution", val: avgTime          },
          { label: "Resolution Rate", val: `${resRate}%`    },
          { label: "Escalated Cases", val: counts.escalated },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{c.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{loading ? "..." : c.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Banner */}
      <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-3">
        <div className="flex items-center justify-between overflow-x-auto py-0.5">
          {["Complaint Raised","Ticket Created","Admin Assigned","Investigation","Resolution Proposed","Resolved","Closed"].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-2 shrink-0 px-2">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  i < 4 ? "bg-[#0E7C86] text-white" : i < 6 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                )}>{i+1}</div>
                <p className="text-[12px] font-semibold text-[#4A5961] whitespace-nowrap">{step}</p>
              </div>
              {i < arr.length - 1 && <ChevronRight size={14} className="text-[#4A5961]/40 shrink-0"/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Search & Filter Row (Outside & Above the Table Card in a Single Line) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#708088]" size={15} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search issues..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            {filterTabs.map(tab => (
              <option key={tab.id} value={tab.id}>
                {tab.label} ({tab.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Listing */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Issue ID / Ticket</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Type</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant / Owner</th>
                {!isEmployeeView && <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Assigned Admin</th>}
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr><td colSpan={isEmployeeView ? 6 : 7} className="py-6 text-center text-[13px] text-[#4A5961]">Loading resolution tracking data...</td></tr>
              ) : displayList.length === 0 ? (
                <tr><td colSpan={isEmployeeView ? 6 : 7} className="py-6 text-center text-[13px] text-[#4A5961]">No issues tracking records found</td></tr>
              ) : displayList.map(item => {
                const statusCfg = RES_STATUS_CFG[item.res_status] || RES_STATUS_CFG["Pending Review"];
                return (
                  <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 pl-2 font-bold text-[#0E7C86]">
                      {item.ticket_id || item.id}
                    </td>
                    <td className="py-2.5">
                      <span className="text-[11px] font-semibold text-[#4A5961] bg-[#E8EDF1] px-2.5 py-0.5 rounded-full">{item.type}</span>
                    </td>
                    <td className="py-2.5 font-semibold text-[#10242A]">{item.property || "—"}</td>
                    <td className="py-2.5 text-[#4A5961]">{item.tenant || item.owner || "User"}</td>
                    {!isEmployeeView && <td className="py-2.5 font-semibold text-[#10242A]">{item.admin || "Unassigned"}</td>}
                    <td className="py-2.5">
                      <select
                        value={item.res_status}
                        disabled={updatingId === item.id}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold outline-none cursor-pointer border", statusCfg.cls)}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.label} value={opt.label}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 pr-2 text-right">
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
