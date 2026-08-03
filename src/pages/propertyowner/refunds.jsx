import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { fetchJson } from "../../utils/api";
import { toast } from "react-hot-toast";
import {
  Search, Download, Loader2, AlertCircle, X, Check
} from "lucide-react";

function numberToWords(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (!num) return "Zero";
  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }
  return "Rupees " + convert(num) + " Only";
}

function buildRefundReceiptHtml(r) {
  const isCompleted = r.status === "Completed";
  const refundId = r._id ? `RFD-${String(r._id).slice(-6).toUpperCase()}` : `RFD-${String(r.id || "0000").padStart(4, "0")}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Refund Receipt ${refundId}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;color:#000;background:#fff;font-size:13px}
    .page{max-width:760px;margin:0 auto;padding:40px 44px 36px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #ddd}
    .logo{font-family:Georgia,serif;font-size:42px;font-weight:900;letter-spacing:-2px;color:#000;line-height:1}
    .logo em{font-weight:400;font-style:italic}
    .co{text-align:right;font-size:11.5px;color:#222;line-height:1.65}
    .co strong{display:block;font-size:13.5px;font-weight:700;margin-bottom:3px}
    .title-band{text-align:center;margin:0 0 18px;padding:10px 0;border-top:2px solid #000;border-bottom:2px solid #000}
    .title-band h2{font-size:15px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:#000}
    .details-row{display:flex;gap:16px;margin-bottom:18px}
    .box{flex:1;border:1px solid #d1d5db;border-radius:4px;overflow:hidden}
    .box-head{background:#f5f5f5;padding:8px 14px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#444;border-bottom:1px solid #d1d5db}
    .box-body{padding:10px 14px}
    .field-row{display:flex;justify-content:space-between;align-items:baseline;padding:3.5px 0;font-size:12.5px;gap:8px}
    .field-row .lbl{color:#555;white-space:nowrap}
    .field-row .val{font-weight:600;color:#000;text-align:right}
    .badge-ok{display:inline-block;padding:3px 10px;border:1.5px solid #16a34a;border-radius:3px;font-size:11px;font-weight:800;letter-spacing:.06em;color:#166534;background:#f0fdf4}
    .badge-pending{display:inline-block;padding:3px 10px;border:1.5px solid #d97706;border-radius:3px;font-size:11px;font-weight:800;letter-spacing:.06em;color:#92400e;background:#fffbeb}
    .bill-name{font-size:15px;font-weight:700;margin-bottom:4px}
    table.items{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0}
    table.items thead tr{background:#f5f5f5}
    table.items th{padding:9px 14px;text-align:left;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#555;border:1px solid #d1d5db}
    table.items th.right{text-align:right}
    table.items td{padding:12px 14px;border:1px solid #e8e8e8;vertical-align:top;color:#000}
    table.items td.right{text-align:right;font-weight:600}
    .desc-sub{font-size:11px;color:#666;margin-top:3px}
    .totals-wrap{display:flex;justify-content:flex-end;margin-top:0;margin-bottom:16px;border:1px solid #d1d5db;border-top:none}
    .totals-inner{width:340px;border-left:1px solid #d1d5db}
    .totals-head{background:#f5f5f5;padding:8px 16px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#444;border-bottom:1px solid #d1d5db}
    .t-row{display:flex;justify-content:space-between;padding:5px 16px;font-size:13px}
    .t-row .tv{font-weight:600}
    .t-row.ded .tv{color:#dc2626}
    .t-row.sep{border-top:1.5px solid #000;padding-top:8px;padding-bottom:8px;margin-top:4px}
    .t-row.sep .tk,.t-row.sep .tv{font-size:14px;font-weight:800;color:#16a34a}
    .words{border:1px solid #d1d5db;padding:10px 14px;font-size:12.5px;margin-bottom:16px}
    .terms-head{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#444;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #e5e5e5}
    .terms-list{font-size:11px;color:#444;line-height:1.85;padding-left:2px}
    .terms-list li{list-style:disc;margin-left:14px}
    .terms-list li b{color:#000}
    .end-note{text-align:center;font-size:10.5px;color:#999;margin-top:20px;padding-top:12px;border-top:1px solid #efefef}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:20px}}
  </style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="logo">Room<em>Hy</em></div>
    <div class="co">
      <strong>ROOMHY TECHNOLOGY</strong>
      GSTIN: 08SLWPS2629G1ZZ | PAN: AABCR1234A<br/>
      Sector 7, Civil Lines, Indore, Madhya Pradesh - 452001, India<br/>
      Contact: care@roomhy.com | Web: www.roomhy.com
    </div>
  </div>
  <div class="title-band"><h2>Security Deposit Refund Receipt</h2></div>
  <div class="details-row">
    <div class="box">
      <div class="box-head">Refund Details</div>
      <div class="box-body">
        <div class="field-row"><span class="lbl">Refund ID</span><span class="val">${refundId}</span></div>
        <div class="field-row"><span class="lbl">Settlement Date</span><span class="val">${r.date}</span></div>
        <div class="field-row"><span class="lbl">State Code</span><span class="val">MP (23)</span></div>
        <div class="field-row"><span class="lbl">Status</span><span class="val"><span class="${isCompleted ? "badge-ok" : "badge-pending"}">${isCompleted ? "&#10003; COMPLETED" : "PENDING"}</span></span></div>
      </div>
    </div>
    <div class="box">
      <div class="box-head">Tenant Info</div>
      <div class="box-body">
        <div class="bill-name">${r.name}</div>
        <div class="field-row"><span class="lbl">Room</span><span class="val">Room ${r.room}</span></div>
        ${r.phone ? `<div class="field-row"><span class="lbl">Phone</span><span class="val">${r.phone}</span></div>` : ""}
        ${r.email ? `<div class="field-row"><span class="lbl">Email</span><span class="val">${r.email}</span></div>` : ""}
      </div>
    </div>
  </div>
  <table class="items">
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th>Item &amp; Description</th>
        <th class="right" style="width:160px">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><strong>Security Deposit Held</strong><div class="desc-sub">Original deposit collected at the time of tenant onboarding</div></td>
        <td class="right">&#8377;${r.deposit.toLocaleString("en-IN")}.00</td>
      </tr>
      <tr>
        <td>2</td>
        <td><strong>Total Deductions</strong><div class="desc-sub">Dues, damages, or unpaid balances as per move-out checklist</div></td>
        <td class="right" style="color:#dc2626">(-) &#8377;${r.deductions.toLocaleString("en-IN")}.00</td>
      </tr>
    </tbody>
  </table>
  <div class="totals-wrap">
    <div class="totals-inner">
      <div class="totals-head">Refund Calculation</div>
      <div class="t-row"><span class="tk">Security Deposit</span><span class="tv">&#8377;${r.deposit.toLocaleString("en-IN")}.00</span></div>
      <div class="t-row ded"><span class="tk">Total Deductions</span><span class="tv">(-) &#8377;${r.deductions.toLocaleString("en-IN")}.00</span></div>
      <div class="t-row sep"><span class="tk">Net Refund Payout</span><span class="tv">&#8377;${r.refund.toLocaleString("en-IN")}.00</span></div>
    </div>
  </div>
  <div class="words"><strong>Net Refund In Words:</strong> ${numberToWords(r.refund)}</div>
  <div class="terms-head">Terms &amp; Notes</div>
  <ul class="terms-list">
    <li><b>Refund Timeline:</b> Net refund payout will be processed within 7 working days from the settlement date.</li>
    <li><b>Deductions:</b> All deductions are calculated as per the move-out inspection checklist and tenancy agreement.</li>
    <li><b>Disputes:</b> Any dispute regarding deductions must be raised within 48 hours of receiving this receipt at care@roomhy.com.</li>
    <li><b>T&amp;C:</b> This settlement is in accordance with the Terms and Conditions available at www.roomhy.com/tnc.</li>
  </ul>
  <div class="end-note">This is a computer generated receipt. Signature is not required.</div>
</div>
</body>
</html>`;
}

function mapTenant(t) {
  const deposit = t.securityDepositTotal || 0;
  const deductions = t.moveoutRequest?.duesAtMoveout || 0;
  const refund = t.moveoutRequest?.refundAmount ?? Math.max(0, deposit - deductions);
  const rawStatus = t.moveoutRequest?.status;
  const status = rawStatus === "approved" ? "Completed"
    : rawStatus === "rejected" ? "Rejected"
    : "Pending Approval";
  const dateRaw = t.moveoutRequest?.submittedAt;
  const date = dateRaw
    ? new Date(dateRaw).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  return {
    _id: t._id,
    name: t.name || "—",
    room: t.roomNo || t.roomNumber || "—",
    phone: t.phone || "",
    email: t.email || "",
    deposit,
    deductions,
    refund,
    status,
    date,
  };
}

export default function RefundsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Approve modal state
  const [approveModal, setApproveModal] = useState(null); // { tenant }
  const [duesInput, setDuesInput] = useState("0");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchJson(`/api/tenants/moveout/owner/${encodeURIComponent(owner.loginId)}`);
        const list = Array.isArray(data?.requests) ? data.requests : [];
        setRefunds(list.map(mapTenant));
      } catch (err) {
        setError("Failed to load refund requests. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [owner.loginId]);

  const openApproveModal = (r) => {
    setDuesInput(String(r.deductions || 0));
    setApproveModal(r);
  };

  const handleApproveSubmit = async () => {
    if (!approveModal) return;
    const dues = Number(duesInput) || 0;
    const refundAmt = Math.max(0, approveModal.deposit - dues);
    setApproving(true);
    try {
      await fetchJson("/api/tenants/moveout/approve", {
        method: "POST",
        body: JSON.stringify({
          tenantId: approveModal._id,
          duesAtMoveout: dues,
          refundAmount: refundAmt,
          refundStatus: "cleared",
        }),
      });
      setRefunds(prev =>
        prev.map(r =>
          r._id === approveModal._id
            ? { ...r, status: "Completed", deductions: dues, refund: refundAmt, date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) }
            : r
        )
      );
      toast.success("Refund approved successfully!");
      setApproveModal(null);
    } catch (err) {
      toast.error(err?.message || "Failed to approve refund. Please try again.");
    } finally {
      setApproving(false);
    }
  };

  const handleDownloadReceipt = (r) => {
    const win = window.open("", "_blank", "width=860,height=960");
    win.document.write(buildRefundReceiptHtml(r));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const filteredRefunds = refunds.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    String(r.room).includes(search)
  );

  const duesVal = Number(duesInput) || 0;
  const netRefund = approveModal ? Math.max(0, approveModal.deposit - duesVal) : 0;

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Refund Settlements"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Refund Settlements</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Approve payouts, audit move-out checklists, and clear remaining balances.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search refunds by tenant name or room..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading refund requests...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredRefunds.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm font-semibold">No refund requests found.</p>
          <p className="text-xs mt-1">Move-out requests submitted by tenants will appear here.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filteredRefunds.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                  <th className="px-6 py-3.5 font-semibold">Tenant Name</th>
                  <th className="px-6 py-3.5 font-semibold">Room</th>
                  <th className="px-6 py-3.5 font-semibold">Security Deposit</th>
                  <th className="px-6 py-3.5 font-semibold">Total Deductions</th>
                  <th className="px-6 py-3.5 font-semibold">Net Refund Payout</th>
                  <th className="px-6 py-3.5 font-semibold">Settlement Date</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRefunds.map((r) => (
                  <tr key={r._id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{r.name}</td>
                    <td className="px-6 py-4 font-bold text-foreground">Room {r.room}</td>
                    <td className="px-6 py-4 text-muted-foreground">₹{r.deposit.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-rose-600 font-bold">₹{r.deductions.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">₹{r.refund.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-muted-foreground">{r.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        r.status === "Completed"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : r.status === "Rejected"
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {r.status === "Pending Approval" && (
                        <button
                          onClick={() => openApproveModal(r)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                        >
                          Approve Payout
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadReceipt(r)}
                        title="Print / Save PDF"
                        className="size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setApproveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-[16px] text-slate-900 mb-1">Approve Refund Payout</h3>
            <p className="text-[12px] text-slate-500 mb-5">
              Tenant: <strong className="text-slate-800">{approveModal.name}</strong> · Room {approveModal.room}
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Security Deposit</span>
                <span className="font-bold text-slate-800">₹{approveModal.deposit.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deductions (dues/damages)</span>
                <span className="font-bold text-rose-600">- ₹{duesVal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="font-bold text-slate-700">Net Refund Payout</span>
                <span className="font-black text-emerald-600">₹{netRefund.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight mb-2 block">
                Total Deductions (₹)
              </label>
              <input
                type="number"
                min="0"
                max={approveModal.deposit}
                value={duesInput}
                onChange={e => setDuesInput(e.target.value)}
                className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                placeholder="0"
              />
              <p className="text-[10.5px] text-slate-400 mt-1.5">Enter 0 if no deductions. Net refund is auto-calculated.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setApproveModal(null)}
                className="flex-1 h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveSubmit}
                disabled={approving}
                className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {approving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
                  : <><Check className="w-4 h-4" /> Confirm Approval</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}



