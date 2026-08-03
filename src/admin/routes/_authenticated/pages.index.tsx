import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, ExternalLink, RefreshCw, X, Check, Trash2 } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/pages/")({
  head: () => ({
    meta: [
      { title: "Pages — Roomhy Admin" },
      { name: "description", content: "Manage all static and dynamic pages on Roomhy." },
    ],
  }),
  component: PagesList,
});

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  updated: string;
}

function PagesList() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PageItem | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', seoTitle: '', seoDescription: '' });
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPages(); }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/seo/pages');
      const list = data.data || data || [];
      const mapped: PageItem[] = list.map((p: any) => ({
        id: p.pageKey || p._id || String(Math.random()),
        title: p.title || p.pageKey || 'Untitled',
        slug: p.path || p.slug || '/',
        status: p.status || (p.published ? 'Published' : 'Draft'),
        updated: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      setPages(mapped);
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', slug: '', content: '', seoTitle: '', seoDescription: '' });
    setShowForm(true);
  };

  const openEdit = (p: PageItem) => {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, content: '', seoTitle: '', seoDescription: '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      showToast('Title and slug are required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        pageName: form.title,
        slug: form.slug.startsWith('/') ? form.slug : `/${form.slug}`,
        ...(form.content ? { content: form.content } : {}),
        ...(form.seoTitle ? { seo: { title: form.seoTitle, description: form.seoDescription } } : {}),
      };

      if (editing) {
        await api.put(`/api/seo/pages/${encodeURIComponent(editing.id)}`, payload);
        showToast('Page updated');
      } else {
        await api.post('/api/seo/pages/register', payload);
        showToast('Page created');
      }
      setShowForm(false);
      loadPages();
    } catch (err: any) {
      showToast(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    try {
      await api.delete(`/api/seo/pages/${encodeURIComponent(id)}`);
      setPages((prev) => prev.filter((p) => p.id !== id));
      showToast('Page deleted');
    } catch (err: any) {
      showToast(err.message || 'Delete failed');
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
        title="Pages"
        subtitle={`${pages.length} pages · Manage everything that renders on roomhy.com`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Content Management" }, { label: "Pages" }]}
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add New Page
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading pages…</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.slug}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{p.updated}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link to={p.slug.startsWith('/') ? p.slug : `/${p.slug}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No pages found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? 'Edit Page' : 'Add New Page'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Page Title <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. About Us" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">URL Slug <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. about-us or /about-us" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                <p className="mt-1 text-xs text-muted-foreground">This will be the live URL path on roomhy.com</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Page Content (HTML)</label>
                <textarea placeholder="<p>Your page content here...</p>" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[120px]" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">SEO Title</label>
                <Input placeholder="SEO title" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">SEO Description</label>
                <Input placeholder="Meta description" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={saving || !form.title.trim() || !form.slug.trim()} onClick={handleSave}>
                {saving ? 'Saving…' : <><Check className="mr-2 h-4 w-4" /> {editing ? 'Update' : 'Create'}</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
