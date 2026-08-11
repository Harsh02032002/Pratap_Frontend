import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle, XCircle, Search, Clock, FileText, Eye } from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";

export default function OwnerRequestsPage() {
  // Stable primitive read of the logged-in superadmin's ID — computed once,
  // not a fresh object every render (that previously caused an infinite
  // fetch loop via the useEffect dependency below).
  const adminLoginId = useMemo(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
      );
      return stored.loginId || stored.email || "";
    } catch {
      return "";
    }
  }, []);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");

  // confirmModal: { type: "approve" | "reject", request } | null — drives the
  // on-brand dialog that replaces window.confirm/prompt/alert below.
  const [confirmModal, setConfirmModal] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  // Request currently open in the read-only "previous vs requested" diff view.
  const [viewModal, setViewModal] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const statusParam = filter !== "All" ? `?status=${filter}` : "";
      const res = await fetch(`/api/owner-change-requests${statusParam}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminLoginId) fetchRequests();
  }, [adminLoginId, filter]);

  const openApprove = (request) => setConfirmModal({ type: "approve", request });
  const openReject = (request) => {
    setReason("");
    setConfirmModal({ type: "reject", request });
  };
  const closeModal = () => {
    if (submitting) return;
    setConfirmModal(null);
    setReason("");
  };

  const submitDecision = async () => {
    if (!confirmModal) return;
    const { type, request } = confirmModal;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/owner-change-requests/${request._id}/${type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "approve"
            ? { superadminLoginId: adminLoginId }
            : { superadminLoginId: adminLoginId, reason }
        )
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          type: "success",
          message: type === "approve" ? "Request approved — changes applied." : "Request rejected."
        });
        setConfirmModal(null);
        setReason("");
        fetchRequests();
      } else {
        setToast({ type: "error", message: data.message || `Failed to ${type} request.` });
      }
    } catch (err) {
      setToast({ type: "error", message: `Error ${type === "approve" ? "approving" : "rejecting"} request.` });
    } finally {
      setSubmitting(false);
    }
  };

  if (!adminLoginId) return null;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Owner Change Requests"
        subtitle="Review and approve property owner profile and bank detail updates."
        actions={
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {["Pending", "Approved", "Rejected", "All"].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === status ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {status}
              </button>
            ))}
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Owner ID</th>
                <th className="px-6 py-4">Request Type</th>
                <th className="px-6 py-4">Requested Changes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-slate-400">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-slate-400">No {filter.toLowerCase()} requests found.</td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{req.ownerLoginId}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${req.requestType === 'bank_details' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                        {req.requestType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 max-w-xs truncate" title={JSON.stringify(req.requestedChanges, null, 2)}>
                      {Object.keys(req.requestedChanges || {}).map(k => `${k}: ${req.requestedChanges[k]}`).join(", ")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setViewModal(req)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors" title="View details">
                        <Eye size={18} />
                      </button>
                      {req.status === "Pending" && (
                        <>
                          <button onClick={() => openApprove(req)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Approve">
                            <CheckCircle size={18} />
                          </button>
                          <button onClick={() => openReject(req)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Reject">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  confirmModal.type === "approve" ? "bg-emerald-50" : "bg-rose-50"
                }`}
              >
                {confirmModal.type === "approve" ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600" />
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                {confirmModal.type === "approve" ? "Approve this request?" : "Reject this request?"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {confirmModal.type === "approve" ? (
                  <>This immediately updates <span className="font-semibold text-slate-700">{confirmModal.request.ownerLoginId}</span>'s account with the changes below.</>
                ) : (
                  <>Let <span className="font-semibold text-slate-700">{confirmModal.request.ownerLoginId}</span> know why this request is being rejected.</>
                )}
              </p>

              {confirmModal.type === "approve" && confirmModal.request.requestedChanges && (
                <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 space-y-1.5">
                  {Object.entries(confirmModal.request.requestedChanges).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="capitalize text-slate-400">{k}</span>
                      <span className="font-semibold text-slate-700 text-right">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              {confirmModal.type === "reject" && (
                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Reason <span className="normal-case font-medium text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    autoFocus
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Documents unclear — please resubmit"
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitDecision}
                disabled={submitting}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-60 ${
                  confirmModal.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submitting ? "Saving..." : confirmModal.type === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setViewModal(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Requested Changes</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-semibold text-slate-700">{viewModal.ownerLoginId}</span>
                  {" · "}
                  {new Date(viewModal.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${
                viewModal.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                viewModal.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {viewModal.status}
              </span>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="rounded-lg border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[28%]">Field</th>
                      <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[36%]">Previous (unchanged)</th>
                      <th className="px-4 py-2.5 text-[10px] font-black text-emerald-600 uppercase tracking-wider">Owner Requested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(viewModal.requestedChanges || {})
                      .filter(([key]) => key !== 'checkinBankProofName')
                      .map(([key, newValue]) => {
                      const oldValue = viewModal.previousValues ? viewModal.previousValues[key] : undefined;
                      const hasOldValue = oldValue !== undefined && oldValue !== null && oldValue !== "";
                      const isDoc = key === 'checkinBankProof';
                      return (
                        <tr key={key}>
                          <td className="px-4 py-3 text-xs font-bold text-slate-500 uppercase align-top">{isDoc ? "Bank Proof" : key}</td>
                          <td className="px-4 py-3 text-sm text-slate-500 align-top break-words">
                            {isDoc
                              ? (hasOldValue ? <a href={oldValue} target="_blank" rel="noreferrer" className="text-primary underline">View previous</a> : <span className="italic text-slate-300">not set</span>)
                              : (hasOldValue ? String(oldValue) : <span className="italic text-slate-300">not set</span>)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-emerald-700 bg-emerald-50/40 align-top break-words">
                            {isDoc ? (
                              <a href={newValue} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 underline">
                                <FileText size={14} /> {viewModal.requestedChanges.checkinBankProofName || "View document"}
                              </a>
                            ) : String(newValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {viewModal.status === "Rejected" && viewModal.rejectionReason && (
                <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Rejection reason</span>
                  <p className="text-sm text-rose-700 mt-1">{viewModal.rejectionReason}</p>
                </div>
              )}

              {viewModal.status !== "Pending" && viewModal.reviewedBy && (
                <p className="text-xs text-slate-400 pt-1">
                  Reviewed by {viewModal.reviewedBy}
                  {viewModal.reviewedAt && ` on ${new Date(viewModal.reviewedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`}
                </p>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              {viewModal.status === "Pending" && (
                <>
                  <button
                    onClick={() => { openReject(viewModal); setViewModal(null); }}
                    className="py-2 px-4 rounded-lg text-sm font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => { openApprove(viewModal); setViewModal(null); }}
                    className="py-2 px-4 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    Approve
                  </button>
                </>
              )}
              <button
                onClick={() => setViewModal(null)}
                className="py-2 px-4 rounded-lg text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white ${
            toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
