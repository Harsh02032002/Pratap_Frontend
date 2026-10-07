import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Activity, CheckCircle2, XCircle, Wallet,
  RotateCcw, RefreshCw, Download, IndianRupee, Database, TrendingUp, Calendar
} from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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
        setStats(statsRes.stats || {});
        setTrend(statsRes.trend || []);
      }
      if (txRes && txRes.success) {
        setPayments(txRes.payments || []);
        setCommissions(txRes.commissions || []);
        setPayouts(txRes.payouts || []);
      }
      if (settingsRes && settingsRes.success) {
        setSettings(settingsRes.settings || { commission_percentage: 10 });
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
      <div className="p-12 space-y-6 flex flex-col items-center justify-center py-40 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-12 h-12 border-4 border-[#0E7C86]/20 border-t-[#0E7C86] rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#4A5961] uppercase tracking-wider">Loading Platform Revenue Intelligence...</p>
      </div>
    );
  }

  const formatStat = (val, prefix = "") => {
    if (val === undefined || val === null || val === 0 || val === "0") {
      return "₹0";
    }
    return `${prefix}${Number(val).toLocaleString('en-IN')}`;
  };

  const hasTrendData = Array.isArray(trend) && trend.length > 0;

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <PageHeader 
        title="Revenue Report"
        subtitle="Platform gross revenue, commission earnings, owner payout settlements, and transaction ledgers."
        actions={
          <button 
            onClick={loadData}
            className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-[12px] border border-[#E1E6EA] shadow-xs text-xs font-semibold text-[#4A5961] hover:bg-[#F4F6F8] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0E7C86]" />
            <span>Refresh Data</span>
          </button>
        }
      />

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-[16px] border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div className="w-9 h-9 rounded-[10px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center mb-3">
            <IndianRupee size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Total Revenue</p>
            <h4 className="text-xl font-bold text-[#10242A] mt-0.5">{formatStat(stats.totalRevenue)}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div className="w-9 h-9 rounded-[10px] bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Database size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Commission ({settings.commission_percentage || 10}%)</p>
            <h4 className="text-xl font-bold text-[#10242A] mt-0.5">{formatStat(stats.commissionEarned)}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div className="w-9 h-9 rounded-[10px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner Earnings</p>
            <h4 className="text-xl font-bold text-[#10242A] mt-0.5">{formatStat(stats.ownerEarnings)}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div className="w-9 h-9 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Pending Payouts</p>
            <h4 className="text-xl font-bold text-[#10242A] mt-0.5">{formatStat(stats.pendingPayouts)}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div className="w-9 h-9 rounded-[10px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Paid Payouts</p>
            <h4 className="text-xl font-bold text-[#10242A] mt-0.5">{formatStat(stats.paidPayouts)}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[16px] border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div className="w-9 h-9 rounded-[10px] bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Wallet Balance</p>
            <h4 className="text-xl font-bold text-[#10242A] mt-0.5">{formatStat(stats.walletBalance)}</h4>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-[#10242A]">Revenue Trend Chart</h3>
              <p className="text-[11px] font-semibold text-[#4A5961] mt-0.5">Historical booking billing velocity over time</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <div className="flex items-center gap-2 bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] px-3 py-1.5 text-xs font-semibold text-[#4A5961]">
                  <Calendar className="w-4 h-4 text-[#0E7C86]" />
                  <select
                     value={period}
                     onChange={(e) => setPeriod(e.target.value)}
                     className="bg-transparent border-none outline-none font-semibold text-xs text-[#10242A] cursor-pointer"
                  >
                     <option value="7days">Last 7 Active Days</option>
                     <option value="month">This Month</option>
                     <option value="custom">Custom Date Range</option>
                  </select>
               </div>
               {period === "custom" && (
                  <div className="flex items-center gap-2 bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] px-3 py-1.5 text-xs font-semibold text-[#4A5961]">
                     <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-[#10242A] outline-none"
                     />
                     <span>to</span>
                     <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-[#10242A] outline-none"
                     />
                  </div>
               )}
            </div>
         </div>
         <div className="h-[320px] w-full">
            {!hasTrendData ? (
              <div className="flex items-center justify-center h-full text-[#4A5961] font-semibold uppercase tracking-wider text-xs">No Trend Data Available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={trend}>
                    <defs>
                       <linearGradient id="colorRevReport" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E7C86" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0E7C86" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 10, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 10, fontWeight: 600}} dx={-10} tickFormatter={v => `₹${v}`} />
                    <Tooltip cursor={{stroke: '#0E7C86', strokeWidth: 1}} />
                    <Area type="monotone" dataKey="revenue" stroke="#0E7C86" strokeWidth={3} fillOpacity={1} fill="url(#colorRevReport)" dot={{fill: '#0E7C86', r: 4}} />
                 </AreaChart>
              </ResponsiveContainer>
            )}
         </div>
      </div>

      {/* Tab Switcher & Table Ledger */}
      <div className="bg-white rounded-[16px] border border-[#E1E6EA] shadow-xs overflow-hidden">
         <div className="p-5 border-b border-[#E1E6EA] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-[10px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
                  <Database size={18} />
               </div>
               <div className="flex items-center bg-[#F4F6F8] p-1 rounded-[10px] border border-[#E1E6EA]">
                  {[
                    { id: "payments", label: "Payments Ledger" },
                    { id: "commission", label: "Commission Breakdown" },
                    { id: "payouts", label: "Owner Payouts" }
                  ].map(t => (
                    <button 
                      key={t.id} onClick={() => setActiveTab(t.id)}
                      className={cn(
                        "px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer",
                        activeTab === t.id ? "bg-white text-[#0E7C86] shadow-xs font-bold" : "text-[#4A5961] hover:text-[#10242A]"
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
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-[#F4F6F8] text-[11px] font-bold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
                        <th className="py-3 px-4 font-bold">Transaction ID</th>
                        <th className="py-3 px-4 font-bold">Booking ID</th>
                        <th className="py-3 px-4 font-bold">Tenant Name</th>
                        <th className="py-3 px-4 font-bold">Property Name</th>
                        <th className="text-right py-3 px-4 font-bold">Amount Paid</th>
                        <th className="text-center py-3 px-4 font-bold">Payout Status</th>
                        <th className="text-right py-3 px-4 font-bold">Payment Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6EA]">
                     {payments.length === 0 ? (
                       <tr><td colSpan="7" className="py-12 text-center text-xs font-semibold text-[#4A5961] uppercase tracking-wider">No Payment Transactions Recorded</td></tr>
                     ) : payments.map((p, idx) => (
                       <tr key={p.id || idx} className="hover:bg-[#F4F6F8] transition-colors">
                          <td className="py-3 px-4 text-xs font-bold text-[#10242A] uppercase">{p.razorpay_payment_id}</td>
                          <td className="py-3 px-4 text-xs font-medium text-[#4A5961] truncate max-w-[120px]">{p.booking_id}</td>
                          <td className="py-3 px-4 text-xs font-bold text-[#10242A]">{p.tenant_name}</td>
                          <td className="py-3 px-4 text-xs font-medium text-[#4A5961]">{p.property_name}</td>
                          <td className="py-3 px-4 text-right text-xs font-bold text-[#10242A]">₹{p.amount?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-center">
                             <span className={cn(
                               "text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase",
                               p.payout_status === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               p.payout_status === "Failed" ? "bg-rose-50 text-rose-600 border-rose-100" :
                               "bg-amber-50 text-amber-600 border-amber-100"
                             )}>
                                {p.payout_status}
                             </span>
                          </td>
                          <td className="py-3 px-4 text-right text-xs font-medium text-[#4A5961]">{p.date}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            )}

            {activeTab === "commission" && (
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-[#F4F6F8] text-[11px] font-bold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
                        <th className="py-3 px-4 font-bold">Transaction ID</th>
                        <th className="py-3 px-4 font-bold">Booking ID</th>
                        <th className="text-right py-3 px-4 font-bold">Booking Amount</th>
                        <th className="text-center py-3 px-4 font-bold">Commission %</th>
                        <th className="text-right py-3 px-4 font-bold">Commission Earned</th>
                        <th className="text-right py-3 px-4 font-bold">Owner Share</th>
                        <th className="text-right py-3 px-4 font-bold">Payment Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6EA]">
                     {commissions.length === 0 ? (
                       <tr><td colSpan="7" className="py-12 text-center text-xs font-semibold text-[#4A5961] uppercase tracking-wider">No Commission Breakdown Data</td></tr>
                     ) : commissions.map((c, idx) => (
                       <tr key={c.id || idx} className="hover:bg-[#F4F6F8] transition-colors">
                          <td className="py-3 px-4 text-xs font-bold text-[#10242A] uppercase">{c.razorpay_payment_id}</td>
                          <td className="py-3 px-4 text-xs font-medium text-[#4A5961] truncate max-w-[120px]">{c.booking_id}</td>
                          <td className="py-3 px-4 text-right text-xs font-semibold text-[#4A5961]">₹{c.booking_amount?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-center">
                             <span className="text-xs font-bold text-[#0E7C86] bg-[#E6F4F5] px-2 py-0.5 rounded-[6px]">{c.commission_percentage}%</span>
                          </td>
                          <td className="py-3 px-4 text-right text-xs font-bold text-[#0E7C86]">₹{c.commission_amount?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right text-xs font-bold text-emerald-600">₹{c.owner_amount?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right text-xs font-medium text-[#4A5961]">{c.date}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            )}

            {activeTab === "payouts" && (
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-[#F4F6F8] text-[11px] font-bold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
                        <th className="py-3 px-4 font-bold">Payout ID / Ref</th>
                        <th className="py-3 px-4 font-bold">Owner Name</th>
                        <th className="py-3 px-4 font-bold">Bank Destination</th>
                        <th className="text-right py-3 px-4 font-bold">Owner Share</th>
                        <th className="text-center py-3 px-4 font-bold">Status</th>
                        <th className="text-right py-3 px-4 font-bold">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6EA]">
                     {payouts.length === 0 ? (
                       <tr><td colSpan="6" className="py-12 text-center text-xs font-semibold text-[#4A5961] uppercase tracking-wider">No Owner Payouts Found</td></tr>
                     ) : payouts.map((p, idx) => (
                       <tr key={p.id || idx} className="hover:bg-[#F4F6F8] transition-colors">
                          <td className="py-3 px-4 text-xs font-bold text-[#10242A] uppercase">
                             {p.payout_reference || p.razorpay_payment_id || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-xs font-bold text-[#10242A]">{p.owner_name}</td>
                          <td className="py-3 px-4">
                             {p.bank_details?.account_number ? (
                               <div className="text-xs space-y-0.5">
                                 <p className="font-bold text-[#10242A]">{p.bank_details.bank_name || 'Bank'}</p>
                                 <p className="font-medium text-[#4A5961]">A/C: {p.bank_details.account_number}</p>
                                 <p className="font-medium text-[#4A5961]">IFSC: {p.bank_details.ifsc_code}</p>
                               </div>
                             ) : (
                               <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-[6px] border border-rose-100 uppercase">Details Missing</span>
                             )}
                          </td>
                          <td className="py-3 px-4 text-right text-xs font-bold text-emerald-600">₹{p.owner_amount?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-center">
                             <span className={cn(
                               "text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase",
                               p.payout_status === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               "bg-amber-50 text-amber-600 border-amber-100"
                             )}>
                                {p.payout_status}
                             </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-xs">
                             {p.payout_status === "Paid" ? (
                               <span className="text-[#4A5961]">{p.payout_date || 'N/A'}</span>
                             ) : (
                               <button 
                                 onClick={() => handleOpenPayout(p)}
                                 className="px-3 py-1.5 bg-[#0E7C86] hover:bg-[#0B656D] text-white rounded-[8px] text-xs font-semibold transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-[#10242A]/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[20px] w-full max-w-lg border border-[#E1E6EA] shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E1E6EA] flex items-center justify-between bg-white shrink-0">
                 <div>
                    <h3 className="text-sm font-bold text-[#10242A] uppercase tracking-wider">Owner Payment Transfer</h3>
                    <p className="text-[11px] font-medium text-[#4A5961]">Send verified payout to property owner</p>
                 </div>
                 <button 
                    onClick={() => setShowPayoutModal(false)}
                    className="p-1.5 rounded-[8px] hover:bg-[#F4F6F8] text-[#4A5961] transition-all font-bold cursor-pointer"
                 >
                    ✕
                 </button>
              </div>

              <div className="p-6 space-y-4">
                 <div className="p-4 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA] space-y-2">
                    <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Transfer Summary</p>
                    <div className="flex justify-between items-center text-xs font-semibold text-[#4A5961]">
                       <span>Owner Name:</span>
                       <span className="text-[#10242A] font-bold">{selectedPayout.owner_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-[#4A5961]">
                        <span>Owner's Amount:</span>
                       <span className="text-emerald-600 text-base font-bold">₹{selectedPayout.owner_amount?.toLocaleString('en-IN')}</span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Verify Owner Bank Account Details</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-[11px] font-semibold text-[#4A5961] uppercase mb-1 block">Account Holder</label>
                          <input 
                             type="text"
                             value={payoutForm.account_holder}
                             onChange={e => setPayoutForm({ ...payoutForm, account_holder: e.target.value })}
                             placeholder="Holder Name"
                             className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] py-2 px-3 text-xs font-semibold text-[#10242A] outline-none focus:border-[#0E7C86] focus:bg-white transition-all"
                          />
                       </div>
                       
                       <div>
                          <label className="text-[11px] font-semibold text-[#4A5961] uppercase mb-1 block">Bank Name</label>
                          <input 
                             type="text"
                             value={payoutForm.bank_name}
                             onChange={e => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                             placeholder="SBI, HDFC, etc."
                             className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] py-2 px-3 text-xs font-semibold text-[#10242A] outline-none focus:border-[#0E7C86] focus:bg-white transition-all"
                          />
                       </div>
                    </div>

                    <div>
                       <label className="text-[11px] font-semibold text-[#4A5961] uppercase mb-1 block">Account Number</label>
                       <input 
                          type="text"
                          value={payoutForm.account_number}
                          onChange={e => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                          placeholder="Account Number"
                          className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] py-2 px-3 text-xs font-semibold text-[#10242A] outline-none focus:border-[#0E7C86] focus:bg-white transition-all"
                       />
                    </div>

                    <div>
                       <label className="text-[11px] font-semibold text-[#4A5961] uppercase mb-1 block">IFSC Code</label>
                       <input 
                          type="text"
                          value={payoutForm.ifsc_code}
                          onChange={e => setPayoutForm({ ...payoutForm, ifsc_code: e.target.value.toUpperCase() })}
                          placeholder="IFSC Code"
                          className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] py-2 px-3 text-xs font-semibold text-[#10242A] outline-none focus:border-[#0E7C86] focus:bg-white transition-all"
                       />
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-[#F4F6F8] border-t border-[#E1E6EA] flex items-center justify-end gap-3">
                 <button 
                    onClick={() => setShowPayoutModal(false)}
                    className="px-4 py-2 bg-white text-[#4A5961] border border-[#E1E6EA] rounded-[10px] text-xs font-semibold hover:bg-[#F4F6F8] transition-all cursor-pointer"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleConfirmPayout}
                    disabled={transferring}
                    className="px-5 py-2 bg-[#0E7C86] hover:bg-[#0B656D] text-white rounded-[10px] text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
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
