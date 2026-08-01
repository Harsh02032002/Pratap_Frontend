import React, { useEffect, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { API_URL } from "../../services/api";

export default function DigitalCheckinTenantPayment() {
  useHtmlPage({ title: "Complete Payment — RoomHy", bodyClass: "", htmlAttrs: { lang: "en" }, metas: [{ charset: "UTF-8" }, { name: "viewport", content: "width=device-width, initial-scale=1.0" }], links: [], styles: [], scripts: [], inlineScripts: [] });

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const [step, setStep] = useState(token ? "loading" : "no-token");
  const [propertyData, setPropertyData] = useState(null);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    // Load Razorpay
    if (!window.Razorpay) {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      document.body.appendChild(s);
    }
    // Auto-verify from token
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!payload?.loginId) { setStep("no-token"); return; }
      fetch(`${API_URL}/api/rents/payment-page/verify-identity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, enteredLoginId: payload.loginId })
      })
        .then(r => r.json().then(d => ({ ok: r.ok, status: r.status, d })))
        .then(({ ok, status, d }) => {
          if (ok) { setPropertyData(d); setStep("select"); }
          else if (status === 410 || status === 409) { setError(d.error || d.message); setStep("expired"); }
          else { setError(d.error || d.message || "Verification failed"); setStep("error"); }
        })
        .catch(() => { setError("Could not connect to server"); setStep("error"); });
    } catch (_) { setStep("no-token"); }
  }, [token]);

  const handleOnline = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rents/checkout?token=${encodeURIComponent(token)}`);
      const { orderId, amount, currency, key, userDetails, notes } = await res.json();
      if (!res.ok) throw new Error("Failed to initialize payment");
      const rzp = new window.Razorpay({
        key, amount, currency, name: "RoomHy", description: "Onboarding Payment",
        order_id: orderId, notes,
        handler: async (response) => {
          const vRes = await fetch(`${API_URL}/api/rents/razorpay-onboarding/verify`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, token })
          });
          const vData = await vRes.json();
          if (vRes.ok) setStep("success");
          else setError(vData.error || vData.message || "Payment verification failed");
        },
        prefill: { name: userDetails?.name, email: userDetails?.email, contact: userDetails?.contact },
        theme: { color: "#1a237e" },
        modal: { ondismiss: () => setLoading(false) }
      });
      rzp.on("payment.failed", r => { setError(r.error.description); setLoading(false); });
      rzp.open();
    } catch (e) { setError(e.message); setLoading(false); }
  };

  const handleCashOtp = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rents/cash-otp/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const d = await res.json();
      if (res.ok) setStep("otp");
      else setError(d.error || d.message || "Failed to generate OTP");
    } catch (_) { setError("Failed to reach server"); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rents/cash-otp/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp, paymentMethod: selectedMethod })
      });
      const d = await res.json();
      if (res.ok) setStep("success");
      else setError(d.error || d.message || "OTP verification failed");
    } catch (_) { setError("Server error"); }
    finally { setLoading(false); }
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: "#f4f6f8", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", maxWidth: 440, width: "100%", overflow: "hidden" }}>
        <div style={{ background: "#1a237e", padding: "24px 28px", textAlign: "center" }}>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>RoomHy</div>
          <div style={{ color: "#c5cae9", fontSize: 13, marginTop: 4 }}>Secure Onboarding Payment</div>
        </div>
        <div style={{ padding: "28px 28px 24px" }}>{children}</div>
      </div>
    </div>
  );

  if (step === "loading") return wrap(<div style={{ textAlign: "center", padding: "32px 0" }}><div style={{ width: 36, height: 36, border: "4px solid #e8eaf6", borderTop: "4px solid #1a237e", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} /><p style={{ color: "#6b7280", fontSize: 14 }}>Loading payment details...</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);

  if (step === "no-token" || step === "expired") return wrap(<div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div><h3 style={{ color: "#111", marginBottom: 8 }}>Link Unavailable</h3><p style={{ color: "#6b7280", fontSize: 14 }}>{error || "This payment link is invalid or has expired."}</p></div>);

  if (step === "error") return wrap(<div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>❌</div><p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p></div>);

  if (step === "success") return wrap(<div style={{ textAlign: "center", padding: "16px 0" }}><div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div><h2 style={{ color: "#111", marginBottom: 8 }}>Payment Successful!</h2><p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Your onboarding is complete. Login credentials will be sent to your email.</p><a href="/tenant/tenantlogin" style={{ display: "inline-block", background: "#1a237e", color: "#fff", padding: "12px 28px", borderRadius: 7, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>Go to Tenant Portal</a></div>);

  if (step === "otp") return wrap(<>
    {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{error}</div>}
    <h3 style={{ margin: "0 0 6px", color: "#111" }}>Cash Payment OTP</h3>
    <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>Ask your owner/manager for the 6-digit OTP sent to their number.</p>
    <form onSubmit={handleVerifyOtp}>
      <input type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="------" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 24, letterSpacing: 8, textAlign: "center", border: "1px solid #d1d5db", borderRadius: 7, marginBottom: 16 }} required />
      <button type="submit" disabled={loading || otp.length !== 6} style={{ width: "100%", padding: "12px 0", background: "#1a237e", color: "#fff", border: "none", borderRadius: 7, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: (loading || otp.length !== 6) ? 0.6 : 1 }}>{loading ? "Verifying..." : "Confirm Payment"}</button>
      <button type="button" onClick={() => setStep("select")} style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>← Back</button>
    </form>
  </>);

  // step === "select"
  return wrap(<>
    {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{error}</div>}
    {propertyData && <div style={{ background: "#f8f9ff", border: "1px solid #e8eaf6", borderRadius: 8, padding: "16px 18px", marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Payment Breakdown</div>
      {[["Property", propertyData.propertyName], ["Tenant", propertyData.tenantName], ["Managed By", propertyData.ownerName]].map(([l, v]) => v && <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span style={{ color: "#6b7280" }}>{l}</span><span style={{ fontWeight: 600, color: "#111" }}>{v}</span></div>)}
      <div style={{ borderTop: "1px solid #e8eaf6", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#374151", fontWeight: 600 }}>Total Due</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>₹{propertyData.rentAmount}</span>
      </div>
    </div>}
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button onClick={handleOnline} disabled={loading} style={{ padding: "14px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
        <div style={{ fontWeight: 700, color: "#1e40af" }}>Pay Online (Razorpay)</div>
        <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 2 }}>UPI, Card, Netbanking</div>
      </button>
      <button onClick={() => { setSelectedMethod("cash"); handleCashOtp(); }} disabled={loading} style={{ padding: "14px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
        <div style={{ fontWeight: 700, color: "#374151" }}>Cash</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Hand over cash to owner/manager</div>
      </button>
      <button onClick={() => { setSelectedMethod("already_paid"); handleCashOtp(); }} disabled={loading} style={{ padding: "14px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
        <div style={{ fontWeight: 700, color: "#15803d" }}>Already Paid</div>
        <div style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>Payment already done to owner</div>
      </button>
    </div>
  </>);
}
