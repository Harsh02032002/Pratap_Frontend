import React, { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw } from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function AccountingOtherCharges() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "penalty" | "electricity"

  useSEO({
    title: "Other Charges Ledger - Roomhy Super Admin",
    description: "Manage penalties, electricity billing, and other platform charges dynamically.",
    canonical: "https://roomhy.com/superadmin/accounting/other-charges"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/revenue/transactions");
      if (res.success && res.invoiceList) {
        setInvoices(res.invoiceList);
      }
    } catch (err) {
      console.error("Error loading other charges data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const otherChargesData = useMemo(() => {
    const list = [];
    invoices.forEach(inv => {
      // 1. If has electricity bill
      if (inv.electricityBill && inv.electricityBill > 0) {
        list.push({
          id: `ELEC-${String(inv.id).slice(-6).toUpperCase()}`,
          invoiceNumber: inv.invoice_number || String(inv.id).slice(-8).toUpperCase(),
          tenantName: inv.tenant_name || "Unknown Tenant",
          chargeType: "Electricity Bill",
          amount: inv.electricityBill,
          status: inv.status === "PAID" ? "Paid" : "Pending",
          date: inv.date ? new Date(inv.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
          color: "blue"
        });
      }
      // 2. If has penalties
      const penaltyAmt = inv.totalPenalty || (inv.minorPenaltyAmount || 0) + (inv.majorPenaltyAmount || 0);
      if (penaltyAmt > 0) {
        list.push({
          id: `LATE-${String(inv.id).slice(-6).toUpperCase()}`,
          invoiceNumber: inv.invoice_number || String(inv.id).slice(-8).toUpperCase(),
          tenantName: inv.tenant_name || "Unknown Tenant",
          chargeType: "Late Fee Penalty",
          amount: penaltyAmt,
          status: inv.status === "PAID" ? "Paid" : "Pending",
          date: inv.date ? new Date(inv.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
          color: "rose"
        });
      }
    });

    // Apply filters & search
    return list.filter(item => {
      const matchesSearch = item.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === "all" || 
                          (filterType === "penalty" && item.chargeType.includes("Penalty")) ||
                          (filterType === "electricity" && item.chargeType.includes("Electricity"));

      return matchesSearch && matchesType;
    });
  }, [invoices, searchQuery, filterType]);

  const stats = useMemo(() => {
    let totalPenalty = 0;
    let totalElectricity = 0;
    let pendingCount = 0;
    let paidCount = 0;

    otherChargesData.forEach(item => {
      if (item.chargeType.includes("Penalty")) {
        totalPenalty += item.amount;
      } else {
        totalElectricity += item.amount;
      }
      if (item.status === "Paid") {
        paidCount++;
      } else {
        pendingCount++;
      }
    });

    return { totalPenalty, totalElectricity, pendingCount, paidCount };
  }, [otherChargesData]);

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Other Charges</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Manage penalties, electricity bills, and utility fee collections.</p>
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
        <StatCardHorizontal label="Total Penalties" value={`₹${stats.totalPenalty.toLocaleString('en-IN')}`} trend="Late Fees" />
        <StatCardHorizontal label="Electricity Collections" value={`₹${stats.totalElectricity.toLocaleString('en-IN')}`} trend="Utility Fees" />
        <StatCardHorizontal label="Pending Items" value={stats.pendingCount} trend="Awaiting Payment" />
        <StatCardHorizontal label="Settled Items" value={stats.paidCount} trend="Successfully Paid" />
      </div>

      {/* Filter & Search Row (Outside Table Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
           <button
              onClick={() => setFilterType("all")}
              className={cn(
                "px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer",
                filterType === "all" ? "bg-[#0E7C86] text-white shadow-xs font-semibold" : "bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50 shadow-xs"
              )}
           >
              All Charges
           </button>
           <button
              onClick={() => setFilterType("penalty")}
              className={cn(
                "px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer",
                filterType === "penalty" ? "bg-[#0E7C86] text-white shadow-xs font-semibold" : "bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50 shadow-xs"
              )}
           >
              Penalties
           </button>
           <button
              onClick={() => setFilterType("electricity")}
              className={cn(
                "px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer",
                filterType === "electricity" ? "bg-[#0E7C86] text-white shadow-xs font-semibold" : "bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50 shadow-xs"
              )}
           >
              Electricity
           </button>
        </div>
        
        <div className="relative w-full sm:w-[280px]">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
           <input 
             placeholder="Search by ID, Tenant..." 
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
             <p className="text-[13px] text-[#4A5961]">Loading charge records...</p>
           </div>
         ) : otherChargesData.length === 0 ? (
           <div className="py-8 text-center">
              <p className="text-[13px] font-semibold text-[#10242A]">No Other Charges Found</p>
              <p className="text-[12px] text-[#4A5961] mt-0.5">All utility payments and penalties are settled</p>
           </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Charge ID</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Invoice Ref</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant Name</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Type</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Amount (₹)</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Status</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Created Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                     {otherChargesData.map((item, i) => (
                       <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-2.5">
                             <span className="text-[12px] font-mono font-semibold text-[#0E7C86] bg-[#E8F3F4] px-2 py-0.5 rounded-[6px]">
                                {item.id}
                             </span>
                          </td>
                          <td className="py-2.5 font-medium text-[#4A5961]">
                             {item.invoiceNumber}
                          </td>
                          <td className="py-2.5 font-medium text-[#10242A]">
                             {item.tenantName}
                          </td>
                          <td className="py-2.5">
                             <span className={cn(
                               "inline-block text-[12px] font-semibold px-2.5 py-0.5 rounded-full",
                               item.color === "blue" ? "bg-[#E1ECF4] text-[#1E3A5F]" : "bg-[#FDE8E8] text-[#991B1B]"
                             )}>
                               {item.chargeType}
                             </span>
                          </td>
                          <td className="py-2.5 text-center font-semibold text-[#10242A]">
                             ₹{item.amount?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 text-center">
                             <span className={cn(
                                "inline-block text-[12px] font-semibold px-2.5 py-0.5 rounded-full",
                                item.status === "Paid" ? "bg-[#DDF3E4] text-[#14532D]" : "bg-[#FEF3C7] text-[#92400E]"
                             )}>
                                {item.status}
                             </span>
                          </td>
                          <td className="py-2.5 text-right text-[#4A5961]">
                             {item.date}
                          </td>
                       </tr>
                     ))}
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
