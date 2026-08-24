import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import {
  Users, Search, Plus, Trash2, Edit3,
  CheckCircle2, AlertCircle, Phone, Sparkles
} from "lucide-react";
import { apiFetch } from "../../utils/api";
import { getOwnerComplaints } from "../../api/complaints";
import { cacheGet, cacheSet } from "../../utils/cache";

export default function AssignedStaffPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchStaffWorkload();
  }, [owner.loginId]);

  const fetchStaffWorkload = async () => {
    const propertyId = getActiveOwnerPropertyId();
    const CACHE_KEY = `assigned:${owner.loginId}:${propertyId || "all"}`;
    const cached = cacheGet(CACHE_KEY);
    if (cached) { setStaff(cached); setLoading(false); return; }
    try {
      setLoading(true);
      const [empData, compData, maintData, attData] = await Promise.all([
        apiFetch(`/api/employees?parentLoginId=${owner.loginId}`),
        getOwnerComplaints(owner.loginId, { propertyId }).then(d => ({ complaints: d })),
        apiFetch(`/api/maintenance/owner/${owner.loginId}${propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : ""}`),
        apiFetch(`/api/hr/attendance/${owner.loginId}`)
      ]);

      const myStaff = empData.data || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysAtt = (attData.data || []).filter(a => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });

      const staffMap = {};
      myStaff.forEach(s => {
        staffMap[s._id] = {
          id: s._id,
          name: s.name,
          role: s.role,
          phone: s.phone || "N/A",
          activeTasks: 0,
          rating: 4.8, // Mock rating
          status: "Off Duty" // Default
        };
      });

      todaysAtt.forEach(a => {
        const sid = a.employeeId?._id || a.employeeId;
        if (staffMap[sid] && a.status === "Present") {
          staffMap[sid].status = "On Duty";
        }
      });

      (compData.complaints || []).forEach(c => {
         if (c.status !== 'Resolved' && c.assignedStaffId) {
            const sid = c.assignedStaffId._id || c.assignedStaffId;
            if (staffMap[sid]) staffMap[sid].activeTasks++;
         }
      });

      (maintData.tasks || []).forEach(t => {
         if (t.status !== 'Completed' && t.assignedStaffId) {
            const sid = t.assignedStaffId._id || t.assignedStaffId;
            if (staffMap[sid]) staffMap[sid].activeTasks++;
         }
      });

      const result = Object.values(staffMap);
      setStaff(result);
      cacheSet(CACHE_KEY, result, 2 * 60 * 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Maintenance Staff" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Maintenance Staff</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Manage on-duty electricians, plumbers, housekeepers, and track active tickets workloads.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name or job role..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Grid of Staff members */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading staff assignments...</div>
      ) : filteredStaff.length === 0 ? (
        <div className="py-12 text-center text-slate-500">No staff workload data found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((s) => (
            <div key={s.id} className={`rounded-2xl border ${s.activeTasks > 0 ? "border-blue-200 bg-blue-50/20" : "border-border bg-card"} p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between`}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                    s.status === "On Duty" 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}>
                    {s.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-[21px] font-bold text-foreground">{s.name}</h3>
                  <p className="text-[12.5px] text-muted-foreground mt-0.5">{s.role}</p>
                  <p className="text-[11.5px] text-muted-foreground mt-1 flex items-center gap-1"><Phone size={11} /> {s.phone}</p>
                </div>

                <div className="border-t border-border/60 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-0.5">
                      <Sparkles size={12} className="text-amber-500 fill-amber-500" /> {s.rating}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Tasks Assigned:</span>
                    <span className={`font-bold ${s.activeTasks > 0 ? "text-blue-600" : "text-muted-foreground"}`}>{s.activeTasks} Tasks</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
