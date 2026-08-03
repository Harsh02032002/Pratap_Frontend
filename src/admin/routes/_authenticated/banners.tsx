import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Megaphone, Plus, Pencil, Trash2, Search, Check, X, Eye, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/status-pill";

export const Route = createFileRoute("/_authenticated/banners")({
  head: () => ({
    meta: [
      { title: "Banner Management — Roomhy Admin" },
      { name: "description", content: "Manage hero and promotional banners." },
    ],
  }),
  component: BannersPage,
});

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  position: string;
  status: string;
  image: string;
  link: string;
  startDate: string;
  endDate: string;
  clicks: number;
  order: number;
}

const POSITIONS = ["Homepage Hero", "Property List Top", "City Page", "Blog Sidebar", "Footer"];
const BANNER_IMGS = [
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
];

const INIT_BANNERS: Banner[] = [
  { id: "b1", title: "Find Your Perfect PG", subtitle: "500+ verified PGs across 20 cities", position: "Homepage Hero", status: "Published", image: BANNER_IMGS[0], link: "/search", startDate: "2025-06-01", endDate: "2025-08-31", clicks: 2341, order: 1 },
  { id: "b2", title: "Co-living Spaces in Bangalore", subtitle: "Premium co-living for professionals", position: "City Page", status: "Published", image: BANNER_IMGS[1], link: "/bangalore/co-living", startDate: "2025-07-01", endDate: "2025-09-30", clicks: 876, order: 2 },
  { id: "b3", title: "Summer Special Offer", subtitle: "Up to 20% off on first month", position: "Property List Top", status: "Draft", image: BANNER_IMGS[2], link: "/offers", startDate: "2025-07-15", endDate: "2025-08-15", clicks: 0, order: 3 },
  { id: "b4", title: "New Cities Added", subtitle: "Now live in Hyderabad & Chennai", position: "Homepage Hero", status: "Published", image: BANNER_IMGS[3], link: "/cities", startDate: "2025-06-15", endDate: "2025-10-31", clicks: 1234, order: 4 },
];

function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>(INIT_BANNERS);
  const [q, setQ] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", position: POSITIONS[0], link: "" });
  const [toast, setToast] = useState<string | null>(null);
  const [preview, setPreview] = useState<Banner | null>(null);

  const filtered = banners.filter((b) => {
    if (q && !b.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (posFilter !== "All" && b.position !== posFilter) return false;
    if (statusFilter !== "All" && b.status !== statusFilter) return false;
    return true;
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
  const openAdd = () => { setForm({ title: "", subtitle: "", position: POSITIONS[0], link: "" }); setEditing(null); setShowForm(true); };
  const openEdit = (b: Banner) => { setForm({ title: b.title, subtitle: b.subtitle, position: b.position, link: b.link }); setEditing(b); setShowForm(true); };
  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editing) {
      setBanners((prev) => prev.map((b) => b.id === editing.id ? { ...b, ...form } : b));
      showToast("Banner updated");
    } else {
      setBanners((prev) => [...prev, { id: `b-${Date.now()}`, ...form, status: "Draft", image: BANNER_IMGS[0], startDate: "", endDate: "", clicks: 0, order: prev.length + 1 }]);
      showToast("Banner created");
    }
    setShowForm(false);
  };
  const handleDelete = (id: string) => { setBanners((prev) => prev.filter((b) => b.id !== id)); showToast("Banner deleted"); };
  const toggleStatus = (id: string) => setBanners((prev) => prev.map((b) => b.id === id ? { ...b, status: b.status === "Published" ? "Draft" : "Published" } : b));

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Banner Management"
        subtitle={`${banners.length} banners · ${banners.filter((b) => b.status === "Published").length} live`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Content Management" }, { label: "Banners" }]}
        actions={<Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Banner</Button>}
      />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Banners", value: banners.length, color: "text-primary" },
          { label: "Live", value: banners.filter((b) => b.status === "Published").length, color: "text-emerald-600" },
          { label: "Total Clicks", value: banners.reduce((a, b) => a + b.clicks, 0).toLocaleString(), color: "text-blue-600" },
          { label: "Positions Used", value: new Set(banners.map((b) => b.position)).size, color: "text-violet-600" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search banners…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={posFilter} onValueChange={setPosFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Position" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Positions</SelectItem>
              {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Published">Live</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
            <div className="relative h-44 overflow-hidden">
              <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20" />
              <div className="absolute inset-0 flex flex-col justify-center px-6">
                <div className="mb-1 text-xl font-bold text-white">{b.title}</div>
                <div className="text-sm text-white/80">{b.subtitle}</div>
              </div>
              <div className="absolute right-3 top-3"><StatusPill status={b.status} /></div>
            </div>
            <div className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  <Megaphone className="h-3 w-3" /> {b.position}
                </span>
                {b.startDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {b.startDate} → {b.endDate}</span>}
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {b.clicks.toLocaleString()} clicks</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <button onClick={() => toggleStatus(b.id)} className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${b.status === "Published" ? "text-amber-700 bg-amber-50 hover:bg-amber-100" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"}`}>
                  {b.status === "Published" ? "Unpublish" : "Go Live"}
                </button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreview(b)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 py-16 text-center text-sm text-muted-foreground">
            <Megaphone className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            No banners found.
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={preview.image} alt={preview.title} className="w-full rounded-xl" />
            <button onClick={() => setPreview(null)} className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? "Edit Banner" : "Add Banner"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title <span className="text-destructive">*</span></label>
                <Input placeholder="Banner headline" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Subtitle</label>
                <Input placeholder="Supporting text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Position</label>
                <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Link URL</label>
                <Input placeholder="/search or https://…" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={!form.title.trim()} onClick={handleSave}><Check className="mr-2 h-4 w-4" /> {editing ? "Save" : "Create"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}