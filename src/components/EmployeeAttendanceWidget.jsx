import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { LogIn, LogOut, Clock, CalendarOff } from "lucide-react";
import { useMyAttendance, useCheckIn, useCheckOut } from "../hooks/useAttendance";
import { getMyLeaves, createLeave } from "../api/attendance";
import { queryKeys } from "../lib/queryKeys";

const EMPLOYEE_ROLES = ["employee", "manager"];

const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const STATUS_STYLE = {
  Approved: "bg-[#DDF3E4] text-[#14532D]",
  Pending: "bg-[#FDEBD0] text-[#7A3E00]",
  Rejected: "bg-[#FDE8E8] text-[#991B1B]",
};

const isSameLocalDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Check-in / check-out card for the employee dashboard. Renders nothing for any
// other role (superadmin can open /employee/* too, so the URL is not a safe check).
export default function EmployeeAttendanceWidget({ user }) {
  const role = String(user?.role || "").toLowerCase();
  const loginId = user?.loginId || "";
  const isEmployee = EMPLOYEE_ROLES.includes(role) && !!loginId;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: records = [], isLoading } = useMyAttendance(isEmployee ? loginId : "", month, year);
  const checkInMut = useCheckIn(loginId);
  const checkOutMut = useCheckOut(loginId);

  const qc = useQueryClient();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: "Casual Leave", from: todayStr(), to: todayStr(), reason: "" });
  const { data: myLeaves = [] } = useQuery({
    queryKey: queryKeys.attendance.myLeaves(loginId),
    queryFn: getMyLeaves,
    enabled: isEmployee,
  });
  const leaveMut = useMutation({
    mutationFn: () => createLeave(leaveForm),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.attendance.all }),
  });

  const today = useMemo(
    () => records.find((r) => r?.date && isSameLocalDay(new Date(r.date), new Date())) || null,
    [records]
  );

  if (!isEmployee) return null;

  const checkedIn = !!today?.checkIn;
  const checkedOut = !!today?.checkOut;

  const run = async (mut, okMsg) => {
    try {
      await mut.mutateAsync();
      toast.success(okMsg);
    } catch (err) {
      toast.error(err?.message || "Could not save attendance");
    }
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    try {
      await leaveMut.mutateAsync();
      toast.success("Leave request sent to superadmin");
      setLeaveOpen(false);
      setLeaveForm({ type: "Casual Leave", from: todayStr(), to: todayStr(), reason: "" });
    } catch (err) {
      toast.error(err?.message || "Could not send leave request");
    }
  };

  const inputCls = "w-full h-10 border border-slate-200 rounded-xl px-3 text-sm text-slate-800 outline-none focus:border-slate-400";

  return (
    <>
    <div className="bg-white rounded-2xl px-8 py-6 border border-slate-100 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-sm bg-emerald-50 text-emerald-600 border-emerald-100">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Attendance</p>
          <div className="flex items-center gap-10 mt-3">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check-in</p>
              <p className="text-xl font-bold text-slate-800 tracking-tight">{isLoading ? "..." : today?.checkIn || "—"}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check-out</p>
              <p className="text-xl font-bold text-slate-800 tracking-tight">{isLoading ? "..." : today?.checkOut || "—"}</p>
            </div>
            {today?.status === "Late" && (
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Late</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => run(checkInMut, "Checked in")}
          disabled={isLoading || checkedIn || checkInMut.isPending}
          className="flex items-center gap-2 px-7 py-3.5 bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 shadow-lg shadow-slate-800/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogIn className="w-3.5 h-3.5" /> {checkInMut.isPending ? "Saving..." : "Check In"}
        </button>
        <button
          onClick={() => run(checkOutMut, "Checked out")}
          disabled={isLoading || !checkedIn || checkedOut || checkOutMut.isPending}
          className="flex items-center gap-2 px-7 py-3.5 bg-white text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogOut className="w-3.5 h-3.5" /> {checkOutMut.isPending ? "Saving..." : "Check Out"}
        </button>
        <button
          onClick={() => setLeaveOpen(true)}
          className="flex items-center gap-2 px-7 py-3.5 bg-white text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200 hover:bg-slate-50"
        >
          <CalendarOff className="w-3.5 h-3.5" /> Apply Leave
        </button>
      </div>
    </div>

    {leaveOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setLeaveOpen(false)}>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Apply for leave</h3>
          <p className="text-[11px] text-slate-400 mb-4">Your superadmin has to approve it before it counts.</p>
          <form onSubmit={submitLeave} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Leave type</label>
              <select value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })} className={inputCls}>
                <option>Casual Leave</option>
                <option>Sick Leave</option>
                <option>Earned Leave</option>
                <option>Emergency Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">From</label>
                <input type="date" required min={todayStr()} value={leaveForm.from}
                  onChange={(e) => setLeaveForm({ ...leaveForm, from: e.target.value, to: e.target.value > leaveForm.to ? e.target.value : leaveForm.to })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">To</label>
                <input type="date" required min={leaveForm.from} value={leaveForm.to}
                  onChange={(e) => setLeaveForm({ ...leaveForm, to: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reason</label>
              <input type="text" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} className={inputCls} />
            </div>

            {myLeaves.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">My requests</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {myLeaves.map((l) => (
                    <div key={l._id} className="flex items-center justify-between text-xs text-slate-600 border border-slate-100 rounded-lg px-3 py-2">
                      <span>{l.type} · {fmtDate(l.fromDate)}{l.days > 1 ? ` – ${fmtDate(l.toDate)}` : ""}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[l.status] || ""}`}>{l.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setLeaveOpen(false)}
                className="px-5 py-2.5 bg-white text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={leaveMut.isPending}
                className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 disabled:opacity-40">
                {leaveMut.isPending ? "Sending..." : "Send request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
