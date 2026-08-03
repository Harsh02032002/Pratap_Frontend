import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Star, StarOff, Search, RefreshCw, ChevronLeft, ChevronRight,
  MoreHorizontal, Eye, Pencil, Trash2, Download, Building2, MapPin,
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
import { PROPERTIES, CITIES, CATEGORIES } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/properties/featured")({
  head: () => ({
    meta: [
      { title: "Featured Properties — Roomhy Admin" },
      { name: "description", content: "Manage the properties highlighted on the Roomhy homepage." },
    ],
  }),
  component: FeaturedPropertiesPage,
});

const PAGE_SIZE = 10;

function FeaturedPropertiesPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [featured, setFeatured] = useState<Set<string>>(
    new Set(PROPERTIES.filter((p) => p.featured).map((p) => p.id))
  );
  const [toast, setToast] = useState<string | null>(null);

  const source = PROPERTIES.filter((p) => p.status === "Published");

  const filtered = useMemo(() => {
    return source.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.code.toLowerCase().includes(q.toLowerCase())) return false;
      if (city !== "All" && p.city !== city) return false;
      if (category !== "All" && p.category !== category) return false;
      return true;
    });
  }, [q, city, category, source]);

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

  const toggleFeature = (id: string) => {
    const f = new Set(featured);
    const wasFeatured = f.has(id);
    wasFeatured ? f.delete(id) : f.add(id);
    setFeatured(f);
    const name = PROPERTIES.find((p) => p.id === id)?.name;
    setToast(wasFeatured ? `"${name}" removed from featured` : `"${name}" marked as featured`);
    setTimeout(() => setToast(null), 2500);
  };

  const bulkFeature = () => {
    const f = new Set(featured);
    selected.forEach((id) => f.add(id));
    setFeatured(f);
    setToast(`${selected.size} properties featured`);
    setSelected(new Set());
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-lg text-amber-800">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <PageHeader
        title="Featured Properties"
        subtitle={`${featured.size} featured · ${source.length} published total`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Property Management" }, { label: "Featured Properties" }]}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
            {selected.size > 0 && (
              <Button size="sm" onClick={bulkFeature}>
                <Star className="mr-2 h-4 w-4" /> Feature {selected.size} Selected
              </Button>
            )}
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Featured", value: featured.size, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Published Properties", value: source.length, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Featured Rate", value: `${Math.round((featured.size / Math.max(source.length, 1)) * 100)}%`, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search properties…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={city} onValueChange={(v) => { setCity(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Cities</SelectItem>
              {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setCity("All"); setCategory("All"); setPage(1); }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
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
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Occupancy</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id} className={`border-b border-border/60 transition-colors ${featured.has(p.id) ? "bg-amber-50/40 hover:bg-amber-50/60" : "hover:bg-muted/20"}`}>
                  <td className="px-4 py-3"><Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-10 w-10 rounded-md object-cover ring-1 ring-border" />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.code} · {p.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{p.city}</div>
                    <div className="text-xs text-muted-foreground pl-5">{p.area}</div>
                  </td>
                  <td className="px-4 py-3">{p.owner}</td>
                  <td className="px-4 py-3 font-medium">₹{p.price.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {p.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${p.occupancy}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{p.occupancy}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFeature(p.id)}
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        featured.has(p.id)
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-muted text-muted-foreground hover:bg-amber-50 hover:text-amber-700"
                      }`}
                    >
                      {featured.has(p.id)
                        ? <><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Featured</>
                        : <><StarOff className="h-3 w-3" /> Feature</>
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-sm text-muted-foreground">
                    <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                    No properties match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((n) => (
              <Button key={n} variant={n === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setPage(n)}>{n}</Button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}