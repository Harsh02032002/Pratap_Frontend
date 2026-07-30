import React, { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerEmployees } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { cacheGet, cacheSet, cacheInvalidate } from "../../utils/cache";
import {
  Wrench, Search, Plus, Trash2, Edit3,
  CheckCircle2, AlertCircle, Calendar, Loader2
} from "lucide-react";

export default function MaintenanceRequestsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("Bi-Annually");
  const [scheduledDate, setScheduledDate] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [formBusy, setFormBusy] = useState(false);

  const fetchStaffList = async ({ force = false } = {}) => {
    const staff = await fetchOwnerEmployees(owner.loginId, { force });
    setStaffList(staff);
    return staff;
  };

  const fetchTasksAndStaff = async () => {
    const MAINT_KEY = `maintenance:${owner.loginId}`;
    const cachedTasks = cacheGet(MAINT_KEY);
    if (cachedTasks) {
      setTasks(cachedTasks);
      setLoading(false);
      fetchStaffList();
      return;
    }
    try {
      setLoading(true);
      const tasksData = await apiFetch(`/api/maintenance/owner/${owner.loginId}`);
      const tasks = tasksData?.tasks || [];
      setTasks(tasks);
      cacheSet(MAINT_KEY, tasks, 2 * 60 * 1000);
      await fetchStaffList({ force: true });
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndStaff();
  }, [owner.loginId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormBusy(true);
    try {
      const selectedStaff = staffList.find(s => s._id === assignedStaffId);
      await apiFetch("/api/maintenance", {
        method: "POST",
        body: JSON.stringify({
          ownerLoginId: owner.loginId,
          title,
          frequency,
          scheduledDate,
          assignedStaffId: selectedStaff ? selectedStaff._id : null,
          assignedStaffName: selectedStaff ? selectedStaff.name : null,
          staff: selectedStaff ? selectedStaff.name : "Unassigned" // fallback for legacy
        })
      });
      setIsModalOpen(false);
      setTitle("");
      setFrequency("Bi-Annually");
      setScheduledDate("");
      setAssignedStaffId("");
      cacheInvalidate(`maintenance:`);
      fetchTasksAndStaff();
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create maintenance task");
    } finally {
      setFormBusy(false);
    }
  };

  const markCompleted = async (id) => {
    try {
      await apiFetch(`/api/maintenance/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Completed" })
      });
      cacheInvalidate(`maintenance:`);
      fetchTasksAndStaff();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const assignStaff = async (id, staffId) => {
    try {
      const staffObj = staffList.find(s => s._id === staffId);
      const data = await apiFetch(`/api/maintenance/${id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ assignedStaffId: staffId, assignedStaffName: staffObj ? staffObj.name : null })
      });
      if (data && data.success) {
        setTasks(prev => prev.map(t => t._id === id ? {
          ...t,
          assignedStaffId: staffId,
          assignedStaffName: staffObj ? staffObj.name : null,
          staff: staffObj ? staffObj.name : null
        } : t));
      }
    } catch (err) {
      console.error("Failed to assign staff", err);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scheduled task?")) return;
    try {
      await apiFetch(`/api/maintenance/${id}`, {
        method: "DELETE"
      });
      cacheInvalidate(`maintenance:`);
      fetchTasksAndStaff();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const staffOptions = useMemo(
    () => staffList.map(s => (
      <option key={s._id} value={s._id}>
        {s.name || s.loginId} {s.role ? `(${s.role})` : ""}
      </option>
    )),
    [staffList]
  );

  const filteredTasks = useMemo(() => tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.staff && t.staff.toLowerCase().includes(search.toLowerCase())) ||
    (t.assignedStaffName && t.assignedStaffName.toLowerCase().includes(search.toLowerCase()))
  ), [tasks, search]);

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Asset Maintenance"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Maintenance Tasks</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Manage periodic property operations, water tank cleaning schedules, and elevator lift services.</p>
        </div>
        <button
          onClick={() => { fetchStaffList({ force: true }); setIsModalOpen(true); }}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 md:mt-2"
        >
          <Plus className="size-4" /> Schedule Maintenance
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search maintenance items by title or provider..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Grid of Maintenance items */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading maintenance tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl">
          No maintenance tasks scheduled yet. Click "Schedule Maintenance" to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((t) => (
            <div key={t._id} className={`rounded-2xl border ${t.status === "Completed" ? "border-green-200 bg-green-50/30" : "border-border bg-card"} p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between relative group`}>
              <button onClick={() => deleteTask(t._id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={16} />
              </button>

              <div className="space-y-4">
                <div className="flex justify-between items-start pr-6">
                  <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Wrench size={20} />
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                      {t.frequency}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${t.status === "Completed" ? "bg-green-100 text-green-700 border-green-200" :
                      t.status === "In Progress" ? "bg-blue-100 text-blue-700 border-blue-200" :
                        "bg-amber-50 text-amber-600 border-amber-200"
                      }`}>
                      {t.status === "Completed" ? "Completed" : t.status === "In Progress" ? "In Progress" : "Pending"}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className={`font-serif text-[21px] font-bold ${t.status === "Completed" ? "text-slate-500 line-through" : "text-foreground"}`}>{t.title}</h3>
                  <div className="text-[12.5px] text-muted-foreground mt-2">
                    <span className="block mb-1">Assigned To:</span>
                    {t.status === "Completed" ? (
                      <strong className="text-foreground">{t.assignedStaffName || t.staff || "Unassigned"}</strong>
                    ) : t.assignedStaffId ? (
                      <div className="flex items-center justify-between bg-muted/30 border border-border/50 rounded px-2 py-1">
                        <strong className="text-foreground">{t.assignedStaffName || t.staff}</strong>
                        <button
                          onClick={() => assignStaff(t._id, "")}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <select
                        value={t.assignedStaffId || ""}
                        onChange={(e) => assignStaff(t._id, e.target.value)}
                        className="bg-muted border border-border text-[11px] rounded px-2 py-1 outline-none w-full"
                      >
                        <option value="">-- Assign Staff --</option>
                        {staffOptions}
                      </select>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4 flex justify-between items-center text-xs text-muted-foreground">
                  <span>Scheduled date:</span>
                  <span className="font-bold text-slate-800">{t.scheduledDate}</span>
                </div>
              </div>

              {t.status !== "Completed" && (
                <div className="border-t border-border/60 mt-6 pt-4 flex gap-2">
                  <button
                    onClick={() => markCompleted(t._id)}
                    className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={16} /> Mark Completed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating task */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Schedule Maintenance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g. Water Tank Cleaning" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  {['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Bi-Annually', 'Yearly', 'One-time'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
                <input required value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g. 25 May 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To Staff</label>
                <select required value={assignedStaffId} onChange={e => setAssignedStaffId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white">
                  <option value="">-- Select Staff Member --</option>
                  {staffOptions}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" disabled={formBusy} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50">{formBusy ? "Saving..." : "Schedule"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
