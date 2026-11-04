import React, { useState, useEffect } from "react";
import { 
  Search, RefreshCw, FileText, Printer
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Financial Ledger</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Global transaction history and audit-ready fiscal flows.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
             <RefreshCw className="w-3.5 h-3.5 text-[#0E7C86]" /> Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardHorizontal 
          label="Total Volume Received" 
          value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`} 
          trend="Gross Collections" 
        />
        <StatCardHorizontal 
          label="Commissions Earned" 
          value={`₹${(stats.commissionEarned || 0).toLocaleString('en-IN')}`} 
          trend="Platform Split" 
        />
        <StatCardHorizontal 
          label="Payouts Completed" 
          value={`₹${(stats.paidPayouts || 0).toLocaleString('en-IN')}`} 
          trend="Disbursed Split" 
        />
        <StatCardHorizontal 
          label="Wallet Balance" 
          value={`₹${(stats.walletBalance || 0).toLocaleString('en-IN')}`} 
          trend="Net Funds Held" 
        />
      </div>

      {/* Outside Search & Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
                 "px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer",
                 activeTab === tab.id 
                   ? "bg-[#0E7C86] text-white shadow-xs font-semibold" 
                   : "bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50 shadow-xs"
               )}
             >
               {tab.label}
             </button>
           ))}
        </div>
        
        <div className="relative w-full sm:w-[280px]">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
           <input 
             placeholder="Search by ID, Name..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
           />
        </div>
      </div>

      {/* Standalone Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
         {loading ? (
           <div className="py-8 flex flex-col items-center justify-center gap-2">
             <RefreshCw className="w-6 h-6 text-[#0E7C86] animate-spin" />
             <p className="text-[13px] text-[#4A5961]">Loading dynamic fiscal records...</p>
           </div>
         ) : currentData.length === 0 ? (
           <div className="py-8 text-center">
              <p className="text-[13px] font-semibold text-[#10242A]">No Data Available</p>
              <p className="text-[12px] text-[#4A5961] mt-0.5">Check settings or verify payments collection</p>
           </div>
         ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-[#E1E6EA]">
                       <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">TXN Identity</th>
                       {activeTab === "all" && (
                         <>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Amount (₹)</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Payment Mode</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Category</th>
                         </>
                       )}
                       {activeTab === "onboarding" && (
                         <>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Rent (₹)</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Sec. Deposit (₹)</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Total Paid (₹)</th>
                         </>
                       )}
                       {activeTab === "monthly" && (
                         <>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Amount Paid (₹)</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Mode</th>
                         </>
                       )}
                       {activeTab === "cash" && (
                         <>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Amount Paid (₹)</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner Name</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Action Required</th>
                         </>
                       )}
                       {activeTab === "commissions" && (
                         <>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Booking ID</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Booking Amt (₹)</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Comm %</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Comm Amt (₹)</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Owner Split (₹)</th>
                         </>
                       )}
                       {activeTab === "payouts" && (
                         <>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner Name</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner ID</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Amount (₹)</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Payout Status</th>
                           <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Payout Ref</th>
                         </>
                       )}
                       <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Payment Date</th>
                       <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right px-2">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                    {currentData.map((item, i) => (
                      <tr key={i} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer">
                         <td className="py-2.5">
                            <span className="text-[12px] font-mono font-semibold text-[#0E7C86] bg-[#E8F3F4] px-2 py-0.5 rounded-[6px]">
                               {item.razorpay_payment_id || 'N/A'}
                            </span>
                         </td>
                         
                         {/* All Tab */}
                         {activeTab === "all" && (
                           <>
                             <td className="py-2.5 font-medium text-[#10242A]">{item.tenant_name}</td>
                             <td className="py-2.5 text-[#4A5961] truncate max-w-[180px]">{item.property_name}</td>
                             <td className="py-2.5 text-center font-semibold text-[#10242A]">₹{item.amount?.toLocaleString('en-IN')}</td>
                             <td className="py-2.5 text-center">
                               <span className={cn(
                                 "inline-block text-[12px] px-2.5 py-0.5 rounded-full font-semibold",
                                 item.method === "Cash" ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#DDF3E4] text-[#14532D]"
                               )}>
                                 {item.method}
                               </span>
                             </td>
                             <td className="py-2.5 text-center">
                               <span className="inline-block text-[12px] bg-[#E8EDF1] text-[#4A5961] px-2.5 py-0.5 rounded-full font-semibold">
                                 {item.txn_type}
                               </span>
                             </td>
                           </>
                         )}

                         {/* Onboarding Tab */}
                         {activeTab === "onboarding" && (
                           <>
                             <td className="py-2.5 font-medium text-[#10242A]">{item.tenant_name}</td>
                             <td className="py-2.5 text-[#4A5961] truncate max-w-[180px]">{item.property_name}</td>
                             <td className="py-2.5 text-center text-[#4A5961]">₹{item.monthly_rent?.toLocaleString('en-IN')}</td>
                             <td className="py-2.5 text-center text-[#4A5961]">₹{item.security_deposit?.toLocaleString('en-IN')}</td>
                             <td className="py-2.5 text-center text-[#0E7C86] font-bold">₹{item.amount?.toLocaleString('en-IN')}</td>
                           </>
                         )}

                         {/* Monthly Rent Tab */}
                         {activeTab === "monthly" && (
                           <>
                             <td className="py-2.5 font-medium text-[#10242A]">{item.tenant_name}</td>
                             <td className="py-2.5 text-[#4A5961] truncate max-w-[180px]">{item.property_name}</td>
                             <td className="py-2.5 text-center text-[#14532D] font-semibold">₹{item.amount?.toLocaleString('en-IN')}</td>
                             <td className="py-2.5 text-center capitalize text-[#4A5961]">{item.payment_method}</td>
                           </>
                         )}

                         {/* Cash Payments Tab */}
                         {activeTab === "cash" && (
                           <>
                             <td className="py-2.5 font-medium text-[#10242A]">{item.tenant_name}</td>
                             <td className="py-2.5 text-[#4A5961] truncate max-w-[180px]">{item.property_name}</td>
                             <td className="py-2.5 text-center text-[#92400E] font-semibold">₹{item.amount?.toLocaleString('en-IN')}</td>
                             <td className="py-2.5 text-[#4A5961]">{item.owner_name} ({item.owner_id})</td>
                             <td className="py-2.5 text-center">
                               <span className="inline-block text-[12px] bg-[#FDE8E8] text-[#991B1B] px-2.5 py-0.5 rounded-full font-semibold">
                                 Collect Comm.
                               </span>
                             </td>
                           </>
                         )}

                         {/* Commissions Tab Specific */}
                         {activeTab === "commissions" && (
                           <>
                             <td className="py-2.5 font-mono text-[#4A5961]">{item.booking_id?.slice(-8)}</td>
                             <td className="py-2.5 text-center font-medium text-[#10242A]">₹{item.booking_amount?.toLocaleString('en-IN')}</td>
                             <td className="py-2.5 text-center">
                                <span className="inline-block text-[12px] font-semibold text-[#1E3A5F] bg-[#E1ECF4] px-2.5 py-0.5 rounded-full">{item.commission_percentage}%</span>
                             </td>
                             <td className="py-2.5 text-center text-[#14532D] font-semibold">₹{item.commission_amount?.toLocaleString('en-IN')}</td>
                             <td className="py-2.5 text-center text-[#4A5961]">₹{item.owner_amount?.toLocaleString('en-IN')}</td>
                           </>
                         )}

                         {/* Payouts Tab Specific */}
                         {activeTab === "payouts" && (
                           <>
                             <td className="py-2.5 font-medium text-[#10242A]">{item.owner_name}</td>
                             <td className="py-2.5 font-mono text-[#4A5961]">{item.owner_id}</td>
                             <td className="py-2.5 text-center font-semibold text-[#10242A]">₹{item.owner_amount?.toLocaleString('en-IN')}</td>
                             <td className="py-2.5 text-center">
                                <span className={cn(
                                   "inline-block text-[12px] font-semibold px-2.5 py-0.5 rounded-full",
                                   item.payout_status === "Paid" || item.payout_status === "Completed" ? "bg-[#DDF3E4] text-[#14532D]" :
                                   "bg-[#FEF3C7] text-[#92400E]"
                                 )}>
                                   {item.payout_status || 'Pending'}
                                </span>
                             </td>
                             <td className="py-2.5 text-[#4A5961] truncate max-w-[120px]">{item.payout_reference || 'N/A'}</td>
                           </>
                         )}

                         <td className="py-2.5 text-right text-[#4A5961] text-[13px]">
                            {item.date || item.payout_date || 'N/A'}
                         </td>

                         {/* Action Column for Printing Statements */}
                         <td className="py-2.5 text-right px-2">
                           {activeTab === "onboarding" && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 printOnboardingReceipt(item);
                               }}
                               className="p-1.5 bg-[#F4F6F8] hover:bg-[#E8F3F4] text-[#4A5961] hover:text-[#0E7C86] rounded-[6px] transition-all cursor-pointer"
                               title="Print Receipt"
                             >
                               <Printer size={14} />
                             </button>
                           )}
                           {activeTab === "payouts" && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 printPayoutReceipt(item);
                               }}
                               className="p-1.5 bg-[#F4F6F8] hover:bg-[#E8F3F4] text-[#4A5961] hover:text-[#0E7C86] rounded-[6px] transition-all cursor-pointer"
                               title="Print Statement"
                             >
                               <Printer size={14} />
                             </button>
                           )}
                           {activeTab === "all" && item.txn_type === "Onboarding (With Deposit)" && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 printOnboardingReceipt(item);
                               }}
                               className="p-1.5 bg-[#F4F6F8] hover:bg-[#E8F3F4] text-[#4A5961] hover:text-[#0E7C86] rounded-[6px] transition-all cursor-pointer"
                               title="Print Receipt"
                             >
                               <Printer size={14} />
                             </button>
                           )}
                           {activeTab === "all" && item.txn_type !== "Onboarding (With Deposit)" && (
                             <span className="text-[13px] text-[#8C9BA5]">—</span>
                           )}
                           {activeTab !== "onboarding" && activeTab !== "payouts" && activeTab !== "all" && (
                             <span className="text-[13px] text-[#8C9BA5]">—</span>
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
