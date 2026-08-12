import React, { useEffect, useState, useCallback } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { fetchInvoices, fetchPenaltyConfigs, waivePenalty } from "../../utils/rentCollectionApi";
import { AlertTriangle, Search, ShieldCheck, RefreshCw, Settings } from "lucide-react";

// ── Live penalty calculation (mirrors penaltyEngine.js) ──────────────────────

function calcDaysSinceDue(dueDate) {
  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueMs = new Date(new Date(dueDate).toDateString()).getTime();
  return Math.round((todayMs - dueMs) / 86400000);
}

function calcLivePenalties(inv, config) {
  if (!inv?.dueDate || !config) {
    return { daysSinceDue: 0, phase: 1, daysInPhase2: 0, daysInPhase3: 0, minorPenalty: 0, majorPenalty: 0, totalPenalty: 0, totalDue: 0, outstandingBase: inv?.rentAmount || 0 };
  }

  const minorDay = config.minorPenaltyDay ?? 1;
  const majorDay = config.majorPenaltyDay ?? 2;

  const daysSinceDue = calcDaysSinceDue(inv.dueDate);
  const phase = daysSinceDue < minorDay ? 1 : daysSinceDue < majorDay ? 2 : 3;
  const rentPaid = inv.rentPaidAmount ?? inv.paidAmount ?? 0;
  const outstandingBase = Math.max(0, (inv.rentAmount || 0) - rentPaid);
  const daysInPhase2 = Math.max(0, Math.min(daysSinceDue + 1, majorDay) - minorDay);
  const daysInPhase3 = Math.max(0, daysSinceDue - majorDay + 1);

  let minorPenalty = 0;
  let majorPenalty = 0;

  if (phase >= 2 && config.minorPenalty?.enabled) {
    const mp = config.minorPenalty;
    if (mp.type === 'percentage') minorPenalty = Math.round(outstandingBase * (mp.value / 100));
    else if (mp.type === 'per_day') minorPenalty = Math.round((mp.value || 0) * daysInPhase2);
    else minorPenalty = mp.value || 0; // fixed
  }

  if (phase >= 3 && config.majorPenalty?.enabled) {
    const daysOverMajor = Math.max(0, daysSinceDue - majorDay);
    const mp = config.majorPenalty;
    if (mp.type === 'percentage') majorPenalty = Math.round(outstandingBase * (mp.value / 100));
    else if (mp.type === 'fixed') majorPenalty = mp.value || 0;
    else if (mp.type === 'per_day') majorPenalty = Math.round((mp.value || 0) * daysInPhase3);
    else if (mp.type === 'daily_fixed') majorPenalty = (mp.value || 0) + daysOverMajor * (mp.incrementValue || 0);
    else if (mp.type === 'weekly_fixed') majorPenalty = (mp.value || 0) + Math.floor(daysOverMajor / 7) * (mp.incrementValue || 0);
    if (mp.maxCap && majorPenalty > mp.maxCap) majorPenalty = mp.maxCap;
    majorPenalty = Math.round(majorPenalty);
  }

  const totalPenalty = minorPenalty + majorPenalty;
  const totalDue = outstandingBase + totalPenalty;

  return { daysSinceDue, phase, daysInPhase2, daysInPhase3, minorPenalty, majorPenalty, totalPenalty, totalDue, outstandingBase };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASE_LABEL = { 1: "Phase 1", 2: "Phase 2 · Minor", 3: "Phase 3 · Major" };
const PHASE_COLOR = {
  1: "bg-blue-50 text-blue-700",
  2: "bg-amber-50 text-amber-700",
  3: "bg-rose-50 text-rose-700",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function LatePaymentsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [invoices, setInvoices] = useState([]);
  const [penaltyConfig, setPenaltyConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [waiverModal, setWaiverModal] = useState(null);
  const [waiverReason, setWaiverReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async (force = false) => {
    if (!owner?._id && !owner?.loginId) return;
    setLoading(true);
    try {
      const ownerId = owner._id || owner.loginId;
      const [invoiceData, configData] = await Promise.all([
        fetchInvoices({ ownerId, status: "PENDING,PARTIAL", limit: 200, propertyId: getActiveOwnerPropertyId() }, force),
        fetchPenaltyConfigs(ownerId, force),
      ]);

      // Use owner's global config; fall back to system defaults
      const cfg = (configData.configs || []).find(c => !c.propertyId && !c.unitId)
        || configData.globalDefaults
        || {};
      setPenaltyConfig(cfg);
      setInvoices(invoiceData.invoices || []);
    } catch (err) {
      showToast(err.message || "Failed to load penalty data", "error");
    } finally {
      setLoading(false);
    }
  }, [owner?._id, owner?.loginId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Enrich each invoice with live calculated values
  const enriched = invoices.map(inv => ({
    ...inv,
    live: calcLivePenalties(inv, penaltyConfig),
  }));

  // Late Payments page — only invoices in live phase 2 or 3
  const lateInvoices = enriched.filter(inv => inv.live.phase >= 2);

  const filtered = lateInvoices.filter(inv =>
    !search ||
    (inv.tenantName || "").toLowerCase().includes(search.toLowerCase()) ||
    (inv.billingMonth || "").includes(search) ||
    (inv.invoiceNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPenalty = filtered.reduce((s, i) => s + (i.live.totalPenalty || 0), 0);
  const totalOutstanding = filtered.reduce((s, i) => s + (i.live.totalDue || 0), 0);
  const phase3Count = filtered.filter(i => i.live.phase === 3).length;

  const handleWaive = async () => {
    if (!waiverModal || !waiverReason.trim()) return;
    setSaving(true);
    try {
      await waivePenalty(waiverModal.invoiceId, waiverReason, waiverModal.penaltyAmount);
      showToast(`Penalty waived for ${waiverModal.tenantName}`);
      setWaiverModal(null);
      setWaiverReason("");
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to waive penalty", "error");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => "₹" + (n || 0).toLocaleString("en-IN");

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Late Fee Accruals"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-[13px] font-medium text-white ${toast.type === "error" ? "bg-destructive" : "bg-emerald-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Page Header - desktop only */}
      <div className="hidden md:flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Late Fees &amp; Fines</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Live-calculated phase penalties based on current penalty settings.</p>
        </div>
        <div className="flex gap-2 items-start md:mt-2">
          <button onClick={() => loadData(true)} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-border bg-card text-[13px] font-medium hover:border-primary/40 transition-colors">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
          <button onClick={() => window.location.href = "/propertyowner/penalty-config"} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Settings className="size-3.5" /> Penalty settings
          </button>
        </div>
      </div>

      {/* Mobile Stat Strip */}
      <div className="flex md:hidden overflow-x-auto gap-3 pb-2 mb-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {[
          { title: "Penalties", value: loading ? "..." : fmt(totalPenalty), subtext: "Accrued fines", icon: AlertTriangle, bg: "bg-rose-50", ic: "text-rose-600" },
          { title: "Outstanding", value: loading ? "..." : fmt(totalOutstanding), subtext: "Total due", icon: RefreshCw, bg: "bg-amber-50", ic: "text-amber-600" },
          { title: "Critical", value: loading ? "..." : phase3Count, subtext: "Phase 3 tenants", icon: ShieldCheck, bg: "bg-slate-50", ic: "text-slate-600" },
        ].map(({ title, value, subtext, icon: Icon, bg, ic }) => (
          <div key={title} className="shrink-0 w-[130px] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${ic}`} />
              </div>
            </div>
            <div>
              <h3 className="text-[18px] font-black text-slate-900 leading-tight">{value}</h3>
              <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{title}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-1">{subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Summary Cards */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl border border-border bg-rose-50 p-4">
          <div className="text-[12.5px] text-rose-600 font-medium mb-1">Total Penalties Accrued</div>
          <div className="font-serif text-[26px] text-rose-700">{fmt(totalPenalty)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-amber-50 p-4">
          <div className="text-[12.5px] text-amber-700 font-medium mb-1">Total Outstanding</div>
          <div className="font-serif text-[26px] text-amber-800">{fmt(totalOutstanding)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-muted/60 p-4">
          <div className="text-[12.5px] text-muted-foreground font-medium mb-1">Phase 3 (Critical)</div>
          <div className="font-serif text-[26px] text-foreground">{phase3Count} tenant{phase3Count !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tenant name, invoice no, or billing month..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Fines Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="px-6 py-3.5 font-semibold">Tenant</th>
                <th className="px-6 py-3.5 font-semibold">Month</th>
                <th className="px-6 py-3.5 font-semibold">Days Overdue</th>
                <th className="px-6 py-3.5 font-semibold">Phase</th>
                <th className="px-6 py-3.5 font-semibold">Minor Penalty</th>
                <th className="px-6 py-3.5 font-semibold">Major Penalty</th>
                <th className="px-6 py-3.5 font-semibold">Total Penalty</th>
                <th className="px-6 py-3.5 font-semibold">Outstanding</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <ShieldCheck className="size-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground">No penalty accruals found</p>
                    <p className="text-[11.5px] text-muted-foreground mt-1">All tenants are in Phase 1 (grace period) or fully paid</p>
                  </td>
                </tr>
              ) : filtered.map((inv) => {
                const { daysSinceDue, phase, minorPenalty, majorPenalty, totalPenalty: livePenalty, totalDue } = inv.live;
                const wasWaived = Boolean(inv.waiver?.waivedAt);

                return (
                  <tr key={inv._id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{inv.tenantName || inv.tenantId?.name || "—"}</div>
                      <div className="text-[11.5px] text-muted-foreground">{inv.invoiceNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{inv.billingMonth}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">{daysSinceDue} day{daysSinceDue !== 1 ? "s" : ""}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-semibold ${PHASE_COLOR[phase] || "bg-muted text-muted-foreground"}`}>
                        {PHASE_LABEL[phase] || `Phase ${phase}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-amber-700">{fmt(minorPenalty)}</td>
                    <td className="px-6 py-4 text-rose-600">{fmt(majorPenalty)}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">{fmt(livePenalty)}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{fmt(totalDue)}</td>
                    <td className="px-6 py-4 text-right">
                      {wasWaived ? (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Penalty Waived
                        </span>
                      ) : livePenalty > 0 ? (
                        <button
                          onClick={() => setWaiverModal({ invoiceId: inv._id, tenantName: inv.tenantName || "Tenant", penaltyAmount: livePenalty })}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                        >
                          <AlertTriangle className="size-3" /> Waive Penalty
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waiver Modal */}
      {waiverModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl">
            <h2 className="font-serif text-[20px] text-foreground mb-1">Waive Penalty</h2>
            <p className="text-[13px] text-muted-foreground mb-4">
              Waiving {fmt(waiverModal.penaltyAmount)} for <strong>{waiverModal.tenantName}</strong>. A reason is required.
            </p>
            <textarea
              value={waiverReason}
              onChange={e => setWaiverReason(e.target.value)}
              placeholder="Enter reason for waiver (required)..."
              rows={3}
              className="w-full rounded-xl border border-border bg-muted/30 p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setWaiverModal(null); setWaiverReason(""); }}
                className="h-9 px-4 rounded-lg border border-border text-[13px] hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWaive}
                disabled={!waiverReason.trim() || saving}
                className="h-9 px-4 rounded-lg bg-rose-600 text-white text-[13px] font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm Waiver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
