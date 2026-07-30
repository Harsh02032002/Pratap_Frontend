import React, { useMemo, useState, useEffect, useCallback } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerEmployees, ownerEmployeesCacheKey } from "../../utils/propertyowner";
import {
  CheckCircle2, Search, X, ChevronLeft, ChevronRight, ChevronDown,
  ArrowUpDown, SlidersHorizontal, MoreVertical, Calendar, Pencil, Clock,
} from "lucide-react";
import { apiFetch } from "../../utils/api";
import { cacheGet, cacheSet, cacheInvalidate } from "../../utils/cache";

const STATUS_STYLES = {
  Present:   { bg: "bg-emerald-50 text-emerald-700 border-emerald-200",  label: "Present" },
  Absent:    { bg: "bg-rose-50 text-rose-700 border-rose-200",           label: "Absent" },
  "Half Day":{ bg: "bg-blue-50 text-blue-700 border-blue-200",           label: "On Leave" },
  Leave:     { bg: "bg-blue-50 text-blue-700 border-blue-200",           label: "On Leave" },
  Late:      { bg: "bg-orange-50 text-orange-700 border-orange-200",     label: "Late" },
};

/* ── Premium custom stat glyphs (Stripe / Linear inspired, not an icon pack) ── */
function TeamGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="8" cy="8.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="8.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 18c0-2.3 2-3.8 4.5-3.8s4.5 1.5 4.5 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13.8 14.6c2.2.35 3.7 1.7 3.7 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.4 12.2l2.4 2.4 4.8-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AbsentGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="10.5" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 19c0-3.1 2.8-5 6-5 .9 0 1.7.15 2.5.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.5 17.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function LeaveGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 9.5h16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 3.2v3.4M15.5 3.2v3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="14.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
function DottedGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1.6 3.4" />
      <circle cx="12" cy="12" r="2.3" fill="currentColor" />
    </svg>
  );
}

function StatCard({ value, label, glyph: Glyph, gradient, accent }) {
  return (
    <div className="bg-white rounded-[22px] border border-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)] p-6 flex flex-col">
      <div className={`w-11 h-11 rounded-[16px] bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-sm ring-1 ring-white/40`}>
        <Glyph />
      </div>
      <p className="text-3xl font-black text-slate-900 leading-none mt-4">{value}</p>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{label}</p>
      <div className={`h-1 w-8 rounded-full mt-3 bg-gradient-to-r ${accent}`} />
    </div>
  );
}

function fmtLeaveDate(d) {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

function LeaveDetailsCard({ att, dateStr }) {
  const leaveTypeLabel = att.status === "Half Day" ? "Half Day Leave" : "Full Day Leave";
  return (
    <div className="w-64 rounded-[18px] bg-slate-50/80 border border-slate-200/70 p-3.5 space-y-2.5">
      {att.leaveReason ? (
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason</p>
          <p className="text-[12px] font-bold text-slate-700 mt-0.5">{att.leaveReason}</p>
        </div>
      ) : null}
      {att.notes ? (
        <>
          <div className="h-px bg-slate-200/70" />
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Note</p>
            <p className="text-[12px] font-medium text-slate-600 mt-0.5 leading-snug">{att.notes}</p>
          </div>
        </>
      ) : null}
      <div className="h-px bg-slate-200/70" />
      <div className="flex items-center gap-2">
        <Calendar size={13} className="text-slate-400 shrink-0" />
        <p className="text-[12px] font-bold text-slate-700">{fmtLeaveDate(att.date || dateStr)}</p>
      </div>
      <span className="inline-block text-[10px] font-black text-blue-600">{leaveTypeLabel}</span>
    </div>
  );
}

export default function StaffAttendancePage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split("T")[0]);
  const [staff, setStaff]           = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [markModal, setMarkModal]   = useState(null);
  const [markForm, setMarkForm]     = useState({ status: "Present", checkIn: "", checkOut: "", notes: "", leaveReason: "" });
  const [saving, setSaving]         = useState(false);
  const [sortOrder, setSortOrder]   = useState("name-asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showSort, setShowSort]     = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(null);

  const fetchData = useCallback(async () => {
    const EMP_KEY = ownerEmployeesCacheKey(owner.loginId, { isActive: true });
    const ATT_KEY = `attendance:${owner.loginId}`;
    const cachedEmp = cacheGet(EMP_KEY);
    const cachedAtt = cacheGet(ATT_KEY);
    if (cachedEmp && cachedAtt) {
      setStaff(cachedEmp);
      setAttendance(cachedAtt);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [allStaff, allAtt] = await Promise.all([
        cachedEmp ? Promise.resolve(cachedEmp) : fetchOwnerEmployees(owner.loginId, { isActive: true }),
        cachedAtt ? Promise.resolve(cachedAtt) : apiFetch(`/api/hr/attendance/${owner.loginId}`).then(r => r?.data || []),
      ]);

      setStaff(allStaff);
      setAttendance(allAtt);
      if (!cachedAtt && Array.isArray(allAtt)) cacheSet(ATT_KEY, allAtt, 2 * 60 * 1000);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [owner.loginId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const dateAtt = useMemo(() => attendance.filter(a => {
    const d = new Date(a.date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}` === selectedDate;
  }), [attendance, selectedDate]);

  const attMap = useMemo(() => {
    const m = {};
    dateAtt.forEach(a => {
      const empId = a.employeeId?._id || a.employeeId;
      if (empId) m[String(empId)] = a;
    });
    return m;
  }, [dateAtt]);

  const staffWithAtt = useMemo(() => staff.map(s => ({
    ...s,
    attendance: attMap[String(s._id)] || null,
  })), [staff, attMap]);

  const filtered = useMemo(() => staffWithAtt.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.role?.toLowerCase().includes(search.toLowerCase())
  ), [staffWithAtt, search]);

  const displayed = useMemo(() => {
    let list = filtered;
    if (statusFilter !== "all") {
      list = list.filter(s => {
        const st = s.attendance?.status;
        if (statusFilter === "Not Marked") return !s.attendance;
        if (statusFilter === "On Leave")   return st === "Leave" || st === "Half Day";
        if (statusFilter === "Present")    return st === "Present" || st === "Late";
        return st === statusFilter; // Absent
      });
    }
    return [...list].sort((a, b) =>
      sortOrder === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }, [filtered, statusFilter, sortOrder]);

  const stats = useMemo(() => ({
    total: staff.length,
    present: dateAtt.filter(a => a.status === "Present" || a.status === "Late").length,
    absent: dateAtt.filter(a => a.status === "Absent").length,
    leave: dateAtt.filter(a => a.status === "Leave" || a.status === "Half Day").length,
    notMarked: staff.length - dateAtt.length,
  }), [staff, dateAtt]);

  const handleMark = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/hr/attendance", {
        method: "POST",
        body: JSON.stringify({
          employeeId: markModal._id,
          ownerLoginId: owner.loginId,
          date: selectedDate,
          status: markForm.status,
          checkIn: markForm.checkIn,
          checkOut: markForm.checkOut,
          notes: markForm.notes,
          leaveReason: markForm.leaveReason,
        }),
      });
      cacheInvalidate(`attendance:`);
      await fetchData();
      setMarkModal(null);
    } catch (err) { alert("Failed: " + err.message); }
    finally { setSaving(false); }
  };

  const changeDate = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const openMark = (s) => {
    const att = s.attendance;
    setMenuOpen(null);
    setMarkModal(s);
    setMarkForm({
      status: att?.status || "Present",
      checkIn: att?.checkIn || "",
      checkOut: att?.checkOut || "",
      notes: att?.notes || "",
      leaveReason: att?.leaveReason || "",
    });
  };

  const isLeaveStatus = markForm.status === "Leave" || markForm.status === "Half Day";
  const STAT_CARDS = [
    { label: "Total Staff", value: stats.total,     glyph: TeamGlyph,   gradient: "from-indigo-500 to-violet-500",  accent: "from-indigo-400 to-violet-400" },
    { label: "Present",     value: stats.present,   glyph: CheckGlyph,  gradient: "from-teal-400 to-emerald-500",   accent: "from-teal-400 to-emerald-400" },
    { label: "Absent",      value: stats.absent,    glyph: AbsentGlyph, gradient: "from-rose-400 to-red-400",       accent: "from-rose-400 to-red-400" },
    { label: "On Leave",    value: stats.leave,     glyph: LeaveGlyph,  gradient: "from-blue-500 to-indigo-500",    accent: "from-blue-400 to-indigo-400" },
    { label: "Not Marked",  value: stats.notMarked, glyph: DottedGlyph, gradient: "from-amber-400 to-orange-500",   accent: "from-amber-400 to-orange-400" },
  ];

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Staff Attendance"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Header */}
      <div className="relative mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Attendance</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Track daily check-ins, check-outs, and leaves</p>

        {/* Decorative attendance illustration */}
        <svg viewBox="0 0 220 130" fill="none" className="hidden lg:block absolute -top-3 right-0 w-52 h-32 pointer-events-none select-none">
          <ellipse cx="150" cy="118" rx="70" ry="8" fill="#EEF2FF" />
          <rect x="92" y="26" width="74" height="88" rx="10" fill="#E0E7FF" />
          <rect x="104" y="18" width="50" height="16" rx="8" fill="#C7D2FE" />
          <rect x="103" y="46" width="52" height="7" rx="3.5" fill="#fff" />
          <rect x="103" y="60" width="40" height="7" rx="3.5" fill="#fff" />
          <rect x="103" y="74" width="46" height="7" rx="3.5" fill="#fff" />
          <circle cx="182" cy="42" r="20" fill="#DDD6FE" />
          <path d="M174 42.5l5.5 5.5 10-11" stroke="#7C3AED" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="66" cy="86" r="16" fill="#C7D2FE" />
          <circle cx="66" cy="80" r="6" fill="#6366F1" />
          <path d="M54 98c0-6 5.4-9.5 12-9.5s12 3.5 12 9.5" fill="#6366F1" />
          <circle cx="196" cy="90" r="4" fill="#A5B4FC" />
          <circle cx="80" cy="34" r="3" fill="#A5B4FC" />
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-white rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_10px_30px_-16px_rgba(15,23,42,0.12)] px-4 py-5 mb-6">
        <button onClick={() => changeDate(-1)} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all">
          <ChevronLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-slate-500" />
          </div>
          <div className="text-center">
            <p className="font-black text-slate-900 text-base leading-tight">
              {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="mt-0.5 text-xs text-blue-600 font-bold outline-none cursor-pointer hover:underline bg-transparent"
            />
          </div>
        </div>
        <button onClick={() => changeDate(1)} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all" disabled={selectedDate >= today.toISOString().split("T")[0]}>
          <ChevronRight size={18} className={`text-slate-500 ${selectedDate >= today.toISOString().split("T")[0] ? "opacity-30" : ""}`} />
        </button>
      </div>

      {/* Search + Filter + Sort */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff by name or role..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400" />
        </div>

        {/* Filter */}
        <div className="relative">
          <button onClick={() => { setShowFilter(v => !v); setShowSort(false); }}
            className={`h-12 px-4 rounded-2xl border bg-white text-sm font-bold flex items-center gap-2 transition-all ${statusFilter !== "all" ? "border-blue-300 text-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            <SlidersHorizontal size={15} /> Filter <ChevronDown size={14} className="text-slate-400" />
          </button>
          {showFilter && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl border border-slate-100 shadow-xl p-1.5 z-20">
                {["all", "Present", "Absent", "On Leave", "Not Marked"].map(opt => (
                  <button key={opt} onClick={() => { setStatusFilter(opt); setShowFilter(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === opt ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                    {opt === "all" ? "All Staff" : opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <button onClick={() => { setShowSort(v => !v); setShowFilter(false); }}
            className="h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 flex items-center gap-2 hover:border-slate-300 transition-all">
            <ArrowUpDown size={15} /> Sort <ChevronDown size={14} className="text-slate-400" />
          </button>
          {showSort && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl border border-slate-100 shadow-xl p-1.5 z-20">
                {[{ v: "name-asc", l: "Name (A–Z)" }, { v: "name-desc", l: "Name (Z–A)" }].map(opt => (
                  <button key={opt.v} onClick={() => { setSortOrder(opt.v); setShowSort(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${sortOrder === opt.v ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(15,23,42,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Check In</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Check Out</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave Details</th>
                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm font-medium">Loading...</td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm font-medium">No staff found</td></tr>
              ) : displayed.map(s => {
                const att = s.attendance;
                const sc = STATUS_STYLES[att?.status] || null;
                const onLeave = att?.status === "Leave" || att?.status === "Half Day";
                return (
                  <tr key={s._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors align-top">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-sm overflow-hidden shrink-0">
                          {s.photoDataUrl ? <img src={s.photoDataUrl} alt={s.name} className="w-full h-full object-cover" /> : s.name?.[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-[13px]">{s.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{s.loginId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600">{s.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      {att ? (
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border ${sc?.bg}`}>
                          {onLeave && <Calendar size={11} />}{sc?.label || att.status}
                        </span>
                      ) : (
                        <span className="text-[11px] font-black px-2.5 py-1 rounded-full border bg-slate-100 text-slate-400 border-slate-200">Not Marked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600">{att?.checkIn || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600">{att?.checkOut || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      {onLeave ? <LeaveDetailsCard att={att} dateStr={selectedDate} /> : <span className="text-xs font-bold text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openMark(s)}
                          className="px-3 h-8 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-[11px] font-black transition-all border border-slate-200 hover:border-blue-200 flex items-center gap-1.5"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <div className="relative">
                          <button onClick={() => setMenuOpen(menuOpen === s._id ? null : s._id)}
                            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
                            <MoreVertical size={15} />
                          </button>
                          {menuOpen === s._id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                              <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl border border-slate-100 shadow-xl p-1.5 z-20">
                                <button onClick={() => openMark(s)}
                                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                  <Pencil size={13} /> {att ? "Edit Attendance" : "Mark Attendance"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Modal */}
      {markModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900">Mark Attendance</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{markModal.name} — {new Date(selectedDate).toLocaleDateString("en-IN")}</p>
              </div>
              <button onClick={() => setMarkModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Attendance Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Present", "Absent", "Late", "Half Day", "Leave"].map(s => (
                    <button key={s} type="button" onClick={() => setMarkForm(f => ({ ...f, status: s }))}
                      className={`py-2 rounded-xl text-xs font-black border transition-all ${markForm.status === s ? "bg-blue-600 border-blue-600 text-white shadow-md" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {isLeaveStatus && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Leave Reason</label>
                  <input type="text" value={markForm.leaveReason} onChange={e => setMarkForm(f => ({ ...f, leaveReason: e.target.value }))}
                    placeholder="e.g. Personal Work" className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Check In Time</label>
                  <input type="time" value={markForm.checkIn} onChange={e => setMarkForm(f => ({ ...f, checkIn: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Check Out Time</label>
                  <input type="time" value={markForm.checkOut} onChange={e => setMarkForm(f => ({ ...f, checkOut: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{isLeaveStatus ? "Note" : "Notes"}</label>
                <input type="text" value={markForm.notes} onChange={e => setMarkForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional note..." className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setMarkModal(null)} className="flex-1 h-11 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={handleMark} disabled={saving}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={14} />}
                  Save Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
