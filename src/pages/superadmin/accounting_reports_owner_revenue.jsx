import React, { useState, useEffect } from "react";
import { Search, Download, RotateCcw, ShieldCheck } from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function OwnersRevenueReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useSEO({
    title: "Owners Monthly Revenue Report - Roomhy Superadmin",
    description: "Detailed revenue, platform fee and payout reports by property owner.",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/analytics/owner-revenue");
      if (res && res.success) {
        setData(res.ownerRevenue || []);
      }
    } catch (e) {
      console.error("OwnersRevenueReport error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = data.filter(d => 
    d.owner.toLowerCase().includes(search.toLowerCase())
  );

  const totalGross = filtered.reduce((acc, curr) => acc + (curr.gross || 0), 0);
  const totalComm = filtered.reduce((acc, curr) => acc + (curr.commission || 0), 0);
  const totalNet = filtered.reduce((acc, curr) => acc + (curr.net || 0), 0);
  const avgPayout = filtered.length > 0 ? Math.round(totalNet / filtered.length) : 0;

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = "Owner,Gross Billing,Platform Commission,Net Payout\n";
    const rows = filtered.map(d => `${d.owner},${d.gross},${d.commission},${d.net}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Owners_Monthly_Revenue_Report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Owners Monthly Revenue</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Gross tenant billings, commission deduction logs, and net payouts settled to owners.</p>
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
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Gross Collections</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(totalGross)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Commissions Deducted</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(totalComm)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Net Owner Payouts Volume</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(totalNet)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Avg. Payout per Owner</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(avgPayout)}</h3>
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
            placeholder="Search Owner name..."
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
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Gross Billing</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Commission (10%)</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Net Payout</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[13px] text-[#4A5961]">Loading owner accounts...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[13px] text-[#4A5961]">No records found</td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5 font-medium text-[#10242A] flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#D9E1E7] text-[#4A5961] text-[11px] flex items-center justify-center font-bold shrink-0">
                      {row.owner.charAt(0).toUpperCase()}
                    </div>
                    {row.owner}
                  </td>
                  <td className="py-2.5 text-[#4A5961] text-right">{fmt(row.gross)}</td>
                  <td className="py-2.5 font-medium text-[#991B1B] text-right">-{fmt(row.commission)}</td>
                  <td className="py-2.5 font-bold text-[#14532D] text-right">{fmt(row.net)}</td>
                  <td className="py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[12px] font-semibold rounded-full bg-[#DDF3E4] text-[#14532D]">
                      <ShieldCheck className="w-3 h-3" /> Settled
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
