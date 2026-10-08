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
    <div className="space-y-4 text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight">Daily Logs</h1>
          <p className="text-[13px] text-[#4A5961]">Staff check-in and check-out records</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("Exporting Daily Logs CSV...")}
            className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer"
          >
            Export
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Present" value="00" loading={loading} />
        <StatCard label="Late" value="00" loading={loading} />
        <StatCard label="Absent" value="00" loading={loading} />
        <StatCard label="On Leave" value="00" loading={loading} />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-[320px]">
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search" 
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
          />
        </div>
        <select className="appearance-none bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-[85px] sm:w-[90px]">
          <option value="today">[Date] ▾</option>
        </select>
        <select 
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="appearance-none bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-[75px] sm:w-[80px]"
        >
          <option value="all">Role ▾</option>
        </select>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="appearance-none bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-[85px] sm:w-[90px]"
        >
          <option value="all">Status ▾</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left pl-2">Staff</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Check-in</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Check-out</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Hours</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6]">
              {loading ? (
                <tr><td colSpan="5" className="py-6 text-center text-[13px] text-[#4A5961]">Loading records...</td></tr>
              ) : displayList.length === 0 ? (
                [
                  { name: "[Name]", in: "00:00", out: "00:00", hours: "0h", status: "Present" },
                  { name: "[Name]", in: "00:00", out: "00:00", hours: "0h", status: "Late" },
                  { name: "[Name]", in: "00:00", out: "00:00", hours: "0h", status: "Absent" },
                  { name: "[Name]", in: "00:00", out: "00:00", hours: "0h", status: "Present" },
                  { name: "[Name]", in: "00:00", out: "00:00", hours: "0h", status: "Late" },
                  { name: "[Name]", in: "00:00", out: "00:00", hours: "0h", status: "Absent" },
                  { name: "[Name]", in: "00:00", out: "00:00", hours: "0h", status: "Present" },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 text-left pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#D9E1E7] shrink-0" />
                        <span className="text-[13px] font-medium text-[#10242A]">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-left text-[13px] text-[#4A5961]">{row.in}</td>
                    <td className="py-2.5 text-left text-[13px] text-[#4A5961]">{row.out}</td>
                    <td className="py-2.5 text-left text-[13px] text-[#4A5961]">{row.hours}</td>
                    <td className="py-2.5 text-left">
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold",
                        row.status === "Present" ? "bg-[#DDF3E4] text-[#14532D]" : 
                        row.status === "Late" ? "bg-[#FFEDD5] text-[#9A3412]" : 
                        "bg-[#FDE8E8] text-[#991B1B]"
                      )}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                displayList.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 text-left pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#D9E1E7] flex items-center justify-center font-bold text-[11px] text-[#4A5961] shrink-0">
                          {row.staff.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-[13px] font-medium text-[#10242A]">{row.staff}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-left text-[13px] text-[#4A5961]">{row.in}</td>
                    <td className="py-2.5 text-left text-[13px] text-[#4A5961]">{row.out}</td>
                    <td className="py-2.5 text-left text-[13px] text-[#4A5961]">{row.hours}</td>
                    <td className="py-2.5 text-left">
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold",
                        row.status === "Present" ? "bg-[#DDF3E4] text-[#14532D]" : 
                        row.status === "Late" ? "bg-[#FFEDD5] text-[#9A3412]" : 
                        "bg-[#FDE8E8] text-[#991B1B]"
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
