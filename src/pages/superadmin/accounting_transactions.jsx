import React, { useState, useEffect } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Wallet,
  ArrowUpCircle, ArrowDownCircle, RotateCcw, Plus,
  Download, Eye, CreditCard, LayoutGrid, RefreshCw,
  Calculator, Receipt, FileText, Printer
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function Transactions() {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "onboarding" | "monthly" | "cash" | "commissions" | "payouts"
  const [stats, setStats] = useState({
    totalRevenue: 0,
    commissionEarned: 0,
    ownerEarnings: 0,
    pendingPayouts: 0,
    paidPayouts: 0,
    walletBalance: 0,
    totalTransactions: 0
  });
  const [payments, setPayments] = useState([]); // first-time onboarding
  const [rentPayments, setRentPayments] = useState([]); // monthly invoices
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useSEO({
    title: "Financial Ledger - Roomhy Super Admin",
    description: "Audit-ready financial ledger tracking Razorpay payments, platform commissions, and owner payouts.",
    canonical: "https://roomhy.com/superadmin/accounting/transactions"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetchJson("/api/superadmin/revenue/stats");
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      const txRes = await fetchJson("/api/superadmin/revenue/transactions");
      if (txRes.success) {
        setPayments(txRes.payments || []);
        setCommissions(txRes.commissions || []);
        setPayouts(txRes.payouts || []);
        setRentPayments(txRes.rentPayments || []);
      }
    } catch (error) {
      console.error("Error loading ledger data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Print Statement Helper for Owner Payout
  const printPayoutReceipt = (py) => {
    const win = window.open("", "_blank", "width=860,height=960");
    const totalPaid = py.owner_amount + py.commission_amount + (py.gst_amount || 0);
    const gst = py.gst_amount || 0;
    const commission = py.commission_amount || 0;
    const netOwner = py.owner_amount;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Owner Payout Statement - RoomHy</title>
      <style>
        body { font-family: sans-serif; color: #1e293b; margin: 40px; background: #f8fafc; }
        .receipt-container { max-width: 780px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; padding: 45px; background: #ffffff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; margin-bottom: 35px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
        .logo { font-size: 32px; font-weight: 900; color: #6366f1; }
        .title { text-align: right; }
        .status-badge { display: inline-block; background: #ecfdf5; color: #065f46; font-size: 10px; font-weight: 800; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #a7f3d0; }
        .receipt-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 12px; }
        .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 35px; background: #fafafa; border-radius: 16px; padding: 20px; }
        .meta-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
        .meta-val { font-size: 13px; font-weight: 600; color: #334155; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
        .table th { border-bottom: 2px solid #f1f5f9; padding: 14px; text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; }
        .table td { padding: 14px; font-size: 13px; color: #475569; border-bottom: 1px solid #f1f5f9; }
        .grand-total { font-size: 20px; font-weight: 800; color: #6366f1; text-align: right; margin-top: 20px; border-top: 2px solid #f1f5f9; padding-top: 20px; }
        .footer { margin-top: 55px; border-top: 1px dashed #e2e8f0; padding-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div>
            <div class="logo">RoomHy</div>
            <div style="font-size: 12px; color: #94a3b8; font-weight: 500; margin-top: 4px;">Owner Housing Payout Agent</div>
          </div>
          <div class="title">
            <span class="status-badge">Transferred</span>
            <div class="receipt-title">Owner Payout Statement</div>
          </div>
        </div>
        
        <div class="meta-grid">
          <div>
            <div class="meta-label">Beneficiary Details</div>
            <div class="meta-val">${py.owner_name || "Property Owner"}</div>
            <div class="meta-val" style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 4px;">Owner ID: ${py.owner_id || "N/A"}</div>
          </div>
          <div>
            <div class="meta-label">Transaction Details</div>
            <div class="meta-val" style="font-family: monospace;">ID: ${py.razorpay_payment_id || "N/A"}</div>
            <div class="meta-val" style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 4px;">Disbursed on: ${py.payout_date || "N/A"}</div>
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gross Rent Volume Collected from Tenants</td>
              <td style="text-align: right;">₹${totalPaid.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr style="color: #e11d48;">
              <td>(-) Platform Commission Cut (${py.commission_percentage || 10}%)</td>
              <td style="text-align: right;">- ₹${commission.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr style="color: #e11d48;">
              <td>(-) GST on Commission (${py.gst_percentage !== undefined ? py.gst_percentage : 18}%)</td>
              <td style="text-align: right;">- ₹${gst.toLocaleString('en-IN')}.00</td>
            </tr>
          </tbody>
        </table>
        
        <div class="grand-total">
          Net Disbursed to Owner: ₹${netOwner.toLocaleString('en-IN')}.00
        </div>
        
        <div class="footer">
          This is a system-generated statement. No physical signature is required.
        </div>
      </div>
      <script>window.print();</script>
    </body>
    </html>
    `;
    win.document.write(html);
    win.document.close();
  };

  // Print Receipt Helper for Tenant Onboarding (First-time)
  const printOnboardingReceipt = (p) => {
    const win = window.open("", "_blank", "width=860,height=960");
    const rent = p.monthly_rent || 0;
    const deposit = p.security_deposit || 0;
    const total = p.amount || (rent + deposit);
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Onboarding Payment Receipt - RoomHy</title>
      <style>
        body { font-family: sans-serif; color: #1e293b; margin: 40px; background: #f8fafc; }
        .receipt-container { max-width: 780px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; padding: 45px; background: #ffffff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; margin-bottom: 35px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
        .logo { font-size: 32px; font-weight: 900; color: #3b82f6; }
        .title { text-align: right; }
        .status-badge { display: inline-block; background: #ecfdf5; color: #065f46; font-size: 10px; font-weight: 800; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; border: 1px solid #a7f3d0; }
        .receipt-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 12px; }
        .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 35px; background: #fafafa; border-radius: 16px; padding: 20px; }
        .meta-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
        .meta-val { font-size: 13px; font-weight: 600; color: #334155; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
        .table th { border-bottom: 2px solid #f1f5f9; padding: 14px; text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; }
        .table td { padding: 14px; font-size: 13px; color: #475569; border-bottom: 1px solid #f1f5f9; }
        .grand-total { font-size: 20px; font-weight: 800; color: #3b82f6; text-align: right; margin-top: 20px; border-top: 2px solid #f1f5f9; padding-top: 20px; }
        .footer { margin-top: 55px; border-top: 1px dashed #e2e8f0; padding-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div>
            <div class="logo">RoomHy</div>
            <div style="font-size: 12px; color: #94a3b8; font-weight: 500; margin-top: 4px;">Tenant Housing Onboarding Agent</div>
          </div>
          <div class="title">
            <span class="status-badge">Paid</span>
            <div class="receipt-title">Onboarding Statement</div>
          </div>
        </div>
        
        <div class="meta-grid">
          <div>
            <div class="meta-label">Tenant Details</div>
            <div class="meta-val">${p.tenant_name || "Resident"}</div>
            <div class="meta-val" style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 4px;">Booking ID: ${p.booking_id || "N/A"}</div>
          </div>
          <div>
            <div class="meta-label">Transaction Details</div>
            <div class="meta-val" style="font-family: monospace;">ID: ${p.razorpay_payment_id || "N/A"}</div>
            <div class="meta-val" style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 4px;">Date: ${p.date || "N/A"}</div>
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>First Month Rent for ${p.property_name || "Property"}</td>
              <td style="text-align: right;">₹${rent.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr>
              <td>Refundable Security Deposit</td>
              <td style="text-align: right;">₹${deposit.toLocaleString('en-IN')}.00</td>
            </tr>
          </tbody>
        </table>
        
        <div class="grand-total">
          Total Amount Paid: ₹${total.toLocaleString('en-IN')}.00
        </div>
        
        <div class="footer">
          This is a system-generated statement. No physical signature is required.
        </div>
      </div>
      <script>window.print();</script>
    </body>
    </html>
    `;
    win.document.write(html);
    win.document.close();
  };

  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();
    if (activeTab === "all") {
      const allTx = [
        ...payments.map(p => ({ ...p, txn_type: "Onboarding (With Deposit)", method: "Online" })),
        ...rentPayments.map(rp => ({
          ...rp,
          razorpay_payment_id: rp.transaction_id,
          txn_type: "Monthly Rent",
          method: rp.payment_method === "cash" ? "Cash" : "Online"
        }))
      ];
      return allTx.filter(t => 
        (t.razorpay_payment_id || "").toLowerCase().includes(query) ||
        (t.tenant_name || "").toLowerCase().includes(query) ||
        (t.property_name || "").toLowerCase().includes(query)
      );
    } else if (activeTab === "onboarding") {
      return payments.filter(p => 
        (p.razorpay_payment_id || "").toLowerCase().includes(query) ||
        (p.tenant_name || "").toLowerCase().includes(query) ||
        (p.property_name || "").toLowerCase().includes(query)
      );
    } else if (activeTab === "monthly") {
      return rentPayments.filter(rp => 
        rp.payment_method !== "cash" && (
          (rp.transaction_id || "").toLowerCase().includes(query) ||
          (rp.tenant_name || "").toLowerCase().includes(query) ||
          (rp.property_name || "").toLowerCase().includes(query)
        )
      );
    } else if (activeTab === "cash") {
      return rentPayments.filter(rp => 
        rp.payment_method === "cash" && (
          (rp.transaction_id || "").toLowerCase().includes(query) ||
          (rp.tenant_name || "").toLowerCase().includes(query) ||
          (rp.property_name || "").toLowerCase().includes(query)
        )
      );
    } else if (activeTab === "commissions") {
      return commissions.filter(c => 
        (c.razorpay_payment_id || "").toLowerCase().includes(query) ||
        (c.booking_id || "").toLowerCase().includes(query)
      );
    } else {
      return payouts.filter(py => 
        (py.razorpay_payment_id || "").toLowerCase().includes(query) ||
        (py.owner_id || "").toLowerCase().includes(query) ||
        (py.owner_name || "").toLowerCase().includes(query)
      );
    }
  };

  const currentData = getFilteredData();

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <PageHeader
        title="Financial Ledger"
        subtitle="Global transaction history and audit-ready fiscal flows."
        actions={
          <button 
            onClick={loadData}
            className="bg-white text-[#4A5961] border border-[#E1E6EA] px-3.5 py-2 rounded-[12px] text-xs font-semibold hover:bg-[#F4F6F8] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
             <RefreshCw className="w-3.5 h-3.5 text-[#0E7C86]" /> Refresh
          </button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal 
          label="Total Volume Received" 
          value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`} 
          trend="Gross Collections" 
          up 
          icon={Wallet} 
          color="blue" 
        />
        <StatCardHorizontal 
          label="Commissions Earned" 
          value={`₹${(stats.commissionEarned || 0).toLocaleString('en-IN')}`} 
          trend="Platform Split" 
          up 
          icon={ArrowDownCircle} 
          color="emerald" 
        />
        <StatCardHorizontal 
          label="Payouts Completed" 
          value={`₹${(stats.paidPayouts || 0).toLocaleString('en-IN')}`} 
          trend="Disbursed Split" 
          up 
          icon={ArrowUpCircle} 
          color="amber" 
        />
        <StatCardHorizontal 
          label="Wallet Balance" 
          value={`₹${(stats.walletBalance || 0).toLocaleString('en-IN')}`} 
          trend="Net Funds Held" 
          up 
          icon={Zap} 
          color="indigo" 
        />
      </div>

      {/* Outside Search & Tabs Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
           {[
             { id: "all", label: "All Payments" },
             { id: "onboarding", label: "First-time / Onboarding" },
             { id: "monthly", label: "Monthly Rent (Online)" },
             { id: "cash", label: "Cash Payments" },
             { id: "commissions", label: "Commission Splits" },
             { id: "payouts", label: "Owner Payouts" }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => {
                 setActiveTab(tab.id);
                 setSearchQuery("");
               }}
               className={cn(
                 "px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                 activeTab === tab.id 
                   ? "bg-[#095256] text-white shadow-2xs" 
                   : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
               )}
             >
               {tab.label}
             </button>
           ))}
        </div>
        
        <div className="relative group w-full lg:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
             placeholder="Search by ID, Name..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-white border border-slate-200/80 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#095256]/20 focus:border-[#095256] transition-all shadow-2xs" 
           />
        </div>
      </div>

      {/* Standalone Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
         {loading ? (
           <div className="py-12 flex flex-col items-center justify-center gap-3">
             <RefreshCw className="w-8 h-8 text-[#095256] animate-spin" />
             <p className="text-xs font-semibold text-slate-400">Loading dynamic fiscal records...</p>
           </div>
         ) : currentData.length === 0 ? (
           <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No Data Available</p>
              <p className="text-xs text-slate-400 mt-1">Check settings or verify payments collection</p>
           </div>
         ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                       <th className="pb-4">TXN Identity</th>
                       {activeTab === "all" && (
                         <>
                           <th className="pb-4">Tenant</th>
                           <th className="pb-4">Property</th>
                           <th className="pb-4 text-center">Amount (₹)</th>
                           <th className="pb-4 text-center">Payment Mode</th>
                           <th className="pb-4 text-center">Category</th>
                         </>
                       )}
                       {activeTab === "onboarding" && (
                         <>
                           <th className="pb-4">Tenant</th>
                           <th className="pb-4">Property</th>
                           <th className="pb-4 text-center">Rent (₹)</th>
                           <th className="pb-4 text-center">Sec. Deposit (₹)</th>
                           <th className="pb-4 text-center">Total Paid (₹)</th>
                         </>
                       )}
                       {activeTab === "monthly" && (
                         <>
                           <th className="pb-4">Tenant</th>
                           <th className="pb-4">Property</th>
                           <th className="pb-4 text-center">Amount Paid (₹)</th>
                           <th className="pb-4 text-center">Mode</th>
                         </>
                       )}
                       {activeTab === "cash" && (
                         <>
                           <th className="pb-4">Tenant</th>
                           <th className="pb-4">Property</th>
                           <th className="pb-4 text-center">Amount Paid (₹)</th>
                           <th className="pb-4">Owner Name</th>
                           <th className="pb-4 text-center">Action Required</th>
                         </>
                       )}
                       {activeTab === "commissions" && (
                         <>
                           <th className="pb-4">Booking ID</th>
                           <th className="pb-4 text-center">Booking Amt (₹)</th>
                           <th className="pb-4 text-center">Comm %</th>
                           <th className="pb-4 text-center">Comm Amt (₹)</th>
                           <th className="pb-4 text-center">Owner Split (₹)</th>
                         </>
                       )}
                       {activeTab === "payouts" && (
                         <>
                           <th className="pb-4">Owner Name</th>
                           <th className="pb-4">Owner ID</th>
                           <th className="pb-4 text-center">Amount (₹)</th>
                           <th className="pb-4 text-center">Payout Status</th>
                           <th className="pb-4">Payout Ref</th>
                         </>
                       )}
                       <th className="pb-4 text-right">Payment Date</th>
                       <th className="pb-4 text-right px-4">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-slate-800">
                    {currentData.map((item, i) => (
                      <tr key={i} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                         <td className="py-4">
                            <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                               {item.razorpay_payment_id || 'N/A'}
                            </span>
                         </td>
                         
                         {/* All Tab */}
                         {activeTab === "all" && (
                           <>
                             <td className="py-4">{item.tenant_name}</td>
                             <td className="py-4 truncate max-w-[180px]">{item.property_name}</td>
                             <td className="py-4 text-center">₹{item.amount?.toLocaleString('en-IN')}</td>
                             <td className="py-4 text-center">
                               <span className={cn(
                                 "text-[8px] px-2 py-0.5 rounded-full font-bold",
                                 item.method === "Cash" ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"
                               )}>
                                 {item.method}
                               </span>
                             </td>
                             <td className="py-4 text-center">
                               <span className="text-[8px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
                                 {item.txn_type}
                               </span>
                             </td>
                           </>
                         )}

                         {/* Onboarding Tab */}
                         {activeTab === "onboarding" && (
                           <>
                             <td className="py-4">{item.tenant_name}</td>
                             <td className="py-4 truncate max-w-[180px]">{item.property_name}</td>
                             <td className="py-4 text-center text-slate-600">₹{item.monthly_rent?.toLocaleString('en-IN')}</td>
                             <td className="py-4 text-center text-slate-600">₹{item.security_deposit?.toLocaleString('en-IN')}</td>
                             <td className="py-4 text-center text-blue-600 font-extrabold">₹{item.amount?.toLocaleString('en-IN')}</td>
                           </>
                         )}

                         {/* Monthly Rent Tab */}
                         {activeTab === "monthly" && (
                           <>
                             <td className="py-4">{item.tenant_name}</td>
                             <td className="py-4 truncate max-w-[180px]">{item.property_name}</td>
                             <td className="py-4 text-center text-emerald-600">₹{item.amount?.toLocaleString('en-IN')}</td>
                             <td className="py-4 text-center capitalize">{item.payment_method}</td>
                           </>
                         )}

                         {/* Cash Payments Tab */}
                         {activeTab === "cash" && (
                           <>
                             <td className="py-4">{item.tenant_name}</td>
                             <td className="py-4 truncate max-w-[180px]">{item.property_name}</td>
                             <td className="py-4 text-center text-amber-600">₹{item.amount?.toLocaleString('en-IN')}</td>
                             <td className="py-4">{item.owner_name} ({item.owner_id})</td>
                             <td className="py-4 text-center">
                               <span className="text-[7.5px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded font-bold uppercase">
                                 Collect Comm.
                               </span>
                             </td>
                           </>
                         )}

                         {/* Commissions Tab Specific */}
                         {activeTab === "commissions" && (
                           <>
                             <td className="py-4 font-mono">{item.booking_id?.slice(-8)}</td>
                             <td className="py-4 text-center">₹{item.booking_amount?.toLocaleString('en-IN')}</td>
                             <td className="py-4 text-center">
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{item.commission_percentage}%</span>
                             </td>
                             <td className="py-4 text-center text-emerald-600">₹{item.commission_amount?.toLocaleString('en-IN')}</td>
                             <td className="py-4 text-center text-slate-700">₹{item.owner_amount?.toLocaleString('en-IN')}</td>
                           </>
                         )}

                         {/* Payouts Tab Specific */}
                         {activeTab === "payouts" && (
                           <>
                             <td className="py-4">{item.owner_name}</td>
                             <td className="py-4 font-mono text-slate-500">{item.owner_id}</td>
                             <td className="py-4 text-center">₹{item.owner_amount?.toLocaleString('en-IN')}</td>
                             <td className="py-4 text-center">
                                <span className={cn(
                                   "text-[7px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm",
                                   item.payout_status === "Paid" || item.payout_status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                   "bg-amber-50 text-amber-600 border-amber-100"
                                 )}>
                                   {item.payout_status || 'Pending'}
                                </span>
                             </td>
                             <td className="py-4 truncate max-w-[120px]">{item.payout_reference || 'N/A'}</td>
                           </>
                         )}

                         <td className="py-4 text-right text-slate-400 uppercase text-[9px] tracking-wider">
                            {item.date || item.payout_date || 'N/A'}
                         </td>

                         {/* Action Column for Printing Statements */}
                         <td className="py-4 text-right px-4">
                           {activeTab === "onboarding" && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 printOnboardingReceipt(item);
                               }}
                               className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                               title="Print Receipt"
                             >
                               <Printer size={13} />
                             </button>
                           )}
                           {activeTab === "payouts" && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 printPayoutReceipt(item);
                               }}
                               className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                               title="Print Statement"
                             >
                               <Printer size={13} />
                             </button>
                           )}
                           {activeTab === "all" && item.txn_type === "Onboarding (With Deposit)" && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 printOnboardingReceipt(item);
                               }}
                               className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                               title="Print Receipt"
                             >
                               <Printer size={13} />
                             </button>
                           )}
                           {activeTab === "all" && item.txn_type !== "Onboarding (With Deposit)" && (
                             <span className="text-[10px] text-slate-300 font-medium">—</span>
                           )}
                           {activeTab !== "onboarding" && activeTab !== "payouts" && activeTab !== "all" && (
                             <span className="text-[10px] text-slate-300 font-medium">—</span>
                           )}
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
