import React, { useState, useEffect, useMemo } from "react";
import { getAllStaffAttendance } from "../../api/attendance";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function StatCard({ label, value, loading }) {
  return (
    <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm flex flex-col justify-between">
      <p className="text-xs font-semibold text-[#4A5961] uppercase tracking-wider">{label}</p>
      <div className="mt-3">
        <h3 className="text-3xl font-bold text-[#10242A] tracking-tight">{loading ? "..." : value}</h3>
      </div>
    </div>
  );
}

const toMinutes = (t) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(t || "").trim());
  if (!m) return null;
  return (Number(m[1]) % 12 + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]);
};

const hoursBetween = (inT, outT) => {
  const a = toMinutes(inT), b = toMinutes(outT);
  if (a === null || b === null || b < a) return "—";
  const h = (b - a) / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(2).replace(/0$/, "")}h`;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Log() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ present: 0, late: 0, absent: 0, onLeave: 0, halfDay: 0, holiday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getAllStaffAttendance(date)
      .then(({ data, summary }) => {
        if (cancelled) return;
        setRows(data);
        setSummary(summary);
      })
      .catch((err) => {
        if (cancelled) return;
        setRows([]);
        setError(err?.message || "Could not load attendance");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date]);

  const roles = useMemo(() => [...new Set(rows.map((r) => r.role).filter(Boolean))].sort(), [rows]);

  const displayList = useMemo(() => {
    return rows
      .map((r) => ({
        staff: r.name || r.loginId || "—",
        role: r.role || "",
        in: r.checkIn || "—",
        out: r.checkOut || "—",
        hours: hoursBetween(r.checkIn, r.checkOut),
        status: r.status === "Leave" ? "On Leave" : r.status,
        key: r.employeeId,
      }))
      .filter((item) => {
        const q = search.toLowerCase();
        const matchSearch = !q || item.staff.toLowerCase().includes(q) || item.role.toLowerCase().includes(q);
        const matchRole = roleFilter === "all" || item.role === roleFilter;
        const matchStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
        return matchSearch && matchRole && matchStatus;
      });
  }, [rows, search, roleFilter, statusFilter]);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Staff", "Role", "Check-in", "Check-out", "Hours", "Status"].map(esc).join(",")];
    displayList.forEach((r) => lines.push([r.staff, r.role, r.in, r.out, r.hours, r.status].map(esc).join(",")));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-logs-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight">Daily Logs</h1>
          <p className="text-[13px] text-[#4A5961]">Staff check-in and check-out records</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCsv}
            className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer"
          >
            Export
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard label="Present" value={summary.present} loading={loading} />
        <StatCard label="Late" value={summary.late} loading={loading} />
        <StatCard label="Absent" value={summary.absent} loading={loading} />
        <StatCard label="Half Day" value={summary.halfDay} loading={loading} />
        <StatCard label="On Leave" value={summary.onLeave} loading={loading} />
        <StatCard label="Holiday" value={summary.holiday} loading={loading} />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-[320px]">
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search" 
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
          />
        </div>
        <input
          type="date"
          value={date}
          max={todayStr()}
          onChange={e => e.target.value && setDate(e.target.value)}
          className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
        />
        <select 
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="appearance-none bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-[90px] sm:w-[110px]"
        >
          <option value="all">Role ▾</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="appearance-none bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-[85px] sm:w-[90px]"
        >
          <option value="all">Status ▾</option>
          {["Present", "Half Day", "Late", "Absent", "On Leave", "Holiday"].map(st => <option key={st} value={st}>{st}</option>)}
        </select>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left pl-2">Staff</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Check-in</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Check-out</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Hours</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6]">
              {loading ? (
                <tr><td colSpan="5" className="py-6 text-center text-[13px] text-[#4A5961]">Loading records...</td></tr>
              ) : error ? (
                <tr><td colSpan="5" className="py-6 text-center text-[13px] text-[#991B1B]">{error}</td></tr>
              ) : displayList.length === 0 ? (
                <tr><td colSpan="5" className="py-6 text-center text-[13px] text-[#4A5961]">No staff records for this day.</td></tr>
              ) : (
                displayList.map((row) => (
                  <tr key={row.key} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 text-left pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#D9E1E7] flex items-center justify-center font-bold text-[11px] text-[#4A5961] shrink-0">
                          {row.staff.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-medium text-[#10242A]">{row.staff}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-left text-[13px] text-[#4A5961]">{row.in}</td>
                    <td className="py-2.5 text-left text-[13px] text-[#4A5961]">{row.out}</td>
                    <td className="py-2.5 text-left text-[13px] text-[#4A5961]">{row.hours}</td>
                    <td className="py-2.5 text-left">
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold",
                        row.status === "Present" ? "bg-[#DDF3E4] text-[#14532D]" : 
                        row.status === "Late" ? "bg-[#FFEDD5] text-[#9A3412]" : 
                        row.status === "On Leave" ? "bg-[#E1ECF4] text-[#1E3A5F]" : 
                        row.status === "Half Day" ? "bg-[#FEF3C7] text-[#92400E]" : 
                        row.status === "Holiday" ? "bg-[#E8EDF1] text-[#4A5961]" : 
                        "bg-[#FDE8E8] text-[#991B1B]"
                      )}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
