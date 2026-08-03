import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Wallet,
  ArrowUpCircle, ArrowDownCircle, RotateCcw, Plus,
  Download, Eye, Send, FileText, Receipt, LayoutGrid,
  RefreshCw, AlertCircle, Printer, X
} from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function billingLabel(billingMonth) {
  if (!billingMonth) return "—";
  const [yr, mo] = billingMonth.split("-");
  if (!yr || !mo) return billingMonth;
  return new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString("en", { month: "long" }) + " " + yr;
}

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

function buildReceiptHtml(r) {
  const balance     = Math.max(0, r.amount - (r.paid ?? r.amount));
  const isPaid      = balance === 0;
  const paidAmt     = r.paid ?? r.amount;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Receipt ${r.id}</title>
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
    .bill-name{font-size:15px;font-weight:700;margin-bottom:2px}
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
    <h2>Rental Payment Receipt</h2>
  </div>
  <div class="details-row">
    <div class="box">
      <div class="box-head">Invoice Details</div>
      <div class="box-body">
        <div class="field-row"><span class="lbl">Invoice #</span><span class="val">${r.id}</span></div>
        <div class="field-row"><span class="lbl">Invoice Date</span><span class="val">${r.date}</span></div>
        <div class="field-row"><span class="lbl">Due On</span><span class="val">Due on Receipt</span></div>
        <div class="field-row"><span class="lbl">State Code</span><span class="val">MP (23)</span></div>
        <div class="field-row"><span class="lbl">Status</span><span class="val"><span class="${isPaid ? "badge-paid" : "badge-partial"}">${isPaid ? "&#10003; PAID" : "PARTIAL"}</span></span></div>
      </div>
    </div>
    <div class="box">
      <div class="box-head">Bill To</div>
      <div class="box-body">
        <div class="bill-name">${r.tenant}</div>
        <div class="field-row"><span class="lbl">Room</span><span class="val">Room ${r.room}</span></div>
        ${r.phone ? `<div class="field-row"><span class="lbl">Phone</span><span class="val">${r.phone}</span></div>` : ""}
        ${r.email ? `<div class="field-row"><span class="lbl">Email</span><span class="val">${r.email}</span></div>` : ""}
        ${r.address ? `<div class="field-row"><span class="lbl">Address</span><span class="val">${r.address}</span></div>` : ""}
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
          <strong>${r.type || "Rent &amp; Utility"}</strong>
          <div class="desc-sub">Rental Income Charges for this duration (${r.period})</div>
          <div class="desc-sub">SAC: 997211</div>
        </td>
        <td class="center">1</td>
        <td class="right">&#8377;${r.amount.toLocaleString("en-IN")}.00</td>
        <td class="right">&#8377;${r.amount.toLocaleString("en-IN")}.00</td>
      </tr>
    </tbody>
  </table>
  <div class="totals-wrap">
    <div class="totals-inner">
      <div class="totals-head">Payment Breakdown Summary</div>
      <div class="t-row"><span class="tk">Total</span><span class="tv">&#8377;${r.amount.toLocaleString("en-IN")}.00</span></div>
      <div class="t-row"><span class="tk">Payment Made</span><span class="tv">(-) &#8377;${paidAmt.toLocaleString("en-IN")}.00</span></div>
      <div class="t-row sep"><span class="tk">Balance Due</span><span class="tv">&#8377;${balance.toLocaleString("en-IN")}.00</span></div>
    </div>
  </div>
  <div class="words"><strong>Total In Words:</strong> ${numberToWords(r.amount)}</div>
  <div class="terms-head">Terms &amp; Notes</div>
  <ul class="terms-list">
    <li><b>Tenant App:</b> Manage Your Stay and Pay your rent through the Tenant App (Available On Android &amp; iOS)</li>
    <li><b>Late Fee:</b> Delay in rent payment will lead to Rs.100 fine per day.</li>
    <li><b>Support:</b> If you have any issues, you can get in touch with our dedicated care desk at care@roomhy.com.</li>
    <li><b>T&amp;C:</b> Payment of the invoice confirms your agreement with the Terms and Conditions mentioned in the agreement and on www.roomhy.com/tnc.</li>
  </ul>
  <div class="end-note">This is a Computer generated invoice. Signature is not required.</div>
</div>
</body>
</html>`;
}

function ReceiptModal({ receipt, onClose }) {
  const balance = Math.max(0, receipt.amount - (receipt.paid ?? receipt.amount));
  const isPaid  = balance === 0;
  const paidAmt = receipt.paid ?? receipt.amount;

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=860,height=960");
    win.document.write(buildReceiptHtml(receipt));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.52)" }} onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#000" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 rounded-t-xl">
          <span className="font-mono font-bold text-[13px] text-gray-500">{receipt.id}</span>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[11.5px] font-bold transition-colors">
              <Printer size={12} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="size-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="px-10 py-8" style={{ background: "#fff" }}>
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
          <div style={{ textAlign: "center", margin: "0 0 16px", padding: "9px 0", borderTop: "2px solid #000", borderBottom: "2px solid #000" }}>
            <h2 style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: 3.5, textTransform: "uppercase", color: "#000" }}>Rental Payment Receipt</h2>
          </div>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <div style={S.box}>
              <div style={S.boxHead}>Invoice Details</div>
              <div style={{ padding: "10px 14px" }}>
                {[
                  ["Invoice #", receipt.id],
                  ["Invoice Date", receipt.date],
                  ["Due On", "Due on Receipt"],
                  ["State Code", "MP (23)"],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3.5px 0", gap: 8 }}>
                    <span style={S.label}>{lbl}</span>
                    <span style={S.value}>{val}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", gap: 8 }}>
                  <span style={S.label}>Status</span>
                  <span style={{ display: "inline-block", padding: "3px 10px", border: `1.5px solid ${isPaid ? "#16a34a" : "#d97706"}`, borderRadius: 3, fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: isPaid ? "#166534" : "#92400e", background: isPaid ? "#f0fdf4" : "#fffbeb" }}>
                    {isPaid ? "✓ PAID" : "PARTIAL"}
                  </span>
                </div>
              </div>
            </div>
            <div style={S.box}>
              <div style={S.boxHead}>Bill To</div>
              <div style={{ padding: "10px 14px" }}>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{receipt.tenant}</p>
                {[
                  ["Room", `Room ${receipt.room || "N/A"}`],
                  ...(receipt.phone ? [["Phone", receipt.phone]] : []),
                  ...(receipt.email ? [["Email", receipt.email]] : []),
                  ...(receipt.address ? [["Address", receipt.address]] : []),
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", gap: 8 }}>
                    <span style={S.label}>{lbl}</span>
                    <span style={S.value}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 0 }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                {[["#", "left", 34], ["Item & Description", "left", null], ["Qty", "center", 54], ["Rate", "right", 110], ["Amount", "right", 120]].map(([h, align, w]) => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: align, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", border: "1px solid #d1d5db", ...(w ? { width: w } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "12px 14px", border: "1px solid #e8e8e8", color: "#666" }}>1</td>
                <td style={{ padding: "12px 14px", border: "1px solid #e8e8e8" }}>
                  <p style={{ fontWeight: 600 }}>{receipt.type || "Rent & Utility"}</p>
                  <p style={{ fontSize: 11, color: "#666", marginTop: 3 }}>Rental Income Charges for this duration ({receipt.period})</p>
                  <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>SAC: 997211</p>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center", border: "1px solid #e8e8e8" }}>1</td>
                <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>₹{receipt.amount.toLocaleString("en-IN")}.00</td>
                <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>₹{receipt.amount.toLocaleString("en-IN")}.00</td>
              </tr>
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14, border: "1px solid #d1d5db", borderTop: "none" }}>
            <div style={{ width: 320, borderLeft: "1px solid #d1d5db" }}>
              <div style={{ background: "#f5f5f5", padding: "7px 16px", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", borderBottom: "1px solid #d1d5db" }}>
                Payment Breakdown Summary
              </div>
              {[
                ["Total", `₹${receipt.amount.toLocaleString("en-IN")}.00`, false],
                ["Payment Made", `(-) ₹${paidAmt.toLocaleString("en-IN")}.00`, false],
                ["Balance Due", `₹${balance.toLocaleString("en-IN")}.00`, true],
              ].map(([label, val, bold]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: bold ? "8px 16px" : "5px 16px", borderTop: bold ? "1.5px solid #000" : "none", marginTop: bold ? 4 : 0 }}>
                  <span style={{ fontSize: bold ? 14 : 13, fontWeight: bold ? 800 : 400 }}>{label}</span>
                  <span style={{ fontSize: bold ? 14 : 13, fontWeight: bold ? 800 : 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ border: "1px solid #d1d5db", padding: "9px 14px", fontSize: 12.5, marginBottom: 16 }}>
            <strong>Total In Words:</strong> {numberToWords(receipt.amount)}
          </div>
          <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", marginBottom: 6, paddingBottom: 5, borderBottom: "1px solid #e5e5e5" }}>Terms &amp; Notes</p>
          <ul style={{ fontSize: 11, color: "#444", lineHeight: 1.9, paddingLeft: 16 }}>
            <li><strong>Tenant App:</strong> Manage Your Stay and Pay your rent through the Tenant App (Available On Android &amp; iOS)</li>
            <li><strong>Late Fee:</strong> Delay in rent payment will lead to Rs.100 fine per day.</li>
            <li><strong>Support:</strong> If you have any issues, you can get in touch with our dedicated care desk at care@roomhy.com.</li>
            <li><strong>T&amp;C:</strong> Payment of the invoice confirms your agreement with the Terms and Conditions mentioned in the agreement and on www.roomhy.com/tnc.</li>
          </ul>
          <div style={{ textAlign: "center", fontSize: 10.5, color: "#bbb", marginTop: 20, paddingTop: 12, borderTop: "1px solid #efefef" }}>
            This is a Computer generated invoice. Signature is not required.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ total: 0, paidVolume: 0, pendingColl: 0, overdueAlerts: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/revenue/transactions");
      if (res.success) {
        // Prefer the invoiceList from RentInvoice (sequential numbers) if available
        if (res.invoiceList && res.invoiceList.length > 0) {
          setPayments(res.invoiceList.map(inv => ({
            ...inv,
            _source: 'rentinvoice'
          })));
          const total = res.invoiceList.length;
          const paidVolume = res.invoiceList.filter(i => i.status === 'PAID').reduce((a, b) => a + (b.amount || 0), 0);
          const pendingColl = res.invoiceList.filter(i => i.status !== 'PAID').reduce((a, b) => a + (b.amount || 0), 0);
          const overdueAlerts = res.invoiceList.filter(i => i.status === 'PENDING').length;
          setStats({ total, paidVolume, pendingColl, overdueAlerts });
        } else if (res.payments) {
          setPayments(res.payments);
          const total = res.payments.length;
          const paidVolume = res.payments.filter(p => p.payout_status === 'Paid').reduce((a, b) => a + (b.amount || 0), 0);
          const pendingColl = res.payments.filter(p => p.payout_status !== 'Paid').reduce((a, b) => a + (b.amount || 0), 0);
          setStats({ total, paidVolume, pendingColl, overdueAlerts: Math.floor(total * 0.05) });
        }
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const invoices = useMemo(() => payments.map(p => {
    const isRentInvoice = p._source === 'rentinvoice';
    const rawAmt = p.amount || 0;
    const paidAmt = isRentInvoice ? (p.paid || 0) : rawAmt;
    const invStatus = isRentInvoice
      ? (p.status === 'PAID' ? 'Paid' : p.status === 'PARTIAL' ? 'Partial' : p.status === 'PENDING' ? 'Pending' : 'Overdue')
      : (p.payout_status === 'Paid' ? 'Paid' : p.payout_status === 'Pending' ? 'Pending' : 'Overdue');
    const invColor = invStatus === 'Paid' ? 'emerald' : invStatus === 'Pending' ? 'amber' : 'rose';
    const invId = isRentInvoice
      ? (p.invoice_number || String(p.id).slice(-8).toUpperCase())
      : (p.invoice_number || String(p.id).slice(-8).toUpperCase());

    return {
      id: invId,
      customer: (isRentInvoice ? p.tenant_name : p.tenant_name) || "Unknown Tenant",
      amount: rawAmt,
      amountStr: `₹${rawAmt.toLocaleString("en-IN")}`,
      issued: p.date ? new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
      due: "Due on Receipt",
      status: invStatus,
      initial: ((isRentInvoice ? p.tenant_name : p.tenant_name) || "U")[0].toUpperCase(),
      color: invColor,
      // Fields for Receipt modal
      tenant: (isRentInvoice ? p.tenant_name : p.tenant_name) || "Unknown Tenant",
      room: p.room_number || p.room || "N/A",
      phone: isRentInvoice ? (p.tenant_phone || p.phone || "") : (p.phone || ""),
      email: isRentInvoice ? (p.tenant_email || p.email || "") : (p.email || ""),
      address: p.address || "",
      date: p.date ? new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
      period: isRentInvoice ? billingLabel(p.billing_month) : billingLabel(p.date ? String(p.date).substring(0, 7) : ""),
      paid: paidAmt,
      type: "Rent & Utility",
      _raw: p
    };
  }).filter(inv => {
    const q = search.toLowerCase();
    return inv.customer.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q);
  }), [payments, search]);

  const handleDownload = (r) => {
    const win = window.open("", "_blank", "width=860,height=960");
    win.document.write(buildReceiptHtml(r));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Billing Center</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fiscal Documentation & Automated Accounts Receivable Ledger</p>
         </div>
         <div className="flex items-center gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition-all flex items-center gap-2">
               <Plus className="w-3.5 h-3.5" /> Create Invoice
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal label="Total Invoices" value={stats.total} trend="Active" up icon={FileText} color="blue" />
        <StatCardHorizontal label="Paid Volume" value={`₹${(stats.paidVolume || 0).toLocaleString('en-IN')}`} trend="Yield" up icon={CheckCircle2} color="emerald" />
        <StatCardHorizontal label="Pending Coll" value={`₹${(stats.pendingColl || 0).toLocaleString('en-IN')}`} trend="Active Flow" up icon={Receipt} color="amber" />
        <StatCardHorizontal label="Overdue Alerts" value={stats.overdueAlerts} trend="Risk" up={false} icon={AlertCircle} color="rose" />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Billing Registry</h3>
            <div className="flex items-center gap-3">
               <div className="relative group w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
               </div>
               <button onClick={loadInvoices} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
                  <RefreshCw className="w-3.5 h-3.5" />
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                     <th className="pb-4">Document Identity</th>
                     <th className="pb-4">Recipient Profile</th>
                     <th className="pb-4 text-center">Amount (₹)</th>
                     <th className="pb-4 text-center">Lifecycle Dates</th>
                     <th className="pb-4 text-center">Audit Status</th>
                     <th className="pb-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
                  ) : invoices.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-bold">No Invoices Found</td></tr>
                  ) : invoices.map((inv, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setViewing(inv)}>
                       <td className="py-3">
                          <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                             {inv.id}
                          </span>
                       </td>
                       <td className="py-3">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm transition-transform group-hover:scale-105",
                                inv.color === "emerald" ? "bg-emerald-600 shadow-emerald-50" :
                                inv.color === "amber" ? "bg-amber-600 shadow-amber-50" :
                                inv.color === "rose" ? "bg-rose-600 shadow-rose-50" : "bg-slate-600 shadow-slate-50"
                             )}>
                                {inv.initial}
                             </div>
                             <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[150px]">{inv.customer}</p>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Primary Tenant</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-3 text-center">
                          <p className="text-[11px] font-bold text-slate-800 tracking-tight">{inv.amountStr}</p>
                       </td>
                       <td className="py-3 text-center">
                          <p className="text-[10px] font-bold text-slate-700 leading-tight">Issued: {inv.issued}</p>
                          <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">Due: {inv.due}</p>
                       </td>
                       <td className="py-3 text-center">
                          <span className={cn(
                             "text-[7px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm",
                             inv.status === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                             inv.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                             inv.status === "Overdue" ? "bg-rose-50 text-rose-600 border-rose-100" :
                             "bg-slate-50 text-slate-600 border-slate-100"
                          )}>
                             {inv.status}
                          </span>
                       </td>
                       <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                             <button onClick={() => setViewing(inv)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm" title="View"><Eye className="w-3.5 h-3.5" /></button>
                             <button onClick={() => handleDownload(inv)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm" title="Download"><Download className="w-3.5 h-3.5" /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
      {viewing && <ReceiptModal receipt={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100", 
    rose: "bg-rose-50 text-rose-600 border-rose-100" 
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md flex items-start gap-3 group hover:translate-y-[-2px] transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none truncate">{label}</p>
         <p className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-2">{value}</p>
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



