import React, { useState, useEffect } from "react";
import { Download, RotateCcw } from "lucide-react";
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from "recharts";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function ProfitLossReport() {
  const [data, setData] = useState({ grossRevenue: 0, commissionRevenue: 0, outflowsRefunds: 0, netOperatingIncome: 0 });
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Platform Profit & Loss Statement - Roomhy Superadmin",
    description: "Detailed platform income statements, refunds and net operating income.",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/analytics/profit-loss");
      if (res && res.success) {
        setData(res.profitLoss || { grossRevenue: 0, commissionRevenue: 0, outflowsRefunds: 0, netOperatingIncome: 0 });
      }
    } catch (e) {
      console.error("ProfitLossReport error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const profitMargin = data.commissionRevenue > 0 ? Math.round((data.netOperatingIncome / data.commissionRevenue) * 100) : 0;

  const chartData = [
    { name: "Net Profit", value: Math.max(0, data.netOperatingIncome), color: "#10B981" },
    { name: "Refund Outflows", value: data.outflowsRefunds, color: "#EF4444" }
  ];

  const exportCSV = () => {
    const headers = "Metric,Value\n";
    const rows = [
      `Gross Managed Billing Vol,${data.grossRevenue}`,
      `Gross Platform Commission,${data.commissionRevenue}`,
      `Processed Refunds Outflows,${data.outflowsRefunds}`,
      `Net Operating Profit,${data.netOperatingIncome}`,
      `Operating Margin %,${profitMargin}%`
    ].join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Profit_and_Loss_Report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Profit / Loss Report</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Platform fiscal performance summary, commission earnings vs refunds processing outflows.</p>
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
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Gross Commission Income</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(data.commissionRevenue)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Refund Outflows</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(data.outflowsRefunds)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Net Operating Income</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(data.netOperatingIncome)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Platform Margin %</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{profitMargin}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Income Statement Table */}
        <div className="lg:col-span-8 bg-white p-4 rounded-[12px] border border-[#E1E6EA] shadow-xs">
          <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider mb-4">Income Statement (P&L)</h3>
          <div className="divide-y divide-[#F0F4F6] text-[13px]">
            <div className="flex items-center justify-between py-2.5">
              <span className="font-medium text-[#10242A]">Gross Billings Managed (Total Volume)</span>
              <span className="text-[#4A5961]">{fmt(data.grossRevenue)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="font-medium text-[#10242A]">Platform Commission Share (Revenue)</span>
              <span className="font-semibold text-[#0E7C86]">{fmt(data.commissionRevenue)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="font-medium text-[#10242A]">Operating Outflow - Processed Tenant Refunds</span>
              <span className="font-semibold text-[#991B1B]">({fmt(data.outflowsRefunds)})</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="font-bold text-[#10242A]">Net Platform Operating Profit</span>
              <span className="font-bold text-[#14532D]">{fmt(data.netOperatingIncome)}</span>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-4 bg-white p-4 rounded-[12px] border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Revenue Distribution</h3>
          
          <div className="relative h-44 flex items-center justify-center my-3">
            {loading ? (
              <div className="w-full h-full bg-[#F9FAFB] rounded-[8px] animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                    {chartData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid #E1E6EA", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[16px] font-bold text-[#10242A]">{profitMargin}%</p>
              <p className="text-[11px] font-semibold text-[#708088] uppercase mt-0.5">Margin</p>
            </div>
          </div>

          <div className="space-y-2">
            {chartData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#4A5961] font-medium">{item.name}</span>
                </div>
                <span className="font-semibold text-[#10242A]">{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
