import React, { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import useSEO from "../../hooks/useSEO";
import { getAllLeaves, createLeave, setLeaveStatus, getAllStaffAttendance } from "../../api/attendance";

const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const emptyForm = () => ({ employeeId: "", type: "Casual Leave", from: todayStr(), to: todayStr(), reason: "" });

export default function AttendanceLeave() {
  useSEO({
    title: "Leave – Roomhy Superadmin",
    description: "Review and approve staff leave requests.",
    canonical: "https://roomhy.com/superadmin/attendance-leave"
  });

  const [activeTab, setActiveTab] = useState("Pending");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newLeave, setNewLeave] = useState(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, att] = await Promise.all([getAllLeaves(), getAllStaffAttendance(todayStr())]);
      setLeaves(list.map((l) => ({ ...l, id: l._id })));
      setStaff(att.data);
    } catch (err) {
      setError(err?.message || "Could not load leave requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const approved = leaves.filter((l) => l.status === "Approved");
    return {
      pending: leaves.filter((l) => l.status === "Pending").length,
      approved: approved.filter((l) => {
        const f = new Date(l.fromDate);
        return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear();
      }).length,
      today: approved.filter((l) => new Date(l.fromDate) <= startToday && new Date(l.toDate) >= startToday).length,
    };
  }, [leaves]);

  const filteredLeaves = useMemo(
    () => leaves.filter((l) => l.status.toLowerCase() === activeTab.toLowerCase()),
    [leaves, activeTab]
  );

  const handleAction = async (id, status) => {
    try {
      await setLeaveStatus(id, status);
      toast.success(`Leave ${status.toLowerCase()}`);
      await load();
    } catch (err) {
      toast.error(err?.message || "Could not update leave");
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!newLeave.employeeId) return;
    setSaving(true);
    try {
      await createLeave(newLeave);
      toast.success("Leave added");
      setShowApplyModal(false);
      setNewLeave(emptyForm());
      setActiveTab("Pending");
      await load();
    } catch (err) {
      toast.error(err?.message || "Could not add leave");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Leave</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Review and approve staff leave requests</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-[13px] px-4 py-1.5 rounded-[8px] flex items-center gap-2 transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
        >
          <Plus size={16} />
          <span>Add Leave</span>
        </button>
      </div>

      {/* ── 3 Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Pending Requests */}
        <div className="bg-white border border-[#E1E6EA] rounded-[16px] p-5 shadow-xs">
          <div className="text-[13px] font-medium text-[#4A5961]">Pending Requests</div>
          <div className="text-[28px] font-bold text-[#10242A] tracking-tight mt-1">
            {stats.pending.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Card 2: Approved This Month */}
        <div className="bg-white border border-[#E1E6EA] rounded-[16px] p-5 shadow-xs">
          <div className="text-[13px] font-medium text-[#4A5961]">Approved This Month</div>
          <div className="text-[28px] font-bold text-[#10242A] tracking-tight mt-1">
            {stats.approved.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Card 3: On Leave Today */}
        <div className="bg-white border border-[#E1E6EA] rounded-[16px] p-5 shadow-xs">
          <div className="text-[13px] font-medium text-[#4A5961]">On Leave Today</div>
          <div className="text-[28px] font-bold text-[#10242A] tracking-tight mt-1">
            {stats.today.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-[#E1E6EA] flex gap-8">
        {["Pending", "Approved", "Rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-[14px] font-semibold transition-all relative cursor-pointer ${
              activeTab === tab
                ? "text-[#0E7C86]"
                : "text-[#4A5961] hover:text-[#10242A]"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0E7C86] rounded-t-md" />
            )}
          </button>
        ))}
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white border border-[#E1E6EA] rounded-[16px] p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider pl-2">Staff</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">Type</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">From</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">To</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">Days</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">Status</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6]">
              {loading ? (
                <tr><td colSpan="7" className="py-12 text-center text-[#708088] text-[14px]">Loading leave requests...</td></tr>
              ) : error ? (
                <tr><td colSpan="7" className="py-12 text-center text-[#991B1B] text-[14px]">{error}</td></tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#708088] text-[14px]">
                    No {activeTab.toLowerCase()} leave requests found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-4 text-[14px] font-medium text-[#10242A] pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#CBD3D9] flex items-center justify-center text-[12px] font-bold text-[#10242A] shrink-0">
                          {(row.employeeName || "?").split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span>{row.employeeName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-[14px] text-[#4A5961]">{row.type}</td>
                    <td className="py-4 text-[14px] text-[#4A5961]">{fmtDate(row.fromDate)}</td>
                    <td className="py-4 text-[14px] text-[#4A5961]">{fmtDate(row.toDate)}</td>
                    <td className="py-4 text-[14px] text-[#4A5961]">{row.days}</td>
                    <td className="py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-semibold ${
                        row.status === "Approved" 
                          ? "bg-[#DDF3E4] text-[#14532D]" 
                          : row.status === "Pending" 
                          ? "bg-[#FDEBD0] text-[#7A3E00]" 
                          : "bg-[#FDE8E8] text-[#991B1B]"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      {row.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(row.id, "Approved")}
                            className="bg-[#0E7C86] hover:bg-[#0B666E] text-white text-[12px] font-semibold px-4 py-1.5 rounded-[8px] transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(row.id, "Rejected")}
                            className="bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] text-[12px] font-semibold px-4 py-1.5 rounded-[8px] transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#708088]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Leave Modal ── */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[16px] border border-[#E1E6EA] shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-[18px] font-bold text-[#10242A] mb-4">Add Staff Leave</h3>
            <form onSubmit={handleAddLeave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#4A5961] mb-1">Staff</label>
                <select
                  required
                  value={newLeave.employeeId}
                  onChange={e => setNewLeave({ ...newLeave, employeeId: e.target.value })}
                  className="w-full h-10 border border-[#CBD3D9] rounded-[8px] px-3 text-[#10242A] outline-none focus:border-[#0E7C86]"
                >
                  <option value="">Select staff</option>
                  {staff.map(s => <option key={s.employeeId} value={s.employeeId}>{s.name} — {s.role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5961] mb-1">Leave Type</label>
                <select
                  value={newLeave.type}
                  onChange={e => setNewLeave({ ...newLeave, type: e.target.value })}
                  className="w-full h-10 border border-[#CBD3D9] rounded-[8px] px-3 text-[#10242A] outline-none focus:border-[#0E7C86]"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A5961] mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    min={"2000-01-01"}
                    value={newLeave.from}
                    onChange={e => setNewLeave({ ...newLeave, from: e.target.value })}
                    className="w-full h-10 border border-[#CBD3D9] rounded-[8px] px-3 text-[#10242A] outline-none focus:border-[#0E7C86]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A5961] mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    min={newLeave.from}
                    value={newLeave.to}
                    onChange={e => setNewLeave({ ...newLeave, to: e.target.value })}
                    className="w-full h-10 border border-[#CBD3D9] rounded-[8px] px-3 text-[#10242A] outline-none focus:border-[#0E7C86]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A5961] mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={newLeave.reason}
                  onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="w-full h-10 border border-[#CBD3D9] rounded-[8px] px-3 text-[#10242A] outline-none focus:border-[#0E7C86]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-[#CBD3D9] text-[#10242A] rounded-[8px] text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#0E7C86] hover:bg-[#0B666E] text-white rounded-[8px] text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Leave"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
