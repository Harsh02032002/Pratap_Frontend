import React, { useState, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import { 
  Building2, Users, ArrowUpRight, ArrowDownRight, 
  ChevronRight, Calendar, PieChart as PieIcon,
  Percent, Bed, ShieldAlert
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

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
      <div className="p-8 space-y-10 bg-[#F8FAFC] min-h-full flex flex-col items-center justify-center py-40">
        <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accessing Occupancy Analytics...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const occupancyData = data?.charts?.occupancyData || [];

  const hasOccupancyData = occupancyData.length > 0 && occupancyData.some(d => d.value > 0);

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-full font-inter text-slate-900">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-8">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Occupancy Rate</h1>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
               <span>Reports & Analytics</span>
               <ChevronRight size={12} className="opacity-50" />
               <span className="text-blue-600">Occupancy Rate</span>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-600">
               <Calendar className="w-4 h-4 text-slate-400" />
               <span>Last 30 Days</span>
            </div>
         </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <Bed size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Rooms Active</p>
            <h4 className="text-xl font-black text-slate-900 mt-1">{summary.totalRooms || 0} Rooms</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Checked-In Tenants</p>
            <h4 className="text-xl font-black text-slate-900 mt-1">{summary.totalTenants || 0} Tenants</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center shadow-sm">
            <Percent size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Occupancy Rate</p>
            <h4 className="text-xl font-black text-slate-900 mt-1">{summary.occupancyRate || 0}%</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
         {/* Occupancy Donut Chart */}
         <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center h-[460px]">
            <div className="flex items-center justify-between w-full mb-8">
               <h3 className="text-lg font-bold text-slate-900">Bed Allocation Breakdown</h3>
               <span className="bg-slate-50 border-none rounded-xl px-4 py-1 text-xs font-bold text-slate-500">Real-Time Distribution</span>
            </div>
            <div className="relative h-56 w-56 flex items-center justify-center mb-8 flex-1">
               {!hasOccupancyData ? (
                 <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Occupancy Data Available</div>
               ) : (
                 <>
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={occupancyData} innerRadius={70} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                            {occupancyData.map((e, idx) => <Cell key={idx} fill={e.color || '#3B82F6'} />)}
                         </Pie>
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-3xl font-black text-slate-900">{summary.occupancyRate}%</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Occupancy Rate</p>
                   </div>
                 </>
               )}
            </div>
         </div>

         {/* Occupancy Metrics Breakdown Table */}
         <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-[460px]">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Status Ledger</h3>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
               {occupancyData.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-xs py-20">No Metrics Seeded</div>
               ) : (
                 occupancyData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:translate-x-1 transition-all">
                       <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{item.name} status</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-950">{item.value?.toLocaleString()} Beds</span>
                          <span className="text-[10px] font-bold text-slate-400">({item.percent})</span>
                       </div>
                    </div>
                 ))
               )}
            </div>
            <button onClick={loadData} className="w-full py-3 mt-4 bg-slate-50 hover:bg-slate-100 transition-all rounded-xl text-xs font-bold text-slate-600 uppercase tracking-widest">
              Re-evaluate Room Allocation
            </button>
         </div>
      </div>
    </div>
  );
}
