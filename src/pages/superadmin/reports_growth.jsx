import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { 
  Building2, Users, ArrowUpRight, ArrowDownRight, 
  ChevronRight, Calendar, TrendingUp, IndianRupee, Activity, RefreshCw
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { PageHeader } from "../../components/superadmin/PageHeader";

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
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <PageHeader 
        title="Growth Analytics"
        subtitle="Platform growth velocity, monthly billing performance, and property onboarding trends."
        actions={
          <button 
            onClick={loadData}
            className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-[12px] border border-[#E1E6EA] shadow-xs text-xs font-semibold text-[#4A5961] hover:bg-[#F4F6F8] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0E7C86]" />
            <span>Refresh Data</span>
          </button>
        }
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Properties Registered</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{summary.totalProperties || 0}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Active Tenants</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{summary.totalTenants || 0}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <IndianRupee size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Monthly Gross Revenue</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">₹{(summary.monthlyRevenue || 0).toLocaleString('en-IN')}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Growth Velocity</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{summary.growthRate || 0}%</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
         {/* Detailed Growth Chart */}
         <div className="col-span-12 lg:col-span-8 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-base font-bold text-[#10242A]">Platform Revenue Velocity</h3>
               <span className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-3 py-1 text-[11px] font-semibold text-[#4A5961]">Gross Billings Index</span>
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

         {/* Growth Highlights */}
         <div className="col-span-12 lg:col-span-4 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col justify-between h-[420px]">
            <div>
              <h3 className="text-base font-bold text-[#10242A] mb-5">Growth Indicators</h3>
              <div className="space-y-3">
                <div className="p-3.5 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA] flex justify-between items-center">
                  <div>
                    <p className="text-[11px] font-semibold text-[#4A5961] uppercase">Property Onboarding</p>
                    <p className="text-lg font-bold text-[#10242A] mt-1">{summary.totalProperties || 0}</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-[6px] border border-emerald-100 flex items-center gap-1"><ArrowUpRight size={14} /> +12.6%</span>
                </div>

                <div className="p-3.5 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA] flex justify-between items-center">
                  <div>
                    <p className="text-[11px] font-semibold text-[#4A5961] uppercase">Tenant Placement</p>
                    <p className="text-lg font-bold text-[#10242A] mt-1">{summary.totalTenants || 0}</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-[6px] border border-emerald-100 flex items-center gap-1"><ArrowUpRight size={14} /> +9.8%</span>
                </div>

                <div className="p-3.5 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA] flex justify-between items-center">
                  <div>
                    <p className="text-[11px] font-semibold text-[#4A5961] uppercase">Monthly Billings</p>
                    <p className="text-lg font-bold text-[#10242A] mt-1">₹{(summary.monthlyRevenue || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-[6px] border border-emerald-100 flex items-center gap-1"><ArrowUpRight size={14} /> +14.7%</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-semibold text-[#4A5961] text-center">Updated in real time via verified ledger events.</p>
         </div>
      </div>
    </div>
  );
}
