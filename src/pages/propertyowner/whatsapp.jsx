import React, { useState, useEffect, useMemo } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerTenants, filterByActiveProperty, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { fetchJson } from "../../utils/api";
import toast from "react-hot-toast";
import {
  Send, CheckCircle2, XCircle, Loader2, Users, MessageSquare,
  Smartphone, AlertCircle, SkipForward
} from "lucide-react";

const GROUPS = [
  { value: "all", label: "All Active Tenants" },
  { value: "pending-dues", label: "Tenants with Pending Dues" },
  { value: "upcoming-moveins", label: "Upcoming Move-ins (next 7 days)" },
];

export default function WhatsApp() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [message, setMessage] = useState("");
  const [group, setGroup] = useState("all");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null); // null = not sent yet

  useEffect(() => {
    fetchOwnerTenants(owner.loginId)
      .then(list => setTenants(filterByActiveProperty(list || [], false)))
      .catch(() => {})
      .finally(() => setLoadingTenants(false));
  }, [owner.loginId]);

  const recipientCount = useMemo(() => {
    if (group === "all") return tenants.filter(t => t.status === "active" || !t.status).length;
    if (group === "pending-dues") return tenants.filter(t => (t.dueBalance || 0) > 0).length;
    if (group === "upcoming-moveins") {
      const now = new Date();
      const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return tenants.filter(t => {
        if (!t.moveInDate) return false;
        const d = new Date(t.moveInDate);
        return d >= now && d <= week;
      }).length;
    }
    return 0;
  }, [tenants, group]);

  const ownerName = owner?.name || owner?.fullName || owner?.ownerName || "Your Property Owner";

  const preview = message.trim()
    ? `Hello [Tenant Name],\nYour property owner ${ownerName} has sent you the following update:\n\n${message.trim()}\n\nPlease contact the office for any queries.`
    : "";

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) { toast.error("Please enter a message."); return; }
    if (recipientCount === 0) { toast.error("No recipients in the selected group."); return; }
    setSending(true);
    setResults(null);
    try {
      const data = await fetchJson("/api/whatsapp/broadcast", {
        method: "POST",
        body: JSON.stringify({
          ownerLoginId: owner.loginId,
          ownerName,
          message: message.trim(),
          recipientGroup: group,
          propertyId: getActiveOwnerPropertyId() || undefined,
        }),
      });
      setResults(data);
      if (data.sent > 0) toast.success(`Sent to ${data.sent} tenant${data.sent !== 1 ? "s" : ""}!`);
      if (data.failed > 0) toast.error(`Failed for ${data.failed} tenant${data.failed !== 1 ? "s" : ""}.`);
    } catch {
      toast.error("Broadcast failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="WhatsApp Broadcasting"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">WhatsApp Broadcast</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Send announcements, rent reminders, and alerts directly to tenant WhatsApp numbers.</p>
        </div>
        <div className="flex items-center gap-2 mt-1 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Template Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Compose Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
            <h3 className="font-serif text-[18px] text-foreground mb-5">Compose Broadcast</h3>

            <form onSubmit={handleSend} className="space-y-5">
              {/* Recipient Group */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Recipient Group</label>
                <select
                  value={group}
                  onChange={e => { setGroup(e.target.value); setResults(null); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-800 outline-none focus:border-blue-300 transition-all"
                >
                  {GROUPS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Users size={11} />
                  {loadingTenants ? "Loading recipients..." : `${recipientCount} recipient${recipientCount !== 1 ? "s" : ""} will receive this message`}
                </p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Your Message</label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={e => { setMessage(e.target.value); setResults(null); }}
                  placeholder="e.g. Your rent for June is due on 5th July. Please make the payment at your earliest convenience."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-800 outline-none focus:border-blue-300 transition-all resize-none"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">{message.length}/1000 characters</p>
              </div>

              <button
                type="submit"
                disabled={sending || recipientCount === 0 || !message.trim()}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending...</>
                ) : (
                  <><Send size={15} /> Send to {recipientCount} Recipient{recipientCount !== 1 ? "s" : ""}</>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {results && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
              <h3 className="font-serif text-[17px] text-foreground mb-4">Broadcast Results</h3>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                  <p className="text-[22px] font-black text-emerald-700">{results.sent}</p>
                  <p className="text-[11px] font-semibold text-emerald-600">Sent</p>
                </div>
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
                  <p className="text-[22px] font-black text-rose-700">{results.failed}</p>
                  <p className="text-[11px] font-semibold text-rose-600">Failed</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-[22px] font-black text-slate-700">{results.skipped || 0}</p>
                  <p className="text-[11px] font-semibold text-slate-500">Skipped</p>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(results.results || []).map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800">{r.name}</p>
                      <p className="text-[10px] text-slate-400">{r.phone}</p>
                    </div>
                    {r.status === "sent" && <CheckCircle2 size={16} className="text-emerald-500" />}
                    {r.status === "failed" && <XCircle size={16} className="text-rose-500" />}
                    {r.status === "skipped" && <SkipForward size={16} className="text-slate-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-5 space-y-5">

          {/* WhatsApp Preview */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <h4 className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Smartphone size={14} /> Message Preview
            </h4>
            <div className="bg-[#e5ddd5] rounded-xl p-4 min-h-[100px]">
              {preview ? (
                <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[90%] text-[12.5px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {preview}
                  <p className="text-[9px] text-slate-400 text-right mt-1.5">via Roomhy</p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 text-center py-4 italic">Type a message to see the preview</p>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Template: <span className="font-mono font-bold">roomhy_tenant_broadcast</span></p>
          </div>

          {/* Info Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">Meta API Connected</p>
                <p className="text-[11px] text-slate-400">Official WhatsApp Business API</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-[11.5px] text-slate-500">
              <p className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Only tenants with valid phone numbers receive messages</p>
              <p className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Each message is personalised with the tenant's name</p>
              <p className="flex items-center gap-2"><AlertCircle size={12} className="text-amber-500" /> WhatsApp may rate-limit large broadcasts</p>
            </div>
          </div>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
