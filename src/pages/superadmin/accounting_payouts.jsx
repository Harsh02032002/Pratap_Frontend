import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, RefreshCw, AlertCircle, CheckCircle2, XCircle, Loader2,
  IndianRupee, PlusCircle, CheckSquare, Square, Banknote, ArrowRightCircle, LayoutList
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...c) => c.filter(Boolean).join(" ");
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = {
    success: "bg-emerald-600 text-white",
    error: "bg-rose-600 text-white",
    info: "bg-slate-800 text-white",
  };
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-2 ${colors[type] || colors.info}`}>
      {type === "success" && <CheckCircle2 size={16} />}
      {type === "error" && <XCircle size={16} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Stat Card (No Icon) ──────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
      <div className="mt-2">
        <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">₹{value}</h3>
        {sub && <p className="text-[11px] text-[#708088] mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function RecordPaymentModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    tenantName: "", tenantId: "",
    ownerId: "", ownerName: "",
    propertyName: "", amount: "",
    notes: "",
  });
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchJson("/api/finance/payouts/options")
      .then(d => setOwners(d.ownersOptions || []))
      .catch(() => { });
  }, []);

  const handleOwnerChange = (loginId) => {
    const o = owners.find(x => x.loginId === loginId);
    setForm(f => ({
      ...f,
      ownerId: loginId,
      ownerName: o?.name || o?.profile?.name || loginId,
    }));
  };

  // Commission preview
  useEffect(() => {
    const amt = Number(form.amount);
    if (!amt) { setPreview(null); return; }
    const commission = Math.round(amt * 0.10);
    const gst = Math.round(commission * 0.18);
    setPreview({ commission, gst, ownerShare: amt - commission - gst });
  }, [form.amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.ownerId) { setError("Select an owner"); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError("Enter a valid amount"); return; }
    setLoading(true);
    try {
      const res = await fetchJson("/api/finance/manual-payment", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (res.success) { onSuccess(res.message); onClose(); }
      else setError(res.message || "Failed");
    } catch (e) { setError(e.message || "Error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-7 max-w-lg w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Record Payment</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cash / Offline Collection</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-[11px] text-rose-600 font-bold">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Owner */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Owner *</label>
            <select
              value={form.ownerId}
              onChange={e => handleOwnerChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-400"
            >
              <option value="">— Select Owner —</option>
              {owners.map(o => (
                <option key={o.loginId} value={o.loginId}>
                  {o.name || o.profile?.name || o.loginId}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tenant Name */}
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tenant Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={form.tenantName}
                onChange={e => setForm(f => ({ ...f, tenantName: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-400"
              />
            </div>
            {/* Property */}
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Property Name</label>
              <input
                type="text"
                placeholder="e.g. Sunrise PG"
                value={form.propertyName}
                onChange={e => setForm(f => ({ ...f, propertyName: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Amount (₹) *</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 8000"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-400"
            />
          </div>

          {/* Commission preview */}
          {preview && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] font-bold text-slate-600 grid grid-cols-3 gap-2">
              <div>
                <p className="text-slate-400 uppercase tracking-wider text-[8px] mb-0.5">Commission (10%)</p>
                <p className="text-rose-600">−₹{fmt(preview.commission)}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wider text-[8px] mb-0.5">GST (18%)</p>
                <p className="text-rose-500">−₹{fmt(preview.gst)}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wider text-[8px] mb-0.5">Owner Gets</p>
                <p className="text-emerald-700 text-[12px]">₹{fmt(preview.ownerShare)}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. August rent cash collection"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={12} className="animate-spin" /> Recording…</> : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Single Transfer Confirm Modal ────────────────────────────────────────────
function TransferModal({ payout, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const bank = {
    holder: payout.payout_account_holder || payout.bank_details?.account_holder || payout.owner_name || "—",
    number: payout.payout_account_number || payout.bank_details?.account_number || "—",
    ifsc: payout.payout_ifsc_code || payout.bank_details?.ifsc_code || "—",
    name: payout.payout_bank_name || payout.bank_details?.bank_name || "—",
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetchJson("/api/finance/manual-transfer", {
        method: "POST",
        body: JSON.stringify({ transactionId: payout._id || payout.id, adminId: "superadmin" }),
      });
      if (res.success) { onSuccess(res.message); onClose(); }
      else setError(res.message || "Transfer failed");
    } catch (e) { setError(e.message || "Error"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Banknote size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Confirm Transfer</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manual Bank Transfer</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-[11px] text-rose-600 font-bold">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* Amount */}
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 text-center mb-5">
          <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-1">Transfer Amount</p>
          <p className="text-3xl font-black text-purple-700">₹{fmt(payout.owner_amount)}</p>
          <p className="text-[10px] text-purple-500 font-semibold mt-1">{payout.owner_name}</p>
        </div>

        {/* Bank details — read-only, auto-filled */}
        <div className="border border-slate-100 rounded-2xl p-4 space-y-3 mb-6">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bank Details (auto-filled from DB)</p>
          {[
            ["Account Holder", bank.holder],
            ["Bank Name", bank.name],
            ["Account No.", bank.number],
            ["IFSC Code", bank.ifsc],
          ].map(([lbl, val]) => (
            <div key={lbl} className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lbl}</span>
              <span className="text-[11px] font-bold text-slate-800 font-mono">{val}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 text-center mb-5 font-medium">
          This records the transfer in the system. Actual bank transfer must be done separately via NEFT/UPI.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={submitting}
            className="flex-1 bg-purple-600 text-white rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={12} className="animate-spin" /> Processing…</> : "Yes, Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Transfer Confirm Modal ──────────────────────────────────────────────
function BulkTransferModal({ selectedIds, total, count, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetchJson("/api/finance/bulk-transfer", {
        method: "POST",
        body: JSON.stringify({ transactionIds: selectedIds, adminId: "superadmin" }),
      });
      if (res.success) { onSuccess(res.message); onClose(); }
      else setError(res.message || "Bulk transfer failed");
    } catch (e) { setError(e.message || "Error"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <LayoutList size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Bulk Transfer</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{count} owners selected</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-[11px] text-rose-600 font-bold">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center mb-5">
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Total to Transfer</p>
          <p className="text-3xl font-black text-blue-700">₹{fmt(total)}</p>
          <p className="text-[10px] text-blue-500 font-semibold mt-1">across {count} transactions</p>
        </div>

        <p className="text-[10px] text-slate-400 text-center mb-5 font-medium">
          Each owner's bank details will be auto-filled from their DB record. Actual transfers must be done separately.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={submitting}
            className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={12} className="animate-spin" /> Transferring…</> : `Transfer All ${count}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Payouts() {
  useSEO({
    title: "Settlement Hub - Roomhy Super Admin",
    description: "Manage owner payouts, process manual transfers and audit settlements.",
    canonical: "https://roomhy.com/superadmin/accounting_payouts",
  });

  const [wallet, setWallet] = useState(null);
  const [payoutsList, setPayoutsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Pending"); // Pending | Paid | All

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [transferPayout, setTransferPayout] = useState(null); // single
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        fetchJson("/api/finance/admin-wallet").catch(() => null),
        fetchJson("/api/finance/payouts/pending").catch(() => null),
      ]);
      if (walletRes?.success) setWallet(walletRes.wallet);
      if (txRes?.success) setPayoutsList(txRes.pending || []);
    } catch (e) {
      console.error("loadData error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived list
  const filteredPayouts = payoutsList.filter(p => {
    const matchSearch =
      !searchQuery ||
      (p.owner_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.owner_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.razorpay_payment_id || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      filterStatus === "All" ? true :
        filterStatus === "Pending" ? p.payout_status !== "Paid" :
          p.payout_status === "Paid";

    return matchSearch && matchStatus;
  });

  const pendingOnly = filteredPayouts.filter(p => p.payout_status !== "Paid");

  // Select all (only pending)
  const allPendingIds = pendingOnly.map(p => p._id || p.id);
  const allSelected = allPendingIds.length > 0 && allPendingIds.every(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPendingIds));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Bulk total
  const bulkTotal = pendingOnly
    .filter(p => selectedIds.has(p._id || p.id))
    .reduce((sum, p) => sum + (p.owner_amount || 0), 0);

  const w = wallet || {};

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modals */}
      {showRecordModal && (
        <RecordPaymentModal
          onClose={() => setShowRecordModal(false)}
          onSuccess={(msg) => { showToast(msg, "success"); loadData(); }}
        />
      )}
      {transferPayout && (
        <TransferModal
          payout={transferPayout}
          onClose={() => setTransferPayout(null)}
          onSuccess={(msg) => { showToast(msg, "success"); setSelectedIds(new Set()); loadData(); }}
        />
      )}
      {showBulkModal && (
        <BulkTransferModal
          selectedIds={[...selectedIds]}
          total={bulkTotal}
          count={selectedIds.size}
          onClose={() => setShowBulkModal(false)}
          onSuccess={(msg) => { showToast(msg, "success"); setSelectedIds(new Set()); loadData(); }}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Settlement Hub</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Manual rent collection, owner disbursement, and audit trail.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRecordModal(true)}
            className="flex items-center gap-2 bg-[#0E7C86] text-white px-4 py-1.5 rounded-[8px] text-[13px] font-semibold hover:bg-[#095256] transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle size={14} /> Record Payment
          </button>
          <button
            onClick={loadData}
            className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw size={13} className="text-[#0E7C86]" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Wallet Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Admin Wallet Balance" value={fmt(w.adminBalance)} sub="Commission collected" />
        <StatCard label="Total Collected" value={fmt(w.totalCollected)} sub={`${w.totalTx || 0} transactions`} />
        <StatCard label="Pending Owner Payouts" value={fmt(w.pendingPayouts)} sub={`${w.pendingCount || 0} pending`} />
        <StatCard label="Paid to Owners" value={fmt(w.paidPayouts)} sub={`${w.paidCount || 0} transferred`} />
        <StatCard label="Remaining Liability" value={fmt(w.pendingPayouts)} sub="To be transferred" />
      </div>

      {/* ── Outside Controls Bar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {["Pending", "Paid", "All"].map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setSelectedIds(new Set()); }}
              className={cn("px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer",
                filterStatus === s ? "bg-[#0E7C86] text-white shadow-xs font-semibold" : "bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50 shadow-xs")}>
              {s}
            </button>
          ))}
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 bg-[#0E7C86] text-white px-4 py-1.5 rounded-[8px] text-[13px] font-semibold hover:bg-[#095256] transition-all shadow-xs cursor-pointer"
            >
              <ArrowRightCircle size={14} />
              Transfer {selectedIds.size} Selected · ₹{fmt(bulkTotal)}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
          <input
            placeholder="Search owner..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
      </div>

      {/* ── Standalone Table Card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-8 text-center flex flex-col items-center gap-2 text-[#4A5961]">
              <Loader2 className="animate-spin size-6 text-[#0E7C86]" />
              <p className="text-[13px]">Loading…</p>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#4A5961]">
              No records found
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2 pr-3 w-8">
                    <button onClick={toggleSelectAll} className="text-[#4A5961] hover:text-[#10242A] transition-colors" title="Select All Pending">
                      {allSelected
                        ? <CheckSquare size={15} className="text-[#0E7C86]" />
                        : <Square size={15} />}
                    </button>
                  </th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Ref #</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant / Property</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Rent Collected (₹)</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Commission Fee (₹)</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Pay Owner (₹)</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Settlement Account</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Date</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Status</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {filteredPayouts.map((p, i) => {
                  const id = p._id || p.id;
                  const isPaid = p.payout_status === "Paid";
                  const isSelected = selectedIds.has(id);
                  const acctNum = p.payout_account_number || p.bank_details?.account_number || "";
                  const bankNm = p.payout_bank_name || p.bank_details?.bank_name || "";
                  const ifsc = p.payout_ifsc_code || p.bank_details?.ifsc_code || "";

                  const ownerNet = p.owner_amount || 0;
                  const totalRent = p.booking_amount || p.amount || (ownerNet + (p.commission_amount || 0) + (p.gst_amount || 0));
                  const commFee = ((p.commission_amount || 0) + (p.gst_amount || 0)) || Math.max(0, totalRent - ownerNet);

                  return (
                    <tr key={id || i}
                      className={cn("hover:bg-[#F9FAFB] transition-colors",
                        isSelected && "bg-[#E8F3F4]/40")}
                    >
                      <td className="py-2.5 pr-3">
                        {!isPaid ? (
                          <button onClick={() => toggleOne(id)} className="text-[#8C9BA5] hover:text-[#0E7C86] transition-colors">
                            {isSelected
                              ? <CheckSquare size={15} className="text-[#0E7C86]" />
                              : <Square size={15} />}
                          </button>
                        ) : (
                          <CheckCircle2 size={14} className="text-[#14532D]" />
                        )}
                      </td>

                      <td className="py-2.5">
                        <span className="text-[12px] font-mono font-semibold text-[#0E7C86] bg-[#E8F3F4] px-2 py-0.5 rounded-[6px]">
                          {(p.payout_reference || p.razorpay_payment_id || id || "").slice(-8).toUpperCase()}
                        </span>
                      </td>

                      <td className="py-2.5">
                        <p className="text-[13px] font-medium text-[#10242A]">{p.owner_name || p.owner_id}</p>
                        <p className="text-[11px] text-[#708088]">ID: {p.owner_id}</p>
                      </td>

                      <td className="py-2.5">
                        <p className="text-[13px] font-medium text-[#10242A]">{p.tenant_name || "—"}</p>
                        {p.property_name && <p className="text-[11px] text-[#708088]">{p.property_name}</p>}
                        {p.payment_method === "manual" && (
                          <span className="inline-block text-[11px] font-semibold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                            Manual
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 text-center font-semibold text-[#10242A]">
                        ₹{fmt(totalRent)}
                      </td>

                      <td className="py-2.5 text-center text-[#991B1B] font-semibold">
                        −₹{fmt(commFee)}
                      </td>

                      <td className="py-2.5 text-center font-bold text-[#14532D]">
                        ₹{fmt(ownerNet)}
                      </td>

                      <td className="py-2.5 text-center">
                        {acctNum ? (
                          <>
                            <p className="text-[13px] font-medium text-[#10242A]">{bankNm || "Bank"}</p>
                            <p className="text-[11px] text-[#708088]">
                              A/C: ····{acctNum.slice(-4)}{ifsc ? ` · ${ifsc}` : ""}
                            </p>
                          </>
                        ) : (
                          <span className="inline-block text-[11px] text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full">Auto-fill on transfer</span>
                        )}
                      </td>

                      <td className="py-2.5 text-center text-[#4A5961]">
                        {p.payment_date
                          ? new Date(p.payment_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>

                      <td className="py-2.5 text-center">
                        <span className={cn("inline-block text-[12px] font-semibold px-2.5 py-0.5 rounded-full",
                          isPaid
                            ? "bg-[#DDF3E4] text-[#14532D]"
                            : "bg-[#FEF3C7] text-[#92400E]")}>
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>

                      <td className="py-2.5 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => setTransferPayout(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0E7C86] text-white rounded-[6px] hover:bg-[#095256] transition-colors text-[12px] font-semibold cursor-pointer"
                          >
                            <Banknote size={12} /> Transfer
                          </button>
                        ) : (
                          <span className="text-[12px] text-[#708088] font-medium">Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom selection summary */}
        {selectedIds.size > 0 && (
          <div className="mt-3 pt-3 border-t border-[#F0F4F6] flex items-center justify-between">
            <p className="text-[12px] font-medium text-[#4A5961]">
              {selectedIds.size} selected · Total owner payout: <span className="text-[#0E7C86] font-bold">₹{fmt(bulkTotal)}</span>
            </p>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[12px] text-[#4A5961] font-semibold underline hover:text-[#10242A] transition-colors"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
