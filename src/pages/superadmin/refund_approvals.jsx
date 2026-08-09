import React, { useEffect, useState } from "react";
import { ShieldCheck, Check, X, Search, Loader2, ArrowLeft } from "lucide-react";
import { fetchJson } from "../../utils/api";
import { Link } from "react-router-dom";

export default function RefundApprovalSystemPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionId, setActionId] = useState(null);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/booking/refund-requests").catch(() => null);
      if (res?.data || Array.isArray(res)) {
        setRequests((res.data || res).filter(r => r.status === "Pending" || r.status === "Open" || !r.status));
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleAction = async (id, newStatus) => {
    setActionId(id);
    try {
      await fetchJson(`/api/booking/refund-request/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      loadApprovals();
    } catch (err) {
      alert(err.message || "Failed to update refund status");
    } finally {
      setActionId(null);
    }
  };

  const filtered = requests.filter(r => 
    String(r.user_name || r.name || r.raised_by_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.booking_id || r._id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Refund Approval System</h1>
              <p className="text-sm text-gray-500">Approve or reject refund requests submitted by tenants or staff</p>
            </div>
          </div>

          <Link to="/superadmin/accounting" className="px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Accounting
          </Link>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search pending refund approval queue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-2" />
              Loading pending refund approval queue...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-medium">
              No pending refund approval requests in queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="p-4 pl-6">Request ID</th>
                    <th className="p-4">Tenant / Raised By</th>
                    <th className="p-4">Reason / Notes</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4 text-right pr-6">Decisions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-gray-900">{r._id}</td>
                      <td className="p-4 font-semibold text-gray-800">{r.user_name || r.name || r.raised_by_name || "Tenant"}</td>
                      <td className="p-4 text-gray-600 max-w-xs truncate">{r.reason || r.description || "N/A"}</td>
                      <td className="p-4 font-black text-amber-600">₹{r.amount || r.refund_amount || 0}</td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(r._id, "Approved")}
                            disabled={actionId === r._id}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleAction(r._id, "Rejected")}
                            disabled={actionId === r._id}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
