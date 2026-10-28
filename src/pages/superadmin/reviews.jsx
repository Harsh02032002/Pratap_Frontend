import React from "react";
import { Star, MessageSquare, Clock, ThumbsUp, ChevronRight, TrendingUp, Calendar, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { fetchJson } from "../../utils/api";

const cn = (...c) => c.filter(Boolean).join(" ");

function Stars({ count, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= count ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
      ))}
    </div>
  );
}

export default function ReviewOverview() {
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchJson("/api/reviews/admin/all");
        setReviews(Array.isArray(res) ? res : (res?.data || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const countToday = reviews.filter(r => r.createdAt && new Date(r.createdAt) >= today).length;
    const countWeek = reviews.filter(r => r.createdAt && new Date(r.createdAt) >= week).length;
    const countMonth = reviews.filter(r => r.createdAt && new Date(r.createdAt) >= month).length;
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / total).toFixed(1) : "0.0";
    const pending = reviews.filter(r => String(r.status || "").toLowerCase().includes("pending")).length;
    const approved = reviews.filter(r => ["active", "approved", "published"].includes(String(r.status || "").toLowerCase())).length;
    const rejected = reviews.filter(r => ["rejected", "inactive", "hidden"].includes(String(r.status || "").toLowerCase())).length;

    // Last 7 days trend
    const trendData = [];
    const sparkData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
      const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayReviews = reviews.filter(r => {
        if (!r.createdAt) return false;
        const dt = new Date(r.createdAt);
        return dt >= d && dt < nextD;
      });
      const dayAvg = dayReviews.length > 0
        ? Number((dayReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / dayReviews.length).toFixed(1))
        : 0;
      trendData.push({ name: dayLabel, reviews: dayReviews.length, rating: dayAvg });
      sparkData.push({ v: dayReviews.length });
    }

    // Rating distribution
    const rCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rv = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
      if (rCounts[rv] !== undefined) rCounts[rv]++;
    });
    const pctStr = (val) => (total > 0 ? `${((val / total) * 100).toFixed(1)}%` : "0.0%");
    const ratingData = [
      { name: "5 Star", value: rCounts[5], color: "#0E7C86", pct: pctStr(rCounts[5]) },
      { name: "4 Star", value: rCounts[4], color: "#3B82F6", pct: pctStr(rCounts[4]) },
      { name: "3 Star", value: rCounts[3], color: "#F59E0B", pct: pctStr(rCounts[3]) },
      { name: "2 Star", value: rCounts[2], color: "#EF4444", pct: pctStr(rCounts[2]) },
      { name: "1 Star", value: rCounts[1], color: "#94A3B8", pct: pctStr(rCounts[1]) },
    ];

    // Platform distribution
    const platCounts = { Website: 0, "Mobile App": 0, Google: 0, Others: 0 };
    reviews.forEach(r => {
      const src = String(r.source || r.platform || "Website").toLowerCase();
      if (src.includes("app") || src.includes("mobile")) platCounts["Mobile App"]++;
      else if (src.includes("google")) platCounts.Google++;
      else if (src.includes("other")) platCounts.Others++;
      else platCounts.Website++;
    });
    const platformData = [
      { name: "Website",    value: platCounts.Website,       color: "#0E7C86", pct: pctStr(platCounts.Website) },
      { name: "Mobile App", value: platCounts["Mobile App"], color: "#10B981", pct: pctStr(platCounts["Mobile App"]) },
      { name: "Google",     value: platCounts.Google,        color: "#F59E0B", pct: pctStr(platCounts.Google) },
      { name: "Others",     value: platCounts.Others,        color: "#6366F1", pct: pctStr(platCounts.Others) },
    ];

    // Recent reviews
    const recentReviews = [...reviews]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .map(r => ({
        reviewer: r.name || r.reviewerName || "Guest",
        property: r.propertyName || r.property_name || "Property",
        loc: r.city || r.location || "",
        rating: Number(r.rating) || 0,
        review: r.review || r.reviewText || r.comment || "",
        date: r.createdAt ? new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A",
        status: ["active", "approved", "published"].includes(String(r.status || "").toLowerCase()) ? "Published" : (r.status || "Under Review"),
      }));

    // Top properties
    const propMap = {};
    reviews.forEach(r => {
      const pName = r.propertyName || r.property_name;
      if (!pName) return;
      if (!propMap[pName]) {
        propMap[pName] = { name: pName, loc: r.city || r.location || "—", sum: 0, count: 0 };
      }
      propMap[pName].sum += Number(r.rating) || 0;
      propMap[pName].count += 1;
    });
    const topProperties = Object.values(propMap)
      .map(p => ({
        name: p.name,
        loc: p.loc,
        rating: p.count > 0 ? Number((p.sum / p.count).toFixed(1)) : 0,
        count: p.count,
      }))
      .sort((a, b) => b.rating - a.rating || b.count - a.count)
      .slice(0, 5);

    // Sentiment
    const posCount = reviews.filter(r => Number(r.rating) >= 4).length;
    const neuCount = reviews.filter(r => Number(r.rating) === 3).length;
    const negCount = reviews.filter(r => Number(r.rating) > 0 && Number(r.rating) <= 2).length;
    const sentimentData = [
      { name: "Positive", value: posCount, color: "#10B981", pct: pctStr(posCount) },
      { name: "Neutral",  value: neuCount, color: "#3B82F6", pct: pctStr(neuCount) },
      { name: "Negative", value: negCount, color: "#EF4444", pct: pctStr(negCount) },
    ];

    return {
      countToday,
      countWeek,
      countMonth,
      total,
      avg,
      pending,
      approved,
      rejected,
      trendData,
      sparkData,
      ratingData,
      platformData,
      recentReviews,
      topProperties,
      sentimentData,
    };
  }, [reviews]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title="Review Overview"
        subtitle="Track, manage and analyze all property reviews and ratings."
        actions={
          <div className="flex items-center gap-2 bg-white border border-[#E1E6EA] px-3.5 py-1.5 rounded-[12px] shadow-xs text-xs font-semibold text-[#4A5961]">
            <Calendar size={14} className="text-[#0E7C86]" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        }
      />

      {/* 6 STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: MessageSquare, label: "Reviews Today",      val: stats.countToday,            trend: "Live",   sub: "live pulse", extra: null },
          { icon: MessageSquare, label: "Reviews This Week",  val: stats.countWeek,             trend: "7d",     sub: "growth",     extra: null },
          { icon: MessageSquare, label: "Reviews This Month", val: stats.countMonth,            trend: "30d",    sub: "volume",     extra: null },
          { icon: Star,          label: "Average Rating",     val: `${stats.avg} / 5`,          trend: "Stable", sub: "consensus",  extra: "stars" },
          { icon: ThumbsUp,      label: "Total Reviews",      val: stats.total.toLocaleString(),trend: "Total",  sub: "total reach",extra: null },
          { icon: Clock,         label: "Pending Moderation", val: stats.pending,               trend: "Active", sub: "queue",      extra: null },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs hover:border-[#0E7C86]/30 transition-all">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0"><c.icon size={16} /></div>
              <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider leading-tight">{c.label}</p>
            </div>
            <h4 className="text-xl font-bold text-[#10242A] mb-1">{loading ? "..." : c.val}</h4>
            {c.extra === "stars" && <div className="mb-1"><Stars count={Math.floor(Number(stats.avg))} size={10} /></div>}
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp size={10} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600">{c.trend}</span>
              <span className="text-[10px] text-[#4A5961] font-medium ml-1">{c.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN ROW: Trend + Rating Donut + Platform Donut */}
      <div className="grid grid-cols-12 gap-6">
        {/* Review Trend */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col" style={{height:380}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#10242A]">Review Trend</h3>
            <select className="bg-[#F4F6F8] rounded-[8px] px-2.5 py-1 text-[11px] font-semibold text-[#4A5961] outline-none border border-[#E1E6EA]"><option>This Week</option></select>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#0E7C86]"/><span className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">New Reviews</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/><span className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Average Rating</span></div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}} dy={8}/>
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}} dx={-8}/>
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}} dx={8} domain={[0,5]}/>
                <Tooltip/>
                <Line yAxisId="left" type="monotone" dataKey="reviews" stroke="#0E7C86" strokeWidth={2.5} dot={{fill:'#0E7C86',r:3}} fill="#0E7C86" fillOpacity={0.1}/>
                <Line yAxisId="right" type="monotone" dataKey="rating" stroke="#10B981" strokeWidth={2.5} dot={{fill:'#10B981',r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col items-center" style={{height:380}}>
          <h3 className="text-base font-bold text-[#10242A] mb-4 self-start">Rating Distribution</h3>
          <div className="relative flex items-center justify-center mb-4" style={{width:150,height:150}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.ratingData} innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                  {stats.ratingData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xl font-bold text-[#10242A]">{stats.total.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-[#4A5961] uppercase tracking-wider">Total Reviews</p>
            </div>
          </div>
          <div className="w-full space-y-2 mt-auto">
            {stats.ratingData.map(r=>(
              <div key={r.name} className="flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor:r.color}}/><span className="text-[#4A5961]">{r.name}</span></div>
                <span className="text-[#10242A] font-bold">{r.value.toLocaleString()} <span className="text-[#4A5961] font-normal">({r.pct})</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews by Platform */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col items-center" style={{height:380}}>
          <h3 className="text-base font-bold text-[#10242A] mb-4 self-start">Reviews by Platform</h3>
          <div className="relative flex items-center justify-center mb-4" style={{width:150,height:150}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.platformData} innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                  {stats.platformData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xl font-bold text-[#10242A]">{stats.total.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-[#4A5961] uppercase tracking-wider">Total Reviews</p>
            </div>
          </div>
          <div className="w-full space-y-2 mt-auto">
            {stats.platformData.map(p=>(
              <div key={p.name} className="flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor:p.color}}/><span className="text-[#4A5961]">{p.name}</span></div>
                <span className="text-[#10242A] font-bold">{p.value.toLocaleString()} <span className="text-[#4A5961] font-normal">({p.pct})</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLES ROW */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent Reviews */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#10242A]">Recent Reviews</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] text-left">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#4A5961] font-semibold text-[11px] uppercase tracking-wider border-b border-[#E1E6EA]">
                  <th className="py-2.5 px-3">Reviewer</th>
                  <th className="py-2.5 px-3">Property</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Review</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6EA]">
                {stats.recentReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#4A5961] text-xs font-medium">No reviews found.</td>
                  </tr>
                ) : stats.recentReviews.map((r,i)=>(
                  <tr key={i} className="hover:bg-[#F4F6F8]/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-[10px] shrink-0">{(r.reviewer || "G").split(' ').map(n=>n[0]).join('')}</div>
                        <span className="font-bold text-[#10242A] whitespace-nowrap">{r.reviewer}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#4A5961]"><div className="font-semibold text-[#10242A] text-[11px]">{r.property}</div><div className="text-[#4A5961] text-[10px]">{r.loc}</div></td>
                    <td className="py-2.5 px-3"><Stars count={r.rating} size={10}/></td>
                    <td className="py-2.5 px-3 text-[#4A5961] max-w-[150px] truncate">{r.review}</td>
                    <td className="py-2.5 px-3 text-[#4A5961] whitespace-nowrap text-[10px]">{r.date}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={cn("px-2 py-0.5 rounded-[6px] text-[10px] font-bold", r.status === "Published" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-[#E6F4F5] text-[#0E7C86] border border-[#0E7C86]/20")}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Rated Properties */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#10242A]">Top Rated Properties</h3>
          </div>
          <div className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider grid grid-cols-12 gap-2 mb-2 bg-[#F8FAFC] p-2 rounded-[8px] border border-[#E1E6EA]">
            <span className="col-span-5">Property</span>
            <span className="col-span-2">Location</span>
            <span className="col-span-3 text-center">Avg. Rating</span>
            <span className="col-span-2 text-right">Reviews</span>
          </div>
          <div className="space-y-3 flex-1">
            {stats.topProperties.length === 0 ? (
              <div className="py-8 text-center text-[#4A5961] text-xs font-medium">No rated properties found.</div>
            ) : stats.topProperties.map((p,i)=>(
              <div key={i} className="grid grid-cols-12 gap-2 items-center p-1.5 hover:bg-[#F4F6F8] rounded-[8px] transition-colors">
                <div className="col-span-5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[8px] bg-[#E6F4F5] flex items-center justify-center shrink-0"><Building2 size={13} className="text-[#0E7C86]"/></div>
                  <span className="text-[11.5px] font-bold text-[#10242A] truncate">{p.name}</span>
                </div>
                <span className="col-span-2 text-[10.5px] text-[#4A5961] font-medium">{p.loc}</span>
                <div className="col-span-3 flex flex-col items-center gap-0.5">
                  <span className="text-[11.5px] font-bold text-[#10242A]">{p.rating}</span>
                  <Stars count={Math.floor(p.rating)} size={9}/>
                </div>
                <span className="col-span-2 text-right text-[11.5px] font-bold text-[#0E7C86]">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER ROW: 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reviews by Sentiment */}
        <div className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs">
          <h4 className="text-[12px] font-bold text-[#10242A] mb-3">Reviews by Sentiment</h4>
          <div className="flex items-center gap-3">
            <div style={{width:75,height:75}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.sentimentData} innerRadius={22} outerRadius={34} paddingAngle={3} dataKey="value" stroke="none">
                    {stats.sentimentData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {stats.sentimentData.map(s=>(
                <div key={s.name} className="flex justify-between items-center text-[10.5px] font-semibold">
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:s.color}}/><span className="text-[#4A5961]">{s.name}</span></div>
                  <div className="text-right"><div className="text-[#10242A] font-bold">{s.value.toLocaleString()}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* New Reviews Summary */}
        <div className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs">
          <h4 className="text-[12px] font-bold text-[#10242A] mb-3">New Reviews Summary</h4>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            {[{p:"Today",v:String(stats.countToday),t:"Live"},{p:"This Week",v:String(stats.countWeek),t:"7d"},{p:"This Month",v:String(stats.countMonth),t:"30d"}].map(s=>(
              <div key={s.p}>
                <p className="text-[9px] font-bold text-[#4A5961] uppercase tracking-wider mb-0.5">{s.p}</p>
                <p className="text-base font-bold text-[#10242A] leading-none">{s.v}</p>
                <p className="text-[9px] font-bold text-emerald-600 mt-0.5">{s.t}</p>
              </div>
            ))}
          </div>
          <div style={{height:35}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sparkData}><Area type="monotone" dataKey="v" stroke="#0E7C86" fill="#E6F4F5" strokeWidth={1.5}/></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Moderation Summary */}
        <div className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs">
          <h4 className="text-[12px] font-bold text-[#10242A] mb-3">Moderation Summary</h4>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            {[{l:"Pending",v:String(stats.pending),c:"text-amber-600"},{l:"Approved",v:String(stats.approved),c:"text-emerald-600"},{l:"Rejected",v:String(stats.rejected),c:"text-rose-600"}].map(s=>(
              <div key={s.l} className="flex flex-col items-center">
                <span className={cn("text-xl font-bold mb-0.5", s.c)}>{s.v}</span>
                <span className="text-[9px] font-bold text-[#4A5961] uppercase tracking-wider">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-[16px] p-5 border border-[#E1E6EA] shadow-xs">
          <h4 className="text-[12px] font-bold text-[#10242A] mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {["View All Reviews","Moderation Queue","Review Analytics","Add New Review"].map(a=>(
              <button key={a} className="bg-[#F4F6F8] hover:bg-[#E6F4F5] hover:text-[#0E7C86] border border-[#E1E6EA] text-[#4A5961] rounded-[8px] py-2 px-1.5 text-[10px] font-bold transition-all text-center leading-tight">{a}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
