import React from "react";
import { X, Printer } from "lucide-react";

export function numberToWords(num) {
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

export function buildReceiptHtml(r) {
  const originalRent = r.amount || 0;
  const penalty = r.penalty || 0;
  const electricity = r.electricity || 0;
  const totalDue = originalRent + penalty + electricity;
  const paidAmt = (r.paid && r.paid > 0) ? r.paid : totalDue;
  const balance = Math.max(0, totalDue - paidAmt);
  // Use actual DB invoice status when available; fall back to balance-based check
  const isPaid = ['PAID', 'WAIVED'].includes(String(r.invoiceStatus || '').toUpperCase()) || balance === 0;

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
  <div class="title-band"><h2>Rental Payment Receipt</h2></div>
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
          <strong>Original Rent</strong>
          <div class="desc-sub">Agreed rent for this duration (${r.period})</div>
          <div class="desc-sub">SAC: 997211</div>
        </td>
        <td class="center">1</td>
        <td class="right">&#8377;${originalRent.toLocaleString("en-IN")}.00</td>
        <td class="right">&#8377;${originalRent.toLocaleString("en-IN")}.00</td>
      </tr>
      ${penalty > 0 ? `<tr>
        <td>2</td>
        <td>
          <strong>Late Penalty</strong>
          <div class="desc-sub">Accumulated penalty for delayed payment</div>
        </td>
        <td class="center">1</td>
        <td class="right" style="color:#dc2626">&#8377;${penalty.toLocaleString("en-IN")}.00</td>
        <td class="right" style="color:#dc2626">&#8377;${penalty.toLocaleString("en-IN")}.00</td>
      </tr>` : ""}
      ${electricity > 0 ? `<tr>
        <td>${penalty > 0 ? "3" : "2"}</td>
        <td>
          <strong>Electricity Bill</strong>
          <div class="desc-sub">Electricity charges for this period</div>
        </td>
        <td class="center">1</td>
        <td class="right">&#8377;${electricity.toLocaleString("en-IN")}.00</td>
        <td class="right">&#8377;${electricity.toLocaleString("en-IN")}.00</td>
      </tr>` : ""}
    </tbody>
  </table>
  <div class="totals-wrap">
    <div class="totals-inner">
      <div class="totals-head">Payment Breakdown Summary</div>
      <div class="t-row"><span class="tk">Original Rent</span><span class="tv">&#8377;${originalRent.toLocaleString("en-IN")}.00</span></div>
      ${penalty > 0 ? `<div class="t-row"><span class="tk">Late Penalty</span><span class="tv" style="color:#dc2626">&#8377;${penalty.toLocaleString("en-IN")}.00</span></div>` : ""}
      ${electricity > 0 ? `<div class="t-row"><span class="tk">Electricity Bill</span><span class="tv">&#8377;${electricity.toLocaleString("en-IN")}.00</span></div>` : ""}
      <div class="t-row" style="border-top:1px dashed #ccc;margin-top:4px;padding-top:6px"><span class="tk" style="font-weight:700">Total Rent Due</span><span class="tv" style="font-weight:700">&#8377;${totalDue.toLocaleString("en-IN")}.00</span></div>
      <div class="t-row"><span class="tk">Total Rent Paid</span><span class="tv" style="color:#16a34a">(-) &#8377;${paidAmt.toLocaleString("en-IN")}.00</span></div>
      <div class="t-row sep"><span class="tk">Balance Remaining</span><span class="tv">&#8377;${balance.toLocaleString("en-IN")}.00</span></div>
    </div>
  </div>
  <div class="words"><strong>Amount Due In Words:</strong> ${numberToWords(totalDue)}</div>
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

export function RentReceiptModal({ receipt, onClose }) {
  const originalRent = receipt.amount || 0;
  const penalty = receipt.penalty || 0;
  const electricity = receipt.electricity || 0;
  // Always compute fresh from components — receipt.totalDue may be stale (saved before electricity was added)
  const totalDue = (originalRent + penalty + electricity) || receipt.totalDue || 0;
  const paidAmt = receipt.paid ?? originalRent;
  const balance = Math.max(0, totalDue - paidAmt);
  // Use actual DB invoice status when available; fall back to balance-based check
  const isPaid = ['PAID', 'WAIVED'].includes(String(receipt.invoiceStatus || '').toUpperCase()) || balance === 0;

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto"
        style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#000" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Toolbar */}
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
            <h2 style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: 3.5, textTransform: "uppercase", color: "#000" }}>Rental Payment Receipt</h2>
          </div>

          {/* Invoice Details + Bill To */}
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <div style={S.box}>
              <div style={S.boxHead}>Invoice Details</div>
              <div style={{ padding: "10px 14px" }}>
                {[["Invoice #", receipt.id], ["Invoice Date", receipt.date], ["Due On", "Due on Receipt"], ["State Code", "MP (23)"]].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3.5px 0", gap: 8 }}>
                    <span style={S.label}>{lbl}</span><span style={S.value}>{val}</span>
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
                {[["Room", `Room ${receipt.room}`], ...(receipt.phone ? [["Phone", receipt.phone]] : []), ...(receipt.email ? [["Email", receipt.email]] : [])].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", gap: 8 }}>
                    <span style={S.label}>{lbl}</span><span style={S.value}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Items table */}
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
                  <p style={{ fontWeight: 600 }}>Original Rent</p>
                  <p style={{ fontSize: 11, color: "#666", marginTop: 3 }}>Agreed rent for this duration ({receipt.period})</p>
                  <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>SAC: 997211</p>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center", border: "1px solid #e8e8e8" }}>1</td>
                <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>₹{originalRent.toLocaleString("en-IN")}.00</td>
                <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>₹{originalRent.toLocaleString("en-IN")}.00</td>
              </tr>
              {penalty > 0 && (
                <tr>
                  <td style={{ padding: "12px 14px", border: "1px solid #e8e8e8", color: "#666" }}>2</td>
                  <td style={{ padding: "12px 14px", border: "1px solid #e8e8e8" }}>
                    <p style={{ fontWeight: 600, color: "#dc2626" }}>Late Penalty</p>
                    <p style={{ fontSize: 11, color: "#666", marginTop: 3 }}>Accumulated penalty for delayed payment</p>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center", border: "1px solid #e8e8e8" }}>1</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8", color: "#dc2626" }}>₹{penalty.toLocaleString("en-IN")}.00</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8", color: "#dc2626" }}>₹{penalty.toLocaleString("en-IN")}.00</td>
                </tr>
              )}
              {electricity > 0 && (
                <tr>
                  <td style={{ padding: "12px 14px", border: "1px solid #e8e8e8", color: "#666" }}>{penalty > 0 ? 3 : 2}</td>
                  <td style={{ padding: "12px 14px", border: "1px solid #e8e8e8" }}>
                    <p style={{ fontWeight: 600 }}>Electricity Bill</p>
                    <p style={{ fontSize: 11, color: "#666", marginTop: 3 }}>Electricity charges for this period</p>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center", border: "1px solid #e8e8e8" }}>1</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>₹{electricity.toLocaleString("en-IN")}.00</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>₹{electricity.toLocaleString("en-IN")}.00</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Payment Breakdown Summary */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14, border: "1px solid #d1d5db", borderTop: "none" }}>
            <div style={{ width: 340, borderLeft: "1px solid #d1d5db" }}>
              <div style={{ background: "#f5f5f5", padding: "7px 16px", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#444", borderBottom: "1px solid #d1d5db" }}>
                Payment Breakdown Summary
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 16px" }}>
                <span style={{ fontSize: 13 }}>Original Rent</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>₹{originalRent.toLocaleString("en-IN")}.00</span>
              </div>
              {penalty > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 16px" }}>
                  <span style={{ fontSize: 13 }}>Late Penalty</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>₹{penalty.toLocaleString("en-IN")}.00</span>
                </div>
              )}
              {electricity > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 16px" }}>
                  <span style={{ fontSize: 13 }}>Electricity Bill</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>₹{electricity.toLocaleString("en-IN")}.00</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 16px", borderTop: "1px dashed #ccc", marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Total Rent Due</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>₹{totalDue.toLocaleString("en-IN")}.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 16px" }}>
                <span style={{ fontSize: 13 }}>Total Rent Paid</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>(-) ₹{paidAmt.toLocaleString("en-IN")}.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderTop: "1.5px solid #000", marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 800 }}>Balance Remaining</span>
                <span style={{ fontSize: 14, fontWeight: 800 }}>₹{balance.toLocaleString("en-IN")}.00</span>
              </div>
            </div>
          </div>

          {/* Total in words */}
          <div style={{ border: "1px solid #d1d5db", padding: "9px 14px", fontSize: 12.5, marginBottom: 16 }}>
            <strong>Amount Due In Words:</strong> {numberToWords(totalDue)}
          </div>

          {/* Terms */}
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



