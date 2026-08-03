import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { fetchOwnerTenants } from "../../utils/propertyowner";
import {
  Search, Phone, Mail, FileText, Eye, X, Printer, Download
} from "lucide-react";

function calcDuration(moveIn, checkout) {
  if (!moveIn) return "—";
  const start = new Date(moveIn);
  const end = checkout ? new Date(checkout) : new Date();
  const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return `${diffDays} Days`;
  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths} Month${diffMonths > 1 ? "s" : ""}`;
}

function fmtDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getRefundStatusLabel(status) {
  if (status === "cleared") return "Fully Refunded";
  if (status === "deductions_applied") return "Deductions Applied";
  if (status === "pending") return "Pending Refund";
  return "Cleared";
}

// ── Printable HTML builder ───────────────────────────────────────────────────
function buildExTenantHtml(t) {
  const mr = t.moveoutRequest || {};
  const deposit = t.securityDepositPaid || 0;
  const dues = mr.duesAtMoveout || 0;
  const refund = mr.refundAmount || 0;
  const refundLabel = getRefundStatusLabel(mr.refundStatus);
  const moveInDate = fmtDate(t.moveInDate);
  const checkoutDate = fmtDate(mr.requestedDate || t.updatedAt);
  const duration = calcDuration(t.moveInDate, mr.requestedDate || t.updatedAt);
  const roomNo = t.roomNo || t.room?.number || "N/A";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Exit Clearance - ${t.name}</title>
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
    .bill-name{font-size:15px;font-weight:700;margin-bottom:4px}
    table.items{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0}
    table.items thead tr{background:#f5f5f5}
    table.items th{padding:9px 14px;text-align:left;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#555;border:1px solid #d1d5db}
    table.items th.right{text-align:right}
    table.items td{padding:12px 14px;border:1px solid #e8e8e8;vertical-align:top;color:#000}
    table.items td.right{text-align:right;font-weight:600}
    .desc-sub{font-size:11px;color:#666;margin-top:3px}
    .totals-wrap{display:flex;justify-content:flex-end;margin-top:0;margin-bottom:16px;border:1px solid #d1d5db;border-top:none}
    .totals-inner{width:320px;border-left:1px solid #d1d5db}
    .totals-head{background:#f5f5f5;padding:8px 16px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#444;border-bottom:1px solid #d1d5db}
    .t-row{display:flex;justify-content:space-between;padding:5px 16px;font-size:13px}
    .t-row .tv{font-weight:600}
    .t-row.sep{border-top:1.5px solid #000;padding-top:8px;padding-bottom:8px;margin-top:4px}
    .t-row.sep .tk,.t-row.sep .tv{font-size:14px;font-weight:800}
    .reason-box{border:1px solid #d1d5db;padding:10px 14px;font-size:12px;color:#444;margin-bottom:16px;line-height:1.7;font-style:italic}
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
    <h2>Tenant Exit Invoice</h2>
  </div>

  <div class="details-row">
    <div class="box">
      <div class="box-head">Checkout Details</div>
      <div class="box-body">
        <div class="field-row"><span class="lbl">Login ID</span><span class="val">${t.loginId || "—"}</span></div>
        <div class="field-row"><span class="lbl">Move-in Date</span><span class="val">${moveInDate}</span></div>
        <div class="field-row"><span class="lbl">Checkout Date</span><span class="val">${checkoutDate}</span></div>
        <div class="field-row"><span class="lbl">Total Stay</span><span class="val">${duration}</span></div>
        <div class="field-row"><span class="lbl">Refund Status</span><span class="val">${refundLabel}</span></div>
      </div>
    </div>
    <div class="box">
      <div class="box-head">Former Tenant Details</div>
      <div class="box-body">
        <div class="bill-name">${t.name || "—"}</div>
        <div class="field-row"><span class="lbl">Room</span><span class="val">Room ${roomNo}</span></div>
        ${t.phone ? `<div class="field-row"><span class="lbl">Phone</span><span class="val">${t.phone}</span></div>` : ""}
        ${t.email ? `<div class="field-row"><span class="lbl">Email</span><span class="val">${t.email}</span></div>` : ""}
        ${t.propertyTitle ? `<div class="field-row"><span class="lbl">Property</span><span class="val">${t.propertyTitle}</span></div>` : ""}
      </div>
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th>Item &amp; Description</th>
        <th class="right" style="width:160px">Amount (INR)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>
          <strong>Security Deposit Held</strong>
          <div class="desc-sub">Total security deposit collected at the time of move-in</div>
        </td>
        <td class="right">&#8377;${deposit.toLocaleString("en-IN")}.00</td>
      </tr>
      <tr>
        <td>2</td>
        <td>
          <strong>Outstanding Dues Deducted</strong>
          <div class="desc-sub">Pending rent, damages, or other charges as on checkout date</div>
        </td>
        <td class="right">(-) &#8377;${dues.toLocaleString("en-IN")}.00</td>
      </tr>
      <tr>
        <td>3</td>
        <td>
          <strong>Net Refund to Former Tenant</strong>
          <div class="desc-sub">Security deposit minus outstanding dues returned to tenant</div>
        </td>
        <td class="right">&#8377;${refund.toLocaleString("en-IN")}.00</td>
      </tr>
    </tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals-inner">
      <div class="totals-head">Settlement Summary</div>
      <div class="t-row"><span class="tk">Security Deposit</span><span class="tv">&#8377;${deposit.toLocaleString("en-IN")}.00</span></div>
      <div class="t-row"><span class="tk">Dues Deducted</span><span class="tv">(-) &#8377;${dues.toLocaleString("en-IN")}.00</span></div>
      <div class="t-row sep"><span class="tk">Refund Paid</span><span class="tv">&#8377;${refund.toLocaleString("en-IN")}.00</span></div>
    </div>
  </div>

  ${mr.reason ? `<div class="reason-box"><strong style="font-style:normal">Reason for Moving Out:</strong> "${mr.reason}"</div>` : ""}

  <div class="terms-head">Terms &amp; Notes</div>
  <ul class="terms-list">
    <li><b>This document</b> serves as the final exit clearance certificate confirming checkout and deposit settlement.</li>
    <li><b>Disputes:</b> Any disputes related to deposit deductions must be raised within 7 days of checkout at care@roomhy.com.</li>
    <li><b>KYC:</b> Tenant KYC documents are archived as per regulatory requirements for a period of 3 years.</li>
    <li><b>T&amp;C:</b> Issuance of this certificate confirms closure of the tenancy in accordance with www.roomhy.com/tnc.</li>
  </ul>

  <div class="end-note">This is a Computer generated document. Signature is not required.</div>
</div>
</body>
</html>`;
}

// ── Exit Clearance Modal ─────────────────────────────────────────────────────
function ExTenantModal({ tenant, onClose }) {
  const t = tenant;
  const mr = t.moveoutRequest || {};
  const deposit = t.securityDepositPaid || 0;
  const dues = mr.duesAtMoveout || 0;
  const refund = mr.refundAmount || 0;
  const refundLabel = getRefundStatusLabel(mr.refundStatus);
  const moveInDate = fmtDate(t.moveInDate);
  const checkoutDate = fmtDate(mr.requestedDate || t.updatedAt);
  const duration = calcDuration(t.moveInDate, mr.requestedDate || t.updatedAt);
  const roomNo = t.roomNo || t.room?.number || "N/A";

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=860,height=960");
    win.document.write(buildExTenantHtml(t));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const S = {
    label: { fontSize: 11, color: "#555", whiteSpace: "nowrap" },
    value: { fontSize: 12.5, fontWeight: 600, color: "#000", textAlign: "right" },
    boxHead: { background: "#f5f5f5", padding: "8px 14px", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444", borderBottom: "1px solid #d1d5db" },
    box: { border: "1px solid #d1d5db", borderRadius: 4, overflow: "hidden", flex: 1 },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.52)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto"
        style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#000" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 rounded-t-xl">
          <span className="font-mono font-bold text-[13px] text-gray-500">Exit Clearance · {t.loginId}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[11.5px] font-bold transition-colors"
            >
              <Printer size={12} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="size-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="px-10 py-8" style={{ background: "#fff" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #ddd" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 900, letterSpacing: -2, lineHeight: 1, color: "#000" }}>
              Room<span style={{ fontWeight: 400, fontStyle: "italic" }}>Hy</span>
            </div>
            <div style={{ textAlign: "right", fontSize: 11.5, color: "#222", lineHeight: 1.65 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 3 }}>ROOMHY TECHNOLOGY</p>
              <p>GSTIN: 08SLWPS2629G1ZZ | PAN: AABCR1234A</p>
              <p>Sector 7, Civil Lines, Indore, Madhya Pradesh - 452001, India</p>
              <p>Contact: care@roomhy.com | Web: www.roomhy.com</p>
            </div>
          </div>

          {/* Title band */}
          <div style={{ textAlign: "center", margin: "0 0 16px", padding: "9px 0", borderTop: "2px solid #000", borderBottom: "2px solid #000" }}>
            <h2 style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: 3.5, textTransform: "uppercase", color: "#000" }}>
              Tenant Exit Clearance Certificate
            </h2>
          </div>

          {/* Checkout Details + Tenant Details */}
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <div style={S.box}>
              <div style={S.boxHead}>Checkout Details</div>
              <div style={{ padding: "10px 14px" }}>
                {[
                  ["Login ID", t.loginId || "—"],
                  ["Move-in Date", moveInDate],
                  ["Checkout Date", checkoutDate],
                  ["Total Stay", duration],
                  ["Refund Status", refundLabel],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3.5px 0", gap: 8 }}>
                    <span style={S.label}>{lbl}</span>
                    <span style={S.value}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={S.box}>
              <div style={S.boxHead}>Former Tenant Details</div>
              <div style={{ padding: "10px 14px" }}>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{t.name || "—"}</p>
                {[
                  ["Room", `Room ${roomNo}`],
                  ...(t.phone ? [["Phone", t.phone]] : []),
                  ...(t.email ? [["Email", t.email]] : []),
                  ...(t.propertyTitle ? [["Property", t.propertyTitle]] : []),
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", gap: 8 }}>
                    <span style={S.label}>{lbl}</span>
                    <span style={S.value}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Items table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 0 }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                {[["#", "left", 36], ["Item & Description", "left", null], ["Amount (INR)", "right", 160]].map(([h, align, w]) => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: align, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", border: "1px solid #d1d5db", ...(w ? { width: w } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["1", "Security Deposit Held",       "Total security deposit collected at the time of move-in",              `₹${deposit.toLocaleString("en-IN")}.00`],
                ["2", "Outstanding Dues Deducted",   "Pending rent, damages, or other charges as on checkout date",          `(-) ₹${dues.toLocaleString("en-IN")}.00`],
                ["3", "Net Refund to Former Tenant", "Security deposit minus outstanding dues returned to tenant",           `₹${refund.toLocaleString("en-IN")}.00`],
              ].map(([num, title, sub, amt]) => (
                <tr key={num}>
                  <td style={{ padding: "12px 14px", border: "1px solid #e8e8e8", color: "#666" }}>{num}</td>
                  <td style={{ padding: "12px 14px", border: "1px solid #e8e8e8" }}>
                    <p style={{ fontWeight: 600 }}>{title}</p>
                    <p style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{sub}</p>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>{amt}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Settlement Summary */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14, border: "1px solid #d1d5db", borderTop: "none" }}>
            <div style={{ width: 320, borderLeft: "1px solid #d1d5db" }}>
              <div style={{ background: "#f5f5f5", padding: "7px 16px", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", borderBottom: "1px solid #d1d5db" }}>
                Settlement Summary
              </div>
              {[
                ["Security Deposit", `₹${deposit.toLocaleString("en-IN")}.00`, false],
                ["Dues Deducted",    `(-) ₹${dues.toLocaleString("en-IN")}.00`, false],
                ["Refund Paid",      `₹${refund.toLocaleString("en-IN")}.00`, true],
              ].map(([label, val, bold]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: bold ? "8px 16px" : "5px 16px", borderTop: bold ? "1.5px solid #000" : "none", marginTop: bold ? 4 : 0 }}>
                  <span style={{ fontSize: bold ? 14 : 13, fontWeight: bold ? 800 : 400 }}>{label}</span>
                  <span style={{ fontSize: bold ? 14 : 13, fontWeight: bold ? 800 : 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reason for moving out */}
          {mr.reason && (
            <div style={{ border: "1px solid #d1d5db", padding: "9px 14px", fontSize: 12, color: "#444", marginBottom: 16, lineHeight: 1.7, fontStyle: "italic" }}>
              <strong style={{ fontStyle: "normal" }}>Reason for Moving Out:</strong> &ldquo;{mr.reason}&rdquo;
            </div>
          )}

          {/* Terms & Notes */}
          <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 6, paddingBottom: 5, borderBottom: "1px solid #e5e5e5" }}>
            Terms &amp; Notes
          </p>
          <ul style={{ fontSize: 11, color: "#444", lineHeight: 1.9, paddingLeft: 16 }}>
            <li><strong>This document</strong> serves as the final exit clearance certificate confirming checkout and deposit settlement.</li>
            <li><strong>Disputes:</strong> Any disputes related to deposit deductions must be raised within 7 days of checkout at care@roomhy.com.</li>
            <li><strong>KYC:</strong> Tenant KYC documents are archived as per regulatory requirements for a period of 3 years.</li>
            <li><strong>T&amp;C:</strong> Issuance of this certificate confirms closure of the tenancy in accordance with www.roomhy.com/tnc.</li>
          </ul>

          <div style={{ textAlign: "center", fontSize: 10.5, color: "#bbb", marginTop: 20, paddingTop: 12, borderTop: "1px solid #efefef" }}>
            This is a Computer generated document. Signature is not required.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ExTenantsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [search, setSearch]     = useState("");
  const [tenants, setTenants]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [viewing, setViewing]   = useState(null);

  useEffect(() => {
    let active = true;
    const fetchExTenants = async () => {
      try {
        setLoading(true);
        const all = await fetchOwnerTenants(owner.loginId);
        if (active) setTenants((all || []).filter(t => t.status === "inactive"));
      } catch (err) {
        console.error("Error fetching ex-tenants:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchExTenants();
    return () => { active = false; };
  }, [owner.loginId]);

  const filtered = tenants.filter(t =>
    (t.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (t.roomNo || t.room?.number || "").includes(search) ||
    (t.loginId || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (t) => {
    const win = window.open("", "_blank", "width=860,height=960");
    win.document.write(buildExTenantHtml(t));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Former Residents"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Former Residents</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Historical records, previous security deposit refunds, and ledger archives of checked-out tenants.
          </p>
        </div>
        {!loading && (
          <div className="flex gap-2 flex-wrap shrink-0 md:mt-2">
            <span className="text-[11px] bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-3 py-1 font-semibold">
              {tenants.length} Ex-Tenants
            </span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tenant name, login ID, or room..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading former residents...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No former residents found.</div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                  <th className="px-6 py-3.5 font-semibold">Tenant Name</th>
                  <th className="px-6 py-3.5 font-semibold">Stayed Room</th>
                  <th className="px-6 py-3.5 font-semibold">Stay Duration</th>
                  <th className="px-6 py-3.5 font-semibold">Checkout Date</th>
                  <th className="px-6 py-3.5 font-semibold">Contact Details</th>
                  <th className="px-6 py-3.5 font-semibold">Security Clearance</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => {
                  const mr = t.moveoutRequest || {};
                  const duration = calcDuration(t.moveInDate, mr.requestedDate || t.updatedAt);
                  const checkoutDate = fmtDate(mr.requestedDate || t.updatedAt);
                  const refundLabel = getRefundStatusLabel(mr.refundStatus);

                  return (
                    <tr key={t._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0">
                            {(t.name || "T").charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">{t.name}</span>
                            <div className="text-[11px] text-muted-foreground font-mono">{t.loginId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">Room {t.roomNo || t.room?.number || "N/A"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{duration}</td>
                      <td className="px-6 py-4 text-muted-foreground">{checkoutDate}</td>
                      <td className="px-6 py-4 space-y-0.5">
                        <div className="text-[12px] font-medium text-foreground flex items-center gap-1">
                          <Phone size={12} className="text-muted-foreground/60" /> {t.phone}
                        </div>
                        {t.email && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Mail size={12} className="text-muted-foreground/60" /> {t.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          refundLabel === "Fully Refunded"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : refundLabel === "Pending Refund"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : "bg-slate-50 text-slate-600 border-slate-100"
                        }`}>
                          {refundLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setViewing(t)}
                          title="View exit clearance"
                          className="size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex items-center justify-center transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDownload(t)}
                          title="Print / Save PDF"
                          className="size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex items-center justify-center transition-colors"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {viewing && (
        <ExTenantModal
          tenant={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </PropertyOwnerLayout>
  );
}



