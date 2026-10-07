import React, { useState, useEffect } from "react";
import { 
  FileText, Search, Download, RotateCcw, CreditCard, 
  IndianRupee, Calendar, ShieldCheck, AlertCircle, RefreshCcw
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import useSEO from "../../hooks/useSEO";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function TransactionsReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useSEO({
    title: "Transactions Report - Roomhy Superadmin",
    description: "Detailed analysis of razorpay collection transactions, payout splits and platform revenue.",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/analytics/transactions-report");
      if (res && res.success) {
        setData(res.transactions || []);
      }
    } catch (e) {
      console.error("TransactionsReport error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = data.filter(t => 
    (t.razorpay_payment_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.tenant_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.property_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalVolume = filtered.reduce((acc, curr) => acc + (curr.booking_amount || 0), 0);
  const totalComm = filtered.reduce((acc, curr) => acc + (curr.commission_amount || 0), 0);
  const countPaid = filtered.filter(t => t.payout_status === 'Paid').length;
  const countPending = filtered.filter(t => t.payout_status === 'Pending' || t.payout_status === 'Processing').length;

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = "Razorpay Payment ID,Booking ID,Tenant Name,Property Name,Booking Amount,Commission Amount,Owner Amount,Payout Status,Date\n";
    const rows = filtered.map(t => 
      `"${t.razorpay_payment_id || 'N/A'}","${t.booking_id}","${t.tenant_name}","${t.property_name}",${t.booking_amount},${t.commission_amount},${t.owner_amount},"${t.payout_status}","${t.payment_date ? t.payment_date.split('T')[0] : 'N/A'}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Transactions_Breakdown_Report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <PageHeader
        title="Transaction Reports"
        subtitle="Full log database of razorpay tenant collections, platform commission splits, and payouts tracking."
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Transaction Volume</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalVolume)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Gross platform bookings cleared</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Settled Payouts Count</p>
            <h3 className="text-xl font-bold text-emerald-600 leading-tight">{countPaid} Settled</h3>
            <p className="text-[9px] text-slate-400 mt-1">Transferred to owner wallets</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Payouts</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{countPending} Accounts</h3>
            <p className="text-[9px] text-slate-400 mt-1">Payout settlements in queue</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Platform Fees</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalComm)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Total commission share collected</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Transaction Registry</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Database audit log of bookings</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ID, Tenant or Property..."
              className="w-full bg-slate-50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment ID</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenant</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Owner share</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Comm.</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Payout</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">Loading transaction records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">No transactions found</td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 text-xs font-bold text-slate-800">
                    <span className="font-mono text-slate-500">{row.razorpay_payment_id || 'N/A'}</span>
                  </td>
                  <td className="py-4 text-xs font-bold text-slate-700">
                    {row.tenant_name}
                  </td>
                  <td className="py-4 text-xs font-semibold text-slate-600">
                    {row.property_name}
                  </td>
                  <td className="py-4 text-xs font-black text-slate-800 text-right">{fmt(row.booking_amount)}</td>
                  <td className="py-4 text-xs font-semibold text-slate-600 text-right">{fmt(row.owner_amount)}</td>
                  <td className="py-4 text-xs font-semibold text-rose-500 text-right">{fmt(row.commission_amount)}</td>
                  <td className="py-4 text-xs font-semibold text-slate-500">
                    {row.payment_date ? new Date(row.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}
                  </td>
                  <td className="py-4 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      row.payout_status === 'Paid' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      "bg-amber-50 text-amber-600 border border-amber-100"
                    )}>
                      {row.payout_status || 'Pending'}
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
