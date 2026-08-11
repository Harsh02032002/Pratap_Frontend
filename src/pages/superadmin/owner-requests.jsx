import React, { useState, useEffect } from "react";
import SharedShell from "../../components/SharedShell";
import { useSuperadminLogin } from "./useSuperadminLogin";
import {
  CheckCircle, XCircle, Clock, ChevronDown, ChevronRight,
  User, Banknote, FileCheck2, ExternalLink, ImageOff
} from "lucide-react";

const cn = (...c) => c.filter(Boolean).join(" ");

/* ─── On-brand Toast ─────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: "bg-emerald-600 text-white",
    error:   "bg-rose-600 text-white",
    info:    "bg-slate-800 text-white",
  };

  return (
    <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold transition-all ${colors[type] || colors.info}`}>
      {type === "success" && <CheckCircle size={16} />}
      {type === "error"   && <XCircle size={16} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

/* ─── Confirm Modal ───────────────────────────────────────────── */
function ConfirmModal({ title, body, onConfirm, onCancel, confirmLabel = "Confirm", confirmClass = "bg-emerald-600 hover:bg-emerald-700 text-white" }) {
  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-black text-slate-800 mb-2">{title}</h3>
        {body && <p className="text-sm text-slate-500 mb-6">{body}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Reject Reason Modal ─────────────────────────────────────── */
function RejectModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-black text-slate-800 mb-2">Reject Request</h3>
        <p className="text-sm text-slate-500 mb-4">Provide a reason for rejection (optional).</p>
        <textarea
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none resize-none"
          rows={3}
          placeholder="e.g. Bank details are incorrect..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onCancel} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)} className="px-5 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Diff Table ──────────────────────────────────────────────── */
function DiffTable({ previous, requested }) {
  // Filter out bankProofUrl / bankProofName — shown separately as a thumbnail
  const SKIP_KEYS = new Set(["bankProofUrl", "bankProofName", "checkinBankProof", "checkinBankProofName"]);
  const keys = Array.from(
    new Set([...Object.keys(previous || {}), ...Object.keys(requested || {})])
  ).filter((k) => !SKIP_KEYS.has(k));

  if (keys.length === 0) return <p className="text-xs text-slate-400 italic">No field details available.</p>;

  return (
    <table className="w-full text-xs mt-2 border-collapse">
      <thead>
        <tr className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px]">
          <th className="px-3 py-2 text-left font-black border border-slate-100">Field</th>
          <th className="px-3 py-2 text-left font-black border border-slate-100 text-amber-600">Previous</th>
          <th className="px-3 py-2 text-left font-black border border-slate-100 text-emerald-600">Requested</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((k) => {
          const prev    = previous?.[k]  ?? "—";
          const req     = requested?.[k] ?? "—";
          const changed = String(prev) !== String(req);
          return (
            <tr key={k} className={changed ? "bg-yellow-50/50" : ""}>
              <td className="px-3 py-2 font-bold text-slate-600 border border-slate-100 capitalize">
                {k.replace(/checkin/gi, "").replace(/_/g, " ").trim() || k}
              </td>
              <td className={`px-3 py-2 font-medium border border-slate-100 ${changed ? "text-rose-500 line-through" : "text-slate-500"}`}>
                {String(prev)}
              </td>
              <td className={`px-3 py-2 font-bold border border-slate-100 ${changed ? "text-emerald-700" : "text-slate-500"}`}>
                {String(req)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ─── Bank Proof Preview ──────────────────────────────────────── */
function BankProofPreview({ url, name }) {
  const [imgError, setImgError] = useState(false);
  if (!url) return null;

  const isPDF = url.toLowerCase().includes(".pdf") || (name || "").toLowerCase().endsWith(".pdf");

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <FileCheck2 size={11} /> Bank Proof Document
      </p>
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <a href={url} target="_blank" rel="noopener noreferrer" className="group block shrink-0">
          <div className="size-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center hover:ring-2 hover:ring-blue-400 transition-all">
            {isPDF ? (
              <div className="flex flex-col items-center gap-1">
                <FileCheck2 className="size-7 text-rose-500" />
                <span className="text-[9px] font-bold text-rose-500 uppercase">PDF</span>
              </div>
            ) : imgError ? (
              <ImageOff className="size-7 text-slate-400" />
            ) : (
              <img
                src={url}
                alt="Bank proof"
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </a>

        <div className="flex-1 min-w-0">
          <p className="text-[11.5px] font-bold text-slate-700 truncate">{name || "Bank proof document"}</p>
          <p className="text-[10.5px] text-slate-400 mt-0.5">{isPDF ? "PDF document" : "Image"}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 text-[10.5px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink size={11} /> Open full document
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function OwnerRequestsPage() {
  const adminLoginId = useSuperadminLogin();

  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("Pending");
  const [expandedId,  setExpandedId]  = useState(null);

  // Modal state
  const [approveModal, setApproveModal] = useState(null); // req object
  const [rejectModal,  setRejectModal]  = useState(null); // req object
  const [toast,        setToast]        = useState(null); // { message, type }

  const showToast = (message, type = "info") => setToast({ message, type });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const statusParam = filter !== "All" ? `?status=${filter}` : "";
      const res  = await fetch(`/api/owner-change-requests${statusParam}`);
      const data = await res.json();
      if (data.success) setRequests(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminLoginId) fetchRequests();
  }, [adminLoginId, filter]);

  const handleApprove = async (req) => {
    try {
      const res  = await fetch(`/api/owner-change-requests/${req._id}/approve`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ superadminLoginId: adminLoginId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Request approved and changes applied successfully.", "success");
        fetchRequests();
      } else {
        showToast(data.message || "Failed to approve request.", "error");
      }
    } catch {
      showToast("Error approving request.", "error");
    } finally {
      setApproveModal(null);
    }
  };

  const handleReject = async (req, reason) => {
    try {
      const res  = await fetch(`/api/owner-change-requests/${req._id}/reject`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ superadminLoginId: adminLoginId, reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Request rejected.", "info");
        fetchRequests();
      } else {
        showToast(data.message || "Failed to reject request.", "error");
      }
    } catch {
      showToast("Error rejecting request.", "error");
    } finally {
      setRejectModal(null);
    }
  };

  if (!adminLoginId) return null;

  return (
    <SharedShell title="Owner Change Requests">
      {/* ── Modals ──────────────────────────────────────────── */}
      {approveModal && (
        <ConfirmModal
          title="Approve Change Request"
          body={`Approve and apply the profile/bank changes for owner ${approveModal.ownerLoginId}? This action cannot be undone.`}
          confirmLabel="Yes, Approve"
          onConfirm={() => handleApprove(approveModal)}
          onCancel={() => setApproveModal(null)}
        />
      )}
      {rejectModal && (
        <RejectModal
          onConfirm={(reason) => handleReject(rejectModal, reason)}
          onCancel={() => setRejectModal(null)}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Owner Change Requests</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Review and approve property owner profile and bank detail updates.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {["Pending", "Approved", "Rejected", "All"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter === status ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Owner ID</th>
                <th className="px-6 py-4">Request Type</th>
                <th className="px-6 py-4">Fields Changed</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 font-bold uppercase tracking-widest">
                    Loading requests…
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 font-bold uppercase tracking-widest">
                    No {filter.toLowerCase()} requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const isExpanded  = expandedId === req._id;
                  // Keys to show in the "Fields Changed" summary (exclude proof URLs)
                  const PROOF_KEYS  = new Set(["bankProofUrl", "bankProofName"]);
                  const changedKeys = Object.keys(req.requestedChanges || {}).filter((k) => !PROOF_KEYS.has(k));
                  const hasProof    = !!(req.bankProofUrl || req.requestedChanges?.bankProofUrl);
                  const proofUrl    = req.bankProofUrl  || req.requestedChanges?.bankProofUrl  || "";
                  const proofName   = req.bankProofName || req.requestedChanges?.bankProofName || "";

                  return (
                    <React.Fragment key={req._id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        {/* Expand toggle */}
                        <td className="pl-4 py-4">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : req._id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>

                        <td className="px-6 py-4 text-slate-800">{req.ownerLoginId}</td>

                        {/* Request type badge */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                            req.requestType === "bank_details"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-purple-50 text-purple-700 border border-purple-100"
                          )}>
                            {req.requestType === "bank_details" ? <Banknote size={11} /> : <User size={11} />}
                            {req.requestType.replace("_", " ")}
                          </span>
                        </td>

                        {/* Fields changed + proof badge */}
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          <span>
                            {changedKeys.slice(0, 3).join(", ")}
                            {changedKeys.length > 3 ? ` +${changedKeys.length - 3} more` : ""}
                          </span>
                          {hasProof && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                              <FileCheck2 size={9} /> Proof
                            </span>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                            req.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            req.status === "Rejected" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                            "bg-amber-50 text-amber-700 border border-amber-100"
                          )}>
                            {req.status === "Pending"  && <Clock size={11} />}
                            {req.status === "Approved" && <CheckCircle size={11} />}
                            {req.status === "Rejected" && <XCircle size={11} />}
                            {req.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {req.status === "Pending" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setApproveModal(req)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-all shadow-sm"
                              >
                                <CheckCircle size={12} /> Approve
                              </button>
                              <button
                                onClick={() => setRejectModal(req)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black rounded-lg transition-all"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reviewed</span>
                          )}
                        </td>
                      </tr>

                      {/* ── Expanded Diff Row ──────────────────────── */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-t border-slate-100">
                          <td colSpan={7} className="px-8 py-5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                              Previous vs. Requested Changes
                            </p>
                            <DiffTable previous={req.currentValues} requested={req.requestedChanges} />

                            {/* Bank proof thumbnail */}
                            {hasProof && (
                              <BankProofPreview url={proofUrl} name={proofName} />
                            )}

                            {/* Rejection reason */}
                            {req.rejectionReason && (
                              <div className="mt-3 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-medium text-rose-700">
                                <strong>Rejection Reason:</strong> {req.rejectionReason}
                              </div>
                            )}

                            {/* Reviewer info */}
                            {req.reviewedBy && req.reviewedAt && (
                              <p className="mt-2 text-[10px] text-slate-400 font-medium">
                                Reviewed by {req.reviewedBy} on{" "}
                                {new Date(req.reviewedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SharedShell>
  );
}
