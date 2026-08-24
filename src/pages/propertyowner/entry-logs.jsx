import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { 
  LogIn, Search, Download, Filter, 
  FileText, Calendar
} from "lucide-react";
import { apiFetch } from "../../utils/api";
import { cacheGet, cacheSet } from "../../utils/cache";

export default function EntryLogsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchLogs();
  }, [owner.loginId]);

  const fetchLogs = async () => {
    const CACHE_KEY = `visitors:${owner.loginId}`;
    const cached = cacheGet(CACHE_KEY);
    if (cached) { setLogs(cached); setLoading(false); return; }
    try {
      setLoading(true);
      const propertyId = getActiveOwnerPropertyId();
      const qs = new URLSearchParams();
      if (propertyId) qs.set("propertyId", propertyId);
      const data = await apiFetch(`/api/visitors/owner/${owner.loginId}${qs.toString() ? `?${qs.toString()}` : ""}`);
      if (data.success && data.visitors) {
        const entered = data.visitors.filter(v => (!propertyId || String(v.propertyId || v.property_id || "") === String(propertyId)) && v.entryTime);
        const mapped = entered.map(v => ({
          id: `ENT-${v._id.substring(v._id.length-4).toUpperCase()}`,
          name: v.name,
          type: "Visitor",
          gate: "Main Gate",
          time: new Date(v.entryTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        }));
        setLogs(mapped);
        cacheSet(CACHE_KEY, mapped, 2 * 60 * 1000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.id.includes(search);
    const matchesType = filterType === "all" || l.type.toLowerCase() === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Gate Entry Logs" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Gate Entry Logs</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Monitor real-time gate logins, biometrics scans, and RFID arrivals logs.</p>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries by name or RFID reference ID..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "resident", "visitor", "staff"]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`h-10 px-4 rounded-xl text-xs font-bold capitalize transition-colors border ${
                filterType === type 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Entry Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="px-6 py-3.5 font-semibold">Log ID</th>
                <th className="px-6 py-3.5 font-semibold">User Name</th>
                <th className="px-6 py-3.5 font-semibold">User Type</th>
                <th className="px-6 py-3.5 font-semibold">Access Point / Gate</th>
                <th className="px-6 py-3.5 font-semibold">Check-In Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading entry logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No entry logs found.</td></tr>
              ) : filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-foreground">{l.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <LogIn size={11} />
                      </span>
                      <span className="font-semibold text-foreground">{l.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                      {l.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{l.gate}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{l.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
