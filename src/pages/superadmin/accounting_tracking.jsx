import React, { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw } from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Payment Tracking</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Audit trail and signature verification for payment gateway transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
             <RefreshCw className="w-3.5 h-3.5 text-[#0E7C86]" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardHorizontal label="Total Gateway Hits" value={stats.total} trend="Total Requests" />
        <StatCardHorizontal label="Settled Gateway" value={stats.settled} trend="Transfer Completed" />
        <StatCardHorizontal label="Verified Gateway" value={stats.verified} trend="Payment Verified" />
        <StatCardHorizontal label="Created Gateway" value={stats.created} trend="Session Initiated" />
      </div>

      {/* Filter & Search Row (Outside Table Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
           <button
              onClick={() => setFilterGatewayStatus("all")}
              className={cn(
                "px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer",
                filterGatewayStatus === "all" ? "bg-[#0E7C86] text-white shadow-xs font-semibold" : "bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50 shadow-xs"
              )}
           >
              All Statuses
           </button>
           <button
              onClick={() => setFilterGatewayStatus("Settled")}
              className={cn(
                "px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer",
                filterGatewayStatus === "Settled" ? "bg-[#0E7C86] text-white shadow-xs font-semibold" : "bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50 shadow-xs"
              )}
           >
              Settled
           </button>
           <button
              onClick={() => setFilterGatewayStatus("Verified")}
              className={cn(
                "px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer",
                filterGatewayStatus === "Verified" ? "bg-[#0E7C86] text-white shadow-xs font-semibold" : "bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50 shadow-xs"
              )}
           >
              Verified
           </button>
           <button
              onClick={() => setFilterGatewayStatus("Created")}
              className={cn(
                "px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer",
                filterGatewayStatus === "Created" ? "bg-[#0E7C86] text-white shadow-xs font-semibold" : "bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50 shadow-xs"
              )}
           >
              Created
           </button>
        </div>
        
        <div className="relative w-full sm:w-[280px]">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
           <input 
             placeholder="Search by ID, Order, Name..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
           />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
         {loading ? (
           <div className="py-8 flex flex-col items-center justify-center gap-2">
             <RefreshCw className="w-6 h-6 text-[#0E7C86] animate-spin" />
             <p className="text-[13px] text-[#4A5961]">Loading gateway logs...</p>
           </div>
         ) : trackingList.length === 0 ? (
           <div className="py-8 text-center">
              <p className="text-[13px] font-semibold text-[#10242A]">No Gateway Matches Found</p>
              <p className="text-[12px] text-[#4A5961] mt-0.5">Check signature inputs or gateway webhooks</p>
           </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Payment ID</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Order ID</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Recipient (Tenant)</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Amount (₹)</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Gateway State</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Payout Status</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Hit Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                     {trackingList.map((item, i) => {
                       const statusKey = item.status || "Created";
                       return (
                         <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="py-2.5">
                               <span className="text-[12px] font-mono font-semibold text-[#0E7C86] bg-[#E8F3F4] px-2 py-0.5 rounded-[6px]">
                                  {item.razorpay_payment_id || 'N/A'}
                               </span>
                            </td>
                            <td className="py-2.5">
                               <span className="text-[12px] font-mono text-[#4A5961]">{item.razorpay_order_id || 'N/A'}</span>
                            </td>
                            <td className="py-2.5">
                               <p className="text-[13px] font-medium text-[#10242A]">{item.tenant_name || 'Unknown'}</p>
                               <p className="text-[11px] text-[#708088] mt-0.5">{item.property_name || 'No Room Assigned'}</p>
                            </td>
                            <td className="py-2.5 text-center font-semibold text-[#10242A]">
                               ₹{item.amount?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 text-center">
                               <span className={cn(
                                 "inline-block text-[12px] font-semibold px-2.5 py-0.5 rounded-full",
                                 statusKey === "Settled" ? "bg-[#DDF3E4] text-[#14532D]" :
                                 statusKey === "Verified" ? "bg-[#E1ECF4] text-[#1E3A5F]" :
                                 "bg-[#FEF3C7] text-[#92400E]"
                               )}>
                                 {statusKey}
                               </span>
                            </td>
                            <td className="py-2.5 text-center">
                               <span className={cn(
                                  "inline-block text-[12px] font-semibold px-2.5 py-0.5 rounded-full",
                                  item.payout_status === "Paid" ? "bg-[#DDF3E4] text-[#14532D]" : "bg-[#FEF3C7] text-[#92400E]"
                               )}>
                                  {item.payout_status || 'Pending'}
                               </span>
                            </td>
                            <td className="py-2.5 text-right text-[#4A5961]">
                               {item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : '—'}
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

function StatCardHorizontal({ label, value, trend }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
      <div className="mt-2">
        <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  );
}
