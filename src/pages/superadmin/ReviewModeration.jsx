import React, { useEffect, useState, useMemo } from "react";
import { 
  Star, Check, X, ShieldAlert, AlertTriangle, 
  MessageSquare, User, Building2, RefreshCw, Loader2,
  Trash2, Eye, ShieldCheck, Filter
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { toast } from "react-hot-toast";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReviewModeration() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");
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
      const res = await fetchJson("/api/reviews");
      const list = Array.isArray(res) ? res : (res.data || []);
      setReviews(list);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => r.status === filter);
  }, [reviews, filter]);

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
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Review Moderation" 
          subtitle="Quality Control & Community Guidelines Enforcement Matrix" 
        />
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-[12px] border border-[#E1E6EA] shadow-xs flex-wrap">
            {["Pending", "Pending Review", "Active", "Inactive"].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-4 py-1.5 rounded-[8px] text-[11px] font-semibold tracking-wide transition-all cursor-pointer",
                  filter === s ? "bg-[#0E7C86] text-white shadow-xs" : "text-[#4A5961] hover:text-[#10242A]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <button onClick={loadReviews} className="p-2.5 rounded-[10px] bg-white border border-[#E1E6EA] shadow-xs text-[#4A5961] hover:text-[#0E7C86] transition-all shrink-0">
             <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {filteredReviews.length > 0 && (
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-[16px] border border-[#E1E6EA] shadow-xs">
          <input
            type="checkbox"
            disabled={isBulkProcessing}
            className="rounded border-[#E1E6EA] cursor-pointer w-4 h-4"
            checked={filteredReviews.every(r => selectedIds.has(r._id))}
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
          <span className="text-xs font-semibold text-[#4A5961] uppercase tracking-wider">Select All Reviews ({filteredReviews.length})</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[16px] border border-[#E1E6EA] shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0E7C86] mb-3" />
            <p className="text-xs font-bold text-[#4A5961] uppercase tracking-wider">Scanning Content Repository...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[16px] border border-[#E1E6EA] shadow-xs">
            <ShieldCheck size={40} className="mx-auto mb-3 text-emerald-600" />
            <p className="text-xs font-bold text-[#4A5961] uppercase tracking-wider">Inbox is Clean. No {filter} items found.</p>
          </div>
        ) : filteredReviews.map((r) => (
          <div key={r._id} className="bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col gap-5 hover:border-[#0E7C86]/30 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  disabled={isBulkProcessing}
                  className="rounded border-[#E1E6EA] cursor-pointer w-4 h-4 mr-1 shrink-0"
                  checked={selectedIds.has(r._id)}
                  onChange={() => {
                    const next = new Set(selectedIds);
                    if (next.has(r._id)) next.delete(r._id);
                    else next.add(r._id);
                    setSelectedIds(next);
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-xs shrink-0">
                  {(r.name || "U").charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#10242A]">{r.name}</h3>
                  <p className="text-[10px] font-semibold text-[#4A5961] uppercase tracking-wider mt-0.5">{r.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#F4F6F8] px-2.5 py-1 rounded-[8px] border border-[#E1E6EA]">
                 <Star size={11} className="text-amber-400 fill-amber-400" />
                 <span className="text-xs font-bold text-[#10242A]">{r.rating}</span>
              </div>
            </div>

            <div className="p-4 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA] relative">
               <p className="text-xs text-[#4A5961] leading-relaxed italic">"{r.review}"</p>
            </div>

            {r.status === "Pending Review" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-[10px] flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Auto-Flagged by Safety Filter</p>
                  {r.moderationNotes && <p className="text-[10px] text-amber-700 mt-0.5 font-medium">{r.moderationNotes}</p>}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#E1E6EA]">
              <div className="flex items-center gap-1.5">
                 <Building2 size={13} className="text-[#0E7C86]" />
                 <span className="text-[11px] font-semibold text-[#4A5961] truncate max-w-[150px]">{r.propertyName}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {filter === "Pending" || filter === "Pending Review" ? (
                  <>
                    <button 
                      onClick={() => updateStatus(r._id, "Inactive")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      <X size={12} /> Reject
                    </button>
                    <button 
                      onClick={() => updateStatus(r._id, "Active")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#0E7C86] text-white text-[11px] font-semibold hover:bg-[#09626A] transition-all shadow-xs cursor-pointer"
                    >
                      <Check size={12} /> Approve
                    </button>
                  </>
                ) : filter === "Active" ? (
                  <button 
                    onClick={() => updateStatus(r._id, "Inactive")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
                  >
                    <ShieldAlert size={12} /> Deactivate
                  </button>
                ) : (
                  <button 
                    onClick={() => updateStatus(r._id, "Active")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] border border-[#0E7C86]/20 text-[11px] font-semibold hover:bg-[#0E7C86] hover:text-white transition-all cursor-pointer"
                  >
                    <RefreshCw size={12} /> Restore
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#10242A] text-white px-6 py-3 rounded-[16px] border border-[#0E7C86]/30 shadow-xl flex items-center gap-5 backdrop-blur-md">
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
