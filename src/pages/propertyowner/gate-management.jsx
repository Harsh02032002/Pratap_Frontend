import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { 
  DoorOpen, ShieldCheck, ToggleLeft, ToggleRight, 
  Clock, AlertTriangle, AlertCircle, Plus, Trash2
} from "lucide-react";
import { apiFetch } from "../../utils/api";

export default function GateManagementPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [curfewLock, setCurfewLock] = useState(false);
  const [gates, setGates] = useState([]);
  const [stats, setStats] = useState({ visitorsInside: 0, tenantsInside: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGateName, setNewGateName] = useState("");
  const [newGateType, setNewGateType] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  React.useEffect(() => {
    const fetchStatsAndGates = async () => {
       try {
          const propertyId = getActiveOwnerPropertyId();
          const visitorQs = new URLSearchParams({ status: "Inside" });
          if (propertyId) visitorQs.set("propertyId", propertyId);
          const [vData, tData, gData] = await Promise.all([
             apiFetch(`/api/visitors/owner/${owner.loginId}?${visitorQs.toString()}`),
             apiFetch(`/api/tenant-attendance/owner/${owner.loginId}`),
             apiFetch(`/api/gates/owner/${owner.loginId}`)
          ]);
          
          setStats({
             visitorsInside: vData.visitors ? vData.visitors.filter(v => !propertyId || String(v.propertyId || v.property_id || "") === String(propertyId)).length : 0,
             tenantsInside: tData.attendance ? tData.attendance.filter(a => a.status === 'Inside').length : 0
          });
          
          if (gData.success) {
            setGates(gData.gates);
          }
       } catch(err) {
          console.error(err);
       }
    };
    fetchStatsAndGates();
  }, [owner.loginId]);

  const handleToggleGate = async (id) => {
    try {
      // Optimistic update
      setGates(prev => prev.map(g => g._id === id ? { 
        ...g, 
        status: g.status === "Unlocked" ? "Locked" : "Unlocked" 
      } : g));

      const data = await apiFetch(`/api/gates/${id}/toggle`, { method: "PUT" });
      if (!data.success) {
         // Revert on failure
         setGates(prev => prev.map(g => g._id === id ? { 
           ...g, 
           status: g.status === "Unlocked" ? "Locked" : "Unlocked" 
         } : g));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleAddGate = async (e) => {
    e.preventDefault();
    if (!newGateName || !newGateType) return;
    setIsBusy(true);
    try {
      const data = await apiFetch("/api/gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerLoginId: owner.loginId,
          name: newGateName,
          type: newGateType,
          status: "Unlocked"
        })
      });
      if (data.success) {
        setGates(prev => [...prev, data.gate]);
        setNewGateName("");
        setNewGateType("");
        setShowAddForm(false);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteGate = async (id) => {
    if (!confirm("Are you sure you want to delete this gate?")) return;
    try {
      const data = await apiFetch(`/api/gates/${id}`, { method: "DELETE" });
      if (data.success) {
        setGates(prev => prev.filter(g => g._id !== id));
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Hardware Gate Controllers" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Gate Management</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Setup automated curfews, lock/unlock smart door locks, and control access hardware.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/30 whitespace-nowrap"
        >
          <Plus size={16} /> Add Quick
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Curfew Lock Option */}
        <div className="rounded-2xl border border-border bg-rose-50/20 p-6 shadow-soft space-y-4">
          <div className="flex justify-between items-start">
            <div className="size-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <button onClick={() => setCurfewLock(!curfewLock)}>
              {curfewLock ? (
                <ToggleRight size={38} className="text-rose-600" />
              ) : (
                <ToggleLeft size={38} className="text-slate-300" />
              )}
            </button>
          </div>
          <div>
            <h3 className="font-serif text-[20px] font-bold text-foreground">Lockdown Curfew Mode</h3>
            <p className="text-[12px] text-muted-foreground mt-1">Enables strict gate lockdown. RFID passes will trigger alarms after 10:30 PM curfew limits.</p>
          </div>
        </div>

        {/* Status logs */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-slate-800">Biometric Sync Server Online</h4>
              <p className="text-[11.5px] text-muted-foreground">Currently tracking <strong className="text-slate-800">{stats.tenantsInside} residents</strong> and <strong className="text-slate-800">{stats.visitorsInside} visitors</strong> inside the building.</p>
            </div>
          </div>
        </div>
      </div>

      {/* List of hardware gates */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
        <h3 className="font-serif text-[20px] text-foreground border-b border-border/60 pb-3">Door Hardware Controllers</h3>
        
        {showAddForm && (
          <form onSubmit={handleAddGate} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Gate Name</label>
                <input type="text" required value={newGateName} onChange={(e) => setNewGateName(e.target.value)} placeholder="e.g. Main Entrance Gate" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Hardware Type</label>
                <input type="text" required value={newGateType} onChange={(e) => setNewGateType(e.target.value)} placeholder="e.g. Biometric & RFID" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancel</button>
              <button type="submit" disabled={isBusy} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">{isBusy ? "Saving..." : "Save Gate"}</button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {gates.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm font-medium">No hardware gates configured. Click "Add Quick" to add a new gate.</div>
          ) : (
            gates.map((g) => (
              <div key={g._id} className="flex justify-between items-center border border-border p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition">
              <div>
                <h4 className="text-[13.5px] font-bold text-slate-800">{g.name}</h4>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">Hardware: {g.type}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-bold ${g.status === "Unlocked" ? "text-emerald-600" : "text-rose-600"}`}>
                  {g.status}
                </span>
                <button onClick={() => handleToggleGate(g._id)}>
                  {g.status === "Unlocked" ? (
                    <ToggleRight size={38} className="text-emerald-600 hover:opacity-80 transition" />
                  ) : (
                    <ToggleLeft size={38} className="text-slate-400 hover:opacity-80 transition" />
                  )}
                </button>
                <button onClick={() => handleDeleteGate(g._id)} className="ml-2 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
