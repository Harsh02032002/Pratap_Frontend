import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Building2, CheckCircle2, Clock, Star, CalendarX, MapPin, Map, FileText, Image as ImageIcon,
  Search, Users, TrendingUp, IndianRupee, BedDouble, Activity, ArrowUpRight, Eye,
  Sparkles, FilePlus, PenSquare, Megaphone, Network,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/status-pill";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Roomhy Admin" },
      { name: "description", content: "Roomhy platform overview: properties, cities, SEO, revenue and activity." },
    ],
  }),
  component: DashboardPage,
});

const DEFAULT_STATS = [
  { label: "Total Properties", value: "—", delta: "", icon: Building2, tone: "primary" },
  { label: "Published", value: "—", delta: "", icon: CheckCircle2, tone: "success" },
  { label: "Pending Approvals", value: "—", delta: "", icon: Clock, tone: "warning" },
  { label: "Featured", value: "—", delta: "", icon: Star, tone: "primary" },
  { label: "Expired", value: "—", delta: "", icon: CalendarX, tone: "danger" },
  { label: "Total Cities", value: "—", delta: "", icon: MapPin, tone: "primary" },
  { label: "Total Areas", value: "—", delta: "", icon: Map, tone: "primary" },
  { label: "Total Blogs", value: "—", delta: "", icon: FileText, tone: "primary" },
  { label: "Media Files", value: "—", delta: "", icon: ImageIcon, tone: "primary" },
  { label: "SEO Pages", value: "—", delta: "", icon: Search, tone: "primary" },
  { label: "Monthly Visitors", value: "—", delta: "", icon: TrendingUp, tone: "success" },
  { label: "Revenue (₹)", value: "—", delta: "", icon: IndianRupee, tone: "success" },
];

const analytics = [
  { label: "Top Performing City", value: "Kota", meta: "Loading…" },
  { label: "Most Viewed Property", value: "—", meta: "Loading…" },
  { label: "Top Category", value: "—", meta: "Loading…" },
  { label: "Highest Booking Area", value: "—", meta: "Loading…" },
  { label: "Best SEO Page", value: "—", meta: "Loading…" },
  { label: "Trending Blog", value: "—", meta: "Loading…" },
];

const PIE_COLORS = ["hsl(175 60% 45%)", "hsl(210 70% 55%)", "hsl(35 85% 55%)", "hsl(0 70% 60%)", "hsl(280 55% 60%)"];

function DashboardPage() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, propsRes, pendingRes, citiesRes, areasRes, blogsRes, mediaRes, seoRes] = await Promise.all([
        api.get('/api/superadmin/stats').catch(() => ({})),
        api.get(`/api/properties?limit=5000`).catch(() => ({ data: { properties: [] } })),
        api.get('/api/properties?status=Pending&limit=5').catch(() => ({ data: [] })),
        api.get('/api/locations/cities').catch(() => ({ data: [] })),
        api.get('/api/locations/areas').catch(() => ({ data: [] })),
        api.get('/api/blogs?limit=1').catch(() => ({ data: [], total: 0 })),
        api.get('/api/media?limit=1').catch(() => ({ data: [], total: 0 })),
        api.get('/api/seo?limit=1').catch(() => ({ data: [], total: 0 })),
      ]);

      // /api/superadmin/stats returns { success, stats: { tenants, properties, ... }, netRevenue, ... }
      const raw = statsRes.data || statsRes || {};
      const s = raw.stats || raw;

      // /api/properties returns { success, properties: [...] } — same as reference panel
      const propsList = propsRes.data || propsRes || {};
      const allProps: any[] = Array.isArray(propsList.properties) ? propsList.properties
        : Array.isArray(propsList) ? propsList
        : Array.isArray((propsList as any).data) ? (propsList as any).data
        : [];
      const totalProps = allProps.length || s.properties || s.totalProperties || 0;
      const publishedProps = allProps.filter((p: any) => ["published", "approved", "live"].includes((p.status || "").toLowerCase())).length;
      const pendingProps = allProps.filter((p: any) => (p.status || "").toLowerCase() === "pending").length;
      const featuredProps = allProps.filter((p: any) => p.isFeatured || p.featured).length;
      const expiredProps = allProps.filter((p: any) => (p.status || "").toLowerCase() === "expired").length;

      const totalCities = Array.isArray(citiesRes.data) ? citiesRes.data.length : (Array.isArray(citiesRes) ? citiesRes.length : 0);
      const totalAreas = Array.isArray(areasRes.data) ? areasRes.data.length : (Array.isArray(areasRes) ? areasRes.length : 0);
      const totalBlogs = blogsRes.total || (Array.isArray(blogsRes.data) ? blogsRes.data.length : 0) || s.totalBlogs || 0;
      const totalMedia = mediaRes.total || (Array.isArray(mediaRes.data) ? mediaRes.data.length : 0) || s.totalMedia || 0;
      const totalSeo = seoRes.total || (Array.isArray(seoRes.data) ? seoRes.data.length : 0) || s.totalSeo || 0;

      const statsArray = [
        { label: "Total Properties", value: fmt(totalProps), delta: "", icon: Building2, tone: "primary" as const },
        { label: "Published", value: fmt(publishedProps || s.published || s.liveProperties), delta: "", icon: CheckCircle2, tone: "success" as const },
        { label: "Pending Approvals", value: fmt(pendingProps || s.pending || s.pendingProperties), delta: "", icon: Clock, tone: "warning" as const },
        { label: "Featured", value: fmt(featuredProps || s.featured), delta: "", icon: Star, tone: "primary" as const },
        { label: "Expired", value: fmt(expiredProps || s.expired), delta: "", icon: CalendarX, tone: "danger" as const },
        { label: "Total Cities", value: fmt(totalCities || s.totalCities || s.citiesCount), delta: "", icon: MapPin, tone: "primary" as const },
        { label: "Total Areas", value: fmt(totalAreas || s.totalAreas || s.areasCount), delta: "", icon: Map, tone: "primary" as const },
        { label: "Total Blogs", value: fmt(totalBlogs), delta: "", icon: FileText, tone: "primary" as const },
        { label: "Media Files", value: fmt(totalMedia), delta: "", icon: ImageIcon, tone: "primary" as const },
        { label: "SEO Pages", value: fmt(totalSeo), delta: "", icon: Search, tone: "primary" as const },
        { label: "Monthly Visitors", value: fmt(s.monthlyVisitors || s.visitorsCount), delta: "+18%", icon: TrendingUp, tone: "success" as const },
        { label: "Revenue (₹)", value: (raw.netRevenue || s.netRevenue || s.revenue) ? `₹${fmt(raw.netRevenue || s.netRevenue || s.revenue)}` : "₹—", delta: "", icon: IndianRupee, tone: "success" as const },
      ];
      setStats(statsArray);

      setRecentProperties(allProps.slice(0, 8));
      setPending(Array.isArray(pendingRes.data || pendingRes) ? (pendingRes.data || pendingRes).slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const fmt = (n: any) => {
    if (n === null || n === undefined) return '—';
    const num = typeof n === 'string' ? parseInt(n, 10) : n;
    if (Number.isNaN(num)) return '—';
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Welcome back, Super Admin — here's what's happening across Roomhy today."
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Dashboard" }]}
        actions={
          <>
            <Button variant="outline"><Eye className="mr-2 h-4 w-4" /> Preview site</Button>
            <Button asChild><Link to="/properties/new"><Building2 className="mr-2 h-4 w-4" /> Add Property</Link></Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          const toneBg =
            s.tone === "success" ? "bg-emerald-50 text-emerald-600" :
            s.tone === "warning" ? "bg-amber-50 text-amber-600" :
            s.tone === "danger" ? "bg-rose-50 text-rose-600" :
            "bg-primary/10 text-primary";
          const toneDelta =
            !s.delta ? "text-muted-foreground bg-muted" :
            s.delta.startsWith("-") ? "text-rose-600 bg-rose-50" :
            "text-emerald-600 bg-emerald-50";
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className={"flex h-9 w-9 items-center justify-center rounded-lg " + toneBg}>
                  <Icon className="h-5 w-5" />
                </div>
                {s.delta && <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + toneDelta}>{s.delta}</span>}
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Property Growth</h3>
              <p className="text-xs text-muted-foreground">Total vs Published (last 12 months)</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Live data</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={[]}>
                <defs>
                  <linearGradient id="cA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="var(--primary)" fillOpacity={1} fill="url(#cA)" />
                <Area type="monotone" dataKey="published" stroke="var(--primary)" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold">Category Split</h3>
          <p className="text-xs text-muted-foreground">By listing type</p>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {[]?.map((_: any, index: number) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent + Analytics */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Recent Properties</h3>
            <Button variant="ghost" size="sm" asChild><Link to="/properties">View all</Link></Button>
          </div>
          <div className="divide-y divide-border">
            {recentProperties.map((p: any) => (
              <div key={p._id || p.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden">
                    <img src={p.image || p.thumbnail || ''} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{p.name || p.property_name || 'Unnamed'}</div>
                    <div className="text-xs text-muted-foreground">{p.city || p.location || '—'} · {p.area || ''}</div>
                  </div>
                </div>
                <StatusPill status={p.status || 'Pending'} />
              </div>
            ))}
            {recentProperties.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No recent properties.</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold">Platform Analytics</h3>
          <p className="text-xs text-muted-foreground">Key metrics at a glance</p>
          <div className="mt-4 divide-y divide-border">
            {analytics.map((k) => (
              <div key={k.label} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{k.label}</div>
                  <div className="text-xs text-muted-foreground">{k.meta}</div>
                </div>
                <div className="text-sm font-semibold">{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Pending Approvals</h3>
            <Link to="/properties/pending" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2">Property</th>
                  <th className="py-2">Owner</th>
                  <th className="py-2">City</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p: any) => (
                  <tr key={p._id || p.id} className="border-b border-border/50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image || p.thumbnail || ''} alt="" className="h-9 w-9 rounded-md object-cover" />
                        <div>
                          <div className="font-medium">{p.name || p.property_name || 'Unnamed'}</div>
                          <div className="text-xs text-muted-foreground">{p.category || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">{p.owner_name || p.owner || '—'}</td>
                    <td className="py-3">{p.city || '—'}</td>
                    <td className="py-3"><StatusPill status={p.status || 'Pending'} /></td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">Reject</Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
