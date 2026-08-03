import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarX, RefreshCcw, Archive, Search, RefreshCw,
  ChevronLeft, ChevronRight, MoreHorizontal, Eye, Trash2,
  Building2, MapPin, Download, AlertTriangle,
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

export const Route = createFileRoute("/_authenticated/properties/expired")({
  head: () => ({
    meta: [
      { title: "Expired Properties — Roomhy Admin" },
      { name: "description", content: "Listings past their expiry that need renewal." },
    ],
  }),
  component: ExpiredPropertiesPage,
});

const EXPIRED = PROPERTIES.filter((p) => p.status === "Expired");
const PAGE_SIZE = 10;

function ExpiredPropertiesPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const filtered = useMemo(() => {
    return EXPIRED.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.code.toLowerCase().includes(q.toLowerCase())) return false;
      if (city !== "All" && p.city !== city) return false;
      if (category !== "All" && p.category !== category) return false;
      return true;
    });
  }, [q, city, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allChecked = paged.length > 0 && paged.every((p) => selected.has(p.id));
  const toggle = (id: string) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };
  const toggleAll = () => {
    const s = new Set(selected);
    if (allChecked) paged.forEach((p) => s.delete(p.id));
    else paged.forEach((p) => s.add(p.id));
    setSelected(s);
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-lg text-sm font-medium ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {toast.ok ? <RefreshCcw className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <PageHeader
        title="Expired Properties"
        subtitle={`${EXPIRED.length} expired listings needing attention`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Property Management" }, { label: "Expired Properties" }]}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
            {selected.size > 0 && (
              <>
                <Button size="sm" onClick={() => { showToast(`${selected.size} properties renewed`); setSelected(new Set()); }}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Renew {selected.size}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { showToast(`${selected.size} properties archived`, false); setSelected(new Set()); }}>
                  <Archive className="mr-2 h-4 w-4" /> Archive {selected.size}
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Expired", value: EXPIRED.length, color: "text-zinc-600" },
          { label: "Expired This Month", value: Math.floor(EXPIRED.length * 0.4), color: "text-rose-600" },
          { label: "Avg. Days Expired", value: "14d", color: "text-orange-600" },
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
            <Input placeholder="Search expired properties…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
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
                <th className="px-4 py-3">Rooms</th>
                <th className="px-4 py-3">Expired On</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3"><Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-10 w-10 rounded-md object-cover opacity-70 ring-1 ring-border" />
                      <div>
                        <div className="font-medium text-foreground">{p.name}</div>
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
                  <td className="px-4 py-3">{p.availableRooms}/{p.totalRooms}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-rose-600">
                      <CalendarX className="h-3.5 w-3.5" /> {p.updatedAt}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                        onClick={() => showToast(`"${p.name}" renewed`)}>
                        <RefreshCcw className="mr-1 h-3.5 w-3.5" /> Renew
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> Preview</DropdownMenuItem>
                          <DropdownMenuItem><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-sm text-muted-foreground">
                    <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                    No expired properties match the filters.
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