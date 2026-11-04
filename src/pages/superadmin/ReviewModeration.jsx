import React, { useEffect, useState, useMemo } from "react";
import { 
  Star, Check, X, ShieldAlert, AlertTriangle, 
  MessageSquare, User, Building2, RefreshCw, Loader2,
  Trash2, Eye, ShieldCheck, Filter, Search
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { toast } from "react-hot-toast";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReviewModeration() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filter]);

  const handleBulkUpdate = async (newStatus) => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    const toastId = toast.loading(`Updating status for ${selectedIds.size} reviews...`);
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        await fetchJson(`/api/reviews/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status: newStatus })
        });
        successCount++;
      }
      setReviews(prev => prev.map(r => selectedIds.has(r._id) ? { ...r, status: newStatus } : r));
      toast.success(`Successfully updated ${successCount} reviews to ${newStatus}!`, { id: toastId });
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error("Failed to update some reviews", { id: toastId });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/reviews/admin/all");
      const list = Array.isArray(res) ? res : (res.data || []);
      setReviews(list);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const counts = useMemo(() => ({
    pending: reviews.filter(r => r.status === "Pending").length,
    flagged: reviews.filter(r => r.status === "Pending Review").length,
    active: reviews.filter(r => r.status === "Active").length,
    inactive: reviews.filter(r => r.status === "Inactive").length,
  }), [reviews]);

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter(r => {
      const matchFilter = r.status === filter;
      const matchSearch = !q ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.propertyName && r.propertyName.toLowerCase().includes(q)) ||
        (r.review && r.review.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [reviews, filter, search]);

  const updateStatus = async (id, newStatus) => {
    try {
      await fetchJson(`/api/reviews/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      setReviews(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Review Moderation</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Quality Control & Community Guidelines Enforcement Matrix</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadReviews} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer flex items-center gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending Queue", val: counts.pending },
          { label: "Auto-Flagged", val: counts.flagged },
          { label: "Active Reviews", val: counts.active },
          { label: "Inactive / Rejected", val: counts.inactive },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{c.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{loading ? "..." : c.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Row (Outside & Above the Table Card in a Single Line) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#708088]" size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reviewer, property, or content..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            {["Pending", "Pending Review", "Active", "Inactive"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 pl-2 w-8">
                  <input
                    type="checkbox"
                    disabled={isBulkProcessing || filteredReviews.length === 0}
                    className="rounded border-[#CBD3D9] cursor-pointer w-4 h-4"
                    checked={filteredReviews.length > 0 && filteredReviews.every(r => selectedIds.has(r._id))}
                    onChange={() => {
                      const allSelected = filteredReviews.every(r => selectedIds.has(r._id));
                      const next = new Set(selectedIds);
                      if (allSelected) {
                        filteredReviews.forEach(r => next.delete(r._id));
                      } else {
                        filteredReviews.forEach(r => next.add(r._id));
                      }
                      setSelectedIds(next);
                    }}
                  />
                </th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Reviewer</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Rating</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Review & Safety Notes</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#4A5961] text-[13px]">Scanning Content Repository...</td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#4A5961] text-[13px]">Inbox is Clean. No {filter} items found.</td>
                </tr>
              ) : filteredReviews.map((r) => (
                <tr key={r._id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5 pl-2">
                    <input
                      type="checkbox"
                      disabled={isBulkProcessing}
                      className="rounded border-[#CBD3D9] cursor-pointer w-4 h-4"
                      checked={selectedIds.has(r._id)}
                      onChange={() => {
                        const next = new Set(selectedIds);
                        if (next.has(r._id)) next.delete(r._id);
                        else next.add(r._id);
                        setSelectedIds(next);
                      }}
                    />
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#D9E1E7] text-[#4A5961] flex items-center justify-center font-bold text-[11px] shrink-0">
                        {(r.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#10242A] text-[13px]">{r.name}</p>
                        <p className="text-[11px] text-[#708088]">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-[#4A5961]">
                    <span className="font-medium text-[#10242A]">{r.propertyName || "—"}</span>
                  </td>
                  <td className="py-2.5">
                    <div className="inline-flex items-center gap-1 bg-[#F4F6F8] px-2 py-0.5 rounded-[6px] border border-[#E1E6EA]">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-[12px] font-bold text-[#10242A]">{r.rating}</span>
                    </div>
                  </td>
                  <td className="py-2.5 max-w-md">
                    <p className="text-[#4A5961] italic truncate" title={r.review}>"{r.review}"</p>
                    {r.status === "Pending Review" && (
                      <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-[4px] text-[11px] text-amber-800 font-semibold">
                        <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                        <span>Auto-Flagged{r.moderationNotes ? `: ${r.moderationNotes}` : ""}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 pr-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {filter === "Pending" || filter === "Pending Review" ? (
                        <>
                          <button 
                            onClick={() => updateStatus(r._id, "Inactive")}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white border border-rose-200 text-rose-600 text-[11px] font-semibold hover:bg-rose-50 transition-all cursor-pointer shadow-xs"
                          >
                            <X size={12} /> Reject
                          </button>
                          <button 
                            onClick={() => updateStatus(r._id, "Active")}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#0E7C86] text-white text-[11px] font-semibold hover:bg-[#09626A] transition-all shadow-xs cursor-pointer"
                          >
                            <Check size={12} /> Approve
                          </button>
                        </>
                      ) : filter === "Active" ? (
                        <button 
                          onClick={() => updateStatus(r._id, "Inactive")}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white border border-[#CBD3D9] text-[#10242A] text-[11px] font-semibold hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer shadow-xs"
                        >
                          <ShieldAlert size={12} /> Deactivate
                        </button>
                      ) : (
                        <button 
                          onClick={() => updateStatus(r._id, "Active")}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white border border-[#CBD3D9] text-[#0E7C86] text-[11px] font-semibold hover:bg-[#E6F4F5] transition-all cursor-pointer shadow-xs"
                        >
                          <RefreshCw size={12} /> Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#10242A] text-white px-6 py-3 rounded-[12px] border border-[#0E7C86]/30 shadow-xl flex items-center gap-5 backdrop-blur-md">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-5">
            <span className="w-6 h-6 rounded-full bg-[#0E7C86] text-white flex items-center justify-center text-xs font-bold">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Selected</span>
          </div>
          <div className="flex items-center gap-3">
            {filter === "Pending" || filter === "Pending Review" ? (
              <>
                <button
                  disabled={isBulkProcessing}
                  onClick={() => handleBulkUpdate("Active")}
                  className="bg-[#0E7C86] hover:bg-[#09626A] text-white px-4 py-1.5 rounded-[8px] text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isBulkProcessing ? "Processing..." : <><Check size={14} /> Approve Selected</>}
                </button>
                <button
                  disabled={isBulkProcessing}
                  onClick={() => handleBulkUpdate("Inactive")}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-[8px] text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isBulkProcessing ? "Processing..." : <><X size={14} /> Reject Selected</>}
                </button>
              </>
            ) : (
              <button
                disabled={isBulkProcessing}
                onClick={() => handleBulkUpdate("Active")}
                className="bg-[#0E7C86] hover:bg-[#09626A] text-white px-4 py-1.5 rounded-[8px] text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isBulkProcessing ? "Processing..." : <><RefreshCw size={14} /> Restore Selected</>}
              </button>
            )}
            <button
              disabled={isBulkProcessing}
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white text-xs font-semibold transition-colors pl-2 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
