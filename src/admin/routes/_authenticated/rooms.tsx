import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BedDouble, Plus, Search, RefreshCw, ChevronLeft, ChevronRight,
  MoreHorizontal, Pencil, Trash2, Building2, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/PageHeader";
import { PROPERTIES } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms Management — Roomhy Admin" },
      { name: "description", content: "Manage room types, occupancy and pricing." },
    ],
  }),
  component: RoomsPage,
});

const ROOM_TYPES = ["Single", "Double", "Triple", "Dormitory", "Private", "Shared", "Deluxe", "Suite"];
const PAGE_SIZE = 10;

interface Room {
  id: string;
  propertyId: string;
  propertyName: string;
  type: string;
  capacity: number;
  occupied: number;
  price: number;
  amenities: string[];
  status: "Available" | "Full" | "Maintenance";
}

const ROOMS: Room[] = PROPERTIES.flatMap((p, pi) =>
  Array.from({ length: 2 + (pi % 3) }, (_, ri) => {
    const type = ROOM_TYPES[(pi + ri) % ROOM_TYPES.length];
    const capacity = 1 + ((pi + ri) % 4);
    const occupied = Math.floor(Math.random() * (capacity + 1));
    return {
      id: `r-${pi}-${ri}`,
      propertyId: p.id,
      propertyName: p.name,
      type,
      capacity,
      occupied: Math.min(occupied, capacity),
      price: 3000 + ((pi * 17 + ri * 11) % 8000),
      amenities: ["WiFi", "AC", "RO Water"].slice(0, 1 + (ri % 3)),
      status: occupied >= capacity ? "Full" : occupied === capacity - 1 ? "Available" : "Available",
    } as Room;
  })
).slice(0, 80);

function RoomsPage() {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "Single", capacity: "2", price: "", amenities: "" });
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() =>
    ROOMS.filter((r) => {
      if (q && !r.propertyName.toLowerCase().includes(q.toLowerCase()) && !r.type.toLowerCase().includes(q.toLowerCase())) return false;
      if (typeFilter !== "All" && r.type !== typeFilter) return false;
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      return true;
    }), [q, typeFilter, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allChecked = paged.length > 0 && paged.every((r) => selected.has(r.id));
  const toggle = (id: string) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };
  const toggleAll = () => {
    const s = new Set(selected);
    if (allChecked) paged.forEach((r) => s.delete(r.id));
    else paged.forEach((r) => s.add(r.id));
    setSelected(s);
  };

  const handleAdd = () => {
    if (!form.price) return;
    setToast(`Room "${form.type}" added successfully`);
    setShowForm(false);
    setForm({ type: "Single", capacity: "2", price: "", amenities: "" });
    setTimeout(() => setToast(null), 2500);
  };

  const statusColor: Record<string, string> = {
    Available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Full: "bg-rose-50 text-rose-700 ring-rose-200",
    Maintenance: "bg-amber-50 text-amber-700 ring-amber-200",
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-lg text-emerald-800 text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Rooms Management"
        subtitle={`${ROOMS.length} rooms across ${PROPERTIES.length} properties`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Property Management" }, { label: "Rooms" }]}
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Room
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Rooms", value: ROOMS.length, color: "text-primary" },
          { label: "Available", value: ROOMS.filter((r) => r.status === "Available").length, color: "text-emerald-600" },
          { label: "Full", value: ROOMS.filter((r) => r.status === "Full").length, color: "text-rose-600" },
          { label: "Avg. Price", value: `₹${Math.round(ROOMS.reduce((a, r) => a + r.price, 0) / ROOMS.length).toLocaleString("en-IN")}`, color: "text-blue-600" },
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
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by property or room type…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Room Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              {ROOM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Full">Full</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setTypeFilter("All"); setStatusFilter("All"); setPage(1); }}>
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
                <th className="px-4 py-3">Room Type</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Occupancy</th>
                <th className="px-4 py-3">Price/mo</th>
                <th className="px-4 py-3">Amenities</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3"><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} /></td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.propertyName}</div>
                    <div className="text-xs text-muted-foreground">{r.propertyId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <BedDouble className="h-3 w-3" /> {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.capacity} persons</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(r.occupied / r.capacity) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{r.occupied}/{r.capacity}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">₹{r.price.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.amenities.map((a) => <span key={a} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{a}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusColor[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={9} className="py-16 text-center text-sm text-muted-foreground">
                  <BedDouble className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                  No rooms match the current filters.
                </td></tr>
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

      {/* Add Room Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Add New Room</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Room Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROOM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Capacity (persons)</label>
                <Input type="number" min={1} max={20} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Monthly Price (₹) <span className="text-destructive">*</span></label>
                <Input type="number" placeholder="e.g. 6500" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Amenities (comma-separated)</label>
                <Input placeholder="WiFi, AC, RO Water" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={!form.price} onClick={handleAdd}><Check className="mr-2 h-4 w-4" /> Add Room</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}