import React, { useState, useEffect, useCallback } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { fetchInvoices, fetchPenaltyConfigs, sendReminder, recordPayment } from "../../utils/rentCollectionApi";
import { Search, Send, IndianRupee, RefreshCw, Smartphone, CreditCard, Banknote } from "lucide-react";

function calcDaysSinceDue(dueDate) {
  if (!dueDate) return 0;
  const todayMs = new Date(new Date().toDateString()).getTime();
  const dueMs = new Date(new Date(dueDate).toDateString()).getTime();
  return Math.max(0, Math.round((todayMs - dueMs) / 86400000));
}

function calcLivePenalties(inv, config) {
  if (!inv?.dueDate || !config) {
    return { phase: 1, totalPenalty: 0, totalDue: inv?.outstandingAmount || inv?.rentAmount || 0 };
  }
  const minorDay = config.minorPenaltyDay ?? 7;
  const majorDay = config.majorPenaltyDay ?? 12;
  const daysSinceDue = calcDaysSinceDue(inv.dueDate);
  const phase = daysSinceDue < minorDay ? 1 : daysSinceDue < majorDay ? 2 : 3;
  const rentPaid = inv.rentPaidAmount ?? inv.paidAmount ?? 0;
  const base = Math.max(0, (inv.rentAmount || 0) - rentPaid);
  const daysInPhase2 = Math.max(0, Math.min(daysSinceDue + 1, majorDay) - minorDay);
  const daysInPhase3 = Math.max(0, daysSinceDue - majorDay + 1);

  let minorPenalty = 0;
  let majorPenalty = 0;

  if (phase >= 2 && config.minorPenalty?.enabled) {
    const mp = config.minorPenalty;
    if (mp.type === "percentage") minorPenalty = Math.round(base * (mp.value / 100));
    else if (mp.type === "per_day") minorPenalty = Math.round((mp.value || 0) * daysInPhase2);
    else minorPenalty = mp.value || 0;
  }

  if (phase >= 3 && config.majorPenalty?.enabled) {
    const daysOverMajor = Math.max(0, daysSinceDue - majorDay);
    const mp = config.majorPenalty;
    if (mp.type === "percentage") majorPenalty = Math.round(base * (mp.value / 100));
    else if (mp.type === "fixed") majorPenalty = mp.value || 0;
    else if (mp.type === "per_day") majorPenalty = Math.round((mp.value || 0) * daysInPhase3);
    else if (mp.type === "daily_fixed") majorPenalty = (mp.value || 0) + daysOverMajor * (mp.incrementValue || 0);
    else if (mp.type === "weekly_fixed") majorPenalty = (mp.value || 0) + Math.floor(daysOverMajor / 7) * (mp.incrementValue || 0);
    if (mp.maxCap && majorPenalty > mp.maxCap) majorPenalty = mp.maxCap;
    majorPenalty = Math.round(majorPenalty);
  }

  const totalPenalty = minorPenalty + majorPenalty;
  const elec = inv.electricityBill || 0;
  const totalDue = base + totalPenalty + elec;
  return { phase, daysSinceDue, totalPenalty, totalDue };
}

const PHASE_BADGE = {
  1: { label: "Phase 1", cls: "bg-blue-50 text-blue-700" },
  2: { label: "Phase 2 · Minor", cls: "bg-amber-50 text-amber-700" },
  3: { label: "Phase 3 · Final", cls: "bg-rose-50 text-rose-700" },
};

function fmtMonth(billingMonth) {
  if (!billingMonth) return "—";
  const [y, m] = billingMonth.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[parseInt(m, 10) - 1]} ${y}`;
}

const fmt = n => "₹" + (n || 0).toLocaleString("en-IN");

export default function DuesReportPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [rawInvoices, setRawInvoices] = useState([]);
  const [penaltyConfig, setPenaltyConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [reminding, setReminding] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async (force = false) => {
    const ownerId = owner._id || owner.loginId;
    setLoading(true);
    try {
      const [invData, configData] = await Promise.allSettled([
        fetchInvoices({ ownerId, status: "PENDING,PARTIAL", limit: 200, propertyId: getActiveOwnerPropertyId() }, force),
        fetchPenaltyConfigs(ownerId, force),
      ]);
      if (invData.status === "fulfilled") {
        setRawInvoices(invData.value?.invoices || []);
      }
      if (configData.status === "fulfilled") {
        const cfg = configData.value;
        const g = cfg?.globalDefaults || {};
        const c = cfg?.configs?.[0] || {};
        setPenaltyConfig({
          minorPenaltyDay: c.minorPenaltyDay ?? g.minorPenaltyDay ?? 7,
          majorPenaltyDay: c.majorPenaltyDay ?? g.majorPenaltyDay ?? 12,
          minorPenalty: c.minorPenalty ?? g.minorPenalty ?? null,
          majorPenalty: c.majorPenalty ?? g.majorPenalty ?? null,
        });
      }
      if (invData.status === "rejected") showToast(invData.reason?.message || "Failed to load dues", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Recompute whenever raw invoices or config changes — no extra fetch needed
  const dues = rawInvoices.map(inv => {
    const live = calcLivePenalties(inv, penaltyConfig);
    return {
      id: inv._id,
      invoiceId: inv._id,
      name: inv.tenantId?.name || inv.tenantName || "Unknown Tenant",
      email: inv.tenantId?.email || inv.tenantEmail || "",
      phone: inv.tenantId?.phone || inv.tenantPhone || "",
      roomNo: inv.tenantId?.roomNo || "—",
      bedNo: inv.tenantId?.bedNo || "",
      billingMonth: inv.billingMonth,
      rentAmount: inv.rentAmount || 0,
      penalty: live.totalPenalty,
      outstanding: live.totalDue,
      electricityBill: inv.electricityBill || 0,
      electricityUnits: inv.electricityUnitsConsumed || 0,
      electricityAdded: inv.electricityReadingAdded || false,
      dueDate: inv.dueDate,
      daysOverdue: live.daysSinceDue,
      phase: live.phase,
      status: inv.status,
    };
  }).sort((a, b) => b.daysOverdue - a.daysOverdue);

  const handleSendAlert = async (row) => {
    if (!row.email) {
      showToast(`No email on file for ${row.name}. Add it from Tenants page.`, "error");
      return;
    }
    setReminding(row.id);
    try {
      await sendReminder(row.id, row.email, row.name);
      showToast(`Reminder sent to ${row.name}`);
    } catch (err) {
      showToast(err.message || "Failed to send reminder", "error");
    } finally {
      setReminding(null);
    }
  };

  const handleRecordPayment = async (row) => {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) { showToast("Enter a valid amount", "error"); return; }
    try {
      await recordPayment(row.id, amt, payMethod);
      showToast(`₹${amt.toLocaleString("en-IN")} recorded for ${row.name}`);
      setPayingId(null);
      setPayAmount("");
      setPayMethod("cash");
      load();
    } catch (err) {
      showToast(err.message || "Payment failed", "error");
    }
  };

  const filtered = dues.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.roomNo.includes(search) ||
    (d.billingMonth || "").includes(search)
  );

  const totalOutstanding = dues.reduce((s, d) => s + d.outstanding, 0);
  const avgDays = dues.length
    ? Math.round(dues.reduce((s, d) => s + d.daysOverdue, 0) / dues.length)
    : 0;

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Outstanding Dues"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-[13px] font-medium ${toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}>{toast.msg}</div>
      )}

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Outstanding Dues</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Monitor outstanding balances, track aging schedules, and trigger reminders.</p>
        </div>
        <button onClick={() => load(true)} disabled={loading}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border text-[13px] font-medium hover:bg-muted/40 disabled:opacity-50 shrink-0">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats — Desktop 3-col grid */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Total Outstanding Dues</span>
          <h3 className="text-[28px] font-bold text-rose-600 mt-1">{fmt(totalOutstanding)}</h3>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Defaulter Residents</span>
          <h3 className="text-[28px] font-bold text-foreground mt-1">
            {loading ? "—" : dues.length} <span className="text-sm font-normal text-muted-foreground">Tenants</span>
          </h3>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Avg. Days Delinquent</span>
          <h3 className="text-[28px] font-bold text-foreground mt-1">
            {loading ? "—" : avgDays} <span className="text-sm font-normal text-muted-foreground">Days</span>
          </h3>
        </div>
      </div>

      {/* Mobile Stat Strip */}
      <div className="flex overflow-x-auto gap-3 pb-2 mb-5 md:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {[
          { title: "Outstanding", value: loading ? "..." : fmt(totalOutstanding), subtext: "Total dues", icon: IndianRupee, bg: "bg-rose-50", ic: "text-rose-600" },
          { title: "Defaulters", value: loading ? "..." : dues.length, subtext: "Tenants", icon: RefreshCw, bg: "bg-amber-50", ic: "text-amber-600" },
          { title: "Avg Days", value: loading ? "..." : `${avgDays}d`, subtext: "Overdue avg", icon: Search, bg: "bg-indigo-50", ic: "text-indigo-600" },
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

      {/* Search */}
      <div className="relative mb-6">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, room, or billing month..."
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-[13px]">
            <RefreshCw className="size-4 animate-spin mr-2" /> Loading dues...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <IndianRupee className="size-8 mb-3 opacity-30" />
            <p className="text-[14px] font-medium">{search ? "No results found" : "No outstanding dues"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                  <th className="px-6 py-3.5 font-semibold">Tenant Name</th>
                  <th className="px-6 py-3.5 font-semibold">Room & Bed</th>
                  <th className="px-6 py-3.5 font-semibold">Billing Month</th>
                  <th className="px-6 py-3.5 font-semibold">Rent</th>
                  <th className="px-6 py-3.5 font-semibold">Penalty</th>
                  <th className="px-6 py-3.5 font-semibold">Electricity</th>
                  <th className="px-6 py-3.5 font-semibold">Total Due</th>
                  <th className="px-6 py-3.5 font-semibold">Phase</th>
                  <th className="px-6 py-3.5 font-semibold">Aging</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(d => (
                  <React.Fragment key={d.id}>
                    <tr className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{d.name}</div>
                        {d.email && <div className="text-[11px] text-muted-foreground">{d.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {d.roomNo !== "—" ? (
                          <>
                            <div className="font-bold text-foreground">Room {d.roomNo}</div>
                            {d.bedNo && <div className="text-[11px] text-muted-foreground">Bed {d.bedNo}</div>}
                          </>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{fmtMonth(d.billingMonth)}</td>
                      <td className="px-6 py-4 text-foreground">{fmt(d.rentAmount)}</td>
                      <td className="px-6 py-4 text-rose-600 font-medium">{d.penalty > 0 ? fmt(d.penalty) : <span className="text-muted-foreground">₹0</span>}</td>
                      <td className="px-6 py-4">
                        {d.electricityAdded
                          ? <div>
                            <div className="font-medium text-amber-600">{fmt(d.electricityBill)}</div>
                            <div className="text-[11px] text-muted-foreground">{d.electricityUnits} units</div>
                          </div>
                          : <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">⚡ Pending</span>
                        }
                      </td>
                      <td className="px-6 py-4 font-bold text-rose-600">{fmt(d.outstanding)}</td>
                      <td className="px-6 py-4">
                        {PHASE_BADGE[d.phase] && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${PHASE_BADGE[d.phase].cls}`}>
                            {PHASE_BADGE[d.phase].label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${d.daysOverdue > 30 ? "bg-rose-50 text-rose-600" : d.daysOverdue > 10 ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                          }`}>
                          {d.daysOverdue} Days
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleSendAlert(d)}
                          disabled={reminding === d.id}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold disabled:opacity-50"
                        >
                          {reminding === d.id
                            ? <RefreshCw size={12} className="animate-spin" />
                            : <Send size={12} />}
                          Send Alert
                        </button>
                        <button
                          onClick={() => { setPayingId(payingId === d.id ? null : d.id); setPayAmount(""); setPayMethod("cash"); }}
                          className="h-8 px-3 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>

                    {/* Inline payment row */}
                    {payingId === d.id && (
                      <tr className="bg-muted/30">
                        <td colSpan={10} className="px-6 py-4">
                          <div className="space-y-3">
                            {/* Method selector */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[12px] text-muted-foreground font-medium shrink-0">Payment method:</span>
                              {[
                                { key: "upi", label: "UPI Received", Icon: Smartphone },
                                { key: "bank_transfer", label: "Bank Transfer", Icon: CreditCard },
                                { key: "cash", label: "Cash Given", Icon: Banknote },
                              ].map(({ key, label, Icon }) => (
                                <button
                                  key={key}
                                  onClick={() => setPayMethod(key)}
                                  className={[
                                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border transition-colors",
                                    payMethod === key
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border text-muted-foreground hover:border-primary/40"
                                  ].join(" ")}
                                >
                                  <Icon className="size-3.5" />{label}
                                </button>
                              ))}
                            </div>
                            {/* Amount + confirm */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-[12px] text-muted-foreground font-medium">Amount for {d.name}:</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="Amount (₹)"
                                value={payAmount}
                                onChange={e => setPayAmount(e.target.value)}
                                className="h-8 w-40 rounded-lg border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                autoFocus
                              />
                              <button
                                onClick={() => handleRecordPayment(d)}
                                className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => { setPayingId(null); setPayMethod("cash"); }}
                                className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PropertyOwnerLayout>
  );
}
