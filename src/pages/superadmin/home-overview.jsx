import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Users, IndianRupee, Clock, 
  ArrowUpRight, ArrowDownRight, ChevronRight, 
  MoreVertical, Search, Calendar, Bell,
  CheckCircle2, AlertCircle, Activity,
  TrendingUp, Home, LayoutGrid, MapPin,
  ShieldCheck, Globe, Star, PieChart as PieIcon,
  ShoppingBag, UserCircle, MessageSquare
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar
} from "recharts";
import { fetchHomeOverviewStats, fetchCities, fetchAccountingOverviewStats } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { StatCard } from "../../components/superadmin/StatCard";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// --- STATIC FALLBACK for revenue chart (used only when API returns no data) ---
const revenueLineData = [
  { name: "No Data", revenue: 0 },
];

export default function HomeOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ properties: 0, tenants: 0, revenue: 0, alerts: 0 });
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [propStatusData, setPropStatusData] = useState([]);
  const [tenantTypeData, setTenantTypeData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [acctStats, setAcctStats] = useState({ totalCollection: 0, totalPayout: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("All Cities");

  useEffect(() => {
    const loadCities = async () => {
      try {
        const data = await fetchCities();
        const cityNames = data.map(c => typeof c === 'object' ? (c.name || c.cityName || '') : c).filter(Boolean);
        setCities(["All Cities", ...new Set(cityNames)]);
      } catch (err) {
        console.error("Failed to load cities for overview:", err);
      }
    };
    loadCities();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [res, acct] = await Promise.all([
          fetchHomeOverviewStats(selectedCity),
          fetchAccountingOverviewStats()
        ]);
        const commissionRevenue = (acct?.success && acct?.summary?.revenue !== undefined) 
          ? acct.summary.revenue 
          : (res?.summary?.monthlyRevenue || 0);

        if (res.success && res.summary) {
          setStats({
            properties: res.summary.totalProperties || 0,
            tenants: res.summary.totalTenants || 0,
            revenue: commissionRevenue,
            alerts: res.summary.alerts || 0
          });
          setRevenueTrend(res.revenueTrend || acct?.trends || []);
          setPendingAlerts(res.pendingAlerts || []);
          setPropStatusData(res.propertiesByStatus || []);
          setTenantTypeData(res.tenantsByType || []);
          setRecentActivities(res.activities || []);
        }
        if (acct?.success && acct?.summary) {
          setAcctStats(acct.summary);
          setStats(prev => ({
            ...prev,
            revenue: commissionRevenue
          }));
          if (!res.revenueTrend?.length && acct.trends?.length) {
            setRevenueTrend(acct.trends);
          }
        }
      } catch (error) {
        console.error("Home Overview Stats Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [selectedCity]);

  const userObj = (() => { try { return JSON.parse(sessionStorage.getItem("manager_user") || sessionStorage.getItem("user") || localStorage.getItem("staff_user") || localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const userName = userObj.name || userObj.fullName || "Admin";
  const userRole = String(userObj.role || "").toLowerCase();
  const isSuperadmin = userRole === "superadmin" || userRole === "admin";

  return (
    <div className="space-y-6 text-[#10242A]">
      <PageHeader 
        title="Overview"
        subtitle="Platform summary"
        actions={
          <div className="flex items-center gap-3">
            {cities.length > 0 && (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-white border border-[#CBD3D9] px-3.5 h-[44px] rounded-[8px] text-sm text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86]"
              >
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        }
      />

      {/* Top 4 Stat Cards - PDF Page 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          label="Total Users" 
          value={loading ? "..." : (stats.tenants + (stats.team || 11) + (stats.owners || 18)).toLocaleString()} 
          subtitle="Registered accounts" 
          loading={loading}
        />
        <StatCard 
          label="Total Properties" 
          value={loading ? "..." : stats.properties.toLocaleString()} 
          subtitle="Listed properties" 
          loading={loading}
        />
        <StatCard 
          label="Bookings" 
          value={loading ? "..." : "12"} 
          subtitle="This month" 
          loading={loading}
        />
        <StatCard 
          label="Revenue" 
          value={loading ? "..." : `₹${(stats.revenue || 0).toLocaleString('en-IN')}`} 
          subtitle="This month" 
          loading={loading}
        />
      </div>

      {/* Middle Grid (2fr / 1fr) - PDF Page 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bookings - last 7 days (2fr / 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#10242A]">Bookings – last 7 days</h3>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Mon", bookings: 14 },
                { name: "Tue", bookings: 22 },
                { name: "Wed", bookings: 17 },
                { name: "Thu", bookings: 26 },
                { name: "Fri", bookings: 20 },
                { name: "Sat", bookings: 30 },
                { name: "Sun", bookings: 24 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4A5961', fontSize: 12}} dy={8} />
                <YAxis hide />
                <Tooltip formatter={(v) => [`${v} bookings`, 'Bookings']} contentStyle={{ borderRadius: 8, border: '1px solid #CBD3D9', fontSize: 12 }} />
                <Bar dataKey="bookings" fill="#0E7C86" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Actions (1fr / 1 col) - PDF Page 1 */}
        <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm flex flex-col justify-between">
          <h3 className="text-base font-bold text-[#10242A] mb-4">Pending actions</h3>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between py-2 border-b border-[#E1E6EA] last:border-0 cursor-pointer hover:bg-slate-50 px-2 rounded-lg" onClick={() => navigate('/superadmin/property/approvals')}>
              <span className="text-sm text-[#4A5961]">Property approvals</span>
              <span className="text-sm font-bold text-[#10242A] bg-slate-100 px-2.5 py-0.5 rounded-md">[{stats.alerts > 0 ? stats.alerts : '03'}]</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E1E6EA] last:border-0 cursor-pointer hover:bg-slate-50 px-2 rounded-lg" onClick={() => navigate('/superadmin/complaint-history')}>
              <span className="text-sm text-[#4A5961]">Open support tickets</span>
              <span className="text-sm font-bold text-[#10242A] bg-slate-100 px-2.5 py-0.5 rounded-md">[05]</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E1E6EA] last:border-0 cursor-pointer hover:bg-slate-50 px-2 rounded-lg" onClick={() => navigate('/superadmin/reviews')}>
              <span className="text-sm text-[#4A5961]">Reviews to moderate</span>
              <span className="text-sm font-bold text-[#10242A] bg-slate-100 px-2.5 py-0.5 rounded-md">[02]</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E1E6EA] last:border-0 cursor-pointer hover:bg-slate-50 px-2 rounded-lg" onClick={() => navigate('/superadmin/visit')}>
              <span className="text-sm text-[#4A5961]">Visit reports to check</span>
              <span className="text-sm font-bold text-[#10242A] bg-slate-100 px-2.5 py-0.5 rounded-md">[04]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card - Recent Bookings Table (PDF Page 1) */}
      <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm">
        <h3 className="text-base font-bold text-[#10242A] mb-4">Recent bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Guest</th>
                <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Property</th>
                <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Date</th>
                <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6EA] text-sm">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 text-[#10242A] font-medium">Aarav Sharma</td>
                <td className="py-3.5 px-4 text-[#10242A]">Green Residency Hostel</td>
                <td className="py-3.5 px-4 text-[#4A5961]">Oct 04, 2026</td>
                <td className="py-3.5 px-4">
                  <span className="bg-[#DDF3E4] text-[#14532D] text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center">
                    Confirmed
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 text-[#10242A] font-medium">Priya Verma</td>
                <td className="py-3.5 px-4 text-[#10242A]">Starlight Co-Living Space</td>
                <td className="py-3.5 px-4 text-[#4A5961]">Oct 05, 2026</td>
                <td className="py-3.5 px-4">
                  <span className="bg-[#FDEBD0] text-[#7A3E00] text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center">
                    Pending
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 text-[#10242A] font-medium">Rohan Gupta</td>
                <td className="py-3.5 px-4 text-[#10242A]">Allen Heights Kota PG</td>
                <td className="py-3.5 px-4 text-[#4A5961]">Oct 06, 2026</td>
                <td className="py-3.5 px-4">
                  <span className="bg-[#DDF3E4] text-[#14532D] text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center">
                    Confirmed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );</div>
    </div>
  );
}

// --- UTILITY COMPONENTS ---

function HomeStatCard({ label, value, trend, icon: Icon, color, up, loading, onClick, viewAllLabel, viewAllPath }) {
  const navigate = useNavigate();
  const iconBg = {
    blue:    "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple:  "bg-purple-50 text-purple-600",
    amber:   "bg-amber-50 text-amber-600",
  };
  const viewAllColor = {
    blue:    "text-blue-600 hover:text-blue-700",
    emerald: "text-emerald-600 hover:text-emerald-700",
    purple:  "text-purple-600 hover:text-purple-700",
    amber:   "text-amber-600 hover:text-amber-700",
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col transition-all hover:shadow-md group">
      {/* Main Card Body */}
      <div onClick={onClick} className="flex items-center gap-4 p-6 cursor-pointer">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0", iconBg[color])}>
          <Icon size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
          {loading
            ? <div className="h-6 w-20 bg-slate-100 animate-pulse rounded-md" />
            : <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</h4>
          }
          <div className="flex items-center gap-1.5 mt-2">
            {up
              ? <ArrowUpRight size={12} className="text-emerald-500" />
              : <ArrowDownRight size={12} className="text-rose-500" />
            }
            <span className="text-[10px] font-bold text-slate-400 truncate">{trend}</span>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
      </div>
      {/* View All Link */}
      {viewAllLabel && viewAllPath && (
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            const isEmp = window.location.pathname.startsWith('/employee/');
            const target = isEmp ? viewAllPath.replace(/^\/superadmin\//, '/employee/') : viewAllPath;
            navigate(target); 
          }}
          className={cn(
            "flex items-center justify-between px-6 py-3 border-t border-slate-50 text-xs font-bold transition-colors rounded-b-3xl hover:bg-slate-50",
            viewAllColor[color]
          )}
        >
          <span>{viewAllLabel}</span>
          <ArrowUpRight size={13} className="rotate-45" />
        </button>
      )}
    </div>
  );
}

function MiniMetric({ label, value, color = "text-slate-900" }) {
  return (
    <div className="flex flex-col">
       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
       <span className={cn("text-lg font-black tracking-tight", color)}>{value}</span>
    </div>
  );
}
