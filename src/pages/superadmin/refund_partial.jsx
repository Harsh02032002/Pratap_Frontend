import React, { useState } from "react";
import { PieChart, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { fetchJson } from "../../utils/api";
import { Link } from "react-router-dom";

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
      const res = await fetchJson("/api/payments/cashfree/refund", {
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <PieChart size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Partial Refund System</h1>
              <p className="text-sm text-gray-500">Issue custom partial refunds directly to tenant bank accounts</p>
            </div>
          </div>

          <Link to="/superadmin/accounting" className="px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Accounting
          </Link>
        </div>

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
    </div>
  );
}
