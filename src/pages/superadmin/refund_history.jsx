import React, { useEffect, useState } from "react";
import {
  Search,
  Loader2,
  ArrowLeft,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Repeat,
  FileSearch
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { Link, useLocation } from "react-router-dom";
import RefundVerificationModal from "../../components/refund/RefundVerificationModal";

export default function RefundHistoryPage() {
  const location = useLocation();
  const isEmployeePanel = location.pathname.startsWith("/employee");
  const backPath = isEmployeePanel ? "/employee/accounting" : "/superadmin/accounting";

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lookupBookingId, setLookupBookingId] = useState("");
  const [modalState, setModalState] = useState({
    isOpen: false,
    requestId: null,
    bookingId: null
  });

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/booking/refund-requests").catch(() => null);
      if (res?.data || Array.isArray(res)) {
        setHistory(res.data || res);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleTrackByBookingId = (e) => {
    e.preventDefault();
    const trimmed = lookupBookingId.trim();
    if (!trimmed) return;
    setModalState({
      isOpen: true,
      requestId: null,
      bookingId: trimmed
    });
  };

  const formatDateTime = (dt) => {
    if (!dt) return "N/A";
    try {
      const d = new Date(dt);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "N/A";
    }
  };

  const filtered = history.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      String(r.user_name || r.name || "").toLowerCase().includes(q) ||
      String(r.booking_id || r._id || "").toLowerCase().includes(q) ||
      String(r.owner_name || r.owner_id || "").toLowerCase().includes(q) ||
      String(r.property_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">
            Refund & Alternative Stay Audit Log
          </h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">
            Complete audit trail of all refund & alternative stay requests with full Owner Kaccha Chitha & Chat History.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={backPath}
            className="px-4 py-1.5 text-[13px] font-semibold text-[#10242A] bg-white border border-[#CBD3D9] rounded-[8px] hover:bg-gray-50 transition-all flex items-center gap-2 shadow-xs"
          >
            <ArrowLeft size={14} className="text-[#0E7C86]" /> Back to Accounting
          </Link>
        </div>
      </div>

      {/* Search + Direct Booking ID Lookup */}
      <div className="bg-white p-4 rounded-[12px] border border-[#E1E6EA] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9BA5]" size={16} />
          <input
            type="text"
            placeholder="Search audit log by tenant, Booking ID, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-2 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86]"
          />
        </div>

        <form onSubmit={handleTrackByBookingId} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="relative flex-1 sm:w-[290px]">
            <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0E7C86]" size={16} />
            <input
              type="text"
              placeholder="Paste Booking ID / Order ID to Verify..."
              value={lookupBookingId}
              onChange={(e) => setLookupBookingId(e.target.value)}
              className="w-full bg-[#F0FDFA] border border-[#99F6E4] rounded-[8px] pl-9 pr-3.5 py-2 text-[13px] font-mono text-[#10242A] placeholder-[#0F766E]/60 outline-none focus:border-[#0E7C86]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0E7C86] hover:bg-[#095256] text-white font-bold rounded-[8px] text-[12px] shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Eye size={14} /> Verify Booking & Kaccha Chitha
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-8 text-center text-[13px] text-[#4A5961]">
            <Loader2 className="w-6 h-6 animate-spin text-[#0E7C86] mx-auto mb-2" />
            Loading refund history audit log...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[#4A5961]">
            No historical refund records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2.5 text-[11px] font-bold text-[#4A5961] uppercase tracking-wider">Booking ID</th>
                  <th className="pb-2.5 text-[11px] font-bold text-[#4A5961] uppercase tracking-wider">Tenant & Type</th>
                  <th className="pb-2.5 text-[11px] font-bold text-[#4A5961] uppercase tracking-wider">Property & Owner</th>
                  <th className="pb-2.5 text-[11px] font-bold text-[#4A5961] uppercase tracking-wider">Amount & Paid Time</th>
                  <th className="pb-2.5 text-[11px] font-bold text-[#4A5961] uppercase tracking-wider">Onboarding Check</th>
                  <th className="pb-2.5 text-[11px] font-bold text-[#4A5961] uppercase tracking-wider">Status</th>
                  <th className="pb-2.5 text-[11px] font-bold text-[#4A5961] uppercase tracking-wider text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {filtered.map((r) => {
                  const rawStatus = String(r.refund_status || r.status || "pending").toLowerCase();
                  const isCompleted = rawStatus === "approved" || rawStatus === "processed" || rawStatus === "refunded";
                  const isRejected = rawStatus === "rejected";
                  const isAlt = r.request_type === "alternative_property";

                  return (
                    <tr key={r._id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 pr-3">
                        <span className="font-mono font-bold text-[#0E7C86] block text-xs">
                          {r.booking_id || r._id}
                        </span>
                        {r.assigned_employee && (
                          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 inline-block mt-1">
                            Emp: {r.assigned_employee}
                          </span>
                        )}
                      </td>

                      <td className="py-3 pr-3">
                        <div className="font-bold text-[#10242A]">{r.user_name || r.name || "Tenant"}</div>
                        <span
                          className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isAlt
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {isAlt ? (
                            <>
                              <Repeat size={10} /> Alternative Stay
                            </>
                          ) : (
                            "💸 Refund"
                          )}
                        </span>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="font-semibold text-[#10242A]">{r.property_name || "Roomhy Property"}</div>
                        <div className="text-[11px] text-[#4A5961]">
                          Owner: <span className="font-semibold text-[#10242A]">{r.owner_name || "N/A"}</span>{" "}
                          {r.owner_id ? `(${r.owner_id})` : ""}
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        <div className="font-extrabold text-[#10242A]">₹{r.amount || r.refund_amount || 0}</div>
                        <div className="text-[11px] text-[#4A5961]">
                          Paid: {formatDateTime(r.payment_completed_at || r.created_at || r.createdAt)}
                        </div>
                      </td>

                      <td className="py-3 pr-3">
                        {r.is_tenant_onboarded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-800 border border-red-200 text-[11px] font-bold">
                            <ShieldAlert size={13} className="text-red-600" />
                            ⚠️ Already Onboarded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                            <ShieldCheck size={13} className="text-emerald-600" />
                            Not Onboarded
                          </span>
                        )}
                      </td>

                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            isCompleted
                              ? "bg-[#DDF3E4] text-[#14532D]"
                              : isRejected
                              ? "bg-[#FDE8E8] text-[#991B1B]"
                              : "bg-[#FEF3C7] text-[#92400E]"
                          }`}
                        >
                          {rawStatus}
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <button
                          onClick={() =>
                            setModalState({
                              isOpen: true,
                              requestId: r._id,
                              bookingId: r.booking_id
                            })
                          }
                          className="px-2.5 py-1.5 bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4] font-bold rounded-[6px] text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> Full Kaccha Chitha
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RefundVerificationModal
        isOpen={modalState.isOpen}
        requestId={modalState.requestId}
        bookingId={modalState.bookingId}
        onClose={() => setModalState({ isOpen: false, requestId: null, bookingId: null })}
        onUpdated={loadHistory}
      />
    </div>
  );
}
