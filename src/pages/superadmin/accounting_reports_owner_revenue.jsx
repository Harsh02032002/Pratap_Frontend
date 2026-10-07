import React, { useState, useEffect } from "react";
import { 
  Users, Search, Download, RotateCcw, IndianRupee, Wallet, 
  ArrowUpRight, ArrowDownRight, Percent, ShieldCheck, ChevronRight
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
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
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <PageHeader
        title="Owners Monthly Revenue"
        subtitle="Gross tenant billings, commission deduction logs, and net payouts settled to owners."
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gross Collections</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalGross)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Tenant payments gross volume</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Commissions Deducted</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalComm)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Roomhy commission earnings</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Owner Payouts Volume</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalNet)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Volume transferred to owner bank accounts</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg. Payout per Owner</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(avgPayout)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Average net settlement amount</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Owner Revenue Ledger</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Individual Owner Financial breakdown</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Owner name..."
              className="w-full bg-slate-50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Gross Billing</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Commission (10%)</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Net Payout</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">Loading owner accounts...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">No records found</td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 text-xs font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      {row.owner.charAt(0).toUpperCase()}
                    </div>
                    {row.owner}
                  </td>
                  <td className="py-4 text-xs font-semibold text-slate-500 text-right">{fmt(row.gross)}</td>
                  <td className="py-4 text-xs font-semibold text-rose-500 text-right">-{fmt(row.commission)}</td>
                  <td className="py-4 text-xs font-black text-emerald-600 text-right">{fmt(row.net)}</td>
                  <td className="py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
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
