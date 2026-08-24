import React, { useState, useEffect } from "react";
import {
  Settings, RefreshCw, Search, Save, Edit2,
  Zap, Hand, CheckCircle2, X, Building2, AlertCircle,
  CreditCard, Wallet
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import useSEO from "../../hooks/useSEO";

const cn = (...c) => c.filter(Boolean).join(" ");
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function PayoutsOptions() {
  const [owners, setOwners]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [editingOwner, setEditingOwner] = useState(null);
  const [payoutMode, setPayoutMode]   = useState("manual"); // manual | auto
  const [bankName, setBankName]       = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode]       = useState("");
  const [updating, setUpdating]       = useState(false);
  const [successMsg, setSuccessMsg]   = useState("");
  const [errorMsg, setErrorMsg]       = useState("");

  useSEO({ title: "Payout Options – Roomhy Admin", description: "Configure manual and auto payout modes for property owners" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/payouts/options");
      if (res.success) setOwners(res.ownersOptions || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resolveBankName = (owner) => owner?.profile?.bankName || owner?.bankName || owner?.checkinBankName || "";
  const resolveAccountNumber = (owner) => owner?.profile?.accountNumber || owner?.accountNumber || owner?.checkinBankAccountNumber || "";
  const resolveIfscCode = (owner) => owner?.profile?.ifscCode || owner?.ifscCode || owner?.checkinIfscCode || "";

  const openEdit = (owner) => {
    setEditingOwner(owner);
    setPayoutMode(owner?.profile?.payoutMode || "manual");
    setBankName(resolveBankName(owner));
    setAccountNumber(resolveAccountNumber(owner));
    setIfscCode(resolveIfscCode(owner));
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetchJson("/api/superadmin/finance/payouts/options", {
        method: "POST",
        body: { loginId: editingOwner.loginId, bankName, accountNumber, ifscCode, payoutMode }
      });
      if (res.success) {
        setSuccessMsg(`Bank & payout settings saved for ${editingOwner.name || editingOwner.loginId}!`);
        setEditingOwner(null);
        load();
      } else {
        setErrorMsg(res.message || "Failed to update settings");
      }
    } catch (e) {
      setErrorMsg("Network error, please retry.");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = owners.filter(o =>
    (o.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.loginId || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalWallet = owners.reduce((s, o) => s + (o.walletBalance || 0), 0);
  const withBank = owners.filter(o => resolveAccountNumber(o)).length;
  const autoCount = owners.filter(o => o?.profile?.payoutMode === "auto").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual + Auto Payout Options"
        subtitle="Configure payout mode and bank details for each property owner"
        actions={
          <button onClick={load} className="flex items-center gap-2 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
          </button>
        }
      />

      {/* Success */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl px-5 py-3 text-sm font-bold shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
          <button onClick={() => setSuccessMsg("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Partners",   val: owners.length,  icon: Building2,    color: "#3B82F6", bg: "#EFF6FF", txt: "#1D4ED8", fmt: v => v },
          { label: "Total Wallet",     val: totalWallet,    icon: Wallet,       color: "#10B981", bg: "#ECFDF5", txt: "#065F46", fmt: fmt },
          { label: "Bank Configured",  val: withBank,       icon: CreditCard,   color: "#8B5CF6", bg: "#F5F3FF", txt: "#5B21B6", fmt: v => `${v} / ${owners.length}` },
          { label: "Auto Payout",      val: autoCount,      icon: Zap,          color: "#F59E0B", bg: "#FFFBEB", txt: "#B45309", fmt: v => `${v} Owners` },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.bg }}>
              <card.icon size={20} style={{ color: card.color }} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              {loading
                ? <div className="h-6 w-20 bg-slate-100 rounded animate-pulse mt-1" />
                : <p className="text-xl font-black mt-0.5" style={{ color: card.txt }}>{card.fmt(card.val)}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Payout Mode Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Hand size={24} className="text-white" />
          </div>
          <div>
            <h4 className="text-white font-black text-sm">Manual Payout</h4>
            <p className="text-slate-400 text-[11px] mt-1">Admin manually reviews and approves each payout transfer. Higher control over disbursements.</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h4 className="text-white font-black text-sm">Auto Payout</h4>
            <p className="text-blue-100 text-[11px] mt-1">Payouts trigger automatically based on the payout cycle. Requires valid bank details configured.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Owner Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Partner Profiles</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {loading ? "Loading..." : `${filtered.length} partners`}
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search owner..."
                className="bg-slate-50 border-none rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                  <th className="pb-4">Owner</th>
                  <th className="pb-4 text-center">Payout Mode</th>
                  <th className="pb-4 text-center">Wallet</th>
                  <th className="pb-4 text-center">Bank</th>
                  <th className="pb-4 text-right">Configure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1,2,3,4].map(i => (
                    <tr key={i}>{[1,2,3,4,5].map(j => <td key={j} className="py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-400">No owner profiles found</p>
                    </td>
                  </tr>
                ) : filtered.map((o, i) => (
                  <tr key={i} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-3">
                      <p className="font-bold text-slate-800 text-xs">{o.profile?.name || o.name || "N/A"}</p>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5">{o.loginId}</p>
                    </td>
                    <td className="py-3 text-center">
                      {o.profile?.payoutMode === "auto" ? (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-100 uppercase inline-flex items-center gap-1">
                          <Zap size={8} /> Auto
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-lg border bg-slate-50 text-slate-600 border-slate-100 uppercase inline-flex items-center gap-1">
                          <Hand size={8} /> Manual
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center font-bold text-slate-700">{fmt(o.walletBalance)}</td>
                    <td className="py-3 text-center">
                      {resolveAccountNumber(o) ? (
                        <p className="text-[9px] font-mono font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 shadow-sm inline-block">
                          {(resolveBankName(o) || "Bank")} ••••{String(resolveAccountNumber(o)).slice(-4)}
                        </p>
                      ) : (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-lg border bg-rose-50 text-rose-600 border-rose-100 uppercase">
                          Not Set
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => openEdit(o)}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 shadow-sm transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Panel */}
        <div className="xl:col-span-1">
          {editingOwner ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Configure Payout</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{editingOwner.name || editingOwner.loginId}</p>
                </div>
                <button onClick={() => setEditingOwner(null)} className="text-slate-300 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Payout Mode Toggle */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Payout Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: "manual", label: "Manual", icon: Hand, desc: "Admin approves" },
                    { val: "auto",   label: "Auto",   icon: Zap,  desc: "Auto transfer" },
                  ].map(mode => (
                    <button
                      key={mode.val}
                      type="button"
                      onClick={() => setPayoutMode(mode.val)}
                      className={cn(
                        "flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-xs font-bold",
                        payoutMode === mode.val
                          ? mode.val === "auto" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-700 bg-slate-800 text-white"
                          : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                      )}
                    >
                      <mode.icon size={16} />
                      {mode.label}
                      <span className="text-[9px] font-normal opacity-70">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {[
                  { label: "Bank Name",       val: bankName,       setter: setBankName,           placeholder: "e.g. HDFC Bank" },
                  { label: "Account Number",  val: accountNumber,  setter: setAccountNumber,      placeholder: "Bank account number" },
                  { label: "IFSC Code",       val: ifscCode,       setter: setIfscCode,           placeholder: "e.g. HDFC0001234" },
                ].map(field => (
                  <div key={field.label} className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{field.label}</label>
                    <input
                      value={field.val}
                      onChange={e => field.setter(e.target.value)}
                      placeholder={field.placeholder}
                      required
                      className="w-full bg-slate-50 border-none rounded-xl p-2.5 text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                    />
                  </div>
                ))}

                {errorMsg && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setEditingOwner(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[10px] font-bold uppercase hover:bg-slate-50 transition-all text-slate-500">
                    Cancel
                  </button>
                  <button type="submit" disabled={updating} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                    <Save className="w-3 h-3" /> {updating ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center h-56 flex flex-col items-center justify-center">
              <Settings className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-xs font-bold text-slate-400">Click edit icon to configure</p>
              <p className="text-[10px] text-slate-300 mt-1">Set payout mode & bank details for each owner</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
