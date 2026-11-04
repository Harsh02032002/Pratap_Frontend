import React, { useState, useEffect } from "react";
import { 
  Wallet, CreditCard, TrendingUp, Clock, AlertCircle,
  IndianRupee, ArrowUpRight, Calendar, RefreshCw,
  CheckCircle2, Bell, Settings, Activity, Building2, Users
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { fetchAccountingOverviewStats } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const fmt = (n) => {
  if (!n || n === 0) return "₹0";
  return `₹${Number(n).toLocaleString("en-IN")}`;
};

export default function AccountingOverview() {
  const [stats, setStats] = useState({
    summary: { totalCollection: 0, totalPayout: 0, revenue: 0, dueRent: 0, pendingPayout: 0 },
    trends: [],
    ledger: [],
    dueRentAging: []
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("This Month");

  useSEO({
    title: "Accounting Overview - Roomhy",
    description: "Track payouts and outstanding rents.",
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetchAccountingOverviewStats();
      if (res && (res.success || res.summary)) {
        setStats(res);
      }
    } catch (error) {
      console.error("Error fetching accounting stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const { summary, trends, ledger, dueRentAging } = stats;
  const totalDue = summary.dueRent || 0;

  // Derived stats
  const totalRevenue = summary.totalCollection || 0;
  const ownerExpense = summary.totalPayout || 0;
  const platformRevenue = summary.revenue || 0;

  // Mini sparkline data (fallback)
  const sparkline = trends.length > 0 ? trends : [
    { name: "J", collection: 0 }, { name: "F", collection: 0 }, { name: "M", collection: 0 }
  ];

  // Cashflow derived
  const closingBalance = totalRevenue - ownerExpense;

  // Donut aging - filter empty
  const agingData = (dueRentAging || []).filter(d => d.value > 0);

  // Top stat cards
  const statCards = [
    { label: "Total Collected", val: fmt(totalRevenue), sub: "Rent from tenants" },
    { label: "Total Paid Out", val: fmt(ownerExpense), sub: "Sent to owners" },
    { label: "Due Rent", val: fmt(totalDue), sub: "Pending from tenants" },
    { label: "Pending Payout", val: fmt(summary.pendingPayout || 0), sub: "Owner payout pending" },
  ];

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Accounting Overview</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Live financial summary of the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
          <button onClick={loadStats} className="flex items-center gap-2 bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer">
            <RefreshCw className={cn("w-3.5 h-3.5 text-[#0E7C86]", loading && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{card.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">
                {loading ? "—" : card.val}
              </h3>
              <p className="text-[11px] text-[#708088] mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Collection vs Payout Trend Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Collection vs Payout Trend</h3>
              <p className="text-[11px] text-[#708088] mt-0.5">Monthly · This Year</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[11px] font-semibold text-[#4A5961]">Collection</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[11px] font-semibold text-[#4A5961]">Payout</span></div>
            </div>
          </div>
          <div className="h-64">
            {trends.length === 0 && !loading ? (
              <div className="w-full h-full flex items-center justify-center text-[13px] text-[#4A5961] bg-[#F9FAFB] rounded-[8px]">
                No transaction data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkline}>
                  <defs>
                    <linearGradient id="coll" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pay" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#4A5961", fontSize: 11, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#4A5961", fontSize: 11, fontWeight: 600 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <Tooltip
                    formatter={(v, name) => [`₹${Number(v).toLocaleString("en-IN")}`, name === "collection" ? "Collection" : "Payout"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E1E6EA", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="collection" stroke="#3B82F6" strokeWidth={2.5} fill="url(#coll)" dot={{ fill: "#3B82F6", r: 3 }} />
                  <Area type="monotone" dataKey="payout" stroke="#10B981" strokeWidth={2.5} fill="url(#pay)" dot={{ fill: "#10B981", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Recent Transactions</h3>
            <button className="text-[12px] font-semibold text-[#0E7C86] hover:underline">View All</button>
          </div>
          <div className="divide-y divide-[#F0F4F6] flex-1 overflow-y-auto max-h-[280px] custom-scrollbar">
            {loading ? (
              <div className="py-6 text-center text-[13px] text-[#4A5961]">Loading...</div>
            ) : ledger.length === 0 ? (
              <div className="py-6 text-center text-[13px] text-[#4A5961]">No transactions yet</div>
            ) : ledger.slice(0, 8).map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 hover:bg-[#F9FAFB] transition-colors px-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold",
                  t.color === "green" ? "bg-[#DDF3E4] text-[#14532D]" : "bg-[#E1ECF4] text-[#1E3A5F]"
                )}>
                  {t.type ? t.type.split(" ").map(x => x[0]).join("") : "TX"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[#10242A] truncate leading-none">{t.desc}</p>
                    <p className={cn(
                      "text-[13px] font-semibold shrink-0 ml-2",
                      String(t.amount).startsWith("+") ? "text-[#14532D]" : "text-[#991B1B]"
                    )}>{t.amount}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-[#708088]">{t.date}</p>
                    <span className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                      t.status === "Success" ? "bg-[#DDF3E4] text-[#14532D]" : "bg-[#E1ECF4] text-[#1E3A5F]"
                    )}>{t.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Due Rent Aging Donut */}
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4">
          <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider mb-0.5">Due Rent Overview</h3>
          <p className="text-[11px] text-[#708088] mb-3">Age-wise breakdown</p>
          {agingData.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-[#4A5961]">
              <p className="text-[13px] font-semibold text-[#14532D]">No Due Rents!</p>
            </div>
          ) : (
            <>
              <div className="relative h-44 flex items-center justify-center mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={agingData} innerRadius={55} outerRadius={78} paddingAngle={4} dataKey="value" stroke="none">
                      {agingData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[16px] font-bold text-[#10242A]">{fmt(totalDue)}</p>
                  <p className="text-[11px] font-semibold text-[#708088] uppercase mt-0.5">Total Due</p>
                </div>
              </div>
              <div className="space-y-2">
                {agingData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[12px] font-medium text-[#4A5961]">{item.name}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-[#10242A]">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Collections Trend Card */}
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Collections Trend</h3>
            <span className="text-[11px] font-semibold text-[#0E7C86] bg-[#E8F3F4] px-2.5 py-0.5 rounded-full">{period}</span>
          </div>
          <div className="space-y-2.5 mb-3">
            {[
              { label: "Owner Expense", val: ownerExpense, color: "text-[#0E7C86]" },
              { label: "Total Collections", val: totalRevenue, color: "text-[#10242A]" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[13px] text-[#4A5961]">{row.label}</span>
                <span className={cn("text-[13px] font-semibold", row.color)}>{fmt(row.val)}</span>
              </div>
            ))}
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline}>
                <Line type="monotone" dataKey="collection" stroke="#0E7C86" strokeWidth={2} dot={false} />
                <Tooltip
                  formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, "Collection"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #E1E6EA", fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-[#F0F4F6] mt-3 pt-3 flex items-center justify-between">
            <span className="text-[12px] text-[#4A5961]">Available Cash Balance</span>
            <span className="text-[14px] font-bold text-[#14532D]">{fmt(closingBalance)}</span>
          </div>
        </div>

        {/* Cashflow Summary */}
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Cashflow Summary</h3>
              <span className="text-[11px] font-semibold text-[#708088] uppercase">{period}</span>
            </div>
            <div className="divide-y divide-[#F0F4F6]">
              {[
                { label: "Opening Balance", val: 0, color: "text-[#10242A]" },
                { label: "Total Collections", val: totalRevenue, color: "text-[#0E7C86]" },
                { label: "Total Payouts", val: ownerExpense, color: "text-[#991B1B]" },
                { label: "Closing Balance", val: closingBalance, color: closingBalance >= 0 ? "text-[#14532D]" : "text-[#991B1B]" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <span className="text-[13px] text-[#4A5961]">{row.label}</span>
                  <span className={cn("text-[13px] font-semibold", row.color)}>{fmt(row.val)}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full mt-3 py-2 text-[13px] font-semibold text-[#0E7C86] border border-[#CBD3D9] rounded-[8px] hover:bg-gray-50 transition-all cursor-pointer">
            View Full Report →
          </button>
        </div>
      </div>
    </div>
  );
}
