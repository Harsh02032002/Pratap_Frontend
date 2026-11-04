import React, { useState, useEffect } from "react";
import { RotateCcw, Download } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function RoomhyRevenueReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Roomhy Monthly Revenue Report - Roomhy Superadmin",
    description: "Detailed analysis of platform commission and fixed fee earnings.",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/analytics/roomhy-revenue");
      if (res && res.success) {
        setData(res.roomhyRevenue || []);
      }
    } catch (e) {
      console.error("RoomhyRevenueReport error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalGross = data.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalComm = data.reduce((acc, curr) => acc + (curr.commission || 0), 0);
  const totalGst = Math.round(totalComm * 0.18);
  const avgComm = data.length > 0 ? Math.round(totalComm / data.length) : 0;

  const exportCSV = () => {
    if (!data.length) return;
    const headers = "Month,Gross Collection,Platform Commission,GST (18%)\n";
    const rows = data.map(d => `${d.month},${d.revenue},${d.commission},${Math.round(d.commission * 0.18)}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Roomhy_Monthly_Revenue_Report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Roomhy Monthly Revenue</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Platform commission earnings, dynamic pricing fee share, and service revenue metrics.</p>
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

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Platform Commission</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(totalComm)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Avg. Monthly Commission</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(avgComm)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">GST Collected</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(totalGst)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Gross Managed Rent Vol.</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(totalGross)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart */}
        <div className="lg:col-span-8 bg-white p-4 rounded-[12px] border border-[#E1E6EA] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Revenue Collection Chart</h3>
              <p className="text-[11px] text-[#708088] mt-0.5">Month-wise gross volume vs commission</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[11px] font-semibold text-[#4A5961]">Gross Volume</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[11px] font-semibold text-[#4A5961]">Commission</span></div>
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="w-full h-full bg-[#F9FAFB] rounded-[8px] animate-pulse" />
            ) : data.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-[13px] text-[#4A5961]">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="commission" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#4A5961", fontSize: 11, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#4A5961", fontSize: 11, fontWeight: 600 }} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E1E6EA", fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" name="Gross Volume" stroke="#3B82F6" fillOpacity={1} fill="url(#revenue)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="commission" name="Platform Commission" stroke="#10B981" fillOpacity={1} fill="url(#commission)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="lg:col-span-4 bg-white p-4 rounded-[12px] border border-[#E1E6EA] shadow-xs flex flex-col overflow-hidden">
          <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider mb-3">Monthly Breakdown</h3>
          <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Month</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Gross</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Comm.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 font-medium text-[#10242A]">{row.month}</td>
                    <td className="py-2.5 text-[#4A5961] text-right">{fmt(row.revenue)}</td>
                    <td className="py-2.5 font-semibold text-[#14532D] text-right">{fmt(row.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
