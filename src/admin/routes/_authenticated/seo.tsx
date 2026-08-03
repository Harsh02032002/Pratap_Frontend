import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search as SearchIcon, TrendingUp, Globe, Pencil, Check, X, RefreshCw,
  ChevronLeft, ChevronRight, BarChart3, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/seo")({
  head: () => ({
    meta: [
      { title: "SEO Pages — Roomhy Admin" },
      { name: "description", content: "Manage SEO settings for every page." },
    ],
  }),
  component: SeoPage,
});

interface SeoEntry {
  id: string;
  page: string;
  slug: string;
  title: string;
  description: string;
  score: number;
  status: "Excellent" | "Good" | "Needs Work" | "Missing";
  lastUpdated: string;
}

const PAGE_SIZE = 8;

function SeoPage() {
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<SeoEntry | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSeo(); }, []);

  const loadSeo = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/seo/pages');
      const list = data.data || data || [];
      const mapped: SeoEntry[] = list.map((p: any) => ({
        id: p.pageKey || p._id || String(Math.random()),
        page: p.title || p.pageKey || 'Untitled',
        slug: p.path || p.slug || '/',
        title: p.seo?.title || p.title || '',
        description: p.seo?.description || p.description || '',
        score: p.seo?.score || (p.title && p.description ? 80 : 30),
        status: (p.seo?.score || (p.title && p.description ? 80 : 30)) >= 80 ? 'Excellent' : (p.title || p.description) ? 'Good' : 'Missing',
        lastUpdated: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      setEntries(mapped);
    } catch (err) {
      console.error('Failed to load SEO pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = entries.filter((e) => {
    if (q && !e.page.toLowerCase().includes(q.toLowerCase()) && !e.slug.includes(q.toLowerCase())) return false;
    if (statusFilter !== "All" && e.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
  const openEdit = (entry: SeoEntry) => {
    setEditing(entry);
    setForm({ title: entry.title, description: entry.description });
  };
  const handleSave = async () => {
    if (!editing) return;
    try {
      await api.put(`/api/seo/pages/${encodeURIComponent(editing.id)}`, {
        seo: { title: form.title, description: form.description }
      });
      setEntries((prev) => prev.map((e) => e.id === editing.id ? { ...e, ...form, lastUpdated: new Date().toISOString().split('T')[0] } : e));
      showToast('SEO updated');
      setEditing(null);
    } catch (err: any) {
      showToast(err.message || 'Save failed');
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="SEO Pages"
        subtitle={`${entries.length} pages · Manage slugs, titles and meta descriptions`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Content Management" }, { label: "SEO Pages" }]}
        actions={<Button size="sm" onClick={() => { }}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading SEO pages…</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Pages", value: entries.length, color: "text-primary" },
              { label: "Excellent", value: entries.filter(e => e.status === 'Excellent').length, color: "text-emerald-600" },
              { label: "Needs Work", value: entries.filter(e => e.status === 'Needs Work' || e.status === 'Missing').length, color: "text-rose-600" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search pages or slugs…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All statuses</SelectItem>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Needs Work">Needs Work</SelectItem>
                <SelectItem value="Missing">Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Page</th>
                  <th className="px-4 py-3">Slug / URL Path</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-medium">{entry.page}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{entry.slug}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{entry.title || '—'}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{entry.description || '—'}</td>
                    <td className="px-4 py-3">{entry.score}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${entry.status === 'Excellent' ? 'bg-emerald-50 text-emerald-700' : entry.status === 'Good' ? 'bg-blue-50 text-blue-700' : entry.status === 'Needs Work' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entry)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No pages found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1).reduce((acc, n, idx, arr) => { if (idx > 0 && n - arr[idx - 1] > 1) acc.push("..."); acc.push(n); return acc; }, [] as any[]).map((n, i) => n === "..." ? <span key={`e-${i}`} className="px-1 text-muted-foreground">…</span> : <button key={n} onClick={() => setPage(n as number)} className={`h-8 w-8 rounded-lg text-xs font-semibold border ${page === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-card border-border hover:bg-muted'}`}>{n}</button>)}
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Edit SEO — {editing.page}</h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Slug / URL Path</label>
                <Input value={editing.slug} disabled className="bg-muted" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Meta Title</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter SEO title" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Meta Description</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Enter meta description" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={handleSave}><Check className="mr-2 h-4 w-4" /> Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
