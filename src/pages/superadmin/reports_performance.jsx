import React, { useState, useEffect } from "react";
import { 
  Users, Search, Zap, Award, Activity, RefreshCw,
  Download, CheckCircle2, ShieldAlert
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReportsPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useSEO({
    title: "Staff Performance Reports - Roomhy Superadmin",
    description: "Track and audit employee visits, tasks, and submission logs.",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/superadmin/reports/overview");
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load staff performance data:", err);
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
        <p className="text-xs font-semibold text-[#4A5961] uppercase tracking-wider">Accessing Staff Performance Intel...</p>
      </div>
    );
  }

  const staffPerformance = data?.charts?.staffPerformance || [];
  const visitsCreated = data?.summary?.visitsCreated || 0;

  const filteredStaff = staffPerformance.filter(s => 
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalApproved = staffPerformance.reduce((acc, curr) => acc + (curr.resolved || 0), 0);
  const topPerformer = staffPerformance[0]?.name || "N/A";
  const activeStaffCount = staffPerformance.length;

  const exportCSV = () => {
    if (!filteredStaff.length) return;
    const headers = "Staff Name,Role,Total Visits,Approved Visits,Performance Score,Status\n";
    const rows = filteredStaff.map(s => 
      `"${s.name}","${s.role}",${s.tasks || 0},${s.resolved || 0},"${s.score}","${s.status}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Staff_Performance_Report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <PageHeader 
        title="Staff Performance Reports"
        subtitle="Track and monitor staff tasks, property visits, and field submission logs."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-[12px] border border-[#E1E6EA] shadow-xs text-xs font-semibold text-[#4A5961] hover:bg-[#F4F6F8] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#0E7C86]" />
              <span>Refresh Data</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-[#0E7C86] hover:bg-[#0B656D] text-white px-4 py-2 rounded-[12px] text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        }
      />

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Visits Submitted</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{visitsCreated}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Approved Visits</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{totalApproved}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Award size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Top Staff Member</p>
            <h4 className="text-xl font-bold text-[#10242A] mt-0.5 truncate max-w-[150px]">{topPerformer}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[16px] border border-[#E1E6EA] shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-[12px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Active Staff</p>
            <h4 className="text-2xl font-bold text-[#10242A] mt-0.5">{activeStaffCount}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
         {/* Efficiency Scorecard / Leaderboard */}
         <div className="col-span-12 lg:col-span-4 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <div>
               <h3 className="text-base font-bold text-[#10242A] mb-5">Top Performing Staff</h3>
               <div className="space-y-4">
                  {staffPerformance.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA]">
                       <div className="w-9 h-9 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] font-bold text-xs flex items-center justify-center shrink-0">
                          {s.name ? s.name.split(' ').map(n => n[0]).join('') : "ST"}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                             <p className="text-xs font-bold text-[#10242A] truncate">{s.name}</p>
                             <p className="text-xs font-bold text-[#0E7C86]">{s.score}</p>
                          </div>
                          <div className="mt-1.5 w-full h-1.5 bg-[#E1E6EA] rounded-full overflow-hidden">
                             <div 
                                className="h-full rounded-full bg-[#0E7C86] transition-all duration-500" 
                                style={{ width: s.score }} 
                             />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Staff Performance & Visit Logs Table */}
         <div className="col-span-12 lg:col-span-8 bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
               <div>
                  <h3 className="text-base font-bold text-[#10242A]">Staff Performance & Visit Logs</h3>
                  <p className="text-[11px] font-semibold text-[#4A5961] mt-0.5">Field tasks and property verification records</p>
               </div>
               <div className="relative w-full sm:w-64">
                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5961]" />
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder="Search staff or role..."
                   className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[8px] py-2 pl-10 pr-4 text-xs font-medium text-[#10242A] outline-none focus:border-[#0E7C86] transition-all placeholder:text-[#4A5961]"
                 />
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-[#F4F6F8] text-[11px] font-bold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
                        <th className="py-3 px-4 font-bold">Staff Member</th>
                        <th className="py-3 px-4 font-bold">Role</th>
                        <th className="text-center py-3 px-4 font-bold">Visits</th>
                        <th className="text-center py-3 px-4 font-bold">Approved</th>
                        <th className="text-center py-3 px-4 font-bold">Score</th>
                        <th className="text-center py-3 px-4 font-bold">Rank</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6EA]">
                     {filteredStaff.length === 0 ? (
                       <tr>
                         <td colSpan={6} className="py-12 text-center text-xs font-semibold text-[#4A5961] uppercase tracking-wider">
                           No staff performance logs found
                         </td>
                       </tr>
                     ) : filteredStaff.map((s, i) => (
                       <tr key={i} className="hover:bg-[#F4F6F8] transition-colors">
                          <td className="py-3 px-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-xs">
                                   {s.name ? s.name.split(' ').map(n => n[0]).join('') : "ST"}
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-[#10242A]">{s.name}</p>
                                   <p className="text-[11px] font-medium text-[#4A5961] mt-0.5">STF-0{i+101}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-[#4A5961]">
                             {s.role}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-[#10242A] text-xs">{s.tasks}</td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600 text-xs">{s.resolved}</td>
                          <td className="py-3 px-4 text-center font-bold text-[#0E7C86] text-xs">
                             {s.score}
                          </td>
                          <td className="py-3 px-4 text-center">
                             <span className={cn(
                               "text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase",
                               s.status === "Elite" ? "bg-purple-50 text-purple-600 border-purple-100" : 
                               s.status === "Excellent" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               "bg-[#F4F6F8] text-[#4A5961] border-[#E1E6EA]"
                             )}>
                                {s.status}
                             </span>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
