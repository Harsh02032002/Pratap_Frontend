import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Wallet,
  ArrowUpCircle, ArrowDownCircle, RotateCcw, Plus,
  Download, Eye, CreditCard, LayoutGrid, RefreshCw,
  Calculator, Receipt, FileText, AlertCircle, Percent
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";
import { PageHeader } from "../../components/superadmin/PageHeader";

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
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <PageHeader
        title="Other Charges"
        subtitle="Manage penalties, electricity bills, and utility fee collections."
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
        <StatCardHorizontal label="Total Penalties" value={`₹${stats.totalPenalty.toLocaleString('en-IN')}`} trend="Late Fees" up icon={AlertCircle} color="rose" />
        <StatCardHorizontal label="Electricity Collections" value={`₹${stats.totalElectricity.toLocaleString('en-IN')}`} trend="Utility Fees" up icon={Zap} color="blue" />
        <StatCardHorizontal label="Pending Items" value={stats.pendingCount} trend="Awaiting Payment" up={false} icon={Clock} color="amber" />
        <StatCardHorizontal label="Settled Items" value={stats.paidCount} trend="Successfully Paid" up icon={CheckCircle2} color="emerald" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-50 pb-4">
            <div className="flex items-center gap-2">
               <button
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterType === "all" ? "bg-slate-800 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
               >
                  All Charges
               </button>
               <button
                  onClick={() => setFilterType("penalty")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterType === "penalty" ? "bg-rose-600 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
               >
                  Penalties
               </button>
               <button
                  onClick={() => setFilterType("electricity")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterType === "electricity" ? "bg-blue-600 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
               >
                  Electricity
               </button>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative group w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input 
                    placeholder="Search by ID, Tenant..." 
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
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading charge records...</p>
           </div>
         ) : otherChargesData.length === 0 ? (
           <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No Other Charges Found</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">All utility payments and penalties are settled</p>
           </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                        <th className="pb-4">Charge ID</th>
                        <th className="pb-4">Invoice Ref</th>
                        <th className="pb-4">Tenant Name</th>
                        <th className="pb-4">Type</th>
                        <th className="pb-4 text-center">Amount (₹)</th>
                        <th className="pb-4 text-center">Status</th>
                        <th className="pb-4 text-right">Created Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {otherChargesData.map((item, i) => (
                       <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4">
                             <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                                {item.id}
                             </span>
                          </td>
                          <td className="py-4">
                             <span className="text-[11px] font-bold text-slate-700">{item.invoiceNumber}</span>
                          </td>
                          <td className="py-4">
                             <p className="text-[11px] font-bold text-slate-800">{item.tenantName}</p>
                          </td>
                          <td className="py-4">
                             <span className={cn(
                               "text-[9px] font-bold px-2 py-0.5 rounded-lg border",
                               item.color === "blue" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-rose-50 text-rose-600 border-rose-100"
                             )}>
                               {item.chargeType}
                             </span>
                          </td>
                          <td className="py-4 text-center">
                             <p className="text-[11px] font-bold text-slate-855">₹{item.amount?.toLocaleString('en-IN')}</p>
                          </td>
                          <td className="py-4 text-center">
                             <span className={cn(
                                "text-[7px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm",
                                item.status === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                             )}>
                                {item.status}
                             </span>
                          </td>
                          <td className="py-4 text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</p>
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

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    rose: "bg-rose-50 text-rose-600 border-rose-100",
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
