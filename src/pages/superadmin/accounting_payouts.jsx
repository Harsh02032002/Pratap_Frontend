import React, { useState, useEffect, useCallback } from "react";
import {
  Search, RefreshCw, Send, Zap, Wallet, CreditCard,
  AlertCircle, CheckCircle2, XCircle, Loader2,
  IndianRupee, Building2, User, PlusCircle,
  CheckSquare, Square, Banknote, ArrowRightCircle, LayoutList
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";
import { useSuperadminLogin } from "./useSuperadminLogin";

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
    error:   "bg-rose-600 text-white",
    info:    "bg-slate-800 text-white",
  };
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-2 ${colors[type] || colors.info}`}>
      {type === "success" && <CheckCircle2 size={16} />}
      {type === "error"   && <XCircle size={16} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }) {
  const palette = {
    purple:  "bg-purple-50 text-purple-600 border-purple-100",
    blue:    "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose:    "bg-rose-50 text-rose-600 border-rose-100",
    amber:   "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md flex items-start gap-3 hover:-translate-y-0.5 transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm", palette[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none truncate">{label}</p>
        <p className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">₹{value}</p>
        {sub && <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">{sub}</p>}
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
  const [owners, setOwners]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [preview, setPreview]   = useState(null);

  useEffect(() => {
    fetchJson("/api/finance/payouts/options")
      .then(d => setOwners(d.ownersOptions || []))
      .catch(() => {});
  }, []);

  const handleOwnerChange = (loginId) => {
    const o = owners.find(x => x.loginId === loginId);
    setForm(f => ({
      ...f,
      ownerId:   loginId,
      ownerName: o?.name || o?.profile?.name || loginId,
    }));
  };

  // Commission preview
  useEffect(() => {
    const amt = Number(form.amount);
    if (!amt) { setPreview(null); return; }
    const commission = Math.round(amt * 0.10);
    const gst        = Math.round(commission * 0.18);
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
  const [error, setError]           = useState("");

  const bank = {
    holder: payout.payout_account_holder || payout.bank_details?.account_holder || payout.owner_name || "—",
    number: payout.payout_account_number || payout.bank_details?.account_number || "—",
    ifsc:   payout.payout_ifsc_code      || payout.bank_details?.ifsc_code      || "—",
    name:   payout.payout_bank_name      || payout.bank_details?.bank_name      || "—",
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
            ["Bank Name",      bank.name],
            ["Account No.",    bank.number],
            ["IFSC Code",      bank.ifsc],
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
  const [error, setError]           = useState("");

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
  const adminLoginId = useSuperadminLogin();

  useSEO({
    title: "Settlement Hub - Roomhy Super Admin",
    description: "Manage owner payouts, process manual transfers and audit settlements.",
    canonical: "https://roomhy.com/superadmin/accounting_payouts",
  });

  const [wallet,       setWallet]       = useState(null);
  const [payoutsList,  setPayoutsList]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [filterStatus, setFilterStatus] = useState("Pending"); // Pending | Paid | All

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals
  const [showRecordModal,  setShowRecordModal]  = useState(false);
  const [transferPayout,   setTransferPayout]   = useState(null); // single
  const [showBulkModal,    setShowBulkModal]    = useState(false);

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
      if (walletRes?.success)  setWallet(walletRes.wallet);
      if (txRes?.success)      setPayoutsList(txRes.pending || []);
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
      (p.owner_id   || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
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
  const allSelected   = allPendingIds.length > 0 && allPendingIds.every(id => selectedIds.has(id));

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
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Settlement Hub</h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Manual Rent Collection · Owner Disbursement · Audit Trail
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRecordModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
          >
            <PlusCircle size={14} /> Record Payment
          </button>
          <button
            onClick={loadData}
            className="bg-white text-slate-400 border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Wallet Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Admin Wallet Balance"   value={fmt(w.adminBalance)}   sub="Commission collected"   icon={Wallet}   color="emerald" />
        <StatCard label="Total Collected"        value={fmt(w.totalCollected)} sub={`${w.totalTx || 0} transactions`}    icon={IndianRupee} color="purple" />
        <StatCard label="Pending Owner Payouts"  value={fmt(w.pendingPayouts)} sub={`${w.pendingCount || 0} pending`}     icon={Send}     color="rose"   />
        <StatCard label="Paid to Owners"         value={fmt(w.paidPayouts)}    sub={`${w.paidCount || 0} transferred`}   icon={Zap}      color="blue"   />
        <StatCard label="Remaining Liability"    value={fmt(w.pendingPayouts)} sub="To be transferred"     icon={CreditCard} color="amber"  />
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
        {/* Table header controls */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Settlement Registry</h3>
            {/* Status filter */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg">
              {["Pending", "Paid", "All"].map(s => (
                <button key={s} onClick={() => { setFilterStatus(s); setSelectedIds(new Set()); }}
                  className={cn("px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                    filterStatus === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bulk transfer button */}
            {selectedIds.size > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-200 animate-in slide-in-from-right-2"
              >
                <ArrowRightCircle size={13} />
                Transfer {selectedIds.size} Selected · ₹{fmt(bulkTotal)}
              </button>
            )}
            {/* Search */}
            <div className="relative w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input
                placeholder="Search owner..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="animate-spin size-6" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Loading…</p>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400 bg-slate-50/50 rounded-xl">
              No records found
            </div>
          ) : (
            <table className="w-full text-left text-[11px] font-semibold text-slate-700">
              <thead>
                <tr className="text-slate-400 text-[8px] font-black uppercase border-b border-slate-50 tracking-widest">
                  {/* Select-all checkbox */}
                  <th className="pb-4 pr-3 w-8">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700 transition-colors">
                      {allSelected
                        ? <CheckSquare size={15} className="text-blue-600" />
                        : <Square size={15} />}
                    </button>
                  </th>
                  <th className="pb-4">Ref #</th>
                  <th className="pb-4">Owner</th>
                  <th className="pb-4">Tenant / Property</th>
                  <th className="pb-4 text-center">Settlement Account</th>
                  <th className="pb-4 text-center">Owner Gets (₹)</th>
                  <th className="pb-4 text-center">Date</th>
                  <th className="pb-4 text-center">Status</th>
                  <th className="pb-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayouts.map((p, i) => {
                  const id       = p._id || p.id;
                  const isPaid   = p.payout_status === "Paid";
                  const isSelected = selectedIds.has(id);
                  const acctNum  = p.payout_account_number || p.bank_details?.account_number || "";
                  const bankNm   = p.payout_bank_name      || p.bank_details?.bank_name      || "";
                  const ifsc     = p.payout_ifsc_code      || p.bank_details?.ifsc_code      || "";

                  return (
                    <tr key={id || i}
                      className={cn("group hover:bg-slate-50 transition-colors",
                        isSelected && "bg-blue-50/40")}
                    >
                      {/* Checkbox */}
                      <td className="py-3 pr-3">
                        {!isPaid ? (
                          <button onClick={() => toggleOne(id)} className="text-slate-300 hover:text-blue-600 transition-colors">
                            {isSelected
                              ? <CheckSquare size={15} className="text-blue-600" />
                              : <Square size={15} />}
                          </button>
                        ) : (
                          <CheckCircle2 size={14} className="text-emerald-400" />
                        )}
                      </td>

                      {/* Ref */}
                      <td className="py-3">
                        <span className="text-[9px] font-mono font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                          {(p.payout_reference || p.razorpay_payment_id || id || "").slice(-8).toUpperCase()}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="py-3">
                        <p className="text-[11px] font-bold text-slate-800">{p.owner_name || p.owner_id}</p>
                        <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">ID: {p.owner_id}</p>
                      </td>

                      {/* Tenant / Property */}
                      <td className="py-3">
                        <p className="text-[10.5px] font-semibold text-slate-700">{p.tenant_name || "—"}</p>
                        {p.property_name && <p className="text-[8px] text-slate-400 mt-0.5">{p.property_name}</p>}
                        {p.payment_method === "manual" && (
                          <span className="text-[7px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            Manual
                          </span>
                        )}
                      </td>

                      {/* Bank */}
                      <td className="py-3 text-center">
                        {acctNum ? (
                          <>
                            <p className="text-[10px] font-bold text-slate-700">{bankNm || "Bank"}</p>
                            <p className="text-[8px] text-slate-400 mt-0.5">
                              A/C: ····{acctNum.slice(-4)}{ifsc ? ` · ${ifsc}` : ""}
                            </p>
                          </>
                        ) : (
                          <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Auto-fill on transfer</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 text-center font-black text-slate-800 text-[13px]">
                        ₹{fmt(p.owner_amount)}
                      </td>

                      {/* Date */}
                      <td className="py-3 text-center text-[9px] text-slate-500">
                        {p.payment_date
                          ? new Date(p.payment_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 text-center">
                        <span className={cn("text-[7px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider",
                          isPaid
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100")}>
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => setTransferPayout(p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-[9px] font-black uppercase tracking-wider ml-auto"
                          >
                            <Banknote size={11} /> Transfer
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Done</span>
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
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-600">
              {selectedIds.size} selected · Total owner payout: <span className="text-blue-700">₹{fmt(bulkTotal)}</span>
            </p>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[9px] text-slate-400 font-bold underline hover:text-slate-600 transition-colors"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
