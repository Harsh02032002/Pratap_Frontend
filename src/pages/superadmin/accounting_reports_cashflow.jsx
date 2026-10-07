import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Download, RotateCcw, IndianRupee, ArrowUpRight, 
  ArrowDownRight, CheckCircle2, DollarSign, Wallet, Calendar,
  User, Building2, Search, Zap, ShieldCheck
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
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
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <PageHeader
        title="Cashflow Dashboard"
        subtitle="Platform inflows, outflows, and tracking of direct cash payments settled directly to property owners."
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
              <Download className="w-3.5 h-3.5" /> Export Cash Payouts
            </button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Cash Volume Received</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalCashAmount)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Direct cash paid by tenants</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cash Payment Receipts</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{cashPaymentsCount} Payments</h3>
            <p className="text-[9px] text-slate-400 mt-1">Total cash payments transactions</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">OTP Verified Cash receipts</p>
            <h3 className="text-xl font-bold text-emerald-600 leading-tight">{otpVerifiedCount} Payments</h3>
            <p className="text-[9px] text-slate-400 mt-1">Dues matched and verified</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg. Cash Payment</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{fmt(avgCashPayment)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Average cash paid directly</p>
          </div>
        </div>
      </div>

      {/* Cashflow Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Inflow vs Outflow Trend</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Platform monthly cashflow cycles</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">Cash Inflows</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">Cash Outflows</span></div>
          </div>
        </div>
        <div className="h-64">
          {loading ? (
            <div className="w-full h-full bg-slate-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 700 }} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 12, border: "none", fontSize: 11 }} />
                <Bar dataKey="inflow" name="Cash Inflows" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="outflow" name="Cash Outflows" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cash Paid to Owners Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Direct Cash Payments to Owners</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tenants paying rent directly to owner via Cash</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Tenant, Owner or Property..."
              className="w-full bg-slate-50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenant</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property & Room</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Rent Paid</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Date</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner ID</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">Loading cash collections...</td>
                </tr>
              ) : filteredCash.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">No direct cash payments logged</td>
                </tr>
              ) : filteredCash.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 text-xs font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      {row.tenantName ? row.tenantName.charAt(0).toUpperCase() : "T"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-none">{row.tenantName || 'Tenant'}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 leading-none">{row.tenantPhone || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="py-4 text-xs">
                    <p className="font-bold text-slate-700 leading-none flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {row.propertyName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">Room {row.roomNumber || "—"}</p>
                  </td>
                  <td className="py-4 text-xs font-black text-slate-800 text-right">
                    {fmt(row.paidAmount || row.rentAmount || 0)}
                  </td>
                  <td className="py-4 text-xs font-semibold text-slate-500">
                    {row.paymentDate ? new Date(row.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Pending confirmation"}
                  </td>
                  <td className="py-4 text-xs font-bold text-slate-600">
                    {row.ownerLoginId || "N/A"}
                  </td>
                  <td className="py-4 text-center">
                    <span className={cn(
                      "px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border flex items-center gap-1 w-max mx-auto",
                      row.cashRequestStatus === 'paid' || row.cashRequestStatus === 'received'
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      <ShieldCheck className="w-3.5 h-3.5" />
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
