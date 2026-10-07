import React, { useState } from "react";
import { PieChart, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { fetchJson } from "../../utils/api";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/superadmin/PageHeader";

export default function PartialRefundPage() {
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handlePartialRefund = async (e) => {
    e.preventDefault();
    if (!transactionId || !amount) {
      setError("Please enter Transaction ID and Partial Refund Amount.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetchJson("/api/payments/payu/refund", {
        method: "POST",
        body: JSON.stringify({
          transactionId,
          amount: parseFloat(amount),
          reason: reason || "Partial Refund Issued by Superadmin"
        })
      });

      if (res?.success) {
        setResult(res);
      } else {
        setError(res?.message || "Partial refund failed.");
      }
    } catch (err) {
      setError(err.message || "Failed to issue partial refund.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <PageHeader
        title="Partial Refund System"
        subtitle="Issue custom partial refunds directly to tenant bank accounts."
        actions={
          <Link to="/superadmin/accounting" className="px-3.5 py-2 text-xs font-semibold text-[#4A5961] bg-white border border-[#E1E6EA] rounded-[12px] hover:bg-[#F4F6F8] transition-all flex items-center gap-2 shadow-xs">
            <ArrowLeft size={14} className="text-[#0E7C86]" /> Back to Accounting
          </Link>
        }
      />

        {/* Card Form */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <form onSubmit={handlePartialRefund} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-sm font-medium flex items-center gap-2">
                <ShieldAlert size={18} /> {error}
              </div>
            )}

            {result && (
              <div className="p-6 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg">
                  <CheckCircle2 size={24} /> Partial Refund Processed Successfully!
                </div>
                <p className="text-sm">Refund ID: <span className="font-mono font-bold">{result.refund_id}</span></p>
                <p className="text-sm">Amount Refunded: <span className="font-bold">₹{result.refund_amount}</span></p>
                <p className="text-sm">Status: <span className="font-bold uppercase">{result.refund_status}</span></p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Transaction ID / Booking ID</label>
              <input
                type="text"
                placeholder="Enter Payment Transaction Mongo ID or Order ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Partial Refund Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Reason for Partial Refund</label>
              <textarea
                placeholder="e.g. Partial rent adjustment / Discount compensation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <PieChart size={20} />}
              Process Partial Refund
            </button>

          </form>
        </div>
    </div>
  );
}
