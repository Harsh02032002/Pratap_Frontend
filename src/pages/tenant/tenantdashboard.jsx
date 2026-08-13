// thing to rember in tenant dashboard all the tenant ledger tenant adhar kyc
// this all page are present in this only



import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson, getApiBase, getAuthHeader, parseApiError } from "../../utils/api";
import { clearAllAuthKeys } from "../../contexts/AuthContext";
import { verifyCashOtp as verifyCashOtpRequest } from "../../utils/rentCollectionApi";
import {
  CheckCircle, Download, Eye, Upload, Star, Clock, XCircle,
  Clock3, AlertTriangle, FileWarning, X, CreditCard, HandCoins,
} from "lucide-react";
import {
  Sidebar, MobileBottomNav, MobileTopBar, DashboardHeader, HeroRentCard, UpcomingDuesCard, PaymentTrendChart,
  RecentPaymentsTable, LeaseInformation, QuickActions, AnnouncementCard,
  QuickActionIcons,
  LedgerHeader, LedgerSummaryCards, BalanceChart, SummaryPanel,
  LedgerFilters, LedgerTable, Pagination, DateRangePicker,
  KycHeader, VerificationStatusCard, IdentityInformationCard, VerificationTimeline,
  WelcomeHeader, Breadcrumb, MoveOutHero, MoveOutForm, ImportantNoteCard,
  VisitorHero, VisitorDetailsCard, VisitorPassCard, VisitorNoteCard, VisitorPassStatusCard,
  LeaveHero, LeaveForm, LeaveHistory, LeaveNoteCard,
  ComplaintHero, ComplaintForm, ComplaintHistory,
} from "./dashboardComponents";

// ─── Razorpay loader ───────────────────────────────────────────────────────────
const ensureRazorpayLoaded = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") { reject(new Error("Window is not available.")); return; }
    if (window.Razorpay) { resolve(true); return; }
    const existing = document.querySelector('script[data-roomhy-razorpay="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.roomhyRazorpay = "1";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay."));
    document.body.appendChild(script);
  });

// ─── PDF library loader (jsPDF + html2canvas) ─────────────────────────────────
const ensurePdfLibsLoaded = () =>
  new Promise((resolve, reject) => {
    if (window.jspdf && window.html2canvas) { resolve(true); return; }
    const loadScript = (src) =>
      new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
        const s = document.createElement("script");
        s.src = src;
        s.onload = res;
        s.onerror = () => rej(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
      });
    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
    ])
      .then(() => resolve(true))
      .catch(reject);
  });

// ─── LocalStorage helpers ──────────────────────────────────────────────────────
const readTenantUser = () => {
  try { return JSON.parse(localStorage.getItem("tenant_user") || "null"); }
  catch { return null; }
};
const readLocalTenants = () => {
  try { return JSON.parse(localStorage.getItem("roomhy_tenants") || "[]"); }
  catch { return []; }
};
const writeLocalTenants = (list) => localStorage.setItem("roomhy_tenants", JSON.stringify(list));
const upsertTenantRecord = (record) => {
  if (!record?.loginId) return;
  const list = readLocalTenants();
  const key = String(record.loginId).toUpperCase();
  const idx = list.findIndex((i) => String(i.loginId || "").toUpperCase() === key);
  if (idx >= 0) list[idx] = { ...list[idx], ...record };
  else list.push(record);
  writeLocalTenants(list);
};

// ─── Formatters ───────────────────────────────────────────────────────────────
const formatCurrency = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;
const formatDate = (v, withTime = false) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(
    "en-IN",
    withTime
      ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "short", year: "numeric" }
  );
};
const paymentMethodLabel = (m) =>
({ razorpay: "Online (Razorpay)", cash: "Cash", bank_transfer: "Bank Transfer", other: "Other" }[
  String(m || "").toLowerCase()
] || "Unknown");

const cashStatusLabel = (status) => {
  const key = String(status || "").toLowerCase();
  return {
    pending_approval: "Pending Approval",
    requested: "Pending Approval",
    owner_approved: "Owner Approved",
    otp_sent: "OTP Sent",
    verified: "Verified",
    paid: "Paid",
    rejected: "Rejected",
    expired: "Expired",
  }[key] || key.replaceAll("_", " ") || "Not started";
};

const humanizeCashError = (err, fallback = "Something went wrong. Please try again later.") => {
  const { message, status, raw } = parseApiError(err);
  const normalized = String(message || "").toLowerCase();

  if (status === 0 || status === 408 || normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Unable to connect. Please try again.";
  }

  if (normalized.includes("already exists")) {
    return "Cash payment request already exists.\nPlease wait for owner approval.";
  }

  if (normalized.includes("forbidden")) {
    return "You are not allowed to perform this action.";
  }

  // If the parsed message starts with '{' or is a JSON error serialization, return fallback.
  // Otherwise, return the specific backend parsed message.
  if (message && message !== "Something went wrong. Please try again later." && !message.trim().startsWith("{")) {
    return message;
  }

  return fallback;
};

// ─── Receipt HTML template (rendered off-screen, captured by html2canvas) ─────
import { numberToWords } from "../../components/propertyowner/RentReceiptModal";

function ReceiptTemplate({ receiptRef, tenant, tenantUser, rentItem, loginId, propertyName, roomInfo }) {
  const originalRent = Number(rentItem?.rentAmount || tenant?.agreedRent || 0);
  const penalty = Number(rentItem?.totalPenalty || rentItem?.penalty || 0);
  const electricity = Number(rentItem?.electricityBill || rentItem?.electricity || 0);
  const advanceCharge = Number(rentItem?.advanceChargeAmount || rentItem?.advanceCharge || 0);
  const totalDue = (originalRent + penalty + electricity + advanceCharge) || Number(rentItem?.totalDue || 0);

  const paidAmt = Number(rentItem?.paidAmount ?? rentItem?.paid ?? totalDue); // fallback if fully paid
  const balance = Math.max(0, totalDue - paidAmt);
  const paid = ["paid", "completed"].includes(String(rentItem?.paymentStatus || "").toLowerCase());
  const isPaid = paid || balance === 0;

  const receiptNo = rentItem?._id ? `RMH-${String(rentItem._id).slice(-8).toUpperCase()}` : `RMH-${Date.now()}`;
  const payDate = formatDate(rentItem?.paymentDate || rentItem?.updatedAt || rentItem?.createdAt, true);

  const tenantName = tenantUser?.name || tenant?.name || "Tenant";
  const tenantPhone = tenantUser?.phone || tenant?.phone || "";
  const tenantEmail = tenantUser?.email || tenant?.email || "";
  const period = rentItem?.collectionMonth || formatDate(rentItem?.paymentDate || rentItem?.createdAt)?.split(" ").slice(1).join(" ") || "-";

  const S = {
    label: { fontSize: 11, color: "#555", whiteSpace: "nowrap" },
    value: { fontSize: 12.5, fontWeight: 600, color: "#000", textAlign: "right" },
    boxHead: { background: "#f5f5f5", padding: "8px 14px", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444", borderBottom: "1px solid #d1d5db" },
    box: { border: "1px solid #d1d5db", borderRadius: 4, overflow: "hidden", flex: 1 },
  };

  return (
    <div
      ref={receiptRef}
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: "794px",         // A4 width at 96dpi
        minHeight: "600px",
        background: "#ffffff",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        fontSize: "13px",
        color: "#000",
        padding: "40px 48px",
        margin: "0",
        zIndex: -1,
        boxSizing: "border-box"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #ddd" }}>
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
        <h2 style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#000" }}>
          {(() => {
            const isPendingPast = rentItem?.collectionMonth && rentItem.collectionMonth !== new Date().toISOString().slice(0, 7);
            const monthUi = rentItem?.collectionMonth ? new Date(`${rentItem.collectionMonth}-01`).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : "Rent";
            return isPendingPast ? `Pending Rent Receipt (${monthUi})` : "Rental Payment Receipt";
          })()}
        </h2>
      </div>

      {/* Invoice Details + Bill To */}
      <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
        <div style={S.box}>
          <div style={S.boxHead}>Invoice Details</div>
          <div style={{ padding: "10px 14px" }}>
            {[
              ["Invoice #", receiptNo],
              ["Invoice Date", payDate],
              ["Due On", "Due on Receipt"],
              ["State Code", "MP (23)"]
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3.5px 0", gap: 8 }}>
                <span style={S.label}>{lbl}</span><span style={S.value}>{val}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", gap: 8 }}>
              <span style={S.label}>Status</span>
              <div style={{ display: "inline-block", padding: "4px 12px 8px 12px", border: `1.5px solid ${isPaid ? "#16a34a" : "#d97706"}`, borderRadius: 3, fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: isPaid ? "#166534" : "#92400e", background: isPaid ? "#f0fdf4" : "#fffbeb", lineHeight: 1 }}>
                {isPaid ? "✓ PAID" : "PARTIAL"}
              </div>
            </div>
            {rentItem?.paymentMethod && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", gap: 8 }}>
                <span style={S.label}>Payment Method</span>
                <span style={{ ...S.value, textTransform: "capitalize" }}>{String(rentItem.paymentMethod).replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </div>
        <div style={S.box}>
          <div style={S.boxHead}>Bill To</div>
          <div style={{ padding: "10px 14px" }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{tenantName}</p>
            {[
              ["Room", roomInfo],
              ...(tenantPhone ? [["Phone", tenantPhone]] : []),
              ...(tenantEmail ? [["Email", tenantEmail]] : [])
            ].map(([lbl, val]) => (
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
              <p style={{ fontSize: 11, color: "#666", marginTop: 3 }}>Agreed rent for this duration ({period})</p>
              <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>SAC: 997211</p>
            </td>
            <td style={{ padding: "12px 14px", textAlign: "center", border: "1px solid #e8e8e8" }}>1</td>
            <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>₹{originalRent.toLocaleString("en-IN")}.00</td>
            <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>₹{originalRent.toLocaleString("en-IN")}.00</td>
          </tr>
          {advanceCharge > 0 && (
            <tr>
              <td style={{ padding: "12px 14px", border: "1px solid #e8e8e8", color: "#666" }}>-</td>
              <td style={{ padding: "12px 14px", border: "1px solid #e8e8e8" }}>
                <p style={{ fontWeight: 600 }}>Move In Charges</p>
                <p style={{ fontSize: 11, color: "#666", marginTop: 3 }}>Initial advance / deposit adjustments</p>
              </td>
              <td style={{ padding: "12px 14px", textAlign: "center", border: "1px solid #e8e8e8" }}>1</td>
              <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>₹{advanceCharge.toLocaleString("en-IN")}.00</td>
              <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, border: "1px solid #e8e8e8" }}>₹{advanceCharge.toLocaleString("en-IN")}.00</td>
            </tr>
          )}
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
          {advanceCharge > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 16px" }}>
              <span style={{ fontSize: 13 }}>Move In Charges</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>₹{advanceCharge.toLocaleString("en-IN")}.00</span>
            </div>
          )}
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
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Tenantdashboard() {
  useHtmlPage({
    title: "Roomhy - Tenant Dashboard",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/tenant/assets/css/tenantdashboard.css" },
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }],
    inlineScripts: [],
  });

  const apiBase = useMemo(() => getApiBase(), []);
  const [tenantUser] = useState(() => readTenantUser());
  const [tenant, setTenant] = useState(null);
  // Alternate ID proof (Voter ID / PAN / Passport / Driving License), submitted instead of
  // Aadhaar when onboarded without it — lives in a separate TenantKycRequest record, not
  // on tenant.kyc, so it needs its own fetch.
  const [altKycRequest, setAltKycRequest] = useState(null);
  const [rent, setRent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState("current"); // "current" | "previous"
  const [genericModal, setGenericModal] = useState(null);
  const [cashPanelOpen, setCashPanelOpen] = useState(false);
  const [cashOtp, setCashOtp] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [documentViewer, setDocumentViewer] = useState(null);
  const [announcements, setAnnouncements] = useState([]);


  // Tab State
  const [activeTab, setActiveTab] = useState("dashboard");

  // Gate Management State
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const [visitorGuestName, setVisitorGuestName] = useState("");
  const [visitorGuestPhone, setVisitorGuestPhone] = useState("");
  const [visitorDate, setVisitorDate] = useState("");

  const [leaveDepartureDate, setLeaveDepartureDate] = useState("");
  const [leaveReturnDate, setLeaveReturnDate] = useState("");
  const [gateLeaveReason, setGateLeaveReason] = useState("");

  // Complaints State
  const [complaintCategory, setComplaintCategory] = useState("Plumbing");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintPriority, setComplaintPriority] = useState("Low");
  const [complaintStatusMsg, setComplaintStatusMsg] = useState("");
  const [complaintBusy, setComplaintBusy] = useState(false);
  const [visitorBusy, setVisitorBusy] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);

  // Visitor Pass State
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorExpectedTime, setVisitorExpectedTime] = useState("");
  const [visitorMsg, setVisitorMsg] = useState("");
  const [myVisitors, setMyVisitors] = useState([]);

  // Leave Request State
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveMsg, setLeaveMsg] = useState("");
  const [myLeaves, setMyLeaves] = useState([]);

  // Ledger state
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerBalance, setLedgerBalance] = useState(0);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerType, setLedgerType] = useState("All Transactions");
  const [ledgerCategory, setLedgerCategory] = useState("All Categories");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerDateFrom, setLedgerDateFrom] = useState("");
  const [ledgerDateTo, setLedgerDateTo] = useState("");
  const [ledgerPickerOpen, setLedgerPickerOpen] = useState(false);
  const LEDGER_PAGE_SIZE = 6;

  // KYC state
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState("");
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState("");
  const [addressProofUrl, setAddressProofUrl] = useState("");
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const [kycMsg, setKycMsg] = useState("");

  // Police Verification state
  const [policeReceiptUrl, setPoliceReceiptUrl] = useState("");
  const [uploadingPolice, setUploadingPolice] = useState(false);
  const [policeMsg, setPoliceMsg] = useState("");

  // Move-out state
  const [moveoutDate, setMoveoutDate] = useState("");
  const [moveoutReason, setMoveoutReason] = useState("");
  const [submittingMoveout, setSubmittingMoveout] = useState(false);
  const [moveoutMsg, setMoveoutMsg] = useState("");

  // Feedback state
  const [feedbackCategory, setFeedbackCategory] = useState("Amenities");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // PDF state
  const [pdfBusy, setPdfBusy] = useState(false);
  const [activeReceiptItem, setActiveReceiptItem] = useState(null);
  const receiptRef = useRef(null);

  // Previous Month(s) Pending State
  const prevMonthRef = useRef(null);
  const [prevMonthDropdownOpen, setPrevMonthDropdownOpen] = useState(false);
  const [prevMonthObj, setPrevMonthObj] = useState(null);
  const [prevMonthDetailModal, setPrevMonthDetailModal] = useState(false);

  const targetRentContext = paymentTarget === "current" ? rent : prevMonthObj;
  const targetCashRequestStatus = targetRentContext?.cashRequestStatus || targetRentContext?.paymentStatus || "";
  const targetNormalizedCashStatus = String(targetCashRequestStatus || "NONE").toUpperCase();
  const showCashOtp = ["OWNER_APPROVED", "OTP_SENT", "VERIFIED"].includes(targetNormalizedCashStatus);
  // Close dropdown on outside click
  useEffect(() => {
    const act = (e) => {
      if (prevMonthDropdownOpen && prevMonthRef.current && !prevMonthRef.current.contains(e.target)) {
        setPrevMonthDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", act);
    return () => document.removeEventListener("mousedown", act);
  }, [prevMonthDropdownOpen]);

  const priorMonthsOptions = useMemo(() => {
    if (!history) return [];
    return history.filter(item => {
      if (rent && item._id === rent._id) return false;
      const s = String(item.paymentStatus || "").toLowerCase();
      // Exclude if deeply marked as paid or completed
      if (s === "paid" || s === "completed") return false;

      // Specifically addressing the user's issue: Only check status, don't math out paidAmt 
      // because partial payments might throw off the calculation visually.
      return true;
    });
  }, [history, rent]);

  const priorPaidReceipts = useMemo(() => {
    if (!history) return [];
    return history.filter(item => {
      if (rent && item._id === rent._id) return false;
      const s = String(item.paymentStatus || "").toLowerCase();
      return s === "paid" || s === "completed";
    });
  }, [history, rent]);

  useEffect(() => {
    if (priorMonthsOptions.length > 0) {
      if (!prevMonthObj || !priorMonthsOptions.find(o => o._id === prevMonthObj._id)) {
        setPrevMonthObj(priorMonthsOptions[0]);
      } else {
        setPrevMonthObj(priorMonthsOptions.find(o => o._id === prevMonthObj._id));
      }
    } else if (priorMonthsOptions.length === 0) {
      setPrevMonthObj(null);
    }
  }, [priorMonthsOptions]);

  // Simple helper to convert "2026-06" to "June 2026"
  const formatMonthUi = (rawStr) => {
    if (!rawStr) return "Previous Month";
    const parts = rawStr.split("-");
    if (parts.length === 2 && parts[0].length === 4) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      if (!isNaN(d)) {
        return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
      }
    }
    return rawStr;
  };

  const selectedPrevMonthData = useMemo(() => {
    if (!prevMonthObj) return null;
    const roomRent = Number(prevMonthObj.rentAmount || 0);
    const electricity = Number(prevMonthObj.electricityBill || 0);

    // The backend continuously accrues penalty, but for past months, we cap the display at 30 days manually.
    // 30 days = 5 days Phase 2 (₹100/day = 500) + 19 days Phase 3 (₹400/day = 7600) = ₹8,100 maximum penalty
    const rawPenalty = Number(prevMonthObj.totalPenalty || prevMonthObj.penalty || 0);
    const penalty = Math.min(rawPenalty, 8100);

    const totalDue = roomRent + electricity + penalty;
    const s = String(prevMonthObj.paymentStatus || "pending").toLowerCase();

    // Attempt to stringify month cleanly
    let monthStr = prevMonthObj.collectionMonth || prevMonthObj.billingMonth;
    if (!monthStr || monthStr.trim() === "-") {
      monthStr = formatDate(prevMonthObj.paymentDate || prevMonthObj.updatedAt || prevMonthObj.createdAt).split(" ").slice(1).join(" ");
    }
    monthStr = formatMonthUi(monthStr);

    return {
      monthStr: monthStr || "Previous Month",
      status: s === "overdue" ? "Overdue" : "Pending",
      due: totalDue,
      roomRent,
      electricity,
      penalty,
      item: prevMonthObj
    };
  }, [prevMonthObj]);

  const loginId = String(tenantUser?.loginId || "").toUpperCase();
  const propertyName = tenant?.propertyTitle || tenant?.property?.title || tenant?.property?.name || "Roomhy Property";
  const roomInfo = tenant ? `Room ${tenant.roomNo || "-"}${tenant.bedNo ? ` (${tenant.bedNo})` : ""}` : "Room -";
  const roomRent = Number(rent?.rentAmount || tenant?.agreedRent || 0);
  const totalPenalty = Number(rent?.totalPenalty || 0);
  const electricityCost = Number(rent?.electricityBill || 0);
  // Always compute fresh from components — never trust stale rent.totalDue stored in DB,
  // because electricity gets added to the invoice after the initial totalDue is saved.
  const totalPayable = roomRent + totalPenalty + electricityCost || Number(rent?.totalDue || 0);
  const rentAmount = totalPayable;
  const paymentStatus = String(rent?.paymentStatus || "pending").toLowerCase();
  const isPaid = paymentStatus === "paid" || paymentStatus === "completed";
  const canRequestCash = !isPaid && !["PENDING_APPROVAL", "OWNER_APPROVED", "OTP_SENT", "VERIFIED"].includes(targetNormalizedCashStatus);
  const statusLabel = isPaid ? "Paid" : paymentStatus === "overdue" ? "Overdue" : "Unpaid";

  const docs = useMemo(() => {
    const items = [
      {
        key: "agreement",
        title: "Rental Agreement",
        subtitle: tenant?.agreementSignedAt
          ? `Signed on ${formatDate(tenant.agreementSignedAt)}`
          : "Agreement available in tenant records",
        icon: "file-text",
        accent: "purple",
        actionLabel: "View Agreement",
        onView: () => {
          const pdfUrl = tenant?.digitalCheckin?.agreement?.pdfUrl;
          if (pdfUrl) {
            window.open(pdfUrl, "_blank", "noopener,noreferrer");
            return;
          }
          if (tenant?.agreementSigned && loginId) {
            const base = getApiBase();
            window.open(
              `${base}/api/checkin/tenant/agreement/pdf/${encodeURIComponent(loginId)}`,
              "_blank",
              "noopener,noreferrer"
            );
            return;
          }
          setDocumentViewer({
            title: "Rental Agreement",
            type: "agreement",
            body: (
              <div className="space-y-4 text-sm text-slate-600">
                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50 text-center">
                  <p className="font-semibold text-amber-800">Agreement not yet signed</p>
                  <p className="text-xs mt-1 text-amber-600">Complete your digital check-in to generate the agreement.</p>
                </div>
              </div>
            )
          });
        }
      },
    ];
    const latestPaid = history.find((item) =>
      ["paid", "completed"].includes(String(item.paymentStatus || "").toLowerCase())
    );
    if (latestPaid) {
      items.push({
        key: "receipt",
        title: `${latestPaid.collectionMonth || "Current"} Rent Receipt`,
        subtitle: `Paid via ${paymentMethodLabel(latestPaid.paymentMethod)}`,
        icon: "receipt",
        accent: "green",
        rentItem: latestPaid,
        downloadable: true,
        actionLabel: "View Bill",
        onView: () => {
          setDocumentViewer({
            title: "Rent Receipt",
            type: "receipt",
            body: (
              <div className="space-y-4 text-sm text-slate-600">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Receipt Details</p>
                  <p className="font-semibold text-slate-900">{latestPaid.collectionMonth || "Current"} Rent Receipt</p>
                  <p>{formatDate(latestPaid.paymentDate || latestPaid.updatedAt || latestPaid.createdAt, true)}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Payment Method</p>
                    <p className="font-semibold text-slate-900">{paymentMethodLabel(latestPaid.paymentMethod)}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Paid Amount</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(latestPaid.paidAmount || latestPaid.totalDue || latestPaid.rentAmount)}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-green-100 bg-green-50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2">Receipt Status</p>
                  <p className="font-semibold text-slate-900">Paid</p>
                  <p className="mt-1 text-slate-600">You can preview the bill here and download the PDF if needed.</p>
                </div>
              </div>
            )
          });
        }
      });
    }
    return items;
  }, [history, tenant, tenantUser, propertyName, roomInfo, rentAmount]);

  // File upload helper — multipart/form-data, so we can't use fetchJson (which
  // would set Content-Type: application/json and break the FormData boundary).
  // Auth header is injected manually via getAuthHeader().
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${apiBase}/api/upload-file`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error || errData?.message || "File upload failed.");
    }
    const data = await response.json();
    return data.url;
  };

  // Submit KYC handler
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!aadhaarNumber) { setKycMsg("Aadhaar Number is required."); return; }
    setUploadingKyc(true);
    setKycMsg("Uploading files and submitting KYC...");
    try {
      let frontUrl = aadhaarFrontUrl;
      let backUrl = aadhaarBackUrl;
      let addressUrl = addressProofUrl;

      const frontInput = document.getElementById("kyc-aadhaar-front");
      const backInput = document.getElementById("kyc-aadhaar-back");
      const addressInput = document.getElementById("kyc-address-proof");

      if (frontInput?.files?.[0]) {
        frontUrl = await uploadFile(frontInput.files[0]);
        setAadhaarFrontUrl(frontUrl);
      }
      if (backInput?.files?.[0]) {
        backUrl = await uploadFile(backInput.files[0]);
        setAadhaarBackUrl(backUrl);
      }
      if (addressInput?.files?.[0]) {
        addressUrl = await uploadFile(addressInput.files[0]);
        setAddressProofUrl(addressUrl);
      }

      const res = await fetchJson("/api/tenants/kyc/submit", {
        method: "POST",
        body: JSON.stringify({
          tenantLoginId: loginId,
          aadhaarNumber,
          panNumber,
          aadhaarFront: frontUrl,
          aadhaarBack: backUrl,
          addressProofFile: addressUrl,
        }),
      });

      if (res?.success) {
        setKycMsg("KYC documents submitted successfully!");
        await loadTenant();
      } else {
        setKycMsg("Submission failed: " + (res?.message || "Unknown error"));
      }
    } catch (err) {
      setKycMsg("Error submitting KYC: " + err.message);
    } finally {
      setUploadingKyc(false);
    }
  };

  // Submit Police handler
  const handlePoliceSubmit = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("police-receipt-file");
    if (!fileInput?.files?.[0] && !policeReceiptUrl) {
      setPoliceMsg("Please select a file to upload.");
      return;
    }
    setUploadingPolice(true);
    setPoliceMsg("Uploading receipt file...");
    try {
      let fileUrl = policeReceiptUrl;
      if (fileInput?.files?.[0]) {
        fileUrl = await uploadFile(fileInput.files[0]);
        setPoliceReceiptUrl(fileUrl);
      }
      const res = await fetchJson("/api/tenants/police/submit", {
        method: "POST",
        body: JSON.stringify({
          tenantLoginId: loginId,
          receiptFile: fileUrl,
        }),
      });
      if (res?.success) {
        setPoliceMsg("Police verification receipt uploaded successfully!");
        await loadTenant();
      } else {
        setPoliceMsg("Submission failed: " + (res?.message || "Unknown error"));
      }
    } catch (err) {
      setPoliceMsg("Error uploading verification: " + err.message);
    } finally {
      setUploadingPolice(false);
    }
  };

  // Submit Moveout handler
  const handleMoveoutSubmit = async (e) => {
    e.preventDefault();
    if (!moveoutDate) { setMoveoutMsg("Please select a move-out date."); return; }
    if (!moveoutReason) { setMoveoutMsg("Please state your reason for moving out."); return; }
    setSubmittingMoveout(true);
    setMoveoutMsg("Submitting move-out notice...");
    try {
      const res = await fetchJson("/api/tenants/moveout", {
        method: "POST",
        body: JSON.stringify({
          tenantLoginId: loginId,
          requestedDate: moveoutDate,
          reason: moveoutReason,
        }),
      });
      if (res?.success) {
        setMoveoutMsg("Move-out notice submitted successfully!");
        await loadTenant();
      } else {
        setMoveoutMsg("Submission failed: " + (res?.message || "Unknown error"));
      }
    } catch (err) {
      setMoveoutMsg("Error submitting notice: " + err.message);
    } finally {
      setSubmittingMoveout(false);
    }
  };

  // Submit Feedback handler
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackComments.trim()) { setFeedbackMsg("Comments are required."); return; }
    setSubmittingFeedback(true);
    setFeedbackMsg("Submitting feedback...");
    try {
      const res = await fetchJson("/api/tenants/feedback", {
        method: "POST",
        body: JSON.stringify({
          tenantLoginId: loginId,
          category: feedbackCategory,
          rating: feedbackRating,
          comments: feedbackComments,
        }),
      });
      if (res?.success) {
        setFeedbackMsg("Thank you! Your feedback has been recorded.");
        setFeedbackComments("");
        setFeedbackRating(5);
      } else {
        setFeedbackMsg("Submission failed: " + (res?.message || "Unknown error"));
      }
    } catch (err) {
      setFeedbackMsg("Error submitting feedback: " + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Fill any KYC / digital-check-in fields the API response omits using the
  // locally-cached tenant record written during digital check-in. API data
  // always wins; the local cache only backfills missing values.
  const hydrateFromLocal = (t) => {
    if (!t) return t;
    try {
      const key = String(t.loginId || loginId || "").toUpperCase();
      const local = readLocalTenants().find((x) => String(x.loginId || "").toUpperCase() === key);
      if (!local) return t;
      return {
        ...local,
        ...t,
        kycStatus: t.kycStatus || local.kycStatus,
        kyc: { ...(local.kyc || {}), ...(t.kyc || {}) },
        digitalCheckin: { ...(local.digitalCheckin || {}), ...(t.digitalCheckin || {}) },
      };
    } catch {
      return t;
    }
  };

  // ─── Data fetchers ───────────────────────────────────────────────────────────
  const loadTenant = async () => {
    if (!loginId) { window.location.href = "/tenant/tenantlogin"; return null; }
    try {
      const data = await fetchJson("/api/tenants/me");
      const match = data?.tenant ? hydrateFromLocal(data.tenant) : null;
      if (match) {
        setTenant(match);
        return match;
      }
      throw new Error("Tenant profile not found.");
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        window.location.href = "/tenant/tenantlogin";
        return null;
      }
      throw err;
    }
  };

  const loadRents = async () => {
    if (!loginId) return [];
    const data = await fetchJson(`/api/rents/tenant/me`);
    const rents = data?.invoices || [];
    setHistory(rents);
    setRent(data?.invoice || rents[0] || null);
    return rents;
  };

  const loadLedger = async () => {
    if (!loginId) return;
    setLoadingLedger(true);
    try {
      const data = await fetchJson(`/api/tenants/ledger/${encodeURIComponent(loginId)}`);
      if (data?.success) {
        setLedgerEntries(data.ledger || []);
        setLedgerBalance(data.finalBalance || 0);
      }
    } catch (err) {
      console.error("Failed to load tenant ledger:", err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const loadAnnouncements = async (ownerLoginId) => {
    const ownerId = ownerLoginId || tenant?.ownerLoginId;
    if (!ownerId) return;
    try {
      const data = await fetchJson(`/api/announcements/owner/${encodeURIComponent(ownerId)}`);
      if (Array.isArray(data?.announcements)) setAnnouncements(data.announcements);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    }
  };

  const refreshDashboard = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const tData = await loadTenant();
      await loadRents();
      if (tData) {
        await loadLedger();
        loadAnnouncements(tData.ownerLoginId);
        fetchMyComplaints(tData);
        if (tData._id) {
          fetchJson(`/api/tenant-kyc-requests?tenantId=${encodeURIComponent(tData._id)}`)
            .then(r => setAltKycRequest(r?.data?.[0] || null))
            .catch(() => setAltKycRequest(null));
        }
      }
    }
    catch (err) { setErrorMsg(err?.body || err?.message || "Failed to load tenant dashboard."); }
    finally { setLoading(false); }
  };

  useEffect(() => { refreshDashboard(); }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshDashboard().catch(() => { });
      }
    };
    const onFocus = () => {
      refreshDashboard().catch(() => { });
    };

    const intervalId = setInterval(() => {
      refreshDashboard().catch(() => { });
    }, 60000);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);


  useEffect(() => {
    const page = document.querySelector(".html-page");
    const shell = page?.closest(".shared-shell");
    if (!shell) return;
    const sidebar = shell.querySelector(".shared-sidebar");
    const header = shell.querySelector(".shared-header");
    const content = shell.querySelector(".shared-content");
    if (sidebar) sidebar.remove();
    if (header) header.remove();
    if (content) { content.style.padding = "0"; content.style.minHeight = "100vh"; }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pay") === "online") setPayOpen(true);
    if (params.get("pay") === "cash") { setPayOpen(true); setCashPanelOpen(true); }
  }, []);

  useEffect(() => {
    setActionMsg("");
    setCashOtp("");
    setCashPanelOpen(false);
  }, [payOpen]);


  // ─── PDF Download ────────────────────────────────────────────────────────────
  const downloadReceiptPdf = async (rentItem) => {
    if (pdfBusy) return;
    setPdfBusy(true);
    setActiveReceiptItem(rentItem);

    // Wait a tick for the hidden receipt DOM to render
    await new Promise((r) => setTimeout(r, 120));

    try {
      await ensurePdfLibsLoaded();

      const el = receiptRef.current;
      if (!el) throw new Error("Receipt template not mounted.");

      // Temporarily make visible for html2canvas
      el.style.left = "-9999px";
      el.style.position = "fixed";

      const canvas = await window.html2canvas(el, {
        scale: 2,             // Retina quality
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const receiptNo = rentItem?._id
        ? `RMH-${String(rentItem._id).slice(-8).toUpperCase()}`
        : `RMH-${Date.now()}`;
      pdf.save(`Roomhy_Receipt_${receiptNo}.pdf`);

    } catch (err) {
      alert("Receipt download failed: " + (err?.message || "Unknown error"));
    } finally {
      setPdfBusy(false);
      setActiveReceiptItem(null);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const openGenericModal = (title, body, footer = null) => setGenericModal({ title, body, footer });
  const closeDocumentViewer = () => setDocumentViewer(null);

  const clearSession = () => {
    clearAllAuthKeys();
    window.location.href = "/tenant/tenantlogin";
  };

  const syncPaymentState = async () => {
    await loadRents();
    localStorage.setItem("roomhy_payment_updated", String(Date.now()));
    window.dispatchEvent(new Event("paymentUpdated"));
  };

  // ─── Payment handlers ─────────────────────────────────────────────────────────
  const handleOnlinePayment = async () => {
    const isCurrent = paymentTarget === "current";
    const targetRentObj = isCurrent ? rent : prevMonthObj;
    const paymentAmount = isCurrent ? rentAmount : (Number(selectedPrevMonthData?.due) || 0);

    if (!tenantUser || paymentAmount <= 0) { setActionMsg("Invalid payment amount."); return; }
    setActionBusy(true);
    setActionMsg("");
    try {
      const orderData = await fetchJson("/api/rents/create-order", {
        method: "POST",
        body: JSON.stringify({
          amount: paymentAmount,
          tenantId: loginId,
          ...(isCurrent ? { currentRentId: rent?._id } : { currentRentId: null, previousRentIds: [prevMonthObj?._id] }),
          description: isCurrent ? "Monthly Rent Payment" : `Pending Due: ${prevMonthObj?.billingMonth}`,
        }),
      });
      if (!orderData?.success)
        throw new Error(orderData?.error || orderData?.message || "Failed to create payment order.");

      await ensureRazorpayLoaded();
      const razorpay = new window.Razorpay({
        key: orderData.key,
        amount: orderData.order.amount,
        currency: "INR",
        name: "Roomhy",
        description: "Monthly Rent Payment",
        order_id: orderData.order?.id,
        prefill: {
          name: tenantUser?.name || tenant?.name || "Tenant",
          email: tenantUser?.email || tenant?.email || "",
          contact: tenantUser?.phone || tenant?.phone || "",
        },
        notes: { tenantId: loginId, rentMonth: new Date().toISOString().slice(0, 7) },
        handler: async (response) => {
          try {
            const verifyResult = await fetchJson("/api/rents/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                tenantId: loginId,
                rentId: isCurrent ? rent?._id : prevMonthObj?._id,
                paidAmount: paymentAmount,
                ...(isCurrent ? { currentRentId: rent?._id } : { currentRentId: null, previousRentIds: [prevMonthObj?._id] }),
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            await syncPaymentState();
            setPayOpen(false);

            const freshRentItem = verifyResult?.transaction || {
              ...rent,
              paymentMethod: "razorpay",
              razorpay_payment_id: response.razorpay_payment_id,
              paymentStatus: "paid",
            };

            openGenericModal(
              "Payment Confirmation",
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Payment Successful!</h4>
                <p className="text-sm text-slate-600 mb-6">
                  Your rent payment has been recorded and confirmed.
                </p>
                <button
                  onClick={() => downloadReceiptPdf(freshRentItem)}
                  disabled={pdfBusy}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {pdfBusy ? "Generating PDF..." : "Download Receipt (PDF)"}
                </button>
              </div>
            );
          } catch (err) {
            setActionMsg(err?.body || err?.message || "Payment record failed.");
          }
        },
        modal: { ondismiss: () => setActionMsg("Payment cancelled.") },
        theme: { color: "#2563eb" },
      });
      razorpay.open();
    } catch (err) {
      setActionMsg(err?.body || err?.message || "Failed to initiate payment.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!tenant) return;
    setComplaintBusy(true);
    setComplaintStatusMsg("Submitting complaint...");
    try {
      await fetchJson("/api/complaints", {
        method: "POST",
        body: JSON.stringify({
          tenantId: tenant._id,
          tenantLoginId: tenant.loginId,
          tenantName: tenantUser?.name || tenant.name,
          tenantPhone: tenantUser?.phone || tenant.phone,
          tenantEmail: tenantUser?.email || tenant.email,
          property: tenant.propertyTitle || tenant.property?.title,
          propertyId: tenant.propertyId || tenant.property?._id,
          roomNo: tenant.roomNo,
          bedNo: tenant.bedNo,
          category: complaintCategory,
          description: complaintDesc,
          priority: complaintPriority,
          status: "Open"
        })
      });
      setComplaintStatusMsg("Complaint submitted successfully! The owner has been notified.");
      setComplaintDesc("");
      fetchMyComplaints();
    } catch (err) {
      setComplaintStatusMsg(err?.body || err?.message || "Failed to submit complaint.");
    } finally {
      setComplaintBusy(false);
    }
  };

  const fetchMyComplaints = async (t = null) => {
    const target = t || tenant;
    if (!target?._id) return;
    try {
      const data = await fetchJson(`/api/complaints/tenant/${target._id}`);
      if (data && data.complaints) {
        setMyComplaints(data.complaints);
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    }
  };

  const fetchMyVisitors = async () => {
    if (!tenant) return;
    try {
      const data = await fetchJson(`/api/visitors/tenant/${tenant.loginId}`);
      if (data && data.visitors) {
        setMyVisitors(data.visitors);
      }
    } catch (err) {
      console.error("Failed to fetch visitors:", err);
    }
  };

  const fetchMyLeaves = async () => {
    if (!tenant) return;
    try {
      const data = await fetchJson(`/api/leaves/tenant/${tenant.loginId}`);
      if (data && data.leaves) {
        setMyLeaves(data.leaves);
      }
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    }
  };

  const handleVisitorSubmit = async (e) => {
    e.preventDefault();
    if (!tenant) return;
    setVisitorBusy(true);
    setVisitorMsg("Sending request to owner for approval...");
    try {
      await fetchJson("/api/visitors", {
        method: "POST",
        body: JSON.stringify({
          tenantLoginId: tenant.loginId,
          ownerLoginId: tenant.ownerLoginId,
          visitorName,
          visitorPhone,
          expectedEntryTime: visitorExpectedTime,
        })
      });
      setVisitorMsg("Request sent! Your visitor pass will appear here once the owner approves it.");
      setVisitorName("");
      setVisitorPhone("");
      setVisitorExpectedTime("");
      fetchMyVisitors();
    } catch (err) {
      setVisitorMsg(err?.body || err?.message || "Failed to create visitor pass.");
    } finally {
      setVisitorBusy(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!tenant) return;
    setLeaveBusy(true);
    setLeaveMsg("Submitting leave request...");
    try {
      await fetchJson("/api/leaves", {
        method: "POST",
        body: JSON.stringify({
          tenantLoginId: tenant.loginId,
          ownerLoginId: tenant.ownerLoginId,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          reason: leaveReason
        })
      });
      setLeaveMsg("Leave request submitted successfully!");
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
      fetchMyLeaves();
    } catch (err) {
      setLeaveMsg(err?.body || err?.message || "Failed to submit leave request.");
    } finally {
      setLeaveBusy(false);
    }
  };

  useEffect(() => {
    if (tenant) {
      if (activeTab === "complaints") fetchMyComplaints();
      if (activeTab === "visitor") fetchMyVisitors();
      if (activeTab === "leave") fetchMyLeaves();
    }
  }, [activeTab, tenant]);

  // While viewing the Visitor Pass tab, poll so an owner's approval appears
  // without a manual refresh.
  useEffect(() => {
    if (!tenant || activeTab !== "visitor") return;
    const id = setInterval(() => fetchMyVisitors(), 15000);
    return () => clearInterval(id);
  }, [activeTab, tenant]);

  const handleCashRequest = async () => {
    const isCurrent = paymentTarget === "current";
    const targetRentObj = isCurrent ? rent : prevMonthObj;
    const paymentAmount = isCurrent ? rentAmount : (Number(selectedPrevMonthData?.due) || 0);

    if (!tenant) { setActionMsg("Tenant data not found."); return; }
    if (isPaid && isCurrent) { setActionMsg("This rent is already marked as paid."); return; }
    if (["PENDING_APPROVAL", "OWNER_APPROVED", "OTP_SENT", "VERIFIED"].includes(targetNormalizedCashStatus) && isCurrent) {
      setCashPanelOpen(true);
      setActionMsg("A cash payment request already exists for this rent.");
      return;
    }
    setActionBusy(true);
    setActionMsg("Sending cash request to owner...");
    setCashPanelOpen(true);
    try {
      const result = await fetchJson("/api/rents/cash/request", {
        method: "POST",
        body: JSON.stringify({
          tenantLoginId: loginId,
          ownerLoginId: tenant.ownerLoginId,
          amount: paymentAmount,
          rentId: targetRentObj?._id, // Connect to specific rent
          propertyName,
          roomNumber: tenant.roomNo || "",
          tenantName: tenantUser?.name || tenant.name || "",
          tenantEmail: tenantUser?.email || tenant.email || "",
          tenantPhone: tenantUser?.phone || tenant.phone || "",
        }),
      });
      setRent(result?.rent || rent);
      setActionMsg("Cash payment request sent. Waiting for owner approval.");
      await syncPaymentState();
    } catch (err) {
      setActionMsg(humanizeCashError(err, "Something went wrong. Please try again later."));
    } finally {
      setActionBusy(false);
    }
  };

  const handleCashOtpVerify = async () => {
    if (!cashOtp.trim()) { setActionMsg("Enter OTP."); return; }
    setActionBusy(true);
    setActionMsg("Verifying OTP...");
    try {
      await verifyCashOtpRequest(loginId, cashOtp.trim(), targetRentContext?._id);
      await syncPaymentState();
      setPayOpen(false);
      setCashOtp("");
      setCashPanelOpen(false);
      setActionMsg("Your cash rent payment has been verified successfully.");
      const cashRentItem = history[0] || {
        ...rent,
        paidAmount: rentAmount,
        paymentMethod: "cash",
        paymentStatus: "paid",
        cashRequestStatus: "PAID",
        paymentDate: new Date().toISOString(),
      };
      openGenericModal(
        "Payment Confirmation",
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 mb-2">Cash Payment Verified</h4>
          <p className="text-sm text-slate-600 mb-6">Your cash payment has been marked as paid.</p>
          <button
            onClick={() => downloadReceiptPdf(cashRentItem)}
            disabled={pdfBusy}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {pdfBusy ? "Generating PDF..." : "Download Receipt (PDF)"}
          </button>
        </div>
      );
    } catch (err) {
      setActionMsg(humanizeCashError(err, "Something went wrong. Please try again later."));
    } finally {
      setActionBusy(false);
    }
  };

  const handleCashRequestRetry = async () => {
    setCashPanelOpen(true);
    await syncPaymentState();
  };

  const activityRows = history.length > 0 ? history : [];

  const handleCreateVisitorPass = async (e) => {
    e.preventDefault();
    if (!visitorGuestName || !visitorGuestPhone || !visitorDate) return setActionMsg("Please fill all fields.");
    setActionBusy(true);
    setActionMsg("Generating pass...");
    try {
      const res = await fetchJson("/api/tenant-gate/visitor-pass", {
        method: "POST",
        body: JSON.stringify({
          tenantId: tenant._id,
          guestName: visitorGuestName,
          guestPhone: visitorGuestPhone,
          expectedDate: visitorDate
        }),
      });
      setVisitorModalOpen(false);
      openGenericModal("Visitor Pass Generated", <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg"><p className="font-bold text-orange-900">Pass Code: {res.pass.passCode}</p><p className="text-sm text-orange-700">Share this code with your guest.</p></div>);
    } catch (err) {
      setActionMsg(err?.message || "Failed to generate pass.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCreateLeaveRequest = async (e) => {
    e.preventDefault();
    if (!leaveDepartureDate || !leaveReturnDate || !gateLeaveReason) return setActionMsg("Please fill all fields.");
    setActionBusy(true);
    setActionMsg("Submitting leave request...");
    try {
      await fetchJson("/api/tenant-gate/leave-request", {
        method: "POST",
        body: JSON.stringify({
          tenantId: tenant._id,
          departureDate: leaveDepartureDate,
          returnDate: leaveReturnDate,
          reason: gateLeaveReason
        }),
      });
      setLeaveModalOpen(false);
      openGenericModal("Leave Request Submitted", <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"><p className="text-indigo-900 font-medium">Your request has been sent to the property manager.</p></div>);
    } catch (err) {
      setActionMsg(err?.message || "Failed to submit request.");
    } finally {
      setActionBusy(false);
    }
  };

  // ─── Dashboard derived data ──────────────────────────────────────────────────
  const firstName = (tenantUser?.name || tenant?.name || "Tenant").split(" ")[0];

  const todayLabel = useMemo(() => {
    const d = new Date();
    const wd = d.toLocaleDateString("en-GB", { weekday: "short" });
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleDateString("en-GB", { month: "long" });
    return `${wd}, ${day} ${mon} ${d.getFullYear()}`;
  }, []);

  const calInfo = useMemo(() => {
    const up = (d) => d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return {
      month: up(today),
      day: String(today.getDate()),
      nextMonth: up(tomorrow),
      nextDay: String(tomorrow.getDate()),
    };
  }, []);

  const dueInfo = useMemo(() => {
    const today = new Date();
    let due = new Date(today.getFullYear(), today.getMonth(), 5);
    if (today.getDate() > 5) due = new Date(today.getFullYear(), today.getMonth() + 1, 5);
    const prevDue = new Date(due.getFullYear(), due.getMonth() - 1, 5);
    const totalSpan = (due - prevDue) / 86400000;
    const elapsed = (today - prevDue) / 86400000;
    const daysRemaining = Math.max(0, Math.ceil((due - today) / 86400000));
    const progress = Math.round((elapsed / totalSpan) * 100);
    const label = due.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return { daysRemaining, progress, label };
  }, []);

  const latestPaid = useMemo(
    () => history.find((it) => ["paid", "completed"].includes(String(it.paymentStatus || "").toLowerCase())) || null,
    [history]
  );

  const chartData = useMemo(() => {
    const monthShort = (val) => {
      if (!val) return "—";
      const d = new Date(val);
      if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("en-GB", { month: "short" });
      const m = String(val).match(/[A-Za-z]{3,}/);
      return m ? m[0].slice(0, 3) : String(val).slice(0, 3);
    };
    const paid = history.filter((h) => ["paid", "completed"].includes(String(h.paymentStatus || "").toLowerCase()));
    const src = (paid.length ? paid : history).slice(0, 6).reverse();
    return src.map((it) => ({
      month: monthShort(it.collectionMonth || it.paymentDate || it.createdAt),
      amount: Number(it.paidAmount || it.totalDue || it.rentAmount || 0),
    }));
  }, [history]);

  const percentChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1].amount;
    const prev = chartData[chartData.length - 2].amount;
    if (!prev) return null;
    return Math.round(((last - prev) / prev) * 100);
  }, [chartData]);

  const recentRows = useMemo(
    () =>
      history.slice(0, 5).map((it, i) => {
        const s = String(it.paymentStatus || "").toLowerCase();
        return {
          id: it._id || i,
          date: formatDate(it.paymentDate || it.updatedAt || it.createdAt),
          description: `Monthly Rent${it.collectionMonth ? ` – ${it.collectionMonth}` : ""}`,
          amount: it.paidAmount || it.totalDue || it.rentAmount || 0,
          status: s === "paid" || s === "completed" ? "Paid" : s === "overdue" ? "Overdue" : "Unpaid",
          item: it,
        };
      }),
    [history]
  );

  // ─── Ledger derived data ─────────────────────────────────────────────────────
  // Normalize raw ledger entries → display rows with a derived category.
  const ledgerRows = useMemo(() => {
    return (ledgerEntries || []).map((e, i) => ({
      id: e.id ?? i,
      date: e.date,
      details: e.details,
      debit: Number(e.debit || 0),
      credit: Number(e.credit || 0),
      balance: Number(e.balance || 0),
      category: Number(e.credit || 0) > 0 ? "Payment" : "Rent",
    }));
  }, [ledgerEntries]);

  // Parse a display date string like "19 Jun 2026" → ISO "2026-06-19" for comparison.
  const parseDisplayDate = (s) => {
    if (!s) return null;
    const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const m = String(s).match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
    if (!m) return null;
    const mo = MONTHS[m[2].toLowerCase()];
    if (mo === undefined) return null;
    return new Date(Number(m[3]), mo, Number(m[1]));
  };

  // Rows filtered by the active date range — used as base for stats, chart, and type/category filters.
  const dateFilteredRows = useMemo(() => {
    if (!ledgerDateFrom && !ledgerDateTo) return ledgerRows;
    const from = ledgerDateFrom ? new Date(ledgerDateFrom) : null;
    const to = ledgerDateTo ? new Date(ledgerDateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);
    return ledgerRows.filter((r) => {
      const d = parseDisplayDate(r.date);
      if (!d) return true;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [ledgerRows, ledgerDateFrom, ledgerDateTo]);

  const ledgerStats = useMemo(() => {
    const totalDebits = dateFilteredRows.reduce((s, r) => s + r.debit, 0);
    const totalCredits = dateFilteredRows.reduce((s, r) => s + r.credit, 0);
    const debitCount = dateFilteredRows.filter((r) => r.debit > 0).length;
    const creditCount = dateFilteredRows.filter((r) => r.credit > 0).length;

    // month-over-month trend (last full month vs previous), null if insufficient
    const mKey = (s) => {
      const m = String(s || "").match(/([A-Za-z]{3,})\s+(\d{2,4})/);
      return m ? `${m[1].slice(0, 3)} ${m[2].slice(-2)}` : String(s || "");
    };
    const byMonth = (sel) => {
      const map = new Map();
      [...dateFilteredRows].reverse().forEach((r) => {
        const k = mKey(r.date);
        map.set(k, (map.get(k) || 0) + sel(r));
      });
      return Array.from(map.values());
    };
    const pct = (arr) => {
      const nz = arr.filter((v) => v > 0);
      if (nz.length < 2) return null;
      const prev = nz[nz.length - 2], last = nz[nz.length - 1];
      if (!prev) return null;
      return Math.round(((last - prev) / prev) * 100);
    };

    return {
      totalDebits,
      totalCredits,
      debitCount,
      creditCount,
      debitTrend: pct(byMonth((r) => r.debit)),
      creditTrend: pct(byMonth((r) => r.credit)),
      outstanding: Math.max(0, ledgerBalance),
      net: -ledgerBalance,
    };
  }, [dateFilteredRows, ledgerBalance]);

  // Balance-trend chart: running net balance (credits − debits) over time.
  const ledgerChart = useMemo(() => {
    const monthKey = (s) => {
      const m = String(s || "").match(/([A-Za-z]{3,})\s+(\d{2,4})/);
      return m ? `${m[1].slice(0, 3)} '${m[2].slice(-2)}` : String(s || "");
    };
    const chrono = [...dateFilteredRows].reverse();
    const points = chrono.map((r) => ({ label: monthKey(r.date), value: -r.balance }));
    if (points.length === 1) points.unshift({ label: "Opening", value: 0 });
    return points;
  }, [dateFilteredRows]);

  const isDateFiltered = !!(ledgerDateFrom || ledgerDateTo);

  const ledgerDateLabel = useMemo(() => {
    if (isDateFiltered) {
      const fmt = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      };
      if (ledgerDateFrom && ledgerDateTo) return `${fmt(ledgerDateFrom)} – ${fmt(ledgerDateTo)}`;
      if (ledgerDateFrom) return `From ${fmt(ledgerDateFrom)}`;
      return `Until ${fmt(ledgerDateTo)}`;
    }
    if (!ledgerRows.length) return "All time";
    const last = ledgerRows[0]?.date;
    const first = ledgerRows[ledgerRows.length - 1]?.date;
    return first && last && first !== last ? `${first} – ${last}` : first || "All time";
  }, [ledgerRows, ledgerDateFrom, ledgerDateTo, isDateFiltered]);

  const filteredLedgerRows = useMemo(() => {
    return dateFilteredRows.filter((r) => {
      if (ledgerType === "Debits" && r.debit <= 0) return false;
      if (ledgerType === "Credits" && r.credit <= 0) return false;
      if (ledgerCategory !== "All Categories" && r.category !== ledgerCategory) return false;
      return true;
    });
  }, [dateFilteredRows, ledgerType, ledgerCategory]);

  useEffect(() => { setLedgerPage(1); }, [ledgerType, ledgerCategory, ledgerDateFrom, ledgerDateTo]);

  const ledgerPageCount = Math.max(1, Math.ceil(filteredLedgerRows.length / LEDGER_PAGE_SIZE));
  const pagedLedgerRows = useMemo(
    () => filteredLedgerRows.slice((ledgerPage - 1) * LEDGER_PAGE_SIZE, ledgerPage * LEDGER_PAGE_SIZE),
    [filteredLedgerRows, ledgerPage]
  );

  const downloadLedgerCsv = () => {
    const header = ["Date", "Description", "Category", "Debit", "Credit", "Balance"];
    const lines = filteredLedgerRows.map((r) =>
      [r.date, `"${String(r.details || "").replace(/"/g, '""')}"`, r.category, r.debit || "", r.credit || "", r.balance]
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Roomhy_Ledger_${loginId || "statement"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtOrDash = (v) => {
    const out = formatDate(v);
    return out === "-" ? "—" : out;
  };

  const leaseDetails = tenant?.digitalCheckin?.agreementDetails || {};
  const leaseStart = leaseDetails.licenseStartDate || tenant?.moveInDate;
  const leaseEnd = leaseDetails.licenseEndDate;
  // Lease is only "Active" once the agreement is actually signed.
  const agreementSigned = !!(
    tenant?.agreementSigned ||
    tenant?.agreementSignedAt ||
    tenant?.digitalCheckin?.agreement?.pdfUrl ||
    tenant?.digitalCheckin?.agreement?.signedAt
  );
  const leaseStatus = tenant
    ? (tenant.moveoutRequest?.status === "approved" || !agreementSigned ? "Inactive" : "Active")
    : "—";

  // ─── KYC read-only display data ──────────────────────────────────────────────
  // Same source the owner panel reads (tenant.kyc.*), with digital-check-in
  // fallbacks so values entered during KYC auto-fill the tenant's own view.
  const kyc = tenant?.kyc || {};
  const dcKyc = tenant?.digitalCheckin?.kyc || {};
  const rawAadhaar = String(
    aadhaarNumber || kyc.aadhaarNumber || kyc.aadhar || dcKyc.aadhaarNumber || tenant?.aadhaarNumber || ""
  ).replace(/\D/g, "");
  const maskedAadhaar = rawAadhaar ? `XXXX XXXX ${rawAadhaar.slice(-4)}` : "";
  const aadhaarPhoneVal = kyc.aadhaarLinkedPhone || dcKyc.aadhaarLinkedPhone || tenant?.aadhaarLinkedPhone || "";
  const panVal = panNumber || kyc.panNumber || kyc.pan || "";
  const nameOnDoc = kyc.nameOnDocument || tenant?.name || tenantUser?.name || "";
  const relationshipVal = kyc.relationship || "Self";

  // KYC counts as "submitted" whenever digital-KYC data exists, even if the
  // status flag hasn't propagated yet — so the auto-filled view always shows.
  const kycDigilocker = !!(kyc.digilockerVerified || dcKyc.digilockerVerified);
  const hasKycData = !!(rawAadhaar || kyc.aadhaarFront || dcKyc.aadhaarFront || kycDigilocker);
  const kycStatusVal = String(tenant?.kycStatus || (hasKycData ? "submitted" : "pending")).toLowerCase();
  const kycActionRequired = !["submitted", "verified"].includes(kycStatusVal) && !hasKycData;
  const kycDate = (() => {
    const f = formatDate(kyc.digilockerVerifiedAt || kyc.submittedAt || kyc.verifiedAt || tenant?.kycSubmittedAt);
    return f === "-" ? formatDate(new Date().toISOString()) : f;
  })();

  const downloadLatestReceipt = () => {
    if (latestPaid) downloadReceiptPdf(latestPaid);
    else setActionMsg("No paid receipt available yet.");
  };

  // Open the tenant's signed rental agreement (same resolution order as the
  // Documents section): hosted pdfUrl → backend-generated PDF → not-signed notice.
  const openAgreement = () => {
    const pdfUrl = tenant?.digitalCheckin?.agreement?.pdfUrl;
    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if ((tenant?.agreementSigned || tenant?.agreementSignedAt) && loginId) {
      const base = getApiBase();
      window.open(
        `${base}/api/checkin/tenant/agreement/pdf/${encodeURIComponent(loginId)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    setDocumentViewer({
      title: "Rental Agreement",
      type: "agreement",
      body: (
        <div className="space-y-4 text-sm text-slate-600">
          <div className="p-4 rounded-xl border border-amber-100 bg-amber-50 text-center">
            <p className="font-semibold text-amber-800">Agreement not yet signed</p>
            <p className="text-xs mt-1 text-amber-600">Complete your digital check-in to generate the signed agreement.</p>
          </div>
        </div>
      ),
    });
  };

  const paymentBreakdown = useMemo(() => {
    const items = [
      { label: "Room Rent", value: roomRent, tone: "text-slate-900" },
      { label: "Total Penalty", value: totalPenalty, tone: totalPenalty > 0 ? "text-amber-700" : "text-slate-900" },
    ];
    if (electricityCost > 0) {
      items.push({ label: "Electricity Bill", value: electricityCost, tone: "text-blue-700" });
    }
    return {
      items,
      total: totalPayable,
    };
  }, [roomRent, totalPenalty, electricityCost, totalPayable]);

  const quickActions = [
    { title: "Pay Rent", subtitle: "Settle your monthly rent", color: "purple", icon: QuickActionIcons.CreditCard, onClick: () => setPayOpen(true) },
    { title: "Raise Complaint", subtitle: "Report an issue", color: "orange", icon: QuickActionIcons.Flag, onClick: () => setActiveTab("complaints") },
    { title: "Maintenance Request", subtitle: "Request a repair", color: "blue", icon: QuickActionIcons.Wrench, onClick: () => setActiveTab("complaints") },
    { title: "Visitor Pass", subtitle: "Pre-approve a guest", color: "green", icon: QuickActionIcons.UserPlus, onClick: () => setActiveTab("visitor") },
    { title: "Leave Request", subtitle: "Submit leave request", color: "indigo", icon: QuickActionIcons.CalendarOff, onClick: () => setActiveTab("leave") },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="html-page">
      {/* Hidden receipt template — rendered off-screen for pdf capture */}
      {activeReceiptItem && (
        <ReceiptTemplate
          receiptRef={receiptRef}
          tenant={tenant}
          tenantUser={tenantUser}
          rentItem={activeReceiptItem}
          loginId={loginId}
          propertyName={propertyName}
          roomInfo={roomInfo}
        />
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={clearSession} />

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Mobile-only top bar with brand + logout */}
          <MobileTopBar onLogout={clearSession} />

          {activeTab !== "dashboard" && activeTab !== "ledger" && activeTab !== "kyc" && activeTab !== "moveout" && activeTab !== "visitor" && activeTab !== "leave" && activeTab !== "complaints" && (
            <header className="hidden md:flex bg-white h-16 items-center justify-between px-6 border-b border-slate-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-800">
                {activeTab === "police" && "Police Station Verification Receipt"}
                {activeTab === "feedback" && "Submit Reviews & Feedback"}
                {activeTab === "visitor" && "Request Visitor Pass"}
                {activeTab === "leave" && "Submit Leave Request"}
              </h2>
            </header>
          )}

          <main className={`flex-1 overflow-y-auto p-6 md:p-8 pb-28 md:pb-8 ${activeTab === "dashboard" || activeTab === "ledger" || activeTab === "kyc" || activeTab === "moveout" || activeTab === "visitor" || activeTab === "leave" || activeTab === "complaints" ? "bg-white" : "bg-slate-50"}`}>
            {errorMsg ? <div className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg border border-red-200">{errorMsg}</div> : null}

            {/* TAB 1: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="max-w-7xl mx-auto space-y-6">
                <DashboardHeader
                  firstName={firstName}
                  dateLabel={todayLabel}
                  onPayRent={() => { setPaymentTarget("current"); setPayOpen(true); }}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* LEFT COLUMN */}
                  <div className="lg:col-span-2 space-y-6">
                    <HeroRentCard
                      amountDue={totalPayable}
                      isPaid={isPaid}
                      statusLabel={statusLabel}
                      dueText="Due on 5th of this month"
                      cal={calInfo}
                      onPayNow={() => { setPaymentTarget("current"); setPayOpen(true); }}
                      onDownloadReceipt={downloadLatestReceipt}
                      hasReceipt={!!latestPaid}
                    />

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Current Month Card */}
                      <div className="flex flex-col h-full rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_16px_-8px_rgba(15,23,42,0.08)]">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-base font-bold text-slate-900">Payment Breakdown</h3>
                              <p className="text-sm text-slate-500 mt-1">Latest invoice values from the backend.</p>
                            </div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {rent?.billingMonth || "Current month"}
                            </div>
                          </div>
                          <div className="mt-5 space-y-3">
                            {paymentBreakdown.items.map((item) => (
                              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-600">{item.label}</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    {item.label === "Room Rent" ? "Base rent from invoice" : "Owner-added penalties"}
                                  </p>
                                </div>
                                <div className={`text-base font-bold tabular-nums ${item.tone}`}>
                                  {formatCurrency(item.value)}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Total Payable</p>
                              <p className="text-xs text-slate-400">Total Rent {electricityCost > 0 ? "+ Electricity " : ""}+ Penalty</p>
                            </div>
                            <div className="text-2xl font-black text-blue-600 tabular-nums">
                              {formatCurrency(paymentBreakdown.total)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Previous Month(s) Pending Card */}
                      <div className="flex flex-col h-full rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_16px_-8px_rgba(15,23,42,0.08)]">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-900">Previous Month(s) Pending</h3>
                              <p className="text-sm text-slate-500">Check and pay any pending month.</p>
                            </div>
                          </div>
                          <div className={`mt-5 relative z-10 ${priorMonthsOptions.length === 0 ? 'opacity-50 pointer-events-none' : ''}`} ref={prevMonthRef}>
                            <button onClick={() => setPrevMonthDropdownOpen(!prevMonthDropdownOpen)} className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span>{selectedPrevMonthData ? selectedPrevMonthData.monthStr : "No Unpaid Months"}</span>
                              </div>
                              <svg className={`h-4 w-4 text-slate-400 transition-transform ${prevMonthDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            {prevMonthDropdownOpen && (
                              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-20">
                                {priorMonthsOptions.map((opt) => {
                                  let optStr = opt.collectionMonth || opt.billingMonth || formatDate(opt.paymentDate || opt.updatedAt || opt.createdAt).split(" ").slice(1).join(" ");
                                  optStr = formatMonthUi(optStr);
                                  return (
                                    <button key={opt._id} onClick={() => { setPrevMonthObj(opt); setPrevMonthDropdownOpen(false); }} className={`w-full text-left px-3 py-2.5 text-[13px] rounded-lg transition-colors ${(prevMonthObj && prevMonthObj._id === opt._id) ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}>
                                      {optStr}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          <div className="mt-4">
                            {/* Summary Card */}
                            <div className="w-full rounded-2xl bg-white border border-slate-100 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] p-5 flex flex-col justify-center min-h-[220px]">
                              {selectedPrevMonthData ? (
                                <>
                                  <div className="text-center mb-5 mt-2">
                                    <h4 className="text-[13px] font-bold text-slate-800 mb-2 uppercase tracking-wider">{selectedPrevMonthData.monthStr}</h4>
                                    <div className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-full text-[11px] font-bold mb-4 border border-red-100 shadow-sm uppercase tracking-wide">{selectedPrevMonthData.status}</div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Due</p>
                                    <p className="text-2xl font-black text-slate-900 tabular-nums">₹{selectedPrevMonthData.due.toLocaleString("en-IN")}</p>
                                  </div>
                                  <div className="space-y-3 mt-auto">
                                    <button onClick={() => { setPaymentTarget("previous"); setPayOpen(true); }} className="w-full bg-indigo-600 hover:bg-indigo-700 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold py-3 rounded-xl shadow-[0_4px_12px_-2px_rgba(79,70,229,0.25)] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2 text-sm active:scale-[0.98]">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2v-4a2 2 0 00-2-2h4z" /></svg>
                                      Pay Now
                                    </button>
                                    <button onClick={() => setPrevMonthDetailModal(true)} className="w-full bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 font-bold py-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 text-[13px] active:scale-[0.98] shadow-sm">
                                      View Details
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center h-full flex flex-col justify-center items-center py-6">
                                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-5 text-green-500 shadow-sm border border-green-100">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                  <h4 className="text-base font-bold text-slate-800 mb-2">No Pending Payments</h4>
                                  <p className="text-[13px] text-slate-500 leading-relaxed px-4 text-center">You have already cleared all dues for prior months.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Prior Month(s) Paid Receipts Section */}
                        {priorPaidReceipts.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="size-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Prior Months' Paid Receipts</h4>
                            </div>
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {priorPaidReceipts.map((item) => {
                                const monthUi = formatMonthUi(item.collectionMonth || item.billingMonth);
                                const paidAmt = item.paidAmount || item.totalDue || item.rentAmount || 0;
                                return (
                                  <div key={item._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <div>
                                      <p className="text-[13px] font-semibold text-slate-800">{monthUi} Rent</p>
                                      <p className="text-[11px] text-emerald-600 font-bold">₹{paidAmt.toLocaleString("en-IN")} • Paid</p>
                                    </div>
                                    <button
                                      onClick={() => downloadReceiptPdf(item)}
                                      title={`Download ${monthUi} receipt`}
                                      className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 inline-flex items-center justify-center transition-colors shadow-sm"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100/50">
                          <div className="flex h-7 w-7 mt-0.5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            <span className="text-lg leading-none font-medium pb-0.5">ℹ</span>
                          </div>
                          <p className="text-xs font-medium text-indigo-800 leading-snug">
                            <span className="opacity-80">💡 You can pay previous pending months individually without affecting your current month's payment.</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
                      <div className="sm:col-span-2">
                        <UpcomingDuesCard
                          nextDueLabel={dueInfo.label}
                          amount={totalPayable}
                          daysRemaining={dueInfo.daysRemaining}
                          progress={dueInfo.progress}
                          onViewAll={() => setActiveTab("ledger")}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <PaymentTrendChart data={chartData} percentChange={percentChange} />
                      </div>
                    </div>

                    <RecentPaymentsTable
                      rows={recentRows}
                      onDownload={(item) => downloadReceiptPdf(item)}
                      onViewAll={() => setActiveTab("ledger")}
                    />
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-6">
                    <LeaseInformation
                      status={leaseStatus}
                      property={propertyName}
                      startDate={fmtOrDash(leaseStart)}
                      endDate={fmtOrDash(leaseEnd)}
                      onViewDetails={openAgreement}
                    />
                    <QuickActions actions={quickActions} />
                    <AnnouncementCard
                      recentComplaint={myComplaints[0] || null}
                      onViewAll={() => setActiveTab("complaints")}
                    />
                  </div>
                </div>
              </div>
            )}


            {/* TAB 2: LEDGER */}
            {activeTab === "ledger" && (
              <div className="max-w-[1180px] mx-auto space-y-8">
                <LedgerHeader
                  firstName={firstName}
                  dateLabel={ledgerDateLabel}
                  isFiltered={isDateFiltered}
                  onOpenPicker={() => setLedgerPickerOpen(true)}
                  onPrint={() => window.print()}
                />

                <div>
                  <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Tenant Ledger</h2>
                  <p className="text-slate-400 mt-1 text-[14px]">
                    Complete logs of all monthly rent charges, payments, and owner adjustments.
                  </p>
                </div>

                <LedgerSummaryCards
                  outstanding={ledgerStats.outstanding}
                  totalDebits={ledgerStats.totalDebits}
                  totalCredits={ledgerStats.totalCredits}
                  netBalance={ledgerStats.net}
                  debitCount={ledgerStats.debitCount}
                  creditCount={ledgerStats.creditCount}
                  debitTrend={ledgerStats.debitTrend}
                  creditTrend={ledgerStats.creditTrend}
                  asOfDate={todayLabel.split(", ")[1] || todayLabel}
                />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    <BalanceChart data={ledgerChart} />
                  </div>
                  <div>
                    <SummaryPanel
                      opening={0}
                      totalDebits={ledgerStats.totalDebits}
                      totalCredits={ledgerStats.totalCredits}
                      current={ledgerStats.net}
                    />
                  </div>
                </div>

                <LedgerFilters
                  dateLabel={ledgerDateLabel}
                  isFiltered={isDateFiltered}
                  onOpenPicker={() => setLedgerPickerOpen(true)}
                  type={ledgerType}
                  setType={setLedgerType}
                  category={ledgerCategory}
                  setCategory={setLedgerCategory}
                  typeOptions={["All Transactions", "Debits", "Credits"]}
                  categoryOptions={["All Categories", "Rent", "Payment"]}
                  onDownloadCsv={downloadLedgerCsv}
                />

                <DateRangePicker
                  isOpen={ledgerPickerOpen}
                  from={ledgerDateFrom}
                  to={ledgerDateTo}
                  onApply={(f, t) => { setLedgerDateFrom(f); setLedgerDateTo(t); }}
                  onClear={() => { setLedgerDateFrom(""); setLedgerDateTo(""); }}
                  onClose={() => setLedgerPickerOpen(false)}
                />

                <div className="space-y-4">
                  <LedgerTable rows={pagedLedgerRows} loading={loadingLedger} />
                  {!loadingLedger && filteredLedgerRows.length > 0 && (
                    <Pagination
                      page={ledgerPage}
                      pageCount={ledgerPageCount}
                      total={filteredLedgerRows.length}
                      shown={pagedLedgerRows.length}
                      onPage={setLedgerPage}
                    />
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: KYC */}
            {activeTab === "kyc" && (
              <div className="max-w-[1180px] mx-auto space-y-8">
                <KycHeader
                  firstName={firstName}
                  subtitle="Here's your KYC verification status and details."
                />

                <div>
                  <h2 className="text-[22px] font-bold tracking-tight text-slate-900">KYC Verification</h2>
                  <p className="text-slate-400 mt-1 text-[14px]">View your identity details and verification status.</p>
                </div>

                {/* Verification status (hero) */}
                <VerificationStatusCard status={kycStatusVal} />

                {/* Identity: read-only when submitted/verified, upload form when action needed */}
                {kycActionRequired ? (
                  <div className={`rounded-[22px] border border-[#eceef3] bg-white p-6 md:p-8 shadow-[0_6px_28px_-16px_rgba(15,23,42,0.16)]`}>
                    <form onSubmit={handleKycSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aadhaar Number *</label>
                          <input
                            type="text"
                            required
                            maxLength={12}
                            disabled={tenant?.kycStatus === "verified" || tenant?.kycStatus === "submitted"}
                            value={aadhaarNumber}
                            onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                            placeholder="12-digit Aadhaar Number"
                            className="w-full h-12 px-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">PAN Number (Optional)</label>
                          <input
                            type="text"
                            maxLength={10}
                            disabled={tenant?.kycStatus === "verified" || tenant?.kycStatus === "submitted"}
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                            placeholder="10-digit Alphanumeric PAN"
                            className="w-full h-12 px-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-500"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Aadhaar Front Scan *</label>
                          {aadhaarFrontUrl && (
                            <a href={aadhaarFrontUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-2 font-medium">
                              <Eye className="w-3.5 h-3.5" /> View Uploaded Front
                            </a>
                          )}
                          <input
                            type="file"
                            id="kyc-aadhaar-front"
                            accept="image/*,application/pdf"
                            disabled={tenant?.kycStatus === "verified" || tenant?.kycStatus === "submitted"}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Aadhaar Back Scan *</label>
                          {aadhaarBackUrl && (
                            <a href={aadhaarBackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-2 font-medium">
                              <Eye className="w-3.5 h-3.5" /> View Uploaded Back
                            </a>
                          )}
                          <input
                            type="file"
                            id="kyc-aadhaar-back"
                            accept="image/*,application/pdf"
                            disabled={tenant?.kycStatus === "verified" || tenant?.kycStatus === "submitted"}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Address Proof (Electricity Bill, etc)</label>
                          {addressProofUrl && (
                            <a href={addressProofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mb-2 font-medium">
                              <Eye className="w-3.5 h-3.5" /> View Uploaded Proof
                            </a>
                          )}
                          <input
                            type="file"
                            id="kyc-address-proof"
                            accept="image/*,application/pdf"
                            disabled={tenant?.kycStatus === "verified" || tenant?.kycStatus === "submitted"}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                        </div>
                      </div>

                      {kycMsg && (
                        <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700">
                          {kycMsg}
                        </div>
                      )}

                      {(tenant?.kycStatus !== "verified" && tenant?.kycStatus !== "submitted") && (
                        <button
                          type="submit"
                          disabled={uploadingKyc}
                          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Upload className="w-5 h-5" />
                          {uploadingKyc ? "Uploading and submitting..." : "Submit KYC Documents"}
                        </button>
                      )}
                    </form>
                  </div>
                ) : (
                  <IdentityInformationCard
                    aadhaar={maskedAadhaar}
                    aadhaarPhone={aadhaarPhoneVal}
                    pan={panVal}
                    name={nameOnDoc}
                    relationship={relationshipVal}
                    altProofUrl={!maskedAadhaar ? altKycRequest?.proofFileUrl : null}
                    altProofType={altKycRequest?.proofType}
                  />
                )}

                {/* Verification timeline */}
                <VerificationTimeline status={kycStatusVal} date={kycDate} digilockerVerified={kycDigilocker} />
              </div>
            )}

            {/* TAB 4: POLICE */}
            {activeTab === "police" && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Police Verification</h2>
                  <p className="text-slate-500 mt-1">Submit your local station verification receipt file below.</p>
                </div>

                {/* Status banner */}
                <div className={`p-5 rounded-2xl border flex items-start gap-4 ${tenant?.policeVerification?.status === "verified"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : tenant?.policeVerification?.status === "submitted"
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : tenant?.policeVerification?.status === "rejected"
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}>
                  <div className="pt-0.5">
                    {tenant?.policeVerification?.status === "verified" && <CheckCircle className="w-6 h-6" />}
                    {tenant?.policeVerification?.status === "submitted" && <Clock3 className="w-6 h-6" />}
                    {tenant?.policeVerification?.status === "rejected" && <AlertTriangle className="w-6 h-6" />}
                    {(!tenant?.policeVerification?.status || tenant?.policeVerification?.status === "pending") && <FileWarning className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">
                      {tenant?.policeVerification?.status === "verified" && "Police Verification Stamped & Approved"}
                      {tenant?.policeVerification?.status === "submitted" && "Verification Receipt Pending Review"}
                      {tenant?.policeVerification?.status === "rejected" && "Verification Rejected - Re-submit Receipt"}
                      {(!tenant?.policeVerification?.status || tenant?.policeVerification?.status === "pending") && "Verification Receipt Required"}
                    </h4>
                    <p className="text-sm mt-1 opacity-90">
                      {tenant?.policeVerification?.status === "verified" && "Your local police reporting has been confirmed and fully registered."}
                      {tenant?.policeVerification?.status === "submitted" && "Receipt scan uploaded. Waiting for owner to confirm verification check."}
                      {tenant?.policeVerification?.status === "rejected" && "Uploaded receipt was invalid. Please upload the official stamped receipt again."}
                      {(!tenant?.policeVerification?.status || tenant?.policeVerification?.status === "pending") && "Please get the police tenant registration form stamped by your local station, scan it, and upload the receipt scan."}
                    </p>
                  </div>
                </div>

                {/* Download section */}
                <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 text-lg mb-3">Download Verification Templates</h3>
                  <p className="text-xs text-slate-600 mb-4">Select and print your state's template, fill it out, and submit to the local police station.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { city: "Delhi NCR Police Form", size: "1.2 MB" },
                      { city: "Karnataka / Bengaluru", size: "850 KB" },
                      { city: "Maharashtra / Mumbai", size: "1.1 MB" },
                      { city: "Haryana / Gurugram", size: "900 KB" }
                    ].map((form, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{form.city}</span>
                          <span className="text-[10px] text-slate-400">{form.size} • PDF Template</span>
                        </div>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); alert("Template downloading initiated..."); }}
                          className="mt-3 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-1.5 rounded-lg transition"
                        >
                          <Download className="w-3 h-3" /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload scan */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                  <form onSubmit={handlePoliceSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Police Station Receipt Scan *</label>
                      <p className="text-xs text-slate-500">Provide a high-quality scan/photo of the stamped registration copy.</p>

                      {policeReceiptUrl && (
                        <div className="pt-2">
                          <a href={policeReceiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium">
                            <Eye className="w-3.5 h-3.5" /> View Uploaded Receipt
                          </a>
                        </div>
                      )}

                      <div className="pt-2">
                        <input
                          type="file"
                          id="police-receipt-file"
                          accept="image/*,application/pdf"
                          disabled={tenant?.policeVerification?.status === "verified" || tenant?.policeVerification?.status === "submitted"}
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                      </div>
                    </div>

                    {policeMsg && (
                      <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {policeMsg}
                      </div>
                    )}

                    {(tenant?.policeVerification?.status !== "verified" && tenant?.policeVerification?.status !== "submitted") && (
                      <button
                        type="submit"
                        disabled={uploadingPolice}
                        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Upload className="w-5 h-5" />
                        {uploadingPolice ? "Uploading receipt..." : "Submit Receipt Form"}
                      </button>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* TAB 5: MOVEOUT */}
            {activeTab === "moveout" && (
              <div className="max-w-2xl mx-auto space-y-7">
                <div className="pb-5 border-b border-slate-100">
                  <WelcomeHeader firstName={firstName} subtitle="Here's your move-out request details." />
                </div>

                <Breadcrumb
                  items={[
                    { label: "Move-out Notice" },
                    { label: "Submit Exit Move-out Notice", active: true },
                  ]}
                />

                <MoveOutHero />

                {/* Status-based views */}
                {tenant?.moveoutRequest?.status === "pending" && (
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl text-blue-900 space-y-4 shadow-sm">
                    <div className="flex gap-3 items-start">
                      <Clock className="w-6 h-6 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-lg">Exit Notice Pending Review</h4>
                        <p className="text-sm mt-1 opacity-90">
                          Your checkout notice is submitted and is pending clearance approval from the property owner.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/80 rounded-xl p-4 border border-blue-100 space-y-2 text-sm text-slate-700">
                      <p><strong>Notice Submitted On:</strong> {formatDate(tenant.moveoutRequest.submittedAt)}</p>
                      <p><strong>Requested Checkout Date:</strong> {formatDate(tenant.moveoutRequest.requestedDate)}</p>
                      <p><strong>Exit Reason:</strong> {tenant.moveoutRequest.reason}</p>
                    </div>
                  </div>
                )}

                {tenant?.moveoutRequest?.status === "approved" && (
                  <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-emerald-950 space-y-4 shadow-sm">
                    <div className="flex gap-3 items-start">
                      <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-lg text-emerald-900">Exit Cleared & Approved</h4>
                        <p className="text-sm mt-1 opacity-90">
                          Your move-out check has been completed and approved by the owner. Your checkout details are:
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/80 rounded-xl p-4 border border-emerald-100 space-y-2.5 text-sm text-slate-800">
                      <p><strong>Final Checkout Date:</strong> {formatDate(tenant.moveoutRequest.requestedDate)}</p>
                      <p><strong>Outstanding Dues:</strong> {formatCurrency(tenant.moveoutRequest.duesAtMoveout)}</p>
                      <p><strong>Deposit Refund:</strong> {formatCurrency(tenant.moveoutRequest.refundAmount)}</p>
                      <p className="flex items-center gap-1.5">
                        <strong>Refund Status:</strong>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${tenant.moveoutRequest.refundStatus === "cleared" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                          {tenant.moveoutRequest.refundStatus === "cleared" ? "Refund Handed Over" : "Refund Pending"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {tenant?.moveoutRequest?.status === "rejected" && (
                  <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-rose-800 mb-6 flex items-start gap-4">
                    <div className="pt-0.5">
                      <XCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Exit Notice Rejected</h4>
                      <p className="text-sm mt-1 opacity-90">
                        Your checkout notice was rejected by the owner. Please contact your property manager to resolve.
                      </p>
                    </div>
                  </div>
                )}

                {(!tenant?.moveoutRequest || tenant?.moveoutRequest?.status === "none" || tenant?.moveoutRequest?.status === "rejected") && (
                  <>
                    <MoveOutForm
                      date={moveoutDate}
                      setDate={setMoveoutDate}
                      reason={moveoutReason}
                      setReason={setMoveoutReason}
                      msg={moveoutMsg}
                      submitting={submittingMoveout}
                      onSubmit={handleMoveoutSubmit}
                      minDate={new Date().toISOString().split("T")[0]}
                    />
                    <ImportantNoteCard />
                  </>
                )}
              </div>
            )}

            {/* TAB 6: FEEDBACK */}
            {activeTab === "feedback" && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Feedback & Ratings</h2>
                  <p className="text-slate-500 mt-1">Submit rating reviews of services, food quality, hygiene, and room experience.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                  <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Rating Category *</label>
                        <select
                          value={feedbackCategory}
                          onChange={(e) => setFeedbackCategory(e.target.value)}
                          className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold"
                        >
                          <option value="08SLWPS2629G1ZZ">Amenities & Facilities</option>
                          <option value="08SLWPS2629G1ZZ">Food & Mess Catering</option>
                          <option value="08SLWPS2629G1ZZ">Cleanliness & Hygiene</option>
                          <option value="08SLWPS2629G1ZZ">Staff & Warden Response</option>
                          <option value="08SLWPS2629G1ZZ">Other Services</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Star Rating *</label>
                        <div className="flex items-center gap-1.5 h-12">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFeedbackRating(star)}
                              className="focus:outline-none transition-transform active:scale-95"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill={star <= feedbackRating ? "#eab308" : "none"}
                                stroke={star <= feedbackRating ? "#eab308" : "#cbd5e1"}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-8 h-8 cursor-pointer"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                          ))}
                          <span className="text-sm font-bold text-slate-700 ml-2">({feedbackRating} / 5 Stars)</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Comments & Suggestions *</label>
                      <textarea
                        required
                        rows={4}
                        value={feedbackComments}
                        onChange={(e) => setFeedbackComments(e.target.value)}
                        placeholder="Detail your suggestions or complaints (e.g. Wi-Fi speed, cleaning schedule, food quality...)"
                        className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      ></textarea>
                    </div>

                    {feedbackMsg && (
                      <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700">
                        {feedbackMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingFeedback}
                      className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Star className="w-5 h-5" />
                      {submittingFeedback ? "Submitting review..." : "Submit Feedback"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: COMPLAINTS */}
            {activeTab === "complaints" && (
              <div className="max-w-5xl mx-auto space-y-9">
                <div className="space-y-3">
                  <WelcomeHeader firstName={firstName} subtitle="Here's your complaints & requests center." />
                  <Breadcrumb home items={[
                    { label: "Lodge Complaint", active: false },
                    { label: "Submit Complaint", active: true },
                  ]} />
                </div>

                <ComplaintHero />

                <div className="grid lg:grid-cols-2 gap-7 items-start">
                  <ComplaintForm
                    category={complaintCategory} setCategory={setComplaintCategory}
                    priority={complaintPriority} setPriority={setComplaintPriority}
                    desc={complaintDesc} setDesc={setComplaintDesc}
                    msg={complaintStatusMsg} busy={complaintBusy}
                    onSubmit={handleComplaintSubmit}
                  />
                  <ComplaintHistory complaints={myComplaints} />
                </div>
              </div>
            )}

            {/* TAB: VISITOR PASS */}
            {activeTab === "visitor" && (() => {
              const propertyAddress = tenant?.property?.address || tenant?.address || "";
              // Most recent request drives the right column (history is sorted newest-first).
              const latestPass = (myVisitors && myVisitors[0]) || null;
              const passStatus = latestPass?.status || null;
              const isApproved = passStatus === "Approved";
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              const verifyUrl = latestPass?.qrToken
                ? `${origin}/visitor-verify/${latestPass.qrToken}`
                : "";
              const fmtDay = (v) =>
                v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
              return (
                <div className="max-w-5xl mx-auto space-y-6">
                  <WelcomeHeader firstName={firstName} subtitle="Here's your visitor pass center." />
                  <Breadcrumb items={[
                    { label: "Visitor Pass", active: false },
                    { label: "Request Visitor Pass", active: true },
                  ]} />

                  <div className="grid lg:grid-cols-[52fr_48fr] gap-6 items-start">
                    {/* LEFT: form */}
                    <div className="space-y-5">
                      <VisitorHero />
                      <VisitorDetailsCard
                        visitorName={visitorName} setVisitorName={setVisitorName}
                        visitorPhone={visitorPhone} setVisitorPhone={setVisitorPhone}
                        visitorExpectedTime={visitorExpectedTime} setVisitorExpectedTime={setVisitorExpectedTime}
                        onSubmit={handleVisitorSubmit} busy={complaintBusy} msg={visitorMsg}
                      />
                      <VisitorNoteCard />
                    </div>

                    {/* RIGHT: approved pass, else status placeholder */}
                    <div>
                      {isApproved ? (
                        <VisitorPassCard
                          visitorName={latestPass.name}
                          visitorPhone={latestPass.phone}
                          tenantName={latestPass.hostName}
                          expectedTime={latestPass.expectedEntryTime}
                          propertyName={propertyName}
                          propertyAddress={propertyAddress}
                          passId={latestPass.passId}
                          passDate={fmtDay(latestPass.approvedAt)}
                          approvedBy={latestPass.approvedBy}
                          approvedByRole={latestPass.approvedByRole}
                          verifyUrl={verifyUrl}
                        />
                      ) : (
                        <VisitorPassStatusCard
                          status={passStatus}
                          visitorName={latestPass?.name}
                          requestedOn={fmtDay(latestPass?.createdAt)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* leave request tenant */}
            {/* TAB: LEAVE REQUEST */}
            {activeTab === "leave" && (
              <div className="max-w-5xl mx-auto space-y-9">
                <div className="space-y-3">
                  <WelcomeHeader firstName={firstName} subtitle="Here's your leave management center." />
                  <Breadcrumb items={[
                    { label: "Leave Request", active: false },
                    { label: "Submit Leave Request", active: true },
                  ]} />
                </div>

                <LeaveHero />

                <div className="grid lg:grid-cols-2 gap-7 items-start">
                  <LeaveForm
                    startDate={leaveStartDate} setStartDate={setLeaveStartDate}
                    endDate={leaveEndDate} setEndDate={setLeaveEndDate}
                    reason={leaveReason} setReason={setLeaveReason}
                    msg={leaveMsg} submitting={complaintBusy}
                    onSubmit={handleLeaveSubmit}
                    minDate={new Date().toISOString().split("T")[0]}
                  />
                  <LeaveHistory leaves={myLeaves} />
                </div>

                <LeaveNoteCard />
              </div>
            )}
          </main>
        </div>

        {/* Mobile-only bottom navigation (hidden on md+) */}
        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Pay Modal */}
      {payOpen ? (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setPayOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Make Payment</h3>
              <button onClick={() => setPayOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const isCurrent = paymentTarget === "current";
              const targetRentObj = isCurrent ? rent : prevMonthObj;
              const displayTotal = isCurrent ? totalPayable : (Number(selectedPrevMonthData?.due) || 0);
              const displayRoomRent = isCurrent ? roomRent : Number(selectedPrevMonthData?.roomRent || 0);
              const displayElectricity = isCurrent ? electricityCost : Number(selectedPrevMonthData?.electricity || 0);
              const displayPenalty = isCurrent ? totalPenalty : Number(selectedPrevMonthData?.penalty || 0);
              const targetIsPaid = isCurrent ? isPaid : (displayTotal <= 0 && !!targetRentObj);

              return (
                <>
                  <div className="text-center mb-8">
                    <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold">
                      {isCurrent ? "Total Payable (Current)" : `Total Payable (${targetRentObj?.billingMonth || 'Previous'})`}
                    </p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{formatCurrency(displayTotal)}</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 text-left">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Room Rent</span>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(displayRoomRent)}</span>
                      </div>
                      {displayElectricity > 0 && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-800">Electricity Bill</span>
                          <span className="text-sm font-bold text-blue-800 tabular-nums">{formatCurrency(displayElectricity)}</span>
                        </div>
                      )}
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-amber-800">Total Penalty</span>
                        <span className="text-sm font-bold text-amber-800 tabular-nums">{formatCurrency(displayPenalty)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={handleOnlinePayment}
                      disabled={actionBusy || targetIsPaid}
                      className="w-full p-4 border border-slate-200 rounded-xl flex items-center hover:border-blue-600 hover:bg-blue-50 transition group disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="w-5 h-5 mr-4 text-blue-600" />
                      <div className="text-left">
                        <span className="font-semibold text-slate-700">Pay Online</span>
                        <p className="text-xs text-slate-500">Cards • UPI • Wallets • Netbanking</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setCashPanelOpen(true); setActionMsg(""); }}
                      disabled={actionBusy || targetIsPaid || (!canRequestCash && !cashPanelOpen && isCurrent)}
                      className="w-full p-4 border border-slate-200 rounded-xl flex items-center hover:border-amber-500 hover:bg-amber-50 transition group disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <HandCoins className="w-5 h-5 mr-4 text-amber-600" />
                      <div className="text-left">
                        <span className="font-semibold text-slate-700">Pay by Cash</span>
                        <p className="text-xs text-slate-500">Request owner collection and verify OTP</p>
                      </div>
                    </button>

                    {(cashPanelOpen || !["NONE", "", "PENDING"].includes(targetNormalizedCashStatus)) && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                        <p className="font-semibold text-green-800">Cash workflow</p>

                        {((!targetIsPaid && !["PENDING_APPROVAL", "OWNER_APPROVED", "OTP_SENT", "VERIFIED"].includes(targetNormalizedCashStatus)) && targetNormalizedCashStatus !== "PENDING_APPROVAL") ? (
                          <div className="mt-2 text-green-700">
                            <p className="text-xs mb-2">You are about to request a cash collection. An OTP will be sent to the owner upon approval.</p>
                            <button
                              onClick={handleCashRequest}
                              disabled={actionBusy}
                              className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 text-sm disabled:opacity-60"
                            >
                              {actionBusy ? "Submitting Request..." : "Submit Cash Request"}
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-green-700 mt-2">
                              Status: <span className="font-semibold">{cashStatusLabel(targetCashRequestStatus)}</span>
                            </p>
                            {targetNormalizedCashStatus === "PENDING_APPROVAL" && (
                              <p className="text-xs text-green-700 mt-1">Cash payment request sent. Waiting for owner approval.</p>
                            )}
                            {["OWNER_APPROVED", "OTP_SENT"].includes(targetNormalizedCashStatus) && (
                              <p className="text-xs text-green-700 mt-1">Owner approved your cash payment. Enter the OTP to complete verification.</p>
                            )}
                            {targetNormalizedCashStatus === "PAID" && (
                              <p className="text-xs text-green-700 mt-1">Rent payment completed successfully.</p>
                            )}
                            {targetNormalizedCashStatus === "REJECTED" && (
                              <p className="text-xs text-rose-700 mt-1">The owner rejected this request. Please create a new cash request if needed.</p>
                            )}
                            {targetNormalizedCashStatus === "EXPIRED" && (
                              <p className="text-xs text-amber-700 mt-1">The OTP expired. Ask the owner to approve again.</p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    <div className={`${showCashOtp ? "" : "hidden"} p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3`}>
                      <p className="text-xs text-amber-800">
                        Owner approved the request. Enter the OTP shared by the owner to complete verification.
                      </p>
                      <input
                        value={cashOtp}
                        onChange={(e) => setCashOtp(e.target.value)}
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        className="w-full p-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                      <button
                        onClick={handleCashOtpVerify}
                        disabled={actionBusy || !cashOtp.trim()}
                        className="w-full bg-amber-600 text-white font-semibold py-2 rounded-lg hover:bg-amber-700 text-sm disabled:opacity-60"
                      >
                        Verify OTP and Mark Paid
                      </button>
                      <p className="text-xs text-amber-900 whitespace-pre-line">{actionMsg}</p>
                    </div>
                    {!cashPanelOpen && actionMsg ? <p className="text-xs text-slate-600 whitespace-pre-line">{actionMsg}</p> : null}
                  </div >
                </>
              );
            })()}
          </div>
        </div>
      ) : null
      }

      {/* Gate Management Modals */}
      {
        visitorModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setVisitorModalOpen(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setVisitorModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Generate Visitor Pass</h3>
              <form onSubmit={handleCreateVisitorPass} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Guest Name *</label>
                  <input type="text" value={visitorGuestName} onChange={e => setVisitorGuestName(e.target.value)} required className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Guest Phone *</label>
                  <input type="text" value={visitorGuestPhone} onChange={e => setVisitorGuestPhone(e.target.value)} required className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Visit Date *</label>
                  <input type="date" value={visitorDate} onChange={e => setVisitorDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <button type="submit" disabled={actionBusy} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2">
                  {actionBusy ? "Generating..." : "Generate Pass"}
                </button>
              </form>
            </div>
          </div>
        )
      }

      {
        leaveModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setLeaveModalOpen(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setLeaveModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Submit Leave Request</h3>
              <form onSubmit={handleCreateLeaveRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Departure *</label>
                    <input type="date" value={leaveDepartureDate} onChange={e => setLeaveDepartureDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Return *</label>
                    <input type="date" value={leaveReturnDate} onChange={e => setLeaveReturnDate(e.target.value)} required min={leaveDepartureDate || new Date().toISOString().split("T")[0]} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Leave *</label>
                  <textarea value={gateLeaveReason} onChange={e => setGateLeaveReason(e.target.value)} required rows="3" placeholder="e.g. Going home for holidays" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                </div>
                <button type="submit" disabled={actionBusy} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2">
                  {actionBusy ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>
          </div>
        )
      }

      {/* Generic Modal */}
      {
        genericModal ? (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={() => setGenericModal(null)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">{genericModal.title}</h3>
                <button onClick={() => setGenericModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>{genericModal.body}</div>
              <div className="mt-4 pt-4 border-t border-slate-100 text-right">
                {genericModal.footer || (
                  <button onClick={() => setGenericModal(null)} className="text-slate-500 text-sm hover:underline">
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null
      }

      {
        documentViewer ? (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={closeDocumentViewer}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{documentViewer.title}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                    {documentViewer.type === "receipt" ? "Bill Preview" : "Agreement Preview"}
                  </p>
                </div>
                <button onClick={closeDocumentViewer} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                {documentViewer.body}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                {documentViewer.type === "receipt" ? (
                  <button
                    onClick={() => {
                      const item = docs.find((d) => d.key === "receipt")?.rentItem;
                      if (item) downloadReceiptPdf(item);
                    }}
                    disabled={pdfBusy}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" />
                    {pdfBusy ? "Generating..." : "Download PDF"}
                  </button>
                ) : null}
                <button
                  onClick={closeDocumentViewer}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null
      }
      {/* Previous Month View Details Modal */}
      {
        prevMonthDetailModal && selectedPrevMonthData && (
          <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm"
            onClick={() => setPrevMonthDetailModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Pending Details</h3>
                <button onClick={() => setPrevMonthDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mb-6">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-1">Calculation for</p>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-wide">{selectedPrevMonthData.monthStr}</h4>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Room Rent</p>
                    <p className="text-[11px] text-slate-400">Base rent charge</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(selectedPrevMonthData.roomRent)}</span>
                </div>

                <div className="h-px w-full bg-slate-200"></div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Total Penalty</p>
                    <p className="text-[11px] text-slate-400">Accrued late fees</p>
                  </div>
                  <span className="text-sm font-bold text-amber-700 tabular-nums">{formatCurrency(selectedPrevMonthData.penalty)}</span>
                </div>

                <div className="h-px w-full bg-slate-200"></div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Electricity Bill</p>
                    <p className="text-[11px] text-slate-400">Monthly usage</p>
                  </div>
                  <span className="text-sm font-bold text-blue-700 tabular-nums">{formatCurrency(selectedPrevMonthData.electricity)}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">Total Payable</p>
                  <p className="text-xs text-slate-500 mt-0.5">Please clear to maintain lease.</p>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                  <span className="text-xl font-black text-indigo-700 tabular-nums">{formatCurrency(selectedPrevMonthData.due)}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setPrevMonthDetailModal(false)}
                  className="w-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-bold py-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 text-[14px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}



