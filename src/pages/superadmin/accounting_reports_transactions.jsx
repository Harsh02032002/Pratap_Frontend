import React, { useState, useEffect } from "react";
import { Search, Download, RotateCcw } from "lucide-react";
import { fetchJson } from "../../utils/api";
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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Transaction Reports</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Full log database of razorpay tenant collections, platform commission splits, and payouts tracking.</p>
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
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Transaction Volume</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(totalVolume)}</h3>
            <p className="text-[11px] text-[#708088] mt-1">Gross platform bookings cleared</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Settled Payouts Count</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{countPaid} Settled</h3>
            <p className="text-[11px] text-[#708088] mt-1">Transferred to owner wallets</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Pending Payouts</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{countPending} Accounts</h3>
            <p className="text-[11px] text-[#708088] mt-1">Payout settlements in queue</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Platform Fees</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(totalComm)}</h3>
            <p className="text-[11px] text-[#708088] mt-1">Total commission share collected</p>
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
            placeholder="Search ID, Tenant or Property..."
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
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Payment ID</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Amount</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Owner Share</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Comm.</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Date</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-[13px] text-[#4A5961]">Loading transaction records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-[13px] text-[#4A5961]">No transactions found</td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5">
                    <span className="font-mono text-[12px] font-semibold text-[#0E7C86] bg-[#E8F3F4] px-2 py-0.5 rounded-[6px]">{row.razorpay_payment_id || 'N/A'}</span>
                  </td>
                  <td className="py-2.5 font-medium text-[#10242A]">
                    {row.tenant_name}
                  </td>
                  <td className="py-2.5 text-[#4A5961]">
                    {row.property_name}
                  </td>
                  <td className="py-2.5 font-semibold text-[#10242A] text-right">{fmt(row.booking_amount)}</td>
                  <td className="py-2.5 text-[#4A5961] text-right">{fmt(row.owner_amount)}</td>
                  <td className="py-2.5 font-medium text-[#991B1B] text-right">{fmt(row.commission_amount)}</td>
                  <td className="py-2.5 text-[#4A5961]">
                    {row.payment_date ? new Date(row.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={cn(
                      "inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold",
                      row.payout_status === 'Paid' ? "bg-[#DDF3E4] text-[#14532D]" :
                      "bg-[#FEF3C7] text-[#92400E]"
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
