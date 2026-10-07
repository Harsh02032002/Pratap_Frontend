import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Download, RotateCcw, IndianRupee, ArrowUpRight, 
  ArrowDownRight, Scale, RotateCw, Percent, ChevronRight
} from "lucide-react";
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from "recharts";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
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
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <PageHeader
        title="Profit / Loss Report"
        subtitle="Platform fiscal performance summary, commission earnings vs refunds processing outflows."
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
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gross Commission Income</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(data.commissionRevenue)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Managed revenue share total</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <RotateCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Refund Outflows</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(data.outflowsRefunds)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Deducted payouts returned</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Operating Income</p>
            <h3 className="text-xl font-bold text-emerald-600 leading-tight">{fmt(data.netOperatingIncome)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Net platform operating profit</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Platform Margin %</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{profitMargin}%</h3>
            <p className="text-[9px] text-slate-400 mt-1">Operating profit margin ratio</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Income Statement Table */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Income Statement (P&L)</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Gross Billings Managed (Total Volume)</span>
              <span className="text-xs font-semibold text-slate-500">{fmt(data.grossRevenue)}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Platform Commission Share (Revenue)</span>
              <span className="text-xs font-semibold text-blue-600">{fmt(data.commissionRevenue)}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Operating Outflow - Processed Tenant Refunds</span>
              <span className="text-xs font-semibold text-rose-500">({fmt(data.outflowsRefunds)})</span>
            </div>
            <div className="flex items-center justify-between pt-2 pb-3 border-t border-dashed border-slate-200">
              <span className="text-xs font-black text-slate-800">Net Platform Operating profit</span>
              <span className="text-sm font-black text-emerald-600">{fmt(data.netOperatingIncome)}</span>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue Distribution</h3>
          
          <div className="relative h-44 flex items-center justify-center my-4">
            {loading ? (
              <div className="w-full h-full bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                    {chartData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-base font-black text-slate-800">{profitMargin}%</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Margin</p>
            </div>
          </div>

          <div className="space-y-2">
            {chartData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-500 font-semibold">{item.name}</span>
                </div>
                <span className="font-black text-slate-800">{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
