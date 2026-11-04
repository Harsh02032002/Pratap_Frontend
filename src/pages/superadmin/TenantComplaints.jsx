import React, { useState, useEffect } from "react";
import { Ticket, Clock, History, CheckCircle2, AlertCircle, ChevronRight, TrendingUp, Calendar, Search, Filter, Download, MoreVertical, Eye, Trash2, X } from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import toast from "react-hot-toast";

const cn = (...c) => c.filter(Boolean).join(" ");

export default function TenantComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await fetchJson("/api/complaints?type=Tenant");
      if (response.success) {
        setComplaints(response.complaints || []);
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await fetchJson(`/api/complaints/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      if (response.success) {
        toast.success("Status updated successfully");
        fetchComplaints();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const deleteComplaint = async (id) => {
    try {
      const response = await fetchJson(`/api/complaints/${id}`, {
        method: "DELETE"
      });
      if (response.success) {
        toast.success("Complaint deleted successfully");
        setDeleteConfirmId(null);
        fetchComplaints();
      }
    } catch (err) {
      toast.error("Failed to delete complaint");
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchStatus = filter === "All" || c.status === filter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      (c.tenantName && c.tenantName.toLowerCase().includes(q)) ||
      (c.tenantPhone && c.tenantPhone.toLowerCase().includes(q)) ||
      (c.property && c.property.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const stats = [
    { label: "Total Complaints", val: complaints.length },
    { label: "Open", val: complaints.filter(c => c.status === "Open").length },
    { label: "In Progress", val: complaints.filter(c => c.status === "In Progress").length },
    { label: "Resolved", val: complaints.filter(c => c.status === "Resolved").length },
  ];

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Tenants Complaints</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Manage and track all complaints raised by tenants across properties.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchComplaints} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs flex items-center gap-2 cursor-pointer">
            <History size={14} className="text-[#0E7C86]" /> Refresh
          </button>
          <button className="bg-[#0E7C86] hover:bg-[#0B666E] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs flex items-center gap-2 cursor-pointer">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{s.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{loading ? "..." : s.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Outside Search & Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#708088]" size={15} />
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search complaints..." 
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            {["All", "Open", "In Progress", "Resolved"].map(s => (
              <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Standalone Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Tenant Info</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property Details</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Category</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Priority</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Created On</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-[#4A5961] text-[13px]">Loading complaints...</td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-[#4A5961] text-[13px]">No complaints found.</td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#D9E1E7] text-[#4A5961] flex items-center justify-center font-bold text-[11px] shrink-0">
                          {c.tenantName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#10242A]">{c.tenantName}</p>
                          <p className="text-[11px] text-[#708088]">{c.tenantPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <p className="text-[13px] font-semibold text-[#10242A]">{c.property}</p>
                      <p className="text-[11px] text-[#708088]">Room: {c.roomNo} | Bed: {c.bedNo}</p>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2.5 py-0.5 bg-[#E8EDF1] text-[#4A5961] rounded-full text-[11px] font-semibold">{c.category}</span>
                    </td>
                    <td className="py-2.5">
                      <select 
                        value={c.status} 
                        onChange={(e) => updateStatus(c._id, e.target.value)}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-semibold outline-none cursor-pointer border",
                          c.status === "Open" ? "bg-[#FDE8E8] text-[#991B1B] border-rose-200" : 
                          c.status === "In Progress" ? "bg-[#FDEBD0] text-[#7A3E00] border-amber-200" : 
                          "bg-[#DDF3E4] text-[#14532D] border-emerald-200"
                        )}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="py-2.5">
                      <span className={cn(
                        "text-[12px] font-semibold flex items-center gap-1.5",
                        c.priority === "High" ? "text-rose-600" : c.priority === "Medium" ? "text-amber-600" : "text-[#4A5961]"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", 
                          c.priority === "High" ? "bg-rose-600" : c.priority === "Medium" ? "bg-amber-600" : "bg-slate-400"
                        )} />
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#4A5961] text-[13px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setSelectedComplaint(c)}
                          className="p-1.5 bg-[#E6F4F5] text-[#0E7C86] rounded-[6px] hover:bg-[#0E7C86] hover:text-white transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(c._id)}
                          className="p-1.5 bg-rose-50 text-rose-600 rounded-[6px] hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Delete Ticket"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[16px] shadow-2xl overflow-hidden border border-[#E1E6EA]">
            <div className="p-4 border-b border-[#E1E6EA] flex items-center justify-between bg-[#F8FAFC]">
              <h3 className="text-xs font-bold text-[#10242A] uppercase tracking-wider flex items-center gap-2">
                <Ticket size={16} className="text-[#0E7C86]" /> Complaint Details
              </h3>
              <button onClick={() => setSelectedComplaint(null)} className="p-1 hover:bg-[#E1E6EA] rounded-full transition-all">
                <X size={16} className="text-[#4A5961]" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 bg-[#F4F6F8] p-3.5 rounded-[12px] border border-[#E1E6EA]">
                <div className="w-10 h-10 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedComplaint.tenantName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#10242A]">{selectedComplaint.tenantName}</p>
                  <p className="text-xs font-semibold text-[#4A5961]">{selectedComplaint.tenantPhone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-0.5">Property</p>
                  <p className="text-xs font-semibold text-[#10242A]">{selectedComplaint.property}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-0.5">Location Info</p>
                  <p className="text-xs font-semibold text-[#10242A]">Room: {selectedComplaint.roomNo} | Bed: {selectedComplaint.bedNo}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-0.5">Category</p>
                  <span className="px-2 py-0.5 bg-[#F4F6F8] text-[#4A5961] border border-[#E1E6EA] rounded-[4px] text-[10px] font-semibold">{selectedComplaint.category}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-0.5">Priority</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded-[4px] text-[10px] font-bold",
                    selectedComplaint.priority === "High" ? "bg-rose-50 text-rose-700" : selectedComplaint.priority === "Medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {selectedComplaint.priority}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E1E6EA]">
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-1.5">Detailed Description</p>
                <div className="bg-[#F4F6F8] rounded-[10px] p-3.5 border border-[#E1E6EA] min-h-[90px]">
                  <p className="text-xs text-[#4A5961] leading-relaxed font-medium">{selectedComplaint.description}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#F8FAFC] border-t border-[#E1E6EA] flex justify-end">
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-1.5 bg-[#0E7C86] text-white rounded-[8px] text-xs font-semibold hover:bg-[#09626A] transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-[16px] shadow-2xl overflow-hidden border border-[#E1E6EA]">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-3">
                <Trash2 size={24} />
              </div>
              <h3 className="text-sm font-bold text-[#10242A] mb-1">Delete Complaint?</h3>
              <p className="text-xs text-[#4A5961]">This action cannot be undone. Are you sure?</p>
            </div>
            <div className="p-3 bg-[#F8FAFC] border-t border-[#E1E6EA] grid grid-cols-2 gap-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-2 bg-white border border-[#E1E6EA] rounded-[8px] text-xs font-semibold text-[#4A5961] hover:bg-[#F4F6F8] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteComplaint(deleteConfirmId)}
                className="px-3 py-2 bg-rose-600 text-white rounded-[8px] text-xs font-semibold hover:bg-rose-700 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
