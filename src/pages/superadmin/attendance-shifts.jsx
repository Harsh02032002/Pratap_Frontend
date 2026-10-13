import React, { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Search, Plus } from "lucide-react";
import useSEO from "../../hooks/useSEO";
import { getAllShifts, saveShift } from "../../api/attendance";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Presets that fill the start/end time when assigning. Staff are free to edit the times.
const TEMPLATES = [
  { name: "Morning", startTime: "08:00 AM", endTime: "04:00 PM" },
  { name: "Evening", startTime: "04:00 PM", endTime: "12:00 AM" },
  { name: "Night", startTime: "12:00 AM", endTime: "08:00 AM" },
];

const emptyForm = () => ({ employeeId: "", shiftName: "Morning", startTime: "08:00 AM", endTime: "04:00 PM", days: DAYS.slice(0, 5) });

export default function AttendanceShifts() {
  useSEO({
    title: "Shifts – Roomhy Superadmin",
    description: "Weekly shift roster.",
    canonical: "https://roomhy.com/superadmin/attendance-shifts"
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRoster(await getAllShifts());
    } catch (err) {
      setError(err?.message || "Could not load shifts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const roles = useMemo(() => [...new Set(roster.map((r) => r.role).filter(Boolean))].sort(), [roster]);

  const filteredRoster = useMemo(() => {
    const q = search.toLowerCase();
    return roster.filter((item) => {
      const matchSearch = !q || (item.name || "").toLowerCase().includes(q) || (item.role || "").toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || item.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [roster, search, roleFilter]);

  const openAssign = (employeeId = "") => {
    const row = roster.find((r) => String(r.employeeId) === String(employeeId));
    setForm(row?.shiftName
      ? { employeeId, shiftName: row.shiftName, startTime: row.startTime, endTime: row.endTime, days: row.days }
      : { ...emptyForm(), employeeId });
    setShowAssign(true);
  };

  const pickTemplate = (name) => {
    const t = TEMPLATES.find((x) => x.name === name);
    setForm((f) => ({ ...f, shiftName: name, ...(t ? { startTime: t.startTime, endTime: t.endTime } : {}) }));
  };

  const toggleDay = (day) =>
    setForm((f) => ({ ...f, days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day] }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.employeeId || form.days.length === 0) {
      toast.error("Pick a staff member and at least one day");
      return;
    }
    setSaving(true);
    try {
      await saveShift(form);
      toast.success("Shift saved");
      setShowAssign(false);
      await load();
    } catch (err) {
      toast.error(err?.message || "Could not save shift");
    } finally {
      setSaving(false);
    }
  };

  const renderShiftPill = (shiftType) => {
    const styles = {
      Morning: "bg-[#DDF3E4] text-[#14532D]",
      Evening: "bg-[#E0F2FE] text-[#0369A1]",
      Night: "bg-[#FDEBD0] text-[#7A3E00]",
    };
    if (!shiftType) return <span className="text-[12px] text-[#708088] font-medium block text-center">Off</span>;
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-center w-full max-w-[80px] truncate ${styles[shiftType] || "bg-[#E8EDF1] text-[#10242A]"}`}>
        {shiftType}
      </span>
    );
  };

  const inputCls = "w-full h-10 border border-[#CBD3D9] rounded-[8px] px-3 text-[#10242A] outline-none focus:border-[#0E7C86]";

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Shifts</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Weekly shift roster</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setShowTemplates(true)}
            className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] font-semibold text-[13px] px-4 py-1.5 rounded-[8px] transition-colors cursor-pointer shadow-xs"
          >
            Shift Templates
          </button>
          <button
            onClick={() => openAssign()}
            className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-[13px] px-4 py-1.5 rounded-[8px] flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={16} />
            <span>Assign Shift</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-10 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="appearance-none bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-[110px]"
        >
          <option value="all">Role ▾</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* ── Weekly Shift Roster Table ── */}
      <div className="bg-white border border-[#E1E6EA] rounded-[12px] p-4 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider w-44 pl-2">Staff</th>
                {SHORT.map((d) => (
                  <th key={d} className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6]">
              {loading ? (
                <tr><td colSpan="8" className="py-8 text-center text-[#4A5961] text-[13px]">Loading shifts...</td></tr>
              ) : error ? (
                <tr><td colSpan="8" className="py-8 text-center text-[#991B1B] text-[13px]">{error}</td></tr>
              ) : filteredRoster.length === 0 ? (
                <tr><td colSpan="8" className="py-8 text-center text-[#4A5961] text-[13px]">No staff found.</td></tr>
              ) : (
                filteredRoster.map((row) => (
                  <tr key={row.employeeId} onClick={() => openAssign(row.employeeId)} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer">
                    <td className="py-2.5 text-[13px] font-medium text-[#10242A] pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#D9E1E7] flex items-center justify-center text-[11px] font-bold text-[#4A5961] shrink-0">
                          {(row.name || "?").split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span>{row.name}</span>
                      </div>
                    </td>
                    {DAYS.map((day) => (
                      <td key={day} className="py-2.5 text-center">
                        {renderShiftPill(row.days.includes(day) ? row.shiftName : "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Shift Templates ── */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowTemplates(false)}>
          <div className="bg-white rounded-[16px] border border-[#E1E6EA] shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-bold text-[#10242A] mb-4">Shift Templates</h3>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <div key={t.name} className="flex items-center justify-between border border-[#E1E6EA] rounded-[8px] px-3 py-2">
                  {renderShiftPill(t.name)}
                  <span className="text-[13px] text-[#4A5961]">{t.startTime} – {t.endTime}</span>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-[#708088] mt-3">Pick a template in Assign Shift to fill the times. You can still edit them.</p>
            <div className="flex justify-end pt-3">
              <button onClick={() => setShowTemplates(false)} className="px-4 py-2 border border-[#CBD3D9] rounded-[8px] text-xs font-semibold hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Shift ── */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-[16px] border border-[#E1E6EA] shadow-xl w-full max-w-md p-6">
            <h3 className="text-[18px] font-bold text-[#10242A] mb-4">Assign Shift</h3>
            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#4A5961] mb-1">Staff</label>
                <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className={inputCls}>
                  <option value="">Select staff</option>
                  {roster.map((r) => <option key={r.employeeId} value={r.employeeId}>{r.name} — {r.role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5961] mb-1">Shift</label>
                <select value={TEMPLATES.some((t) => t.name === form.shiftName) ? form.shiftName : ""} onChange={(e) => pickTemplate(e.target.value)} className={inputCls}>
                  {TEMPLATES.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A5961] mb-1">Start</label>
                  <input required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} placeholder="08:00 AM" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A5961] mb-1">End</label>
                  <input required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} placeholder="04:00 PM" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5961] mb-1">Working days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day, i) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-[8px] text-xs font-semibold border ${form.days.includes(day) ? "bg-[#0E7C86] text-white border-[#0E7C86]" : "bg-white text-[#4A5961] border-[#CBD3D9]"}`}
                    >
                      {SHORT[i]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAssign(false)} className="px-4 py-2 border border-[#CBD3D9] text-[#10242A] rounded-[8px] text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#0E7C86] hover:bg-[#0B666E] text-white rounded-[8px] text-xs font-semibold disabled:opacity-50">
                  {saving ? "Saving..." : "Save Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
