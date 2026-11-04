import React, { useState, useEffect } from "react";
import {
  Send, RefreshCw, AlertCircle, Search, CheckCircle2, X
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...c) => c.filter(Boolean).join(" ");
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function PayoutsPending() {
  const [pending, setPending]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selectedTx, setSelectedTx] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg]   = useState("");

  useSEO({ title: "Pending Payouts – Roomhy Admin", description: "Owner payout disbursement queue" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/payouts/pending");
      if (res.success) setPending(res.pending || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleProcess = async () => {
    if (!selectedTx) return;
    setProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetchJson("/api/superadmin/finance/payouts/process", {
        method: "POST",
        body: { transactionId: selectedTx._id, manual: true, notes: "Processed from Pending Payouts panel" }
      });
      if (res.success) {
        setSuccessMsg(`Payout of ${fmt(selectedTx.owner_amount)} to ${selectedTx.owner_name} processed!`);
        setSelectedTx(null);
        load();
      } else {
        setErrorMsg(res.message || "Failed to process payout");
      }
    } catch (e) {
      setErrorMsg("Network error, please retry.");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = pending.filter(p =>
    (p.owner_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.property_name || "").toLowerCase().includes(search.toLowerCase()) ||
    String(p._id || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAmt   = pending.reduce((s, p) => s + (p.owner_amount || 0), 0);
  const totalCount = pending.length;

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Pending Payouts</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Owner disbursements waiting for approval & bank transfer</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="flex items-center gap-2 bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer">
            <RefreshCw className={cn("w-3.5 h-3.5 text-[#0E7C86]", loading && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-[#DDF3E4] border border-[#B7E4C7] text-[#14532D] rounded-[12px] px-4 py-3 text-[13px] font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
          <button onClick={() => setSuccessMsg("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pending Queue",  val: totalCount, fmt: (v) => v },
          { label: "Total Pending",  val: totalAmt,   fmt: fmt },
          { label: "Avg Payout",     val: totalCount ? Math.round(totalAmt / totalCount) : 0, fmt: fmt },
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

      {/* Search Bar (Outside Table Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search owner / property..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
        <span className="text-[12px] font-medium text-[#4A5961]">
          {loading ? "Loading..." : `${filtered.length} payouts pending`}
        </span>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Txn ID</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Booking Amt</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Net Payout</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Commission</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Status</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr><td colSpan={8} className="py-6 text-center text-[13px] text-[#4A5961]">Loading records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center">
                    <p className="text-[13px] font-semibold text-[#10242A]">No pending payouts</p>
                    <p className="text-[12px] text-[#4A5961] mt-0.5">All payouts have been processed!</p>
                  </td>
                </tr>
              ) : filtered.map((p, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5">
                    <span className="font-mono text-[12px] font-semibold text-[#0E7C86] bg-[#E8F3F4] px-2 py-0.5 rounded-[6px]">
                      {String(p._id).slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <p className="font-medium text-[#10242A]">{p.owner_name || "N/A"}</p>
                    <p className="text-[11px] text-[#708088]">{p.owner_loginId || ""}</p>
                  </td>
                  <td className="py-2.5 text-[#4A5961]">
                    {p.property_name || "N/A"}
                  </td>
                  <td className="py-2.5 text-center font-semibold text-[#10242A]">{fmt(p.booking_amount)}</td>
                  <td className="py-2.5 text-center font-bold text-[#14532D]">{fmt(p.owner_amount)}</td>
                  <td className="py-2.5 text-center font-semibold text-[#0E7C86]">{fmt(p.commission_amount)}</td>
                  <td className="py-2.5 text-center">
                    <span className="inline-block text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                      {p.payout_status || "Pending"}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => { setSelectedTx(p); setErrorMsg(""); }}
                      className="bg-[#0E7C86] hover:bg-[#095256] text-white font-semibold px-3 py-1 rounded-[6px] text-[12px] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send size={12} /> Transfer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-base">Confirm Payout Transfer</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Owner Disbursement</p>
              </div>
              <button onClick={() => setSelectedTx(null)} className="ml-auto text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Owner</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedTx.owner_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Property</span>
                  <span className="font-semibold text-slate-600 text-xs">{selectedTx.property_name || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Net Payout</span>
                  <span className="font-black text-emerald-600 text-lg">{fmt(selectedTx.owner_amount)}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedTx(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-[10px] font-bold uppercase hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...</> : <><Send className="w-3.5 h-3.5" /> Approve Transfer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
