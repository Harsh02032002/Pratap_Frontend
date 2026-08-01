import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Wallet,
  ArrowUpCircle, ArrowDownCircle, RotateCcw, Plus,
  Download, Eye, Send, FileText, Receipt, LayoutGrid,
  IndianRupee, Database, TrendingUp, Calendar, Sliders
} from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { DateRangePill } from "../../components/dashboard/DateRangePill";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReportsRevenue() {
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
  const [payments, setPayments] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [settings, setSettings] = useState({ commission_percentage: 10 });
  const [loading, setLoading] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [newCommPct, setNewCommPct] = useState(10);
  const [showSettingsEdit, setShowSettingsEdit] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState("payments");

  // Period / Date filter State
  const [period, setPeriod] = useState("7days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Transfer Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutForm, setPayoutForm] = useState({
    account_holder: "",
    account_number: "",
    ifsc_code: "",
    bank_name: ""
  });
  const [transferring, setTransferring] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      let query = `/api/superadmin/revenue/stats?period=${period}`;
      if (period === "custom" && startDate && endDate) {
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const [statsRes, txRes, settingsRes] = await Promise.all([
        fetchJson(query),
        fetchJson("/api/superadmin/revenue/transactions"),
        fetchJson("/api/superadmin/settings")
      ]);

      if (statsRes && statsRes.success) {
        setStats(statsRes.stats);
        setTrend(statsRes.trend || []);
      }
      if (txRes && txRes.success) {
        setPayments(txRes.payments || []);
        setCommissions(txRes.commissions || []);
        setPayouts(txRes.payouts || []);
      }
      if (settingsRes && settingsRes.success) {
        setSettings(settingsRes.settings);
        setNewCommPct(settingsRes.settings.commission_percentage);
      }
    } catch (err) {
      console.error("Failed to load revenue data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period, startDate, endDate]);

  const handleSaveSettings = async () => {
    try {
      setUpdatingSettings(true);
      const res = await fetchJson("/api/superadmin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commission_percentage: Number(newCommPct) })
      });
      if (res && res.success) {
        setSettings(res.settings);
        setShowSettingsEdit(false);
        alert(`Global platform commission updated successfully to ${res.settings.commission_percentage}%`);
        loadData();
      }
    } catch (err) {
      alert("Failed to update settings: " + err.message);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleOpenPayout = (payout) => {
    setSelectedPayout(payout);
    setPayoutForm({
      account_holder: payout.bank_details?.account_holder || payout.owner_name || "",
      account_number: payout.bank_details?.account_number || "",
      ifsc_code: payout.bank_details?.ifsc_code || "",
      bank_name: payout.bank_details?.bank_name || ""
    });
    setShowPayoutModal(true);
  };

  const handleConfirmPayout = async () => {
    if (!payoutForm.account_number || !payoutForm.ifsc_code) {
      alert("Please fill in Account Number and IFSC Code.");
      return;
    }
    try {
      setTransferring(true);
      const res = await fetchJson(`/api/superadmin/revenue/payout/${selectedPayout.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_holder: payoutForm.account_holder,
          account_number: payoutForm.account_number,
          ifsc_code: payoutForm.ifsc_code,
          bank_name: payoutForm.bank_name,
          initiated_by: "superadmin"
        })
      });
      if (res && res.success) {
        setShowPayoutModal(false);
        alert(res.message || "Payout transferred successfully!");
        loadData();
      }
    } catch (err) {
      alert("Payout transfer failed: " + err.message);
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-10 bg-[#F8FAFC] min-h-full flex flex-col items-center justify-center py-40">
        <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading data...</p>
      </div>
    );
  }

  const formatStat = (val, prefix = "") => {
    if (val === undefined || val === null || val === 0 || val === "0") {
      return "No Data Available";
    }
    return `${prefix}${val.toLocaleString('en-IN')}`;
  };

  const hasTrendData = Array.isArray(trend) && trend.length > 0;

  return (
    <div className="p-8 space-y-10 bg-[#F8FAFC] min-h-full font-inter text-slate-800">
      {/* Header Area */}
      <div className="flex flex-col gap-2">
         <h1 className="text-4xl font-bold text-slate-800 tracking-tight leading-none">Revenue & Payments</h1>
         <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase mt-2">
            <span>Reports</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600">Platform Revenue & Payouts</span>
         </div>
      </div>

      <p className="text-sm font-bold text-slate-400">View all payments, commissions and owner payouts on this platform.</p>



      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCardLarge label="Total Revenue" value={formatStat(stats.totalRevenue, "₹ ")} trend="Platform Gross" up icon={IndianRupee} color="blue" source="Payments" />
        <StatCardLarge label="Commission Earned" value={formatStat(stats.commissionEarned, "₹ ")} trend={`Net Margin (${settings.commission_percentage}%)`} up icon={Database} color="indigo" source="Payments" />
        <StatCardLarge label="Owner Earnings" value={formatStat(stats.ownerEarnings, "₹ ")} trend="Settlement Target" up icon={Users} color="green" source="Payments" />
        <StatCardLarge label="Pending Payouts" value={formatStat(stats.pendingPayouts, "₹ ")} trend="Due payouts" up={false} icon={Clock} color="purple" source="Payments" />
        <StatCardLarge label="Paid Payouts" value={formatStat(stats.paidPayouts, "₹ ")} trend="Settled payout volume" up icon={CheckCircle2} color="emerald" source="Payments" />
        <StatCardLarge label="Wallet Balance" value={formatStat(stats.walletBalance, "₹ ")} trend="Net Wallet" up icon={Wallet} color="blue" source="Payments" />
      </div>

      {/* Recharts Area Chart */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Revenue Chart</h3>
              <div className="flex flex-wrap items-center gap-4">
                 <LegendPill color="#3B82F6" label="Booking Revenue" />
                 <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <select
                       value={period}
                       onChange={(e) => setPeriod(e.target.value)}
                       className="bg-transparent border-none outline-none font-bold text-xs cursor-pointer text-slate-700 focus:ring-0 p-0"
                    >
                       <option value="7days">Last 7 Active Days (Week)</option>
                       <option value="month">This Month</option>
                       <option value="custom">Custom Date Range</option>
                    </select>
                 </div>
                 {period === "custom" && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-sm">
                       <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                       />
                       <span className="text-xs text-slate-400 font-bold">to</span>
                       <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                       />
                    </div>
                 )}
              </div>
           </div>
           <div className="flex-1 min-h-[350px]">
              {!hasTrendData ? (
                <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-xs py-20">No Data Available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={trend}>
                      <defs>
                         <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dx={-15} tickFormatter={v => `₹${v}`} />
                      <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)'}} />
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                   </AreaChart>
                </ResponsiveContainer>
              )}
           </div>
        </div>
      </div>

      {/* Tab Switcher & Table Ledger */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
         <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-8">
               <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <Database size={20} />
               </div>
               <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
                  {[
                    { id: "payments", label: "Payments Ledger" },
                    { id: "commission", label: "Commission Breakdown" },
                    { id: "payouts", label: "Owner Payouts" }
                  ].map(t => (
                    <button 
                      key={t.id} onClick={() => setActiveTab(t.id)}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        activeTab === t.id ? "bg-white text-blue-600 shadow-md border border-slate-100" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                       {t.label}
                    </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
            {activeTab === "payments" && (
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-10 py-8">Transaction ID</th>
                        <th className="px-6 py-8">Booking ID</th>
                        <th className="px-6 py-8">Tenant Name</th>
                        <th className="px-6 py-8">Property Name</th>
                        <th className="px-6 py-8 text-right">Amount Paid</th>
                        <th className="px-6 py-8 text-center">Payout Status</th>
                        <th className="px-10 py-8 text-right">Payment Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {payments.length === 0 ? (
                       <tr><td colSpan="7" className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No Payment Transactions Recorded</td></tr>
                     ) : payments.map((p, idx) => (
                       <tr key={p.id || idx} className="group hover:bg-slate-50/50 transition-all duration-300">
                          <td className="px-10 py-8 font-black text-slate-700 text-xs tracking-wider uppercase">{p.razorpay_payment_id}</td>
                          <td className="px-6 py-8 text-xs font-bold text-slate-500 truncate max-w-[120px]">{p.booking_id}</td>
                          <td className="px-6 py-8 font-bold text-slate-800 text-sm">{p.tenant_name}</td>
                          <td className="px-6 py-8 font-bold text-slate-500 text-sm">{p.property_name}</td>
                          <td className="px-6 py-8 font-black text-slate-900 text-right text-sm">₹{p.amount?.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-8 text-center">
                             <span className={cn(
                               "text-[9px] font-bold px-3 py-1 rounded-xl border uppercase tracking-wider shadow-sm",
                               p.payout_status === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               p.payout_status === "Failed" ? "bg-rose-50 text-rose-600 border-rose-100" :
                               p.payout_status === "Processing" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                               "bg-amber-50 text-amber-600 border-amber-100"
                             )}>
                                {p.payout_status}
                             </span>
                          </td>
                          <td className="px-10 py-8 text-right text-xs font-bold text-slate-400">{p.date}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            )}

            {activeTab === "commission" && (
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-10 py-8">Transaction ID</th>
                        <th className="px-6 py-8">Booking ID</th>
                        <th className="px-6 py-8 text-right">Booking Amount</th>
                        <th className="px-6 py-8 text-center">Commission %</th>
                        <th className="px-6 py-8 text-right">Commission Earned</th>
                        <th className="px-6 py-8 text-right">Owner Share</th>
                        <th className="px-10 py-8 text-right">Payment Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {commissions.length === 0 ? (
                       <tr><td colSpan="7" className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No Commission Breakdown Data</td></tr>
                     ) : commissions.map((c, idx) => (
                       <tr key={c.id || idx} className="group hover:bg-slate-50/50 transition-all duration-300">
                          <td className="px-10 py-8 font-black text-slate-700 text-xs tracking-wider uppercase">{c.razorpay_payment_id}</td>
                          <td className="px-6 py-8 text-xs font-bold text-slate-500 truncate max-w-[120px]">{c.booking_id}</td>
                          <td className="px-6 py-8 font-black text-slate-600 text-right text-sm">₹{c.booking_amount?.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-8 text-center">
                             <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{c.commission_percentage}%</span>
                          </td>
                          <td className="px-6 py-8 font-black text-indigo-600 text-right text-sm">₹{c.commission_amount?.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-8 font-black text-emerald-600 text-right text-sm">₹{c.owner_amount?.toLocaleString('en-IN')}</td>
                          <td className="px-10 py-8 text-right text-xs font-bold text-slate-400">{c.date}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            )}

            {activeTab === "payouts" && (
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-10 py-8">Payout ID / Ref</th>
                        <th className="px-6 py-8">Owner Name</th>
                        <th className="px-6 py-8">Bank Destination</th>
                        <th className="px-6 py-8 text-right">Owner share</th>
                        <th className="px-6 py-8 text-center">Status</th>
                        <th className="px-10 py-8 text-right">Settled Date / Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {payouts.length === 0 ? (
                       <tr><td colSpan="6" className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No Owner Payouts Found</td></tr>
                     ) : payouts.map((p, idx) => (
                       <tr key={p.id || idx} className="group hover:bg-slate-50/50 transition-all duration-300">
                          <td className="px-10 py-8 font-black text-slate-700 text-xs tracking-wider uppercase shrink-0">
                             {p.payout_reference || p.razorpay_payment_id || 'N/A'}
                          </td>
                          <td className="px-6 py-8 font-bold text-slate-800 text-sm">{p.owner_name}</td>
                          <td className="px-6 py-8">
                             {p.bank_details?.account_number ? (
                               <div className="text-xs space-y-1">
                                 <p className="font-bold text-slate-700">{p.bank_details.bank_name || 'Bank'}</p>
                                 <p className="font-bold text-slate-400 uppercase">A/C: {p.bank_details.account_number}</p>
                                 <p className="font-bold text-slate-300 uppercase">IFSC: {p.bank_details.ifsc_code}</p>
                               </div>
                             ) : (
                               <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100 uppercase tracking-wider">Details Missing</span>
                             )}
                          </td>
                          <td className="px-6 py-8 font-black text-emerald-600 text-right text-sm">₹{p.owner_amount?.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-8 text-center">
                             <span className={cn(
                               "text-[9px] font-bold px-3 py-1 rounded-xl border uppercase tracking-wider shadow-sm",
                               p.payout_status === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               "bg-amber-50 text-amber-600 border-amber-100"
                             )}>
                                {p.payout_status}
                             </span>
                          </td>
                          <td className="px-10 py-8 text-right font-bold text-xs">
                             {p.payout_status === "Paid" ? (
                               <span className="text-slate-400">{p.payout_date || 'N/A'}</span>
                             ) : (
                               <button 
                                 onClick={() => handleOpenPayout(p)}
                                 className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
                               >
                                  Transfer Payment
                               </button>
                             )}
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            )}
         </div>
      </div>

      {/* Transfer Payout Modal */}
      {showPayoutModal && selectedPayout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 transition-all duration-300 animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-bold tracking-tight">Owner Payment Transfer</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Send payment to owner</p>
                 </div>
                 <button 
                    onClick={() => setShowPayoutModal(false)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all font-bold"
                 >
                    ✕
                 </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">
                 {/* Split details summary */}
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transfer Summary</p>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                       <span>Owner Name:</span>
                       <span className="text-slate-800">{selectedPayout.owner_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>Owner's Amount:</span>
                       <span className="text-emerald-600 text-lg font-black">₹{selectedPayout.owner_amount?.toLocaleString('en-IN')}</span>
                    </div>
                 </div>

                 {/* Input bank details */}
                 <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify / Enter Owner Bank Account Details</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Account Holder Name</label>
                          <input 
                             type="text"
                             value={payoutForm.account_holder}
                             onChange={e => setPayoutForm({ ...payoutForm, account_holder: e.target.value })}
                             placeholder="Holder Name"
                             className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                          />
                       </div>
                       
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Bank Name</label>
                          <input 
                             type="text"
                             value={payoutForm.bank_name}
                             onChange={e => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                             placeholder="SBI, HDFC, etc."
                             className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                          />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Bank Account Number</label>
                       <input 
                          type="text"
                          value={payoutForm.account_number}
                          onChange={e => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                          placeholder="Account Number"
                          className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                       />
                    </div>

                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">IFSC Code</label>
                       <input 
                          type="text"
                          value={payoutForm.ifsc_code}
                          onChange={e => setPayoutForm({ ...payoutForm, ifsc_code: e.target.value.toUpperCase() })}
                          placeholder="IFSC Code"
                          className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                       />
                    </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                 <button 
                    onClick={() => setShowPayoutModal(false)}
                    className="px-6 py-4 bg-white text-slate-500 border border-slate-200 rounded-2xl text-[10px] font-bold uppercase hover:bg-slate-50 transition-all active:scale-95"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleConfirmPayout}
                    disabled={transferring}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-bold uppercase shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                 >
                    {transferring ? "Processing Transfer..." : "Confirm & Pay Out"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function StatCardLarge({ label, value, trend, up, icon: Icon, color, source }) {
  const bgColors = { 
    blue: "bg-blue-600 shadow-blue-200", 
    indigo: "bg-indigo-600 shadow-indigo-200", 
    purple: "bg-purple-600 shadow-purple-200", 
    green: "bg-emerald-600 shadow-emerald-200", 
    emerald: "bg-emerald-600 shadow-emerald-200", 
    red: "bg-rose-600 shadow-rose-200" 
  };
  
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-6 group hover:translate-y-[-8px] transition-all duration-500 justify-between min-h-[260px]">
      <div>
        <div className={cn("w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl transition-transform group-hover:rotate-6 mb-4", bgColors[color])}>
           <Icon className="w-8 h-8" />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 leading-none truncate">{label}</p>
        <p className="text-lg font-black text-slate-800 tracking-tighter leading-none mb-2">{value}</p>
      </div>
      
      <div className="w-full border-t border-slate-50 pt-3 flex flex-col items-start gap-1.5 mt-auto">
        {value !== "No Data Available" && (
          <div className={cn(
            "flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-xl w-fit",
            up ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
          )}>
             {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
             {trend}
          </div>
        )}
        <span className="text-[8px] font-black text-blue-500/80 uppercase tracking-wider">Data Source: {source}</span>
      </div>
    </div>
  );
}

function LegendPill({ color, label }) {
  return (
    <div className="flex items-center gap-2">
       <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: color}} />
       <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
    </div>
  );
}
