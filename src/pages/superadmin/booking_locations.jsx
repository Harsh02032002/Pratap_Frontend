import React, { useState, useEffect, useMemo } from "react";
import { MapPin, Download, Loader2, Search } from "lucide-react";
import { fetchJson } from "../../utils/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const cn = (...c) => c.filter(Boolean).join(" ");

const STATIC_LOCATIONS = [
  { rank: 1, loc: "Koramangala, Bangalore", leads: 856, bookings: 278, revenue: 3248000, conversion: 32.4, occupancy: 91 },
  { rank: 2, loc: "Andheri West, Mumbai",   leads: 742, bookings: 216, revenue: 2980000, conversion: 29.1, occupancy: 88 },
  { rank: 3, loc: "Baner, Pune",            leads: 620, bookings: 167, revenue: 2340000, conversion: 26.9, occupancy: 85 },
  { rank: 4, loc: "Whitefield, Bangalore",  leads: 512, bookings: 124, revenue: 1920000, conversion: 24.2, occupancy: 82 },
  { rank: 5, loc: "Gachibowli, Hyderabad",  leads: 478, bookings: 104, revenue: 1680000, conversion: 21.8, occupancy: 79 },
  { rank: 6, loc: "Velachery, Chennai",     leads: 390, bookings: 82,  revenue: 1240000, conversion: 21.0, occupancy: 76 },
  { rank: 7, loc: "Sector 62, Noida",       leads: 340, bookings: 68,  revenue: 1080000, conversion: 20.0, occupancy: 72 },
  { rank: 8, loc: "Kothrud, Pune",          leads: 290, bookings: 48,  revenue: 820000,  conversion: 16.6, occupancy: 65 },
];

const TABS = ["By Revenue", "By Bookings", "By Conversion", "By Occupancy"];
const TAB_KEY = { "By Revenue": "revenue", "By Bookings": "bookings", "By Conversion": "conversion", "By Occupancy": "occupancy" };
const COLORS = ["#0E7C86","#10B981","#06B6D4","#3B82F6","#F59E0B","#EC4899","#8B5CF6","#EF4444"];

const fmt = (val, key) => {
  if (key === "revenue") return `₹${(val/100000).toFixed(1)}L`;
  if (key === "conversion" || key === "occupancy") return `${val}%`;
  return val;
};

export default function TopPerformingLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("By Revenue");
  const [search, setSearch] = useState("");

  const loadLocations = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/superadmin/booking/locations");
      if (res && res.success && Array.isArray(res.locations)) {
        setLocations(res.locations);
      } else {
        setLocations([]);
      }
    } catch (err) {
      console.error("Failed to load location performance data:", err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const sortKey = TAB_KEY[activeTab];
  const sorted = useMemo(() => {
    return [...locations]
      .filter(l => !search || (l.loc || "").toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b[sortKey] - a[sortKey]);
  }, [locations, sortKey, search]);

  const chartKey = sortKey;

  const insights = useMemo(() => {
    if (locations.length === 0) return [
      { label: "Highest Revenue", val: "—", sub: "₹0.0L" },
      { label: "Highest Conversion", val: "—", sub: "0% conv. rate" },
      { label: "Highest Bookings", val: "—", sub: "0 bookings" },
      { label: "Lowest Performing", val: "—", sub: "0% occupancy" },
    ];
    
    const highestRev = [...locations].sort((a, b) => b.revenue - a.revenue)[0];
    const highestConv = [...locations].sort((a, b) => b.conversion - a.conversion)[0];
    const highestBook = [...locations].sort((a, b) => b.bookings - a.bookings)[0];
    const lowestOcc = [...locations].sort((a, b) => a.occupancy - b.occupancy)[0];

    return [
      { 
        label: "Highest Revenue", 
        val: highestRev ? highestRev.loc.split(',')[0] : "—", 
        sub: highestRev ? `₹${(highestRev.revenue/100000).toFixed(1)}L total` : "₹0.0L"
      },
      { 
        label: "Highest Conversion", 
        val: highestConv ? highestConv.loc.split(',')[0] : "—", 
        sub: highestConv ? `${highestConv.conversion}% conv. rate` : "0% conv. rate"
      },
      { 
        label: "Highest Bookings", 
        val: highestBook ? highestBook.loc.split(',')[0] : "—", 
        sub: highestBook ? `${highestBook.bookings} bookings` : "0 bookings"
      },
      { 
        label: "Lowest Performing", 
        val: lowestOcc ? lowestOcc.loc.split(',')[0] : "—", 
        sub: lowestOcc ? `${lowestOcc.occupancy}% occupancy` : "0% occupancy"
      },
    ];
  }, [locations]);

  const handleExport = () => {
    const csv = [
      ["Rank", "Location", "Leads", "Bookings", "Revenue (INR)", "Conversion Rate (%)", "Occupancy (%)"],
      ...sorted.map(l => [l.rank, l.loc, l.leads, l.bookings, l.revenue, l.conversion, l.occupancy])
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); 
    a.href = URL.createObjectURL(blob); 
    a.download = "locations_performance.csv"; 
    a.click();
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Top Performing Locations</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Identify your best-performing markets by revenue, bookings, and conversion.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadLocations} 
            disabled={loading}
            className="bg-white border border-[#CBD3D9] text-[#10242A] p-2 rounded-[8px] hover:bg-gray-50 shadow-xs disabled:opacity-50 cursor-pointer"
            title="Refresh Data"
          >
            <Loader2 size={14} className={cn(loading && "animate-spin")} />
          </button>
          <button 
            onClick={handleExport}
            className="bg-white border border-[#CBD3D9] text-[#10242A] px-4 py-1.5 rounded-[8px] text-[13px] font-semibold flex items-center gap-2 hover:bg-gray-50 shadow-xs cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Insight Cards (No Icons) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map(c => (
          <div key={c.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{c.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none truncate">{c.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Outside Search & Filter / Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
        <div className="flex items-center bg-white p-1 rounded-[8px] border border-[#CBD3D9] shadow-xs">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1 rounded-[6px] text-[13px] font-medium whitespace-nowrap transition-all cursor-pointer",
                activeTab === tab
                  ? "bg-[#0E7C86] text-white font-semibold"
                  : "text-[#4A5961] hover:text-[#10242A]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Standalone Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">#</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Location</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Total Leads</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Bookings</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Revenue</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Conv. Rate</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-[13px] text-[#4A5961]">Loading Stay Analytics...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-[13px] text-[#4A5961]">No locations found.</td></tr>
              ) : sorted.map((loc, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-2.5 pl-2">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold",
                      i === 0 ? "bg-[#0E7C86] text-white" : "bg-[#F4F6F8] text-[#4A5961]"
                    )}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-[#0E7C86] shrink-0"/>
                      <span className="font-semibold text-[#10242A]">{loc.loc}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-[#10242A]">{loc.leads.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-semibold text-[#10242A]">{loc.bookings.toLocaleString()}</td>
                  <td className="py-2.5 text-right">
                    <span className="font-bold text-[#10242A]">₹{(loc.revenue/100000).toFixed(1)}L</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={cn("font-bold", loc.conversion >= 25 ? "text-emerald-600" : loc.conversion >= 20 ? "text-amber-600" : "text-rose-500")}>
                      {loc.conversion}%
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 bg-[#E1E6EA] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0E7C86] rounded-full" style={{width:`${loc.occupancy}%`}}/>
                      </div>
                      <span className="text-[11px] font-semibold text-[#4A5961]">{loc.occupancy}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs">
        <h3 className="text-[15px] font-bold text-[#10242A] mb-3">Location Performance Chart ({activeTab})</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA"/>
              <XAxis dataKey="loc" axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}} interval={0} angle={-15} textAnchor="end" height={50}/>
              <YAxis axisLine={false} tickLine={false} tick={{fill:'#4A5961',fontSize:10,fontWeight:600}} tickFormatter={v => fmt(v, chartKey)}/>
              <Tooltip formatter={v => [fmt(v, chartKey), activeTab.replace("By ","")]}/>
              <Bar dataKey={chartKey} radius={[6,6,0,0]}>
                {sorted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
