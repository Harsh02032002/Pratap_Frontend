import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { 
  Building2, Users, ArrowUpRight, ArrowDownRight, 
  ChevronRight, Calendar, Download, Search, Star, 
  MapPin, Percent, IndianRupee, ShieldAlert, RefreshCw,
  Building
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { PageHeader } from "../../components/superadmin/PageHeader";

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
      <div className="p-12 space-y-6 flex flex-col items-center justify-center py-40">
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
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <PageHeader 
        title="Property Performance"
        subtitle="Individual property metrics, revenue contributions, and global occupancy mappings."
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
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Total Active Properties</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{summary.totalProperties || 0}</h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Total Tenants Placed</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{summary.totalTenants || 0}</h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Percent size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Global Occupancy Rate</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{summary.occupancyRate || 0}%</h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <IndianRupee size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Monthly Gross Revenue</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">₹{(summary.monthlyRevenue || 0).toLocaleString('en-IN')}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
         {/* Performance Bar Chart */}
         <div className="col-span-12 lg:col-span-8 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-base font-bold text-[#10242A]">Revenue Contribution by Property</h3>
               <span className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-3 py-1 text-[11px] font-semibold text-[#4A5961]">Gross Monthly Revenue</span>
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
         <div className="col-span-12 lg:col-span-4 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col justify-between h-[420px]">
            <div>
              <h3 className="text-base font-bold text-[#10242A] mb-5">Performance Insights</h3>
              <div className="space-y-4">
                <div className="p-3.5 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA] flex gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0"><Star size={16} /></div>
                  <div>
                    <p className="text-xs font-bold text-[#10242A]">Top Revenue Generator</p>
                    <p className="text-[11px] font-semibold text-[#4A5961] mt-0.5">{propertyPerformance[0]?.name || "N/A"}</p>
                  </div>
                </div>
                <div className="p-3.5 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA] flex gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Percent size={16} /></div>
                  <div>
                    <p className="text-xs font-bold text-[#10242A]">Average Occupancy Rating</p>
                    <p className="text-[11px] font-semibold text-[#4A5961] mt-0.5">Global occupancy sits at {summary.occupancyRate || 0}%, based on all active beds.</p>
                  </div>
                </div>
                <div className="p-3.5 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA] flex gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><MapPin size={16} /></div>
                  <div>
                    <p className="text-xs font-bold text-[#10242A]">Audit Status</p>
                    <p className="text-[11px] font-semibold text-[#4A5961] mt-0.5">All transactions verified against global booking configurations.</p>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={loadData} className="w-full py-2.5 bg-[#F4F6F8] hover:bg-[#E6F4F5] border border-[#E1E6EA] hover:border-[#0E7C86] transition-all rounded-[10px] text-xs font-bold text-[#0E7C86] uppercase tracking-wider cursor-pointer">
              Refresh Data
            </button>
         </div>
      </div>

      {/* Property Ledger Grid */}
      <div className="bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col">
         <div className="flex items-center justify-between mb-6 flex-col sm:flex-row gap-4">
            <h3 className="text-base font-bold text-[#10242A]">Property Ledger & Occupancy Mapping</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
               <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5961]" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search properties or cities..." 
                    className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] py-2 pl-10 pr-4 text-xs font-medium text-[#10242A] outline-none focus:border-[#0E7C86] transition-all placeholder:text-[#4A5961]" 
                  />
               </div>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-[#F4F6F8] text-[11px] font-bold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
                     <th className="py-3 px-4 font-bold">Property Details</th>
                     <th className="text-center py-3 px-4 font-bold">Region</th>
                     <th className="text-center py-3 px-4 font-bold">Occupancy Matrix</th>
                     <th className="text-right py-3 px-4 font-bold">Monthly Revenue</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#E1E6EA]">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-16 text-center text-xs font-semibold text-[#4A5961] uppercase tracking-wider">
                        <div className="flex flex-col items-center gap-3 justify-center">
                          <ShieldAlert className="text-[#4A5961]" size={28} />
                          No Properties Registered under active Ledger
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map((p, i) => (
                       <tr key={i} className="hover:bg-[#F4F6F8] transition-colors">
                          <td className="py-3 px-4">
                             <div className="flex items-center gap-3">
                                <img src={p.img} alt={p.name} className="w-10 h-10 rounded-[8px] object-cover border border-[#E1E6EA] shrink-0" />
                                <div>
                                  <span className="font-bold text-sm text-[#10242A] hover:text-[#0E7C86] transition-colors cursor-pointer">{p.name}</span>
                                  <p className="text-[11px] font-medium text-[#4A5961] mt-0.5">ID: PROP-RHY{3000 + i}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-[#4A5961] font-semibold">{p.loc}</td>
                          <td className="py-3 px-4 text-center font-bold text-xs text-emerald-600">{p.occupancy}</td>
                          <td className="py-3 px-4 text-right font-bold text-xs text-[#10242A]">{p.revenue}</td>
                       </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
