import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, 
  RotateCcw, Download, Percent, IndianRupee, Database, Scale,
  ChevronRight
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
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
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <PageHeader
        title="Roomhy Monthly Revenue"
        subtitle="Platform commission earnings, dynamic pricing fee share, and service revenue metrics."
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

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Platform Commission</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalComm)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Net platform earnings from bookings</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg. Monthly Commission</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(avgComm)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Average commission share per month</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">GST Collected (18%)</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalGst)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Tax liability on platform commission</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gross Managed Rent Vol.</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalGross)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Total billing transactions cleared</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue Collection Chart</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Month-wise gross volume vs commission</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">Gross Volume</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">Commission</span></div>
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="w-full h-full bg-slate-50 rounded-xl animate-pulse" />
            ) : data.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-semibold">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="commission" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 700 }} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 12, border: "none", fontSize: 11 }} />
                  <Area type="monotone" dataKey="revenue" name="Gross Volume" stroke="#3B82F6" fillOpacity={1} fill="url(#revenue)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="commission" name="Platform Commission" stroke="#10B981" fillOpacity={1} fill="url(#commission)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5">Monthly Breakdown</h3>
          <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month</th>
                  <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Gross</th>
                  <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Comm.</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 text-xs font-bold text-slate-700">{row.month}</td>
                    <td className="py-3 text-xs font-semibold text-slate-500 text-right">{fmt(row.revenue)}</td>
                    <td className="py-3 text-xs font-black text-emerald-600 text-right">{fmt(row.commission)}</td>
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
