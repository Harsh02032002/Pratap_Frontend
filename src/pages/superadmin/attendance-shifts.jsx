import React, { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import useSEO from "../../hooks/useSEO";

export default function AttendanceShifts() {
  useSEO({
    title: "Shifts – Roomhy Superadmin",
    description: "Weekly shift roster.",
    canonical: "https://roomhy.com/superadmin/attendance-shifts"
  });

  const [search, setSearch] = useState("");
  const [weekFilter, setWeekFilter] = useState("This week");
  const [roleFilter, setRoleFilter] = useState("all");

  // Roster data matching PDF Page 7 layout
  const rosterData = [
    {
      id: 1,
      staff: "Neha Kapoor",
      role: "Field Executive",
      mon: "Morning",
      tue: "Evening",
      wed: "Night",
      thu: "Off",
      fri: "Morning",
      sat: "Evening",
      sun: "Off",
    },
    {
      id: 2,
      staff: "Amit Singh",
      role: "Field Executive",
      mon: "Evening",
      tue: "Night",
      wed: "Off",
      thu: "Morning",
      fri: "Evening",
      sat: "Night",
      sun: "Off",
    },
    {
      id: 3,
      staff: "Rajesh Verma",
      role: "Maintenance",
      mon: "Night",
      tue: "Off",
      wed: "Morning",
      thu: "Evening",
      fri: "Night",
      sat: "Off",
      sun: "Off",
    },
    {
      id: 4,
      staff: "Harsh Gupta",
      role: "Marketing Team",
      mon: "Off",
      tue: "Morning",
      wed: "Evening",
      thu: "Night",
      fri: "Off",
      sat: "Morning",
      sun: "Off",
    },
    {
      id: 5,
      staff: "Priya Sharma",
      role: "Support",
      mon: "Morning",
      tue: "Evening",
      wed: "Night",
      thu: "Off",
      fri: "Morning",
      sat: "Evening",
      sun: "Off",
    },
    {
      id: 6,
      staff: "Siddharth Malhotra",
      role: "Accounts",
      mon: "Evening",
      tue: "Night",
      wed: "Off",
      thu: "Morning",
      fri: "Evening",
      sat: "Night",
      sun: "Off",
    },
    {
      id: 7,
      staff: "Vikas Kumar",
      role: "Field Operations",
      mon: "Night",
      tue: "Off",
      wed: "Morning",
      thu: "Evening",
      fri: "Night",
      sat: "Off",
      sun: "Off",
    },
  ];

  const filteredRoster = useMemo(() => {
    return rosterData.filter((item) => {
      const matchSearch =
        !search ||
        item.staff.toLowerCase().includes(search.toLowerCase()) ||
        item.role.toLowerCase().includes(search.toLowerCase());
      const matchRole =
        roleFilter === "all" ||
        item.role.toLowerCase().includes(roleFilter.toLowerCase());
      return matchSearch && matchRole;
    });
  }, [search, roleFilter]);

  const renderShiftPill = (shiftType) => {
    switch (shiftType) {
      case "Morning":
        return (
          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#DDF3E4] text-[#14532D] text-center w-full max-w-[80px]">
            Morning
          </span>
        );
      case "Evening":
        return (
          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E0F2FE] text-[#0369A1] text-center w-full max-w-[80px]">
            Evening
          </span>
        );
      case "Night":
        return (
          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDEBD0] text-[#7A3E00] text-center w-full max-w-[80px]">
            Night
          </span>
        );
      case "Off":
      default:
        return <span className="text-[12px] text-[#708088] font-medium block text-center">Off</span>;
    }
  };  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Shifts</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Weekly shift roster</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => alert("Shift Templates clicked")}
            className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] font-semibold text-[13px] px-4 py-1.5 rounded-[8px] transition-colors cursor-pointer shadow-xs"
          >
            Shift Templates
          </button>
          <button
            onClick={() => alert("Assign Shift clicked")}
            className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-[13px] px-4 py-1.5 rounded-[8px] flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={16} />
            <span>Assign Shift</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Field */}
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-10 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>

        {/* This week dropdown */}
        <select
          value={weekFilter}
          onChange={(e) => setWeekFilter(e.target.value)}
          className="appearance-none bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-[110px]"
        >
          <option value="This week">[Date] ▾</option>
          <option value="Next week">Next week ▾</option>
          <option value="Last week">Last week ▾</option>
        </select>

        {/* Role dropdown */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="appearance-none bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-[85px]"
        >
          <option value="all">Role ▾</option>
          <option value="Field">Field Executive</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Marketing">Marketing</option>
          <option value="Accounts">Accounts</option>
        </select>
      </div>

      {/* ── Weekly Shift Roster Table ── */}
      <div className="bg-white border border-[#E1E6EA] rounded-[12px] p-4 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider w-44 pl-2">Staff</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Mon</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Tue</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Wed</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Thu</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Fri</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Sat</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Sun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6]">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-[#4A5961] text-[13px]">
                    No staff shifts found.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 text-[13px] font-medium text-[#10242A] pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#D9E1E7] flex items-center justify-center text-[11px] font-bold text-[#4A5961] shrink-0">
                          {row.staff.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span>{row.staff}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center">{renderShiftPill(row.mon)}</td>
                    <td className="py-2.5 text-center">{renderShiftPill(row.tue)}</td>
                    <td className="py-2.5 text-center">{renderShiftPill(row.wed)}</td>
                    <td className="py-2.5 text-center">{renderShiftPill(row.thu)}</td>
                    <td className="py-2.5 text-center">{renderShiftPill(row.fri)}</td>
                    <td className="py-2.5 text-center">{renderShiftPill(row.sat)}</td>
                    <td className="py-2.5 text-center">{renderShiftPill(row.sun)}</td>
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
