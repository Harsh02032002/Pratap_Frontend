import React, { useEffect, useState, useMemo } from "react";
import { 
  Star, Clock, Calendar, MessageSquare, Building2, 
  RefreshCw, Loader2, User, ChevronRight, Zap
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function NewReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="New Review Feed" 
          subtitle="Real-time Stream of New Resident Experiences & Rating Logs" 
        />
        <button onClick={loadData} className="p-2.5 rounded-[10px] bg-white border border-[#E1E6EA] shadow-xs text-[#4A5961] hover:text-[#0E7C86] transition-all shrink-0">
           <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      <div className="space-y-8">
        <ReviewSection title="Today's Pulse" reviews={categorized.today} loading={loading} />
        <ReviewSection title="This Week's Feedback" reviews={categorized.thisWeek} loading={loading} />
        <ReviewSection title="Monthly Archive" reviews={categorized.thisMonth} loading={loading} />
      </div>
    </div>
  );
}

function ReviewSection({ title, reviews, loading }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
         <div className="w-1.5 h-5 rounded-full bg-[#0E7C86]" />
         <h2 className="text-base font-bold text-[#10242A]">{title}</h2>
         <span className="text-[10px] font-bold text-[#4A5961] bg-[#F4F6F8] border border-[#E1E6EA] px-2.5 py-0.5 rounded-[6px] uppercase tracking-wider">{reviews.length} Items</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-[16px] animate-pulse border border-[#E1E6EA] shadow-xs" />)
        ) : reviews.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-[16px] border border-[#E1E6EA] shadow-xs">
             <MessageSquare size={28} className="mx-auto mb-3 text-[#4A5961]" />
             <p className="text-xs font-bold text-[#4A5961] uppercase tracking-wider">No feedback records in this cycle</p>
          </div>
        ) : reviews.map(r => (
          <div key={r._id} className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs hover:border-[#0E7C86]/30 transition-all flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-xs shrink-0">
                    {(r.name || "U").charAt(0)}
                 </div>
                 <div>
                    <p className="text-xs font-bold text-[#10242A] truncate max-w-[140px]">{r.name}</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                       {[1,2,3,4,5].map(s => <Star key={s} size={9} className={cn(s <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />)}
                    </div>
                 </div>
              </div>
              <div className="text-[9px] font-semibold text-[#4A5961] uppercase tracking-wider bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px]">
                 {new Date(r.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <p className="text-xs text-[#4A5961] leading-relaxed italic mb-4 flex-1 line-clamp-3">"{r.review}"</p>

            <div className="flex items-center justify-between pt-3 border-t border-[#E1E6EA]">
               <div className="flex items-center gap-1.5">
                  <Building2 size={12} className="text-[#0E7C86]" />
                  <span className="text-[11px] font-semibold text-[#4A5961] truncate max-w-[160px]">{r.propertyName}</span>
               </div>
               <button className="text-[#0E7C86] hover:text-[#09626A] transition-colors cursor-pointer">
                  <Zap size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
