import React, { useEffect, useState } from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Building2,
  MessageSquare,
  Repeat,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  Copy,
  Check,
  Phone,
  Mail,
  MapPin,
  Wallet,
  FileText,
  ExternalLink
} from "lucide-react";
import { fetchJson } from "../../utils/api";

export default function RefundVerificationModal({
  isOpen,
  onClose,
  requestId,
  bookingId,
  onUpdated
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dossier, setDossier] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState({ text: "", type: "" });
  const [copiedText, setCopiedText] = useState("");
  const [allocatingPropId, setAllocatingPropId] = useState(null);

  const loadDossier = async () => {
    if (!requestId && !bookingId) return;
    setLoading(true);
    setError("");
    setActionMsg({ text: "", type: "" });
    try {
      const endpoint = requestId
        ? `/api/booking/refund-request/${encodeURIComponent(requestId)}/dossier`
        : `/api/booking/verification-dossier/${encodeURIComponent(bookingId)}`;
      const res = await fetchJson(endpoint);
      setDossier(res?.data || res);
    } catch (err) {
      setError(err?.body?.message || err?.message || "Failed to load verification dossier");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (requestId || bookingId)) {
      setActiveTab("overview");
      loadDossier();
    }
  }, [isOpen, requestId, bookingId]);

  if (!isOpen) return null;

  const formatDateTime = (dt) => {
    if (!dt) return "N/A";
    try {
      const d = new Date(dt);
      if (isNaN(d.getTime())) return String(dt);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    } catch {
      return String(dt);
    }
  };

  const handleCopy = (val) => {
    if (!val) return;
    navigator.clipboard.writeText(String(val));
    setCopiedText(String(val));
    setTimeout(() => setCopiedText(""), 2000);
  };

  const refundReq = dossier?.refundRequest;
  const booking = dossier?.booking;
  const tenantInfo = dossier?.tenantInfo || {};
  const paymentHistory = dossier?.paymentHistory || {};
  const owner = dossier?.ownerKacchaChitha;
  const propDetails = dossier?.propertyDetails;
  const assignedEmp = dossier?.assignedEmployee;
  const onboarding = dossier?.onboardingCheck || { verificationStatus: "unavailable", isOnboarded: false, records: [] };
  const chatHistory = dossier?.chatHistory || { totalMessages: 0, messages: [] };
  const recommendedAlts = dossier?.recommendedAlternatives || [];

  const targetReqId = refundReq?._id || requestId;

  const handleStatusUpdate = async (newStatus) => {
    if (!targetReqId) return;
    setActionLoading(true);
    setActionMsg({ text: "", type: "" });
    try {
      await fetchJson(`/api/booking/refund-request/${targetReqId}/status`, {
        method: "PUT",
        body: JSON.stringify({ refund_status: newStatus.toLowerCase(), status: newStatus })
      });
      setActionMsg({ text: `Request status updated to ${newStatus}!`, type: "success" });
      await loadDossier();
      if (onUpdated) onUpdated();
    } catch (err) {
      setActionMsg({ text: err?.body?.message || err?.message || "Failed to update status", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPayURefund = async () => {
    if (!targetReqId) return;
    if (!window.confirm("Process full booking refund via PayU gateway?")) return;
    setActionLoading(true);
    setActionMsg({ text: "", type: "" });
    try {
      const res = await fetchJson(`/api/booking/refund-request/${targetReqId}/process`, {
        method: "POST",
        body: JSON.stringify({ reason: "Verified by Staff / SuperAdmin" })
      });
      setActionMsg({
        text: res?.message || "Refund processed successfully!",
        type: "success"
      });
      await loadDossier();
      if (onUpdated) onUpdated();
    } catch (err) {
      setActionMsg({
        text: err?.body?.message || err?.message || "Failed to process PayU refund",
        type: "error"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAllocateAlternative = async (prop) => {
    if (!targetReqId) {
      setActionMsg({ text: "No refund/alternative request ID linked to allocate.", type: "error" });
      return;
    }
    const propId = prop.property_id || prop.propertyId || prop._id;
    const propTitle = prop.property_name || prop.title || "Selected Property";
    setAllocatingPropId(String(propId));
    setActionMsg({ text: "", type: "" });
    try {
      const res = await fetchJson(`/api/booking/refund-request/${targetReqId}/allocate-alternative`, {
        method: "POST",
        body: JSON.stringify({
          propertyId: propId,
          propertyName: propTitle,
          ownerId: prop.owner_id || prop.ownerLoginId || "",
          ownerName: prop.owner_name || prop.ownerName || "",
          notes: "Allocated after verification"
        })
      });
      setActionMsg({
        text: res?.message || `Allocated ${propTitle} successfully!`,
        type: "success"
      });
      await loadDossier();
      if (onUpdated) onUpdated();
    } catch (err) {
      setActionMsg({
        text: err?.body?.message || err?.message || "Failed to allocate alternative property",
        type: "error"
      });
    } finally {
      setAllocatingPropId(null);
    }
  };

  const currentStatus = String(refundReq?.refund_status || refundReq?.status || "pending").toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-2xl border border-[#E1E6EA] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header (Strictly Light Theme) */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#F0FDFA] via-[#F8FAFC] to-[#EFF6FF] border-b border-[#E1E6EA] flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]">
                Complete Verification Dossier
              </span>
              {refundReq?.request_type && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  refundReq.request_type === "alternative_property"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  {refundReq.request_type === "alternative_property" ? "🔄 Alternative Property Request" : "💸 Refund Request"}
                </span>
              )}
              {assignedEmp?.loginId && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  Assigned Emp: {assignedEmp.name || assignedEmp.loginId} ({assignedEmp.loginId})
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#10242A] mt-1">
              Booking & Owner Verification ("Kaccha Chitha")
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white hover:bg-gray-100 text-[#4A5961] border border-[#CBD3D9] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-14 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0E7C86] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#4A5961]">
              Fetching payment timeline, Owner Kaccha Chitha, onboarding status & chat history...
            </p>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <ShieldAlert size={24} />
            </div>
            <p className="text-sm font-bold text-red-700">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        ) : dossier ? (
          <>
            {/* Onboarding Fraud Check Banner */}
            <div className="px-6 pt-4">
              {onboarding.verificationStatus !== "verified" ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="text-xs font-bold block">Unable to Verify Onboarding</span>
                  <p className="text-[11px] mt-1">Onboarding could not be verified for this property and owner. Retry verification before making a decision.</p>
                </div>
              ) : onboarding.isOnboarded ? (
                <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={24} />
                    <div>
                      <h3 className="text-sm font-extrabold text-red-900 uppercase tracking-wide">
                        ⚠️ TENANT IS ALREADY ONBOARDED AT THIS PROPERTY
                      </h3>
                      <p className="text-xs text-red-800 mt-0.5">
                        Completed tenant onboarding was found for this property and owner. Review the records before approving a refund.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {onboarding.records.map((rec, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-red-200 text-[11px] font-bold text-red-900"
                          >
                            ID: {rec.loginId || "N/A"} | {rec.propertyTitle} | Room {rec.roomNo || "-"} ({rec.bedNo || "-"}) | Move-in: {formatDateTime(rec.moveInDate)} | Status: {rec.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="text-emerald-600 shrink-0" size={20} />
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        ✅ No completed onboarding found for this property and owner
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        Checked tenant identity, property, owner, room assignment, active status, and onboarding completion.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {actionMsg.text && (
              <div className="px-6 pt-3">
                <div
                  className={`p-3 rounded-xl text-xs font-bold border ${
                    actionMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {actionMsg.text}
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="px-6 pt-4 border-b border-[#E1E6EA] flex gap-2 overflow-x-auto bg-white">
              {[
                { id: "overview", label: "Payment & Timeline", icon: CreditCard },
                { id: "owner", label: "Owner Kaccha Chitha", icon: Building2 },
                {
                  id: "chat",
                  label: `Chat History (${chatHistory.totalMessages || 0})`,
                  icon: MessageSquare
                },
                {
                  id: "alternatives",
                  label: `Alternative Stay & Actions`,
                  icon: Repeat
                }
              ].map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                      active
                        ? "border-[#0E7C86] text-[#0E7C86] bg-[#F0FDFA]"
                        : "border-transparent text-[#4A5961] hover:text-[#10242A] hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={15} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#F8FAFC]">
              {/* TAB 1: PAYMENT & TIMELINE */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* Top Summary KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="bg-white p-4 rounded-xl border border-[#E1E6EA] shadow-2xs">
                      <span className="text-[11px] font-bold uppercase text-[#4A5961] block">Official Booking ID</span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="font-mono text-xs font-extrabold text-[#0E7C86] break-all">
                          {booking?.booking_id || booking?._id || refundReq?.booking_id || "N/A"}
                        </span>
                        <button
                          onClick={() => handleCopy(booking?.booking_id || booking?._id || refundReq?.booking_id)}
                          className="p-1 text-[#0E7C86] hover:bg-teal-50 rounded"
                        >
                          {copiedText === String(booking?.booking_id || booking?._id || refundReq?.booking_id) ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E1E6EA] shadow-2xs">
                      <span className="text-[11px] font-bold uppercase text-[#4A5961] block">Amount Paid</span>
                      <span className="text-lg font-extrabold text-[#10242A] mt-1 block">
                        ₹{Number(paymentHistory.paidAmount || refundReq?.refund_amount || booking?.payment_amount || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        Status: {String(paymentHistory.paymentStatus || booking?.payment_status || "paid").toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E1E6EA] shadow-2xs">
                      <span className="text-[11px] font-bold uppercase text-[#4A5961] block">Exact Payment Date & Time</span>
                      <span className="text-xs font-bold text-[#10242A] mt-1 block">
                        {formatDateTime(paymentHistory.paidAt || booking?.payment_completed_at || booking?.created_at)}
                      </span>
                      <span className="text-[11px] text-[#4A5961]">
                        Tx ID: {paymentHistory.paymentId || refundReq?.payment_id || "N/A"}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E1E6EA] shadow-2xs">
                      <span className="text-[11px] font-bold uppercase text-[#4A5961] block">Paid Out To Owner?</span>
                      <span className={`text-xs font-extrabold mt-1 inline-block px-2 py-0.5 rounded ${
                        paymentHistory.payoutStatus === "completed" || paymentHistory.payoutStatus === "paid"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {String(paymentHistory.payoutStatus || "not_paid_out").toUpperCase()}
                      </span>
                      <span className="text-[11px] text-[#4A5961] block mt-1">
                        Owner Share: ₹{Number(paymentHistory.ownerPayoutAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Tenant Info & Refund Bank/UPI Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-[#E1E6EA] space-y-3">
                      <h3 className="text-sm font-bold text-[#10242A] border-b border-gray-100 pb-2 flex items-center gap-2">
                        <UserCheck size={16} className="text-[#0E7C86]" /> Tenant & Request Details
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#4A5961] block">Tenant Name</span>
                          <span className="font-bold text-[#10242A]">{tenantInfo.name || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#4A5961] block">Phone Number</span>
                          <span className="font-bold text-[#10242A]">{tenantInfo.phone || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#4A5961] block">Email Address</span>
                          <span className="font-bold text-[#10242A] break-all">{tenantInfo.email || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#4A5961] block">User ID</span>
                          <span className="font-mono font-semibold text-[#10242A]">{tenantInfo.userId || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#4A5961] block">Payment Link Sent At</span>
                          <span className="font-semibold text-[#10242A]">{formatDateTime(paymentHistory.paymentLinkSentAt)}</span>
                        </div>
                        <div>
                          <span className="text-[#4A5961] block">Refund Requested At</span>
                          <span className="font-semibold text-[#10242A]">{formatDateTime(refundReq?.created_at)}</span>
                        </div>
                      </div>
                      {(refundReq?.property_requirements || refundReq?.preferred_area) && (
                        <div className="pt-2 border-t border-gray-100 text-xs">
                          <span className="text-[#4A5961] font-semibold block">Tenant's Reason / Preferred Area:</span>
                          <p className="text-[#10242A] font-medium mt-0.5">
                            {refundReq.preferred_area ? `Preferred Area: ${refundReq.preferred_area} — ` : ""}
                            {refundReq.property_requirements || "No additional notes"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-[#E1E6EA] space-y-3">
                      <h3 className="text-sm font-bold text-[#10242A] border-b border-gray-100 pb-2 flex items-center gap-2">
                        <Wallet size={16} className="text-[#0E7C86]" /> Tenant's Refund Destination & Property
                      </h3>
                      {refundReq ? (
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[#4A5961] block">Request Type</span>
                            <span className="font-bold text-[#10242A] uppercase">
                              {String(refundReq.request_type || "refund").replace("_", " ")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#4A5961] block">Refund Method</span>
                            <span className="font-bold text-[#10242A] uppercase">{refundReq.refund_method || "N/A"}</span>
                          </div>
                          {refundReq.upi_id && (
                            <div className="col-span-2 bg-teal-50 p-2.5 rounded-lg border border-teal-200">
                              <span className="text-teal-700 font-bold block text-[10px] uppercase">Tenant UPI ID</span>
                              <span className="font-mono font-bold text-teal-950">{refundReq.upi_id}</span>
                            </div>
                          )}
                          {refundReq.bank_account_number && (
                            <div className="col-span-2 bg-blue-50 p-2.5 rounded-lg border border-blue-200 space-y-1">
                              <span className="text-blue-700 font-bold block text-[10px] uppercase">Tenant Bank Account</span>
                              <p className="font-bold text-blue-950">
                                {refundReq.bank_account_holder} — {refundReq.bank_name}
                              </p>
                              <p className="font-mono text-xs text-blue-900">
                                A/C: {refundReq.bank_account_number} | IFSC: {refundReq.bank_ifsc_code}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-[#4A5961] block">Disliked / Booked Property</span>
                            <span className="font-bold text-[#10242A]">
                              {propDetails?.title || booking?.property_name || refundReq?.property_name || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#4A5961] block">Owner</span>
                            <span className="font-bold text-[#10242A]">
                              {owner?.name || booking?.owner_name || refundReq?.owner_name || "N/A"} ({owner?.loginId || booking?.owner_id || "N/A"})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#4A5961]">
                          No refund request submitted yet for this Booking ID. Showing live booking & payment verification dossier.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* All Payment Transactions Table */}
                  <div className="bg-white p-5 rounded-xl border border-[#E1E6EA]">
                    <h3 className="text-sm font-bold text-[#10242A] mb-3 flex items-center gap-2">
                      <Clock size={16} className="text-[#0E7C86]" /> Recorded Gateway Transactions ({paymentHistory.allTransactions?.length || 0})
                    </h3>
                    {(!paymentHistory.allTransactions || paymentHistory.allTransactions.length === 0) ? (
                      <p className="text-xs text-[#4A5961]">No separate gateway transaction rows found; payment details resolved from booking record.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 text-[#4A5961]">
                              <th className="py-2">Order ID</th>
                              <th className="py-2">Payment ID</th>
                              <th className="py-2">Type</th>
                              <th className="py-2">Amount</th>
                              <th className="py-2">Status</th>
                              <th className="py-2">Paid At</th>
                              <th className="py-2">Payout Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paymentHistory.allTransactions.map((tx) => (
                              <tr key={tx._id}>
                                <td className="py-2 font-mono font-semibold text-[#0E7C86]">{tx.order_id}</td>
                                <td className="py-2 font-mono">{tx.cf_payment_id || "-"}</td>
                                <td className="py-2 capitalize">{tx.payment_type || "booking"}</td>
                                <td className="py-2 font-bold">₹{Number(tx.booking_amount || 0).toLocaleString("en-IN")}</td>
                                <td className="py-2 uppercase font-bold text-emerald-700">{tx.payment_status}</td>
                                <td className="py-2">{formatDateTime(tx.paid_at || tx.createdAt)}</td>
                                <td className="py-2 uppercase font-semibold">{tx.payout_status || "not_ready"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: OWNER KACCHA CHITHA */}
              {activeTab === "owner" && (
                <div className="space-y-5">
                  {!owner ? (
                    <div className="bg-white p-8 rounded-xl border border-[#E1E6EA] text-center text-xs text-[#4A5961]">
                      Owner profile could not be resolved for this booking.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Owner Personal & Contact Profile */}
                        <div className="bg-white p-5 rounded-xl border border-[#E1E6EA] space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h3 className="text-sm font-bold text-[#10242A]">Owner Identity & Contact</h3>
                            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono text-xs font-bold">
                              {owner.loginId}
                            </span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#4A5961]">Full Name:</span>
                              <span className="font-bold text-[#10242A]">{owner.name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#4A5961]">Phone:</span>
                              <span className="font-bold text-[#10242A]">{owner.phone || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#4A5961]">Email:</span>
                              <span className="font-bold text-[#10242A] break-all">{owner.email || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#4A5961]">Area / City:</span>
                              <span className="font-semibold text-[#10242A]">{owner.area || owner.locationCode || "N/A"}</span>
                            </div>
                            <div className="pt-1 border-t border-gray-100">
                              <span className="text-[#4A5961] block">Address:</span>
                              <span className="font-medium text-[#10242A]">{owner.address || "N/A"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Owner KYC & Bank Details */}
                        <div className="bg-white p-5 rounded-xl border border-[#E1E6EA] space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h3 className="text-sm font-bold text-[#10242A]">KYC & Bank Details</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              owner.kycStatus === "verified" || owner.kycStatus === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}>
                              KYC: {owner.kycStatus || "pending"}
                            </span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#4A5961]">Aadhar No:</span>
                              <span className="font-mono font-bold text-[#10242A]">{owner.aadharNumber || "Not Linked"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#4A5961]">PAN Card:</span>
                              <span className="font-mono font-bold text-[#10242A]">{owner.panNumber || "Not Linked"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#4A5961]">Bank Name:</span>
                              <span className="font-semibold text-[#10242A]">{owner.bankDetails?.bankName || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#4A5961]">Account No:</span>
                              <span className="font-mono font-bold text-[#10242A]">{owner.bankDetails?.accountNumber || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#4A5961]">IFSC Code:</span>
                              <span className="font-mono font-semibold text-[#10242A]">{owner.bankDetails?.ifscCode || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#4A5961]">Owner UPI ID:</span>
                              <span className="font-mono font-bold text-teal-700">{owner.bankDetails?.upiId || "N/A"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Wallet, Stats & Assigned Area Employee */}
                        <div className="bg-white p-5 rounded-xl border border-[#E1E6EA] space-y-3">
                          <h3 className="text-sm font-bold text-[#10242A] border-b border-gray-100 pb-2">
                            Portfolio & Assigned Employee
                          </h3>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-100">
                              <span className="text-[10px] font-bold text-teal-700 uppercase block">Wallet</span>
                              <span className="text-sm font-extrabold text-teal-950">
                                ₹{Number(owner.walletBalance || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                              <span className="text-[10px] font-bold text-blue-700 uppercase block">Properties</span>
                              <span className="text-sm font-extrabold text-blue-950">{owner.totalPropertiesCount || 0}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                              <span className="text-[10px] font-bold text-purple-700 uppercase block">Tenants</span>
                              <span className="text-sm font-extrabold text-purple-950">{owner.totalActiveTenantsCount || 0}</span>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-200 text-xs space-y-1">
                            <span className="text-[10px] font-bold uppercase text-purple-700 block">
                              Scoped Area Employee (Under Whom Owner Falls)
                            </span>
                            <p className="font-bold text-purple-950">
                              {assignedEmp?.name || "Unassigned"} {assignedEmp?.loginId ? `(${assignedEmp.loginId})` : ""}
                            </p>
                            {assignedEmp?.phone && <p className="text-purple-800">Phone: {assignedEmp.phone}</p>}
                            {assignedEmp?.email && <p className="text-purple-800">Email: {assignedEmp.email}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Owner's Properties List */}
                      {owner.properties?.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-[#E1E6EA]">
                          <h3 className="text-sm font-bold text-[#10242A] mb-3">
                            All Properties Under This Owner ({owner.properties.length})
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {owner.properties.map((p, idx) => (
                              <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-gray-50/60 text-xs">
                                <p className="font-bold text-[#10242A]">{p.title}</p>
                                <p className="text-[#4A5961]">{p.area}{p.city ? `, ${p.city}` : ""}</p>
                                <p className="font-semibold text-[#0E7C86] mt-1">
                                  Rent: ₹{Number(p.monthlyRent || 0).toLocaleString("en-IN")}/mo | Status: {p.status || "active"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: CHAT HISTORY */}
              {activeTab === "chat" && (
                <div className="bg-white p-5 rounded-xl border border-[#E1E6EA] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#10242A] flex items-center gap-2">
                        <MessageSquare size={16} className="text-[#0E7C86]" /> Complete Chat Transcript (Tenant ↔ Owner)
                      </h3>
                      <p className="text-xs text-[#4A5961]">
                        Verify what was promised in chat, when the booking payment link was sent, and any issues raised by the tenant.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {chatHistory.totalMessages || 0} Messages
                    </span>
                  </div>

                  {(!chatHistory.messages || chatHistory.messages.length === 0) ? (
                    <div className="py-10 text-center text-xs text-[#4A5961]">
                      No chat messages found between this tenant and owner.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                      {chatHistory.messages.map((m) => {
                        const isOwnerMsg =
                          owner?.loginId &&
                          String(m.from || "").toUpperCase() === String(owner.loginId).toUpperCase();
                        return (
                          <div
                            key={m._id}
                            className={`p-3.5 rounded-xl border text-xs ${
                              m.isBookingPaymentLink
                                ? "bg-amber-50 border-amber-300"
                                : isOwnerMsg
                                ? "bg-teal-50/60 border-teal-200 ml-4 sm:ml-10"
                                : "bg-white border-gray-200 mr-4 sm:mr-10"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-[#10242A]">
                                {isOwnerMsg ? `🏠 Owner (${m.from})` : `👤 Tenant (${m.from})`} → {m.to}
                              </span>
                              <span className="text-[11px] text-[#4A5961]">{formatDateTime(m.timestamp)}</span>
                            </div>
                            {m.isBookingPaymentLink && (
                              <span className="inline-block mb-1 px-2 py-0.5 rounded bg-amber-200 text-amber-950 text-[10px] font-extrabold uppercase">
                                💳 Booking Payment Link Sent in Chat
                              </span>
                            )}
                            <p className="text-[#10242A] whitespace-pre-wrap leading-relaxed">{m.text}</p>
                            {m.isMasked && m.originalUnmaskedText && (
                              <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-[11px] text-red-900">
                                <strong>🔓 Decrypted Original (Masked in Chat):</strong> {m.originalUnmaskedText}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ALTERNATIVE STAY ALLOCATION & REFUND ACTIONS */}
              {activeTab === "alternatives" && (
                <div className="space-y-5">
                  {/* Allocated Alternative Property Banner if already allocated */}
                  {refundReq?.allocated_alternative_property?.property_id && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-blue-700 block">
                          ✅ Allocated Alternative Property
                        </span>
                        <h4 className="text-sm font-bold text-blue-950">
                          {refundReq.allocated_alternative_property.property_name} (ID: {refundReq.allocated_alternative_property.property_id})
                        </h4>
                        <p className="text-xs text-blue-800">
                          Allocated by {refundReq.allocated_alternative_property.allocated_by} on{" "}
                          {formatDateTime(refundReq.allocated_alternative_property.allocated_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tenant's Selected Alternative Properties */}
                  {refundReq?.selected_alternative_properties?.length > 0 && (
                    <div className="bg-white p-5 rounded-xl border border-blue-200 space-y-3">
                      <h3 className="text-sm font-bold text-blue-950">
                        ⭐ Tenant's Preferred Alternative Stays ({refundReq.selected_alternative_properties.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {refundReq.selected_alternative_properties.map((prop, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between gap-3"
                          >
                            <div className="text-xs">
                              <span className="text-[10px] font-bold uppercase text-blue-700 block">Tenant Selected #{idx + 1}</span>
                              <p className="font-bold text-[#10242A]">{prop.property_name}</p>
                              <p className="text-[#4A5961]">{prop.area}{prop.city ? `, ${prop.city}` : ""}</p>
                              <p className="font-bold text-[#0E7C86]">₹{Number(prop.monthly_rent || 0).toLocaleString("en-IN")}/mo</p>
                            </div>
                            {targetReqId && (
                              <button
                                onClick={() => handleAllocateAlternative(prop)}
                                disabled={allocatingPropId === String(prop.property_id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                              >
                                {allocatingPropId === String(prop.property_id) ? "Allocating..." : "Allocate Stay"}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System Recommended Alternatives */}
                  <div className="bg-white p-5 rounded-xl border border-[#E1E6EA] space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#10242A]">
                        Recommended Alternative Properties in Area ({recommendedAlts.length})
                      </h3>
                      <p className="text-xs text-[#4A5961]">
                        You can directly allocate any matching property below to transfer this tenant's booking.
                      </p>
                    </div>

                    {recommendedAlts.length === 0 ? (
                      <p className="text-xs text-[#4A5961]">No alternative properties found in the database.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recommendedAlts.map((prop) => {
                          const propId = String(prop.propertyId || prop._id);
                          return (
                            <div
                              key={propId}
                              className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between gap-3 text-xs"
                            >
                              <div className="flex gap-2.5">
                                <img
                                  src={prop.thumbnail || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80"}
                                  alt={prop.title}
                                  className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-200"
                                />
                                <div className="min-w-0">
                                  <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 mb-0.5">
                                    {prop.matchReason || "Recommended"}
                                  </span>
                                  <p className="font-bold text-[#10242A] truncate">{prop.title}</p>
                                  <p className="text-[#4A5961] truncate">{prop.area}, {prop.city}</p>
                                  <p className="font-bold text-[#0E7C86]">₹{Number(prop.monthlyRent || 0).toLocaleString("en-IN")}/mo</p>
                                </div>
                              </div>
                              {targetReqId && (
                                <button
                                  onClick={() => handleAllocateAlternative(prop)}
                                  disabled={allocatingPropId === propId}
                                  className="w-full py-1.5 bg-white hover:bg-teal-50 text-[#0E7C86] border border-[#0E7C86] rounded-lg font-bold transition cursor-pointer"
                                >
                                  {allocatingPropId === propId ? "Allocating..." : "Allocate This Property"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Bar */}
            <div className="px-6 py-4 bg-white border-t border-[#E1E6EA] flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[#4A5961]">
                Current Status:{" "}
                <span className="font-extrabold uppercase text-[#10242A]">{currentStatus}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {targetReqId && currentStatus !== "processed" && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate("Approved")}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Approve Request
                    </button>
                    <button
                      onClick={() => handleStatusUpdate("Rejected")}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <XCircle size={14} /> Reject Request
                    </button>
                    <button
                      onClick={handleProcessPayURefund}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-[#0E7C86] hover:bg-[#095256] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw size={14} /> Process PayU Refund
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#10242A] rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
