import React, { useState, useEffect } from "react";
import { 
  Search, RefreshCw, Download
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ReportsPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const filteredStaff = staffPerformance.filter(s => {
    const matchSearch = (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.role || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || (s.status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Staff Performance Reports</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Track and monitor staff tasks, property visits, and field submission logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-[8px] border border-[#CBD3D9] shadow-xs text-[13px] font-semibold text-[#10242A] hover:bg-gray-50 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0E7C86]" />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-[#0E7C86] hover:bg-[#0B656D] text-white px-4 py-1.5 rounded-[8px] text-[13px] font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Hero Stats Grid (No Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Visits Submitted</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{visitsCreated}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Approved Visits</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{totalApproved}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Top Staff Member</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none truncate">{topPerformer}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Active Staff</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{activeStaffCount}</h3>
          </div>
        </div>
      </div>

      {/* Outside Search & Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search staff or role..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
        >
          <option value="all">All Ranks</option>
          <option value="Elite">Elite</option>
          <option value="Excellent">Excellent</option>
          <option value="Active">Active</option>
        </select>
      </div>

      <div className="grid grid-cols-12 gap-4">
         {/* Staff Performance & Visit Logs Table */}
         <div className="col-span-12 lg:col-span-8 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Staff Member</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Role</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Visits</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Approved</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Score</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center pr-2">Rank</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                     {filteredStaff.length === 0 ? (
                       <tr>
                         <td colSpan={6} className="py-8 text-center text-[13px] text-[#4A5961]">
                           No staff performance logs found
                         </td>
                       </tr>
                     ) : filteredStaff.map((s, i) => (
                       <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-2.5 pl-2">
                             <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-[6px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-[11px]">
                                   {s.name ? s.name.split(' ').map(n => n[0]).join('') : "ST"}
                                </div>
                                <div>
                                   <p className="font-semibold text-[#10242A]">{s.name}</p>
                                   <p className="text-[11px] text-[#708088]">STF-0{i+101}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-2.5 text-[#4A5961]">
                             {s.role}
                          </td>
                          <td className="py-2.5 text-center font-semibold text-[#10242A]">{s.tasks}</td>
                          <td className="py-2.5 text-center font-semibold text-emerald-600">{s.resolved}</td>
                          <td className="py-2.5 text-center font-semibold text-[#0E7C86]">
                             {s.score}
                          </td>
                          <td className="py-2.5 pr-2 text-center">
                             <span className={cn(
                               "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase",
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

         {/* Efficiency Scorecard / Leaderboard */}
         <div className="col-span-12 lg:col-span-4 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <div>
               <h3 className="text-[15px] font-bold text-[#10242A] mb-3">Top Performing Staff</h3>
               <div className="space-y-3">
                  {staffPerformance.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#F4F6F8] rounded-[10px] border border-[#E1E6EA]">
                       <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] font-bold text-xs flex items-center justify-center shrink-0">
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
      </div>
    </div>
  );
}
