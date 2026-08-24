import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import {
  Sparkles, Search, Star, CheckCircle2,
  MessageSquare, TrendingUp, ChevronRight
} from "lucide-react";
import { apiFetch } from "../../utils/api";
import { getOwnerComplaints } from "../../api/complaints";
import { cacheGet, cacheSet } from "../../utils/cache";

export default function StaffPerformancePage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("performance");

  React.useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    const propertyId = getActiveOwnerPropertyId();
    const CACHE_KEY = `perf:${owner.loginId}:${propertyId || "all"}`;
    try {
      setLoading(true);
      const [empData, compData, maintData, attData] = await Promise.all([
        apiFetch(`/api/employees?parentLoginId=${owner.loginId}`),
        getOwnerComplaints(owner.loginId, { propertyId }).then(d => ({ complaints: d })).catch(() => ({ complaints: [] })),
        apiFetch(`/api/maintenance/owner/${owner.loginId}${propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : ""}`).catch(() => ({ tasks: [] })),
        apiFetch(`/api/hr/attendance/${owner.loginId}`).catch(() => ({ data: [] }))
      ]);

      const myStaff = empData.data || [];
      const allAtt = attData.data || [];

      // Calculate attendance rate per staff member
      const attCount = {};
      const presentCount = {};
      allAtt.forEach(a => {
        const empId = String(a.employeeId?._id || a.employeeId || '');
        if (empId) {
          attCount[empId] = (attCount[empId] || 0) + 1;
          if (a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day') {
            presentCount[empId] = (presentCount[empId] || 0) + (a.status === 'Half Day' ? 0.5 : 1);
          }
        }
      });

      const perfMap = {};
      myStaff.forEach(s => {
        const sId = String(s._id);
        const totalDays = attCount[sId] || 0;
        const attendedDays = presentCount[sId] || 0;
        const attRate = totalDays > 0 ? Math.round((attendedDays / totalDays) * 100) : 100;

        perfMap[sId] = {
           id: s._id,
           name: s.name,
           role: s.role,
           rating: 4.0,
           resolved: 0,
           attendanceRate: attRate,
           feedback: "No tasks completed yet."
        };
      });

      // Count resolved complaints
      (compData.complaints || []).forEach(c => {
         if (c.status === 'Resolved' && c.assignedStaffId) {
            const sid = String(c.assignedStaffId._id || c.assignedStaffId);
            if (perfMap[sid]) perfMap[sid].resolved++;
         }
      });

      // Count completed maintenance
      (maintData.tasks || []).forEach(t => {
         if (t.status === 'Completed' && t.assignedStaffId) {
            const sid = String(t.assignedStaffId._id || t.assignedStaffId);
            if (perfMap[sid]) perfMap[sid].resolved++;
         }
      });

      // Compute rating and feedback dynamically
      const results = Object.values(perfMap).map(p => {
         const score = p.resolved;
         const att = p.attendanceRate;

         if (score > 10 && att >= 90) {
            p.rating = 4.9;
            p.feedback = "Outstanding performance with high attendance and rapid task completion.";
         } else if (score > 5 && att >= 80) {
            p.rating = 4.6;
            p.feedback = "Very reliable worker. Resolves issues promptly with high quality.";
         } else if (score > 0) {
            p.rating = 4.2;
            p.feedback = "Good work. Resolving assigned maintenance and tenant complaints regularly.";
         } else {
            p.rating = 3.5;
            p.feedback = "Satisfactory progress. Direct supervisor recommends more task assignments.";
         }
         return p;
      });

      setPerformance(results);
      cacheSet(CACHE_KEY, results, 2 * 60 * 1000);
    } catch (err) {
      console.error("Error fetching staff performance:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Performance Metrics" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Staff Performance</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Monitor performance review averages, tenant feedback scores, and resolved complaints counts.</p>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6 w-fit">
        <button
          onClick={() => setActiveSubTab("performance")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeSubTab === "performance" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
        >
          Performance Metrics
        </button>
        <button
          onClick={() => window.location.href = "/propertyowner/staff-attendance"}
          className="px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-600"
        >
          Daily Attendance
        </button>
        <button
          onClick={() => window.location.href = "/propertyowner/staff-tasks"}
          className="px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-600"
        >
          Staff Tasks
        </button>
      </div>

      {/* Grid of Performance profiles */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading performance data...</div>
      ) : performance.length === 0 ? (
        <div className="py-12 text-center text-slate-500">No staff found to display performance.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performance.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-800">{p.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-[21px] font-bold text-foreground">{p.name}</h3>
                  <p className="text-[12.5px] text-muted-foreground mt-0.5">{p.role}</p>
                  <p className="text-[13px] text-slate-700 mt-3 font-medium bg-muted/40 p-3 rounded-xl border border-border/40">
                    "{p.feedback}"
                  </p>
                </div>

                <div className="border-t border-border/60 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Complaints Solved:</span>
                    <span className="font-bold text-emerald-600">{p.resolved} Tickets</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Attendance Rate:</span>
                    <span className={`font-bold ${p.attendanceRate >= 90 ? 'text-emerald-600' : p.attendanceRate >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>{p.attendanceRate}%</span>
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
