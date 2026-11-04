import toast from "react-hot-toast";
import { buildOwnerReportCsv } from "../../utils/ownerReportCsv";
import React, { useState, useEffect, useCallback } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerProperties } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import {
  BarChart3, FileSpreadsheet, FileText, Download, Loader2,
  CheckCircle2, X, Calendar, Filter, Search, History,
  IndianRupee, BedDouble, Users, AlertCircle, TrendingUp,
  Headset, ClipboardList, Clock, Eye, ChevronRight, Zap
} from "lucide-react";

const REPORT_CATEGORIES = [
  {
    id: "Financial",
    label: "Financial Reports",
    icon: IndianRupee,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    headerBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    description: "Track payment receipts and outstanding invoice balances",
    reports: [
      { name: "Rent Collection Report", purpose: "Track all rent collected across properties. Identify payment modes and collection staff.", kpis: ["Total Collected", "Total Records"] },
      { name: "Outstanding Dues Report", purpose: "Unpaid and partially paid invoices for current tenants. Date filters apply to invoice due dates.", kpis: ["Total Dues", "Tenants with Dues", "Days Overdue"] },
    ],
  },
  {
    id: "Occupancy",
    label: "Occupancy Reports",
    icon: BedDouble,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    headerBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    description: "Monitor bed/room occupancy across all properties",
    reports: [
      { name: "Bed Occupancy Report", purpose: "See how many beds are filled vs vacant per property. Plan marketing efforts.", kpis: ["Total Beds", "Occupied", "Vacant", "Occupancy %"] },
      { name: "Room Occupancy Report", purpose: "Room-level breakdown of occupancy, capacity, and status.", kpis: ["Total Rooms", "Occupied Rooms", "Vacant Rooms"] },
    ],
  },
  {
    id: "Tenant",
    label: "Tenant Reports",
    icon: Users,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    headerBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    description: "Current active tenants and their recorded details",
    reports: [
      { name: "Active Tenant Report", purpose: "Full list of all current tenants with property, room, and rent details.", kpis: ["Active Tenants"] },
    ],
  },
  {
    id: "Complaint",
    label: "Complaint Reports",
    icon: Headset,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    headerBg: "bg-gradient-to-br from-rose-500 to-pink-600",
    description: "Complaint resolution, escalations, and maintenance",
    reports: [
      { name: "Open Complaint Report", purpose: "All unresolved complaints. Assign and prioritize action.", kpis: ["Total Complaints"] },
      { name: "Resolution Report", purpose: "Resolved complaints and recorded resolution times. Date filters apply to the resolution date.", kpis: ["Total Complaints"] },
    ],
  },
  {
    id: "Attendance",
    label: "Staff Reports",
    icon: ClipboardList,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    headerBg: "bg-gradient-to-br from-slate-600 to-slate-700",
    description: "Recorded staff attendance and check-in/out times",
    reports: [
      { name: "Attendance Report", purpose: "Daily check-in/out records. Identify late arrivals and absentees.", kpis: ["Total Records"] },
    ],
  },
];

export default function ReportsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [summary, setSummary]       = useState({});
  const [history, setHistory]       = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch]         = useState("");
  const [expandedCat, setExpandedCat] = useState("Financial");
  const [showModal, setShowModal]   = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab]   = useState("reports"); // "reports" | "history" | "demand"
  const [properties, setProperties] = useState([]);
  
  const [demandData, setDemandData]       = useState([]);
  const [demandLoading, setDemandLoading] = useState(false);
  const [optimizingId, setOptimizingId]   = useState(null);

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    propertyId: "",
    status: "",
    format: "CSV",
  });

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/reports/summary/${owner.loginId}`);
      if (res?.data) setSummary(res.data);
    } catch (_) {}
  }, [owner.loginId]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiFetch(`/api/reports/history/${owner.loginId}`);
      setHistory(res?.data || []);
    } catch (_) {}
    finally { setHistoryLoading(false); }
  }, [owner.loginId]);

  const fetchDemandData = useCallback(async () => {
    setDemandLoading(true);
    try {
      const res = await apiFetch(`/api/reports/demand/${owner.loginId}`);
      if (res?.success) {
        setDemandData(res.properties || []);
      }
    } catch (err) {
      console.error("Failed to fetch demand data:", err);
    } finally {
      setDemandLoading(false);
    }
  }, [owner.loginId]);

  const handleOptimizeRent = async (propertyId, newRent) => {
    setOptimizingId(propertyId);
    try {
      const res = await apiFetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyRent: Number(newRent) }),
      });
      if (res?.success) {
        setSuccessMsg(`Rent updated successfully to ₹${newRent.toLocaleString('en-IN')}`);
        setTimeout(() => setSuccessMsg(""), 4000);
        await Promise.all([fetchDemandData(), fetchSummary()]);
      } else {
        alert(res?.message || "Failed to update rent");
      }
    } catch (err) {
      alert("Error updating rent: " + err.message);
    } finally {
      setOptimizingId(null);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchHistory();
    fetchDemandData();
    fetchOwnerProperties(owner.loginId, true)
      // Only superadmin-approved properties belong in reports.
      .then(list => setProperties((list || []).filter(p => /^(active|approved)$/i.test(String(p?.status || "")))))
      .catch(() => {});
  }, [fetchSummary, fetchHistory, fetchDemandData, owner.loginId]);

  const openModal = (report, catId) => {
    setSelectedReport({ ...report, category: catId });
    setGeneratedData(null);
    setFilters(f => ({ ...f, status: "" }));
    setShowModal(true);
  };

  const triggerCsvDownload = (csvString, fileName) => {
    // \uFEFF = UTF-8 BOM so Excel opens correctly
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
  };

  const handleGenerate = async () => {
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      toast.error("Start date must be before end date");
      return;
    }
    setGenerating(true);
    setGeneratedData(null);
    try {
      const res = await apiFetch("/api/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          ownerLoginId: owner.loginId,
          reportName: selectedReport.name,
          category: selectedReport.category,
          format: filters.format,
          ...(["Occupancy", "Tenant"].includes(selectedReport.category) ? {} : { startDate: filters.startDate, endDate: filters.endDate }),
          propertyId: filters.propertyId,
          status: filters.status,
        }),
      });

      if (res?.success) {
        setGeneratedData(res);
        const recordCount = res.data?.length || 0;
        setSuccessMsg(`${selectedReport.name} generated — ${recordCount} records`);
        setTimeout(() => setSuccessMsg(""), 4000);
        fetchHistory();

        // Always download — use fileContent from server or build from data array
        const fileName = res.fileName || `${selectedReport.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;

        if (res.fileContent) {
          triggerCsvDownload(res.fileContent, fileName);
        } else if (res.data?.length > 0) {
          // Fallback: build CSV from data array
          triggerCsvDownload(buildOwnerReportCsv(res.data), fileName);
        } else {
          // 0 records — still download empty CSV with headers note
          triggerCsvDownload(`"No data found for the selected date range and filters"\n"Try a wider date range or remove filters"`, fileName);
        }
      } else {
        toast.error(res?.message || "Failed to generate report");
      }
    } catch (err) {
      toast.error("Failed to generate report: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const searchedCategories = REPORT_CATEGORIES.map(cat => ({
    ...cat,
    reports: search
      ? cat.reports.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
      : cat.reports,
  })).filter(cat => cat.reports.length > 0);

  const fmtCurrency = v => v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "—";

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Reports"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Generate business insights, export data, and track history</p>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: fmtCurrency(summary.totalRevenue), icon: IndianRupee, color: "bg-emerald-500" },
          { label: "Occupancy", value: `${summary.occupancyPct || 0}%`, icon: BedDouble, color: "bg-blue-500" },
          { label: "Active Tenants", value: summary.activeTenants ?? "—", icon: Users, color: "bg-violet-500" },
          { label: "Open Complaints", value: summary.openComplaints ?? "—", icon: Headset, color: "bg-rose-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-md`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-slate-900 leading-none truncate">{value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <p className="font-bold text-sm">{successMsg}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: "reports", label: "Generate Reports" }, 
          { id: "history", label: "Report History" },
          { id: "demand", label: "Property Demand & Price Suggestions" }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === t.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <>
          {/* Search */}
          <div className="relative mb-6">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400" />
          </div>

          {/* Category Accordion */}
          <div className="space-y-4">
            {searchedCategories.map(cat => {
              const isOpen = expandedCat === cat.id || !!search;
              const CatIcon = cat.icon;

              return (
                <div key={cat.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedCat(isOpen && !search ? null : cat.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${cat.bg} ${cat.border} border flex items-center justify-center`}>
                        <CatIcon size={22} className={cat.color} />
                      </div>
                      <div className="text-left">
                        <h2 className="text-[15px] font-black text-slate-800">{cat.label}</h2>
                        <p className="text-[11px] text-slate-400 font-medium">{cat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-full">
                        {cat.reports.length} Reports
                      </span>
                      <ChevronRight size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {cat.reports.map(report => (
                        <div key={report.name}
                          className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all group flex flex-col">
                          <div className="mb-3">
                            <h3 className="font-black text-slate-800 text-[14px] leading-tight mb-1">{report.name}</h3>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{report.purpose}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                            {report.kpis?.map(k => (
                              <span key={k} className={`text-[9px] font-black px-2 py-0.5 rounded-full ${cat.bg} ${cat.color} uppercase tracking-wider`}>{k}</span>
                            ))}
                          </div>
                          <button
                            onClick={() => openModal(report, cat.id)}
                            className="w-full h-9 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-600/20"
                          >
                            <Zap size={13} /> Generate Report
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-black text-slate-800 text-base">Generated Reports</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">All reports generated by you</p>
          </div>
          {historyLoading ? (
            <div className="py-10 text-center text-slate-400 text-sm font-medium">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center">
              <History size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="font-black text-slate-400">No reports generated yet</p>
              <p className="text-xs text-slate-300 mt-1">Generate your first report from the Reports tab</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {history.map((r, i) => (
                <div key={r._id || i} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {r.format === "PDF" ? <FileText size={18} className="text-rose-500" /> : <FileSpreadsheet size={18} className="text-emerald-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 text-sm truncate">{r.reportName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400">{r.format || "CSV"}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400">{r.recordCount || 0} records</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400">{new Date(r.generatedAt || r.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {r.status || "Completed"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Demand Analytics Tab */}
      {activeTab === "demand" && (
        <div className="space-y-6">
          {demandLoading ? (
            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculating demand metrics...</p>
            </div>
          ) : demandData.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <AlertCircle size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-500">No properties found</p>
              <p className="text-xs text-slate-400 mt-1">Please ensure your properties are active and approved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              
              {/* Revenue Forecasting Summary Card */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black">Monthly Revenue Forecast</h3>
                  <p className="text-blue-100 text-xs mt-1">Estimated earnings for next month based on current occupancy matrix across all hostels.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl shrink-0 text-center md:text-right">
                  <p className="text-2xl font-black">₹{demandData.reduce((sum, p) => sum + (p.forecastedRevenue || 0), 0).toLocaleString('en-IN')}</p>
                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-200 mt-0.5">Projected Revenue</p>
                </div>
              </div>

              {demandData.map((p) => {
                const isHighDemand = p.status.includes("High");
                const isLowDemand = p.status.includes("Low") || p.status.includes("Interest");
                const isStable = p.status.includes("Stable");

                return (
                  <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                    
                    {/* Property Image & Details */}
                    <div className="flex items-center gap-4 shrink-0 w-full lg:w-72">
                      <img 
                        src={p.featuredImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150&h=110&fit=crop"} 
                        alt={p.title} 
                        className="w-24 h-20 rounded-2xl object-cover shadow-sm"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isHighDemand ? "bg-amber-100 text-amber-800 border border-amber-200" :
                            isLowDemand ? "bg-rose-100 text-rose-800 border border-rose-200" :
                            "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                            {p.status}
                          </span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            p.healthGrade === 'A' ? "bg-amber-500 text-white shadow-sm shadow-amber-500/10" :
                            p.healthGrade === 'B' ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10" :
                            p.healthGrade === 'C' ? "bg-slate-600 text-white shadow-sm shadow-slate-600/10" :
                            "bg-rose-600 text-white shadow-sm shadow-rose-600/10"
                          }`}>
                            Grade {p.healthGrade}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-800 text-sm leading-snug truncate">{p.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{p.locality}, {p.city}</p>
                        <p className="text-xs font-extrabold text-slate-900 mt-1">₹{p.monthlyRent.toLocaleString('en-IN')}/mo</p>
                      </div>
                    </div>

                    {/* Funnel Metrics */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                      <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 text-center">
                        <p className="text-lg font-black text-slate-800">{p.views}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Views</p>
                      </div>
                      <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 text-center">
                        <p className="text-lg font-black text-slate-800">{p.clicks}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Clicks</p>
                        <p className="text-[8px] text-blue-600 font-black mt-0.5">{p.ctr}% CTR</p>
                      </div>
                      <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 text-center">
                        <p className="text-lg font-black text-slate-800">{p.inquiryCount}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Inquiries</p>
                        <p className="text-[8px] text-indigo-600 font-black mt-0.5">{p.leadConv}% Conv</p>
                      </div>
                      <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 text-center">
                        <p className="text-lg font-black text-slate-800">{p.occupancyPct}%</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Occupancy</p>
                        <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${p.occupancyPct >= 80 ? "bg-amber-500" : p.occupancyPct < 50 ? "bg-rose-500" : "bg-emerald-500"}`} 
                            style={{ width: `${p.occupancyPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Recommendation & Direct Action */}
                    <div className="w-full lg:w-80 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between self-stretch">
                      <div>
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 mb-1">
                          Smart Suggestion
                        </span>
                        <p className="text-[11px] text-slate-600 font-bold leading-relaxed">{p.recommendation}</p>
                      </div>
                      
                      {p.actionType === "optimize" && p.suggestionValue && (
                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={() => handleOptimizeRent(p.id, p.suggestionValue)}
                            disabled={optimizingId === p.id}
                            className="flex-1 h-9 bg-slate-900 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            {optimizingId === p.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <>Optimize Rent to ₹{p.suggestionValue.toLocaleString('en-IN')}</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Generate Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-lg leading-tight">{selectedReport.name}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{selectedReport.category} Report</p>
              </div>
              <button onClick={() => { setShowModal(false); setGeneratedData(null); }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={18} className="text-slate-500" /></button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">{selectedReport.purpose}</p>

              {/* Filters */}
              {!["Occupancy", "Tenant"].includes(selectedReport.category) ? <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                  <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" />
                </div>
              </div> : <p className="text-xs text-slate-500">This report shows current records. Date filters do not apply.</p>}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Property</label>
                <select value={filters.propertyId} onChange={e => setFilters(f => ({ ...f, propertyId: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 bg-white">
                  <option value="">All Properties</option>
                  {properties.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.title || p.name}</option>)}
                </select>
              </div>

              {selectedReport?.name === "Outstanding Dues Report" && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Status Filter</label>
                  <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 bg-white">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="partial">Partially paid</option>
                  </select>
                </div>
              )}


              {/* Preview table */}
              {generatedData?.data?.length > 0 && (
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preview — First 3 records of {generatedData.data.length}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {Object.keys(generatedData.data[0]).map(h => (
                            <th key={h} className="text-left px-3 py-2 font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {generatedData.data.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* KPI pills */}
              {generatedData?.kpis && Object.keys(generatedData.kpis).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(generatedData.kpis).map(([k, v]) => (
                    <div key={k} className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 text-center">
                      <p className="text-sm font-black text-emerald-700">{String(v)}</p>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider mt-0.5">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setShowModal(false); setGeneratedData(null); }}
                  className="flex-1 h-11 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleGenerate} disabled={generating}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60">
                  {generating
                    ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                    : <><Download size={14} /> Generate & Download</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
