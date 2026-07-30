import React, { useState, useEffect, useMemo } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerEmployees } from "../../utils/propertyowner";
import { fetchJson } from "../../utils/api";
import { cacheGet, cacheSet, cacheInvalidate } from "../../utils/cache";
import toast from "react-hot-toast";
import {
  Calendar, Clock, ChevronRight, User, ChevronLeft, Plus, X, Loader2, Trash2, AlertCircle
} from "lucide-react";

const FREQUENCIES = ["One-time", "Daily", "Weekly", "Monthly", "Quarterly", "Bi-Annually", "Yearly"];

const STATUS_COLORS = {
  Scheduled: "bg-blue-50 text-blue-600 border-blue-100",
  "In Progress": "bg-amber-50 text-amber-600 border-amber-100",
  Completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function MaintenanceCalendarPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", scheduledDate: "", frequency: "One-time", assignedStaffId: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const isStaffProxy = !!owner?.isStaffProxy;
  const staffRole = String(owner?.role || "").toLowerCase();
  const isWarden = isStaffProxy && staffRole === "warden";
  const isOwner = !isStaffProxy;

  const canCreate = isOwner || isWarden;

  const canModify = (item) => {
    if (isOwner) return true;
    if (isWarden && item.createdByRole?.toLowerCase() === 'warden' && item.createdById === owner.staffLoginId) return true;
    return false;
  };

  const fetchTasks = async () => {
    const CACHE_KEY = `maintenance:${owner.loginId}`;
    const cached = cacheGet(CACHE_KEY);
    if (cached) { setTasks(cached); setLoading(false); return; }
    try {
      const data = await fetchJson(`/api/maintenance/owner/${owner.loginId}`);
      const tasks = data?.tasks || [];
      setTasks(tasks);
      cacheSet(CACHE_KEY, tasks, 2 * 60 * 1000);
    } catch {
      toast.error("Failed to load maintenance tasks.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async ({ force = false } = {}) => {
    const staff = await fetchOwnerEmployees(owner.loginId, { force });
    setStaffList(staff);
    return staff;
  };

  useEffect(() => { fetchTasks(); fetchStaffList(); }, [owner.loginId]);

  // Calendar helpers
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  // Map: day number → tasks for this month
  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.scheduledDate) return;
      const d = new Date(t.scheduledDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(t);
      }
    });
    return map;
  }, [tasks, year, month]);

  // Tasks for the selected day or all upcoming if none selected
  const visibleTasks = useMemo(() => {
    if (selectedDay) return tasksByDay[selectedDay] || [];
    return tasks
      .filter(t => t.status !== "Completed" && t.status !== "Cancelled")
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
      .slice(0, 10);
  }, [selectedDay, tasksByDay, tasks]);

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const openAdd = () => {
    const prefill = selectedDay
      ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
      : "";
    fetchStaffList({ force: true });
    setForm({ title: "", scheduledDate: prefill, frequency: "One-time", assignedStaffId: "" });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Task title is required."); return; }
    if (!form.scheduledDate) { toast.error("Date is required."); return; }
    setSaving(true);
    try {
      const selectedStaff = staffList.find(s => s._id === form.assignedStaffId);
      await fetchJson("/api/maintenance", {
        method: "POST",
        body: JSON.stringify({
          ownerLoginId: owner.loginId,
          title: form.title.trim(),
          scheduledDate: form.scheduledDate,
          frequency: form.frequency,
          assignedStaffId: selectedStaff ? selectedStaff._id : null,
          assignedStaffName: selectedStaff ? selectedStaff.name : null,
          staff: selectedStaff ? selectedStaff.name : "Unassigned",
          createdByRole: isStaffProxy ? staffRole : "owner",
          createdById: isStaffProxy ? owner.staffLoginId : owner.loginId
        }),
      });
      toast.success("Task added!");
      setModalOpen(false);
      cacheInvalidate(`maintenance:`);
      await fetchTasks();
    } catch {
      toast.error("Failed to add task.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (taskId) => {
    setDeleting(taskId);
    try {
      await fetchJson(`/api/maintenance/${taskId}`, { method: "DELETE" });
      toast.success("Task deleted.");
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch {
      toast.error("Failed to delete task.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Maintenance Calendar"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Maintenance Calendar</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Plan and track repairs, safety tests, and housekeeping routines.</p>
        </div>
        {canCreate && (
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity self-start md:mt-2">
            <Plus className="size-4" /> Add Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Calendar */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-[20px] text-foreground">{monthLabel}</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 border border-border rounded-xl hover:bg-muted/50"><ChevronLeft size={16} /></button>
              <button onClick={nextMonth} className="p-2 border border-border rounded-xl hover:bg-muted/50"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-muted-foreground uppercase border-b border-border/60 pb-3 mb-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <span key={d}>{d}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="h-14" />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayTasks = tasksByDay[day] || [];
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = day === selectedDay;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`h-14 rounded-xl border flex flex-col items-center justify-start pt-1.5 gap-1 transition-all text-left
                    ${isSelected ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300"
                      : isToday ? "border-blue-200 bg-blue-50/30"
                        : dayTasks.length > 0 ? "border-amber-200 bg-amber-50/20 hover:bg-amber-50/40"
                          : "border-border/40 hover:bg-muted/20"}`}
                >
                  <span className={`text-[11px] font-bold ${isSelected || isToday ? "text-blue-600" : dayTasks.length > 0 ? "text-amber-700" : "text-slate-500"}`}>
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {tasksByDay[selectedDay]?.length || 0} task{tasksByDay[selectedDay]?.length !== 1 ? "s" : ""} on {selectedDay} {monthLabel}
              </p>
              <button onClick={() => setSelectedDay(null)} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
            <h3 className="font-serif text-[18px] text-foreground mb-4">
              {selectedDay ? `Tasks — ${selectedDay} ${monthLabel}` : "Upcoming Tasks"}
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : visibleTasks.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {selectedDay ? "No tasks on this day." : "No upcoming tasks."}
                </p>
                {canCreate && (
                  <button onClick={openAdd} className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800">+ Add one</button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleTasks.map((item) => (
                  <div key={item._id} className="border border-border p-3.5 rounded-xl bg-muted/10 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-[13px] font-bold text-slate-800 leading-snug">{item.title}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[item.status] || STATUS_COLORS.Scheduled}`}>
                          {item.status}
                        </span>
                        {canModify(item) && (
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deleting === item._id}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            {deleting === item._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-[11px] text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <Clock size={11} />
                        {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "TBD"}
                        {item.frequency && item.frequency !== "One-time" && <span className="ml-1 text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{item.frequency}</span>}
                      </p>
                      <p className="flex items-center gap-1.5"><User size={11} /> {item.assignedStaffName || item.staff || "Unassigned"}</p>
                      <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200/50 text-slate-600 text-[9px] font-bold capitalize">
                        Created by {(!item.createdByRole || item.createdByRole.toLowerCase() === 'owner') ? "Owner" : item.createdByRole}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-[16px] font-bold text-slate-800">Add Maintenance Task</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Work to be done <span className="text-rose-500">*</span></label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Plumbing check in Block A"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Date <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="date"
                  value={form.scheduledDate}
                  onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Assigned Staff <span className="text-slate-400 font-normal">(optional)</span></label>
                <select
                  value={form.assignedStaffId}
                  onChange={e => setForm(p => ({ ...p, assignedStaffId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                >
                  <option value="">-- Select Staff Member --</option>
                  {staffList.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name || s.loginId}{s.role ? ` (${s.role})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 rounded-xl bg-slate-900 text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Add Task"}
              </button>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
