import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Image, Upload, Search, Trash2, X, Check, Grid3X3, List,
  FileImage, Video, RefreshCw, Copy, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => ({
    meta: [
      { title: "Media Library — Roomhy Admin" },
      { name: "description", content: "Central library of images, videos and documents." },
    ],
  }),
  component: MediaPage,
});

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  resourceType: string;
  format: string;
  size: number;
  width: number;
  height: number;
  altText: string;
  caption: string;
  tags: string[];
  uploadedAt: string;
}

const FOLDERS = ["roomhy/media", "roomhy/blogs", "roomhy/testimonials", "roomhy/banners", "roomhy/amenity-icons"];

function formatSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [folderFilter, setFolderFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [editForm, setEditForm] = useState({ altText: "", caption: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadMedia(); }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '200' });
      if (typeFilter !== 'all') params.set('resourceType', typeFilter);
      if (folderFilter !== 'all') params.set('folder', folderFilter);
      if (q) params.set('q', q);
      const data = await api.get(`/api/media?${params}`);
      const list = data.data || [];
      setItems(list.map((m: any) => ({
        id: String(m._id),
        filename: m.filename || m.originalName || 'file',
        originalName: m.originalName || '',
        url: m.url || '',
        resourceType: m.resourceType || 'image',
        format: m.format || '',
        size: m.size || 0,
        width: m.width || 0,
        height: m.height || 0,
        altText: m.altText || '',
        caption: m.caption || '',
        tags: m.tags || [],
        uploadedAt: m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN') : '',
      })));
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('folder', folderFilter !== 'all' ? folderFilter : 'roomhy/media');

      const token = localStorage.getItem('roomhy_admin_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://roohmy-backend-6q6z.vercel.app';
      const res = await fetch(`${apiBase}/api/media/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Upload failed');
      showToast(`${files.length} file(s) uploaded`);
      loadMedia();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media?')) return;
    try {
      await api.delete(`/api/media/${id}?deleteFromCloud=true`);
      showToast("Deleted");
      setItems(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} items?`)) return;
    try {
      await api.delete('/api/media/bulk');
      showToast(`${selected.size} items deleted`);
      setItems(prev => prev.filter(m => !selected.has(m.id)));
      setSelected(new Set());
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleSaveMeta = async () => {
    if (!editing) return;
    try {
      await api.patch(`/api/media/${editing.id}`, editForm);
      showToast("Updated");
      setItems(prev => prev.map(m => m.id === editing.id ? { ...m, ...editForm } : m));
      setEditing(null);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); showToast("URL copied!"); };

  const filtered = items.filter(m => {
    if (typeFilter !== 'all' && m.resourceType !== typeFilter) return false;
    if (q && !m.filename.toLowerCase().includes(q.toLowerCase()) && !m.altText.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Media Library"
        subtitle={`${items.length} files · ${formatSize(items.reduce((a, m) => a + m.size, 0))} total`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Content" }, { label: "Media" }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadMedia}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            {selected.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}><Trash2 className="mr-2 h-4 w-4" />Delete ({selected.size})</Button>
            )}
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : "Upload Files"}
            </Button>
            <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.svg" className="hidden" onChange={handleUpload} />
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Files", value: items.length, color: "text-primary" },
          { label: "Images", value: items.filter(m => m.resourceType === 'image').length, color: "text-blue-600" },
          { label: "Videos", value: items.filter(m => m.resourceType === 'video').length, color: "text-purple-600" },
          { label: "Total Size", value: formatSize(items.reduce((a, m) => a + m.size, 0)), color: "text-slate-600" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search files…" value={q} onChange={e => { setQ(e.target.value); loadMedia(); }} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="raw">Documents</SelectItem>
          </SelectContent>
        </Select>
        <Select value={folderFilter} onValueChange={setFolderFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Folder" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            {FOLDERS.map(f => <SelectItem key={f} value={f}>{f.split('/').pop()}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button variant={view === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setView('grid')}><Grid3X3 className="h-4 w-4" /></Button>
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Media Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading media library…</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {filtered.map(m => (
            <div
              key={m.id}
              className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${selected.has(m.id) ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`}
              onClick={() => toggleSelect(m.id)}
            >
              <div className="aspect-square bg-muted">
                {m.resourceType === 'image' ? (
                  <img src={m.url} alt={m.altText || m.filename} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {m.resourceType === 'video' ? <Video className="h-8 w-8 text-muted-foreground/40" /> : <FileImage className="h-8 w-8 text-muted-foreground/40" />}
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="text-[10px] font-medium truncate">{m.filename}</div>
                <div className="text-[10px] text-muted-foreground">{formatSize(m.size)}</div>
              </div>
              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => copyUrl(m.url)} className="rounded-full bg-white/20 p-1.5 hover:bg-white/30"><Copy className="h-3.5 w-3.5 text-white" /></button>
                <a href={m.url} target="_blank" rel="noreferrer" className="rounded-full bg-white/20 p-1.5 hover:bg-white/30"><ExternalLink className="h-3.5 w-3.5 text-white" /></a>
                <button onClick={() => { setEditing(m); setEditForm({ altText: m.altText, caption: m.caption }); }} className="rounded-full bg-white/20 p-1.5 hover:bg-white/30"><Image className="h-3.5 w-3.5 text-white" /></button>
                <button onClick={() => handleDelete(m.id)} className="rounded-full bg-red-500/60 p-1.5 hover:bg-red-500/80"><Trash2 className="h-3.5 w-3.5 text-white" /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-6 py-16 text-center text-sm text-muted-foreground">
              <Image className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              No media files. Upload some!
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">File</th>
                <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Size</th>
                <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Uploaded</th>
                <th className="px-4 py-3 text-right font-medium text-xs text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded overflow-hidden bg-muted shrink-0">
                      {m.resourceType === 'image' ? <img src={m.url} alt="" className="h-full w-full object-cover" /> : <FileImage className="m-auto h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <div className="font-medium truncate max-w-[200px]">{m.filename}</div>
                      {m.altText && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{m.altText}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{m.resourceType}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatSize(m.size)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{m.uploadedAt}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyUrl(m.url)}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Meta Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Edit Media Info</h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            {editing.resourceType === 'image' && (
              <img src={editing.url} alt={editing.altText} className="mb-4 h-32 w-full rounded-lg object-cover" />
            )}
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Alt Text</label>
                <Input placeholder="Describe the image for SEO…" value={editForm.altText} onChange={e => setEditForm({ ...editForm, altText: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Caption</label>
                <Input placeholder="Optional caption…" value={editForm.caption} onChange={e => setEditForm({ ...editForm, caption: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={handleSaveMeta}><Check className="mr-2 h-4 w-4" />Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}