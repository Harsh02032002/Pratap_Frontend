import React, { useState, useEffect } from "react";
import { Search, Download, Eye, FileText, Printer, CheckCircle2, RotateCcw, Calendar, RefreshCw } from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function billingLabel(billingMonth) {
  if (!billingMonth) return "—";
  const [yr, mo] = billingMonth.split("-");
  return new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString("en", { month: "long" }) + " " + yr;
}

export default function TenantReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'booking' | 'rent'

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/tenant/receipts");
      if (res.success) {
        setReceipts(res.receipts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const handlePrint = (r) => {
    const win = window.open("", "_blank", "width=860,height=960");
    const category = r.receiptType === 'BOOKING_TOKEN' ? 'Booking Token Receipt' : 'Rent Payment Receipt';
    win.document.write(`
      <html>
        <head>
          <title>${category} - ${r.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
            .receipt-box { border: 2px solid #0fa596; border-radius: 16px; padding: 32px; max-width: 600px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 800; color: #0fa596; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .label { font-weight: 600; color: #64748b; }
            .value { font-weight: 700; color: #0f172a; }
            .total { background: #f0fdf4; padding: 16px; border-radius: 12px; border: 1px solid #bbf7d0; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div className="receipt-box">
            <div class="header">
              <div>
                <div class="title">RoomHy Receipts</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${category}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 800;">${r.invoiceNumber}</div>
                <div style="font-size: 12px; color: #64748b;">${r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
            <div class="row"><span class="label">Tenant Name:</span><span class="value">${r.tenantName || 'N/A'}</span></div>
            <div class="row"><span class="label">Property:</span><span class="value">${r.propertyName || 'Roomhy Property'}</span></div>
            <div class="row"><span class="label">Payment Type:</span><span class="value">${r.receiptType === 'BOOKING_TOKEN' ? 'Advance Booking Token' : 'Monthly Rent Payment'}</span></div>
            <div class="row"><span class="label">Payment Method:</span><span class="value">${r.paymentMethod || 'Cashfree'}</span></div>
            <div class="total row">
              <span class="label" style="font-size: 16px; color: #166534;">Total Amount Paid:</span>
              <span class="value" style="font-size: 18px; color: #166534;">₹${r.paidAmount?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const filtered = receipts.filter(r => {
    const matchesSearch = r.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
                          r.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
                          r.propertyName?.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === "booking") {
      return matchesSearch && r.receiptType === "BOOKING_TOKEN";
    }
    if (activeTab === "rent") {
      return matchesSearch && r.receiptType === "RENT";
    }
    return matchesSearch;
  });

  const bookingCount = receipts.filter(r => r.receiptType === "BOOKING_TOKEN").length;
  const rentCount = receipts.filter(r => r.receiptType === "RENT").length;

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tenant Receipts Ledger</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Booking Token &amp; Monthly Rent Payment Receipts</p>
         </div>
         <button onClick={loadReceipts} className="p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
         </button>
      </div>

      {/* ── 2 TABS CONTROL ── */}
      <div className="flex items-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
            activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <span>All Receipts</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] text-slate-600 font-extrabold">{receipts.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("booking")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
            activeTab === "booking" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-slate-600 hover:text-purple-600"
          )}
        >
          <span>🎟️ Booking Token Receipts</span>
          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-extrabold", activeTab === "booking" ? "bg-purple-700 text-white" : "bg-purple-50 text-purple-600")}>{bookingCount}</span>
        </button>
        <button
          onClick={() => setActiveTab("rent")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
            activeTab === "rent" ? "bg-teal-600 text-white shadow-md shadow-teal-600/20" : "text-slate-600 hover:text-teal-600"
          )}
        >
          <span>🏠 Monthly Rent Receipts</span>
          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-extrabold", activeTab === "rent" ? "bg-teal-700 text-white" : "bg-teal-50 text-teal-600")}>{rentCount}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
              {activeTab === "booking" ? "Booking Token Receipts" : activeTab === "rent" ? "Monthly Rent Receipts" : "All Receipt Records"}
            </h3>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search receipt..." className="bg-slate-50 border-none rounded-xl py-2 px-4 text-[10px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                     <th className="pb-4">Invoice No</th>
                     <th className="pb-4">Tenant</th>
                     <th className="pb-4">Type</th>
                     <th className="pb-4 text-center">Period / Date</th>
                     <th className="pb-4 text-center">Paid (₹)</th>
                     <th className="pb-4 text-center">Status</th>
                     <th className="pb-4 text-right">Actions</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-bold">Loading receipts...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-bold">No Receipts Found</td></tr>
                  ) : filtered.map((r, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                       <td className="py-3 font-mono font-bold text-blue-600">{r.invoiceNumber}</td>
                       <td className="py-3 font-bold text-slate-800">{r.tenantName || "N/A"}</td>
                       <td className="py-3">
                          <span className={cn(
                            "text-[8px] font-bold px-2 py-0.5 rounded-lg border uppercase",
                            r.receiptType === 'BOOKING_TOKEN' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-teal-50 text-teal-700 border-teal-200"
                          )}>
                            {r.receiptType === 'BOOKING_TOKEN' ? 'Booking Token' : 'Rent Payment'}
                          </span>
                       </td>
                       <td className="py-3 text-center text-slate-600 font-medium">
                        {r.receiptType === 'BOOKING_TOKEN' ? (r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : 'Token') : billingLabel(r.billingMonth)}
                       </td>
                       <td className="py-3 text-center font-bold text-slate-800">₹{r.paidAmount?.toLocaleString('en-IN') || 0}</td>
                       <td className="py-3 text-center">
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase">{r.status}</span>
                       </td>
                       <td className="py-3 text-right">
                          <button onClick={() => handlePrint(r)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 border border-slate-100 shadow-sm" title="Print Receipt"><Printer className="w-3.5 h-3.5" /></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
