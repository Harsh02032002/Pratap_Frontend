import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { 
  UserPlus, Search, LogOut, CheckCircle2, 
  Clock, ShieldAlert, Phone
} from "lucide-react";
import { apiFetch } from "../../utils/api";
import { cacheGet, cacheSet, cacheInvalidate } from "../../utils/cache";

export default function VisitorEntryPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [vName, setVName] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vHost, setVHost] = useState("");
  const [vRoom, setVRoom] = useState("");
  const [vPurpose, setVPurpose] = useState("Social");

  React.useEffect(() => {
    fetchVisitors();
  }, [owner.loginId]);

  const fetchVisitors = async () => {
    const propertyId = getActiveOwnerPropertyId();
    const CACHE_KEY = `visitors:active:${owner.loginId}:${propertyId || "all"}`;
    const cached = cacheGet(CACHE_KEY);
    if (cached) { setVisitors(cached); setLoading(false); return; }
    try {
      setLoading(true);
      const qs = new URLSearchParams({ status: "Inside" });
      if (propertyId) qs.set("propertyId", propertyId);
      const data = await apiFetch(`/api/visitors/owner/${owner.loginId}?${qs.toString()}`);
      if (data.success && data.visitors) {
        const mapped = data.visitors
          .filter(v => !propertyId || String(v.propertyId || v.property_id || "") === String(propertyId))
          .map(v => ({
          id: v._id,
          name: v.name,
          phone: v.phone,
          host: v.hostName,
          room: v.hostRoom,
          purpose: v.purpose,
          entryTime: `Today, ${new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        }));
        setVisitors(mapped);
        cacheSet(CACHE_KEY, mapped, 60 * 1000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVisitor = async (e) => {
    e.preventDefault();
    if (!vName || !vPhone || !vHost || !vRoom) return;
    
    try {
      const propertyId = getActiveOwnerPropertyId();
      const data = await apiFetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerLoginId: owner.loginId,
          propertyId,
          name: vName,
          phone: vPhone,
          hostName: vHost,
          hostRoom: vRoom,
          purpose: vPurpose,
          status: 'Inside'
        })
      });
      if (data.success) {
        const propertyId = getActiveOwnerPropertyId();
        cacheInvalidate(`visitors:active:${owner.loginId}:${propertyId || "all"}`);
        cacheInvalidate(`visitors:passes:${owner.loginId}:${propertyId || "all"}`);
        fetchVisitors();
        setVName("");
        setVPhone("");
        setVHost("");
        setVRoom("");
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async (id) => {
    try {
      const data = await apiFetch(`/api/visitors/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Exited' })
      });
      if (data.success) {
        setVisitors(prev => prev.filter(v => v.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.host.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Visitor Gate Entry" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Visitor Entry Logs</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Register daily visitors, delivery partners check-ins, and checkout timers.</p>
        </div>
        <div className="flex items-center gap-2 md:mt-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <UserPlus className="size-4" /> Check-In Visitor
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active visitors by visitor or host name..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Visitor Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading active visitors...</div>
      ) : filteredVisitors.length === 0 ? (
        <div className="py-12 text-center text-slate-500">No visitors currently inside.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVisitors.map((v) => (
          <div key={v.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  Inside Building
                </span>
              </div>

              <div>
                <h3 className="font-serif text-[21px] font-bold text-foreground">{v.name}</h3>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">{v.phone}</p>
                <p className="text-[11.5px] text-muted-foreground mt-2">Visiting: <strong className="text-foreground">{v.host} (Room {v.room})</strong></p>
                <p className="text-[12px] text-slate-700 font-medium bg-muted/40 p-2.5 rounded-xl border border-border/40 mt-3">
                  Purpose: {v.purpose}
                </p>
              </div>

              <div className="border-t border-border/60 pt-4 flex justify-between items-center text-xs text-muted-foreground">
                <span>Checked In At:</span>
                <span className="font-bold text-slate-800">{v.entryTime}</span>
              </div>
            </div>

            <div className="border-t border-border/60 mt-6 pt-4 flex gap-2">
              <button 
                onClick={() => handleCheckout(v.id)}
                className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5"
              >
                <LogOut size={14} /> Check-Out Visitor
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Check-In Visitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-serif text-[22px] text-foreground mb-4">Visitor Check-In Form</h3>
            <form onSubmit={handleAddVisitor} className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Visitor Full Name</label>
                <input 
                  type="text" 
                  value={vName} 
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="e.g. Kunal Shah"
                  className="w-full h-10 px-3 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={vPhone} 
                  onChange={(e) => setVPhone(e.target.value)}
                  placeholder="e.g. +91 99887 76655"
                  className="w-full h-10 px-3 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Host Resident Name</label>
                <input 
                  type="text" 
                  value={vHost} 
                  onChange={(e) => setVHost(e.target.value)}
                  placeholder="e.g. Amit Sharma"
                  className="w-full h-10 px-3 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Host Room Number</label>
                <input 
                  type="text" 
                  value={vRoom} 
                  onChange={(e) => setVRoom(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full h-10 px-3 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
