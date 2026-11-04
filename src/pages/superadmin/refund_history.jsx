import React, { useEffect, useState } from "react";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import { fetchJson } from "../../utils/api";
import { Link } from "react-router-dom";

export default function RefundHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filtered = history.filter(r => 
    String(r.user_name || r.name || r.booking_id || r._id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Refund History Audit Log</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Complete audit trail of all approved, partial, full, and rejected refunds.</p>
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
            placeholder="Search historical refund audit log..."
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
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Refund ID / Booking</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Amount</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Refund Status</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 font-mono font-semibold text-[#0E7C86]">{r._id}</td>
                    <td className="py-2.5 font-medium text-[#10242A]">{r.user_name || r.name || "Tenant"}</td>
                    <td className="py-2.5 font-semibold text-[#10242A]">₹{r.amount || r.refund_amount || 0}</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                        r.status === "Approved" || r.status === "Refunded" ? "bg-[#DDF3E4] text-[#14532D]" :
                        r.status === "Rejected" ? "bg-[#FDE8E8] text-[#991B1B]" : "bg-[#E8EDF1] text-[#4A5961]"
                      }`}>
                        {r.status || "Completed"}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[#4A5961]">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "N/A"}
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
