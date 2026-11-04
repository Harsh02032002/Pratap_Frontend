import React, { useState, useEffect } from "react";
import { Search, Download, RotateCcw } from "lucide-react";
import { fetchJson } from "../../utils/api";
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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Due Rents</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Outstanding tenant balances, overdue aging logs, and active payment collections mapping.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className={cn("w-3.5 h-3.5 text-[#0E7C86]", loading && "animate-spin")} /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-[#0E7C86] text-white px-4 py-1.5 rounded-[8px] text-[13px] font-semibold hover:bg-[#095256] transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Outstanding Rent</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(totalDue)}</h3>
            <p className="text-[11px] text-[#708088] mt-1">Pending collections total</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Overdue Invoices</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{countOverdue} Accounts</h3>
            <p className="text-[11px] text-[#708088] mt-1">Tenants in pending state</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Avg. Days Overdue</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{avgDays} Days</h3>
            <p className="text-[11px] text-[#708088] mt-1">Average collection delay</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Critical Overdue (&gt;15 Days)</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{criticalOverdue} Alerts</h3>
            <p className="text-[11px] text-[#708088] mt-1">High priority collection cases</p>
          </div>
        </div>
      </div>

      {/* Outside Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Tenant name or Invoice..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Invoice</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Outstanding</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Due Date</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Overdue</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[13px] text-[#4A5961]">Loading due rent records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[13px] text-[#4A5961]">No pending dues found</td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5 font-mono font-semibold text-[#0E7C86]">
                    {row.invoiceNumber}
                  </td>
                  <td className="py-2.5 font-medium text-[#10242A] flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#D9E1E7] text-[#4A5961] text-[11px] flex items-center justify-center font-bold shrink-0">
                      {row.tenantName ? row.tenantName.charAt(0).toUpperCase() : "?"}
                    </div>
                    {row.tenantName}
                  </td>
                  <td className="py-2.5 font-semibold text-[#991B1B] text-right">{fmt(row.dueAmount)}</td>
                  <td className="py-2.5 text-[#4A5961]">
                    {row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={cn(
                      "inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold",
                      row.daysOverdue > 15 ? "bg-[#FDE8E8] text-[#991B1B]" :
                      row.daysOverdue > 5 ? "bg-[#FEF3C7] text-[#92400E]" :
                      "bg-[#E8EDF1] text-[#4A5961]"
                    )}>
                      {row.daysOverdue} Days
                    </span>
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="inline-block px-2.5 py-0.5 text-[12px] font-semibold rounded-full bg-[#FDE8E8] text-[#991B1B]">
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
