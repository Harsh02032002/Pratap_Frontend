import React, { useEffect, useState } from "react";
import { RotateCcw, Search, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { fetchJson } from "../../utils/api";
import { Link } from "react-router-dom";

export default function RefundBookingPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/booking/refund-requests").catch(() => null);
      if (res?.data || Array.isArray(res)) {
        setRequests(res.data || res);
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
    loadRequests();
  }, []);

  const handleProcessRefund = async (reqId) => {
    if (!window.confirm("Are you sure you want to process full booking refund via PayU?")) return;
    setProcessingId(reqId);
    setMsg({ text: "", type: "" });
    try {
      const res = await fetchJson(`/api/booking/refund-request/${reqId}/process`, {
        method: "POST",
        body: JSON.stringify({ reason: "Full Booking Amount Refund" })
      });
      if (res?.success) {
        setMsg({ text: "✅ Booking refund processed successfully!", type: "success" });
        loadRequests();
      } else {
        setMsg({ text: res?.message || "Refund failed", type: "error" });
      }
    } catch (err) {
      setMsg({ text: err.message || "Failed to process refund", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = requests.filter(r => 
    String(r.user_name || r.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.booking_id || r._id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Booking Amount Refund</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Manage and process full booking cancellation refund requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/superadmin/accounting" className="px-4 py-1.5 text-[13px] font-semibold text-[#10242A] bg-white border border-[#CBD3D9] rounded-[8px] hover:bg-gray-50 transition-all flex items-center gap-2 shadow-xs">
            <ArrowLeft size={14} className="text-[#0E7C86]" /> Back to Accounting
          </Link>
        </div>
      </div>

      {msg.text && (
        <div className={`p-3 rounded-[12px] font-semibold text-[13px] border ${msg.type === "success" ? "bg-[#DDF3E4] text-[#14532D] border-[#B7E4C7]" : "bg-[#FDE8E8] text-[#991B1B] border-[#F8B4B4]"}`}>
          {msg.text}
        </div>
      )}

      {/* Outside Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9BA5]" size={16} />
          <input
            type="text"
            placeholder="Search by tenant name or booking ID..."
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
            Loading booking refund requests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[#4A5961]">
            No booking refund requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Booking ID</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant Name</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Amount</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 font-mono font-semibold text-[#0E7C86]">{r.booking_id || r._id}</td>
                    <td className="py-2.5 font-medium text-[#10242A]">{r.user_name || r.name || "Tenant"}</td>
                    <td className="py-2.5 text-[#4A5961]">{r.property_name || "Roomhy Property"}</td>
                    <td className="py-2.5 font-semibold text-[#10242A]">₹{r.amount || r.refund_amount || 0}</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                        r.status === "Approved" || r.status === "Refunded" ? "bg-[#DDF3E4] text-[#14532D]" :
                        r.status === "Rejected" ? "bg-[#FDE8E8] text-[#991B1B]" : "bg-[#FEF3C7] text-[#92400E]"
                      }`}>
                        {r.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {r.status === "Approved" || r.status === "Refunded" ? (
                        <span className="text-[12px] text-[#14532D] font-semibold inline-flex items-center justify-end gap-1">
                          <CheckCircle2 size={14} /> Refund Completed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleProcessRefund(r._id)}
                          disabled={processingId === r._id}
                          className="px-3 py-1 bg-[#0E7C86] hover:bg-[#095256] text-white font-semibold rounded-[6px] text-[12px] shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {processingId === r._id ? <Loader2 className="animate-spin" size={12} /> : <RotateCcw size={12} />}
                          Process Full Refund
                        </button>
                      )}
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
