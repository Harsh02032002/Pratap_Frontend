import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Wallet,
  ArrowUpCircle, ArrowDownCircle, RotateCcw, Plus,
  Download, Eye, CreditCard, LayoutGrid, RefreshCw,
  Calculator, Receipt, FileText, AlertCircle, Sparkles
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function AccountingPaymentTracking() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGatewayStatus, setFilterGatewayStatus] = useState("all"); // "all" | "Verified" | "Created" | "Settled"

  useSEO({
    title: "Gateway Tracking Ledger - Roomhy Super Admin",
    description: "Track automated Razorpay payment states and signature verification logs.",
    canonical: "https://roomhy.com/superadmin/accounting/tracking"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/revenue/transactions");
      if (res.success && res.payments) {
        setPayments(res.payments);
      }
    } catch (err) {
      console.error("Error loading payment tracking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const trackingList = useMemo(() => {
    return payments.filter(item => {
      const matchesSearch = 
        item.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.razorpay_payment_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.razorpay_order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.property_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const statusKey = item.status || "Created";
      const matchesStatus = filterGatewayStatus === "all" || statusKey === filterGatewayStatus;

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, filterGatewayStatus]);

  const stats = useMemo(() => {
    let created = 0;
    let verified = 0;
    let settled = 0;

    payments.forEach(item => {
      const statusKey = item.status || "Created";
      if (statusKey === "Settled") settled++;
      else if (statusKey === "Verified") verified++;
      else created++;
    });

    return { created, verified, settled, total: payments.length };
  }, [payments]);

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <PageHeader
        title="Payment Tracking"
        subtitle="Audit trail and signature verification for payment gateway transactions."
        actions={
          <button 
            onClick={loadData}
            className="bg-white text-[#4A5961] border border-[#E1E6EA] px-3.5 py-2 rounded-[12px] text-xs font-semibold hover:bg-[#F4F6F8] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
             <RefreshCw className="w-3.5 h-3.5 text-[#0E7C86]" /> Refresh Data
          </button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal label="Total Gateway Hits" value={stats.total} trend="Total Requests" up icon={Activity} color="blue" />
        <StatCardHorizontal label="Settled Gateway" value={stats.settled} trend="Transfer Completed" up icon={CheckCircle2} color="emerald" />
        <StatCardHorizontal label="Verified Gateway" value={stats.verified} trend="Payment Verified" up icon={Shield} color="indigo" />
        <StatCardHorizontal label="Created Gateway" value={stats.created} trend="Session Initiated" up icon={Clock} color="amber" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-50 pb-4">
            <div className="flex items-center gap-2">
               <button
                  onClick={() => setFilterGatewayStatus("all")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterGatewayStatus === "all" ? "bg-slate-800 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
               >
                  All Statuses
               </button>
               <button
                  onClick={() => setFilterGatewayStatus("Settled")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterGatewayStatus === "Settled" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
               >
                  Settled
               </button>
               <button
                  onClick={() => setFilterGatewayStatus("Verified")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterGatewayStatus === "Verified" ? "bg-indigo-600 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
               >
                  Verified
               </button>
               <button
                  onClick={() => setFilterGatewayStatus("Created")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterGatewayStatus === "Created" ? "bg-amber-600 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
               >
                  Created
               </button>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative group w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input 
                    placeholder="Search by ID, Order, Name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
                  />
               </div>
            </div>
         </div>

         {loading ? (
           <div className="py-12 flex flex-col items-center justify-center gap-3">
             <RefreshCw className="w-8 h-8 text-slate-300 animate-spin" />
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading gateway logs...</p>
           </div>
         ) : trackingList.length === 0 ? (
           <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No Gateway Matches Found</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Check signature inputs or gateway webhooks</p>
           </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                        <th className="pb-4">Payment ID</th>
                        <th className="pb-4">Order ID</th>
                        <th className="pb-4">Recipient (Tenant)</th>
                        <th className="pb-4 text-center">Amount (₹)</th>
                        <th className="pb-4 text-center">Gateway State</th>
                        <th className="pb-4 text-center">Payout Status</th>
                        <th className="pb-4 text-right">Hit Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {trackingList.map((item, i) => {
                       const statusKey = item.status || "Created";
                       return (
                         <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4">
                               <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                                  {item.razorpay_payment_id || 'N/A'}
                               </span>
                            </td>
                            <td className="py-4">
                               <span className="text-[9px] font-mono text-slate-500">{item.razorpay_order_id || 'N/A'}</span>
                            </td>
                            <td className="py-4">
                               <p className="text-[11px] font-bold text-slate-800">{item.tenant_name || 'Unknown'}</p>
                               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.property_name || 'No Room Assigned'}</p>
                            </td>
                            <td className="py-4 text-center">
                               <p className="text-[11px] font-bold text-slate-800">₹{item.amount?.toLocaleString('en-IN')}</p>
                            </td>
                            <td className="py-4 text-center">
                               <span className={cn(
                                 "text-[8px] font-bold px-2 py-0.5 rounded-lg border",
                                 statusKey === "Settled" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                 statusKey === "Verified" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                 "bg-amber-50 text-amber-600 border-amber-100"
                               )}>
                                 {statusKey}
                               </span>
                            </td>
                            <td className="py-4 text-center">
                               <span className={cn(
                                  "text-[7px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm",
                                  item.payout_status === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                               )}>
                                  {item.payout_status || 'Pending'}
                               </span>
                            </td>
                            <td className="py-4 text-right">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 {item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : '—'}
                               </p>
                            </td>
                         </tr>
                       );
                     })}
                  </tbody>
               </table>
            </div>
         )}
      </div>
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100" 
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md flex items-start gap-3 group hover:translate-y-[-2px] transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none truncate">{label}</p>
         <p className="text-sm font-bold text-slate-800 tracking-tight leading-none mb-2">{value}</p>
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
