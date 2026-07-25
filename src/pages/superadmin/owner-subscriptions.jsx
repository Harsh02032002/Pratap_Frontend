import React, { useEffect, useState, useMemo } from "react";
import {
  Crown, Clock, Users, CheckCircle2, AlertTriangle, RefreshCw,
  Search, Settings, X, Calendar, ChevronRight, IndianRupee,
  Shield, TrendingUp, AlertCircle, Save, Loader2, Phone,
  ChevronLeft, Filter
} from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";

const cn = (...c) => c.filter(Boolean).join(" ");

const STATUS_CONFIG = {
  trial_active:     { label: "Trial Active",     color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  expired:          { label: "Trial Expired",    color: "bg-red-50 text-red-700 border-red-100",             dot: "bg-red-500" },
  subscribed:       { label: "Subscribed",        color: "bg-blue-50 text-blue-700 border-blue-100",          dot: "bg-blue-500" },
  trial_unconfigured:{ label: "Not Configured",  color: "bg-slate-50 text-slate-500 border-slate-200",       dot: "bg-slate-300" },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function OwnerSubscriptions() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Settings panel
  const [showSettings, setShowSettings]   = useState(false);
  const [trialDaysInput, setTrialDaysInput]   = useState("");
  const [priceInput, setPriceInput]           = useState("");
  const [savingSettings, setSavingSettings]   = useState(false);

  // Extend modal
  const [extendOwner, setExtendOwner]       = useState(null);
  const [extendMode, setExtendMode]         = useState("days"); // "days" | "date" | "subscribe"
  const [extendDays, setExtendDays]         = useState("");
  const [extendDate, setExtendDate]         = useState("");
  const [extendSubDate, setExtendSubDate]   = useState("");
  const [extendNote, setExtendNote]         = useState("");
  const [extending, setExtending]           = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/superadmin/owner-subscriptions", { headers: getAuthHeader() });
      if (res.success) {
        setData(res);
        setTrialDaysInput(res.settings?.ownerTrialDays ?? "");
        setPriceInput(res.settings?.ownerSubscriptionPrice ?? "");
      }
    } catch (err) {
      console.error("Failed to load owner subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data?.owners) return [];
    return data.owners.filter(o => {
      const q = search.toLowerCase();
      const matchQ = !q || (o.name || "").toLowerCase().includes(q) || (o.loginId || "").toLowerCase().includes(q);
      const matchS = statusFilter === "all" || o.trialStatus?.status === statusFilter;
      return matchQ && matchS;
    });
  }, [data, search, statusFilter]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetchJson("/api/superadmin/subscription-settings", {
        method: "PUT",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerTrialDays: trialDaysInput !== "" ? Number(trialDaysInput) : undefined,
          ownerSubscriptionPrice: priceInput !== "" ? Number(priceInput) : undefined,
        })
      });
      setShowSettings(false);
      load();
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExtend = async () => {
    if (!extendOwner) return;
    setExtending(true);
    try {
      const body = { note: extendNote };
      if (extendMode === "days")       { body.extendByDays = Number(extendDays); }
      else if (extendMode === "date")  { body.newTrialEndDate = extendDate; }
      else                             { body.markSubscribed = true; body.subscriptionExpiry = extendSubDate || null; }

      await fetchJson(`/api/superadmin/owner-subscriptions/${encodeURIComponent(extendOwner.loginId)}/extend`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      setExtendOwner(null);
      setExtendDays(""); setExtendDate(""); setExtendSubDate(""); setExtendNote("");
      load();
    } catch (err) {
      alert("Failed to update: " + err.message);
    } finally {
      setExtending(false);
    }
  };

  const stats = data?.stats || {};

  return (
    <div className="p-8 space-y-8 bg-[#F8FAFC] min-h-full">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight leading-none">Owner Subscriptions</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
            Free Trial Management &amp; Subscription Tracker
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all"
          >
            <Settings size={15} /> Trial Settings
          </button>
          <button
            onClick={load}
            className="p-3.5 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 shadow-md transition-all"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Owners",    value: stats.total      ?? "—", icon: Users,         color: "indigo" },
          { label: "Trial Active",    value: stats.trialActive ?? "—", icon: Clock,          color: "emerald" },
          { label: "Trial Expired",   value: stats.expired    ?? "—", icon: AlertTriangle,  color: "red" },
          { label: "Subscribed",      value: stats.subscribed ?? "—", icon: Crown,          color: "blue" },
        ].map(c => (
          <div key={c.label} className={cn(
            "bg-white rounded-3xl border border-slate-100 shadow-xl p-6 flex items-center gap-5",
            c.color === "red" && stats.expired > 0 && "border-red-100 bg-red-50/30"
          )}>
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0",
              c.color === "indigo" && "bg-indigo-600 shadow-indigo-200",
              c.color === "emerald" && "bg-emerald-600 shadow-emerald-200",
              c.color === "red"    && "bg-red-600 shadow-red-200",
              c.color === "blue"   && "bg-blue-600 shadow-blue-200",
            )}>
              <c.icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.label}</p>
              <p className="text-3xl font-black text-slate-800 mt-1 leading-none">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Current Settings Banner ── */}
      {data?.settings && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Clock size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Free Trial Period</p>
              <p className="text-lg font-black text-white">
                {data.settings.ownerTrialDays ? `${data.settings.ownerTrialDays} Days` : "Not Set"}
                {data.settings.ownerTrialDays && (
                  <span className="text-slate-400 text-sm font-normal ml-2">
                    (~{Math.round(data.settings.ownerTrialDays / 30)} months)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <IndianRupee size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Subscription Price</p>
              <p className="text-lg font-black text-white">
                {data.settings.ownerSubscriptionPrice != null
                  ? `₹${Number(data.settings.ownerSubscriptionPrice).toLocaleString("en-IN")}/month`
                  : "Not Set"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="ml-auto text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
          >
            <Settings size={12} /> Change Settings
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Table Header */}
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-xs group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search owner or ID..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
              <Filter size={14} className="text-slate-400" />
              <select
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-slate-600 outline-none uppercase tracking-widest"
              >
                <option value="all">All Status</option>
                <option value="trial_active">Trial Active</option>
                <option value="expired">Expired</option>
                <option value="subscribed">Subscribed</option>
                <option value="trial_unconfigured">Not Configured</option>
              </select>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filtered.length} owners
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-100">
                <th className="px-8 py-6">Owner</th>
                <th className="px-6 py-6">Onboarding Date</th>
                <th className="px-6 py-6">Trial End Date</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-6 py-6 text-center">Days Remaining</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="py-32 text-center">
                  <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading owner data...</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="py-32 text-center">
                  <Users size={40} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No owners found</p>
                </td></tr>
              ) : filtered.map((o, i) => {
                const ts = o.trialStatus || {};
                const sc = STATUS_CONFIG[ts.status] || STATUS_CONFIG.trial_unconfigured;
                return (
                  <tr key={i} className={cn(
                    "group hover:bg-slate-50/40 transition-all",
                    ts.status === "expired" && "bg-red-50/20"
                  )}>
                    {/* Owner Identity */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 border",
                          ts.status === "expired" ? "bg-red-100 text-red-700 border-red-200" :
                          ts.status === "subscribed" ? "bg-blue-100 text-blue-700 border-blue-200" :
                          "bg-slate-900 text-white border-transparent"
                        )}>
                          {(o.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{o.name || "Unknown"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-lg">{o.loginId}</span>
                            {o.phone && <span className="text-[9px] text-slate-400">{o.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Onboarding */}
                    <td className="px-6 py-6">
                      <p className="text-sm font-bold text-slate-700">{fmt(ts.startDate || o.createdAt)}</p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">Joined</p>
                    </td>

                    {/* Trial End */}
                    <td className="px-6 py-6">
                      <p className={cn("text-sm font-bold", ts.status === "expired" ? "text-red-600" : "text-slate-700")}>
                        {fmt(ts.endDate)}
                      </p>
                      {o.subscription?.extendedBy && (
                        <p className="text-[9px] text-slate-400 mt-1">Extended by {o.subscription.extendedBy}</p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-6 text-center">
                      <span className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-widest", sc.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                        {sc.label}
                      </span>
                    </td>

                    {/* Days Remaining */}
                    <td className="px-6 py-6 text-center">
                      {ts.status === "trial_active" ? (
                        <div>
                          <p className={cn(
                            "text-2xl font-black",
                            ts.daysRemaining <= 7 ? "text-red-600" :
                            ts.daysRemaining <= 30 ? "text-amber-600" : "text-emerald-600"
                          )}>
                            {ts.daysRemaining}
                          </p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest">days left</p>
                        </div>
                      ) : ts.status === "expired" ? (
                        <span className="text-red-500 font-black text-sm">Expired</span>
                      ) : ts.status === "subscribed" ? (
                        <span className="text-blue-500 font-bold text-xs flex items-center justify-center gap-1">
                          <Crown size={12} /> Active
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => { setExtendOwner(o); setExtendMode("days"); setExtendDays(""); setExtendDate(""); setExtendNote(""); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-[9px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
                      >
                        <Shield size={12} /> Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════
          SETTINGS PANEL (Modal)
      ══════════════════════════════ */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Trial Settings</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Set globally for all owners</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="p-10 space-y-8">
              {/* Trial Days */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Free Trial Duration (Days)
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="number" min="1"
                    value={trialDaysInput}
                    onChange={e => setTrialDaysInput(e.target.value)}
                    placeholder="e.g. 180 (for 6 months)"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 pl-10 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {trialDaysInput ? `${trialDaysInput} days ≈ ${(Number(trialDaysInput) / 30).toFixed(1)} months` : "Enter number of days"}
                </p>
              </div>

              {/* Subscription Price */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Subscription Price (₹/month)
                </label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="number" min="0"
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                    placeholder="Enter monthly price (e.g. 999)"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 pl-10 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">This price will show to owners when their trial expires</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowSettings(false)} className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex-1 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          EXTEND / MANAGE MODAL
      ══════════════════════════════ */}
      {extendOwner && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                  {(extendOwner.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{extendOwner.name}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {extendOwner.loginId} — Manage Subscription
                  </p>
                </div>
              </div>
              <button onClick={() => setExtendOwner(null)} className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="p-10 space-y-7">
              {/* Current Status */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Current Status</p>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-widest",
                    (STATUS_CONFIG[extendOwner.trialStatus?.status] || STATUS_CONFIG.trial_unconfigured).color
                  )}>
                    {(STATUS_CONFIG[extendOwner.trialStatus?.status] || STATUS_CONFIG.trial_unconfigured).label}
                  </span>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest">Trial End</p>
                    <p className="text-sm font-bold text-slate-700">{fmt(extendOwner.trialStatus?.endDate)}</p>
                  </div>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="flex rounded-2xl overflow-hidden border border-slate-200">
                {[["days", "Extend by Days"], ["date", "Set End Date"], ["subscribe", "Mark Subscribed"]].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setExtendMode(val)}
                    className={cn(
                      "flex-1 py-3 text-[9px] font-bold uppercase tracking-widest transition-all",
                      extendMode === val ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Mode: Extend by days */}
              {extendMode === "days" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extend by (Days)</label>
                  <div className="flex gap-2">
                    {[30, 60, 90, 180, 365].map(d => (
                      <button key={d} onClick={() => setExtendDays(String(d))}
                        className={cn("flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all", extendDays === String(d) ? "bg-slate-900 text-white border-transparent" : "border-slate-200 text-slate-500 hover:bg-slate-50")}>
                        {d}d
                      </button>
                    ))}
                  </div>
                  <input
                    type="number" value={extendDays} onChange={e => setExtendDays(e.target.value)}
                    placeholder="Or enter custom days"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>
              )}

              {/* Mode: Set date */}
              {extendMode === "date" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Trial End Date</label>
                  <input
                    type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>
              )}

              {/* Mode: Subscribe */}
              {extendMode === "subscribe" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription Expiry Date (optional)</label>
                  <input
                    type="date" value={extendSubDate} onChange={e => setExtendSubDate(e.target.value)}
                    placeholder="Leave empty for no expiry"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Leave empty to mark as subscribed with no expiry</p>
                </div>
              )}

              {/* Note */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note (optional)</label>
                <input
                  type="text" value={extendNote} onChange={e => setExtendNote(e.target.value)}
                  placeholder="Reason for extension..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setExtendOwner(null)} className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleExtend}
                  disabled={extending || (extendMode === "days" && !extendDays) || (extendMode === "date" && !extendDate)}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {extending ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                  {extendMode === "subscribe" ? "Mark Subscribed" : "Update Trial"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
