import React, { useState, useEffect } from "react";
import { Download, RotateCcw, Building2, Search, ShieldCheck } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function CashflowDashboardReport() {
  const [trendData, setTrendData] = useState([]);
  const [cashList, setCashList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useSEO({
    title: "Cashflow Dashboard - Roomhy Superadmin",
    description: "Detailed platform cash inflows, outflows and direct owner cash payment receipts.",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [trendRes, cashRes] = await Promise.all([
        fetchJson("/api/superadmin/finance/analytics/cashflow"),
        fetchJson("/api/superadmin/finance/payouts/cash-received")
      ]);

      if (trendRes && trendRes.success) {
        setTrendData(trendRes.cashflow || []);
      }
      if (cashRes && cashRes.success) {
        setCashList(cashRes.cashReceived || []);
      }
    } catch (e) {
      console.error("CashflowDashboardReport error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCash = cashList.filter(c => 
    (c.tenantName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.propertyName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.ownerLoginId || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalCashAmount = cashList.reduce((acc, curr) => acc + (curr.paidAmount || curr.rentAmount || 0), 0);
  const cashPaymentsCount = cashList.length;
  const avgCashPayment = cashPaymentsCount > 0 ? Math.round(totalCashAmount / cashPaymentsCount) : 0;
  const otpVerifiedCount = cashList.filter(c => c.cashRequestStatus === 'paid' || c.cashRequestStatus === 'received').length;

  const exportCSV = () => {
    if (!filteredCash.length) return;
    const headers = "Tenant,Property,Room,Amount Paid,Payment Date,Owner ID,Cash Request Status\n";
    const rows = filteredCash.map(c => 
      `"${c.tenantName}","${c.propertyName}","${c.roomNumber}",${c.paidAmount || c.rentAmount},"${c.paymentDate ? c.paymentDate.split('T')[0] : 'N/A'}","${c.ownerLoginId}","${c.cashRequestStatus || 'completed'}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Direct_Owner_Cash_Payments.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Cashflow Dashboard</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Platform inflows, outflows, and tracking of direct cash payments settled directly to property owners.</p>
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
            <Download className="w-3.5 h-3.5" /> Export Cash Payouts
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Cash Volume Received</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(totalCashAmount)}</h3>
            <p className="text-[11px] text-[#708088] mt-1">Direct cash paid by tenants</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Cash Payment Receipts</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{cashPaymentsCount} Payments</h3>
            <p className="text-[11px] text-[#708088] mt-1">Total cash payments transactions</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">OTP Verified Cash Receipts</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{otpVerifiedCount} Payments</h3>
            <p className="text-[11px] text-[#708088] mt-1">Dues matched and verified</p>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Avg. Cash Payment</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{fmt(avgCashPayment)}</h3>
            <p className="text-[11px] text-[#708088] mt-1">Average cash paid directly</p>
          </div>
        </div>
      </div>

      {/* Cashflow Chart */}
      <div className="bg-white p-4 rounded-[12px] border border-[#E1E6EA] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Inflow vs Outflow Trend</h3>
            <p className="text-[11px] text-[#708088] mt-0.5">Platform monthly cashflow cycles</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-[11px] font-semibold text-[#4A5961]">Cash Inflows</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span className="text-[11px] font-semibold text-[#4A5961]">Cash Outflows</span></div>
          </div>
        </div>
        <div className="h-64">
          {loading ? (
            <div className="w-full h-full bg-[#F9FAFB] rounded-[8px] animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#4A5961", fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#4A5961", fontSize: 11, fontWeight: 600 }} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E1E6EA", fontSize: 12 }} />
                <Bar dataKey="inflow" name="Cash Inflows" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="outflow" name="Cash Outflows" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
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
            placeholder="Search Tenant, Owner or Property..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
        <span className="text-[12px] font-medium text-[#4A5961]">Direct Cash Payments to Owners</span>
      </div>

      {/* Cash Paid to Owners Table */}
      <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property & Room</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Rent Paid</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Payment Date</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner ID</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[13px] text-[#4A5961]">Loading cash collections...</td>
                </tr>
              ) : filteredCash.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[13px] text-[#4A5961]">No direct cash payments logged</td>
                </tr>
              ) : filteredCash.map((row, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] flex items-center justify-center font-bold shrink-0">
                      {row.tenantName ? row.tenantName.charAt(0).toUpperCase() : "T"}
                    </div>
                    <div>
                      <p className="font-medium text-[#10242A] leading-none">{row.tenantName || 'Tenant'}</p>
                      <p className="text-[11px] text-[#708088] mt-1 leading-none">{row.tenantPhone || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <p className="font-medium text-[#10242A] leading-none flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#4A5961]" />
                      {row.propertyName}
                    </p>
                    <p className="text-[11px] text-[#708088] mt-1 leading-none">Room {row.roomNumber || "—"}</p>
                  </td>
                  <td className="py-2.5 font-semibold text-[#10242A] text-right">
                    {fmt(row.paidAmount || row.rentAmount || 0)}
                  </td>
                  <td className="py-2.5 text-[#4A5961]">
                    {row.paymentDate ? new Date(row.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Pending confirmation"}
                  </td>
                  <td className="py-2.5 font-mono text-[#4A5961]">
                    {row.ownerLoginId || "N/A"}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={cn(
                      "px-2.5 py-0.5 text-[12px] font-semibold rounded-full inline-flex items-center gap-1",
                      row.cashRequestStatus === 'paid' || row.cashRequestStatus === 'received'
                        ? "bg-[#DDF3E4] text-[#14532D]"
                        : "bg-[#FEF3C7] text-[#92400E]"
                    )}>
                      <ShieldCheck className="w-3 h-3" />
                      {row.cashRequestStatus === 'paid' || row.cashRequestStatus === 'received' ? "Verified" : "Paid to Owner"}
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
