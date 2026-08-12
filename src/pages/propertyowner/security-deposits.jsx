import React, { useEffect, useMemo, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerTenants } from "../../utils/propertyowner";
import { fetchJson } from "../../utils/api";
import { fetchPayments } from "../../utils/rentCollectionApi";
import { ShieldCheck, Search, AlertTriangle, CheckCircle2, Download, Printer, Home } from "lucide-react";

const fmt = (n) => "₹" + (Number(n || 0)).toLocaleString("en-IN");
const OVERRIDES_KEY = "roomhy_security_deposit_overrides";

const makeReceiptId = (tenantId) => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = String(tenantId || "").slice(-4).toUpperCase() || "0000";
  return `RCPT-${stamp}-${suffix}`;
};

function numberToWords(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const n = Math.floor(Number(num || 0));
  if (!n) return "Zero";

  const convert = (value) => {
    if (value < 20) return ones[value];
    if (value < 100) return tens[Math.floor(value / 10)] + (value % 10 ? " " + ones[value % 10] : "");
    if (value < 1000) return ones[Math.floor(value / 100)] + " Hundred" + (value % 100 ? " " + convert(value % 100) : "");
    if (value < 100000) return convert(Math.floor(value / 1000)) + " Thousand" + (value % 1000 ? " " + convert(value % 1000) : "");
    if (value < 10000000) return convert(Math.floor(value / 100000)) + " Lakh" + (value % 100000 ? " " + convert(value % 100000) : "");
    return convert(Math.floor(value / 10000000)) + " Crore" + (value % 10000000 ? " " + convert(value % 10000000) : "");
  };

  return "Rupees " + convert(n) + " Only";
}

function buildDepositReceiptHtml(receipt) {
  const balance = Math.max(0, receipt.balance || 0);
  const isPaid = balance === 0;
  const title = receipt.stage === "complete" ? "Security Deposit Receipt" : "Security Deposit Payment Receipt";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title} ${receipt.receiptId}</title>
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
    .badge-paid{display:inline-block;padding:3px 10px;border:1.5px solid #16a34a;border-radius:3px;font-size:11px;font-weight:800;letter-spacing:.06em;color:#166534;background:#f0fdf4}
    .badge-partial{display:inline-block;padding:3px 10px;border:1.5px solid #d97706;border-radius:3px;font-size:11px;font-weight:800;letter-spacing:.06em;color:#92400e;background:#fffbeb}
    table.items{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0}
    table.items thead tr{background:#f5f5f5}
    table.items th{padding:9px 14px;text-align:left;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#555;border:1px solid #d1d5db}
    table.items th.center{text-align:center}
    table.items th.right{text-align:right}
    table.items td{padding:12px 14px;border:1px solid #e8e8e8;vertical-align:top;color:#000}
    table.items td.center{text-align:center}
    table.items td.right{text-align:right;font-weight:600}
    .desc-sub{font-size:11px;color:#666;margin-top:3px}
    .totals-wrap{display:flex;justify-content:flex-end;margin-top:0;margin-bottom:16px;border:1px solid #d1d5db;border-top:none}
    .totals-inner{width:320px;border-left:1px solid #d1d5db}
    .totals-head{background:#f5f5f5;padding:8px 16px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#444;border-bottom:1px solid #d1d5db}
    .t-row{display:flex;justify-content:space-between;padding:5px 16px;font-size:13px}
    .t-row .tv{font-weight:600}
    .t-row.sep{border-top:1.5px solid #000;padding-top:8px;padding-bottom:8px;margin-top:4px}
    .t-row.sep .tk,.t-row.sep .tv{font-size:14px;font-weight:800}
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

  <div class="title-band">
    <h2>${title}</h2>
  </div>

  <div class="details-row">
    <div class="box">
      <div class="box-head">Receipt Details</div>
      <div class="box-body">
        <div class="field-row"><span class="lbl">Receipt #</span><span class="val">${receipt.receiptId}</span></div>
        <div class="field-row"><span class="lbl">Receipt Date</span><span class="val">${receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span></div>
        <div class="field-row"><span class="lbl">Payment Mode</span><span class="val">${receipt.paymentMode}</span></div>
        <div class="field-row"><span class="lbl">Status</span><span class="val"><span class="${isPaid ? "badge-paid" : "badge-partial"}">${isPaid ? "&#10003; COMPLETE" : "PARTIAL"}</span></span></div>
      </div>
    </div>
    <div class="box">
      <div class="box-head">Tenant</div>
      <div class="box-body">
        <div class="field-row"><span class="lbl">Name</span><span class="val">${receipt.tenantName}</span></div>
        <div class="field-row"><span class="lbl">Room</span><span class="val">Room ${receipt.roomNo}</span></div>
        <div class="field-row"><span class="lbl">Property</span><span class="val">${receipt.propertyName}</span></div>
        <div class="field-row"><span class="lbl">KYC</span><span class="val">${receipt.kycStatus || "pending"}</span></div>
      </div>
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th>Item &amp; Description</th>
        <th class="center" style="width:54px">Qty</th>
        <th class="right" style="width:110px">Rate</th>
        <th class="right" style="width:120px">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>
          <strong>Security Deposit</strong>
          <div class="desc-sub">Confirmation for tenant security deposit collection</div>
          <div class="desc-sub">Agreement status: ${receipt.agreementSigned ? "Signed" : "Pending"}</div>
        </td>
        <td class="center">1</td>
        <td class="right">&#8377;${Number(receipt.addedAmount || 0).toLocaleString("en-IN")}.00</td>
        <td class="right">&#8377;${Number(receipt.addedAmount || 0).toLocaleString("en-IN")}.00</td>
      </tr>
    </tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals-inner">
      <div class="totals-head">Payment Breakdown Summary</div>
      <div class="t-row"><span class="tk">Total Deposit</span><span class="tv">&#8377;${Number(receipt.required || 0).toLocaleString("en-IN")}.00</span></div>
      <div class="t-row"><span class="tk">Collected Now</span><span class="tv">(-) &#8377;${Number(receipt.addedAmount || 0).toLocaleString("en-IN")}.00</span></div>
      <div class="t-row sep"><span class="tk">Balance Due</span><span class="tv">&#8377;${balance.toLocaleString("en-IN")}.00</span></div>
    </div>
  </div>

  <div class="words"><strong>Total In Words:</strong> ${numberToWords(receipt.addedAmount || 0)}</div>

  <div class="terms-head">Terms &amp; Notes</div>
  <ul class="terms-list">
    <li><b>Confirmation:</b> This receipt confirms that the security deposit payment was recorded in the owner panel.</li>
    <li><b>Agreement:</b> Agreement and KYC are linked to this deposit record for onboarding confirmation.</li>
    <li><b>Support:</b> If you have any issues, you can get in touch with our dedicated care desk at care@roomhy.com.</li>
  </ul>

  <div class="end-note">This is a Computer generated receipt. Signature is not required.</div>
</div>
</body>
</html>`;
}

export default function SecurityDepositsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [depositOverrides, setDepositOverrides] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}");
    } catch (_) {
      return {};
    }
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [paymentMode, setPaymentMode] = useState("half");
  const [partialAmount, setPartialAmount] = useState("");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(depositOverrides));
    } catch (_) {}
  }, [depositOverrides]);

  const [moveInCharges, setMoveInCharges] = useState({});

  useEffect(() => {
    fetchOwnerTenants(owner.loginId)
      .then(data => setTenants(Array.isArray(data) ? data : []))
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, [owner.loginId]);

  // Move-in charge is a Rent/RentInvoice-level field (paid once at onboarding), separate
  // from the security-deposit tracking above — sourced from the payments list so this page
  // can show it without duplicating any deposit logic.
  useEffect(() => {
    fetchPayments(owner.loginId, 300)
      .then(data => {
        const map = {};
        (data?.payments || []).forEach(p => {
          const id = String(p.tenantId || "");
          if (id && p.advanceChargeAmount > 0 && !map[id]) {
            map[id] = { amount: p.advanceChargeAmount, paymentDate: p.paymentDate };
          }
        });
        setMoveInCharges(map);
      })
      .catch(() => setMoveInCharges({}));
  }, [owner.loginId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const mergeTenantDepositState = (tenant) => {
    const id = String(tenant._id || tenant.id || tenant.loginId || "");
    const override = depositOverrides[id] || {};
    return {
      ...tenant,
      ...override,
      securityDepositTotal: override.securityDepositTotal ?? tenant.securityDepositTotal ?? tenant.required ?? 0,
      securityDepositPaid: override.securityDepositPaid ?? tenant.securityDepositPaid ?? tenant.paid ?? 0,
      securityDepositBalance: override.securityDepositBalance ?? tenant.securityDepositBalance ?? tenant.balance ?? 0,
      kycStatus: override.kycStatus ?? tenant.kycStatus,
      agreementSigned: override.agreementSigned ?? tenant.agreementSigned,
      agreementStatus: override.agreementStatus ?? tenant.agreementStatus,
      digitalCheckin: override.digitalCheckin ?? tenant.digitalCheckin
    };
  };

  const deposits = useMemo(() => {
    return tenants
      .filter(t => !t.checkoutDate)
      .map(t => {
        const merged = mergeTenantDepositState(t);
        const required = Number(merged.securityDepositTotal || 0);
        const paid = Number(merged.securityDepositPaid || 0);
        const balance = Number(merged.securityDepositBalance ?? Math.max(0, required - paid));
        const stage = required === 0 ? "none" : paid <= 0 ? "none" : paid >= required ? "complete" : "partial";

        return {
          ...merged,
          _id: merged._id || merged.id,
          name: merged.name || "—",
          roomNo: merged.roomNo || merged.room || "—",
          required,
          paid,
          balance,
          stage,
          joinDate: merged.joinDate || merged.checkInDate || merged.createdAt || "",
          phone: merged.phone || "",
          email: merged.email || "",
          moveInCharge: moveInCharges[String(merged._id || merged.id || "")] || null
        };
      });
  }, [tenants, depositOverrides, moveInCharges]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return deposits;
    return deposits.filter(d =>
      d.name.toLowerCase().includes(q) ||
      String(d.roomNo).toLowerCase().includes(q)
    );
  }, [deposits, debouncedSearch]);

  const totalHeld = deposits.reduce((sum, d) => sum + Number(d.paid || 0), 0);
  const totalPending = deposits.reduce((sum, d) => sum + Number(d.balance || 0), 0);

  const openPaymentModal = (tenant) => {
    setSelectedTenant(tenant);
    setPaymentMode(tenant.paid > 0 && tenant.paid < tenant.required ? "full" : "half");
    setPartialAmount("");
    setPaymentModalOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedTenant) return;

    const tenantId = String(selectedTenant._id || selectedTenant.id || selectedTenant.loginId || "");
    if (!tenantId) return;

    const required = Number(selectedTenant.required || 0);
    const existingPaid = Number(selectedTenant.paid || 0);
    const remaining = Math.max(0, required - existingPaid);

    let addedAmount = 0;
    if (paymentMode === "half") {
      addedAmount = required > 0 ? Math.max(1, Math.round(required / 2)) : 0;
    } else if (paymentMode === "partial") {
      const entered = Number(partialAmount || 0);
      addedAmount = Math.max(0, Math.min(remaining || required, entered));
    } else {
      addedAmount = remaining || required;
    }

    const nextPaid = required > 0 ? Math.min(required, existingPaid + addedAmount) : existingPaid + addedAmount;
    const nextBalance = Math.max(0, required - nextPaid);
    const nextStage = nextPaid >= required ? "complete" : nextPaid > 0 ? "partial" : "none";

    const updated = {
      securityDepositTotal: required,
      securityDepositPaid: nextPaid,
      securityDepositBalance: nextBalance,
      agreementSigned: true,
      agreementStatus: "signed"
    };

    setDepositOverrides(prev => ({
      ...prev,
      [tenantId]: {
        ...(prev[tenantId] || {}),
        ...updated
      }
    }));

    const receiptData = {
      receiptId: makeReceiptId(tenantId),
      tenantId,
      tenantName: selectedTenant.name,
      roomNo: selectedTenant.roomNo,
      propertyName: selectedTenant.propertyTitle || selectedTenant.property?.title || "Property",
      required,
      previousPaid: existingPaid,
      paidNow: nextPaid,
      addedAmount,
      balance: nextBalance,
      paymentMode,
      stage: nextStage,
      kycStatus: selectedTenant.kycStatus,
      agreementSigned: true,
      issuedAt: new Date().toISOString()
    };

    setPaymentModalOpen(false);
    setReceipt(receiptData);
    setReceiptModalOpen(true);

    try {
      await fetchJson(`/api/tenants/${encodeURIComponent(tenantId)}`, {
        method: "PATCH",
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn("Could not persist deposit update, keeping local confirmation:", err?.message);
    }
  };

  const viewReceipt = (d) => {
    setReceipt({
      receiptId: makeReceiptId(d._id),
      tenantId: d._id,
      tenantName: d.name,
      roomNo: d.roomNo,
      propertyName: d.propertyTitle || d.property?.title || "Property",
      required: d.required,
      previousPaid: 0,
      paidNow: d.paid,
      addedAmount: d.paid,
      balance: d.balance,
      paymentMode: "full",
      stage: d.stage,
      kycStatus: d.kycStatus,
      agreementSigned: d.agreementSigned,
      issuedAt: new Date().toISOString()
    });
    setReceiptModalOpen(true);
  };

  const openReceiptWindow = (receiptData) => {
    const win = window.open("", "_blank", "width=860,height=960");
    if (!win) return;
    win.document.write(buildDepositReceiptHtml(receiptData));
    win.document.close();
    win.focus();
    return win;
  };

  const handleDownloadReceipt = () => {
    if (!receipt) return;
    const win = openReceiptWindow(receipt);
    if (win) {
      setTimeout(() => win.print(), 400);
    }
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Security Deposits"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Security Deposits</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Manage tenant security deposits, partial allocations, and trust balances.</p>
        </div>
      </div>

      {/* Stats — Desktop 3-col grid */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Total Held</span>
            <ShieldCheck className="size-4 text-emerald-500" />
          </div>
          <div className="font-serif text-[28px] leading-none text-foreground">{fmt(totalHeld)}</div>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-rose-600 uppercase tracking-wider">Pending Collection</span>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>
          <div className="font-serif text-[28px] leading-none text-rose-600">{fmt(totalPending)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Active Tenants</span>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </div>
          <div className="font-serif text-[28px] leading-none text-foreground">{deposits.length}</div>
        </div>
      </div>

      {/* Mobile Stat Strip */}
      <div className="flex overflow-x-auto gap-3 pb-2 mb-5 md:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {[
          { title: "Total Held",   value: fmt(totalHeld),    subtext: "Deposits held",   icon: ShieldCheck,  bg: "bg-emerald-50", ic: "text-emerald-600" },
          { title: "Pending",      value: fmt(totalPending), subtext: "Still owed",      icon: AlertTriangle,bg: "bg-rose-50",    ic: "text-rose-600" },
          { title: "Tenants",      value: deposits.length,   subtext: "Active",          icon: CheckCircle2, bg: "bg-blue-50",    ic: "text-blue-600" },
        ].map(({ title, value, subtext, icon: Icon, bg, ic }) => (
          <div key={title} className="shrink-0 w-[130px] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${ic}`} />
              </div>
            </div>
            <div>
              <h3 className="text-[18px] font-black text-slate-900 leading-tight">{value}</h3>
              <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{title}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-1">{subtext}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tenant name or room..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="px-6 py-3.5 font-semibold">Tenant</th>
                <th className="px-6 py-3.5 font-semibold">Room</th>
                <th className="px-6 py-3.5 font-semibold">Required</th>
                <th className="px-6 py-3.5 font-semibold">Paid</th>
                <th className="px-6 py-3.5 font-semibold">Balance Due</th>
                <th className="px-6 py-3.5 font-semibold">Join Date</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <ShieldCheck className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground">No deposit records found.</p>
                  </td>
                </tr>
              ) : filtered.map((d) => {
                const paidPct = d.required > 0 ? Math.min(100, Math.round((d.paid / d.required) * 100)) : 0;
                const canRecordPayment = d.required > 0;
                return (
                  <tr key={d._id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{d.name}</div>
                      {d.phone && <div className="text-[11.5px] text-muted-foreground">{d.phone}</div>}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">Room {d.roomNo}</td>
                    <td className="px-6 py-4 text-muted-foreground">{d.required > 0 ? fmt(d.required) : <span className="italic text-muted-foreground/60">Not set</span>}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-emerald-600">{fmt(d.moveInCharge ? d.moveInCharge.amount : d.paid)}</div>
                      <div className="text-[11px] text-muted-foreground">{d.moveInCharge ? "Move-in charge paid" : `${paidPct}% of deposit`}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-rose-600">{d.balance > 0 ? fmt(d.balance) : <span className="text-emerald-600">—</span>}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {d.joinDate ? new Date(d.joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex w-fit px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${d.required === 0 ? "bg-muted text-muted-foreground border-border" : d.balance > 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                          {d.required === 0 ? "N/A" : d.balance > 0 ? "Pending" : "Paid"}
                        </span>
                        <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full border text-[10.5px] ${d.moveInCharge ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-muted text-muted-foreground border-border"}`}>
                          <Home className="size-3" /> {d.moveInCharge ? `Move-in ₹${d.moveInCharge.amount.toLocaleString("en-IN")} paid` : "Move-in not paid"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!canRecordPayment ? (
                        <button
                          disabled
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-foreground text-background opacity-40 cursor-not-allowed"
                        >
                          Pending
                        </button>
                      ) : d.balance > 0 ? (
                        <button
                          onClick={() => openPaymentModal(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-rose-600 text-white hover:opacity-90 transition-colors"
                        >
                          Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => viewReceipt(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-600 text-white hover:opacity-90 transition-colors"
                        >
                          Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-border bg-muted/30 flex justify-between items-center">
            <span className="text-[12px] text-muted-foreground">{filtered.length} tenant{filtered.length !== 1 ? "s" : ""}</span>
            <span className="text-[12px] font-semibold text-foreground">Total held: {fmt(totalHeld)}</span>
          </div>
        )}
      </div>

      {paymentModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border">
            <div className="p-5 border-b border-border">
              <h3 className="text-[20px] font-bold text-foreground">Record Deposit Payment</h3>
              <p className="text-[13px] text-muted-foreground mt-1">
                Choose half, partial, or full payment and generate a confirmation receipt.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="font-semibold text-foreground">{selectedTenant.name}</div>
                <div className="text-[12px] text-muted-foreground">Room {selectedTenant.roomNo}</div>
                <div className="text-[12px] text-muted-foreground mt-1">
                  Required: {fmt(selectedTenant.required)} | Already paid: {fmt(selectedTenant.paid)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode("half")}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${paymentMode === "half" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}
                >
                  Half
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("partial")}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${paymentMode === "partial" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}
                >
                  Partial
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("full")}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${paymentMode === "full" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}
                >
                  Full
                </button>
              </div>

              {paymentMode === "partial" && (
                <div>
                  <label className="block text-[12px] font-semibold text-muted-foreground mb-2">Partial amount</label>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, Number(selectedTenant.required || 0))}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-border bg-card text-foreground font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPayment}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background font-semibold hover:opacity-90"
              >
                Confirm & Generate Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptModalOpen && receipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-bold text-foreground">Deposit Receipt</h3>
                <p className="text-[13px] text-muted-foreground mt-1">Confirmation for security deposit collection</p>
              </div>
              <button onClick={() => setReceiptModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Receipt ID</div>
                  <div className="font-semibold text-foreground mt-1">{receipt.receiptId}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Issued</div>
                  <div className="font-semibold text-foreground mt-1">{new Date(receipt.issuedAt).toLocaleString("en-IN")}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Tenant</div>
                  <div className="font-semibold text-foreground mt-1">{receipt.tenantName}</div>
                  <div className="text-muted-foreground text-[12px]">Room {receipt.roomNo}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Payment Type</div>
                  <div className="font-semibold text-foreground mt-1 capitalize">{receipt.paymentMode}</div>
                  <div className="text-muted-foreground text-[12px]">Stage: {receipt.stage}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Amount Collected</div>
                  <div className="font-semibold text-emerald-600 mt-1">{fmt(receipt.addedAmount)}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wider">Balance Remaining</div>
                  <div className="font-semibold text-rose-600 mt-1">{fmt(receipt.balance)}</div>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-[13px] text-emerald-700">
                This receipt confirms that the security deposit payment has been recorded for the tenant.
              </div>
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDownloadReceipt}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground font-semibold"
              >
                <Download size={14} /> Download Receipt
              </button>
              <button
                type="button"
                onClick={() => {
                  const win = openReceiptWindow(receipt);
                  if (win) setTimeout(() => win.print(), 400);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground font-semibold"
              >
                <Printer size={14} /> Print
              </button>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-foreground text-background font-semibold hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}



