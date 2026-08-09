import React, { useEffect, useState } from "react";
import { RotateCcw, Search, ShieldAlert, CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
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
    if (!window.confirm("Are you sure you want to process full booking refund via Cashfree?")) return;
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                <RotateCcw size={24} />
              </div>
              <h1 className="text-2xl font-black text-gray-900">Booking Amount Refund</h1>
            </div>
            <p className="text-sm text-gray-500">Manage and process full booking cancellation refund requests</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/superadmin/accounting" className="px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all flex items-center gap-2">
              <ArrowLeft size={16} /> Back to Accounting
            </Link>
          </div>
        </div>

        {msg.text && (
          <div className={`p-4 rounded-2xl font-medium text-sm border ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
            {msg.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by tenant name or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
              Loading booking refund requests...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No booking refund requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="p-4 pl-6">Booking ID</th>
                    <th className="p-4">Tenant Name</th>
                    <th className="p-4">Property</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-gray-900">{r.booking_id || r._id}</td>
                      <td className="p-4 font-semibold text-gray-800">{r.user_name || r.name || "Tenant"}</td>
                      <td className="p-4 text-gray-600">{r.property_name || "Roomhy Property"}</td>
                      <td className="p-4 font-black text-teal-600">₹{r.amount || r.refund_amount || 0}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          r.status === "Approved" || r.status === "Refunded" ? "bg-emerald-100 text-emerald-700" :
                          r.status === "Rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {r.status || "Pending"}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        {r.status === "Approved" || r.status === "Refunded" ? (
                          <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 size={16} /> Refund Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleProcessRefund(r._id)}
                            disabled={processingId === r._id}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 ml-auto"
                          >
                            {processingId === r._id ? <Loader2 className="animate-spin" size={14} /> : <RotateCcw size={14} />}
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
    </div>
  );
}
