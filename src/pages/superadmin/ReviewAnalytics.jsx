import React, { useEffect, useState, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { 
  TrendingUp, Star, Users, MessageSquare, Activity, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar,
  Target, Zap, PieChart as PieIcon, BarChart3
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReviewAnalytics() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/reviews/admin/all");
      setReviews(Array.isArray(res) ? res : (res.data || []));
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    loadData(); 
  }, []);

  const ratingDist = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { 
      const ratingVal = Math.floor(r.rating || 0);
      if (counts[ratingVal] !== undefined) {
        counts[ratingVal]++; 
      }
    });
    return [
      { name: "5 Stars", value: counts[5], color: "#0E7C86" },
      { name: "4 Stars", value: counts[4], color: "#3B82F6" },
      { name: "3 Stars", value: counts[3], color: "#F59E0B" },
      { name: "2 Stars", value: counts[2], color: "#6366F1" },
      { name: "1 Star",  value: counts[1], color: "#EF4444" },
    ];
  }, [reviews]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
    const verified = reviews.filter(r => r.isVerified || r.bookingId).length;
    const vRate = total > 0 ? Math.round((verified / total) * 100) : 0;
    
    let sentiment = "N/A";
    if (reviews.length > 0 && avg) {
      const parsedAvg = parseFloat(avg);
      if (parsedAvg >= 4.0) sentiment = "Positive";
      else if (parsedAvg >= 3.0) sentiment = "Neutral";
      else sentiment = "Negative";
    }

    return { total, avg, vRate, sentiment };
  }, [reviews]);

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Review Analytics</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Deep Dive into Customer Satisfaction & Brand Perception Metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-3.5 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer flex items-center gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
          </button>
          <div className="flex items-center gap-2 bg-white border border-[#CBD3D9] px-3 py-1.5 rounded-[8px] shadow-xs text-[13px] font-medium text-[#10242A]">
            <Calendar size={14} className="text-[#0E7C86]" />
            <span>Last 30 Days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Average Rating" value={`${stats.avg} ★`} trend="+0.2" />
        <MetricCard label="Total Reviews" value={stats.total.toLocaleString()} trend="+12.4%" />
        <MetricCard label="Verified Rate" value={`${stats.vRate}%`} trend="+5.1%" />
        <MetricCard label="Net Sentiment" value={stats.sentiment} trend="Stable" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between" style={{height: 360}}>
           <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-[#10242A]">Rating Frequency</h3>
           </div>
           <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={ratingDist}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#4A5961', fontSize:10, fontWeight:600}} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill:'#4A5961', fontSize:10, fontWeight:600}} dx={-8} />
                    <Tooltip cursor={{fill: '#F4F6F8'}} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                       {ratingDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col items-center justify-between" style={{height: 360}}>
           <div className="flex items-center justify-between w-full mb-3">
              <h3 className="text-[15px] font-bold text-[#10242A]">Review Share</h3>
           </div>
           <div className="relative w-44 h-44 mb-3 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={ratingDist} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                       {ratingDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-xl font-bold text-[#10242A] leading-none">{stats.total.toLocaleString()}</p>
                 <p className="text-[9px] text-[#4A5961] font-semibold uppercase mt-1 tracking-wider">Total Reviews</p>
              </div>
           </div>
           <div className="w-full space-y-1.5 mt-auto">
              {ratingDist.slice(0, 3).map(r => (
                <div key={r.name} className="flex items-center justify-between p-2 bg-[#F9FAFB] rounded-[8px] border border-[#E1E6EA]">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: r.color}} />
                      <span className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">{r.name}</span>
                   </div>
                   <span className="text-[13px] font-bold text-[#10242A]">{r.value.toLocaleString()} Reviews</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
      <div className="mt-2">
        <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{value}</h3>
        <p className="text-[11px] text-[#708088] mt-1">{trend} vs last period</p>
      </div>
    </div>
  );
}
