import React, { useState, useEffect } from "react";
import { Search, Download, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...c) => c.filter(Boolean).join(" ");

const STATUS_CONFIG = {
  New:        { cls: "bg-blue-50 text-blue-600 border-blue-100",     dot: "bg-blue-500" },
  Contacted:  { cls: "bg-amber-50 text-amber-600 border-amber-100",   dot: "bg-amber-500" },
  Interested: { cls: "bg-purple-50 text-purple-600 border-purple-100", dot: "bg-purple-500" },
  Converted:  { cls: "bg-emerald-50 text-emerald-600 border-emerald-100",dot: "bg-emerald-500" },
  Lost:       { cls: "bg-red-50 text-red-500 border-red-100",        dot: "bg-red-500" },
};

export default function TotalLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/booking/leads");
      if (res.success) {
        setLeads(res.leads || []);
      }
    } catch (err) {
      console.error("Error loading leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search) || l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || l.status === statusFilter;
    const matchLoc = locationFilter === "All" || l.location.includes(locationFilter);
    return matchSearch && matchStatus && matchLoc;
  });

  const availableLocations = Array.from(
    new Set(
      leads
        .map((l) => String(l.location || "").trim())
        .filter((loc) => loc && loc !== "—" && loc.toLowerCase() !== "n/a")
    )
  ).sort((a, b) => a.localeCompare(b));

  const counts = {
    total: leads.length,
    converted: leads.filter(l => l.status === "Converted").length,
    lost: leads.filter(l => l.status === "Lost").length,
    active: leads.filter(l => !["Converted","Lost"].includes(l.status)).length,
  };

  const handleExport = () => {
    const csv = [
      ["Lead ID","Name","Phone","Email","Property","Location","Source","Status","Created"],
      ...filtered.map(l => [l.id, l.name, l.phone, l.email, l.property, l.location, l.source, l.status, l.created])
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); 
    a.href = URL.createObjectURL(blob); 
    a.download = "leads.csv"; 
    a.click();
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Total Leads</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Manage and track all leads in your conversion pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="bg-white border border-[#CBD3D9] text-[#10242A] px-4 py-1.5 rounded-[8px] text-[13px] font-semibold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-xs cursor-pointer">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards (No Icons) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Leads",  val: counts.total },
          { label: "Active Leads", val: counts.active },
          { label: "Converted",    val: counts.converted },
          { label: "Lost",         val: counts.lost },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{c.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{c.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Outside Search & Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#708088]" size={15} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search name, phone, email..." 
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
          />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs">
          <option value="All">All Status</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
        </select>

        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs">
          <option value="All">All Locations</option>
          {availableLocations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Standalone Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Lead</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Contact</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Location</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Source</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pr-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-[13px] text-[#4A5961]">Loading leads...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-[13px] text-[#4A5961]">No Data Available</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5 pl-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-[10px] shrink-0">
                        {l.name ? l.name.split(" ").map(n => n[0]).join("") : "LD"}
                      </div>
                      <div>
                        <p className="font-semibold text-[#10242A]">{l.name}</p>
                        <p className="text-[11px] text-[#708088] font-mono">{l.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <p className="text-[#10242A] flex items-center gap-1"><Phone size={11} className="text-[#4A5961]"/> {l.phone}</p>
                    <p className="text-[11px] text-[#708088] flex items-center gap-1"><Mail size={10}/> {l.email}</p>
                  </td>
                  <td className="py-2.5 font-semibold text-[#10242A]">{l.property}</td>
                  <td className="py-2.5">
                    <span className="text-[#4A5961] flex items-center gap-1"><MapPin size={11}/> {l.location}</span>
                  </td>
                  <td className="py-2.5">
                    <span className="text-[11px] font-semibold text-[#4A5961] bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[6px]">{l.source}</span>
                  </td>
                  <td className="py-2.5">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold", STATUS_CONFIG[l.status]?.cls)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[l.status]?.dot)} />
                      {l.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-[#4A5961]">
                    <span className="flex items-center gap-1"><Calendar size={11}/> {l.created}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
