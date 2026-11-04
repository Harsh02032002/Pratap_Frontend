import React, { useState, useEffect } from "react";
import { 
  Wallet, IndianRupee, Database, Receipt, RotateCcw,
  ArrowUpRight, ArrowDownRight, ChevronRight, Search,
  Download, Filter, MoreVertical, Building2, Users,
  FileText, AlertCircle, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, Calendar, CreditCard,
  History, Clock, PieChart as PieIcon, BarChart3,
  Activity, Bell, Send, Inbox, ArrowRight, Briefcase,
  RefreshCw
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function SuperadminAccountingDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    commissionEarned: 0,
    ownerEarnings: 0,
    pendingPayouts: 0,
    paidPayouts: 0,
    walletBalance: 0,
    totalTransactions: 0
  });
  const [trend, setTrend] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, txRes] = await Promise.all([
        fetchJson("/api/superadmin/revenue/stats"),
        fetchJson("/api/superadmin/revenue/transactions")
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        setTrend(statsRes.trend);
      }

      if (txRes.success) {
        setTxs(txRes.payments.slice(0, 5).map(t => ({
          id: String(t.id).slice(-6).toUpperCase(),
          tenant: t.tenant_name,
          property: t.property_name,
          amount: `₹${t.amount?.toLocaleString('en-IN')}`,
          date: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          status: t.payout_status === 'Paid' ? 'Success' : t.payout_status === 'Pending' ? 'Pending' : 'Failed',
          type: 'Rent'
        })));
      }
    } catch (err) {
      console.error("Failed to load accounting dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalPayoutVolume = (stats.paidPayouts || 0) + (stats.pendingPayouts || 0);
  const paidPct = totalPayoutVolume > 0 ? Math.round((stats.paidPayouts / totalPayoutVolume) * 100) : 0;
  const unpaidPct = totalPayoutVolume > 0 ? (100 - paidPct) : 100;
  const dueRentData = [
    { name: "Paid", value: paidPct, color: "#10b981" },
    { name: "Unpaid", value: unpaidPct, color: "#f59e0b" },
  ];

  const revenueDistData = [
    { name: "Service Fees", value: stats.commissionEarned > 0 ? 45 : 0, color: "#0E7C86" },
    { name: "Rent Commission", value: stats.commissionEarned > 0 ? 35 : 0, color: "#10b981" },
    { name: "Other Charges", value: stats.commissionEarned > 0 ? 20 : 100, color: "#f59e0b" },
  ];

  if (loading) {
    return <div className="p-6 flex justify-center items-center h-full text-[#4A5961] font-bold">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Accounting Overview</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">{`Track collections, payouts, and earnings across all ${stats.totalTransactions || 0} transactions.`}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadDashboard} className="flex items-center gap-2 bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5 text-[#0E7C86]" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCardHorizontal label="Collections" value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`} trend="Total" up />
        <StatCardHorizontal label="Payouts" value={`₹${(stats.paidPayouts || 0).toLocaleString('en-IN')}`} trend="Settled" up />
        <StatCardHorizontal label="Revenue" value={`₹${(stats.commissionEarned || 0).toLocaleString('en-IN')}`} trend="Commission" up />
        <StatCardHorizontal label="Liquidity" value={`₹${(stats.walletBalance || 0).toLocaleString('en-IN')}`} trend="Net Wallet" up={true} />
        <StatCardHorizontal label="Liability" value={`₹${(stats.pendingPayouts || 0).toLocaleString('en-IN')}`} trend="Pending" up={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Trend Area */}
        <div className="lg:col-span-8 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Revenue & Payouts Trend</h3>
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#0E7C86]" /><span className="text-[11px] font-semibold text-[#4A5961] uppercase">Collections</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#E11D48]" /><span className="text-[11px] font-semibold text-[#4A5961] uppercase">Payouts</span></div>
              </div>
           </div>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={trend}>
                    <defs>
                       <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E7C86" stopOpacity={0.12}/>
                          <stop offset="95%" stopColor="#0E7C86" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 11, fontWeight: 600}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 11, fontWeight: 600}} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #E1E6EA', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: '12px', fontWeight: 600}} />
                    <Area type="monotone" dataKey="collection" stroke="#0E7C86" fillOpacity={1} fill="url(#colorColl)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="payout" stroke="#E11D48" fill="none" strokeWidth={2.5} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Ledger */}
        <div className="lg:col-span-4 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Recent Transactions</h3>
              <button onClick={() => window.location.href = '/superadmin/accounting/transactions'} className="text-[12px] font-semibold text-[#0E7C86] hover:underline">View All</button>
           </div>
           <div className="flex-1 divide-y divide-[#F0F4F6]">
              {txs.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 hover:bg-[#F9FAFB] transition-colors px-2">
                   <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#10242A] truncate leading-tight">{tx.tenant}</p>
                      <p className="text-[11px] text-[#708088] mt-0.5">{tx.id} • {tx.property}</p>
                   </div>
                   <div className="text-right shrink-0 ml-3">
                      <p className="text-[13px] font-semibold text-[#10242A] leading-none">{tx.amount}</p>
                      <p className="text-[11px] text-[#708088] mt-1">{tx.date}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Mini Insights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <MiniStatCard label="Payouts" value={stats.payoutsCount !== undefined ? stats.payoutsCount.toLocaleString('en-IN') : "0"} />
         <MiniStatCard label="Fees" value={stats.commissionEarned !== undefined ? `₹${(stats.commissionEarned/1000).toFixed(1)}K` : "₹0.0K"} />
         <MiniStatCard label="Refunds" value={stats.refundsCount !== undefined ? stats.refundsCount.toLocaleString('en-IN') : "0"} />
         <MiniStatCard label="GST" value={stats.gstCollected !== undefined ? `₹${(stats.gstCollected/1000).toFixed(1)}K` : "₹0.0K"} />
      </div>

      {/* Bottom Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DonutCard title="Rent Due Status" data={dueRentData} total={`₹${(stats.pendingPayouts || 0).toLocaleString('en-IN')}`} />
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Revenue Sources</h3>
           </div>
           <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={revenueDistData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600, fill: '#4A5961'}} width={100} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: '1px solid #E1E6EA', fontSize: '12px', fontWeight: 600}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={10}>
                       {revenueDistData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
           <div>
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#4A5961]">Export Data</h3>
              </div>
              <h4 className="text-[18px] font-bold text-[#10242A] tracking-tight mb-1">Financial Reports</h4>
              <p className="text-[12px] text-[#4A5961] leading-relaxed">Download financial ledger reports and summaries.</p>
           </div>
           <button onClick={() => window.location.href = '/superadmin/accounting/reports'} className="w-full py-2 bg-[#0E7C86] text-white rounded-[8px] text-[13px] font-semibold shadow-xs hover:bg-[#095256] transition-all cursor-pointer">Download Report</button>
        </div>
      </div>
    </div>
  );
}

function StatCardHorizontal({ label, value, trend }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
      <div className="mt-2">
        <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{value}</h3>
        {trend && <p className="text-[11px] text-[#708088] mt-1">{trend}</p>}
      </div>
    </div>
  );
}

function MiniStatCard({ label, value }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
      <div className="mt-2">
        <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  );
}

function DonutCard({ title, data, total }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col">
      <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider mb-4">{title}</h3>
      <div className="flex items-center gap-4">
        <div className="relative w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={10} stroke="none">
                {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[13px] font-bold text-[#10242A] leading-none">{total}</p>
            <p className="text-[10px] text-[#708088] font-semibold uppercase mt-1">Due</p>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {data.map((item, i) => (
            <div key={i} className="group">
               <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                     <span className="text-[12px] font-medium text-[#4A5961]">{item.name}</span>
                  </div>
                  <p className="text-[12px] font-semibold text-[#10242A]">{item.value}%</p>
               </div>
               <div className="w-full h-1.5 bg-[#F0F4F6] rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
