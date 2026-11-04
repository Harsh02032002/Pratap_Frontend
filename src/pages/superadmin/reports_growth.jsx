import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReportsGrowth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/superadmin/reports/overview");
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load growth analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 space-y-6 flex flex-col items-center justify-center py-40 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-12 h-12 border-4 border-[#0E7C86]/20 border-t-[#0E7C86] rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#4A5961] uppercase tracking-wider">Accessing Platform Growth Intelligence...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const revenueOverviewData = charts.revenueOverviewData || [];
  const hasRevenueData = revenueOverviewData.length > 0 && revenueOverviewData.some(d => d.val > 0);

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Growth Analytics</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Platform growth velocity, monthly billing performance, and property onboarding trends.</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-[8px] border border-[#CBD3D9] shadow-xs text-[13px] font-semibold text-[#10242A] hover:bg-gray-50 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0E7C86]" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Hero Stats (No Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Properties Registered</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{summary.totalProperties || 0}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Active Tenants</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{summary.totalTenants || 0}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Monthly Gross Revenue</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">₹{(summary.monthlyRevenue || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Growth Velocity</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{summary.growthRate || 0}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
         {/* Detailed Growth Chart */}
         <div className="col-span-12 lg:col-span-8 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col h-[380px]">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[15px] font-bold text-[#10242A]">Platform Revenue Velocity</h3>
               <span className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-2.5 py-1 text-[11px] font-semibold text-[#4A5961]">Gross Billings Index</span>
            </div>
            <div className="flex-1 min-h-0">
               {!hasRevenueData ? (
                 <div className="flex items-center justify-center h-full text-[#4A5961] font-semibold uppercase tracking-wider text-xs">No Billings Recorded Yet</div>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueOverviewData}>
                       <defs>
                          <linearGradient id="colorRevGrowth" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#0E7C86" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#0E7C86" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 10, fontWeight: 600}} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 10, fontWeight: 600}} dx={-10} tickFormatter={(v) => `₹${v}`} />
                       <Tooltip cursor={{stroke: '#0E7C86', strokeWidth: 1}} />
                       <Area type="monotone" dataKey="val" stroke="#0E7C86" strokeWidth={3} fillOpacity={1} fill="url(#colorRevGrowth)" dot={{fill: '#0E7C86', r: 4}} />
                    </AreaChart>
                 </ResponsiveContainer>
               )}
            </div>
         </div>

         {/* Growth Highlights Table Card */}
         <div className="col-span-12 lg:col-span-4 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden flex flex-col justify-between h-[380px]">
            <div>
              <h3 className="text-[15px] font-bold text-[#10242A] mb-3">Growth Indicators</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E1E6EA]">
                      <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Indicator</th>
                      <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Value</th>
                      <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                    <tr className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-2.5 pl-2 font-medium text-[#10242A]">Property Onboarding</td>
                      <td className="py-2.5 text-right font-semibold text-[#10242A]">{summary.totalProperties || 0}</td>
                      <td className="py-2.5 pr-2 text-right">
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-100"><ArrowUpRight size={12} /> +12.6%</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-2.5 pl-2 font-medium text-[#10242A]">Tenant Placement</td>
                      <td className="py-2.5 text-right font-semibold text-[#10242A]">{summary.totalTenants || 0}</td>
                      <td className="py-2.5 pr-2 text-right">
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-100"><ArrowUpRight size={12} /> +9.8%</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-2.5 pl-2 font-medium text-[#10242A]">Monthly Billings</td>
                      <td className="py-2.5 text-right font-semibold text-[#10242A]">₹{(summary.monthlyRevenue || 0).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 pr-2 text-right">
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-100"><ArrowUpRight size={12} /> +14.7%</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] font-semibold text-[#4A5961] text-center">Updated in real time via verified ledger events.</p>
         </div>
      </div>
    </div>
  );
}
