import React, { useEffect, useState } from "react";
import { Check, X, Search, Loader2, ArrowLeft } from "lucide-react";
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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Refund Approval System</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Approve or reject refund requests submitted by tenants or staff.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/superadmin/accounting" className="px-4 py-1.5 text-[13px] font-semibold text-[#10242A] bg-white border border-[#CBD3D9] rounded-[8px] hover:bg-gray-50 transition-all flex items-center gap-2 shadow-xs">
            <ArrowLeft size={14} className="text-[#0E7C86]" /> Back to Accounting
          </Link>
        </div>
      </div>

      {/* Outside Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9BA5]" size={16} />
          <input
            type="text"
            placeholder="Search pending refund approval queue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-8 text-center text-[13px] text-[#4A5961]">
            <Loader2 className="w-6 h-6 animate-spin text-[#0E7C86] mx-auto mb-2" />
            Loading pending refund approval queue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[#4A5961]">
            No pending refund approval requests in queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Request ID</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant / Raised By</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Reason / Notes</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Amount</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 font-mono font-semibold text-[#0E7C86]">{r._id}</td>
                    <td className="py-2.5 font-medium text-[#10242A]">{r.user_name || r.name || r.raised_by_name || "Tenant"}</td>
                    <td className="py-2.5 text-[#4A5961] max-w-xs truncate">{r.reason || r.description || "N/A"}</td>
                    <td className="py-2.5 font-semibold text-[#10242A]">₹{r.amount || r.refund_amount || 0}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAction(r._id, "Approved")}
                          disabled={actionId === r._id}
                          className="px-3 py-1 bg-[#14532D] hover:bg-[#166534] text-white font-semibold rounded-[6px] text-[12px] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(r._id, "Rejected")}
                          disabled={actionId === r._id}
                          className="px-3 py-1 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold rounded-[6px] text-[12px] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X size={12} /> Reject
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
  );
}
