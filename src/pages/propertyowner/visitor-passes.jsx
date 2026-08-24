import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import {
  QrCode, Search, CheckCircle2, XCircle, Clock, User, Phone, Calendar
} from "lucide-react";
import { apiFetch } from "../../utils/api";

const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function VisitorPassesPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [search, setSearch] = useState("");
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  React.useEffect(() => {
    fetchPasses();
  }, [owner.loginId]);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const propertyId = getActiveOwnerPropertyId();
      const qs = new URLSearchParams({ limit: "100" });
      if (propertyId) qs.set("propertyId", propertyId);
      const data = await apiFetch(`/api/visitors/owner/${owner.loginId}?${qs.toString()}`);
      if (data.success && data.visitors) {
        const filtered = data.visitors.filter(v => !propertyId || String(v.propertyId || v.property_id || "") === String(propertyId));
        setPasses(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setBusyId(id);
      const data = await apiFetch(`/api/visitors/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({
          approverRole: "owner",
          approverLoginId: owner.loginId,
          approverName: owner.name || owner.ownerName || "Property Owner",
        }),
      });
      if (data.success && data.visitor) {
        setPasses((prev) => prev.map((p) => (p._id === id ? data.visitor : p)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setBusyId(id);
      const data = await apiFetch(`/api/visitors/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({
          approverRole: "owner",
          approverLoginId: owner.loginId,
          approverName: owner.name || owner.ownerName || "Property Owner",
        }),
      });
      if (data.success && data.visitor) {
        setPasses((prev) => prev.map((p) => (p._id === id ? data.visitor : p)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const matches = (p) =>
    !q ||
    (p.name || "").toLowerCase().includes(q) ||
    (p.hostName || "").toLowerCase().includes(q) ||
    (p.passId || "").toLowerCase().includes(q);

  const pending = passes.filter((p) => p.status === "Pending" && matches(p));
  const approved = passes.filter((p) => p.status === "Approved" && matches(p));

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Visitor Passes"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Visitor Passes</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Approve or decline the visitor pass requests your residents raise for parents, friends and guests.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by visitor, resident or Pass ID..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading visitor pass requests...</div>
      ) : (
        <div className="space-y-10">
          {/* Pending approval */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-4 text-amber-500" />
              <h2 className="text-[15px] font-bold text-foreground">Pending Approval</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">{pending.length}</span>
            </div>
            {pending.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-slate-400 rounded-2xl border border-dashed border-border">No pending visitor pass requests.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pending.map((p) => (
                  <div key={p._id} className="rounded-2xl border border-border bg-card p-6 shadow-soft flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <Clock size={20} />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-600 border-amber-100">
                          Pending
                        </span>
                      </div>
                      <div>
                        <h3 className="font-serif text-[21px] font-bold text-foreground flex items-center gap-2">
                          <User size={16} className="text-muted-foreground" /> {p.name}
                        </h3>
                        <p className="text-[12.5px] text-muted-foreground mt-1 flex items-center gap-1.5"><Phone size={12} /> {p.phone}</p>
                        <p className="text-[12.5px] text-muted-foreground mt-1">Resident: <strong className="text-foreground">{p.hostName} (Room {p.hostRoom})</strong></p>
                        <p className="text-[12.5px] text-muted-foreground mt-1 flex items-center gap-1.5"><Calendar size={12} /> {fmtDateTime(p.expectedEntryTime)}</p>
                      </div>
                    </div>
                    <div className="border-t border-border/60 mt-6 pt-4 flex gap-2">
                      <button
                        onClick={() => handleApprove(p._id)}
                        disabled={busyId === p._id}
                        className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(p._id)}
                        disabled={busyId === p._id}
                        className="flex-1 h-10 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Approved */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <h2 className="text-[15px] font-bold text-foreground">Approved Passes</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{approved.length}</span>
            </div>
            {approved.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-slate-400 rounded-2xl border border-dashed border-border">No approved passes yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approved.map((p) => (
                  <div key={p._id} className="rounded-2xl border border-border bg-card p-6 shadow-soft flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <QrCode size={20} />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100">
                          Approved
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold text-slate-400 block mb-1">{p.passId || "—"}</span>
                        <h3 className="font-serif text-[21px] font-bold text-foreground">{p.name}</h3>
                        <p className="text-[12.5px] text-muted-foreground mt-0.5">Invited by: <strong className="text-foreground">{p.hostName} (Room {p.hostRoom})</strong></p>
                      </div>
                      <div className="border-t border-border/60 pt-4 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex justify-between"><span>Approved by:</span><span className="font-bold text-slate-800">{p.approvedBy || "—"}</span></div>
                        <div className="flex justify-between"><span>Approved on:</span><span className="font-bold text-slate-800">{fmtDateTime(p.approvedAt)}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
