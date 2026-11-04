import React, { useState, useEffect } from "react";
import {
  AlertTriangle, RefreshCw, Search, RotateCcw,
  X, AlertCircle, CheckCircle2
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...c) => c.filter(Boolean).join(" ");
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function PayoutsFailed() {
  const [failed, setFailed]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [retryingId, setRetryingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg]   = useState("");

  useSEO({ title: "Failed Payout Alerts – Roomhy Admin", description: "Payout failures, bank API errors and retry dashboard" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/payouts/failed");
      if (res.success) setFailed(res.failed || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleRetry = async (log) => {
    setRetryingId(log._id);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetchJson("/api/superadmin/finance/payouts/process", {
        method: "POST",
        body: { transactionId: log.transaction_id, manual: false, notes: "Retry from failed payouts panel" }
      });
      if (res.success) {
        setSuccessMsg(`Retry successful for ${log.owner_name}!`);
        load();
      } else {
        setErrorMsg(res.message || "Retry failed");
      }
    } catch (e) {
      setErrorMsg("Network error on retry.");
    } finally {
      setRetryingId(null);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = failed.filter(f =>
    (f.owner_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.error_message || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.bank_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalFailed = failed.length;
  const totalAmt = failed.reduce((s, f) => s + (f.amount || 0), 0);

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Failed Payout Alerts</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Disbursement failures, gateway errors and retry dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="flex items-center gap-2 bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer">
            <RefreshCw className={cn("w-3.5 h-3.5 text-[#0E7C86]", loading && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-[#DDF3E4] border border-[#B7E4C7] text-[#14532D] rounded-[12px] px-4 py-3 text-[13px] font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
          <button onClick={() => setSuccessMsg("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 bg-[#FDE8E8] border border-[#F8B4B4] text-[#991B1B] rounded-[12px] px-4 py-3 text-[13px] font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
          <button onClick={() => setErrorMsg("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Failed Transactions", val: totalFailed, fmt: v => v },
          { label: "Amount at Risk",      val: totalAmt,    fmt: fmt },
          { label: "Needs Attention",     val: totalFailed, fmt: v => `${v} Alerts` },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{card.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">
                {loading ? "..." : card.fmt(card.val)}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Banner */}
      {!loading && totalFailed > 0 && (
        <div className="flex items-start gap-3 bg-[#FDE8E8] border border-[#F8B4B4] rounded-[12px] px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-bold text-[#991B1B]">{totalFailed} payout failure{totalFailed > 1 ? "s" : ""} detected</p>
            <p className="text-[12px] text-[#991B1B] mt-0.5">
              Total amount at risk: {fmt(totalAmt)}. Review each failure and retry or contact your payment gateway.
            </p>
          </div>
        </div>
      )}

      {/* Outside Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search owner / error..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
        <span className="text-[12px] font-medium text-[#4A5961]">
          {loading ? "Loading..." : `${filtered.length} failures in queue`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Amount</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Bank Account</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Error Details</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Failed At</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-[13px] text-[#4A5961]">Loading records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <p className="text-[13px] font-semibold text-[#10242A]">No failed payouts!</p>
                    <p className="text-[12px] text-[#4A5961] mt-0.5">All disbursements are running smoothly.</p>
                  </td>
                </tr>
              ) : filtered.map((f, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5">
                    <p className="font-medium text-[#10242A]">{f.owner_name || "N/A"}</p>
                    <p className="text-[11px] text-[#708088] font-mono">{f.owner_id || ""}</p>
                  </td>
                  <td className="py-2.5 text-center font-semibold text-[#10242A]">{fmt(f.amount)}</td>
                  <td className="py-2.5 text-center">
                    <p className="text-[13px] font-medium text-[#10242A]">{f.bank_name || "N/A"}</p>
                    <p className="text-[11px] text-[#708088] font-mono">
                      {f.account_number ? `••••${String(f.account_number).slice(-4)}` : "N/A"}
                    </p>
                  </td>
                  <td className="py-2.5 max-w-[240px]">
                    <span className="text-[12px] font-medium text-[#991B1B] bg-[#FDE8E8] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <AlertTriangle size={11} className="shrink-0" />
                      <span className="truncate">{f.error_message || "Payment gateway returned an error"}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-[#4A5961]">
                    {f.failed_at ? new Date(f.failed_at).toLocaleDateString("en-IN") : "N/A"}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleRetry(f)}
                      disabled={retryingId === f._id}
                      className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold px-3 py-1 rounded-[6px] text-[12px] transition-all inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCcw size={11} className={cn(retryingId === f._id && "animate-spin")} />
                      {retryingId === f._id ? "Retrying..." : "Retry"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
