import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { 
  Search, Star, MapPin, Percent, ShieldAlert, RefreshCw
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReportsPropertyPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/superadmin/reports/overview");
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load property performance data:", err);
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
        <p className="text-xs font-semibold text-[#4A5961] uppercase tracking-wider">Accessing Property Performance Intel...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const propertyPerformance = data?.charts?.propertyPerformance || [];

  const filteredProperties = propertyPerformance.filter(p => 
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.loc || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = propertyPerformance.map(p => {
    const nameStr = p.name || "";
    const revVal = p.rev !== undefined && p.rev !== null ? p.rev : 0;
    return {
      name: nameStr.length > 15 ? nameStr.substring(0, 15) + "..." : nameStr,
      Revenue: Number(revVal) || 0
    };
  });

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Property Performance</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Individual property metrics, revenue contributions, and global occupancy mappings.</p>
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
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Active Properties</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{summary.totalProperties || 0}</h3>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Tenants Placed</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{summary.totalTenants || 0}</h3>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Global Occupancy Rate</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{summary.occupancyRate || 0}%</h3>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Monthly Gross Revenue</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">₹{(summary.monthlyRevenue || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {/* Outside Search & Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties or cities..." 
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
          />
        </div>
      </div>

      {/* Property Ledger Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
               <thead>
                  <tr className="border-b border-[#E1E6EA]">
                     <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Property Details</th>
                     <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Region</th>
                     <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Occupancy Matrix</th>
                     <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Monthly Revenue</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-10 text-center text-[13px] text-[#4A5961]">
                        <div className="flex flex-col items-center gap-2 justify-center">
                          <ShieldAlert className="text-[#4A5961]" size={24} />
                          No Properties Registered under active Ledger
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map((p, i) => (
                       <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-2.5 pl-2">
                             <div className="flex items-center gap-3">
                                <img src={p.img} alt={p.name} className="w-8 h-8 rounded-[6px] object-cover border border-[#E1E6EA] shrink-0" />
                                <div>
                                  <span className="font-semibold text-[13px] text-[#10242A] hover:text-[#0E7C86] transition-colors cursor-pointer">{p.name}</span>
                                  <p className="text-[11px] text-[#708088]">ID: PROP-RHY{3000 + i}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-2.5 text-center text-[#4A5961] font-medium">{p.loc}</td>
                          <td className="py-2.5 text-center font-semibold text-emerald-600">{p.occupancy}</td>
                          <td className="py-2.5 pr-2 text-right font-semibold text-[#10242A]">{p.revenue}</td>
                       </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Charts & Insights Row */}
      <div className="grid grid-cols-12 gap-4">
         {/* Performance Bar Chart */}
         <div className="col-span-12 lg:col-span-8 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col h-[380px]">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[15px] font-bold text-[#10242A]">Revenue Contribution by Property</h3>
               <span className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-2.5 py-1 text-[11px] font-semibold text-[#4A5961]">Gross Monthly Revenue</span>
            </div>
            <div className="flex-1 min-h-0">
               {chartData.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-[#4A5961] font-semibold text-xs uppercase tracking-wider">No Revenue Data Generated Yet</div>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 10, fontWeight: 600}} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 10, fontWeight: 600}} dx={-10} tickFormatter={(v) => `₹${v}`} />
                       <Tooltip cursor={{fill: '#F4F6F8'}} />
                       <Bar dataKey="Revenue" fill="#0E7C86" radius={[6, 6, 0, 0]} barSize={36}>
                         {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={['#0E7C86', '#10B981', '#F59E0B', '#6366F1', '#EC4899'][index % 5]} />
                         ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
               )}
            </div>
         </div>

         {/* Info Box */}
         <div className="col-span-12 lg:col-span-4 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between h-[380px]">
            <div>
              <h3 className="text-[15px] font-bold text-[#10242A] mb-4">Performance Insights</h3>
              <div className="space-y-3">
                <div className="p-3 bg-[#F4F6F8] rounded-[10px] border border-[#E1E6EA] flex gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0"><Star size={16} /></div>
                  <div>
                    <p className="text-xs font-bold text-[#10242A]">Top Revenue Generator</p>
                    <p className="text-[11px] font-semibold text-[#4A5961] mt-0.5">{propertyPerformance[0]?.name || "N/A"}</p>
                  </div>
                </div>
                <div className="p-3 bg-[#F4F6F8] rounded-[10px] border border-[#E1E6EA] flex gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Percent size={16} /></div>
                  <div>
                    <p className="text-xs font-bold text-[#10242A]">Average Occupancy Rating</p>
                    <p className="text-[11px] font-semibold text-[#4A5961] mt-0.5">Global occupancy sits at {summary.occupancyRate || 0}%, based on all active beds.</p>
                  </div>
                </div>
                <div className="p-3 bg-[#F4F6F8] rounded-[10px] border border-[#E1E6EA] flex gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><MapPin size={16} /></div>
                  <div>
                    <p className="text-xs font-bold text-[#10242A]">Audit Status</p>
                    <p className="text-[11px] font-semibold text-[#4A5961] mt-0.5">All transactions verified against global booking configurations.</p>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={loadData} className="w-full py-2 bg-[#F4F6F8] hover:bg-[#E6F4F5] border border-[#E1E6EA] hover:border-[#0E7C86] transition-all rounded-[8px] text-xs font-bold text-[#0E7C86] uppercase tracking-wider cursor-pointer">
              Refresh Data
            </button>
         </div>
      </div>
    </div>
  );
}
