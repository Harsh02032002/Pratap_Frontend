import React, { useState, useEffect } from "react";
import { Users, Search, ChevronRight, Download, Eye, Edit, CheckCircle, XCircle, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { fetchJson } from "../../utils/api";

const cn = (...c) => c.filter(Boolean).join(" ");

const STATUS_CONFIG = {
  New:        { cls: "bg-blue-50 text-blue-600",     dot: "bg-blue-500" },
  Contacted:  { cls: "bg-amber-50 text-amber-600",   dot: "bg-amber-500" },
  Interested: { cls: "bg-purple-50 text-purple-600", dot: "bg-purple-500" },
  Converted:  { cls: "bg-emerald-50 text-emerald-600",dot: "bg-emerald-500" },
  Lost:       { cls: "bg-red-50 text-red-500",        dot: "bg-red-500" },
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
    <div className="w-full">
      <PageHeader
        title="Total Leads"
        subtitle="Manage and track all leads in your conversion pipeline."
        breadcrumbs={[{ label: "Booking & Leads" }, { label: "Total Leads", active: true }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="bg-white border border-slate-200/80 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer">
              <Download size={14} /> Export CSV
            </button>
          </div>
        }
      />

      <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-semibold text-xs">Loading leads...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Leads",    val: counts.total || "No Data Available",     color: "blue",    icon: Users },
              { label: "Active Leads",   val: counts.active || "No Data Available",    color: "purple",  icon: Users },
              { label: "Converted",      val: counts.converted || "No Data Available", color: "emerald", icon: CheckCircle },
              { label: "Lost",           val: counts.lost || "No Data Available",      color: "red",     icon: XCircle },
            ].map(c => (
              <div key={c.label} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", `bg-${c.color}-50 text-${c.color}-600`)}>
                    <c.icon size={16} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{c.val}</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">{c.label}</p>
                </div>
                <div className="text-[10px] font-medium text-slate-400 mt-4 border-t border-slate-100 pt-2.5">
                  Source: Leads
                </div>
              </div>
            ))}
          </div>

          {/* Outside Search & Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search name, phone, email..." 
                className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#095256]/20 focus:border-[#095256] transition-all shadow-2xs" 
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer">
                <option value="All">All Status</option>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer">
                <option value="All">All Locations</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Pune">Pune</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>
          </div>

          {/* Standalone Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Lead</th>
                    <th className="px-6 py-4 text-left">Contact</th>
                    <th className="px-6 py-4 text-left">Property</th>
                    <th className="px-6 py-4 text-left">Location</th>
                    <th className="px-6 py-4 text-left">Source</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">No Data Available</td></tr>
                  ) : filtered.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] shrink-0">
                            {l.name ? l.name.split(" ").map(n => n[0]).join("") : "LD"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{l.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{l.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 flex items-center gap-1"><Phone size={11}/> {l.phone}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Mail size={10}/> {l.email}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{l.property}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={11}/> {l.location}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{l.source}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold", STATUS_CONFIG[l.status]?.cls)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[l.status]?.dot)} />
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Calendar size={11}/> {l.created}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
