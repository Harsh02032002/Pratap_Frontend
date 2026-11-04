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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Partial Refund System</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Issue custom partial refunds directly to tenant bank accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/superadmin/accounting" className="px-4 py-1.5 text-[13px] font-semibold text-[#10242A] bg-white border border-[#CBD3D9] rounded-[8px] hover:bg-gray-50 transition-all flex items-center gap-2 shadow-xs">
            <ArrowLeft size={14} className="text-[#0E7C86]" /> Back to Accounting
          </Link>
        </div>
      </div>

      {/* Card Form */}
      <div className="bg-white p-4 rounded-[12px] shadow-xs border border-[#E1E6EA] overflow-hidden">
        <form onSubmit={handlePartialRefund} className="space-y-4 max-w-2xl">
          {error && (
            <div className="p-3 bg-[#FDE8E8] text-[#991B1B] rounded-[8px] border border-[#F8B4B4] text-[13px] font-semibold flex items-center gap-2">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          {result && (
            <div className="p-4 bg-[#DDF3E4] text-[#14532D] rounded-[8px] border border-[#B7E4C7] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[14px]">
                <CheckCircle2 size={18} /> Partial Refund Processed Successfully!
              </div>
              <p className="text-[13px]">Refund ID: <span className="font-mono font-bold">{result.refund_id}</span></p>
              <p className="text-[13px]">Amount Refunded: <span className="font-bold">₹{result.refund_amount}</span></p>
              <p className="text-[13px]">Status: <span className="font-bold uppercase">{result.refund_status}</span></p>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A5961] mb-1.5">Transaction ID / Booking ID</label>
            <input
              type="text"
              placeholder="Enter Payment Transaction Mongo ID or Order ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-[#CBD3D9] rounded-[8px] text-[13px] font-mono text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A5961] mb-1.5">Partial Refund Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-[#CBD3D9] rounded-[8px] text-[13px] font-semibold text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#4A5961] mb-1.5">Reason for Partial Refund</label>
            <textarea
              placeholder="e.g. Partial rent adjustment / Discount compensation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 bg-white border border-[#CBD3D9] rounded-[8px] text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-[#0E7C86] hover:bg-[#095256] text-white text-[13px] font-semibold rounded-[8px] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <PieChart size={16} />}
            Process Partial Refund
          </button>
        </form>
      </div>
    </div>
  );
}
