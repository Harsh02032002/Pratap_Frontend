import React from "react";
import StaffLayout from "../../components/StaffLayout";
import { AlertCircle, Clock, CheckCircle2, Home, User, Plus, Search, Filter, ArrowRight, MessageSquare } from "lucide-react";
import { getApiBase, getAuthHeader } from "../../utils/api";
import { toast } from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { queryClient } from "../../lib/queryClient";
import { useStaffComplaints } from "../../hooks/useStaffLists";
import { getActiveOwnerPropertyId } from "../../utils/propertyowner";

function getStaffSession() {
  try {
    const raw = sessionStorage.getItem("staff_session") || localStorage.getItem("staff_session");
    if (raw) return JSON.parse(raw);
  } catch (_) { }
  return null;
}

export default function StaffComplaints() {
  const staff = getStaffSession();
  const parentLoginId = staff?.parentLoginId || "";
  const staffId = staff?._id || staff?.id || "";
  const staffLoginId = staff?.loginId || "";

  const [statusFilter, setStatusFilter] = React.useState("All");
  const [search, setSearch] = React.useState("");

  const { data: complaints = [], isLoading: loading } = useStaffComplaints(parentLoginId, {
    select: (raw = []) => raw.filter(c => {
      const assignedIdStr = c.assignedStaffId?._id || c.assignedStaffId || "";
      return String(assignedIdStr) === String(staffId) ||
        (c.assignedTo && String(c.assignedTo).toUpperCase() === String(staffLoginId).toUpperCase());
    }).map(c => ({
      dbId: c._id,
      id: `#CMP-${c._id.substring(c._id.length - 4).toUpperCase()}`,
      room: c.roomNo || "N/A",
      tenant: c.tenantName || "Unknown",
      issue: c.category + " - " + c.description,
      priority: c.priority || "Low",
      status: c.status,
      time: new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    })),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ dbId, newStatus }) => {
      const res = await fetch(`${getApiBase()}/api/complaints/${dbId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ status: newStatus })
      });
      return res.json();
    },
    onMutate: async ({ dbId, newStatus }) => {
      // Must match the key useStaffComplaints reads from, which includes the
      // active property — otherwise this optimistic update silently misses.
      const key = queryKeys.complaints.byOwner(parentLoginId, { propertyId: getActiveOwnerPropertyId() });
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old = []) =>
        old.map((c) => (c._id === dbId ? { ...c, status: newStatus } : c))
      );
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.key, ctx.previous);
    },
    onSuccess: (data) => {
      if (data?.success === false) {
        toast.error(data.error || "Failed to update status");
        return;
      }
      toast.success(`Complaint updated ✓`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints.byOwner(parentLoginId, { propertyId: getActiveOwnerPropertyId() }) });
    },
  });

  const updateStatus = (dbId, newStatus) => updateStatusMutation.mutate({ dbId, newStatus });

  const pendingCount = complaints.filter(c => c.status === "Open" || c.status === "In Progress" || c.status === "Taken").length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved" || c.status === "Closed").length;

  const filteredComplaints = complaints.filter(c => {
    const matchStatus = statusFilter === "All" ? true :
      statusFilter === "Pending" ? (c.status === "Open" || c.status === "In Progress" || c.status === "Taken") :
        (c.status === "Resolved" || c.status === "Closed");
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.room.toLowerCase().includes(q) ||
      c.tenant.toLowerCase().includes(q) ||
      c.issue.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <StaffLayout title="Issue Management">
      <div className="space-y-10 max-w-[1400px] mx-auto">
        {/* Top Operational Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap gap-3 p-1.5 bg-slate-50 rounded-[2rem] border border-slate-100 w-fit">
            <button
              onClick={() => setStatusFilter("All")}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === "All" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                }`}
            >
              All ({complaints.length})
            </button>
            <button
              onClick={() => setStatusFilter("Pending")}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === "Pending" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("Resolved")}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === "Resolved" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by Room or Tenant..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all w-full sm:w-80 shadow-sm"
              />
            </div>
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2">
              <Plus size={18} /> Log Incident
            </button>
          </div>
        </div>

        {/* Complaints Feed - Even More Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500">Loading your assigned complaints...</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">No complaints found.</div>
          ) : filteredComplaints.map((c, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500 group relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500 ${c.priority === 'High' ? 'bg-rose-500 text-white shadow-sm' : 'bg-blue-600 text-white shadow-sm'
                    }`}>
                    <AlertCircle size={18} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{c.id}</span>
                    <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${c.status === 'Open' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        c.status === 'In Progress' || c.status === 'Taken' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>{c.status}</span>
                  </div>
                </div>

                <div className="space-y-0.5 mb-4">
                  <h4 className="text-lg font-black text-slate-900 tracking-tighter italic group-hover:text-blue-600 transition-colors">{c.issue}</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <Home size={10} className="text-blue-400" /> Room {c.room}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <User size={10} className="text-blue-400" /> {c.tenant}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[8px] font-black text-slate-300 uppercase tracking-widest italic">
                  <Clock size={10} /> {c.time}
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all border border-slate-100">
                    <MessageSquare size={14} className="text-slate-400" />
                  </button>

                  {(c.status === 'Open' || c.status === 'Taken') && (
                    <button
                      onClick={() => updateStatus(c.dbId, 'In Progress')}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 group/btn"
                    >
                      Start Work <ArrowRight size={10} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {c.status === 'In Progress' && (
                    <button
                      onClick={() => updateStatus(c.dbId, 'Resolved')}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 group/btn"
                    >
                      Resolve <CheckCircle2 size={10} />
                    </button>
                  )}

                  {(c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Rejected') && (
                    <button
                      onClick={() => updateStatus(c.dbId, 'Open')}
                      className="px-5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 group/btn"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StaffLayout>
  );
}
