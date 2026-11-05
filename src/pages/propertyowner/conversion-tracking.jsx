import React, { useState, useEffect, useMemo } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import {
  Target, Users, PhoneCall, CalendarCheck, MapPin, CheckCircle2,
  UserCheck, Plus, Search, Filter, RefreshCw, ArrowDown, Clock,
  Building2, Globe, Edit3, History, X, ChevronRight, AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from "recharts";

const LEAD_STAGES = [
  "Website Enquiry",
  "Lead Created",
  "Contacted",
  "Property Visit Scheduled",
  "Property Visited",
  "Booking Requested",
  "Booking Confirmed",
  "Tenant Onboarded"
];

const STAGE_BADGE_STYLES = {
  "Website Enquiry": "bg-slate-100 text-slate-700 border-slate-200",
  "Lead Created": "bg-blue-50 text-blue-700 border-blue-200",
  "Contacted": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Property Visit Scheduled": "bg-amber-50 text-amber-700 border-amber-200",
  "Property Visited": "bg-purple-50 text-purple-700 border-purple-200",
  "Booking Requested": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Booking Confirmed": "bg-teal-50 text-teal-700 border-teal-200",
  "Tenant Onboarded": "bg-emerald-100 text-emerald-800 border-emerald-300"
};

export default function ConversionTrackingPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Add Lead Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    mobile: "",
    email: "",
    propertyId: "",
    roomNo: "",
    bedNo: "",
    source: "Website",
    assignedEmployeeName: "",
    currentStage: "Lead Created",
    followUpDate: "",
    notes: ""
  });

  // Manage / Update Lead Modal
  const [activeLead, setActiveLead] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    currentStage: "",
    assignedEmployeeName: "",
    followUpDate: "",
    visitDate: "",
    visitTime: "",
    roomNo: "",
    bedNo: "",
    notes: "",
    historyNote: ""
  });

  const loadConversionData = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (propertyFilter !== "all") params.set("propertyId", propertyFilter);
      if (stageFilter !== "all") params.set("stage", stageFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await apiFetch(
        `/api/owner-analytics/${encodeURIComponent(owner.loginId)}/conversion-tracking?${params.toString()}`
      );
      setData(res);
    } catch (err) {
      setError(err?.body?.message || err?.message || "Failed to load conversion tracking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversionData();
  }, [propertyFilter, stageFilter, sourceFilter]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!createForm.name || (!createForm.mobile && !createForm.email)) return;
    try {
      setCreating(true);
      await apiFetch(`/api/owner-analytics/${encodeURIComponent(owner.loginId)}/leads`, {
        method: "POST",
        body: createForm
      });
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        mobile: "",
        email: "",
        propertyId: "",
        roomNo: "",
        bedNo: "",
        source: "Website",
        assignedEmployeeName: "",
        currentStage: "Lead Created",
        followUpDate: "",
        notes: ""
      });
      await loadConversionData();
    } catch (err) {
      alert(err?.body?.message || err?.message || "Failed to create lead");
    } finally {
      setCreating(false);
    }
  };

  const openManageModal = (lead) => {
    setActiveLead(lead);
    setEditForm({
      currentStage: lead.currentStage || "Lead Created",
      assignedEmployeeName: lead.assignedEmployeeName || "",
      followUpDate: lead.followUpDate
        ? new Date(lead.followUpDate).toISOString().slice(0, 10)
        : lead.nextFollowupText || "",
      visitDate: lead.visitDate ? new Date(lead.visitDate).toISOString().slice(0, 10) : "",
      visitTime: lead.visitTime || "",
      roomNo: lead.roomNo || "",
      bedNo: lead.bedNo || "",
      notes: lead.notes || "",
      historyNote: ""
    });
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    if (!activeLead) return;
    try {
      setUpdating(true);
      await apiFetch(
        `/api/owner-analytics/${encodeURIComponent(owner.loginId)}/leads/${encodeURIComponent(activeLead._id)}`,
        {
          method: "PATCH",
          body: editForm
        }
      );
      setActiveLead(null);
      await loadConversionData();
    } catch (err) {
      alert(err?.body?.message || err?.message || "Failed to update lead");
    } finally {
      setUpdating(false);
    }
  };

  const analytics = data?.analytics || {};
  const funnel = data?.funnel || [];
  const propertyWise = data?.propertyWiseConversion || [];
  const sourceWise = data?.sourceWiseConversion || [];
  const properties = data?.properties || [];
  const employees = data?.employees || [];

  const filteredLeads = useMemo(() => {
    const raw = data?.leads || [];
    if (!searchQuery.trim()) return raw;
    const q = searchQuery.trim().toLowerCase();
    return raw.filter(
      (l) =>
        String(l.name || "").toLowerCase().includes(q) ||
        String(l.mobile || "").toLowerCase().includes(q) ||
        String(l.email || "").toLowerCase().includes(q) ||
        String(l.leadId || "").toLowerCase().includes(q) ||
        String(l.propertyName || "").toLowerCase().includes(q)
    );
  }, [data?.leads, searchQuery]);

  const uniqueSources = useMemo(() => {
    const s = new Set(["Website", "Website Bid", "Website Booking", "WhatsApp", "Direct Walk-in", "Referral"]);
    (data?.leads || []).forEach((l) => {
      if (l.source) s.add(l.source);
    });
    return Array.from(s);
  }, [data?.leads]);

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Visitor-to-Tenant Conversion Tracking"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Top Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Target className="w-4 h-4" /> End-to-End Lead Funnel
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Visitor-to-Tenant Conversion Tracking
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track every potential tenant from website enquiry through property visit, booking request, and tenant onboarding.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setCreateForm((f) => ({
                  ...f,
                  propertyId: properties[0]?._id || ""
                }));
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add New Lead
            </button>
            <button
              onClick={loadConversionData}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* 8 Conversion Analytics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Enquiries</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{analytics.totalEnquiries || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-indigo-500">Contacted Leads</p>
            <p className="text-xl font-bold text-indigo-700 mt-1">{analytics.contactedLeads || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-amber-500">Scheduled Visits</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{analytics.scheduledVisits || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-purple-500">Completed Visits</p>
            <p className="text-xl font-bold text-purple-700 mt-1">{analytics.completedVisits || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-cyan-600">Booking Requests</p>
            <p className="text-xl font-bold text-cyan-700 mt-1">{analytics.bookingRequests || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-teal-600">Confirmed Bookings</p>
            <p className="text-xl font-bold text-teal-700 mt-1">{analytics.confirmedBookings || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Converted Tenants</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{analytics.convertedTenants || 0}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold uppercase text-emerald-700">Conversion %</p>
            <p className="text-xl font-bold mt-1">{analytics.conversionPercentage || 0}%</p>
          </div>
        </div>

        {/* Visual Conversion Funnel + Property & Source Conversion Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Funnel Visualization */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Visual Conversion Funnel</h3>
              <p className="text-xs text-slate-500 mb-5">
                Live progression from Website Enquiry to Converted Tenant
              </p>

              <div className="space-y-2">
                {funnel.map((step, idx) => {
                  const widthPct = Math.max(28, step.percentage || (100 - idx * 15));
                  const colors = [
                    "bg-sky-50 text-sky-900 border border-sky-200",
                    "bg-indigo-50 text-indigo-900 border border-indigo-200",
                    "bg-purple-50 text-purple-900 border border-purple-200",
                    "bg-cyan-50 text-cyan-900 border border-cyan-200",
                    "bg-emerald-50 text-emerald-900 border border-emerald-200"
                  ];
                  return (
                    <div key={step.stage} className="flex flex-col items-center">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className={`${
                          colors[idx % colors.length]
                        } rounded-xl py-2.5 px-4 flex items-center justify-between text-xs font-bold shadow-xs transition-all`}
                      >
                        <span>
                          {step.count} {step.stage}
                        </span>
                        <span className="opacity-90 text-[11px]">{step.percentage}%</span>
                      </div>
                      {idx < funnel.length - 1 && (
                        <ArrowDown className="w-4 h-4 text-slate-300 my-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>8-Stage Automated Journey</span>
              <span className="font-semibold text-emerald-700">
                {analytics.convertedTenants || 0} of {analytics.totalEnquiries || 0} onboarded
              </span>
            </div>
          </div>

          {/* Property-wise & Source-wise Conversion Analytics */}
          <div className="lg:col-span-7 space-y-6">
            {/* Property-wise Conversion */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-700" /> Property-Wise Conversion Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                      <th className="py-2 pr-3">Property</th>
                      <th className="py-2 px-2 text-right">Enquiries</th>
                      <th className="py-2 px-2 text-right">Contacted</th>
                      <th className="py-2 px-2 text-right">Visits</th>
                      <th className="py-2 px-2 text-right">Bookings</th>
                      <th className="py-2 px-2 text-right">Converted</th>
                      <th className="py-2 pl-2 text-right">Conv. %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {propertyWise.map((row) => (
                      <tr key={row.propertyId} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-3 font-semibold text-slate-800">{row.propertyName}</td>
                        <td className="py-2.5 px-2 text-right">{row.totalEnquiries}</td>
                        <td className="py-2.5 px-2 text-right text-indigo-700 font-medium">{row.contacted}</td>
                        <td className="py-2.5 px-2 text-right text-purple-700 font-medium">{row.visits}</td>
                        <td className="py-2.5 px-2 text-right text-cyan-700 font-medium">{row.bookings}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-emerald-700">{row.converted}</td>
                        <td className="py-2.5 pl-2 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                            {row.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Source-wise Conversion */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-700" /> Source-Wise Conversion Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                      <th className="py-2 pr-3">Enquiry Source</th>
                      <th className="py-2 px-2 text-right">Enquiries</th>
                      <th className="py-2 px-2 text-right">Contacted</th>
                      <th className="py-2 px-2 text-right">Visits</th>
                      <th className="py-2 px-2 text-right">Bookings</th>
                      <th className="py-2 px-2 text-right">Converted</th>
                      <th className="py-2 pl-2 text-right">Conv. %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sourceWise.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400">
                          No enquiry sources recorded yet
                        </td>
                      </tr>
                    ) : (
                      sourceWise.map((row) => (
                        <tr key={row.source} className="hover:bg-slate-50">
                          <td className="py-2.5 pr-3 font-semibold text-slate-800">{row.source}</td>
                          <td className="py-2.5 px-2 text-right">{row.totalEnquiries}</td>
                          <td className="py-2.5 px-2 text-right">{row.contacted}</td>
                          <td className="py-2.5 px-2 text-right">{row.visits}</td>
                          <td className="py-2.5 px-2 text-right">{row.bookings}</td>
                          <td className="py-2.5 px-2 text-right font-bold text-emerald-700">{row.converted}</td>
                          <td className="py-2.5 pl-2 text-right">
                            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold text-[11px]">
                              {row.conversionRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Journey Pipeline Filters & Search */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Lead ID, name, mobile, email, property…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">All Journey Stages</option>
              {LEAD_STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">All Sources</option>
              {uniqueSources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lead Journey Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Complete Lead Pipeline ({filteredLeads.length})
              </h3>
              <p className="text-xs text-slate-500">
                Website Enquiry → Lead Created → Contacted → Visit Scheduled → Visited → Booking Requested → Confirmed → Tenant Onboarded
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
              Loading conversion tracking records…
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No leads match the selected filters. Click <strong>Add New Lead</strong> or wait for website enquiries.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                    <th className="py-3.5 px-4">Lead ID</th>
                    <th className="py-3.5 px-4">Visitor Details</th>
                    <th className="py-3.5 px-4">Interested Property & Room</th>
                    <th className="py-3.5 px-3">Source & Date</th>
                    <th className="py-3.5 px-3">Assigned Employee</th>
                    <th className="py-3.5 px-4">Current Lead Stage</th>
                    <th className="py-3.5 px-3">Follow-up / Notes</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {lead.leadId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{lead.name}</div>
                        <div className="text-[11px] text-slate-500">{lead.mobile || "-"}</div>
                        {lead.email && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {lead.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{lead.propertyName}</div>
                        <div className="text-[11px] text-slate-500">
                          {lead.roomNo
                            ? `Room ${lead.roomNo}${lead.bedNo ? ` • Bed ${lead.bedNo}` : ""}`
                            : "Any Available Room"}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {lead.source}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {lead.enquiryDate
                            ? new Date(lead.enquiryDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })
                            : "-"}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        {lead.assignedEmployeeName ? (
                          <span className="font-medium text-slate-800">{lead.assignedEmployeeName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            STAGE_BADGE_STYLES[lead.currentStage] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {lead.currentStage}
                        </span>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-teal-600 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(((lead.stageIndex + 1) / LEAD_STAGES.length) * 100)
                              )}%`
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-3 max-w-[200px]">
                        {lead.followUpDate && (
                          <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Follow-up:{" "}
                            {new Date(lead.followUpDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short"
                            })}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 truncate">
                          {lead.notes || "No remarks"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openManageModal(lead)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-[11px] font-semibold inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Update / Journey
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create New Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Visitor Lead</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Visitor Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={createForm.mobile}
                    onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Enquiry Source</label>
                  <select
                    value={createForm.source}
                    onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {["Website", "WhatsApp", "Direct Walk-in", "Phone Call", "Referral", "Social Media"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">Interested Property</label>
                  <select
                    value={createForm.propertyId}
                    onChange={(e) => setCreateForm({ ...createForm, propertyId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {properties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room No (Opt)</label>
                  <input
                    type="text"
                    value={createForm.roomNo}
                    onChange={(e) => setCreateForm({ ...createForm, roomNo: e.target.value })}
                    placeholder="e.g. 101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bed No (Opt)</label>
                  <input
                    type="text"
                    value={createForm.bedNo}
                    onChange={(e) => setCreateForm({ ...createForm, bedNo: e.target.value })}
                    placeholder="e.g. B1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Employee</label>
                  <input
                    type="text"
                    list="owner-staff-list"
                    value={createForm.assignedEmployeeName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, assignedEmployeeName: e.target.value })
                    }
                    placeholder="Select or type staff name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <datalist id="owner-staff-list">
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={createForm.followUpDate}
                    onChange={(e) => setCreateForm({ ...createForm, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  {creating ? "Creating…" : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Lead & Journey History Modal */}
      {activeLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono font-bold text-teal-700">{activeLead.leadId}</span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeLead.name} — {activeLead.propertyName}
                </h3>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 8-Stage Visual Stepper */}
            <div className="my-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                Lead Conversion Journey (Click a stage to update)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LEAD_STAGES.map((stage, idx) => {
                  const currentIdx = LEAD_STAGES.indexOf(editForm.currentStage);
                  const isDone = idx <= currentIdx;
                  const isCurrent = editForm.currentStage === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, currentStage: stage })}
                      className={`px-2.5 py-2 rounded-lg text-left text-[11px] font-semibold border transition flex items-center gap-1.5 ${
                        isCurrent
                          ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                          : isDone
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center bg-black/10 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{stage}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4">
              {/* Update Form */}
              <form onSubmit={handleUpdateLead} className="md:col-span-7 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lead Status / Stage</label>
                    <select
                      value={editForm.currentStage}
                      onChange={(e) => setEditForm({ ...editForm, currentStage: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    >
                      {LEAD_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Employee</label>
                    <input
                      type="text"
                      list="owner-staff-list-edit"
                      value={editForm.assignedEmployeeName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, assignedEmployeeName: e.target.value })
                      }
                      placeholder="Assign to staff"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                    <datalist id="owner-staff-list-edit">
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      value={editForm.followUpDate}
                      onChange={(e) => setEditForm({ ...editForm, followUpDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Property Visit Date</label>
                    <input
                      type="date"
                      value={editForm.visitDate}
                      onChange={(e) => setEditForm({ ...editForm, visitDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Interested Room No</label>
                    <input
                      type="text"
                      value={editForm.roomNo}
                      onChange={(e) => setEditForm({ ...editForm, roomNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Interested Bed No</label>
                    <input
                      type="text"
                      value={editForm.bedNo}
                      onChange={(e) => setEditForm({ ...editForm, bedNo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Communication / Status Update Note
                  </label>
                  <input
                    type="text"
                    value={editForm.historyNote}
                    onChange={(e) => setEditForm({ ...editForm, historyNote: e.target.value })}
                    placeholder="e.g. Spoke with visitor, scheduled property visit for tomorrow 4 PM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Persistent Lead Notes</label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveLead(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                  >
                    {updating ? "Saving…" : "Save Lead Update"}
                  </button>
                </div>
              </form>

              {/* Complete Communication & Status History Timeline */}
              <div className="md:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                  <History className="w-4 h-4 text-teal-700" /> Communication & Status History
                </h4>
                <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
                  {(activeLead.history || []).map((item, i) => (
                    <div key={i} className="relative pl-4 border-l-2 border-teal-500 text-xs">
                      <div className="font-bold text-slate-800">{item.stage || "Update"}</div>
                      <div className="text-[11px] text-slate-600">{item.note}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.updatedBy ? `By ${item.updatedBy} • ` : ""}
                        {item.timestamp
                          ? new Date(item.timestamp).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
