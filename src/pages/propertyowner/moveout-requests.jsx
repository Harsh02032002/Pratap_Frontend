import React, { useState, useEffect, useMemo } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import {
  LogOut, Search, Phone, CheckCircle2, AlertTriangle,
  Clock, XCircle, Loader2, CalendarDays, IndianRupee, CalendarClock, Undo2
} from "lucide-react";

const fmt = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

const fmtDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const STATUS_CONFIG = {
  pending:   { label: "Pending",   tone: "warning", Icon: Clock },
  approved:  { label: "On Notice", tone: "info",    Icon: CalendarClock },
  completed: { label: "Moved Out", tone: "success", Icon: CheckCircle2 },
  rejected:  { label: "Rejected",  tone: "danger",  Icon: XCircle },
};

// An approved request is not a completed exit. The tenant serves a fixed
// one-month notice period starting the day the owner approved, and only becomes
// an ex-tenant once the backend's daily job marks moveoutRequest.completedAt.
const isOnNotice = (r) => r?.moveoutRequest?.status === "approved" && !r?.moveoutRequest?.completedAt;

const viewStatus = (r) => {
  const mr = r?.moveoutRequest || {};
  if (mr.status === "approved") return mr.completedAt ? "completed" : "approved";
  return mr.status || "pending";
};

// Whole days left before the tenant moves out. Negative/zero means the notice
// has elapsed and the nightly job will close the tenancy on its next run.
const daysLeft = (noticeEndDate) => {
  if (!noticeEndDate) return null;
  const end = new Date(noticeEndDate);
  if (isNaN(end)) return null;
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86400000);
};

// Mirrors services/moveoutService.calcNoticeEndDate on the backend so the modal
// can preview the exit date before the owner commits. The backend value is
// authoritative — this is display only.
const calcNoticeEnd = (from = new Date()) => {
  const start = new Date(from);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  if (end.getDate() !== start.getDate()) end.setDate(0);
  return end;
};

const Pill = ({ tone = "muted", children }) => {
  const t = {
    success: "bg-green-100 text-green-700 border border-green-200",
    warning: "bg-amber-100 text-amber-700 border border-amber-200",
    danger:  "bg-red-100 text-red-700 border border-red-200",
    info:    "bg-blue-100 text-blue-700 border border-blue-200",
    muted:   "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${t[tone] || t.muted}`}>
      {children}
    </span>
  );
};

export default function MoveoutRequestsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [tab, setTab]             = useState("pending");

  // Settlement modal
  const [showModal, setShowModal]           = useState(false);
  const [selected, setSelected]             = useState(null);
  const [duesAtMoveout, setDuesAtMoveout]   = useState(0);
  const [refundAmount, setRefundAmount]     = useState(0);
  const [refundStatus, setRefundStatus]     = useState("cleared");
  const [submitting, setSubmitting]         = useState(false);

  // Cancel-notice modal — calls off an approved move-out mid-notice.
  const [cancelModal, setCancelModal]   = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling]     = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/tenants/moveout/owner/${encodeURIComponent(owner.loginId)}`);
      setRequests(Array.isArray(data?.requests) ? data.requests : []);
    } catch (err) {
      console.error("Error fetching moveout requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [owner.loginId]);

  const counts = useMemo(() => ({
    all:       requests.length,
    pending:   requests.filter(r => viewStatus(r) === "pending").length,
    approved:  requests.filter(r => viewStatus(r) === "approved").length,
    completed: requests.filter(r => viewStatus(r) === "completed").length,
    rejected:  requests.filter(r => viewStatus(r) === "rejected").length,
  }), [requests]);

  const filtered = useMemo(() => {
    let list = tab === "all" ? requests : requests.filter(r => viewStatus(r) === tab);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.roomNo || "").toLowerCase().includes(q) ||
        (r.loginId || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, tab, search]);

  const openSettle = async (item) => {
    setSelected(item);
    const dep = item.securityDepositPaid || 0;
    setDuesAtMoveout(0);
    setRefundAmount(dep);
    setRefundStatus("cleared");
    setShowModal(true);

    // Try to pull live ledger balance
    try {
      const res = await apiFetch(`/api/tenants/ledger/${encodeURIComponent(item.loginId)}`);
      if (res?.success) {
        const bal = res.finalBalance || 0;
        setDuesAtMoveout(bal);
        setRefundAmount(dep - bal > 0 ? dep - bal : 0);
      }
    } catch {}
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selected || submitting) return;
    try {
      setSubmitting(true);
      await apiFetch("/api/tenants/moveout/approve", {
        method: "POST",
        body: JSON.stringify({ tenantId: selected._id, duesAtMoveout, refundAmount, refundStatus })
      });
      setShowModal(false);
      setSelected(null);
      fetchRequests();
    } catch (err) {
      alert(err.message || "Failed to approve checkout");
    } finally {
      setSubmitting(false);
    }
  };

  const submitCancelNotice = async () => {
    const reason = cancelReason.trim();
    if (!cancelModal || cancelling) return;
    try {
      setCancelling(true);
      await apiFetch("/api/tenants/moveout/cancel", {
        method: "POST",
        body: JSON.stringify({ tenantId: cancelModal._id, reason })
      });
      setCancelModal(null);
      setCancelReason("");
      fetchRequests();
    } catch (err) {
      alert(err.message || "Failed to cancel the notice period");
    } finally {
      setCancelling(false);
    }
  };

  const handleReject = async (item) => {
    if (!window.confirm(`Reject move-out request for ${item.name}?`)) return;
    try {
      await apiFetch("/api/tenants/moveout/reject", {
        method: "POST",
        body: JSON.stringify({ tenantId: item._id })
      });
      fetchRequests();
    } catch (err) {
      alert(err.message || "Failed to reject move-out request");
    }
  };

  const TABS = [
    { k: "pending",   l: "Pending" },
    { k: "approved",  l: "On Notice" },
    { k: "completed", l: "Moved Out" },
    { k: "rejected",  l: "Rejected" },
    { k: "all",       l: "All" },
  ];

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Move-out Notices"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Move-out Requests</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Review exit notices raised by your tenants. Approving starts a fixed 1-month notice period.
          </p>
        </div>
        {!loading && (
          <div className="flex gap-2 flex-wrap shrink-0 md:mt-2">
            <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-3 py-1 font-semibold">
              {counts.pending} Pending
            </span>
            <span className="text-[11px] bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-3 py-1 font-semibold">
              {counts.all} Total
            </span>
          </div>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 flex-wrap">
          {TABS.map(({ k, l }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={[
                "h-9 px-3.5 rounded-lg text-[12.5px] font-medium transition-colors",
                tab === k
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/40"
              ].join(" ")}
            >
              {l} <span className="opacity-60 ml-0.5">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant or room..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <Loader2 className="size-7 animate-spin mb-3" />
          <p className="text-[13px]">Loading move-out requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border bg-card rounded-2xl text-muted-foreground">
          <LogOut className="size-8 mx-auto mb-3 opacity-30" />
          <p className="text-[13px]">
            {requests.length === 0
              ? "No move-out requests from your tenants yet."
              : "No requests match the current filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const mr = item.moveoutRequest || {};
            const vs = viewStatus(item);
            const cfg = STATUS_CONFIG[vs] || STATUS_CONFIG.pending;
            const isPending = vs === "pending";
            const onNotice = isOnNotice(item);
            const remaining = onNotice ? daysLeft(mr.noticeEndDate) : null;

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft flex flex-col gap-4"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                      <LogOut size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-[15px] text-foreground leading-snug">{item.name || "—"}</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        Room {item.roomNo || "—"} &nbsp;·&nbsp; {item.loginId || "—"}
                      </p>
                    </div>
                  </div>
                  <Pill tone={cfg.tone}>
                    <cfg.Icon className="size-3" />
                    {cfg.label}
                  </Pill>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <CalendarDays className="size-3" /> Requested Exit
                    </span>
                    <span className="font-semibold text-foreground">{fmtDate(mr.requestedDate)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <CalendarDays className="size-3" /> Submitted On
                    </span>
                    <span className="font-semibold text-foreground">{fmtDate(mr.submittedAt)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <IndianRupee className="size-3" /> Security Deposit
                    </span>
                    <span className="font-semibold text-foreground">{fmt(item.securityDepositPaid)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <Phone className="size-3" /> Phone
                    </span>
                    <span className="font-semibold text-foreground">{item.phone || "—"}</span>
                  </div>
                </div>

                {/* Reason */}
                {mr.reason && (
                  <p className="text-[12px] text-muted-foreground italic bg-muted/30 px-3 py-2 rounded-lg border border-border/40 line-clamp-2">
                    "{mr.reason}"
                  </p>
                )}

                {/* Notice period — approved but not yet moved out */}
                {onNotice && (
                  <div className="text-[12px] bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-muted-foreground block">Notice period ends</span>
                        <span className="font-bold text-blue-800">{fmtDate(mr.noticeEndDate)}</span>
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-full px-2.5 py-1 shrink-0">
                        {remaining === null
                          ? "1 month notice"
                          : remaining > 0
                            ? `${remaining} day${remaining === 1 ? "" : "s"} left`
                            : "Completing tonight"}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-blue-700/80 leading-snug">
                      Still a tenant until then — rent and ledger continue as normal. They move to
                      Ex-Tenants automatically on this date, and their panel access closes.
                    </p>
                  </div>
                )}

                {/* Approved summary */}
                {mr.status === "approved" && (
                  <div className="grid grid-cols-2 gap-3 text-[12px] bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                    <div>
                      <span className="text-muted-foreground block">Dues cleared</span>
                      <span className="font-bold text-red-600">{fmt(mr.duesAtMoveout)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Deposit refunded</span>
                      <span className="font-bold text-green-700">{fmt(mr.refundAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Actions — cancelling is only possible while the notice runs;
                    once it completes the bed is released and may be re-let. */}
                {onNotice && (
                  <div className="pt-1 border-t border-border/60">
                    <button
                      onClick={() => { setCancelModal(item); setCancelReason(""); }}
                      className="w-full h-10 border border-border rounded-xl text-[12px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <Undo2 className="size-3.5" />
                      Cancel Notice — Keep Tenant
                    </button>
                  </div>
                )}

                {/* Actions */}
                {isPending && (
                  <div className="flex gap-2 pt-1 border-t border-border/60">
                    <button
                      onClick={() => openSettle(item)}
                      className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[12px] font-bold transition-colors"
                    >
                      Clear Dues & Approve
                    </button>
                    <button
                      onClick={() => handleReject(item)}
                      className="px-4 h-10 border border-border rounded-xl text-[12px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Notice Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="size-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Undo2 className="size-6 text-amber-600" />
            </div>
            <h3 className="font-serif text-[22px] text-foreground mb-1">Cancel move-out notice?</h3>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              <strong>{cancelModal.name}</strong> stays on as a normal tenant and their notice period
              {cancelModal.moveoutRequest?.noticeEndDate
                ? ` (ending ${fmtDate(cancelModal.moveoutRequest.noticeEndDate)})`
                : ""}{" "}
              is called off. The settlement figures recorded at approval are cleared, and they would
              have to raise a fresh move-out notice to leave.
            </p>

            <label className="text-[12px] font-bold text-slate-700 block mb-1">
              Reason for cancelling <span className="font-medium text-muted-foreground">(optional)</span>
            </label>
            <textarea
              autoFocus
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Tenant changed their mind and wants to continue staying"
              className="w-full px-3 py-2 border border-border rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 placeholder:text-muted-foreground"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              If given, this is shown to the tenant on their Move-out Notice page.
            </p>

            <div className="flex gap-2 pt-5">
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                disabled={cancelling}
                className="flex-1 h-10 rounded-xl border border-border text-[12px] font-bold hover:bg-muted transition-colors disabled:opacity-50"
              >
                Keep Notice
              </button>
              <button
                type="button"
                onClick={submitCancelNotice}
                disabled={cancelling}
                className="flex-1 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelling ? "Cancelling..." : "Cancel Move-out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-serif text-[22px] text-foreground mb-1">Final Settlement</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Settling dues and approving checkout for <strong>{selected.name}</strong>.
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 text-[11.5px] text-blue-800 leading-relaxed">
              <strong className="block mb-0.5">This starts a 1-month notice period.</strong>
              {selected.name} stays an active tenant until{" "}
              <strong>{fmtDate(calcNoticeEnd())}</strong>, then moves to Ex-Tenants automatically and
              loses panel access. You can cancel the notice any time before that date.
            </div>

            <form onSubmit={handleApprove} className="space-y-4">
              <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-[12px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenant</span>
                  <span className="font-semibold text-slate-800">{selected.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room</span>
                  <span className="font-semibold text-slate-800">{selected.roomNo || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Deposit Paid</span>
                  <span className="font-bold text-slate-800">{fmt(selected.securityDepositPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Exit</span>
                  <span className="font-semibold text-slate-800">{fmtDate(selected.moveoutRequest?.requestedDate)}</span>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Outstanding Dues (₹)</label>
                <input
                  type="number" min="0"
                  value={duesAtMoveout}
                  onChange={(e) => {
                    const dues = Number(e.target.value) || 0;
                    setDuesAtMoveout(dues);
                    const dep = selected.securityDepositPaid || 0;
                    setRefundAmount(dep - dues > 0 ? dep - dues : 0);
                  }}
                  className="w-full h-10 px-3 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Deposit Refund Amount (₹)</label>
                <input
                  type="number" min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Refund Status</label>
                <select
                  value={refundStatus}
                  onChange={(e) => setRefundStatus(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="cleared">Cleared — Refund Handed Over</option>
                  <option value="pending">Pending Settlement</option>
                  <option value="deductions_applied">Deductions Applied</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setSelected(null); }}
                  disabled={submitting}
                  className="flex-1 h-10 rounded-xl border border-border text-[12px] font-bold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Processing..." : "Approve & Start Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
