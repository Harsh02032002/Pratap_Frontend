import React, { useState, useEffect } from "react";
import { Search, Printer, FileText, RefreshCw } from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function OwnerReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/owner/receipts");
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
    
    const gstPercentage = r.gst_percentage !== undefined ? r.gst_percentage : 18;
    const gstAmount = r.gst_amount !== undefined ? r.gst_amount : Math.round((r.commission_amount * gstPercentage / 100) * 100) / 100;
    
    const showGst = gstAmount > 0;
    const cgst = showGst ? Math.round((gstAmount / 2) * 100) / 100 : 0;
    const sgst = showGst ? Math.round((gstAmount / 2) * 100) / 100 : 0;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Disbursement Statement - RoomHy</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 40px;
      line-height: 1.5;
      background: #f8fafc;
    }
    .receipt-container {
      max-width: 780px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 45px;
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 35px;
    }
    .logo {
      font-size: 32px;
      font-weight: 900;
      color: #6366f1;
      letter-spacing: -0.025em;
    }
    .title-status {
      text-align: right;
    }
    .status-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      font-size: 10px;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid #a7f3d0;
    }
    .receipt-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 12px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 35px;
      background: #fafafa;
      border-radius: 16px;
    }
    .meta-cell {
      width: 50%;
      vertical-align: top;
      padding: 20px;
    }
    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .meta-val {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }
    .statement-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 35px;
    }
    .statement-table th {
      border-bottom: 2px solid #f1f5f9;
      padding: 14px 18px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }
    .statement-table td {
      padding: 18px;
      font-size: 13px;
      color: #475569;
      border-bottom: 1px solid #f1f5f9;
    }
    .text-right {
      text-align: right;
    }
    .summary-section {
      width: 100%;
      border-collapse: collapse;
    }
    .summary-section td {
      padding: 10px 18px;
      font-size: 13px;
    }
    .grand-total {
      font-size: 20px !important;
      font-weight: 800;
      color: #6366f1;
      border-top: 2px solid #f1f5f9;
      padding-top: 20px !important;
    }
    .footer {
      margin-top: 55px;
      border-top: 1px dashed #e2e8f0;
      padding-top: 24px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <table class="header-table">
      <tr>
        <td>
          <div class="logo">RoomHy</div>
          <div style="font-size: 12px; color: #94a3b8; font-weight: 500; margin-top: 4px;">Tenant Housing Payout Agent</div>
        </td>
        <td class="title-status">
          <span class="status-badge">Transferred</span>
          <div class="receipt-title">Disbursement Statement</div>
        </td>
      </tr>
    </table>

    <table class="meta-table">
      <tr>
        <td class="meta-cell" style="border-right: 1px solid #f1f5f9;">
          <div class="meta-label">Beneficiary Details</div>
          <div class="meta-val" style="font-size: 15px; color: #0f172a; font-weight: 700;">${r.owner_name}</div>
          <div class="meta-val" style="font-weight: 500; margin-top: 4px;">Property: ${r.property_name || 'N/A'}</div>
          <div class="meta-val" style="font-weight: 500; color: #64748b; font-size: 11px;">Owner ID: ${r.owner_id || 'N/A'}</div>
        </td>
        <td class="meta-cell" style="text-align: right;">
          <div class="meta-label">Transaction Details</div>
          <div class="meta-val">Date: ${r.date || new Date().toLocaleDateString('en-IN')}</div>
          <div class="meta-val" style="font-family: monospace;">Payment ID: ${r.razorpay_payment_id || 'N/A'}</div>
          <div class="meta-val" style="font-family: monospace;">Payout Ref: ${r.payout_reference || 'N/A'}</div>
        </td>
      </tr>
    </table>

    <table class="statement-table">
      <thead>
        <tr>
          <th style="text-align: left; width: 60%;">Description</th>
          <th class="text-right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Gross Collected Rent / Booking Amount</strong>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Total amount collected from tenant for this cycle</div>
          </td>
          <td class="text-right" style="font-weight: 600;">₹${r.booking_amount?.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>
            <strong>Platform Commission Fee (${r.commission_percentage !== undefined ? r.commission_percentage : 10}%)</strong>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">RoomHy technology platform enablement fee</div>
          </td>
          <td class="text-right" style="color: #ef4444; font-weight: 600;">(-) ₹${r.commission_amount?.toLocaleString('en-IN')}</td>
        </tr>
        ${showGst ? `
        <tr>
          <td>
            <strong>GST on Commission (${gstPercentage}%)</strong>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">CGST (9%): ₹${cgst.toLocaleString('en-IN')} | SGST (9%): ₹${sgst.toLocaleString('en-IN')}</div>
          </td>
          <td class="text-right" style="color: #ef4444; font-weight: 600;">(-) ₹${gstAmount.toLocaleString('en-IN')}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>

    <table class="summary-section">
      <tr>
        <td style="width: 60%; font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; text-align: right; padding-right: 20px;">Subtotal Collected</td>
        <td class="text-right" style="font-weight: 600; width: 40%;">₹${r.booking_amount?.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; text-align: right; padding-right: 20px;">Total Fees & Tax Deductions</td>
        <td class="text-right" style="color: #ef4444; font-weight: 600;">(-) ₹${(r.commission_amount + (showGst ? gstAmount : 0)).toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td class="grand-total" style="text-align: right; padding-right: 20px; font-size: 13px !important; text-transform: uppercase; letter-spacing: 0.05em;">Net Disbursement Transferred</td>
        <td class="text-right grand-total">₹${r.owner_amount?.toLocaleString('en-IN')}</td>
      </tr>
    </table>

    <div class="footer">
      <p>This is a computer generated disbursement advice statement. No signature required.</p>
      <p style="margin-top: 6px;">Thank you for partnering with RoomHy. For support, reach out to team@roomhy.com</p>
    </div>
  </div>
</body>
</html>
    `;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const filtered = receipts.filter(r => 
    r.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.property_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Owner Disbursement Receipts</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit trail for owner collections, commission deduction invoice reference</p>
         </div>
         <button onClick={loadReceipts} className="p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
         </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Disbursement statements</h3>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search owner..." className="bg-slate-50 border-none rounded-xl py-2 px-4 text-[10px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                     <th className="pb-4">Owner Name</th>
                     <th className="pb-4">Property</th>
                     <th className="pb-4 text-center">Gross (₹)</th>
                     <th className="pb-4 text-center">Fee Deducted (₹)</th>
                     <th className="pb-4 text-center">Net Transferred (₹)</th>
                     <th className="pb-4 text-right">Actions</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-bold">Loading statements...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-bold">No statements found</td></tr>
                  ) : filtered.map((r, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                       <td className="py-3 font-bold text-slate-800">{r.owner_name}</td>
                       <td className="py-3 font-medium text-slate-600">{r.property_name || "N/A"}</td>
                       <td className="py-3 text-center font-semibold text-slate-800">₹{r.booking_amount?.toLocaleString('en-IN')}</td>
                       <td className="py-3 text-center font-semibold text-rose-500">(-) ₹{r.commission_amount?.toLocaleString('en-IN')}</td>
                       <td className="py-3 text-center font-bold text-emerald-600">₹{r.owner_amount?.toLocaleString('en-IN')}</td>
                       <td className="py-3 text-right">
                          <button onClick={() => handlePrint(r)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 border border-slate-100 shadow-sm" title="Print Statement"><Printer className="w-3.5 h-3.5" /></button>
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

