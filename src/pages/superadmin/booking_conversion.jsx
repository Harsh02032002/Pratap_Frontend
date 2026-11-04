import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { fetchJson } from "../../utils/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const cn = (...c) => c.filter(Boolean).join(" ");

export default function BookingConversionRate() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/booking/conversion-stats");
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Error loading conversion stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const csv = [
      ["Stage / Metric", "Value"],
      ...data.funnel.map(f => [f.label, `${f.val} (pct: ${f.pct}%)`]),
      ["Overall Conversion Rate", data.metrics.overallRate],
      ["Direct Booking Rate", data.metrics.directRate],
      ["Online Request Rate", data.metrics.onlineRate],
      ["Avg Time to Convert", data.metrics.avgTime]
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); 
    a.href = URL.createObjectURL(blob); 
    a.download = "conversion_stats.csv"; 
    a.click();
  };

  const hasData = data && data.funnel && data.funnel.length > 0 && data.funnel[0].val > 0;

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Conversion Rate Analysis</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Track lead-to-booking conversion across all stages.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-white text-[#4A5961] border border-[#CBD3D9] px-3 py-1.5 rounded-[8px] text-[13px] font-medium shadow-xs shrink-0">
            Source: Leads + Bookings
          </span>
          <button onClick={handleExport} className="bg-white border border-[#CBD3D9] text-[#10242A] px-4 py-1.5 rounded-[8px] text-[13px] font-semibold flex items-center gap-2 hover:bg-gray-50 shadow-xs transition-all cursor-pointer">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#4A5961] font-semibold text-[13px]">Loading conversion statistics...</div>
      ) : !hasData ? (
        <div className="bg-white rounded-[12px] p-8 border border-[#E1E6EA] shadow-xs text-center text-[#4A5961] font-semibold flex flex-col items-center justify-center gap-1">
          <span>No Data Available</span>
          <span className="text-[12px] font-normal text-[#708088]">Please register properties, capture leads, or record booking requests to build the conversion metrics.</span>
        </div>
      ) : (
        <>
          {/* KPI Cards (No Icons) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Lead → Booking Rate",      val: data.metrics.overallRate, sub: "Source: Leads + Bookings" },
              { label: "Direct Booking Conversion", val: data.metrics.directRate,  sub: "Source: Bookings" },
              { label: "Online Request Conversion", val: data.metrics.onlineRate,  sub: "Source: Bookings" },
              { label: "Avg. Time to Convert",      val: data.metrics.avgTime,     sub: "Source: Leads + Bookings" },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
                <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{c.label}</p>
                <div className="mt-2">
                  <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{c.val}</h3>
                  <p className="text-[11px] text-[#708088] mt-1">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Funnel + Monthly Trend */}
          <div className="grid grid-cols-12 gap-4">
            {/* Visual Funnel */}
            <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs col-span-12 lg:col-span-5 flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#10242A] mb-4">Lead Conversion Funnel</h3>
                <div className="space-y-3">
                  {data.funnel.map((f, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-[#4A5961]">{f.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[12px] font-bold text-[#10242A]">{f.val.toLocaleString()}</span>
                          <span className="text-[11px] font-semibold text-[#708088]">{f.pct}%</span>
                        </div>
                      </div>
                      <div className="h-7 bg-[#F4F6F8] rounded-[8px] overflow-hidden flex items-center">
                        <div
                          className="h-full rounded-[8px] flex items-center justify-end pr-3 transition-all duration-700"
                          style={{ width: `${Math.max(f.pct, 5)}%`, backgroundColor: f.color }}
                        />
                      </div>
                      {f.drop && (
                        <p className="text-[10px] text-rose-500 font-semibold mt-0.5 text-right">↓ {f.drop}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mt-4 pt-3 border-t border-[#E1E6EA] flex justify-between items-center">
                  <span className="text-[12px] font-semibold text-[#4A5961]">Overall Conversion</span>
                  <span className="text-[18px] font-bold text-[#0E7C86]">{data.metrics.overallRate}</span>
                </div>
                <p className="text-[11px] text-[#708088] mt-2">Source: Leads + Bookings</p>
              </div>
            </div>

            {/* Monthly Trend + Side tables */}
            <div className="col-span-12 lg:col-span-7 space-y-4">
              {/* Monthly Conversion Trend */}
              <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs">
                <h3 className="text-[15px] font-bold text-[#10242A] mb-3">Monthly Conversion Trend</h3>
                <div style={{ height: 180 }}>
                  {data.monthlyTrend && data.monthlyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.monthlyTrend}>
                        <defs>
                          <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0E7C86" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#0E7C86" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA"/>
                        <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}} tickFormatter={v=>`${v}%`}/>
                        <Tooltip formatter={v => [`${v}%`, "Conversion Rate"]}/>
                        <Area type="monotone" dataKey="conv" stroke="#0E7C86" strokeWidth={2.5} fill="url(#convGrad)" dot={{fill:'#0E7C86',r:3}}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[#4A5961] text-[13px]">No Data Available</div>
                  )}
                </div>
                <p className="text-[11px] text-[#708088] mt-2">Source: Leads + Bookings</p>
              </div>

              {/* Property + Location Conversion Tables side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden flex flex-col justify-between">
                  <div>
                    <h4 className="text-[14px] font-bold text-[#10242A] mb-3">Top Properties by Conversion</h4>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E1E6EA]">
                          <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-1">Property</th>
                          <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-1">Conv. Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                        {data.propertyConv.length === 0 ? (
                          <tr><td colSpan="2" className="py-6 text-center text-[#4A5961]">No Data Available</td></tr>
                        ) : data.propertyConv.map((p, i) => (
                          <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="py-2.5 pl-1 font-medium text-[#10242A] truncate max-w-[140px]">{p.name}</td>
                            <td className="py-2.5 pr-1 text-right font-semibold text-[#0E7C86]">{p.rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-[#708088] mt-3">Source: Leads + Bookings</p>
                </div>

                <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden flex flex-col justify-between">
                  <div>
                    <h4 className="text-[14px] font-bold text-[#10242A] mb-3">Top Locations by Conversion</h4>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E1E6EA]">
                          <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-1">Location</th>
                          <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-1">Conv. Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                        {data.locationConv.length === 0 ? (
                          <tr><td colSpan="2" className="py-6 text-center text-[#4A5961]">No Data Available</td></tr>
                        ) : data.locationConv.map((l, i) => (
                          <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="py-2.5 pl-1 font-medium text-[#10242A] truncate max-w-[140px]">{l.loc}</td>
                            <td className="py-2.5 pr-1 text-right font-semibold text-emerald-600">{l.rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-[#708088] mt-3">Source: Leads + Bookings</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
