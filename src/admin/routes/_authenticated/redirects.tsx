import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRightLeft, Plus, Pencil, Trash2, Search, Check, X, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/redirects")({
  head: () => ({
    meta: [
      { title: "Redirects — Roomhy Admin" },
      { name: "description", content: "Manage 301 / 302 URL redirects." },
    ],
  }),
  component: RedirectsPage,
});

interface Redirect {
  id: string;
  from: string;
  to: string;
  type: "301" | "302";
  active: boolean;
  hits: number;
  createdAt: string;
}

const INIT_REDIRECTS: Redirect[] = [
  { id: "r1", from: "/pg-in-kota", to: "/kota", type: "301", active: true, hits: 1240, createdAt: "2025-01-15" },
  { id: "r2", from: "/hostel-jaipur", to: "/jaipur/hostel", type: "301", active: true, hits: 876, createdAt: "2025-02-01" },
  { id: "r3", from: "/old-listings", to: "/properties", type: "302", active: true, hits: 432, createdAt: "2025-03-10" },
  { id: "r4", from: "/rooms-delhi", to: "/delhi/rooms", type: "301", active: false, hits: 218, createdAt: "2025-04-05" },
  { id: "r5", from: "/mumbai-pg-2024", to: "/mumbai", type: "301", active: true, hits: 654, createdAt: "2025-05-20" },
  { id: "r6", from: "/beta-search", to: "/search", type: "302", active: true, hits: 89, createdAt: "2025-06-01" },
];

function RedirectsPage() {
  const [items, setItems] = useState<Redirect[]>(INIT_REDIRECTS);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Redirect | null>(null);
  const [form, setForm] = useState({ from: "", to: "", type: "301" as "301" | "302" });
  const [toast, setToast] = useState<string | null>(null);

  const filtered = items.filter((r) => {
    if (q && !r.from.includes(q) && !r.to.includes(q)) return false;
    if (typeFilter !== "All" && r.type !== typeFilter) return false;
    return true;
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
  const openAdd = () => { setForm({ from: "", to: "", type: "301" }); setEditing(null); setShowForm(true); };
  const openEdit = (r: Redirect) => { setForm({ from: r.from, to: r.to, type: r.type }); setEditing(r); setShowForm(true); };
  const handleSave = () => {
    if (!form.from.trim() || !form.to.trim()) return;
    if (editing) {
      setItems((prev) => prev.map((r) => r.id === editing.id ? { ...r, ...form } : r));
      showToast("Redirect updated");
    } else {
      setItems((prev) => [...prev, { id: `r-${Date.now()}`, ...form, active: true, hits: 0, createdAt: new Date().toISOString().slice(0, 10) }]);
      showToast("Redirect created");
    }
    setShowForm(false);
  };
  const handleDelete = (id: string) => { setItems((prev) => prev.filter((r) => r.id !== id)); showToast("Redirect deleted"); };
  const toggleActive = (id: string) => setItems((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r));

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Redirects"
        subtitle={`${items.length} redirects · ${items.filter((r) => r.active).length} active`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "SEO Management" }, { label: "Redirects" }]}
        actions={<Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Redirect</Button>}
      />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Redirects", value: items.length, color: "text-primary" },
          { label: "Active", value: items.filter((r) => r.active).length, color: "text-emerald-600" },
          { label: "301 Permanent", value: items.filter((r) => r.type === "301").length, color: "text-blue-600" },
          { label: "Total Hits", value: items.reduce((a, r) => a + r.hits, 0).toLocaleString(), color: "text-violet-600" },
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
            <Input placeholder="Search URLs…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="301">301 Permanent</SelectItem>
              <SelectItem value="302">302 Temporary</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setTypeFilter("All"); }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">From URL</th>
              <th className="px-4 py-3">To URL</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Hits</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={`border-b border-border/60 transition-colors ${r.active ? "hover:bg-muted/20" : "opacity-50 hover:bg-muted/10"}`}>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.from}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-mono text-xs">{r.to}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.type === "301" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-4 py-3">{r.hits.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.createdAt}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(r.id)}
                    className={`flex h-5 w-9 rounded-full transition-colors ${r.active ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white shadow my-auto mx-0.5 transition-transform ${r.active ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                <ArrowRightLeft className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                No redirects found.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? "Edit Redirect" : "Add Redirect"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">From URL <span className="text-destructive">*</span></label>
                <Input placeholder="/old-page-path" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">To URL <span className="text-destructive">*</span></label>
                <Input placeholder="/new-page-path" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Redirect Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "301" | "302" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="301">301 — Permanent</SelectItem>
                    <SelectItem value="302">302 — Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={!form.from.trim() || !form.to.trim()} onClick={handleSave}><Check className="mr-2 h-4 w-4" /> {editing ? "Save" : "Create"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}