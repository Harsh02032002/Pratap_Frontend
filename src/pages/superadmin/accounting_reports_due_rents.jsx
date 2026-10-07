import React, { useState, useEffect } from "react";
import { 
  Clock, Search, Download, RotateCcw, AlertTriangle, AlertCircle, 
  IndianRupee, Calendar, User, FileText, ChevronRight
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import useSEO from "../../hooks/useSEO";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function DueRentsReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useSEO({
    title: "Due Rents Report - Roomhy Superadmin",
    description: "Detailed report of outstanding rent balances and overdue durations.",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/analytics/due-rents");
      if (res && res.success) {
        setData(res.dueRents || []);
      }
    } catch (e) {
      console.error("DueRentsReport error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = data.filter(d => 
    (d.tenantName || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.invoiceNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalDue = filtered.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0);
  const countOverdue = filtered.length;
  const avgDays = countOverdue > 0 ? Math.round(filtered.reduce((acc, curr) => acc + (curr.daysOverdue || 0), 0) / countOverdue) : 0;
  const criticalOverdue = filtered.filter(d => d.daysOverdue > 15).length;

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = "Invoice Number,Tenant Name,Due Amount,Due Date,Days Overdue,Status\n";
    const rows = filtered.map(d => `${d.invoiceNumber},${d.tenantName},${d.dueAmount},${d.dueDate.split('T')[0]},${d.daysOverdue},${d.status}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Due_Rents_Report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <PageHeader
        title="Due Rents"
        subtitle="Outstanding tenant balances, overdue aging logs, and active payment collections mapping."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <RotateCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Outstanding Rent</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalDue)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Pending collections total</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Overdue Invoices</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{countOverdue} Accounts</h3>
            <p className="text-[9px] text-slate-400 mt-1">Tenants in pending state</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg. Days Overdue</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{avgDays} Days</h3>
            <p className="text-[9px] text-slate-400 mt-1">Average collection delay</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-900/10 text-rose-800 border border-rose-900/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Critical Overdue (&gt;15 Days)</p>
            <h3 className="text-xl font-bold text-rose-700 leading-tight">{criticalOverdue} Alerts</h3>
            <p className="text-[9px] text-slate-400 mt-1">High priority collection cases</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Due Rent Registry</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">List of active rents due</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Tenant name or Invoice..."
              className="w-full bg-slate-50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenant</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Outstanding</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Overdue</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">Loading due rent records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">No pending dues found</td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {row.invoiceNumber}
                  </td>
                  <td className="py-4 text-xs font-bold text-slate-700 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      {row.tenantName ? row.tenantName.charAt(0).toUpperCase() : "?"}
                    </div>
                    {row.tenantName}
                  </td>
                  <td className="py-4 text-xs font-black text-rose-600 text-right">{fmt(row.dueAmount)}</td>
                  <td className="py-4 text-xs font-semibold text-slate-500">
                    {row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}
                  </td>
                  <td className="py-4 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      row.daysOverdue > 15 ? "bg-rose-50 text-rose-700 border border-rose-100" :
                      row.daysOverdue > 5 ? "bg-amber-50 text-amber-700 border border-amber-100" :
                      "bg-slate-50 text-slate-600 border border-slate-200"
                    )}>
                      {row.daysOverdue} Days
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                      Pending
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
