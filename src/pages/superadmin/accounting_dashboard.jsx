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
    { name: "Service Fees", value: stats.commissionEarned > 0 ? 45 : 0, color: "#2563eb" },
    { name: "Rent Commission", value: stats.commissionEarned > 0 ? 35 : 0, color: "#10b981" },
    { name: "Other Charges", value: stats.commissionEarned > 0 ? 20 : 100, color: "#f59e0b" },
  ];

  if (loading) {
    return <div className="p-6 flex justify-center items-center h-full text-slate-400 font-bold">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Overview</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
               Track collections, payouts, and earnings across all {stats.totalTransactions || 0} transactions.
            </p>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
               <Calendar className="w-3.5 h-3.5 text-slate-400" />
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Live Database</span>
            </div>
            <button onClick={loadDashboard} className="p-2 rounded-xl bg-slate-800 text-white shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all"><RefreshCw className="w-3.5 h-3.5" /></button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCardHorizontal label="Collections" value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`} trend="Total" up icon={IndianRupee} color="blue" />
        <StatCardHorizontal label="Payouts" value={`₹${(stats.paidPayouts || 0).toLocaleString('en-IN')}`} trend="Settled" up icon={Wallet} color="rose" />
        <StatCardHorizontal label="Revenue" value={`₹${(stats.commissionEarned || 0).toLocaleString('en-IN')}`} trend="Commission" up icon={BarChart3} color="emerald" />
        <StatCardHorizontal label="Liquidity" value={`₹${(stats.walletBalance || 0).toLocaleString('en-IN')}`} trend="Net Wallet" up={true} icon={Database} color="indigo" />
        <StatCardHorizontal label="Liability" value={`₹${(stats.pendingPayouts || 0).toLocaleString('en-IN')}`} trend="Pending" up={false} icon={RotateCcw} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Revenue & Payouts Trend</h3>
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-600" /><span className="text-[8px] font-bold text-slate-400 uppercase">Collections</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-600" /><span className="text-[8px] font-bold text-slate-400 uppercase">Payouts</span></div>
              </div>
           </div>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={trend}>
                    <defs>
                       <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 700}} />
                    <Area type="monotone" dataKey="collection" stroke="#2563eb" fillOpacity={1} fill="url(#colorColl)" strokeWidth={3} />
                    <Area type="monotone" dataKey="payout" stroke="#ef4444" fill="none" strokeWidth={3} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Ledger */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Recent Transactions</h3>
              <button onClick={() => window.location.href = '/superadmin/accounting/transactions'} className="text-[9px] font-bold text-blue-600 hover:underline uppercase tracking-widest">View All</button>
           </div>
           <div className="flex-1 space-y-4">
              {txs.map((tx, i) => (
                <div key={i} className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 transition-all p-2 rounded-xl border border-transparent hover:border-slate-100">
                   <div className={cn(
                     "w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-105",
                     tx.status === "Success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : tx.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                   )}>
                      <Receipt className="w-4 h-4" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{tx.tenant}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{tx.id} • {tx.property}</p>
                   </div>
                   <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-slate-800 leading-none">{tx.amount}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">{tx.date}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Mini Insights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <MiniStatCard label="Payouts" value={stats.payoutsCount !== undefined ? stats.payoutsCount.toLocaleString('en-IN') : "0"} icon={Briefcase} color="emerald" />
         <MiniStatCard label="Fees" value={stats.commissionEarned !== undefined ? `₹${(stats.commissionEarned/1000).toFixed(1)}K` : "₹0.0K"} icon={Database} color="indigo" />
         <MiniStatCard label="Refunds" value={stats.refundsCount !== undefined ? stats.refundsCount.toLocaleString('en-IN') : "0"} icon={RotateCcw} color="rose" />
         <MiniStatCard label="GST" value={stats.gstCollected !== undefined ? `₹${(stats.gstCollected/1000).toFixed(1)}K` : "₹0.0K"} icon={FileText} color="amber" />
      </div>

      {/* Bottom Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DonutCard title="Rent Due Status" data={dueRentData} total={`₹${(stats.pendingPayouts || 0).toLocaleString('en-IN')}`} />
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Revenue Sources</h3>
              <div className="p-1 rounded-lg bg-slate-50 border border-slate-100"><BarChart3 className="w-3 h-3 text-slate-400" /></div>
           </div>
           <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={revenueDistData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700, fill: '#94a3b8'}} width={80} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 700}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={10}>
                       {revenueDistData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-lg shadow-slate-900/20">
           <div>
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Export Data</h3>
                 <Download className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="text-xl font-bold tracking-tight mb-2">Financial Reports</h4>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Download financial ledger reports and summaries.</p>
           </div>
           <button onClick={() => window.location.href = '/superadmin/accounting/reports'} className="w-full py-3 bg-blue-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">Download Report</button>
        </div>
      </div>
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    rose: "bg-rose-50 text-rose-600 border-rose-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100" 
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md flex items-start gap-3 group hover:translate-y-[-2px] transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none truncate">{label}</p>
         <p className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-2">{value}</p>
         <div className={cn(
           "flex items-center gap-1 text-[7px] font-bold uppercase",
           up ? "text-emerald-600" : "text-rose-600"
         )}>
            {up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {trend}
         </div>
      </div>
    </div>
  );
}

function MiniStatCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100"
  };

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 group cursor-pointer hover:bg-slate-50 transition-all">
       <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-110", colors[color])}>
          <Icon className="w-3.5 h-3.5" />
       </div>
       <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-800 leading-none truncate">{value}</p>
          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{label}</p>
       </div>
    </div>
  );
}

function DonutCard({ title, data, total }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 flex flex-col">
      <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-8">{title}</h3>
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
            <p className="text-sm font-bold text-slate-800 leading-none">{total}</p>
            <p className="text-[7px] text-slate-400 font-bold uppercase mt-1">Due</p>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {data.map((item, i) => (
            <div key={i} className="group">
               <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: item.color}} />
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{item.name}</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-800">{item.value}%</p>
               </div>
               <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
