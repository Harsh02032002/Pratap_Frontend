import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { 
  ArrowUpRight, ArrowDownRight, Search, Download, 
  Filter, FileText, Calendar, Printer
} from "lucide-react";
import { apiFetch } from "../../utils/api";

export default function TransactionsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const handlePrintOnboarding = (t) => {
    const win = window.open("", "_blank", "width=860,height=960");
    const rent = t.monthly_rent || 0;
    const deposit = t.security_deposit || 0;
    const total = t.amount || (rent + deposit);
    const tenantName = t.desc.split(" · ")[0] || "Resident";
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Tenant Onboarding Statement - RoomHy</title>
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
            <div class="meta-val">${tenantName}</div>
          </div>
          <div>
            <div class="meta-label">Transaction Details</div>
            <div class="meta-val" style="font-family: monospace;">ID: ${t.id}</div>
            <div class="meta-val" style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 4px;">Date: ${t.date}</div>
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
              <td>First Month Rent / Booking Amount</td>
              <td style="text-align: right;">₹${rent.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr>
              <td>Refundable Security Deposit</td>
              <td style="text-align: right;">₹${deposit.toLocaleString('en-IN')}.00</td>
            </tr>
          </tbody>
        </table>
        
        <div class="grand-total">
          Total Paid: ₹${total.toLocaleString('en-IN')}.00
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

  const handlePrint = (r) => {
    if (!r) return;
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

  React.useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/owners/${owner.loginId}/revenue-dashboard`);
        if (res && res.success) {
          const paymentsList = (res.recentPayments || []).map(p => ({
            id: p.id,
            desc: `${p.tenant} · ${p.category} (Room ${p.room || 'TBD'})`,
            category: p.category || 'Rent',
            type: 'income',
            amount: p.amount,
            date: p.date,
            method: 'Razorpay',
            security_deposit: p.security_deposit,
            monthly_rent: p.monthly_rent
          }));

          const payoutsList = (res.recentPayouts || []).map(p => ({
            id: p.id,
            desc: p.title || 'Owner Payout Escalation',
            category: 'Payout',
            type: 'expense',
            amount: p.amount,
            date: p.date,
            method: p.method || 'Bank Transfer',
            rawPayout: p
          }));

          // Combine and sort by date descending
          const combined = [...paymentsList, ...payoutsList].sort((a, b) => new Date(b.date) - new Date(a.date));
          setTxns(combined);
        }
      } catch (err) {
        console.error("Failed to load transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, [owner.loginId]);

  const filteredTxns = txns.filter(t => {
    const matchesSearch = String(t.desc || '').toLowerCase().includes(search.toLowerCase()) || String(t.id || '').includes(search);
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Master Transaction Ledger" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Transactions</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Master auditing ledger listing both cash inflows and operational expense outflows.</p>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions by reference ID or description..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "income", "expense"]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`h-10 px-4 rounded-xl text-xs font-bold capitalize transition-colors border ${
                filterType === type 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions list table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="px-6 py-3.5 font-semibold">Txn Reference</th>
                <th className="px-6 py-3.5 font-semibold">Description</th>
                <th className="px-6 py-3.5 font-semibold">Category</th>
                <th className="px-6 py-3.5 font-semibold">Channel</th>
                <th className="px-6 py-3.5 font-semibold">Transaction Date</th>
                <th className="px-6 py-3.5 font-semibold">Amount</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-muted-foreground font-semibold">
                    Loading transactions ledger...
                  </td>
                </tr>
              ) : filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-muted-foreground font-semibold">
                    No transactions recorded on this account.
                  </td>
                </tr>
              ) : (
                filteredTxns.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-foreground">{t.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {t.type === "income" ? (
                          <span className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <ArrowUpRight size={12} />
                          </span>
                        ) : (
                          <span className="size-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                            <ArrowDownRight size={12} />
                          </span>
                        )}
                        <span className="font-semibold text-foreground">{t.desc}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{t.category}</td>
                  <td className="px-6 py-4 text-muted-foreground">{t.method}</td>
                  <td className="px-6 py-4 text-muted-foreground">{t.date}</td>
                  <td className={`px-6 py-4 font-bold ${
                    t.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.category === "Payout" ? (
                      <button 
                        onClick={() => handlePrint(t.rawPayout)} 
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 border border-slate-200 shadow-sm transition-all"
                        title="Print Disbursement Statement"
                      >
                        <Printer size={14} />
                      </button>
                    ) : t.category === "Online Booking" ? (
                      <button 
                        onClick={() => handlePrintOnboarding(t)} 
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 border border-slate-200 shadow-sm transition-all"
                        title="Print Onboarding Receipt"
                      >
                        <Printer size={14} />
                      </button>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}

