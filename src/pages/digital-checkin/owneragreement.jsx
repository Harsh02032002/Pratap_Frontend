import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useOwnerAgreement } from "./useOwnerAgreement";

// ---- Signature Font Options ----
const STYLES = [
  { label: "Classic", font: "'Dancing Script', cursive", color: "#1a237e", size: 42 },
  { label: "Formal", font: "'Pacifico', cursive", color: "#1a237e", size: 36 },
  { label: "Elegant", font: "'Great Vibes', cursive", color: "#0d47a1", size: 48 },
  { label: "Bold", font: "'Satisfy', cursive", color: "#1b5e20", size: 38 },
];

const TypedSignaturePad = ({ onSave, defaultName }) => {
  const [name, setName] = useState(defaultName || "");
  const [styleIdx, setStyleIdx] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (defaultName && !name) {
      setName(defaultName);
    }
  }, [defaultName]);

  const style = STYLES[styleIdx];

  const drawToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!name.trim()) return;
    ctx.font = `${style.size}px ${style.font}`;
    ctx.fillStyle = style.color;
    ctx.textBaseline = "middle";
    const metrics = ctx.measureText(name);
    const x = Math.max(24, (canvas.width - metrics.width) / 2);
    ctx.fillText(name, x, canvas.height / 2);
  }, [name, style]);

  useEffect(() => {
    if (!name.trim()) {
      const canvas = canvasRef.current;
      if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    (document.fonts?.ready || Promise.resolve()).then(drawToCanvas);
  }, [name, style, drawToCanvas]);

  const handleUse = useCallback(() => {
    if (!name.trim()) return;
    (document.fonts?.ready || Promise.resolve()).then(() => {
      drawToCanvas();
      onSave(canvasRef.current.toDataURL("image/png"));
    });
  }, [name, drawToCanvas, onSave]);

  return (
    <div style={{ border: "1px solid #c5cae9", borderRadius: 12, padding: 20, background: "#fafafa", marginTop: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1a237e", marginBottom: 6 }}>
          Type Your Authorized Signature Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type full legal name for E-Signature..."
          style={{
            width: "100%", boxSizing: "border-box", padding: "12px 16px",
            fontSize: 15, borderRadius: 8, border: "1px solid #cbd5e1",
            background: "#fff", outline: "none", fontWeight: 600
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {STYLES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setStyleIdx(i)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              border: `1.5px solid ${i === styleIdx ? "#1a237e" : "#cbd5e1"}`,
              background: i === styleIdx ? "#e8eaf6" : "#fff",
              color: i === styleIdx ? "#1a237e" : "#475569",
              fontWeight: i === styleIdx ? 700 : 500
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ border: "1.5px dashed #a5b4fc", borderRadius: 8, background: "#fff", marginBottom: 14, overflow: "hidden", padding: 8 }}>
        <canvas
          ref={canvasRef}
          width={560}
          height={110}
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      </div>

      {name.trim() && (
        <button
          type="button"
          onClick={handleUse}
          style={{
            width: "100%", padding: "12px 0", background: "#1a237e", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer"
          }}
        >
          Confirm &amp; Apply Signature
        </button>
      )}
    </div>
  );
};

export default function DigitalCheckinOwneragreement() {
  useHtmlPage({
    title: "Hostel Onboarding & Service Agreement | RoomHy",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "stylesheet", href: "/digital-checkin/assets/css/tenantagreement.css" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Pacifico&family=Great+Vibes&family=Satisfy&display=swap" }
    ],
    styles: [],
    scripts: [],
    inlineScripts: []
  });

  const {
    loginId, setLoginId,
    eSignName, setESignName,
    accepted, setAccepted,
    submitting, error, loadingData, ownerData,
    handleSubmit
  } = useOwnerAgreement();

  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [showPad, setShowPad] = useState(false);

  const onSignatureSaved = useCallback((dataUrl) => {
    setSignatureDataUrl(dataUrl);
    setShowPad(false);
  }, []);

  const now = new Date();
  const todayFormatted = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="html-page" style={{ background: "#f8fafc", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Top Header Bar */}
      <header className="dc-header" style={{ background: "#1a237e", color: "#fff", padding: "16px 24px" }}>
        <div className="dc-header-inner" style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/website/images/whitelogo.jpeg" alt="RoomHy Logo" style={{ height: 42, borderRadius: 6 }} />
          <div>
            <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.8 }}>Digital Onboarding &amp; Compliance</p>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Hostel Onboarding &amp; Service Agreement</h1>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        {/* Main Document Box */}
        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "36px 40px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          
          {loadingData ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #1a237e", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>Loading agreement details...</p>
            </div>
          ) : error ? (
            <div style={{ padding: 16, borderRadius: 8, background: "#fef2f2", color: "#991b1b", fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
              {error}
            </div>
          ) : (
            <>
              {/* Document Header */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a237e", margin: 0, textTransform: "uppercase" }}>
                  HOSTEL ONBOARDING &amp; SERVICE AGREEMENT
                </h2>
                <p style={{ fontSize: 13, fontStyle: "italic", color: "#475569", margin: "4px 0 16px" }}>
                  (Platform Access, Lead Generation &amp; Non-Circumvention Agreement)
                </p>
                <div style={{ height: 2, background: "#1a237e", width: "100%", margin: "0 auto" }} />
              </div>

              {/* Preamble */}
              <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "#1e293b", textAlign: "justify" }}>
                This Hostel Onboarding &amp; Service Agreement (<strong>"Agreement"</strong>) is made and entered into on this{" "}
                <strong>{now.getDate()}</strong> day of <strong>{now.toLocaleString("en-IN", { month: "long" })}, {now.getFullYear()}</strong> (<strong>"Effective Date"</strong>), by and between:
              </p>

              <div style={{ margin: "16px 0", padding: "16px 20px", background: "#f8fafc", borderRadius: 8, borderLeft: "4px solid #1a237e" }}>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>
                  <strong style={{ color: "#1a237e" }}>Roomhy Technology</strong>, a Proprietorship concern owned by Mr. Dasrath Singh, engaged in providing hostel management software and lead-generation services, having its registered/principal place of business at 847, Balaji Nagar, Rangbari, Pani Ki Tanki Ke Pass, Kota, Rajasthan – 324005, GSTIN: 08SLWPS2629G1ZZ (hereinafter referred to as “Roomhy” / “Company”, which expression shall, unless repugnant to the context, include its successors, affiliates, and permitted assigns), represented by its Proprietor/Authorised Signatory, Mr. Dasrath Singh;
                </p>
              </div>

              <p style={{ textAlign: "center", fontWeight: 800, color: "#1a237e", margin: "14px 0" }}>AND</p>

              <div style={{ margin: "16px 0", padding: "16px 20px", background: "#f8fafc", borderRadius: 8, borderLeft: "4px solid #166534" }}>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>
                  <strong>The Hostel Owner / Client</strong>, namely M/s. <strong>{ownerData?.hostelLegalName || ownerData?.tradeName || "Hostel Owner"}</strong> ("Hostel"), operating under the trade name <strong>{ownerData?.tradeName || "Hostel"}</strong>, having its office/property address at <strong>{ownerData?.propertyAddress || "Kota, Rajasthan"}</strong>, PAN: <strong>{ownerData?.panNumber || "-"}</strong>, GSTIN: <strong>{ownerData?.gstinNumber || "-"}</strong>, represented by Mr./Ms. <strong>{ownerData?.ownerName || eSignName || "Owner"}</strong>, (hereinafter referred to as the “Client” / “Hostel Owner” / “Partner”).
                </p>
              </div>

              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#334155" }}>
                Roomhy and the Client shall hereinafter be individually referred to as a “Party” and collectively as the “Parties”.
              </p>

              {/* Complete 15-Clause Agreement Text Container */}
              <div style={{ background: "#fafafa", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, margin: "24px 0", maxHeight: 520, overflowY: "auto" }}>
                
                {/* Recitals */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 0 }}>A. RECITALS</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>A.1</strong> Roomhy owns, operates, and maintains a proprietary technology platform, mobile/web application, and back-office software system designed to enable hostel and PG (paying-guest) properties to manage bookings, inventory, pricing, guest communication, payments, and related operations (the “Platform”/“Software”).</p>
                  <p><strong>A.2</strong> Roomhy has additionally developed a unique, proprietary bidding mechanism through which verified guest/customer leads seeking hostel accommodation are allocated to onboarded hostel properties (the “Bidding Process”), as more particularly described in Clause 3 below.</p>
                  <p><strong>A.3</strong> The Client owns/operates the hostel property described above and wishes to be onboarded onto the Platform to avail of the Software and the leads generated through the Bidding Process, on the terms and conditions recorded in this Agreement.</p>
                  <p><strong>A.4</strong> The Parties, having read and understood the contents of this Agreement and intending to be legally bound, agree as follows.</p>
                </div>

                {/* Section 1 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>1. DEFINITIONS AND INTERPRETATION</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>1.1 “Software” / “Platform”</strong> means the hostel management software system provided by Roomhy, including all modules for booking management, room/bed inventory, front-desk operations, payment collection, guest verification, reporting/analytics, and any updates/upgrades.</p>
                  <p><strong>1.2 “Lead(s)”</strong> means prospective guest/customer enquiries, booking requests, or contact details generated through the Platform.</p>
                  <p><strong>1.3 “Bidding Process”</strong> means Roomhy's proprietary, algorithm-based mechanism by which Leads are offered/allocated amongst competing onboarded hostels based on parameters determined solely by Roomhy.</p>
                  <p><strong>1.4 “Circumvention” or “Bypass”</strong> means any act by the Client, or its owners, staff, agents, or representatives, of directly or indirectly contacting, soliciting, negotiating, confirming a booking with, or accepting payment from any Lead outside the Platform, with the intent or effect of avoiding payment of Roomhy's commission/fee.</p>
                  <p><strong>1.5 “Confidential Information”</strong> has the meaning assigned in Clause 9.</p>
                </div>

                {/* Section 2 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>2. SOFTWARE &amp; PLATFORM SERVICES</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>2.1</strong> Roomhy provides full Hostel Management Software access including bed/room inventory management, online and walk-in booking calendar, guest check-in/ID verification, payment collection, invoicing, analytics, and staff access.</p>
                  <p><strong>2.2</strong> Roomhy shall use reasonable commercial efforts to ensure the Software remains operational, subject to scheduled maintenance and updates.</p>
                  <p><strong>2.3</strong> The Client is granted a non-exclusive, non-transferable, revocable right to access and use the Software solely for managing its own hostel property during the Term.</p>
                </div>

                {/* Section 3 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>3. LEAD GENERATION THROUGH BIDDING PROCESS</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>3.1</strong> Roomhy channels prospective guest Leads to onboarded hostels through its unique Bidding Process.</p>
                  <p><strong>3.2</strong> Manner of allocation of Leads and weightage criteria applied in the Bidding Process shall be at Roomhy's sole discretion.</p>
                  <p><strong>3.3</strong> Roomhy does not guarantee any minimum number of Leads, bookings, or revenue to the Client.</p>
                  <p><strong>3.4</strong> All bookings arising out of a Lead shall be processed, confirmed, and paid for through the Platform only.</p>
                </div>

                {/* Section 4 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>4. OBLIGATIONS OF ROOMHY</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>4.1</strong> Provide Client with login credentials/access to the Software upon onboarding.</p>
                  <p><strong>4.2</strong> Provide reasonable onboarding assistance and customer support for Platform use.</p>
                  <p><strong>4.3</strong> Process settlements due to the Client in accordance with the payment cycle under Clause 7.</p>
                  <p><strong>4.4</strong> Maintain reasonable data security measures to protect Client and guest data.</p>
                </div>

                {/* Section 5 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>5. OBLIGATIONS OF THE CLIENT / HOSTEL OWNER</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>5.1</strong> Provide accurate, complete, and updated information regarding property, room/bed inventory, and pricing.</p>
                  <p><strong>5.2</strong> Honour all confirmed bookings made through the Platform at displayed prices and terms.</p>
                  <p><strong>5.3</strong> Maintain hostel property in compliance with safety, fire-safety, and municipal/police regulations.</p>
                  <p><strong>5.4</strong> Not sub-license, share credentials with, or permit use of the Software by unauthorized third parties.</p>
                  <p><strong>5.5</strong> Not engage in any act of Circumvention/Bypass as governed under Clause 6.</p>
                  <p><strong>5.6</strong> Promptly pay all commissions, fees, and charges due to Roomhy as per Clause 7.</p>
                </div>

                {/* Section 6 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>6. NON-CIRCUMVENTION / ANTI-BYPASS POLICY</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>6.1</strong> All Leads generated through the Platform are the proprietary business asset of Roomhy.</p>
                  <p><strong>6.2</strong> The Client shall not contact a guest/Lead introduced by Roomhy outside the Platform to induce cancellation or avoid payment of commission/fee.</p>
                  <p><strong>6.3 First Violation:</strong> Written warning and temporary suspension/blocking of Client's account until resolved.</p>
                  <p><strong>6.4 Second/Subsequent Violation:</strong> Immediate permanent account termination and recovery of applicable commissions/fees and damages.</p>
                </div>

                {/* Section 7 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>7. FEES, COMMISSION &amp; PAYMENT TERMS</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>7.1 Subscription Fee:</strong> One-time/recurring onboarding fee as specified in platform plan.</p>
                  <p><strong>7.2 Commission on Bookings:</strong> Roomhy shall be entitled to a commission on the gross booking value of every booking confirmed through the Platform as mutually agreed between the Parties in writing from time to time.</p>
                  <p><strong>7.3 Settlement Cycle:</strong> Net collected amounts settled to Client's designated bank account within 7 days of guest check-in/check-out.</p>
                  <p><strong>7.4</strong> All fees stated are exclusive of applicable taxes (GST), borne by Client as per law.</p>
                </div>

                {/* Section 8 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>8. TERM &amp; TERMINATION</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>8.1</strong> Agreement commences on Effective Date for 1 year, auto-renewing unless 30 days prior written notice is given.</p>
                  <p><strong>8.2</strong> Either Party may terminate for convenience with 30 days' prior written notice.</p>
                  <p><strong>8.3</strong> Roomhy may terminate immediately for material breach, fraud, illegal operation, or insolvency.</p>
                </div>

                {/* Section 9 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>9. CONFIDENTIALITY</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>9.1</strong> Both Parties shall keep all business, technical, guest, and financial details strictly confidential for 2 years post-termination.</p>
                </div>

                {/* Section 10 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>10. INTELLECTUAL PROPERTY</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>10.1</strong> The Software, Platform, Bidding Process, and algorithms remain the sole property of Roomhy.</p>
                </div>

                {/* Section 11 to 15 */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", marginTop: 20 }}>11-15. GOVERNING LAW, ARBITRATION &amp; MISCELLANEOUS</h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "#334155" }}>
                  <p><strong>14.1 Governing Law:</strong> Governed by the laws of India.</p>
                  <p><strong>14.2 Jurisdiction &amp; Arbitration:</strong> Courts at Kota, Rajasthan have exclusive jurisdiction. Unresolved disputes subject to arbitration at Kota under Arbitration &amp; Conciliation Act, 1996.</p>
                  <p><strong>15.1 Entire Agreement:</strong> Supersedes all prior oral or written discussions.</p>
                </div>
              </div>

              {/* Execution & Signature Section */}
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: "2px stroke #1a237e", background: "#f8fafc", borderRadius: 12, padding: 24, border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1a237e", margin: "0 0 16px" }}>
                  IN WITNESS WHEREOF, the Parties hereto have set their hands on the day, month, and year first above written.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {/* Left Box: Roomhy */}
                  <div style={{ border: "1px solid #c5cae9", borderRadius: 8, padding: 16, background: "#ffffff" }}>
                    <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#1a237e" }}>FOR ROOMHY TECHNOLOGY</p>
                    <p style={{ margin: "4px 0", fontSize: 12, color: "#334155" }}><strong>Name:</strong> Dasrath Singh</p>
                    <p style={{ margin: "4px 0", fontSize: 12, color: "#334155" }}><strong>Designation:</strong> Proprietor, Roomhy Technology</p>
                    <p style={{ margin: "4px 0", fontSize: 12, color: "#334155" }}><strong>GSTIN:</strong> 08SLWPS2629G1ZZ</p>
                    
                    {/* Stamp & Seal Preview */}
                    <div style={{ margin: "12px 0 8px", display: "flex", alignItems: "center", gap: 12 }}>
                      <img src="/website/images/seal1.png" alt="Roomhy Seal" style={{ height: 65, objectFit: "contain" }} />
                      <div>
                        <span style={{ fontSize: 10, background: "#e0e7ff", color: "#3730a3", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>OFFICIAL STAMP</span>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Date: {todayFormatted}</p>
                  </div>

                  {/* Right Box: Owner E-Signature */}
                  <div style={{ border: "1px solid #c5cae9", borderRadius: 8, padding: 16, background: "#ffffff" }}>
                    <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#166534" }}>FOR THE HOSTEL / CLIENT</p>
                    <p style={{ margin: "4px 0", fontSize: 12, color: "#334155" }}><strong>Name:</strong> {ownerData?.ownerName || eSignName || "Hostel Owner"}</p>
                    <p style={{ margin: "4px 0", fontSize: 12, color: "#334155" }}><strong>Hostel Name:</strong> {ownerData?.tradeName || "Hostel Property"}</p>

                    {/* Signature Preview */}
                    <div style={{ margin: "12px 0 8px", minHeight: 65, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #cbd5e1", borderRadius: 6, background: "#fafafa" }}>
                      {signatureDataUrl ? (
                        <img src={signatureDataUrl} alt="Owner Signature" style={{ maxHeight: 55, maxWidth: "100%" }} />
                      ) : (
                        <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No signature applied yet</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPad(!showPad)}
                      style={{
                        padding: "6px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1",
                        borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#1e293b", cursor: "pointer", width: "100%"
                      }}
                    >
                      {signatureDataUrl ? "Change Signature" : "Create E-Signature"}
                    </button>
                    <p style={{ margin: "8px 0 0", fontSize: 11, color: "#64748b" }}>Date: {todayFormatted}</p>
                  </div>
                </div>

                {/* Signature Pad Dropdown */}
                {showPad && (
                  <TypedSignaturePad
                    defaultName={ownerData?.ownerName || eSignName}
                    onSave={onSignatureSaved}
                  />
                )}
              </div>

              {/* Submission Checkbox & Button */}
              <div style={{ marginTop: 28, padding: 20, background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    style={{ width: 20, height: 20, marginTop: 2, accentColor: "#1a237e" }}
                  />
                  <span style={{ fontSize: 13.5, color: "#1e3a8a", fontWeight: 600, lineHeight: 1.5 }}>
                    I, as the authorized representative of <strong>{ownerData?.tradeName || "Hostel"}</strong>, hereby accept and e-sign the Hostel Onboarding &amp; Service Agreement with Roomhy Technology.
                  </span>
                </label>

                <button
                  type="button"
                  disabled={submitting || !accepted || !signatureDataUrl}
                  onClick={() => handleSubmit(signatureDataUrl)}
                  style={{
                    marginTop: 18, width: "100%", padding: "14px 0",
                    background: accepted && signatureDataUrl ? "#1a237e" : "#94a3b8",
                    color: "#ffffff", border: "none", borderRadius: 10,
                    fontSize: 16, fontWeight: 700, cursor: accepted && signatureDataUrl ? "pointer" : "not-allowed",
                    boxShadow: accepted && signatureDataUrl ? "0 4px 12px rgba(26, 35, 126, 0.3)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  {submitting ? "Signing & Generating PDF..." : "Sign Agreement & Complete Onboarding"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
