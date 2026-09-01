import React, { useEffect, useState, useCallback } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId, fetchOwnerProperties } from "../../utils/propertyowner";
import { fetchPenaltyConfigs, savePenaltyConfig } from "../../utils/rentCollectionApi";
import { Settings, Save, RefreshCw, Info } from "lucide-react";

// ── Frontend penalty preview (mirrors penaltyEngine.js) ───────────────────────
function calcPreviewBreakdown(rentAmount, config, previewDays = 15) {
  const minorDay = config.minorPenaltyDay ?? 1;
  const majorDay = config.majorPenaltyDay ?? 2;
  const rows = [];
  for (let d = 0; d <= previewDays; d++) {
    const phase        = d < minorDay ? 1 : d < majorDay ? 2 : 3;
    const daysInPhase2 = Math.max(0, Math.min(d + 1, majorDay) - minorDay);
    const daysInPhase3 = Math.max(0, d - majorDay + 1);
    const daysOverMajor = Math.max(0, d - majorDay);

    let minorPenalty = 0;
    let majorPenalty = 0;

    if (phase >= 2 && config.minorPenalty?.enabled) {
      const mp = config.minorPenalty;
      if (mp.type === 'percentage')   minorPenalty = Math.round(rentAmount * (mp.value / 100));
      else if (mp.type === 'per_day') minorPenalty = Math.round((mp.value || 0) * daysInPhase2);
      else                            minorPenalty = mp.value || 0;
    }

    if (phase >= 3 && config.majorPenalty?.enabled) {
      const mp = config.majorPenalty;
      if (mp.type === 'percentage')        majorPenalty = Math.round(rentAmount * (mp.value / 100));
      else if (mp.type === 'fixed')        majorPenalty = mp.value || 0;
      else if (mp.type === 'per_day')      majorPenalty = Math.round((mp.value || 0) * daysInPhase3);
      else if (mp.type === 'daily_fixed')  majorPenalty = (mp.value || 0) + daysOverMajor * (mp.incrementValue || 0);
      else if (mp.type === 'weekly_fixed') majorPenalty = (mp.value || 0) + Math.floor(daysOverMajor / 7) * (mp.incrementValue || 0);
      if (mp.maxCap && majorPenalty > mp.maxCap) majorPenalty = mp.maxCap;
      majorPenalty = Math.round(majorPenalty);
    }

    rows.push({ day: d, phase, totalPenalty: minorPenalty + majorPenalty, totalDue: rentAmount + minorPenalty + majorPenalty });
  }
  return rows;
}

const MINOR_TYPES = [
  { value: "fixed",      label: "Fixed amount (₹) — one-time" },
  { value: "per_day",    label: "Per day (₹X/day) — accumulates" },
  { value: "percentage", label: "Percentage of outstanding (%)" },
];

const MAJOR_TYPES = [
  { value: "per_day",       label: "Per day (₹X/day) — accumulates" },
  { value: "fixed",         label: "Fixed amount (₹) — one-time" },
  { value: "percentage",    label: "Percentage of outstanding (%)" },
  { value: "daily_fixed",   label: "Daily escalation (base + N×day)" },
  { value: "weekly_fixed",  label: "Weekly escalation (base + N×week)" },
];

const defaultForm = () => ({
  gracePeriodDays: 0,
  minorPenaltyDay: 7,
  majorPenaltyDay: 12,
  rentDueDay: 1,
  phase1ReminderFrequencyDays: 1,
  minorPenalty: { enabled: true,  type: "per_day", value: 100, incrementValue: 0, maxCap: 0 },
  majorPenalty: { enabled: true,  type: "per_day", value: 300, incrementValue: 0, maxCap: 0 },
  notifications: { email: true, dashboard: true, whatsapp: false },
});

export default function PenaltyConfigPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [form, setForm] = useState(defaultForm());
  const [globalDefaults, setGlobalDefaults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [sampleRent, setSampleRent] = useState(8000);
  // Penalty configs are scoped: a property-level config overrides the owner-wide
  // default (backend resolves unit → property → owner-default → global), so this
  // page edits whichever scope the sidebar's active property points at.
  const activePropertyId = getActiveOwnerPropertyId();
  const [activePropertyName, setActivePropertyName] = useState("");
  const [inheritingDefault, setInheritingDefault] = useState(false);

  // Live preview — computed directly from form state, no API call needed
  const previewRows = calcPreviewBreakdown(sampleRent, form);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    if (!owner?._id && !owner?.loginId) return;
    setLoading(true);
    try {
      const data = await fetchPenaltyConfigs(owner._id || owner.loginId, true);
      setGlobalDefaults(data.globalDefaults);

      const configs = data.configs || [];
      const ownerDefault = configs.find(c => c.isDefault && !c.propertyId);
      const propertyConfig = activePropertyId
        ? configs.find(c => String(c.propertyId?._id || c.propertyId || "") === String(activePropertyId) && !c.unitId)
        : null;

      // A property with no config of its own inherits the owner-wide default until
      // the owner saves here — prefill from it so the numbers on screen match what
      // the engine would actually apply today.
      const source = propertyConfig || ownerDefault;
      setInheritingDefault(Boolean(activePropertyId && !propertyConfig));

      if (source) {
        setForm({
          gracePeriodDays:             source.gracePeriodDays             ?? 0,
          minorPenaltyDay:             source.minorPenaltyDay             ?? 7,
          majorPenaltyDay:             source.majorPenaltyDay             ?? 12,
          rentDueDay:                  source.rentDueDay                  ?? 1,
          phase1ReminderFrequencyDays: source.phase1ReminderFrequencyDays ?? 1,
          minorPenalty:  source.minorPenalty  || defaultForm().minorPenalty,
          majorPenalty:  source.majorPenalty  || defaultForm().majorPenalty,
          notifications: source.notifications || defaultForm().notifications,
        });
      } else {
        setForm(defaultForm());
      }

      if (activePropertyId) {
        try {
          const props = await fetchOwnerProperties(owner.loginId, true);
          const active = (props || []).find(p => String(p._id || p.id) === String(activePropertyId));
          setActivePropertyName(active?.title || active?.name || "");
        } catch (_) {
          // Name is cosmetic — the config still loads and saves against the right id.
        }
      }
    } catch (err) {
      showToast(err.message || "Failed to load config", "error");
    } finally {
      setLoading(false);
    }
  }, [owner?._id, owner?.loginId, activePropertyId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePenaltyConfig({
        ownerId:     owner._id || owner.loginId,
        propertyId:  activePropertyId || null,
        isDefault:   !activePropertyId,
        isActive:    true,
        ...form,
      });
      setInheritingDefault(false);
      showToast(activePropertyId
        ? `Penalty config saved for ${activePropertyName || "this property"}!`
        : "Account-wide default penalty config saved!");
    } catch (err) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };



  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setPenalty = (which, key, val) => setForm(f => ({ ...f, [which]: { ...f[which], [key]: val } }));
  const setNotif = (key, val) => setForm(f => ({ ...f, notifications: { ...f.notifications, [key]: val } }));

  const fmt = n => "₹" + (n || 0).toLocaleString("en-IN");

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Penalty Settings"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-[13px] font-medium text-white ${toast.type === "error" ? "bg-destructive" : "bg-emerald-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Penalty Settings</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Configure the 3-phase penalty system for late rent. Changes apply to new invoices.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activePropertyId ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                Editing: {activePropertyName || "active property"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-semibold text-slate-600">
                Editing: account-wide default (all properties without their own settings)
              </span>
            )}
            {inheritingDefault && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-700">
                Currently inheriting the account default — saving creates settings just for this property
              </span>
            )}
          </div>
        </div>
        {globalDefaults && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[12.5px] text-blue-700 flex items-start gap-2">
            <Info className="size-4 shrink-0 mt-0.5" />
            <span>System mode: <strong>{globalDefaults.mode?.toUpperCase()}</strong> — Phase 2 starts day {globalDefaults.minorPenaltyDay}, Phase 3 day {globalDefaults.majorPenaltyDay}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading config...</div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Phase timeline */}
          <div className="lg:col-span-2 space-y-6">

            {/* Phase timeline */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-[15px] font-semibold text-foreground mb-4">Phase Timeline (days after due date)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-[12px] text-muted-foreground">Rent due on (day of month)</span>
                  <input type="number" min="1" max="28" value={form.rentDueDay}
                    onChange={e => set("rentDueDay", +e.target.value)}
                    className="mt-1 w-full h-9 rounded-lg border border-border bg-muted/30 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
                <label className="block">
                  <span className="text-[12px] text-muted-foreground">Phase 2 starts (day)</span>
                  <input type="number" min="1" max="30" value={form.minorPenaltyDay}
                    onChange={e => set("minorPenaltyDay", +e.target.value)}
                    className="mt-1 w-full h-9 rounded-lg border border-border bg-muted/30 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
                <label className="block">
                  <span className="text-[12px] text-muted-foreground">Phase 3 starts (day)</span>
                  <input type="number" min="2" max="60" value={form.majorPenaltyDay}
                    onChange={e => set("majorPenaltyDay", +e.target.value)}
                    className="mt-1 w-full h-9 rounded-lg border border-border bg-muted/30 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
              </div>
              <div className="mt-4">
                <label className="block">
                  <span className="text-[12px] text-muted-foreground">Phase 1 reminder frequency (every N days)</span>
                  <input type="number" min="1" max="7" value={form.phase1ReminderFrequencyDays}
                    onChange={e => set("phase1ReminderFrequencyDays", +e.target.value)}
                    className="mt-1 w-40 h-9 rounded-lg border border-border bg-muted/30 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
              </div>
            </div>

            {/* Phase 2 - Minor Penalty */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-amber-800">Phase 2 — Minor Penalty</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.minorPenalty.enabled}
                    onChange={e => setPenalty("minorPenalty", "enabled", e.target.checked)}
                    className="rounded" />
                  <span className="text-[12.5px] text-muted-foreground">Enabled</span>
                </label>
              </div>
              {form.minorPenalty.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[12px] text-muted-foreground">Penalty type</span>
                    <select value={form.minorPenalty.type}
                      onChange={e => setPenalty("minorPenalty", "type", e.target.value)}
                      className="mt-1 w-full h-9 rounded-lg border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20">
                      {MINOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[12px] text-muted-foreground">
                      {form.minorPenalty.type === "percentage" ? "Percentage (%)" : form.minorPenalty.type === "per_day" ? "Amount per day (₹/day)" : "Amount (₹)"}
                    </span>
                    <input type="number" min="0" value={form.minorPenalty.value}
                      onChange={e => setPenalty("minorPenalty", "value", +e.target.value)}
                      className="mt-1 w-full h-9 rounded-lg border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </label>
                </div>
              )}
            </div>

            {/* Phase 3 - Major Penalty */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-rose-800">Phase 3 — Major Penalty</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.majorPenalty.enabled}
                    onChange={e => setPenalty("majorPenalty", "enabled", e.target.checked)}
                    className="rounded" />
                  <span className="text-[12.5px] text-muted-foreground">Enabled</span>
                </label>
              </div>
              {form.majorPenalty.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[12px] text-muted-foreground">Penalty type</span>
                    <select value={form.majorPenalty.type}
                      onChange={e => setPenalty("majorPenalty", "type", e.target.value)}
                      className="mt-1 w-full h-9 rounded-lg border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20">
                      {MAJOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[12px] text-muted-foreground">
                      {form.majorPenalty.type === "per_day" ? "Amount per day (₹/day)" : form.majorPenalty.type === "percentage" ? "Percentage (%)" : "Base amount (₹)"}
                    </span>
                    <input type="number" min="0" value={form.majorPenalty.value}
                      onChange={e => setPenalty("majorPenalty", "value", +e.target.value)}
                      className="mt-1 w-full h-9 rounded-lg border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </label>
                  {(form.majorPenalty.type === "daily_fixed" || form.majorPenalty.type === "weekly_fixed") && (
                    <label className="block">
                      <span className="text-[12px] text-muted-foreground">
                        {form.majorPenalty.type === "daily_fixed" ? "Per day increment (₹)" : "Per week increment (₹)"}
                      </span>
                      <input type="number" min="0" value={form.majorPenalty.incrementValue}
                        onChange={e => setPenalty("majorPenalty", "incrementValue", +e.target.value)}
                        className="mt-1 w-full h-9 rounded-lg border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </label>
                  )}
                  <label className="block">
                    <span className="text-[12px] text-muted-foreground">Max cap (₹, 0 = no cap)</span>
                    <input type="number" min="0" value={form.majorPenalty.maxCap}
                      onChange={e => setPenalty("majorPenalty", "maxCap", +e.target.value)}
                      className="mt-1 w-full h-9 rounded-lg border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </label>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-[15px] font-semibold text-foreground mb-4">Notification Channels</h2>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: "email",     label: "Email" },
                  { key: "dashboard", label: "Dashboard alert" },
                  { key: "whatsapp",  label: "WhatsApp (coming soon)" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.notifications[key]}
                      onChange={e => setNotif(key, e.target.checked)}
                      className="rounded" />
                    <span className="text-[13px] text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? "Saving..." : "Save config"}
              </button>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 sticky top-4">
              <h2 className="text-[15px] font-semibold text-foreground mb-3">Penalty Preview</h2>
              <label className="block mb-4">
                <span className="text-[12px] text-muted-foreground">Sample rent amount (₹)</span>
                <input type="number" min="0" value={sampleRent}
                  onChange={e => setSampleRent(+e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg border border-border bg-muted/30 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </label>

              <div className="overflow-y-auto max-h-80">
                <table className="w-full text-[12px]">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Day</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Phase</th>
                      <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Penalty</th>
                      <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Total due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewRows.map(row => (
                      <tr key={row.day} className={row.phase === 3 ? "bg-rose-50" : row.phase === 2 ? "bg-amber-50" : ""}>
                        <td className="px-2 py-1.5">Day {row.day}</td>
                        <td className="px-2 py-1.5">P{row.phase}</td>
                        <td className="px-2 py-1.5 text-right text-rose-600">{fmt(row.totalPenalty)}</td>
                        <td className="px-2 py-1.5 text-right font-medium">{fmt(row.totalDue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </form>
      )}
    </PropertyOwnerLayout>
  );
}
