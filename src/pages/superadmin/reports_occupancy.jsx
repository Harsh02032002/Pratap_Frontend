import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { RefreshCw } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReportsOccupancy() {
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
      console.error("Failed to load occupancy rate data:", err);
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
        <p className="text-xs font-semibold text-[#4A5961] uppercase tracking-wider">Accessing Occupancy Analytics...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const occupancyData = data?.charts?.occupancyData || [];
  const hasOccupancyData = occupancyData.length > 0 && occupancyData.some(d => d.value > 0);

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Occupancy Rate</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Real-time bed allocation breakdown, active tenant density, and platform occupancy matrix.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Rooms Active</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{summary.totalRooms || 0} Rooms</h3>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Total Checked-In Tenants</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{summary.totalTenants || 0} Tenants</h3>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Platform Occupancy Rate</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{summary.occupancyRate || 0}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
         {/* Occupancy Donut Chart */}
         <div className="col-span-12 lg:col-span-6 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col items-center justify-center h-[380px]">
            <div className="flex items-center justify-between w-full mb-4">
               <h3 className="text-[15px] font-bold text-[#10242A]">Bed Allocation Breakdown</h3>
               <span className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-2.5 py-1 text-[11px] font-semibold text-[#4A5961]">Real-Time Distribution</span>
            </div>
            <div className="relative h-56 w-56 flex items-center justify-center my-auto">
               {!hasOccupancyData ? (
                 <div className="text-[#4A5961] font-semibold uppercase tracking-wider text-xs">No Occupancy Data Available</div>
               ) : (
                 <>
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={occupancyData} innerRadius={70} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                            {occupancyData.map((e, idx) => <Cell key={idx} fill={e.color || '#0E7C86'} />)}
                         </Pie>
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-3xl font-bold text-[#10242A]">{summary.occupancyRate}%</p>
                      <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider mt-0.5">Occupancy</p>
                   </div>
                 </>
               )}
            </div>
         </div>

         {/* Occupancy Metrics Breakdown Table Card */}
         <div className="col-span-12 lg:col-span-6 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden flex flex-col justify-between h-[380px]">
            <div>
              <h3 className="text-[15px] font-bold text-[#10242A] mb-3">Status Ledger</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E1E6EA]">
                      <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Status</th>
                      <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Beds</th>
                      <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                    {occupancyData.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-8 text-center text-[13px] text-[#4A5961]">No Metrics Seeded</td>
                      </tr>
                    ) : (
                      occupancyData.map((item) => (
                        <tr key={item.name} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-2.5 pl-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                              <span className="font-semibold text-[#10242A] capitalize">{item.name} status</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-[#10242A]">{item.value?.toLocaleString()} Beds</td>
                          <td className="py-2.5 pr-2 text-right text-[#4A5961]">{item.percent}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <button onClick={loadData} className="w-full py-2 mt-4 bg-[#F4F6F8] hover:bg-[#E6F4F5] border border-[#E1E6EA] hover:border-[#0E7C86] transition-all rounded-[8px] text-xs font-bold text-[#0E7C86] uppercase tracking-wider cursor-pointer">
              Re-evaluate Room Allocation
            </button>
         </div>
      </div>
    </div>
  );
}
