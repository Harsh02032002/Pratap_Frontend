import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { 
  Building2, Users, ArrowUpRight, ArrowDownRight, 
  ChevronRight, Calendar, Percent, Bed, ShieldAlert, RefreshCw
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PageHeader } from "../../components/superadmin/PageHeader";

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
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <PageHeader 
        title="Occupancy Rate"
        subtitle="Real-time bed allocation breakdown, active tenant density, and platform occupancy matrix."
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
            <Bed size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Total Rooms Active</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{summary.totalRooms || 0} Rooms</h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Total Checked-In Tenants</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{summary.totalTenants || 0} Tenants</h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Percent size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Platform Occupancy Rate</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{summary.occupancyRate || 0}%</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
         {/* Occupancy Donut Chart */}
         <div className="col-span-12 lg:col-span-6 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col items-center justify-center h-[420px]">
            <div className="flex items-center justify-between w-full mb-6">
               <h3 className="text-base font-bold text-[#10242A]">Bed Allocation Breakdown</h3>
               <span className="bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] px-3 py-1 text-[11px] font-semibold text-[#4A5961]">Real-Time Distribution</span>
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

         {/* Occupancy Metrics Breakdown Table */}
         <div className="col-span-12 lg:col-span-6 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col justify-between h-[420px]">
            <h3 className="text-base font-bold text-[#10242A] mb-4">Status Ledger</h3>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
               {occupancyData.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-[#4A5961] font-semibold uppercase tracking-wider text-xs py-20">No Metrics Seeded</div>
               ) : (
                 occupancyData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3.5 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA] hover:border-[#0E7C86] transition-all">
                       <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                          <span className="text-xs font-bold text-[#10242A] capitalize">{item.name} status</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#10242A]">{item.value?.toLocaleString()} Beds</span>
                          <span className="text-[11px] font-semibold text-[#4A5961]">({item.percent})</span>
                       </div>
                    </div>
                 ))
               )}
            </div>
            <button onClick={loadData} className="w-full py-2.5 mt-4 bg-[#F4F6F8] hover:bg-[#E6F4F5] border border-[#E1E6EA] hover:border-[#0E7C86] transition-all rounded-[10px] text-xs font-bold text-[#0E7C86] uppercase tracking-wider cursor-pointer">
              Re-evaluate Room Allocation
            </button>
         </div>
      </div>
    </div>
  );
}
