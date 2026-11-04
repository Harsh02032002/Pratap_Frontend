import React, { useState, useMemo, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import {
  Mail, MessageSquare, Search, Trash2, Clock, CheckCircle2,
  AlertCircle, Eye, RefreshCw, ChevronRight, X, ExternalLink,
  User, Calendar, Info
} from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const STATUS_CFG = {
  "Open": { cls: "bg-[#E6F4F5] text-[#0E7C86] border border-[#0E7C86]/20", dot: "bg-[#0E7C86]" },
  "In Progress": { cls: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-500" },
  "Resolved": { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  "Closed": { cls: "bg-slate-100 text-slate-600 border border-slate-200", dot: "bg-slate-400" }
};

export default function WebsiteQueries() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/superadmin/support/tickets");
      if (res && res.success) {
        const websiteQueries = (res.tickets || []).filter(
          t => t.raised_by_role === "website_user" || t.raised_by === "website_user"
        );
        setTickets(websiteQueries);
      }
    } catch (err) {
      console.error("Failed to load website queries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const res = await fetchJson(`/api/superadmin/support/tickets/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      if (res && res.success) {
        setTickets(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
        if (selectedQuery && selectedQuery._id === id) {
          setSelectedQuery(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredQueries = useMemo(() => {
    const s = search.toLowerCase();
    return tickets.filter(t => {
      const matchSearch = !search ||
        (t.raised_by_name && t.raised_by_name.toLowerCase().includes(s)) ||
        (t.user_email && t.user_email.toLowerCase().includes(s)) ||
        (t.subject && t.subject.toLowerCase().includes(s)) ||
        (t.description && t.description.toLowerCase().includes(s));
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tickets, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === "Open").length,
      inProgress: tickets.filter(t => t.status === "In Progress").length,
      resolved: tickets.filter(t => t.status === "Resolved" || t.status === "Closed").length
    };
  }, [tickets]);

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Website Contact Queries</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Manage inquiries, requests, and support messages sent via the Contact Us form.</p>
        </div>
        <button onClick={loadQueries} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors shadow-xs flex items-center gap-2 cursor-pointer shrink-0">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh Queries
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Queries", val: stats.total },
          { label: "Open Queries", val: stats.open },
          { label: "In Progress", val: stats.inProgress },
          { label: "Resolved", val: stats.resolved }
        ].map(c => (
          <div key={c.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{c.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{loading ? "..." : c.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar (Outside & Above the Table Card in a Single Line) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#708088] w-4 h-4" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by sender name, email, subject..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table Listing */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Sender</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Subject</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Status</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Date Submitted</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[13px] text-[#4A5961]">
                    Loading website queries...
                  </td>
                </tr>
              ) : filteredQueries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[13px] text-[#4A5961]">
                    No website queries found.
                  </td>
                </tr>
              ) : (
                filteredQueries.map(q => {
                  const statusCfg = STATUS_CFG[q.status] || STATUS_CFG.Open;
                  return (
                    <tr key={q._id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-2.5 pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#D9E1E7] text-[#4A5961] flex items-center justify-center font-bold text-[11px] shrink-0">
                            {q.raised_by_name?.charAt(0).toUpperCase() || "W"}
                          </div>
                          <div>
                            <p className="font-semibold text-[#10242A] text-[13px]">{q.raised_by_name}</p>
                            <p className="text-[11px] text-[#708088]">{q.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <p className="text-[13px] font-semibold text-[#10242A] truncate max-w-[250px]">{q.subject}</p>
                        <p className="text-[11px] text-[#708088] truncate max-w-[350px]">{q.description}</p>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold", statusCfg.cls)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                          {q.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-[13px] text-[#4A5961]">
                        {new Date(q.created_at || q.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedQuery(q)}
                            className="p-1.5 text-[#4A5961] hover:text-[#0E7C86] hover:bg-[#E6F4F5] rounded-[6px] transition-all cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Query Detail Slide-over / Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-end p-4" onClick={() => setSelectedQuery(null)}>
          <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-lg h-[95vh] flex flex-col overflow-hidden border border-[#E1E6EA]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E1E6EA] shrink-0 bg-[#F8FAFC]">
              <div>
                <span className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider">Website Contact Enquiry</span>
                <h3 className="text-base font-bold text-[#10242A] mt-0.5">{selectedQuery.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedQuery(null)}
                className="p-1.5 text-[#4A5961] hover:text-[#10242A] hover:bg-[#E1E6EA] rounded-full transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="bg-[#F4F6F8] rounded-[12px] p-4 border border-[#E1E6EA] space-y-3">
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider flex items-center gap-1">
                  <User size={12} /> Contact Information
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                  <div>
                    <span className="text-[#4A5961] block mb-0.5 text-[10px]">Name</span>
                    <span className="text-[#10242A]">{selectedQuery.raised_by_name}</span>
                  </div>
                  <div>
                    <span className="text-[#4A5961] block mb-0.5 text-[10px]">Email</span>
                    <a href={`mailto:${selectedQuery.user_email}`} className="text-[#0E7C86] hover:underline flex items-center gap-1">
                      {selectedQuery.user_email} <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={12} /> Message
                </p>
                <div className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[12px] p-4 text-xs text-[#4A5961] leading-relaxed font-medium">
                  {selectedQuery.description}
                </div>
              </div>

              <div className="space-y-3 border-t border-[#E1E6EA] pt-4">
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider flex items-center gap-1">
                  <Info size={12} /> Update Ticket Status
                </p>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(STATUS_CFG).map(s => {
                    const cfg = STATUS_CFG[s];
                    const isCurrent = selectedQuery.status === s;
                    return (
                      <button
                        key={s}
                        disabled={updatingId !== null}
                        onClick={() => handleUpdateStatus(selectedQuery._id, s)}
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer",
                          isCurrent
                            ? `${cfg.cls} shadow-xs`
                            : "border border-[#E1E6EA] text-[#4A5961] hover:bg-[#F4F6F8]"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-[#E1E6EA] bg-[#F8FAFC] flex gap-2 shrink-0">
              <button
                onClick={() => setSelectedQuery(null)}
                className="w-full py-2 bg-white border border-[#E1E6EA] text-[#4A5961] rounded-[8px] text-xs font-semibold hover:bg-[#F4F6F8] transition-all cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
