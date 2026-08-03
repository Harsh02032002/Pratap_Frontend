import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  PenSquare, Plus, Pencil, Trash2, Search, Check, X, Eye,
  ChevronLeft, ChevronRight, Calendar, User, Upload, RefreshCw, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/status-pill";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/blogs")({
  head: () => ({
    meta: [
      { title: "Blog Management — Roomhy Admin" },
      { name: "description", content: "Manage blog articles and content." },
    ],
  }),
  component: BlogsPage,
});

const BLOG_CATS = ["PG Guide", "City Guide", "Tenant Tips", "Owner Tips", "News", "Lifestyle", "General"];

interface Blog {
  id: string;
  title: string;
  category: string;
  author: string;
  coverImage: string;
  status: string;
  views: number;
  date: string;
  slug: string;
  excerpt: string;
  featured: boolean;
}

const PAGE_SIZE = 8;

function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState({
    title: "", excerpt: "", category: BLOG_CATS[0], author: "Roomhy Team",
    status: "draft", featured: false, metaTitle: "", metaDescription: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadBlogs(); }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/blogs/admin/all?limit=200');
      const list = data.data || [];
      setBlogs(list.map((b: any) => ({
        id: String(b._id),
        title: b.title || '',
        category: b.category || 'General',
        author: b.author || 'Roomhy Team',
        coverImage: b.coverImage || '',
        status: b.status || 'draft',
        views: b.views || 0,
        date: b.publishedAt ? new Date(b.publishedAt).toISOString().slice(0, 10) : new Date(b.createdAt).toISOString().slice(0, 10),
        slug: b.slug || '',
        excerpt: b.excerpt || '',
        featured: b.featured || false,
      })));
    } catch (err) {
      console.error('Failed to load blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = blogs.filter(b => {
    if (q && !b.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (catFilter !== "All" && b.category !== catFilter) return false;
    if (statusFilter !== "All" && b.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const openAdd = () => {
    setForm({ title: "", excerpt: "", category: BLOG_CATS[0], author: "Roomhy Team", status: "draft", featured: false, metaTitle: "", metaDescription: "" });
    setCoverFile(null); setCoverPreview(""); setEditing(null); setShowForm(true);
  };
  const openEdit = (b: Blog) => {
    setForm({ title: b.title, excerpt: b.excerpt, category: b.category, author: b.author, status: b.status, featured: b.featured, metaTitle: "", metaDescription: "" });
    setCoverPreview(b.coverImage || ""); setCoverFile(null); setEditing(b); setShowForm(true);
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));
      if (coverFile) formData.append('coverImage', coverFile);

      const token = localStorage.getItem('roomhy_admin_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://roohmy-backend-6q6z.vercel.app';
      const url = editing ? `${apiBase}/api/blogs/${editing.id}` : `${apiBase}/api/blogs`;
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Save failed');

      showToast(editing ? "Blog updated" : "Blog created");
      setShowForm(false);
      loadBlogs();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog?')) return;
    try {
      await api.delete(`/api/blogs/${id}`);
      showToast("Blog deleted");
      setBlogs(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const statusColor: Record<string, string> = {
    published: "text-emerald-600",
    draft: "text-slate-500",
    archived: "text-red-500",
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Blog Management"
        subtitle={`${blogs.length} articles · ${blogs.filter(b => b.status === "published").length} published`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Content" }, { label: "Blog" }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadBlogs}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" />New Article</Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: blogs.length, color: "text-primary" },
          { label: "Published", value: blogs.filter(b => b.status === "published").length, color: "text-emerald-600" },
          { label: "Draft", value: blogs.filter(b => b.status === "draft").length, color: "text-slate-500" },
          { label: "Total Views", value: blogs.reduce((a, b) => a + b.views, 0).toLocaleString("en-IN"), color: "text-blue-600" },
        ].map(k => (
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
            <Input placeholder="Search articles…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={catFilter} onValueChange={v => { setCatFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {BLOG_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Blog Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading blogs…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paged.map(b => (
            <div key={b.id} className="group overflow-hidden rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
              <div className="relative h-40 overflow-hidden bg-muted">
                {b.coverImage ? (
                  <img src={b.coverImage} alt={b.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center"><PenSquare className="h-8 w-8 text-muted-foreground/30" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-2 left-2">
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">{b.category}</span>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  {b.featured && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                  <span className={`text-[10px] font-semibold capitalize rounded-full px-2 py-0.5 ${b.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{b.status}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{b.title}</h3>
                {b.excerpt && <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{b.excerpt}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{b.author}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{b.date}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{b.views.toLocaleString()}</span>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(b)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                </div>
              </div>
            </div>
          ))}
          {paged.length === 0 && (
            <div className="col-span-3 py-16 text-center text-sm text-muted-foreground">
              <PenSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              No articles found.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
              <Button key={n} variant={n === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setPage(n)}>{n}</Button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl my-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? "Edit Article" : "New Article"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Top 5 PGs in Bangalore" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Excerpt / Summary</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3} placeholder="Short description…"
                  value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Category</label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BLOG_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Status</label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Author</label>
                <Input placeholder="e.g. Roomhy Team" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Cover Image</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border p-3 hover:border-primary/50 transition-colors"
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="preview" className="h-12 w-20 object-cover rounded" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">{coverFile ? coverFile.name : "Click to upload cover image"}</span>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="rounded" />
                Mark as Featured
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={!form.title.trim() || saving} onClick={handleSave}>
                {saving ? "Saving…" : <><Check className="mr-2 h-4 w-4" />{editing ? "Save" : "Create"}</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}