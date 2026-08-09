import React, { useEffect, useState } from "react";
import { History, Search, Loader2, ArrowLeft, Download, FileText } from "lucide-react";
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Refund History Audit Log</h1>
              <p className="text-sm text-gray-500">Complete audit trail of all approved, partial, full, and rejected refunds</p>
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
              placeholder="Search historical refund audit log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
              Loading refund history audit log...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-medium">
              No historical refund records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="p-4 pl-6">Refund ID / Booking</th>
                    <th className="p-4">Tenant</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Refund Status</th>
                    <th className="p-4 pr-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-gray-900">{r._id}</td>
                      <td className="p-4 font-semibold text-gray-800">{r.user_name || r.name || "Tenant"}</td>
                      <td className="p-4 font-black text-purple-600">₹{r.amount || r.refund_amount || 0}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          r.status === "Approved" || r.status === "Refunded" ? "bg-emerald-100 text-emerald-700" :
                          r.status === "Rejected" ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {r.status || "Completed"}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right text-xs text-gray-500 font-medium">
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
    </div>
  );
}
