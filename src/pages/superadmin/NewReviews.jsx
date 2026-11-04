import React, { useEffect, useState, useMemo } from "react";
import { 
  Star, Clock, Calendar, MessageSquare, Building2, 
  RefreshCw, Loader2, User, ChevronRight, Zap, Search
} from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function NewReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cycleFilter, setCycleFilter] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/reviews/admin/all");
      setReviews(Array.isArray(res) ? res : (res.data || []));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const categorized = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      today: reviews.filter(r => new Date(r.createdAt) >= today),
      thisWeek: reviews.filter(r => new Date(r.createdAt) >= lastWeek && new Date(r.createdAt) < today),
      thisMonth: reviews.filter(r => new Date(r.createdAt) >= lastMonth && new Date(r.createdAt) < lastWeek)
    };
  }, [reviews]);

  const displayList = useMemo(() => {
    let base = [
      ...categorized.today.map(r => ({ ...r, _cycle: "Today's Pulse" })),
      ...categorized.thisWeek.map(r => ({ ...r, _cycle: "This Week's Feedback" })),
      ...categorized.thisMonth.map(r => ({ ...r, _cycle: "Monthly Archive" })),
    ];
    if (cycleFilter === "today") base = categorized.today.map(r => ({ ...r, _cycle: "Today's Pulse" }));
    else if (cycleFilter === "week") base = categorized.thisWeek.map(r => ({ ...r, _cycle: "This Week's Feedback" }));
    else if (cycleFilter === "month") base = categorized.thisMonth.map(r => ({ ...r, _cycle: "Monthly Archive" }));

    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(r =>
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.propertyName && r.propertyName.toLowerCase().includes(q)) ||
      (r.review && r.review.toLowerCase().includes(q))
    );
  }, [categorized, cycleFilter, search]);

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">New Review Feed</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Real-time Stream of New Resident Experiences & Rating Logs</p>
        </div>
        <button onClick={loadData} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer flex items-center gap-2 shrink-0">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Pulse", val: categorized.today.length },
          { label: "This Week's Feedback", val: categorized.thisWeek.length },
          { label: "Monthly Archive", val: categorized.thisMonth.length },
          { label: "Total Streamed", val: categorized.today.length + categorized.thisWeek.length + categorized.thisMonth.length },
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
            placeholder="Search resident, property, or review..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={cycleFilter}
            onChange={e => setCycleFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">All Cycles</option>
            <option value="today">Today's Pulse ({categorized.today.length})</option>
            <option value="week">This Week's Feedback ({categorized.thisWeek.length})</option>
            <option value="month">Monthly Archive ({categorized.thisMonth.length})</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Resident</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Rating</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Review</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Cycle</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-[#4A5961] text-[13px]">Loading review feed...</td></tr>
              ) : displayList.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-[#4A5961] text-[13px]">No feedback records in this cycle</td></tr>
              ) : displayList.map((r) => (
                <tr key={r._id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5 pl-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#D9E1E7] text-[#4A5961] flex items-center justify-center font-bold text-[11px] shrink-0">
                        {(r.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-[#10242A] text-[13px]">{r.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-[#4A5961] font-medium">{r.propertyName || "—"}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} className={cn(s <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 text-[#4A5961] italic max-w-md truncate" title={r.review}>"{r.review}"</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E0F2FE] text-[#0369A1]">
                      {r._cycle}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-right text-[#4A5961] text-[12px] whitespace-nowrap">
                    {new Date(r.createdAt || Date.now()).toLocaleString([], { month: "short", day: "numeric", hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
