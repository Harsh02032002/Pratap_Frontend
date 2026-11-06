import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import LeadAccessGuard from "../../components/propertyowner/LeadAccessGuard";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { 
  PhoneCall, Search, Calendar, MessageSquare, 
  CheckCircle, Clock, AlertTriangle, ArrowRight, Loader2, X, FileText
} from "lucide-react";

export default function FollowUpsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Log Call Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [notes, setNotes] = useState("");
  const [nextFollowup, setNextFollowup] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/owners/${owner.loginId}/enquiries`);
      if (data) {
        setFollowups(data.filter(e => e.status?.toLowerCase() === "follow-up"));
      }
    } catch (err) {
      console.error("Error fetching follow-ups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [owner.loginId]);

  const handleComplete = async (id) => {
    try {
      await apiFetch(`/api/owners/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }) // transitions to accepted
      });
      setFollowups(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      console.error("Error completing follow-up:", err);
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleLogCallSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    try {
      setSaving(true);
      await apiFetch(`/api/owners/enquiries/${selectedEnquiry._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          notes: notes,
          nextFollowup: nextFollowup
        })
      });
      
      // Update local state notes/followup
      setFollowups(prev => prev.map(f => f._id === selectedEnquiry._id ? { ...f, notes, nextFollowup } : f));
      setSelectedEnquiry(null);
      setNotes("");
      setNextFollowup("");
    } catch (err) {
      console.error("Error logging call:", err);
      alert(`Logging failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenLogCall = (item) => {
    setSelectedEnquiry(item);
    setNotes(item.notes || "");
    setNextFollowup(item.nextFollowup || "");
  };

  const filteredFollowups = followups.filter(f => 
    (f.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.notes || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.propertyName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Follow-ups List" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <LeadAccessGuard owner={owner}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Pending Follow-ups</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Keep lead conversations active. Record call summaries and configure callback schedules.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search follow-ups by lead name or conversation notes..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading follow-ups...</p>
        </div>
      ) : filteredFollowups.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <CheckCircle size={40} className="mx-auto text-emerald-600 mb-4" />
          <h3 className="font-serif text-[20px] font-bold text-foreground">All Caught Up</h3>
          <p className="text-[13px] text-muted-foreground mt-1">There are no pending follow-ups scheduled for today.</p>
        </div>
      ) : (
        /* Grid of Follow-ups */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFollowups.map((item) => {
            const hasNextFollowup = !!item.nextFollowup;
            return (
              <div key={item._id} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <PhoneCall size={20} />
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100`}>
                      Scheduled
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-[21px] font-bold text-foreground">{item.studentName || "Prospect"}</h3>
                    <p className="text-[12px] font-mono text-muted-foreground mt-0.5">{item.studentPhone || "—"}</p>
                    {item.propertyName && (
                      <p className="text-[11.5px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                        Property: {item.propertyName}
                      </p>
                    )}
                    {item.notes ? (
                      <p className="text-[12.5px] text-muted-foreground mt-2 italic bg-muted/40 p-3 rounded-xl border border-border/40">
                        "{item.notes}"
                      </p>
                    ) : (
                      <p className="text-[12px] text-slate-400 mt-2 italic">No notes recorded yet.</p>
                    )}
                  </div>

                  <div className="border-t border-border/60 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Interest:</span>
                      <span className="font-medium text-foreground">{item.interest || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold text-rose-600">Next Follow-up:</span>
                      <span className="font-bold text-rose-600">
                        {hasNextFollowup ? new Date(item.nextFollowup).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Not scheduled"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/60 mt-6 pt-4 flex gap-2">
                  <button 
                    onClick={() => handleComplete(item._id)}
                    className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Mark Done (Accept)
                  </button>
                  <button 
                    onClick={() => handleOpenLogCall(item)}
                    className="px-4 h-10 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition"
                  >
                    Log Call
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Call Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedEnquiry(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition p-1 hover:bg-muted rounded-full"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-serif text-[22px] font-bold text-foreground mb-1">Log Call &amp; Notes</h3>
            <p className="text-[13px] text-muted-foreground mb-4">Record updates from your call with <strong className="text-foreground">{selectedEnquiry.studentName}</strong>.</p>

            <form onSubmit={handleLogCallSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Conversation Summary / Notes *</label>
                <textarea 
                  required
                  rows={4}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Record what was discussed (e.g. rent negotiation, budget requirements, room preferences)..."
                  className="w-full p-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Next Follow-up Callback Time</label>
                <input 
                  type="datetime-local"
                  value={nextFollowup}
                  onChange={e => setNextFollowup(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-border mt-6">
                <button 
                  type="button" 
                  onClick={() => setSelectedEnquiry(null)}
                  className="flex-1 h-10 border border-border rounded-lg text-[13px] font-bold text-muted-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[13px] font-bold transition flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving Notes...
                    </>
                  ) : (
                    "Save Call Log"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LeadAccessGuard>
    </PropertyOwnerLayout>
  );
}

