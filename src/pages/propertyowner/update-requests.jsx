import React, { useEffect, useRef, useState, useCallback } from "react";
import OwnerLayout from "../../components/OwnerLayout";
import { getOwnerSession } from "../../utils/ownerSession";
import { fetchJson } from "../../utils/api";
import { CheckCircle2, XCircle, Clock, Eye, FileText } from "lucide-react";

export default function UpdateRequests() {
  const owner = getOwnerSession();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [viewModal, setViewModal] = useState(null);

  // Debounce filter changes to prevent rapid API calls
  const debounceTimerRef = useRef(null);
  const fetchRequestsRef = useRef(null);

  const fetchRequests = useCallback(async (ownerLoginId, currentFilter) => {
    if (!ownerLoginId) return;
    setLoading(true);
    try {
      const statusParam = currentFilter !== "All" ? `?status=${currentFilter}&ownerLoginId=${encodeURIComponent(ownerLoginId)}` : `?ownerLoginId=${encodeURIComponent(ownerLoginId)}`;
      const data = await fetchJson(`/api/owner-change-requests${statusParam}`);
      setRequests(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  fetchRequestsRef.current = fetchRequests;

  useEffect(() => {
    if (!owner?.loginId) return;

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce filter changes by 300ms
    debounceTimerRef.current = setTimeout(() => {
      fetchRequestsRef.current(owner.loginId, filter);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filter, owner?.loginId]);

  const getRelativeTime = (date) => {
    if (!date) return "—";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <OwnerLayout
      title="Update Requests to Admin"
      subtitle="Every profile and bank-detail change you've asked Roomhy to approve."
    >
      <div className="flex justify-end mb-6">
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          {["Pending", "Approved", "Rejected", "All"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === status ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Requested Changes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-400">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-400">
                    {filter === "All" ? "No update requests found." : `No ${filter.toLowerCase()} requests found.`}
                  </td>
                </tr>
              ) : (
                requests.map(req => {
                  const status = req.status || "Pending";
                  const isApproved = status === "Approved";
                  const isRejected = status === "Rejected";
                  const badgeClass = isApproved
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : isRejected
                      ? "bg-rose-50 text-rose-700 border border-rose-100"
                      : "bg-amber-50 text-amber-700 border border-amber-100";
                  const Icon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock;
                  return (
                    <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · {getRelativeTime(req.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${req.requestType === 'bank_details' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                          {(req.requestType || "profile").replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600 max-w-xs truncate">
                        {Object.keys(req.requestedChanges || {}).map(k => `${k}: ${req.requestedChanges[k]}`).join(", ")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                          <Icon size={11} /> {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setViewModal(req)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors inline-flex" title="View details">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                      <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[36%]">Previous</th>
                      <th className="px-4 py-2.5 text-[10px] font-black text-emerald-600 uppercase tracking-wider">You Requested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(viewModal.requestedChanges || {})
                      .filter(([key]) => key !== 'checkinBankProofName')
                      .map(([key, newValue]) => {
                      const oldValue = viewModal.previousValues ? viewModal.previousValues[key] : (viewModal.currentValues ? viewModal.currentValues[key] : undefined);
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
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
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
    </OwnerLayout>
  );
}
