import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { Send, Plus, Search, Wallet, CheckCircle2, Clock, AlertTriangle, Phone, MessageCircle, RefreshCw, X, Receipt, Smartphone, CreditCard, Banknote, FileText, Printer } from "lucide-react";
import { RentReceiptModal } from "../../components/propertyowner/RentReceiptModal";
import { MobileTabs, MobileEmptyState } from "../../components/propertyowner/MobileComponents";
import {
  clearOwnerRuntimeSession,
  fetchOwnerTenants,
  getOwnerRuntimeSession,
  getActiveOwnerPropertyId
} from "../../utils/propertyowner";
import {
  fetchRentDashboard,
  fetchInvoices,
  fetchInvoiceById,
  sendReminder,
  recordPayment,
  generateInvoices,
  fetchPenaltyConfigs,
  fetchMissingContacts,
  fetchCashRequests,
  approveCashRequest,
  rejectCashRequest,
} from "../../utils/rentCollectionApi";

const Pill = ({ tone = "muted", children }) => {
  const toneMap = {
    success: "bg-success/15 text-success-foreground",
    warning: "bg-warning/20 text-foreground",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-foreground",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium ${toneMap[tone] || toneMap.muted}`}>
      {children}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, tone = "default", hint, onClick }) => {
  const iconClr = {
    info: "text-blue-500",
    success: "text-emerald-500",
    warning: "text-amber-500",
    default: "text-slate-400"
  };

  return (
    <div onClick={onClick} className={`w-[38%] md:w-auto shrink-0 snap-start rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        {Icon && <Icon className={`size-4 shrink-0 ${iconClr[tone] || iconClr.default}`} />}
      </div>
      <div className="text-2xl font-black leading-none text-slate-800">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1 font-semibold">{hint}</div>}
    </div>
  );
};

const PHASE_CONFIG = {
  1: { label: "Phase 1 · Reminder", tone: "info" },
  2: { label: "Phase 2 · Minor Penalty", tone: "warning" },
  3: { label: "Phase 3 · Final Notice", tone: "danger" },
};

// Live penalty + phase calculation using current DB config (mirrors penaltyEngine.js).
function calcLivePenalties(inv, config) {
  if (!inv?.dueDate || !config) {
    return { phase: 1, totalPenalty: 0, totalDue: inv?.status === "PAID" ? 0 : (inv?.outstandingAmount || inv?.rentAmount || 0) };
  }
  const minorDay = config.minorPenaltyDay ?? 7;
  const majorDay = config.majorPenaltyDay ?? 12;
  const todayMs = new Date(new Date().toDateString()).getTime();
  const dueMs = new Date(new Date(inv.dueDate).toDateString()).getTime();
  const daysSinceDue = Math.round((todayMs - dueMs) / 86400000);
  const phase = daysSinceDue < minorDay ? 1 : daysSinceDue < majorDay ? 2 : 3;

  // Lock purely settled invoices to their true generated penalty and zero due
  if (inv?.status === "PAID") {
    return { phase, daysSinceDue, totalPenalty: inv.totalPenalty || 0, totalDue: 0 };
  }

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

  // Outstanding safely balances physical money vs exact sum components mathematically
  const computedGross = (inv.rentAmount || 0) + totalPenalty + elec;
  const computedNet = Math.max(0, computedGross - (inv.paidAmount || rentPaid || 0));

  return { phase, daysSinceDue, totalPenalty, totalDue: computedNet };
}

const currentBillingMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const CalculationHistoryModal = ({ isOpen, onClose, rows, totalExpected, totalCollected, totalDue }) => {
  if (!isOpen) return null;

  const sumPaid = rows.reduce((s, row) => s + (row.invoice?.paidAmount || 0), 0);
  const sumPending = rows.reduce((s, row) => s + (row.outstandingAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Calculation History</h2>
            <p className="text-sm text-slate-500 mt-1">Detailed breakdown of rent collections and outstanding amounts.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="size-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Expected</div>
              <div className="text-3xl font-black text-slate-800">₹{(totalExpected || 0).toLocaleString("en-IN")}</div>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center">
              <div className="text-sm font-semibold text-emerald-600 mb-1 uppercase tracking-wider">Total Collected</div>
              <div className="text-3xl font-black text-emerald-700">₹{(totalCollected || 0).toLocaleString("en-IN")}</div>
            </div>
            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-center">
              <div className="text-sm font-semibold text-rose-600 mb-1 uppercase tracking-wider">Total Outstanding</div>
              <div className="text-3xl font-black text-rose-700">₹{(totalDue || 0).toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Tenant & Room</th>
                  <th className="p-4">Rent Configuration</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => {
                  const baseRent = row.baseRoomRent || row.agreedRent || 0;
                  const agreedRent = row.agreedRent || 0;
                  const isReduced = baseRent > agreedRent;
                  const paid = row.invoice?.paidAmount || 0;
                  const pending = row.outstandingAmount || 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{row.name}</div>
                        <div className="text-xs text-slate-500">Room {row.roomNo || "—"}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-slate-500">Base Rent:</span>
                            <span className="font-semibold">₹{baseRent.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-slate-500">Final Rent:</span>
                            <span className="font-bold text-slate-800">₹{agreedRent.toLocaleString('en-IN')}</span>
                          </div>
                          {row.invoice?.electricityBill > 0 && (
                            <div className="text-xs flex items-center justify-between mt-0.5">
                              <span className="text-slate-500">Electricity:</span>
                              <span className="font-semibold text-sky-600">₹{row.invoice.electricityBill.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {row.activePenalty > 0 && (
                            <div className="text-xs flex items-center justify-between mt-0.5">
                              <span className="text-slate-500">Penalty:</span>
                              <span className="font-semibold text-rose-500">₹{row.activePenalty.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <div className="mt-1">
                            {isReduced ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                Rent Reduced by ₹{(baseRent - agreedRent).toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                Fixed Rent
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-base font-bold text-emerald-600">₹{paid.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-base font-bold text-rose-600">₹{pending.toLocaleString('en-IN')}</div>
                        {pending > 0 && row.phase > 1 && (
                          <div className="text-[10px] text-rose-500 mt-1 font-semibold">Includes penalties</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 font-medium">No active tenants found.</td>
                  </tr>
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800 text-sm">
                  <tr>
                    <td className="p-4" colSpan={2}>Total Sum</td>
                    <td className="p-4 text-emerald-700 text-base font-black">₹{sumPaid.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-rose-700 text-base font-black">₹{sumPending.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Payment() {
  const [owner, setOwner] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [dashStats, setDashStats] = useState(null);
  const [penaltyConfig, setPenaltyConfig] = useState(null);
  const [missingContacts, setMissingContacts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Collection");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [remindingId, setRemindingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);
  const [genConfirmOpen, setGenConfirmOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState(null); // { tenantName, billingMonth, payments[] }
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [payModal, setPayModal] = useState(null); // { row }
  const [payModalMethod, setPayModalMethod] = useState("cash");
  const [payModalAmt, setPayModalAmt] = useState(0);
  const [payModalLoading, setPayModalLoading] = useState(false);
  const isRecordingRef = useRef(false);
  const [showCalcHistory, setShowCalcHistory] = useState(false);
  const [toast, setToast] = useState(null);
  const [cashRequests, setCashRequests] = useState([]);
  const [cashRequestsLoading, setCashRequestsLoading] = useState(false);
  const [cashActionId, setCashActionId] = useState(null);
  const [cashRejectReason, setCashRejectReason] = useState("");
  const [cashRejectTarget, setCashRejectTarget] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async (session) => {
    if (!session?.loginId) return;
    setLoading(true);
    setCashRequestsLoading(true);
    try {
      const [tenantsData, dashData, invData, configData, contactData] = await Promise.allSettled([
        fetchOwnerTenants(session.loginId),
        fetchRentDashboard(session._id || session.loginId),
        fetchInvoices({ ownerId: session._id || session.loginId, limit: 100, propertyId: getActiveOwnerPropertyId() }),
        fetchPenaltyConfigs(session._id || session.loginId),
        fetchMissingContacts(session._id || session.loginId),
      ]);
      const cashData = await fetchCashRequests(session._id || session.loginId).catch(() => ({ requests: [] }));
      if (tenantsData.status === "fulfilled") setTenants(tenantsData.value || []);
      if (dashData.status === "fulfilled") setDashStats(dashData.value?.stats);
      if (invData.status === "fulfilled") setInvoices(invData.value?.invoices || []);
      if (contactData.status === "fulfilled") setMissingContacts(contactData.value);
      setCashRequests(cashData?.requests || cashData?.cashRequests || cashData?.items || []);
      if (configData.status === "fulfilled") {
        const cfg = configData.value;
        const g = cfg?.globalDefaults || {};
        const c = cfg?.configs?.[0] || {};
        // Merge: owner-saved config wins over global defaults
        setPenaltyConfig({
          minorPenaltyDay: c.minorPenaltyDay ?? g.minorPenaltyDay ?? 7,
          majorPenaltyDay: c.majorPenaltyDay ?? g.majorPenaltyDay ?? 12,
          minorPenalty: c.minorPenalty ?? g.minorPenalty ?? null,
          majorPenalty: c.majorPenalty ?? g.majorPenalty ?? null,
        });
      }
    } finally {
      setLoading(false);
      setCashRequestsLoading(false);
    }
  }, []);

  const [walletData, setWalletData] = useState({
    heldBalance: 0,
    availableBalance: 0,
    walletBalance: 0,
    withdrawnBalance: 0,
    bankDetails: {}
  });
  const [walletLoading, setWalletLoading] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const fetchWallet = useCallback(async (loginId) => {
    if (!loginId) return;
    setWalletLoading(true);
    try {
      const res = await fetchJson(`/api/wallet/owner/balance?loginId=${loginId}`).catch(() => null);
      if (res?.wallet) {
        setWalletData(res.wallet);
      }
    } catch (err) {
      console.error("Wallet error:", err);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const handleInstantWithdraw = async (e) => {
    e.preventDefault();
    const num = parseFloat(withdrawAmt);
    if (isNaN(num) || num <= 0) {
      showToast("Please enter a valid withdrawal amount", "error");
      return;
    }
    setWithdrawLoading(true);
    try {
      const session = getOwnerRuntimeSession();
      const res = await fetchJson("/api/wallet/owner/withdraw-instant", {
        method: "POST",
        body: JSON.stringify({
          loginId: session?.loginId,
          amount: num
        })
      });
      if (res?.success) {
        showToast(res.message || "🎉 Withdrawal transferred to bank account!");
        setWithdrawModalOpen(false);
        setWithdrawAmt("");
        if (session?.loginId) fetchWallet(session.loginId);
      } else {
        showToast(res?.message || "Withdrawal failed", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to process instant withdrawal", "error");
    } finally {
      setWithdrawLoading(false);
    }
  };

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) { window.location.href = "/propertyowner/ownerlogin"; return; }
    setOwner(session);
    loadData(session);
    fetchWallet(session.loginId);
  }, [loadData, fetchWallet]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Real-time SSE listener for instant dashboard updates
  useEffect(() => {
    if (!owner?.loginId) return;

    // Connect to the generic owner event stream
    const sse = new EventSource(`${import.meta.env.VITE_API_BASE_URL || ''}/api/owners/${owner.loginId}/stream`);

    sse.addEventListener('CASH_REQUEST_NEW', (e) => {
      try {
        const data = JSON.parse(e.data || '{}');
        setCashRequestsLoading(true);
        // Silently re-fetch cash requests in background
        fetchCashRequests(owner._id || owner.loginId)
          .then(res => setCashRequests(res?.requests || res?.cashRequests || res?.items || []))
          .catch(err => console.error("SSE fetch cash error:", err))
          .finally(() => setCashRequestsLoading(false));

        setToast({ msg: `New cash payment request from ${data.tenantName || 'a tenant'}!`, type: "success" });
        setTimeout(() => setToast(null), 4000);
      } catch (err) {
        console.error("SSE parsing error:", err);
      }
    });

    return () => sse.close();
  }, [owner?.loginId, owner?._id]);

  // Pre-index current-month invoices by tenantId to eliminate O(n²) find on every render
  const invoiceMap = useMemo(() => {
    const m = new Map();
    const month = currentBillingMonth();
    invoices.forEach(inv => {
      if (inv.billingMonth === month) {
        m.set(String(inv.tenantId?._id || inv.tenantId), inv);
      }
    });
    return m;
  }, [invoices]);

  // Active tenants with rent > 0 who haven't checked out — only these get invoices.
  const invoiceableTenants = useMemo(() => {
    return tenants.filter(t => {
      if ((t.agreedRent || t.rent || 0) <= 0 || t.checkoutDate) {
        return false;
      }
      return true;
    });
  }, [tenants]);


  // Filter pending cash requests (PENDING_APPROVAL or REQUESTED) to hide owner-approved/rejected ones.
  const pendingRequests = useMemo(() => {
    return cashRequests.filter(request => {
      const status = String(request.cashRequestStatus || request.status || "PENDING_APPROVAL").toUpperCase();
      return ["PENDING_APPROVAL", "REQUESTED"].includes(status);
    });
  }, [cashRequests]);
  const alreadyInvoicedCount = useMemo(
    () => invoiceableTenants.filter(t => invoiceMap.has(String(t._id || t.id))).length,
    [invoiceableTenants, invoiceMap]
  );
  const toGenerateCount = invoiceableTenants.length - alreadyInvoicedCount;

  const billingMonthLabel = () => {
    const [yr, mo] = currentBillingMonth().split('-');
    return new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString('en', { month: 'long' }) + ' ' + yr;
  };

  // Merge tenant list with invoice data; recalculate phase + charges live from current config
  const rows = useMemo(() => tenants.map(t => {
    const tId = String(t._id || t.id || "");
    const tLogin = String(t.loginId || "").toUpperCase();
    const inv = invoiceMap.get(tId) || invoices.find(i => {
      const invTenantId = String(i.tenantId?._id || i.tenantId?.id || i.tenantId || "");
      const invLogin = String(i.tenantId?.loginId || i.tenantLoginId || "").toUpperCase();
      return (invTenantId === tId || (tLogin && invLogin === tLogin));
    });
    if (!inv) return { ...t, payStatus: "no-invoice", phase: 0, invoice: null, outstandingAmount: 0, activePenalty: 0 };
    const liveCalc = calcLivePenalties(inv, penaltyConfig);
    const due = liveCalc.totalDue;
    const phase = liveCalc.phase;
    const payStatus = inv.status === "PAID" || inv.status === "WAIVED" ? "paid"
      : inv.status === "PARTIAL" ? "partial"
        : due > 0 && phase >= 2 ? "overdue"
          : "due";
    return { ...t, payStatus, phase, invoice: inv, outstandingAmount: due, activePenalty: liveCalc.totalPenalty || 0 };
  }), [tenants, invoiceMap, penaltyConfig]);

  // Live phase breakdown computed from rows (not stale dashStats.phase1/2/3)
  const livePhaseCounts = useMemo(() => ({
    phase1: rows.filter(r => r.payStatus !== "paid" && r.phase === 1).length,
    phase2: rows.filter(r => r.payStatus !== "paid" && r.phase === 2).length,
    phase3: rows.filter(r => r.payStatus !== "paid" && r.phase === 3).length,
  }), [rows]);

  const counts = useMemo(() => ({
    all: rows.length,
    due: rows.filter(r => r.payStatus === "due").length,
    partial: rows.filter(r => r.payStatus === "partial").length,
    paid: rows.filter(r => r.payStatus === "paid").length,
    overdue: rows.filter(r => r.payStatus === "overdue").length,
  }), [rows]);

  const filtered = useMemo(() => (
    tab === "Collection" ? rows :
      tab === "Pending" ? rows.filter(r => r.payStatus === "due" || r.payStatus === "partial" || r.payStatus === "overdue") :
        tab === "History" ? rows.filter(r => r.payStatus === "paid") :
          tab === "Receipts" ? rows.filter(r => r.payStatus === "paid") :
            rows
  ).filter(t =>
    !debouncedSearch ||
    (t.name || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (t.roomNo || "").toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [rows, tab, debouncedSearch]);

  const fmt = (n) => "₹" + (n || 0).toLocaleString("en-IN");
  const totalExpected = useMemo(() => rows.reduce((s, t) => s + ((t.invoice?.rentAmount) || t.agreedRent || t.rent || 0) + (t.invoice?.electricityBill || 0) + (t.activePenalty || 0), 0), [rows]);
  const totalCollected = useMemo(() => rows.reduce((s, t) => s + (t.invoice?.paidAmount || 0), 0), [rows]);
  const totalDue = useMemo(() => rows.reduce((s, t) => s + (t.outstandingAmount || 0), 0), [rows]);
  const totalPenalty = dashStats?.totalPenalty || 0;
  const pctDone = dashStats ? Math.round(((dashStats.paid || 0) / Math.max(1, (dashStats.total || 1))) * 100) : 0;

  const statusConfig = {
    paid: { tone: "success", Icon: CheckCircle2 },
    partial: { tone: "warning", Icon: Clock },
    due: { tone: "warning", Icon: Clock },
    overdue: { tone: "danger", Icon: AlertTriangle },
    "no-invoice": { tone: "muted", Icon: Clock },
  };

  const handleSendAllReminders = async () => {
    const pending = filtered.filter(r => r.payStatus !== "paid" && r.invoice?._id);
    if (!pending.length) { showToast("No pending invoices to remind", "info"); return; }
    let sent = 0;
    for (const row of pending) {
      try {
        const tenantEmail = (!row.email || row.email === "-") ? "" : row.email;
        const result = await sendReminder(row.invoice._id, tenantEmail, row.name || "Tenant");
        if (result?.queued?.length) sent++;
      } catch (_) { }
    }
    showToast(`Reminders queued for ${sent} tenant(s)`);
  };

  const openPayModal = (row) => {
    if (!row.invoice?._id) { showToast("No invoice found for this tenant. Generate invoices first.", "error"); return; }
    setPayModal({ row });
    setPayModalMethod("cash");
    setPayModalAmt(row.outstandingAmount || row.agreedRent || row.rent || 0);
  };

  const handleMarkPaid = async () => {
    if (!payModal?.row) return;
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    const { row } = payModal;
    setPayModalLoading(true);
    try {
      await recordPayment(row.invoice._id, payModalAmt, payModalMethod);
      showToast(`Payment recorded for ${row.name}`);
      setPayModal(null);
      const session = getOwnerRuntimeSession();
      if (session) loadData(session);
      handleViewHistory(row);
    } catch (err) {
      showToast(err.message || "Failed to record payment", "error");
    } finally {
      setPayModalLoading(false);
      isRecordingRef.current = false;
    }
  };

  const handleApproveCashRequest = async (request) => {
    if (!request?._id || !owner?.loginId) return;
    setCashActionId(request._id);
    try {
      await approveCashRequest(request._id, owner.loginId);
      showToast(`Approved cash request for ${request.tenantName || request.name || "tenant"}`);
      const session = getOwnerRuntimeSession();
      if (session) loadData(session);
    } catch (err) {
      showToast(err.message || "Failed to approve cash request", "error");
    } finally {
      setCashActionId(null);
    }
  };

  const handleRejectCashRequest = async () => {
    if (!cashRejectTarget?._id || !owner?.loginId) return;
    setCashActionId(cashRejectTarget._id);
    try {
      await rejectCashRequest(cashRejectTarget._id, owner.loginId, cashRejectReason.trim());
      showToast(`Rejected cash request for ${cashRejectTarget.tenantName || cashRejectTarget.name || "tenant"}`);
      setCashRejectTarget(null);
      setCashRejectReason("");
      const session = getOwnerRuntimeSession();
      if (session) loadData(session);
    } catch (err) {
      showToast(err.message || "Failed to reject cash request", "error");
    } finally {
      setCashActionId(null);
    }
  };

  const navigate = useNavigate();

  const handleViewHistory = async (row) => {
    if (!row.invoice?._id) return;
    setHistoryLoading(true);
    setHistoryModal({ tenantName: row.name, billingMonth: row.invoice.billingMonth, payments: [], row });
    try {
      const data = await fetchInvoiceById(row.invoice._id);
      const [yr, mo] = (data.invoice?.billingMonth || "").split("-");
      const label = yr && mo
        ? new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString("en", { month: "long" }) + " " + yr
        : data.invoice?.billingMonth || "";
      const invoicePayments = (Array.isArray(data.payments) && data.payments.length > 0)
        ? data.payments
        : (Array.isArray(data.invoice?.payments) && data.invoice.payments.length > 0)
        ? data.invoice.payments
        : (data.invoice?.status === "PAID" || (data.invoice?.paidAmount || 0) > 0)
        ? [{
            _id: (data.invoice?._id || "pay") + "_synthetic",
            amount: data.invoice?.paidAmount || data.invoice?.rentAmount || row.paidAmount || 0,
            paymentDate: data.invoice?.updatedAt || data.invoice?.createdAt || new Date(),
            paymentMethod: data.invoice?.paymentMethod || row.paymentMethod || "online",
            notes: "Payment Processed & Confirmed"
          }]
        : [];

      setHistoryModal({
        tenantName: row.name,
        billingMonth: label,
        rentAmount: data.invoice?.rentAmount || 0,
        totalDue: data.invoice?.totalDue || data.invoice?.outstandingAmount || data.invoice?.rentAmount || 0,
        totalPaid: data.invoice?.paidAmount || 0,
        penalty: data.invoice?.totalPenalty || data.live?.totalPenalty || 0,
        electricity: data.invoice?.electricityBill || 0,
        // Move-in charges only ever apply to a tenant's first/onboarding invoice — never guess
        // them from whatever is left over after rent/penalty/electricity on a recurring month,
        // that leftover is almost always an unevaluated penalty, not a move-in charge.
        advanceChargeAmount: data.invoice?.advanceChargeAmount || 0,
        status: data.invoice?.status,
        paymentMethod: data.invoice?.paymentMethod || data.payments?.[0]?.paymentMethod || "",
        payments: invoicePayments,
        row,
      });
    } catch {
      showToast("Could not load payment history", "error");
      setHistoryModal(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGoToAddTenant = (row) => {
    if (!row) return;
    const params = new URLSearchParams();
    if (row.name) params.set("fullName", row.name);
    if (row.email && row.email !== "-") params.set("email", row.email);
    if (row.phone && row.phone !== "-") params.set("phone", row.phone);
    if (row.depositAmount) params.set("depositAmount", row.depositAmount);
    if (row.propertyId) params.set("propertyId", row.propertyId);
    if (row.roomNo) params.set("room", row.roomNo);
    setHistoryModal(null);
    navigate(`/propertyowner/tenantrec?${params.toString()}`);
  };

  const handleSendReminder = async (row) => {
    if (!row.invoice?._id) { showToast("No invoice yet. Generate invoices first.", "error"); return; }
    setRemindingId(row._id || row.id);
    try {
      // Treat "-" (normalizeTenant placeholder) as empty — don't pass fake addresses
      const tenantEmail = (!row.email || row.email === "-") ? "" : row.email;
      const result = await sendReminder(row.invoice._id, tenantEmail, row.name || "Tenant");
      if (result?.queued?.length) {
        showToast(`Reminder sent to ${row.name}`);
      } else {
        showToast(result?.message || "Reminder could not be sent — tenant may have no email on file.", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to send reminder", "error");
    } finally {
      setRemindingId(null);
    }
  };

  const handleGenerateInvoices = async () => {
    if (!owner?._id && !owner?.loginId) return;
    setGenConfirmOpen(false);
    setGeneratingInvoices(true);
    try {
      const tenantList = invoiceableTenants.map(t => ({
        tenantId: t._id || t.id,
        propertyId: t.propertyId || t.property,
        unitId: t.unitId || t.room,
        rentAmount: t.agreedRent || t.rent || 0,
      }));
      if (!tenantList.length) { showToast("No active tenants found", "info"); return; }
      const result = await generateInvoices(owner._id || owner.loginId, currentBillingMonth(), tenantList);
      if ((result.created || 0) === 0) {
        showToast(`All invoices already exist for ${billingMonthLabel()}`, "info");
      } else {
        const skipNote = result.skipped ? ` (${result.skipped} already existed)` : "";
        showToast(`Created ${result.created} invoice${result.created !== 1 ? "s" : ""} for ${billingMonthLabel()}${skipNote}`);
      }
      loadData(owner);
    } catch (err) {
      showToast(err.message || "Failed to generate invoices", "error");
    } finally {
      setGeneratingInvoices(false);
    }
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Rent Collection"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-[13px] font-medium text-white transition-all ${toast.type === "error" ? "bg-destructive" : toast.type === "info" ? "bg-blue-500" : "bg-emerald-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Calculation History Modal */}
      <CalculationHistoryModal
        isOpen={showCalcHistory}
        onClose={() => setShowCalcHistory(false)}
        rows={rows}
        totalExpected={totalExpected}
        totalCollected={totalCollected}
        totalDue={totalDue}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 hidden md:flex">
        <div>
          <h1 className="text-[20px] md:text-[44px] font-bold md:font-serif leading-[1.05] text-foreground">Rent collection</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Phase-based tracking — reminders, penalties, and payments in one place.</p>
        </div>
        <div className="flex items-center gap-2 md:mt-2 flex-wrap">
          <button
            onClick={() => setGenConfirmOpen(true)}
            disabled={generatingInvoices}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-border bg-card text-[13px] font-medium hover:border-primary/40 transition-colors disabled:opacity-50"
          >
            {generatingInvoices ? <RefreshCw className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            {generatingInvoices ? "Generating..." : "Gen. invoices"}
          </button>
          <button
            onClick={handleSendAllReminders}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-border bg-card text-[13px] font-medium hover:border-primary/40 transition-colors"
          >
            <Send className="size-3.5" /> Send reminders ({counts.due + counts.overdue + counts.partial})
          </button>
          <button
            onClick={() => window.location.href = "/propertyowner/penalty-config"}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            Penalty settings
          </button>
          <button
            onClick={() => setShowCalcHistory(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-blue-600 text-white text-[13px] font-medium hover:bg-blue-700 transition-colors"
          >
            Calculation history
          </button>
        </div>
      </div>

      {/* Owner Cashfree Wallet & Instant Bank Withdrawal Banner */}
      <div className="mb-6 bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
              <Wallet size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Owner Cashfree Wallet</h2>
                <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 text-[11px] font-bold rounded-full border border-teal-500/30">Instant Bank Payout Active</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Tenant payments are held in Held Balance until 1 day post move-in date, then auto-released to Available Balance.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="border-r border-slate-700/60 pr-6">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">🔒 Held Balance</div>
              <div className="text-2xl font-black text-white">₹{(walletData.heldBalance || 0).toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Releases 1 day post move-in</div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">💰 Available Balance</div>
              <div className="text-2xl font-black text-emerald-400">₹{(walletData.availableBalance || walletData.walletBalance || 0).toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Ready for instant withdrawal</div>
            </div>

            <button
              onClick={() => setWithdrawModalOpen(true)}
              disabled={(walletData.availableBalance || walletData.walletBalance || 0) <= 0}
              className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-teal-500/20 transition-all transform hover:-translate-y-0.5 text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
            >
              <CreditCard size={16} /> Withdraw to My Bank Account
            </button>
          </div>

        </div>
      </div>

      {/* Withdraw Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Withdraw to Bank Account</h3>
                <p className="text-xs text-slate-500">Instant Cashfree Payout directly into your bank</p>
              </div>
              <button onClick={() => setWithdrawModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInstantWithdraw} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Available to Withdraw:</span>
                  <span className="font-bold text-emerald-600">₹{(walletData.availableBalance || walletData.walletBalance || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Account / UPI:</span>
                  <span className="font-bold text-slate-800">{walletData.bankDetails?.accountNumber || walletData.bankDetails?.upiId || "Registered Cashfree Bank Account"}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  placeholder={`Max ₹${walletData.availableBalance || walletData.walletBalance || 0}`}
                  value={withdrawAmt}
                  onChange={(e) => setWithdrawAmt(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading}
                  className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  {withdrawLoading ? <RefreshCw className="animate-spin" size={14} /> : <CreditCard size={14} />}
                  Transfer ₹{withdrawAmt || 0} Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phase legend — live counts from row data, not stale DB currentPhase */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <Pill tone="info">Phase 1 · Reminder: {livePhaseCounts.phase1}</Pill>
          <Pill tone="warning">Phase 2 · Minor Penalty: {livePhaseCounts.phase2}</Pill>
          <Pill tone="danger">Phase 3 · Final Notice: {livePhaseCounts.phase3}</Pill>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Cash payment requests</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Approve tenant cash requests to generate and send OTP to the owner's registered email.
            </p>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-amber-200 text-amber-700">
            {cashRequestsLoading ? "Refreshing..." : `${pendingRequests.length} request${pendingRequests.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {cashRequestsLoading ? (
          <div className="text-[13px] text-muted-foreground">Loading cash requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-[13px] text-muted-foreground">No pending cash requests right now.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {pendingRequests.map((request) => {
              const requestStatus = String(request.cashRequestStatus || request.status || "PENDING_APPROVAL").toUpperCase();
              const canApprove = ["PENDING_APPROVAL", "REQUESTED"].includes(requestStatus);
              const canReject = ["PENDING_APPROVAL", "REQUESTED", "OWNER_APPROVED"].includes(requestStatus);
              return (
                <div key={request._id || `${request.tenantLoginId}-${request.billingMonth || request.createdAt}`} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground">{request.tenantName || request.name || "Tenant"}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        {request.propertyName || request.propertyTitle || "Property"} · Room {request.roomNumber || request.roomNo || "—"}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                      {requestStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-[12px]">
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">Amount</p>
                      <p className="font-semibold text-foreground">₹{Number(request.amount || request.rentAmount || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">Requested</p>
                      <p className="font-semibold text-foreground">{request.requestedAt ? new Date(request.requestedAt).toLocaleDateString("en-IN") : "—"}</p>
                    </div>
                  </div>
                  {request.rejectionReason && (
                    <div className="mt-3 text-[12px] text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                      Rejection reason: {request.rejectionReason}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => handleApproveCashRequest(request)}
                      disabled={!canApprove || cashActionId === request._id}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {cashActionId === request._id ? "Working..." : "Approve"}
                    </button>
                    <button
                      onClick={() => setCashRejectTarget(request)}
                      disabled={!canReject || cashActionId === request._id}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-rose-200 text-rose-700 text-[12px] font-medium hover:bg-rose-50 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="flex overflow-x-auto snap-x gap-3 pb-3 mb-4 no-scrollbar scroll-smooth md:grid md:grid-cols-4 md:pb-0">
        <StatCard label="Outstanding" value={fmt(totalDue)} icon={Wallet} tone="info" />
        <StatCard label="Pending tenants" value={counts.due + counts.overdue + counts.partial} icon={Clock} tone="warning" hint={`${pctDone}% collected`} />
        <StatCard label="Penalties accrued" value={fmt(totalPenalty)} icon={AlertTriangle} tone="default" />
        <StatCard label="Paid this month" value={counts.paid} icon={CheckCircle2} tone="success" />
      </div>




      {/* Filter tabs + search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="hidden md:flex items-center gap-1.5 flex-wrap">
          {(["Collection", "Pending", "History", "Receipts"]).map((k) => {
            const count = k === "Collection" ? counts.all :
              k === "Pending" ? (counts.due + counts.partial + counts.overdue) :
                k === "History" || k === "Receipts" ? counts.paid : 0;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={[
                  "h-9 px-3.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap",
                  tab === k ? "bg-foreground text-background" : "bg-card border border-border hover:border-primary/40 text-muted-foreground"
                ].join(" ")}
              >
                {k} <span className="opacity-60 ml-0.5">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tenant"
            className="h-9 w-48 pl-8 pr-3 rounded-lg bg-card border border-border text-[12.5px] focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* List Container */}
      <div className="w-full">
        {/* Desktop Table */}
        <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Tenant</th>
                  <th className="px-4 py-3 text-left font-semibold">Property</th>
                  <th className="px-4 py-3 text-left font-semibold">Rent</th>
                  <th className="px-4 py-3 text-left font-semibold">Outstanding</th>
                  <th className="px-4 py-3 text-left font-semibold">Phase</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px] text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-muted-foreground">No records found</td></tr>
                ) : filtered.map((t) => {
                  const cfg = statusConfig[t.payStatus] || statusConfig.due;
                  const phCfg = PHASE_CONFIG[t.phase];
                  return (
                    <tr key={t._id || t.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-[14px] shrink-0">
                            {(t.name || "T").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{t.name || "—"}</div>
                            <div className="text-[11.5px] text-muted-foreground">Room {t.roomNo || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.propertyTitle || t.propertyName || (t.property && typeof t.property === "object" ? t.property.title || t.property.name : t.property) || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{fmt(t.agreedRent || t.rent || 0)}</div>
                        {t.baseRoomRent && t.baseRoomRent > (t.agreedRent || t.rent || 0) && (
                          <div className="text-[10px] text-amber-600 font-medium mt-0.5 cursor-help" title={`Original base rent was ${fmt(t.baseRoomRent)}. Discounted by owner.`}>
                            Base: <span className="line-through opacity-70">{fmt(t.baseRoomRent)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{fmt(t.outstandingAmount)}</td>
                      <td className="px-4 py-3">
                        {t.payStatus === "paid" ? (
                          <span className="text-[11.5px] text-muted-foreground">—</span>
                        ) : phCfg ? (
                          <Pill tone={phCfg.tone}>{phCfg.label}</Pill>
                        ) : (
                          <span className="text-[11.5px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={cfg.tone}>
                          <cfg.Icon className="size-3" />
                          {t.payStatus}
                        </Pill>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {t.payStatus === "no-invoice" ? (
                            <span className="text-[11.5px] text-muted-foreground italic">No invoice</span>
                          ) : t.payStatus !== "paid" ? (
                            <>
                              <button
                                title="Send reminder"
                                disabled={remindingId === (t._id || t.id)}
                                onClick={() => handleSendReminder(t)}
                                className="size-8 rounded-md hover:bg-muted grid place-items-center text-blue-500 transition-colors disabled:opacity-40"
                              >
                                {remindingId === (t._id || t.id) ? <RefreshCw className="size-3.5 animate-spin" /> : <MessageCircle className="size-3.5" />}
                              </button>
                              <button title="Call" className="size-8 rounded-md hover:bg-muted grid place-items-center transition-colors">
                                <Phone className="size-3.5" />
                              </button>
                              <button
                                onClick={() => openPayModal(t)}
                                className="h-8 px-3 rounded-md bg-foreground text-background text-[11.5px] font-medium hover:opacity-90 transition-opacity"
                              >
                                Mark paid
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleViewHistory(t)}
                              className="inline-flex items-center gap-1 text-[11.5px] text-emerald-600 font-medium hover:underline"
                            >
                              <Receipt className="size-3" /> View receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-3 pb-12">
          {loading ? (
            <div className="text-center py-10 text-[13px] text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <MobileEmptyState
              icon={FileText}
              title="No Payment Records"
              description="You don't have any payment records matching this category."
              actionText={toGenerateCount > 0 ? "Generate Invoices" : "Refresh"}
              onAction={toGenerateCount > 0 ? () => setGenConfirmOpen(true) : () => loadData(owner)}
            />
          ) : filtered.map(t => {
            const cfg = statusConfig[t.payStatus] || statusConfig.due;
            const phCfg = PHASE_CONFIG[t.phase];
            return (
              <div key={`mob-${t._id || t.id}`} className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-black shrink-0">
                      {(t.name || "T").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-[16px] font-black text-slate-900">{t.name || "—"}</h3>
                      <p className="text-[11.5px] font-semibold text-slate-500 mt-0.5">Room {t.roomNo || "—"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${cfg.tone === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      cfg.tone === "warning" ? "bg-amber-50 text-amber-600 border-amber-100" :
                        cfg.tone === "danger" ? "bg-rose-50 text-rose-600 border-rose-100" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                      <cfg.Icon className="w-3 h-3" /> {t.payStatus}
                    </span>
                    {phCfg && (
                      <span className={`inline-flex px-2 py-0.5 rounded text-[8.5px] font-bold uppercase ${phCfg.tone === "info" ? "text-blue-600 bg-blue-50" :
                        phCfg.tone === "warning" ? "text-amber-600 bg-amber-50" :
                          phCfg.tone === "danger" ? "text-rose-600 bg-rose-50" : ""
                        }`}>{phCfg.label}</span>
                    )}
                  </div>
                </div>


                {/* Footer: Financials row + Action Buttons (Tenants-style) */}
                <div className="pt-2.5 border-t border-slate-100/80">
                  {t.payStatus === "no-invoice" ? (
                    <div className="w-full text-center py-2 text-[11px] text-slate-400 italic font-semibold">No invoice generated for this month</div>
                  ) : t.payStatus !== "paid" ? (
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Monthly Rent</p>
                          <p className="text-[13.5px] font-black text-slate-800 leading-none">{fmt(t.agreedRent || t.rent || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Outstanding</p>
                          <p className={`text-[13.5px] font-black leading-none ${t.outstandingAmount > 0 ? "text-rose-600" : "text-emerald-500"}`}>{fmt(t.outstandingAmount)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center shrink-0">
                        <button
                          title="Send reminder"
                          disabled={remindingId === (t._id || t.id)}
                          onClick={() => handleSendReminder(t)}
                          className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100/50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          {remindingId === (t._id || t.id) ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle size={13} />}
                        </button>
                        <button
                          onClick={() => openPayModal(t)}
                          className="h-8 px-3.5 rounded-full bg-emerald-600 text-white flex items-center gap-1.5 hover:bg-emerald-700 transition-colors text-[11px] font-bold ml-1"
                        >
                          <Banknote size={12} /> Mark Paid
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Monthly Rent</p>
                          <p className="text-[13.5px] font-black text-slate-800 leading-none">{fmt(t.agreedRent || t.rent || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">Status</p>
                          <p className="text-[13px] font-bold text-emerald-500 leading-none">Cleared ✓</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center shrink-0">
                        <button
                          onClick={() => handleViewHistory(t)}
                          className="h-8 px-3.5 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-700 flex items-center gap-1.5 hover:bg-emerald-100 transition-colors text-[11px] font-bold"
                        >
                          <Receipt size={12} /> Receipt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Gen Invoice confirmation modal */}
      {genConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setGenConfirmOpen(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold text-foreground text-[16px] mb-1">Generate invoices</h2>
            <p className="text-[13px] text-muted-foreground mb-4">
              Billing month: <span className="font-medium text-foreground">{billingMonthLabel()}</span>
            </p>
            <div className="bg-muted/60 rounded-xl p-3 mb-5 space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active tenants</span>
                <span className="font-medium">{invoiceableTenants.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already invoiced</span>
                <span className="font-medium text-emerald-600">{alreadyInvoicedCount}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 mt-1">
                <span className="font-medium">To create</span>
                <span className={`font-semibold ${toGenerateCount === 0 ? "text-muted-foreground" : "text-primary"}`}>{toGenerateCount}</span>
              </div>
            </div>
            {toGenerateCount === 0 && (
              <p className="text-[12.5px] text-muted-foreground text-center mb-4">
                All invoices already exist for this month.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setGenConfirmOpen(false)}
                className="flex-1 h-10 rounded-xl border border-border text-[13px] font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateInvoices}
                disabled={generatingInvoices || toGenerateCount === 0}
                className="flex-1 h-10 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {generatingInvoices ? "Generating..." : `Generate ${toGenerateCount}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Record Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground text-[15px]">Record Payment</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">{payModal.row.name} · {payModal.row.invoice?.billingMonth || "this month"}</p>
              </div>
              <button onClick={() => setPayModal(null)} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground">
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Amount */}
              <div>
                <label className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={payModalAmt}
                  onChange={e => setPayModalAmt(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-white text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Payment method */}
              <div>
                <label className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "upi", label: "UPI Received", Icon: Smartphone },
                    { key: "bank_transfer", label: "Bank Transfer", Icon: CreditCard },
                    { key: "cash", label: "Cash Given", Icon: Banknote },
                  ].map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      onClick={() => setPayModalMethod(key)}
                      className={[
                        "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[11.5px] font-medium transition-colors",
                        payModalMethod === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      ].join(" ")}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setPayModal(null)}
                className="flex-1 h-10 rounded-xl border border-border text-[13px] font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={payModalLoading || !payModalAmt}
                className="flex-1 h-10 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {payModalLoading ? "Recording..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cashRejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setCashRejectTarget(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-[15px]">Reject cash request</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">{cashRejectTarget.tenantName || cashRejectTarget.name || "Tenant"}</p>
            </div>
            <div className="px-5 py-4">
              <label className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Reason</label>
              <textarea
                value={cashRejectReason}
                onChange={e => setCashRejectReason(e.target.value)}
                rows={4}
                placeholder="Add a short rejection reason..."
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => {
                  setCashRejectTarget(null);
                  setCashRejectReason("");
                }}
                className="flex-1 h-10 rounded-xl border border-border text-[13px] font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectCashRequest}
                disabled={cashActionId === cashRejectTarget._id}
                className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-[13px] font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {cashActionId === cashRejectTarget._id ? "Working..." : "Reject request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setHistoryModal(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground text-[15px]">{historyModal.tenantName}</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Payment history · {historyModal.billingMonth}</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground">
                <X className="size-4" />
              </button>
            </div>

            {/* Summary row */}
            <div className="flex gap-3 px-5 py-3 border-b border-border bg-muted/40">
              <div className="flex-1 text-center">
                <div className="text-[11px] text-muted-foreground mb-0.5">Rent</div>
                <div className="font-semibold text-[13px]">{fmt(historyModal.rentAmount)}</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-[11px] text-muted-foreground mb-0.5">Total Paid</div>
                <div className="font-semibold text-[13px] text-emerald-600">{fmt(historyModal.totalPaid)}</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-[11px] text-muted-foreground mb-0.5">Status</div>
                <div className={`font-semibold text-[12px] ${historyModal.status === "PAID" ? "text-emerald-600" : historyModal.status === "PARTIAL" ? "text-amber-500" : "text-muted-foreground"}`}>
                  {historyModal.status || "—"}
                </div>
              </div>
            </div>

            {/* Payments list */}
            <div className="px-5 py-4 max-h-72 overflow-y-auto">
              {historyLoading ? (
                <div className="text-center text-[13px] text-muted-foreground py-6">Loading...</div>
              ) : historyModal.payments.length === 0 ? (
                <div className="text-center text-[13px] text-muted-foreground py-6">No payments recorded yet</div>
              ) : (
                <div className="space-y-2.5">
                  {historyModal.payments.map((p, i) => (
                    <div key={p._id || i} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
                      <div>
                        <div className="text-[13px] font-medium text-foreground">{fmt(p.amount)}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {p.notes ? ` · ${p.notes}` : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize">
                          {(p.paymentMethod || "cash").replace("_", " ")}
                        </span>
                        {p.isPartial && (
                          <div className="text-[10.5px] text-amber-500 mt-0.5">Partial · {fmt(p.remainingAfter)} left</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 pb-4 flex gap-2">
              <button
                onClick={() => {
                  const hm = historyModal;
                  const lastPayment = hm.payments?.[0];
                  setViewingReceipt({
                    id: lastPayment?.transactionId || hm.row?.invoice?._id?.toString().slice(-8).toUpperCase() || "RC" + Date.now(),
                    tenant: hm.tenantName,
                    room: hm.row?.roomNo || "—",
                    phone: (hm.row?.phone && hm.row.phone !== "-") ? hm.row.phone : null,
                    email: (hm.row?.email && hm.row.email !== "-") ? hm.row.email : null,
                    date: lastPayment?.paymentDate
                      ? new Date(lastPayment.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
                    period: hm.billingMonth,
                    amount: hm.rentAmount || 0,
                    // NOTE: do NOT pass totalDue here — RentReceiptModal computes it fresh
                    // from (amount + penalty + electricity). Passing stale DB totalDue causes wrong totals.
                    paid: hm.totalPaid || 0,
                    penalty: hm.penalty || 0,
                    electricity: hm.electricity || 0,
                    advanceChargeAmount: hm.advanceChargeAmount || 0,
                    invoiceStatus: hm.status || '',
                    paymentMethod: hm.paymentMethod || '',
                    type: "Rent Only",
                  });
                }}
                className="flex-1 h-10 rounded-xl bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="size-3.5" /> View Receipt
              </button>
              <button
                onClick={() => setHistoryModal(null)}
                className="flex-1 h-10 rounded-xl border border-border text-[13px] font-medium hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingReceipt && (
        <RentReceiptModal
          receipt={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </PropertyOwnerLayout>
  );
}
