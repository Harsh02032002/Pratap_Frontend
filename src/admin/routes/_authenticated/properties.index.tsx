import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Building2, Download, Upload, Filter, Plus, RefreshCw, Search, MoreHorizontal,
  Eye, Pencil, Copy, Archive, Trash2, Star, CheckCircle2, XCircle, BarChart3,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/status-pill";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/properties/")(({
  head: () => ({
    meta: [
      { title: "All Properties — Roomhy Admin" },
      { name: "description", content: "Browse, filter and manage every property on Roomhy." },
    ],
  }),
  component: PropertiesPage,
} as any));

const STATUSES = ["All", "Published", "Pending", "Draft", "Rejected", "Expired", "approved", "live"];
const CATEGORIES = [
  "Boys PG", "Girls PG", "Co-ed PG", "Co-living", "Hostel",
  "Studio Apartment", "1 BHK", "2 BHK", "3 BHK", "Shared Room",
  "Private Room", "Executive PG", "Student Hostel", "Working Women PG",
  "Luxury PG", "Budget PG", "Villa", "Independent House", "Serviced Apartment", "Deluxe Room",
];
const PAGE_SIZE = 10;

interface PropertyRow {
  id: string;
  code: string;
  name: string;
  image: string;
  category: string;
  city: string;
  area: string;
  owner: string;
  price: number;
  totalRooms: number;
  availableRooms: number;
  occupancy: number;
  rating: number;
  status: string;
  featured: boolean;
  updatedAt: string;
}

function mapProperty(p: any, i: number): PropertyRow {
  const totalRooms = p.totalRooms || p.roomCount || p.rooms?.length || 0;
  const available = p.availableRooms || p.vacantRooms || 0;
  const occupied = totalRooms - available;

  // Status mapping — same logic as reference panel TotalProperties.jsx
  let status = "Pending";
  if (p.isLiveOnWebsite) status = "Published";
  else if (p.status === "active" || p.status === "Published" || p.status === "live" || p.status === "approved") status = "Published";
  else if (p.status === "blocked" || p.status === "Rejected" || p.status === "rejected") status = "Rejected";
  else if (p.status === "inactive" || p.status === "Inactive") status = "Inactive";
  else if (p.status === "Pending" || p.status === "pending") status = "Pending";
  else if (p.status === "Draft" || p.status === "draft") status = "Draft";
  else if (p.status === "Expired" || p.status === "expired") status = "Expired";

  const propId = p.propertyId || p.visitId || (p.locationCode && p.locationCode !== 'GEN' ? p.locationCode : null) || `PROP-${(p._id || '').slice(-4).toUpperCase()}`;

  return {
    id: String(p._id || p.id || i),
    code: propId || p.propertyCode || p.loginId || `RH-${1000 + i}`,
    name: p.title || p.propertyInfo?.name || p.name || p.propertyName || "Unnamed",
    image: p.featuredImage || p.images?.[0] || p.thumbnail || p.coverImage || p.propertyInfo?.images?.[0] || "",
    category: p.category || p.propertyType || p.propertyInfo?.propertyType || p.type || "—",
    city: p.propertyInfo?.city || p.city || p.locationCode || "—",
    area: p.locality || p.propertyInfo?.area || p.area || "—",
    owner: p.owner?.name || p.propertyInfo?.ownerName || p.ownerName || p.contact?.name || "—",
    price: Number(p.monthlyRent || p.rent || p.propertyInfo?.rent || p.roomTypes?.[0]?.pricePerBed || p.price || 0),
    totalRooms,
    availableRooms: available,
    occupancy: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
    rating: Number(p.rating || p.averageRating || 0),
    status,
    featured: !!(p.isFeatured || p.featured),
    updatedAt: p.updatedAt ? String(p.updatedAt).slice(0, 10) : (p.createdAt ? String(p.createdAt).slice(0, 10) : "—"),
  };
}

function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState<string>("All");
  const [category, setCategory] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProperties();
    loadCities();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      // Same endpoint as reference panel (localhost:5173/superadmin/total-properties)
      const res = await api.get(`/api/properties?limit=5000&t=${Date.now()}`).catch(() => null);
      let list: any[] = [];
      if (res) {
        const d = res.data || res;
        // Reference panel expects { success, properties: [...] }
        if (d.success && Array.isArray(d.properties)) {
          list = d.properties;
        } else if (Array.isArray(d)) {
          list = d;
        } else if (Array.isArray(d.data)) {
          list = d.data;
        }
      }
      // Fallback: approved-properties if nothing came from /api/properties
      if (list.length === 0) {
        const res2 = await api.get('/api/approved-properties/all?limit=500').catch(() => null);
        if (res2) {
          const d2 = res2.data || res2;
          list = Array.isArray(d2.properties) ? d2.properties : (Array.isArray(d2) ? d2 : []);
        }
      }
      setProperties(
        list.map(mapProperty).filter((p) => {
          const n = p.name.toLowerCase().trim();
          return n && n !== 'unnamed' && n !== 'undefined' && n !== '-' && n !== '—';
        })
      );
    } catch (err) {
      console.error("Failed to load properties:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      const res = await api.get('/api/locations/cities').catch(() => null);
      if (res) {
        const list = res.data || res || [];
        setCities((Array.isArray(list) ? list : []).map((c: any) => c.name || c).filter(Boolean));
      }
    } catch (_) {}
  };

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q.toLowerCase()) || p.code.toLowerCase().includes(q.toLowerCase()))) return false;
      if (city !== "All" && p.city !== city) return false;
      if (category !== "All" && p.category !== category) return false;
      if (status !== "All") {
        const s = status.toLowerCase();
        const ps = (p.status || "").toLowerCase();
        if (s === "published" && !["published", "approved", "live"].includes(ps)) return false;
        else if (s !== "published" && ps !== s) return false;
      }
      return true;
    });
  }, [properties, q, city, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allChecked = paged.length > 0 && paged.every((p) => selected.has(p.id));

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    const s = new Set(selected);
    if (allChecked) paged.forEach((p) => s.delete(p.id));
    else paged.forEach((p) => s.add(p.id));
    setSelected(s);
  };

  const isPublished = (p: PropertyRow) => ["published", "approved", "live"].includes((p.status || "").toLowerCase());

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Properties"
        subtitle={`${filtered.length} properties · showing page ${page} of ${totalPages}`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Property Management" }, { label: "All Properties" }]}
        actions={
          <>
            <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" /> Import</Button>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
            <Button asChild size="sm"><Link to="/properties/new"><Plus className="mr-2 h-4 w-4" /> Add Property</Link></Button>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {[
          { l: "Total", v: loading ? "…" : properties.length, c: "text-primary" },
          { l: "Published", v: loading ? "…" : properties.filter(p => isPublished(p)).length, c: "text-emerald-600" },
          { l: "Pending", v: loading ? "…" : properties.filter(p => (p.status || "").toLowerCase() === "pending").length, c: "text-amber-600" },
          { l: "Draft", v: loading ? "…" : properties.filter(p => (p.status || "").toLowerCase() === "draft").length, c: "text-slate-600" },
          { l: "Featured", v: loading ? "…" : properties.filter(p => p.featured).length, c: "text-primary" },
          { l: "Expired", v: loading ? "…" : properties.filter(p => (p.status || "").toLowerCase() === "expired").length, c: "text-rose-600" },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-border bg-card p-3">
            <div className="text-xs text-muted-foreground">{k.l}</div>
            <div className={"mt-1 text-xl font-bold " + k.c}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or ID…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={city} onValueChange={(v) => { setCity(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Cities</SelectItem>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{STATUSES.slice(0, 6).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> More filters</Button>
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setCity("All"); setCategory("All"); setStatus("All"); setPage(1); }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
        {selected.size > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-md bg-primary/5 px-3 py-2 text-sm">
            <span className="font-medium text-primary">{selected.size} selected</span>
            <Button size="sm" variant="outline"><CheckCircle2 className="mr-1 h-4 w-4" /> Approve</Button>
            <Button size="sm" variant="outline"><Star className="mr-1 h-4 w-4" /> Feature</Button>
            <Button size="sm" variant="outline"><Archive className="mr-1 h-4 w-4" /> Archive</Button>
            <Button size="sm" variant="outline" className="text-destructive"><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">City / Area</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Rooms</th>
                <th className="px-4 py-3">Occupancy</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary/40" />
                    Loading properties from database…
                  </td>
                </tr>
              ) : paged.map((p) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3"><Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt="" className="h-10 w-10 rounded-md object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center"><Building2 className="h-5 w-5 text-muted-foreground/40" /></div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 font-medium">
                          {p.name}
                          {p.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3"><div>{p.city}</div><div className="text-xs text-muted-foreground">{p.area}</div></td>
                  <td className="px-4 py-3">{p.owner}</td>
                  <td className="px-4 py-3 font-medium">{p.price > 0 ? `₹${p.price.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3">{p.availableRooms}/{p.totalRooms}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${p.occupancy}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{p.occupancy}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.rating > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {p.rating}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.updatedAt}</td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem><BarChart3 className="mr-2 h-4 w-4" /> Analytics</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem><Star className="mr-2 h-4 w-4" /> Feature</DropdownMenuItem>
                        <DropdownMenuItem><CheckCircle2 className="mr-2 h-4 w-4" /> Approve</DropdownMenuItem>
                        <DropdownMenuItem><XCircle className="mr-2 h-4 w-4" /> Reject</DropdownMenuItem>
                        <DropdownMenuItem><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {!loading && paged.length === 0 && (
                <tr><td colSpan={12} className="py-16 text-center text-sm text-muted-foreground">
                  <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                  No properties match the current filters.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((n) => (
              <Button key={n} variant={n === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setPage(n)}>{n}</Button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}