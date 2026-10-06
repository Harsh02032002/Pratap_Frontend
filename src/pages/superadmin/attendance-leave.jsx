import React, { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import useSEO from "../../hooks/useSEO";

export default function AttendanceLeave() {
  useSEO({
    title: "Leave – Roomhy Superadmin",
    description: "Review and approve staff leave requests.",
    canonical: "https://roomhy.com/superadmin/attendance-leave"
  });

  const [activeTab, setActiveTab] = useState("Pending");
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Dynamic leave records state
  const [leaves, setLeaves] = useState([
    { id: 1, staff: "Neha Kapoor", role: "Field Executive", type: "Casual Leave", from: "10 Oct 2026", to: "12 Oct 2026", days: 3, status: "Pending" },
    { id: 2, staff: "Amit Singh", role: "Field Executive", type: "Sick Leave", from: "08 Oct 2026", to: "09 Oct 2026", days: 2, status: "Pending" },
    { id: 3, staff: "Rajesh Verma", role: "Maintenance", type: "Casual Leave", from: "05 Oct 2026", to: "05 Oct 2026", days: 1, status: "Approved" },
    { id: 4, staff: "Harsh Gupta", role: "Marketing Team", type: "Earned Leave", from: "15 Oct 2026", to: "18 Oct 2026", days: 4, status: "Approved" },
    { id: 5, staff: "Siddharth Malhotra", role: "Accounts", type: "Sick Leave", from: "01 Oct 2026", to: "02 Oct 2026", days: 2, status: "Rejected" },
  ]);

  // New leave form state for modal
  const [newLeave, setNewLeave] = useState({ staff: "", type: "Casual Leave", from: "", to: "", days: 1, reason: "" });

  const stats = useMemo(() => {
    const pending = leaves.filter(l => l.status === "Pending").length;
    const approved = leaves.filter(l => l.status === "Approved").length;
    const today = leaves.filter(l => l.status === "Approved" && l.from.includes("Oct")).length || 1;
    return { pending, approved, today };
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => l.status.toLowerCase() === activeTab.toLowerCase());
  }, [leaves, activeTab]);

  const handleAction = (id, newStatus) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  };

  const handleAddLeave = (e) => {
    e.preventDefault();
    if (!newLeave.staff) return;
    setLeaves(prev => [
      {
        id: Date.now(),
        staff: newLeave.staff,
        role: "Staff Member",
        type: newLeave.type,
        from: newLeave.from || "12 Oct 2026",
        to: newLeave.to || "14 Oct 2026",
        days: Number(newLeave.days) || 1,
        status: "Pending"
      },
      ...prev
    ]);
    setShowApplyModal(false);
    setNewLeave({ staff: "", type: "Casual Leave", from: "", to: "", days: 1, reason: "" });
  };

  return (
    <div className="max-w-[1400px] font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* ── Page Header (PDF Page 6) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-tight">Leave</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Review and approve staff leave requests</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-sm px-4 py-2 rounded-[8px] flex items-center gap-2 transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
        >
          <Plus size={16} />
          <span>Add Leave</span>
        </button>
      </div>

      {/* ── 3 Stat Cards (PDF Spec) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Pending Requests */}
        <div className="bg-white border border-[#E1E6EA] rounded-[16px] p-6 shadow-xs">
          <div className="text-[13px] font-medium text-[#4A5961]">Pending Requests</div>
          <div className="text-[32px] font-bold text-[#10242A] tracking-tight my-1">
            {stats.pending}
          </div>
        </div>

        {/* Card 2: Approved This Month */}
        <div className="bg-white border border-[#E1E6EA] rounded-[16px] p-6 shadow-xs">
          <div className="text-[13px] font-medium text-[#4A5961]">Approved This Month</div>
          <div className="text-[32px] font-bold text-[#10242A] tracking-tight my-1">
            {stats.approved}
          </div>
        </div>

        {/* Card 3: On Leave Today */}
        <div className="bg-white border border-[#E1E6EA] rounded-[16px] p-6 shadow-xs">
          <div className="text-[13px] font-medium text-[#4A5961]">On Leave Today</div>
          <div className="text-[32px] font-bold text-[#10242A] tracking-tight my-1">
            {stats.today}
          </div>
        </div>
      </div>

      {/* ── Tabs (PDF Spec: Pending, Approved, Rejected) ── */}
      <div className="border-b border-[#E1E6EA] mb-6 flex gap-8">
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
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0E7C86] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Table Container (PDF Spec) ── */}
      <div className="bg-white border border-[#E1E6EA] rounded-[16px] p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">Staff</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">Type</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">From</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">To</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">Days</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider">Status</th>
                <th className="pb-3 text-[12px] font-semibold text-[#708088] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6]">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#708088] text-[14px]">
                    No {activeTab.toLowerCase()} leave requests found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-4 text-[14px] font-medium text-[#10242A]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#CBD3D9] flex items-center justify-center text-xs font-bold text-[#10242A] shrink-0">
                          {row.staff.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span>{row.staff}</span>
                      </div>
                    </td>
                    <td className="py-4 text-[14px] text-[#4A5961]">{row.type}</td>
                    <td className="py-4 text-[14px] text-[#4A5961]">{row.from}</td>
                    <td className="py-4 text-[14px] text-[#4A5961]">{row.to}</td>
                    <td className="py-4 text-[14px] text-[#4A5961]">{row.days}</td>
                    <td className="py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-semibold ${
                        row.status === "Approved" 
                          ? "bg-[#DDF3E4] text-[#14532D]" 
                          : row.status === "Pending" 
                          ? "bg-[#FDEBD0] text-[#7A3E00]" 
                          : "bg-[#FEE2E2] text-[#991B1B]"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {row.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(row.id, "Approved")}
                            className="bg-[#0E7C86] hover:bg-[#0B666E] text-white text-xs font-semibold px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(row.id, "Rejected")}
                            className="bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] text-xs font-semibold px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#708088]">—</span>
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
                <label className="block text-xs font-semibold text-[#4A5961] mb-1">Staff Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neha Kapoor"
                  value={newLeave.staff}
                  onChange={e => setNewLeave({ ...newLeave, staff: e.target.value })}
                  className="w-full h-10 border border-[#CBD3D9] rounded-[8px] px-3 text-[#10242A] outline-none focus:border-[#0E7C86]"
                />
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
                  <option value="Earned Leave">Earned Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A5961] mb-1">From Date</label>
                  <input
                    type="text"
                    placeholder="12 Oct 2026"
                    value={newLeave.from}
                    onChange={e => setNewLeave({ ...newLeave, from: e.target.value })}
                    className="w-full h-10 border border-[#CBD3D9] rounded-[8px] px-3 text-[#10242A] outline-none focus:border-[#0E7C86]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A5961] mb-1">To Date</label>
                  <input
                    type="text"
                    placeholder="14 Oct 2026"
                    value={newLeave.to}
                    onChange={e => setNewLeave({ ...newLeave, to: e.target.value })}
                    className="w-full h-10 border border-[#CBD3D9] rounded-[8px] px-3 text-[#10242A] outline-none focus:border-[#0E7C86]"
                  />
                </div>
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
                  className="px-4 py-2 bg-[#0E7C86] hover:bg-[#0B666E] text-white rounded-[8px] text-xs font-semibold transition-colors"
                >
                  Save Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
