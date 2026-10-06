import React, { useState, useEffect, useMemo } from "react";
import { Search, Calendar, Download, RefreshCw, Filter } from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function StatCard({ label, value, loading }) {
  return (
    <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm flex flex-col justify-between">
      <p className="text-xs font-semibold text-[#4A5961] uppercase tracking-wider">{label}</p>
      <div className="mt-3">
        <h3 className="text-3xl font-bold text-[#10242A] tracking-tight">{loading ? "..." : value}</h3>
      </div>
    </div>
  );
}

export default function Log() {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [empRes] = await Promise.allSettled([
          fetchJson("/api/employees")
        ]);
        if (empRes.status === "fulfilled" && empRes.value) {
          const list = Array.isArray(empRes.value) ? empRes.value : (empRes.value.employees || []);
          setEmployees(list);
        }
      } catch (err) {
        console.error("Log data error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const sampleLogs = [
    { staff: "Vikas Joshi", role: "Field Executive", in: "09:00 AM", out: "06:00 PM", hours: "9h", status: "Present" },
    { staff: "Neha Kapoor", role: "Field Executive", in: "09:45 AM", out: "06:00 PM", hours: "8.25h", status: "Late" },
    { staff: "Amit Singh", role: "Field Executive", in: "—", out: "—", hours: "0h", status: "Absent" },
    { staff: "Pooja Verma", role: "Field Executive", in: "08:55 AM", out: "05:50 PM", hours: "9h", status: "Present" },
    { staff: "Rahul Sharma", role: "Field Executive", in: "10:15 AM", out: "06:30 PM", hours: "8.25h", status: "Late" },
    { staff: "Harsh", role: "Marketing Team", in: "—", out: "—", hours: "0h", status: "Absent" },
  ];

  const displayList = useMemo(() => {
    return sampleLogs.filter(item => {
      const matchSearch = !search || item.staff.toLowerCase().includes(search.toLowerCase()) || item.role.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 text-[#10242A]">
      <PageHeader 
        category="User Management"
        title="Daily Logs"
        subtitle="Staff check-in and check-out records"
        actions={
          <button 
            onClick={() => alert("Exporting Daily Logs CSV...")}
            className="bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] font-semibold text-sm px-4 py-2 rounded-[8px] transition-colors cursor-pointer"
          >
            Export
          </button>
        }
      />

      {/* 4 Stat Cards - PDF Page 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Present" value="08" loading={loading} />
        <StatCard label="Late" value="02" loading={loading} />
        <StatCard label="Absent" value="01" loading={loading} />
        <StatCard label="On Leave" value="02" loading={loading} />
      </div>

      {/* Table Card - PDF Page 5 */}
      <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5961]" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff name..." 
              className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] pl-10 pr-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]" 
            />
          </div>
          <select className="h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] w-full sm:w-36">
            <option value="today">Today ▾</option>
            <option value="yesterday">Yesterday</option>
          </select>
          <select 
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] w-full sm:w-36"
          >
            <option value="all">Role ▾</option>
            <option value="Field Executive">Field Executive</option>
            <option value="Marketing Team">Marketing Team</option>
          </select>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] w-full sm:w-36"
          >
            <option value="all">Status ▾</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Staff</th>
                <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Check-in</th>
                <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Check-out</th>
                <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Hours</th>
                <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6EA] text-sm">
              {loading ? (
                <tr><td colSpan="5" className="py-12 text-center text-[#4A5961]">Loading records...</td></tr>
              ) : displayList.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-[#4A5961]">No matching logs found.</td></tr>
              ) : (
                displayList.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#10242A]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E1E6EA] flex items-center justify-center font-bold text-xs text-[#10242A]">
                          {row.staff.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <span className="font-medium text-[#10242A] block">{row.staff}</span>
                          <span className="text-xs text-[#4A5961]">{row.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#4A5961]">{row.in}</td>
                    <td className="py-3.5 px-4 text-[#4A5961]">{row.out}</td>
                    <td className="py-3.5 px-4 text-[#4A5961]">{row.hours}</td>
                    <td className="py-3.5 px-4">
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center",
                        row.status === "Present" && "bg-[#DDF3E4] text-[#14532D]",
                        row.status === "Late" && "bg-[#FDEBD0] text-[#7A3E00]",
                        row.status === "Absent" && "bg-[#FEE2E2] text-[#991B1B]"
                      )}>
                        {row.status}
                      </span>
                    </td>
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
