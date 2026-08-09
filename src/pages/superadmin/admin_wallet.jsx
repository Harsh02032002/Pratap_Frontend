import React, { useEffect, useState } from "react";
import { Wallet, IndianRupee, ArrowUpRight, ShieldCheck, CheckCircle2, Loader2, RefreshCw, Building } from "lucide-react";
import { fetchJson } from "../../utils/api";

export default function AdminWalletPage() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalOwnerHeld: 0,
    totalOwnerAvailable: 0,
    totalAdminWithdrawn: 0,
    availableAdminBalance: 0
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/wallet/admin/balance").catch(() => null);
      if (res?.metrics) {
        setMetrics(res.metrics);
        setHistory(res.payoutHistory || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdrawAdminEarnings = async (e) => {
    e.preventDefault();
    const num = parseFloat(withdrawAmount);
    if (isNaN(num) || num <= 0) {
      setMsg({ text: "Please enter a valid amount", type: "error" });
      return;
    }
    setProcessing(true);
    setMsg({ text: "", type: "" });

    try {
      const res = await fetchJson("/api/wallet/admin/withdraw-instant", {
        method: "POST",
        body: JSON.stringify({ amount: num })
      });

      if (res?.success) {
        setMsg({ text: `🎉 ${res.message || "Platform earnings successfully transferred!"}`, type: "success" });
        setWithdrawAmount("");
        loadData();
      } else {
        setMsg({ text: res?.message || "Transfer failed", type: "error" });
      }
    } catch (err) {
      setMsg({ text: err.message || "Failed to process withdrawal", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-600/20">
              <Wallet size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Admin Platform Wallet</h1>
              <p className="text-sm text-gray-500">Manage 5% platform commission earnings and direct Cashfree bank transfers</p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Wallet
          </button>
        </div>

        {msg.text && (
          <div className={`p-4 rounded-2xl font-medium text-sm border ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
            {msg.text}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-2">Available Admin Earnings</div>
            <div className="text-4xl font-black text-white mb-4">₹{metrics.availableAdminBalance?.toLocaleString()}</div>
            <p className="text-xs text-gray-400">Ready for direct payout to registered Admin merchant account</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Commission Collected (5%)</div>
            <div className="text-3xl font-black text-teal-600 mb-2">₹{metrics.totalCommission?.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Gross platform earnings across all verified bookings</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Admin Withdrawn</div>
            <div className="text-3xl font-black text-gray-900 mb-2">₹{metrics.totalAdminWithdrawn?.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Total earnings transferred to bank account so far</p>
          </div>

        </div>

        {/* Action & Bank Details Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Withdraw Form */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <ArrowUpRight className="text-teal-600" size={20} /> Withdraw Platform Earnings
            </h2>
            <p className="text-sm text-gray-500 mb-6">Instantly transfer available platform commission to registered Cashfree Merchant Account</p>

            <form onSubmit={handleWithdrawAdminEarnings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  placeholder={`Max ₹${metrics.availableAdminBalance}`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-lg font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={processing || metrics.availableAdminBalance <= 0}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="animate-spin" size={20} /> : <ArrowUpRight size={20} />}
                Transfer ₹{withdrawAmount || 0} to Admin Bank Account
              </button>
            </form>
          </div>

          {/* Registered Bank Account Info */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Building className="text-blue-600" size={20} /> Registered Merchant Bank Account
            </h2>
            <p className="text-sm text-gray-500 mb-6">Linked Cashfree Payout Merchant Account</p>

            <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center text-sm border-b border-gray-200/60 pb-3">
                <span className="text-gray-500 font-medium">Account Holder</span>
                <span className="font-bold text-gray-900">Roomhy Technologies Private Limited</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-200/60 pb-3">
                <span className="text-gray-500 font-medium">Merchant Gateway</span>
                <span className="font-bold text-teal-600">Cashfree PG Payout Auto-Settlement</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Status</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 size={14} /> Verified & Active
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* History Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 font-bold text-gray-900">Admin Commission Withdrawal Audit Trail</div>
          {history.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No admin commission withdrawals requested yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="p-4 pl-6">Transfer ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Reference UTR</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {history.map(h => (
                    <tr key={h._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-gray-900">{h.cf_transfer_id || h._id}</td>
                      <td className="p-4 font-black text-teal-600">₹{h.amount}</td>
                      <td className="p-4 font-mono text-gray-600 text-xs">{h.cf_reference_id || "UTR_CONFIRMED"}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${h.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6 text-xs text-gray-500">{new Date(h.createdAt).toLocaleDateString()}</td>
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
