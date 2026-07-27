import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useTenantAgreement } from "./useTenantAgreement";

// ---- Typed Signature Pad ----
const STYLES = [
  { label: "Classic",  font: "'Dancing Script', cursive",  color: "#1a237e", size: 42 },
  { label: "Formal",   font: "'Pacifico', cursive",        color: "#1a237e", size: 36 },
  { label: "Elegant",  font: "'Great Vibes', cursive",     color: "#0d47a1", size: 48 },
  { label: "Bold",     font: "'Satisfy', cursive",         color: "#1b5e20", size: 38 },
];

const TypedSignaturePad = ({ onSave }) => {
  const [name, setName]       = useState("");
  const [styleIdx, setStyleIdx] = useState(0);
  const canvasRef             = useRef(null);

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

  // Wait for fonts to load before drawing so cursive fonts render correctly
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
    <div style={{ border: "1px solid #c5cae9", borderRadius: 8, padding: 16, background: "#fafafa" }}>
      <div style={{ marginBottom: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your full name here..."
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 14px",
            fontSize: 15, borderRadius: 6, border: "1px solid #d1d5db",
            background: "#fff", outline: "none"
          }}
        />
      </div>

      {/* Style selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {STYLES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setStyleIdx(i)}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              border: `1.5px solid ${i === styleIdx ? "#3b82f6" : "#d1d5db"}`,
              background: i === styleIdx ? "#eff6ff" : "#fff",
              color: i === styleIdx ? "#1d4ed8" : "#374151",
              fontWeight: i === styleIdx ? 700 : 400
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Signature preview canvas */}
      <div style={{ border: "1px dashed #a5b4fc", borderRadius: 6, background: "#fff", marginBottom: 12, overflow: "hidden" }}>
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
            width: "100%", padding: "9px 0", background: "#1a237e", color: "#fff",
            border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}
        >
          Use This Signature
        </button>
      )}
    </div>
  );
};

// ---- Annexure A row ----
const Row = ({ label, value }) => (
  <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", padding: "7px 0" }}>
    <div style={{ width: "45%", fontWeight: 600, color: "#444", fontSize: 13 }}>{label}</div>
    <div style={{ width: "55%", color: "#222", fontSize: 13 }}>{value || "—"}</div>
  </div>
);

export default function DigitalCheckinTenantagreement() {
  useHtmlPage({
    title: "Tenant Rental Agreement & E-sign",
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
    submitting, error, loadingData, tenantData,
    handleSubmit
  } = useTenantAgreement();

  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [showPad, setShowPad]                   = useState(false);

  const onSignatureSaved = useCallback((dataUrl) => {
    setSignatureDataUrl(dataUrl);
    setShowPad(false);
  }, []);

  const td = tenantData || {};
  const isKycMismatch = td?.kycStatus === "mismatch_review" || Boolean(td?.kyc?.mismatchReasons || td?.mismatchReasons);

  return (
    <div className="html-page">
      <div className="wrap">
        <h2>RoomHy Licence &amp; Subscription Agreement</h2>

        {isKycMismatch && (
          <div style={{ background: "#fef2f2", border: "2px solid #ef4444", color: "#991b1b", padding: "16px 20px", borderRadius: 10, marginBottom: 20, boxShadow: "0 4px 6px -1px rgba(239,68,68,0.1)" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
              ⚠️ Data Mismatch Detected — Agreement Locked
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.5, color: "#7f1d1d" }}>
              Data mismatch detected. Please check if you have uploaded the correct Aadhaar Card. If you are still facing a data mismatch issue, please contact your property owner.
            </p>
            <button
              type="button"
              onClick={() => window.location.href = `/digital-checkin/tenantkyc?loginId=${encodeURIComponent(loginId.trim())}`}
              style={{ background: "#dc2626", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              ← Back to KYC Verification to Re-upload
            </button>
          </div>
        )}

        {error && !isKycMismatch && (
          <div style={{ background: "#fff0f0", border: "1px solid #f88", color: "#900", padding: "10px 14px", borderRadius: 6, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {loadingData && (
          <div style={{ textAlign: "center", padding: "16px 0", color: "#6b7280", fontSize: 14 }}>
            Loading agreement details...
          </div>
        )}

        {/* ---- AGREEMENT CLAUSES ---- */}
        <div className="box" style={{ maxHeight: 360, overflowY: "auto", fontSize: 13, lineHeight: 1.75, padding: "16px 20px" }}>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
            This RoomHy Licence &amp; Subscription Agreement (<strong>"Agreement"</strong>) is entered into between{" "}
            <strong>RoomHy Property Management Platform</strong> (<strong>"Platform"</strong>) and the Tenant identified in
            Annexure A, on the date of digital acceptance below.
          </p>

          <p><strong>1. LICENCE TO OCCUPY</strong><br />
          The Tenant is granted a non-exclusive, non-transferable licence to occupy the designated room/premises listed in Annexure A.
          This licence does not create a tenancy or lease under the Transfer of Property Act and may be revoked per the terms herein.
          The Tenant shall not claim any tenancy rights at any point of time.</p>

          <p><strong>2. SUBSCRIPTION / MONTHLY LICENSE FEE</strong><br />
          The Tenant agrees to pay the monthly subscription/license fee as specified in Annexure A, on or before the due date
          (default: 5th of each calendar month). A late payment penalty of ₹500 per day shall apply beyond a 10-day grace period.
          All payments shall be made via the RoomHy platform or bank transfer as directed by the Owner.</p>

          <p><strong>3. SECURITY DEPOSIT</strong><br />
          The Tenant shall deposit the refundable security amount specified in Annexure A prior to check-in. The deposit is refundable
          within 30 days of vacating the premises, after deducting any outstanding dues, damages beyond fair wear and tear, or
          unpaid bills. No interest shall accrue on the security deposit.</p>

          <p><strong>4. LICENSE DURATION &amp; NOTICE PERIOD</strong><br />
          This licence is valid for the period stated in Annexure A (start date to end date). Either party may terminate the licence
          with a minimum written notice as specified in Annexure A (default: 30 days). Early exit without serving the full notice
          period shall attract Notice Period Charges as specified in Annexure A, which may be recovered from the security deposit.</p>

          <p><strong>5. MOVE-OUT &amp; VACANCY CHARGES</strong><br />
          Move-out charges (if any) are specified in Annexure A and shall be payable at the time of vacating. The Tenant must
          hand over the premises in clean, undamaged condition. Keys, access cards, and all Owner-provided property must be
          returned on the last day.</p>

          <p><strong>6. SOLE OCCUPANCY</strong><br />
          Only the registered Tenant shall occupy the premises. Sub-letting, sharing with unregistered persons, or transferring
          the licence to any third party is strictly prohibited and constitutes immediate grounds for revocation of the licence
          and forfeiture of the security deposit.</p>

          <p><strong>7. PROPERTY CARE &amp; MAINTENANCE</strong><br />
          The Tenant is responsible for maintaining the premises in clean and serviceable condition. Damage beyond normal wear
          and tear shall be assessed at check-out and recovered from the security deposit or billed separately. The Tenant must
          report any maintenance issues promptly through the RoomHy platform.</p>

          <p><strong>8. INCLUSIONS &amp; UTILITIES</strong><br />
          The inclusions provided as part of the subscription are listed in Annexure A (e.g., WiFi, meals, housekeeping).
          Utilities such as electricity and water, if not included, shall be billed separately. Excessive consumption or
          tampering with meters, connections, or shared infrastructure is prohibited.</p>

          <p><strong>9. VISITOR POLICY</strong><br />
          Day visitors are permitted between 9:00 AM and 9:00 PM only. Overnight guests require prior written approval from
          the property Owner or Manager through the RoomHy platform. Habitual violation of visitor policy may result in
          termination of this licence without refund of notice period rent.</p>

          <p><strong>10. CONDUCT &amp; COMMUNITY STANDARDS</strong><br />
          The Tenant shall maintain peaceful coexistence with co-occupants and neighbours. Activities causing disturbance,
          violating local laws, or bringing disrepute to the property are strictly prohibited. Alcohol consumption in
          common areas, narcotic use, or illegal activities on premises will result in immediate eviction.</p>

          <p><strong>11. KYC &amp; IDENTITY VERIFICATION</strong><br />
          The Tenant confirms that all KYC documents submitted (Aadhaar card, PAN card, photograph) are genuine, valid, and
          belong to the Tenant. Any submission of fraudulent, forged, or third-party documents will result in immediate
          eviction, legal action under applicable laws, and full forfeiture of the security deposit.</p>

          <p><strong>12. DIGITAL ACKNOWLEDGEMENT &amp; E-SIGN</strong><br />
          By providing a digital signature (e-sign) and checking the acceptance box, the Tenant acknowledges full understanding
          and unconditional acceptance of all terms herein. This digital signature carries the same legal weight as a physical
          signature under the Information Technology Act, 2000 and is binding on both parties.</p>

          <p><strong>13. PLATFORM SERVICES</strong><br />
          RoomHy provides digital infrastructure including rent receipts, maintenance requests, community updates, KYC
          verification, and digital agreements. The Tenant agrees to receive service communications, alerts, and notices via
          registered mobile number and email address.</p>

          <p><strong>14. MINIMUM STAY</strong><br />
          The Tenant agrees to a minimum stay duration as specified in Annexure A (default: 3 months). Vacating before the
          minimum stay period without Owner consent shall result in forfeiture of the security deposit and applicable
          notice period charges.</p>

          <p><strong>15. DATA PRIVACY &amp; CONSENT</strong><br />
          The Tenant consents to the collection, secure storage, and use of personal data including KYC details, payment
          records, and communication logs, strictly for property management, KYC verification, legal compliance, and
          platform operations in accordance with RoomHy's Privacy Policy and applicable Indian data protection laws.</p>

          <p><strong>16. DISPUTE RESOLUTION</strong><br />
          Any disputes arising from this Agreement shall first be resolved through good-faith mediation within 30 days of
          notice. If unresolved, disputes shall be subject to the exclusive jurisdiction of the civil courts in the city
          of the property location. This Agreement shall be governed by and construed in accordance with the laws of India.</p>

          <p><strong>17. AMENDMENTS &amp; SEVERABILITY</strong><br />
          This Agreement may be amended only by mutual written consent of both parties. RoomHy reserves the right to update
          platform-level policies with 15-day prior notice. If any provision of this Agreement is found to be unenforceable
          by a competent court, it shall be severed without affecting the validity or enforceability of the remaining provisions.</p>
        </div>

        {/* ---- ANNEXURE A ---- */}
        {!loadingData && (
          <div style={{ marginTop: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: "#1a237e" }}>
              Annexure A — Schedule of Particulars
            </h3>
            <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: "10px 14px", background: "#fafafa" }}>
              {(() => {
                const d   = td?.digitalCheckin?.agreementDetails || {};
                const fmt = (v) => v ? new Date(v).toLocaleDateString("en-IN") : "";
                const maskAadh = (v) => v ? `XXXX XXXX ${String(v).slice(-4)}` : "";
                const backup = [d.backupEmail, d.backupPhone || td.guardianNumber].filter(Boolean).join(" / ");
                const premises = [d.propertyName || td.propertyTitle, d.propertyAddress].filter(Boolean).join(", ");
                const rent = d.rentAmount || td.agreedRent;
                const deposit = d.securityDeposit || td.securityDepositTotal;
                return (
                  <>
                    <Row label="Name of Tenant"         value={d.tenantName  || td.name} />
                    <Row label="Permanent Address"       value={d.permanentAddress} />
                    <Row label="Tenant Email"            value={d.tenantEmail || td.email} />
                    <Row label="Tenant Phone"            value={d.tenantPhone || td.phone} />
                    <Row label="Backup Email &amp; Phone" value={backup} />
                    <Row label="RoomHy Premises"         value={premises || d.propertyName || td.propertyTitle} />
                    <Row label="Type of Accommodation"   value={d.accommodationType} />
                    <Row label="Monthly License Fee"     value={rent ? `₹ ${rent}` : ""} />
                    <Row label="License Start Date"      value={fmt(d.licenseStartDate || td.moveInDate)} />
                    <Row label="License Duration"        value={d.licenseDuration} />
                    <Row label="License End Date"        value={fmt(d.licenseEndDate)} />
                    <Row label="License Fee Due Date"    value={d.licenseFeeDueDate ? `${d.licenseFeeDueDate}th of each month` : "5th of each month"} />
                    <Row label="Move Out Charges"        value={d.moveOutCharges ? `₹ ${d.moveOutCharges}` : ""} />
                    <Row label="Notice Period Charges"   value={d.noticePeriodCharges ? `₹ ${d.noticePeriodCharges}` : ""} />
                    <Row label="Security Deposit"        value={deposit ? `₹ ${deposit}` : ""} />
                    <Row label="Inclusions"              value={d.inclusions} />
                    <Row label="Minimum Stay Duration"   value={d.minimumStayDuration || "3 Months"} />
                    <Row label="GST Charges"             value={d.gstCharges ? `₹ ${d.gstCharges}` : "Nil"} />
                    <Row label="Aadhaar No."             value={maskAadh(td.kyc?.aadhaarNumber || td.digitalCheckin?.kyc?.aadhaarNumber)} />
                    <Row label="Agreement Date"          value={new Date().toLocaleDateString("en-IN")} />
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ---- E-SIGN FORM ---- */}
        <div style={{ marginTop: 24 }}>

          {/* Hidden login ID (auto-filled) */}
          {loginId && (
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
              Signing as: <strong style={{ color: "#1a237e" }}>{loginId}</strong>
            </p>
          )}

          {!loginId && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Login ID</label>
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                placeholder="e.g. ROOMHYTNT6908"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              E-sign Full Name <span style={{ color: "#9ca3af", fontWeight: 400 }}>(as per Aadhaar)</span>
            </label>
            <input
              value={eSignName}
              onChange={(e) => setESignName(e.target.value)}
              required
              placeholder="Type your full legal name"
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
            />
          </div>

          {/* ---- SIGNATURE ---- */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Digital Signature</label>

            {!signatureDataUrl && !showPad && (
              <button
                type="button"
                onClick={() => setShowPad(true)}
                style={{
                  padding: "9px 22px", background: "#e8eaf6", border: "1px solid #9fa8da",
                  borderRadius: 6, cursor: "pointer", fontSize: 14, color: "#3949ab"
                }}
              >
                Create Signature
              </button>
            )}

            {showPad && (
              <TypedSignaturePad onSave={onSignatureSaved} />
            )}

            {signatureDataUrl && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #c5cae9", borderRadius: 6, background: "#f8f9ff" }}>
                <img
                  src={signatureDataUrl}
                  alt="Your signature"
                  style={{ maxHeight: 64, maxWidth: 220, border: "1px solid #e0e0e0", borderRadius: 4, background: "#fff" }}
                />
                <button
                  type="button"
                  onClick={() => { setSignatureDataUrl(""); setShowPad(true); }}
                  style={{ fontSize: 12, color: "#6b7280", background: "none", border: "1px solid #d1d5db", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* ---- ACCEPT CHECKBOX ---- */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 18 }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{ width: "auto", marginTop: 3, accentColor: "#1a237e" }}
            />
            <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
              I have read and fully understood the RoomHy Licence &amp; Subscription Agreement and Annexure A above.
              I provide my e-sign consent voluntarily and confirm that all submitted information is accurate and complete.
              I understand this digital signature is legally binding under the Information Technology Act, 2000.
            </span>
          </label>

          <button
            onClick={() => handleSubmit(signatureDataUrl)}
            disabled={submitting || !signatureDataUrl || !accepted || !eSignName.trim() || isKycMismatch}
            type="button"
            style={{
              width: "100%", padding: "12px 0", background: isKycMismatch ? "#9ca3af" : "#1a237e", color: "#fff",
              border: "none", borderRadius: 7, fontSize: 15, fontWeight: 700,
              cursor: (submitting || !signatureDataUrl || !accepted || !eSignName.trim() || isKycMismatch) ? "not-allowed" : "pointer",
              opacity: (submitting || !signatureDataUrl || !accepted || !eSignName.trim() || isKycMismatch) ? 0.65 : 1
            }}
          >
            {submitting ? "Submitting..." : isKycMismatch ? "Agreement Locked (Data Mismatch)" : "Submit & E-sign Agreement"}
          </button>
        </div>
      </div>
    </div>
  );
}
