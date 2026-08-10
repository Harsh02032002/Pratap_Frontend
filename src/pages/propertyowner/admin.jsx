import React, { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import {
  Users,
  BedDouble,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Wallet,
  AlertTriangle,
  Send,
  Plus,
  Sparkles,
  TrendingUp,
  MessageSquareWarning,
  CalendarClock,
  Calendar,
  Building2,
  MessageCircle,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCog
} from "lucide-react";
import { StatCard } from "../../components/propertyowner/StatCard";
import { MobileStatCard, MobileSectionCard } from "../../components/propertyowner/MobileComponents";
import { Pill } from "../../components/propertyowner/Pill";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  clearOwnerRuntimeSession,
  fetchOwnerTenants,
  formatDate,
  getOwnerRuntimeSession,
  filterByActiveProperty
} from "../../utils/propertyowner";
import { fetchRentDashboard } from "../../utils/rentCollectionApi";
import { cacheGet, cacheSet } from "../../utils/cache";

const _chartCache = new Map(); // loginId → { thisWeek, growth, timestamp }
const CHART_CACHE_TTL = 7 * 60 * 1000; // 7 minutes

const DASH_CACHE_TTL = 4 * 60 * 1000; // 4 minutes — hard expiry
const DASH_REVALIDATE_AFTER = 90 * 1000; // 90s — only background-refresh cache older than this

const getDashCache = (loginId) => {
  try {
    const raw = sessionStorage.getItem(`rdash_${loginId}`);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (Date.now() - d.ts > DASH_CACHE_TTL) return null;
    return d;
  } catch { return null; }
};

const setDashCache = (loginId, data) => {
  try {
    sessionStorage.setItem(`rdash_${loginId}`, JSON.stringify({ ...data, ts: Date.now() }));
  } catch { } // quota errors are safe to swallow
};

// Natural wavy multiplier patterns for sparklines (index 0 = oldest, 6 = newest)
const WAVE_A = [0.72, 0.58, 0.80, 0.52, 0.78, 0.88, 1.0];
const WAVE_B = [0.90, 0.78, 0.95, 0.70, 0.85, 0.80, 1.0];
const WAVE_C = [0.60, 0.80, 0.68, 0.90, 0.72, 0.85, 1.0];
const WAVE_D = [0.85, 0.72, 0.92, 0.65, 0.80, 0.90, 1.0];

function MiniSparkline({ data, color, gradientId }) {
  if (!data?.length) return null;
  return (
    <div style={{ width: 80, height: 38, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Admin() {
  useHtmlPage({
    title: "Roomhy - Owner Dashboard",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/propertyowner/assets/css/admin.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [roomsCount, setRoomsCount] = useState(0);
  const [totalBedsCapacity, setTotalBedsCapacity] = useState(0);
  const [tenantsCount, setTenantsCount] = useState(0);
  const [rentTotal, setRentTotal] = useState(0);
  const [enquiries, setEnquiries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [recentChats, setRecentChats] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [mobileChartTab, setMobileChartTab] = useState("revenue");
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [growthPercent, setGrowthPercent] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('7d');
  const [collectionStats, setCollectionStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good Morning";
    if (hrs < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const notificationCount = useMemo(
    () => {
      const pendingEnquiries = enquiries.filter((item) => ["pending", "hold"].includes(String(item.status || "").toLowerCase())).length;
      const unreadNotifs = notifications.filter(n => !n.read).length;
      return pendingEnquiries + unreadNotifs;
    },
    [enquiries, notifications]
  );

  useEffect(() => {
    if (window?.lucide?.createIcons) window.lucide.createIcons();
  }, [owner, enquiries, loading]);

  const loadDashboard = async (loginId, { silent = false } = {}) => {
    if (!silent) {
      // Serve cache instantly so the page renders in <50ms
      const cached = getDashCache(loginId);
      if (cached) {
        setRoomsCount(cached.roomsCount);
        setTotalBedsCapacity(cached.totalBedsCapacity);
        setTenantsCount(cached.tenantsCount);
        setTenants(cached.tenants);
        setPropertiesCount(cached.propertiesCount);
        setRecentChats(cached.recentChats);
        setComplaints(cached.complaints);
        setRentTotal(cached.rentTotal);
        setEnquiries(cached.enquiries);
        setNotifications(cached.notifications);
        setLoading(false);
        // Always background-refresh to ensure data is correct & not stale
        loadDashboard(loginId, { silent: true });
        return;
      }
      setLoading(true);
    }
    setErrorMsg("");
    try {
      // Single aggregation call replaces 8 separate HTTP round-trips
      const dashRes = await fetchJson(`/api/dashboard/${encodeURIComponent(loginId)}`);

      if (!silent) setOwner((prev) => ({ ...prev, ...(dashRes?.owner || {}) }));

      const filteredRooms = filterByActiveProperty(dashRes?.rooms || [], false);
      const allEnquiries = filterByActiveProperty(Array.isArray(dashRes?.enquiries) ? dashRes.enquiries : [], false);
      const filteredTenants = Array.isArray(dashRes?.tenants) ? dashRes.tenants : [];

      const computedRent = allEnquiries
        .filter(e => ['accepted', 'approved', 'active'].includes(String(e.status).toLowerCase()))
        .reduce((sum, e) => sum + (Number(e.paidAmount) || Number(e.agreedRent) || 0), 0);
      const session = getOwnerRuntimeSession();
      const rentTotal = session?.role === 'manager' ? computedRent : (dashRes?.rent?.totalRent || 0);
      const allComplaints = Array.isArray(dashRes?.complaints) ? dashRes.complaints : [];
      const allNotifications = Array.isArray(dashRes?.notifications) ? dashRes.notifications : [];

      setRoomsCount(filteredRooms.length);
      setTotalBedsCapacity(filteredRooms.reduce((s, r) => s + (r.beds || 1), 0));
      setTenantsCount(filteredTenants.length);
      setTenants(filteredTenants);
      setPropertiesCount(dashRes?.properties?.length || 0);
      setRecentChats(dashRes?.chats?.conversations || []);
      setComplaints(allComplaints);
      setRentTotal(rentTotal);
      setEnquiries(allEnquiries);
      setNotifications(allNotifications);

      // Persist fresh data to cache for next visit
      setDashCache(loginId, {
        roomsCount: filteredRooms.length,
        totalBedsCapacity: filteredRooms.reduce((s, r) => s + (r.beds || 1), 0),
        tenantsCount: filteredTenants.length,
        tenants: filteredTenants,
        propertiesCount: dashRes?.properties?.length || 0,
        recentChats: dashRes?.chats?.conversations || [],
        complaints: allComplaints,
        rentTotal,
        enquiries: allEnquiries,
        notifications: allNotifications,
      });
    } catch (err) {
      if (!silent) setErrorMsg(err?.body || err?.message || "Failed to load dashboard data.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadChartData = async (loginId, period = '7d') => {
    const cacheKey = `${loginId}-${period}`;
    const cached = _chartCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CHART_CACHE_TTL) {
      setChartData(cached.thisWeek);
      setGrowthPercent(cached.growth);
      setChartLoading(false);
      return;
    }
    setChartLoading(true);
    try {
      const fmt = (d) => d.toISOString().split('T')[0];
      const today = new Date();
      const days = period === '3m' ? 90 : period === '1m' ? 30 : 7;
      const thisStart = new Date(today); thisStart.setDate(today.getDate() - (days - 1));
      const prevEnd = new Date(today); prevEnd.setDate(today.getDate() - days);
      const prevStart = new Date(today); prevStart.setDate(today.getDate() - (days * 2 - 1));

      const [thisWeekRaw, prevWeekRaw] = await Promise.all([
        fetchJson(`/api/rent-collection/payments/daily-summary?ownerId=${encodeURIComponent(loginId)}&startDate=${fmt(thisStart)}&endDate=${fmt(today)}`).catch(() => null),
        fetchJson(`/api/rent-collection/payments/daily-summary?ownerId=${encodeURIComponent(loginId)}&startDate=${fmt(prevStart)}&endDate=${fmt(prevEnd)}`).catch(() => null)
      ]);

      const thisWeek = Array.isArray(thisWeekRaw) ? thisWeekRaw : (thisWeekRaw?.data || []);
      const prevWeek = Array.isArray(prevWeekRaw) ? prevWeekRaw : (prevWeekRaw?.data || []);

      const thisTotal = thisWeek.reduce((s, d) => s + (Number(d.amount) || 0), 0);
      const prevTotal = prevWeek.reduce((s, d) => s + (Number(d.amount) || 0), 0);
      const growth = prevTotal > 0 ? Number(((thisTotal - prevTotal) / prevTotal * 100).toFixed(1)) : null;

      setChartData(thisWeek);
      setGrowthPercent(growth);
      // Only cache when we actually got data — never cache empty so next load retries
      if (thisWeek.length > 0) {
        _chartCache.set(cacheKey, { thisWeek, growth, timestamp: Date.now() });
      }
    } catch {
      setChartData([]);
      setGrowthPercent(null);
    } finally {
      setChartLoading(false);
    }
  };

  const loadMonthlyData = async (loginId) => {
    const MONTHLY_KEY = `monthly-summary:${loginId}`;
    const cached = cacheGet(MONTHLY_KEY);
    if (cached) { setMonthlyData(cached); setMonthlyLoading(false); return; }
    setMonthlyLoading(true);
    try {
      const res = await fetchJson('/api/rent-collection/monthly-summary');
      if (res?.success && Array.isArray(res.data)) {
        setMonthlyData(res.data);
        cacheSet(MONTHLY_KEY, res.data, 5 * 60 * 1000);
      }
    } catch {
      // non-critical
    } finally {
      setMonthlyLoading(false);
    }
  };

  const loadCollectionStats = async (ownerId) => {
    try {
      const data = await fetchRentDashboard(ownerId); // uses 2-min TTL in rentCollectionApi
      if (data?.success && data?.stats) setCollectionStats(data.stats);
    } catch {
      // non-critical — dashboard works fine without it
    }
  };

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
      return;
    }
    setOwner(session);
    loadDashboard(session.loginId);
    loadChartData(session.loginId, chartPeriod);
    loadCollectionStats(session._id || session.loginId);
    loadMonthlyData(session.loginId);
    loadChangeRequests(session.loginId);
  }, []);

  // Status of the owner's own submitted profile/bank-detail change requests —
  // surfaced so they know if superadmin approved or rejected an update (and why).
  const loadChangeRequests = async (loginId) => {
    try {
      const res = await fetchJson(`/api/owner-change-requests?ownerLoginId=${encodeURIComponent(loginId)}`);
      setChangeRequests(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      // Non-critical — the rest of the dashboard still works without this.
    }
  };

  useEffect(() => {
    if (owner?.loginId) loadChartData(owner.loginId, chartPeriod);
  }, [chartPeriod]); // owner.loginId is stable after initial session load

  const handleEnquiryAction = async (enquiryId, status) => {
    try {
      await fetchJson(`/api/owners/enquiries/${encodeURIComponent(enquiryId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      if (owner?.loginId) {
        await loadDashboard(owner.loginId);
      }
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to update enquiry.");
    }
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const newLeadsCount = enquiries.filter(e => !e.status || String(e.status).toLowerCase() === 'pending').length;
  const bookingsCount = enquiries.filter(e => ['approved', 'accepted', 'active'].includes(String(e.status).toLowerCase())).length;
  const occupancyPercent = totalBedsCapacity ? Math.min(100, Math.round(((tenantsCount || 0) / totalBedsCapacity) * 100)) : 0;

  const moveInsToday = tenants.filter(t => {
    if (!t.doj) return false;
    const d = new Date(t.doj);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === todayStart.getTime();
  }).length;

  const openComplaintsCount = complaints.filter(c => ['open', 'pending'].includes(String(c.status).toLowerCase())).length;
  const inProgressComplaintsCount = complaints.filter(c => String(c.status).toLowerCase() === 'in progress').length;
  const resolvedComplaintsCount = complaints.filter(c => ['resolved', 'closed'].includes(String(c.status).toLowerCase())).length;

  const recentLeads = [...enquiries].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 3);
  const recentTenantsList = [...tenants].sort((a, b) => new Date(b.doj || b.createdAt || 0) - new Date(a.doj || a.createdAt || 0)).slice(0, 3);

  // Sum of agreedRent from all active tenants — this is the true "expected" monthly figure
  const monthlyRentExpected = useMemo(
    () => tenants.reduce((sum, t) => sum + (Number(t.agreedRent) || 0), 0) + (collectionStats?.totalPenalty || 0),
    [tenants, collectionStats]
  );

  // Total actually collected in the last 7 days (from chart API data)
  const weeklyCollected = useMemo(
    () => (chartData || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    [chartData]
  );

  const enhancedChartData = useMemo(() => {
    if (!chartData?.length) return [];
    const dailyExpected = monthlyRentExpected > 0 ? Math.round(monthlyRentExpected / 30) : 0;
    const dailyPenalty = collectionStats?.totalPenalty > 0
      ? Math.round(collectionStats.totalPenalty / (chartData.length || 1))
      : 0;
    return chartData.map(d => ({
      ...d,
      collected: Number(d.amount) || 0,
      due: dailyExpected,
      penalty: dailyPenalty,
    }));
  }, [chartData, monthlyRentExpected, collectionStats]);


  const sparklineData = useMemo(() => {
    // Use real payment data if it has actual amounts
    if (chartData?.length && chartData.some(d => Number(d.amount) > 0)) {
      return chartData.map(d => ({ v: Number(d.amount) || 0 }));
    }
    // Fallback: wavy pattern scaled to expected rent so it looks realistic
    const base = monthlyRentExpected > 0 ? monthlyRentExpected / 30 : 1;
    return WAVE_A.map(w => ({ v: base * w }));
  }, [chartData, monthlyRentExpected]);

  const tenantSparkline = useMemo(() => {
    const base = tenantsCount || 1;
    return WAVE_B.map(w => ({ v: base * w }));
  }, [tenantsCount]);

  const leadsSparkline = useMemo(() => {
    const base = enquiries.length || 1;
    return WAVE_C.map(w => ({ v: base * w }));
  }, [enquiries.length]);

  const occupancySparkline = useMemo(() => {
    const base = occupancyPercent || 1;
    return WAVE_D.map(w => ({ v: base * w }));
  }, [occupancyPercent]);

  const newLeadsTodayCount = enquiries.filter(e => {
    const created = e.createdAt ? new Date(e.createdAt) : null;
    return created && created >= todayStart && (!e.status || String(e.status).toLowerCase() === 'pending');
  }).length;

  const getRelativeTime = (date) => {
    if (!date) return "—";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Dashboard"
      navVariant="default"
      skipNotificationFetch={true}
      notificationCount={notificationCount}
      notifications={[
        ...notifications.slice(0, 10).map(n => {
          const meta = typeof n.meta === 'string' ? JSON.parse(n.meta) : (n.meta || {});
          return {
            ...n,
            title: meta.title || n.title || (n.type === 'user_filter_match' ? 'New Lead Match' : 'Notification'),
            message: meta.message || n.message || '',
            type: n.type,
            meta: meta
          };
        }),
        ...enquiries.slice(0, 5).map((item) => ({
          title: item.propertyName || item.property?.name || "Enquiry",
          message: `${item.name || item.tenantName || "Tenant"} | ${item.status || "pending"}`,
          type: 'enquiry',
          meta: { bookingId: item._id }
        }))
      ]}
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
      contentClassName="max-w-7xl mx-auto"
    >

      {/* ═══════════════════════ DESKTOP VIEW ═══════════════════════ */}
      <div className="hidden md:block">

        {/* ── Page Header ── */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-2">
              <Sparkles className="size-3" /> {getGreeting()}, {owner?.name || "Owner"}
            </div>
            <h1 className="font-serif text-[40px] leading-[1.04] text-foreground">
              Here's what's happening today.
            </h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              {loading
                ? <span className="inline-block h-4 w-52 bg-muted/60 animate-pulse rounded" />
                : `${tenantsCount} beds occupied across ${roomsCount} rooms · ${propertiesCount} ${propertiesCount === 1 ? 'property' : 'properties'}.`
              }
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => window.location.href = '/propertyowner/payment'}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border bg-card text-[13px] font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <Send className="size-3.5" /> Send reminders
            </button>
            <button
              onClick={() => window.location.href = '/propertyowner/tenantrec'}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="size-3.5" /> Add tenant
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-[13px] text-rose-700">
            <AlertCircle className="size-4 shrink-0" /> {errorMsg}
          </div>
        )}

        {/* ── PRIMARY KPI CARDS ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">

          {/* 1. Monthly Rent Expected */}
          <div 
            onClick={() => window.location.href = '/propertyowner/payment'}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer min-w-0"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                <IndianRupee className="size-4" />
              </div>
              <MiniSparkline data={sparklineData} color="#3b82f6" gradientId="sg-rent" />
            </div>
            {loading ? (
              <div className="h-9 w-28 bg-muted/70 animate-pulse rounded-lg mb-1" />
            ) : (
              <p className="text-[20px] sm:text-[24px] xl:text-[30px] font-black text-foreground leading-none mb-1 truncate" title={`₹${monthlyRentExpected.toLocaleString('en-IN')}`}>
                ₹{monthlyRentExpected.toLocaleString('en-IN')}
              </p>
            )}
            <p className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3 truncate">
              Monthly Rent Expected
            </p>
            <div className="flex flex-wrap items-center justify-between gap-1 pt-3 border-t border-border/50">
              {growthPercent !== null ? (
                <span className={`inline-flex items-center gap-0.5 text-[9.5px] xl:text-[10.5px] font-bold ${growthPercent >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {growthPercent >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {growthPercent >= 0 ? '+' : ''}{growthPercent}% VS LAST WEEK
                </span>
              ) : (
                <span className="text-[9.5px] xl:text-[10.5px] text-muted-foreground">No trend data</span>
              )}
              <span className="text-[8.5px] xl:text-[9.5px] font-semibold text-muted-foreground/50 uppercase tracking-wider">SOURCE: TENANTS</span>
            </div>
          </div>

          {/* 2. Total Tenants */}
          <div 
            onClick={() => window.location.href = '/propertyowner/tenants'}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-md hover:border-emerald-300 transition-all group cursor-pointer min-w-0"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                <Users className="size-4" />
              </div>
              <MiniSparkline data={tenantSparkline} color="#10b981" gradientId="sg-tenants" />
            </div>
            {loading ? (
              <div className="h-9 w-16 bg-muted/70 animate-pulse rounded-lg mb-1" />
            ) : (
              <p className="text-[20px] sm:text-[24px] xl:text-[30px] font-black text-foreground leading-none mb-1 truncate">{tenantsCount}</p>
            )}
            <p className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3 truncate">
              Total Tenants
            </p>
            <div className="flex flex-wrap items-center justify-between gap-1 pt-3 border-t border-border/50">
              <span className="inline-flex items-center gap-0.5 text-[9.5px] xl:text-[10.5px] font-bold text-emerald-600">
                <ArrowUpRight className="size-3" />
                {moveInsToday > 0 ? `+${moveInsToday} TODAY` : 'STEADY'}
              </span>
              <span className="text-[8.5px] xl:text-[9.5px] font-semibold text-muted-foreground/50 uppercase tracking-wider">SOURCE: RECORDS</span>
            </div>
          </div>

          {/* 3. Total Leads */}
          <div 
            onClick={() => window.location.href = '/propertyowner/enquiry'}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-md hover:border-violet-355 transition-all group cursor-pointer min-w-0"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="size-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                <TrendingUp className="size-4" />
              </div>
              <MiniSparkline data={leadsSparkline} color="#7c3aed" gradientId="sg-leads" />
            </div>
            {loading ? (
              <div className="h-9 w-16 bg-muted/70 animate-pulse rounded-lg mb-1" />
            ) : (
              <p className="text-[20px] sm:text-[24px] xl:text-[30px] font-black text-foreground leading-none mb-1 truncate">{enquiries.length}</p>
            )}
            <p className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3 truncate">
              Total Leads
            </p>
            <div className="flex flex-wrap items-center justify-between gap-1 pt-3 border-t border-border/50">
              <span className="inline-flex items-center gap-0.5 text-[9.5px] xl:text-[10.5px] font-bold text-violet-600">
                <ArrowUpRight className="size-3" />
                {newLeadsTodayCount > 0 ? `+${newLeadsTodayCount} TODAY` : `${newLeadsCount} PENDING`}
              </span>
              <span className="text-[8.5px] xl:text-[9.5px] font-semibold text-muted-foreground/50 uppercase tracking-wider">SOURCE: ENQUIRIES</span>
            </div>
          </div>

          {/* 4. Occupancy Rate */}
          <div 
            onClick={() => window.location.href = '/propertyowner/rooms'}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-md hover:border-amber-300 transition-all group cursor-pointer min-w-0"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                <BedDouble className="size-4" />
              </div>
              <MiniSparkline data={occupancySparkline} color="#f59e0b" gradientId="sg-occ" />
            </div>
            {loading ? (
              <div className="h-9 w-20 bg-muted/70 animate-pulse rounded-lg mb-1" />
            ) : (
              <p className="text-[20px] sm:text-[24px] xl:text-[30px] font-black text-foreground leading-none mb-1 truncate">{occupancyPercent}%</p>
            )}
            <p className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3 truncate">
              Occupancy Rate
            </p>
            <div className="flex flex-wrap items-center justify-between gap-1 pt-3 border-t border-border/50">
              <span className="text-[9.5px] xl:text-[10.5px] font-bold text-amber-600">{tenantsCount}/{totalBedsCapacity} BEDS FILLED</span>
              <span className="text-[8.5px] xl:text-[9.5px] font-semibold text-muted-foreground/50 uppercase tracking-wider">SOURCE: BEDS</span>
            </div>
          </div>
        </div>

        {/* ── SECONDARY METRICS STRIP ── */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <button
            onClick={() => window.location.href = '/propertyowner/complaints'}
            className="bg-card border border-border rounded-xl px-5 py-3.5 shadow-soft flex items-center gap-4 hover:shadow-md hover:border-rose-200 transition-all text-left group"
          >
            <div className="size-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
              <MessageSquareWarning className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Open Complaints</p>
              <p className="text-[22px] font-black text-rose-600 leading-none">{loading ? "—" : openComplaintsCount}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/30 shrink-0 group-hover:text-rose-400 transition-colors" />
          </button>

          <button
            onClick={() => window.location.href = '/propertyowner/payment'}
            className="bg-card border border-border rounded-xl px-5 py-3.5 shadow-soft flex items-center gap-4 hover:shadow-md hover:border-emerald-200 transition-all text-left group"
          >
            <div className="size-9 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
              <Wallet className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Total Collected</p>
              <p className="text-[22px] font-black text-emerald-600 leading-none">
                ₹{collectionStats == null ? "—" : (collectionStats.totalCollected || 0).toLocaleString('en-IN')}
              </p>
              {collectionStats != null && collectionStats.totalPenalty > 0 && (
                <p className="text-[9.5px] text-amber-600 font-semibold mt-0.5">
                  +₹{(collectionStats.totalPenalty || 0).toLocaleString('en-IN')} penalty
                </p>
              )}
            </div>
            <ChevronRight className="size-4 text-muted-foreground/30 shrink-0 group-hover:text-emerald-400 transition-colors" />
          </button>

          <button
            onClick={() => window.location.href = '/propertyowner/upcoming-moveins'}
            className="bg-card border border-border rounded-xl px-5 py-3.5 shadow-soft flex items-center gap-4 hover:shadow-md hover:border-blue-200 transition-all text-left group"
          >
            <div className="size-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <CalendarClock className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Move-ins Today</p>
              <p className="text-[22px] font-black text-blue-600 leading-none">{loading ? "—" : moveInsToday}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/30 shrink-0 group-hover:text-blue-400 transition-colors" />
          </button>
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid grid-cols-3 gap-5 mb-5">

          {/* Collection Statistics Overview — 2/3 width */}
          <div className="col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
            {/* Header with period tabs */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[15px] text-foreground">Rent Collection Overview</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Collection trends vs targets</p>
              </div>
              <div className="flex items-center gap-0.5 bg-muted/40 rounded-lg p-1">
                {[['7D', '7d'], ['1M', '1m'], ['3M', '3m']].map(([label, val]) => (
                  <button
                    key={val}
                    onClick={() => setChartPeriod(val)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${chartPeriod === val
                        ? 'bg-card shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary strip: Rent Due / Collected / Penalties / Outstanding */}
            <div className="grid grid-cols-4 divide-x divide-border/50 mb-4 pb-4 border-b border-border/40">
              <div className="pr-3">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-1">Total Rent Due</p>
                <p className="text-[18px] font-black text-foreground leading-none">
                  {loading ? <span className="inline-block h-5 w-20 bg-muted/60 animate-pulse rounded" /> : `₹${monthlyRentExpected.toLocaleString('en-IN')}`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Monthly expected</p>
              </div>
              <div className="px-3">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-1">Total Collected</p>
                <p className="text-[18px] font-black text-emerald-600 leading-none">
                  {collectionStats == null
                    ? <span className="inline-block h-5 w-16 bg-muted/60 animate-pulse rounded" />
                    : `₹${(collectionStats.totalCollected || 0).toLocaleString('en-IN')}`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {collectionStats != null && collectionStats.totalRentAmount > 0
                    ? `${Math.min(100, Math.round((collectionStats.totalCollected || 0) / collectionStats.totalRentAmount * 100))}% of expected`
                    : 'All invoices'}
                </p>
              </div>
              <div className="px-3">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-1">Penalties Accrued</p>
                <p className="text-[18px] font-black text-amber-600 leading-none">
                  {collectionStats == null
                    ? <span className="inline-block h-5 w-12 bg-muted/60 animate-pulse rounded" />
                    : `₹${(collectionStats.totalPenalty || 0).toLocaleString('en-IN')}`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {collectionStats ? `${collectionStats.phase3 || 0} in final notice` : '—'}
                </p>
              </div>
              <div className="pl-3">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-1">Outstanding</p>
                <p className="text-[18px] font-black text-rose-500 leading-none">
                  {collectionStats == null
                    ? <span className="inline-block h-5 w-16 bg-muted/60 animate-pulse rounded" />
                    : `₹${(collectionStats.totalOutstanding || 0).toLocaleString('en-IN')}`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {collectionStats ? `${collectionStats.pending || 0} pending tenants` : 'Remaining'}
                </p>
              </div>
            </div>

            {/* Radar chart — monthly Rent Due vs Collected */}
            <div className="h-[170px] flex items-center justify-center">
              {monthlyLoading ? (
                <div className="h-full w-full bg-muted/30 animate-pulse rounded-xl" />
              ) : monthlyData.some(d => d.due > 0 || d.collected > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={monthlyData} margin={{ top: 4, right: 30, bottom: 4, left: 30 }}>
                    <defs>
                      <radialGradient id="rDue" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </radialGradient>
                      <radialGradient id="rCollected" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
                      </radialGradient>
                    </defs>
                    <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }}
                      tickLine={false}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                      formatter={(v, name) => [`₹${Number(v).toLocaleString('en-IN')}`, name === 'due' ? 'Rent Due' : 'Collected']}
                    />
                    <Radar name="due" dataKey="due" stroke="#8b5cf6" strokeWidth={2} fill="url(#rDue)" />
                    <Radar name="collected" dataKey="collected" stroke="#06b6d4" strokeWidth={2.5} fill="url(#rCollected)" />
                    <Legend
                      formatter={(v) => v === 'due' ? 'Rent Due' : 'Collected'}
                      wrapperStyle={{ fontSize: 11, paddingTop: 2 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <BarChart2 className="size-5 text-muted-foreground/40" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-muted-foreground">No payment data</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Record a payment to see monthly trends</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Occupancy donut — 1/3 width */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-semibold text-[15px] text-foreground">Occupancy</h3>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">Across all properties</p>
            <div className="relative h-[185px] mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Occupied", value: Math.min(tenantsCount || 0, totalBedsCapacity || tenantsCount || 1) },
                      { name: "Vacant", value: Math.max((totalBedsCapacity || 0) - (tenantsCount || 0), 0) }
                    ]}
                    dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={3} stroke="none"
                  >
                    <Cell fill="oklch(var(--primary))" />
                    <Cell fill="oklch(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <div className="font-serif text-[30px] leading-none text-foreground">
                    {totalBedsCapacity ? Math.min(100, Math.round(((tenantsCount || 0) / totalBedsCapacity) * 100)) : 0}%
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{tenantsCount}/{totalBedsCapacity} beds</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-around text-center pt-4 border-t border-border/50">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                  <span className="size-2 rounded-full bg-primary inline-block" /> Occupied
                </div>
                <div className="font-bold text-[20px] text-foreground">{tenantsCount || 0}</div>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                  <span className="size-2 rounded-full bg-muted-foreground/30 inline-block" /> Vacant
                </div>
                <div className="font-bold text-[20px] text-foreground">
                  {Math.max((totalBedsCapacity || 0) - (tenantsCount || 0), 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM DATA TABLES ── */}
        <div className="grid grid-cols-2 gap-5">

          {/* Recent Leads */}
          <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[15px] text-foreground">Recent Leads</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">{newLeadsCount} pending response</p>
              </div>
              <button
                onClick={() => window.location.href = '/propertyowner/booking_request'}
                className="text-[12px] font-semibold text-primary hover:opacity-70 flex items-center gap-0.5 transition-opacity"
              >
                View all <ChevronRight className="size-3.5" />
              </button>
            </div>
            <div className="divide-y divide-border/40">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="px-6 py-4 flex items-center gap-3">
                    <div className="size-8 rounded-full bg-muted/70 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted/70 animate-pulse rounded w-2/5" />
                      <div className="h-2.5 bg-muted/50 animate-pulse rounded w-3/5" />
                    </div>
                  </div>
                ))
              ) : recentLeads.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <div className="size-10 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="size-4 text-muted-foreground/40" />
                  </div>
                  <p className="text-[13px] font-semibold text-muted-foreground">No new leads yet</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">Leads will appear here as they come in</p>
                </div>
              ) : recentLeads.map((lead, i) => (
                <div key={lead._id || i} className="px-6 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-[12px] uppercase shrink-0">
                      {(lead.name || "L")[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground truncate">
                          {lead.name || `Lead #${String(lead._id).slice(-4)}`}
                        </span>
                        <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-black rounded uppercase tracking-wide shrink-0">
                          {lead.status || "pending"}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5">
                        Budget ₹{lead.budget || "—"} · {getRelativeTime(lead.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/propertyowner/booking_request'}
                    className="size-7 rounded-lg hover:bg-muted flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-3"
                  >
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Complaints */}
          <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[15px] text-foreground">Recent Complaints</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {openComplaintsCount} open · {inProgressComplaintsCount} in progress · {resolvedComplaintsCount} resolved
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/propertyowner/complaints'}
                className="text-[12px] font-semibold text-primary hover:opacity-70 flex items-center gap-0.5 transition-opacity"
              >
                View all <ChevronRight className="size-3.5" />
              </button>
            </div>
            <div className="divide-y divide-border/40">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="px-6 py-4 flex items-center gap-3">
                    <div className="size-8 rounded-full bg-muted/70 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted/70 animate-pulse rounded w-2/5" />
                      <div className="h-2.5 bg-muted/50 animate-pulse rounded w-3/5" />
                    </div>
                  </div>
                ))
              ) : complaints.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="size-4 text-emerald-500" />
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">All clear!</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">No open complaints right now</p>
                </div>
              ) : complaints.slice(0, 4).map((c, i) => {
                const status = String(c.status || 'open').toLowerCase();
                const isClosed = ['resolved', 'closed'].includes(status);
                const isInProgress = status === 'in progress';
                const badgeClass = isClosed
                  ? 'bg-emerald-50 text-emerald-600'
                  : isInProgress
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-rose-50 text-rose-600';
                return (
                  <div key={c._id || i} className="px-6 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-[12px] uppercase shrink-0">
                        {(c.reportedBy?.name || c.tenantName || "T")[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-foreground truncate max-w-[140px]">
                            {c.reportedBy?.name || c.tenantName || "Tenant"}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wide shrink-0 ${badgeClass}`}>
                            {c.category || "General"}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate max-w-[220px]">
                          {c.description || "Issue reported"} · {getRelativeTime(c.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ml-2 ${badgeClass}`}>
                      {c.status || 'Open'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Profile/Bank Update Requests — status of what the owner asked superadmin to change */}
        {changeRequests.length > 0 && (
          <div className="mt-5 rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[15px] text-foreground">Profile Update Requests</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Status of changes you've asked Roomhy to approve</p>
              </div>
            </div>
            <div className="divide-y divide-border/40">
              {changeRequests.slice(0, 5).map((req, i) => {
                const status = req.status || "Pending";
                const isApproved = status === "Approved";
                const isRejected = status === "Rejected";
                const badgeClass = isApproved
                  ? "bg-emerald-50 text-emerald-600"
                  : isRejected
                    ? "bg-rose-50 text-rose-600"
                    : "bg-amber-50 text-amber-600";
                const Icon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock;
                return (
                  <div key={req._id || i} className="px-6 py-4 flex items-start gap-3">
                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${badgeClass}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-foreground capitalize">
                          {(req.requestType || "profile").replace('_', ' ')} update
                        </span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wide shrink-0 ${badgeClass}`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                        {Object.entries(req.requestedChanges || {}).map(([k, v]) => `${k}: ${v}`).join(", ")} · {getRelativeTime(req.createdAt)}
                      </p>
                      {isRejected && req.rejectionReason && (
                        <p className="text-[11.5px] text-rose-600 mt-1 bg-rose-50 rounded-lg px-2.5 py-1.5 inline-block">
                          Reason: {req.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
      {/* ═══════════════════════ END DESKTOP VIEW ═══════════════════════ */}


      {/* ═══════════════════════ MOBILE VIEW ═══════════════════════ */}
      <div className="block md:hidden space-y-5 pb-24 px-1">

        {/* 1. Today's Overview (Grid) */}
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-3 px-1">Today's Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            <MobileStatCard
              title="New Leads"
              value={newLeadsCount}
              subtext={newLeadsTodayCount > 0 ? `+${newLeadsTodayCount} today` : "None today"}
              icon={Users}
              iconBgClass="bg-blue-50"
              iconTextClass="text-blue-600"
              onClick={() => window.location.href = '/propertyowner/booking'}
            />
            <MobileStatCard
              title="Open Complaints"
              value={openComplaintsCount}
              subtext="Needs attention"
              icon={AlertCircle}
              iconBgClass="bg-rose-50"
              iconTextClass="text-rose-600"
              onClick={() => window.location.href = '/propertyowner/complaints'}
            />
            <MobileStatCard
              title="Pending Rent"
              value="—"
              subtext="View details"
              icon={Wallet}
              iconBgClass="bg-amber-50"
              iconTextClass="text-amber-600"
              onClick={() => window.location.href = '/propertyowner/payment'}
            />
            <MobileStatCard
              title="Vacant Beds"
              value={Math.max((totalBedsCapacity || 0) - (tenantsCount || 0), 0)}
              subtext="Available"
              icon={BedDouble}
              iconBgClass="bg-purple-50"
              iconTextClass="text-purple-600"
              onClick={() => window.location.href = '/propertyowner/properties'}
            />
          </div>
        </div>

        {/* 2. Monthly Earnings (Rent Target) */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-[15px] font-bold text-slate-900">Monthly Expected Rent</h3>
          </div>
          <div className="flex items-end mt-1">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-0.5">This Month</p>
                <h4 className="text-[22px] font-black text-slate-900 leading-none">₹{monthlyRentExpected.toLocaleString('en-IN')}</h4>
                {growthPercent !== null && (
                  <p className="text-[10px] font-bold flex items-center gap-1 mt-1.5" style={{ color: growthPercent >= 0 ? '#059669' : '#dc2626' }}>
                    {growthPercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {`${growthPercent >= 0 ? '+' : ''}${growthPercent}% vs last week`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Properties Summary */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-slate-900">Properties Summary</h3>
            <button onClick={() => window.location.href = '/propertyowner/properties'} className="text-[12px] font-semibold text-blue-600 hover:underline">View all</button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 flex items-center justify-center mb-1">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-lg font-black text-slate-900">{propertiesCount}</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase">Total<br />Properties</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center mb-1">
                <BedDouble className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-slate-900">{tenantsCount}</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase">Occupied<br />Beds</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 flex items-center justify-center mb-1">
                <BedDouble className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-lg font-black text-slate-900">{Math.max((totalBedsCapacity || 0) - (tenantsCount || 0), 0)}</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase">Vacant<br />Beds</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto relative flex items-center justify-center mb-1">
                <svg className="w-12 h-12 transform -rotate-90 absolute" viewBox="0 0 36 36">
                  <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-blue-500" strokeDasharray={`${occupancyPercent}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="text-[11px] font-black text-blue-600">{occupancyPercent}%</span>
              </div>
              <div className="text-[9px] font-bold text-slate-500 uppercase">Occupancy</div>
            </div>
          </div>
        </div>

        {/* 4. New Leads */}
        <MobileSectionCard title="New Leads" actionText="View all" onAction={() => window.location.href = '/propertyowner/booking'}>
          <div className="space-y-4">
            {recentLeads.length === 0 ? (
              <div className="text-center py-4 text-[12px] font-semibold text-slate-400">No new leads</div>
            ) : recentLeads.map(lead => (
              <div key={lead._id} className="border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[14px] uppercase shrink-0">
                      {(lead.name || "U")[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-slate-900 leading-none">Lead #{String(lead._id).slice(-4)}</span>
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black rounded uppercase">New</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-1">Looking for {lead.propertyName || "PG in Area"}</p>
                      <div className="flex gap-3 mt-1.5">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Budget: ₹{lead.budget || "—"}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Move-in: {lead.expectedMoveIn || lead.moveInDate ? new Date(lead.expectedMoveIn || lead.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : "—"}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{getRelativeTime(lead.createdAt)}</span>
                </div>
                <button className="w-full py-2 border border-blue-200 text-blue-600 rounded-xl bg-blue-50/50 hover:bg-blue-50 text-[12px] font-bold flex items-center justify-center gap-2 transition-colors">
                  <MessageCircle className="w-4 h-4" /> Open
                </button>
              </div>
            ))}
          </div>
        </MobileSectionCard>

        {/* 5. Rent Collection Status */}
        <MobileSectionCard title="Rent Collection" actionText="View details" onAction={() => window.location.href = '/propertyowner/payment'}>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-900 mb-0.5">Collected</p>
                <p className="text-[14px] font-black text-slate-400 leading-none">—</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-amber-200 bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-900 mb-0.5">Pending</p>
                <p className="text-[14px] font-black text-slate-400 leading-none">—</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-900 mb-0.5">Overdue</p>
                <p className="text-[14px] font-black text-slate-400 leading-none">—</p>
              </div>
            </div>
          </div>
        </MobileSectionCard>

        {/* 6. Upcoming Move-ins */}
        <MobileSectionCard title="Upcoming Move-ins" actionText="View all" onAction={() => window.location.href = '/propertyowner/upcoming-moveins'}>
          <div className="space-y-4">
            {moveInsToday === 0 ? (
              <div className="text-center py-4 text-[12px] font-semibold text-slate-400">No move-ins today</div>
            ) : recentTenantsList.map((tenant, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[14px] uppercase shrink-0">
                    {(tenant.name || "T")[0]}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900">{tenant.name || "Tenant"}</h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Room {tenant.roomNumber || "TBD"} • {tenant.propertyName || "Property"}</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  Check-in
                </button>
              </div>
            ))}
          </div>
        </MobileSectionCard>

        {/* 7. Recent Complaints */}
        <MobileSectionCard title="Recent Complaints" actionText="View all" onAction={() => window.location.href = '/propertyowner/complaints'}>
          <div className="space-y-3">
            {complaints.length === 0 ? (
              <div className="text-[12px] text-slate-400 text-center">No open complaints</div>
            ) : complaints.slice(0, 3).map((c, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-[14px] uppercase">
                      {(c.reportedBy?.name || "T")[0]}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-rose-500 border border-white rounded-full"></span>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                      {c.reportedBy?.name || "Tenant"}
                      <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[8px] font-black rounded uppercase tracking-wider">{c.category || "Plumbing"}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">{c.description || "Issue reported"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-medium text-slate-400">{c.createdAt ? new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : "—"}</span>
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            ))}
          </div>
        </MobileSectionCard>

        {/* 7b. Profile Update Requests */}
        {changeRequests.length > 0 && (
          <MobileSectionCard title="Profile Update Requests">
            <div className="space-y-3">
              {changeRequests.slice(0, 5).map((req, i) => {
                const status = req.status || "Pending";
                const isApproved = status === "Approved";
                const isRejected = status === "Rejected";
                const badgeClass = isApproved
                  ? "bg-emerald-50 text-emerald-600"
                  : isRejected
                    ? "bg-rose-50 text-rose-600"
                    : "bg-amber-50 text-amber-600";
                const Icon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock;
                return (
                  <div key={req._id || i} className="border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${badgeClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[13px] font-bold text-slate-900 capitalize truncate">
                            {(req.requestType || "profile").replace('_', ' ')} update
                          </h4>
                          <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider shrink-0 ${badgeClass}`}>
                            {status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {Object.entries(req.requestedChanges || {}).map(([k, v]) => `${k}: ${v}`).join(", ")}
                        </p>
                      </div>
                    </div>
                    {isRejected && req.rejectionReason && (
                      <p className="text-[11px] text-rose-600 mt-2 bg-rose-50 rounded-lg px-2.5 py-1.5">
                        Reason: {req.rejectionReason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </MobileSectionCard>
        )}

        {/* 8. Recent Payments */}
        <MobileSectionCard title="Recent Payments" actionText="View history" onAction={() => window.location.href = '/propertyowner/collection-report'}>
          <div className="text-center py-4 text-[12px] font-semibold text-slate-400">
            View full payment history
          </div>
        </MobileSectionCard>

      </div>
      {/* ═══════════════════════ END MOBILE VIEW ═══════════════════════ */}

    </PropertyOwnerLayout>
  );
}
