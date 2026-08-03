import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  MessageSquareQuote, Plus, Pencil, Trash2, Search, Check, X, Star, Upload, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — Roomhy Admin" },
      { name: "description", content: "Manage user testimonials shown across Roomhy." },
    ],
  }),
  component: TestimonialsPage,
});

interface Testimonial {
  id: string;
  name: string;
  role: string;
  city: string;
  rating: number;
  text: string;
  status: string;
  avatar: string;
  featured: boolean;
  order: number;
}

const AVATAR_COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-teal-500"];

function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ name: "", role: "Student", city: "", rating: "5", text: "", status: "active", featured: false, order: "0" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadTestimonials(); }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/testimonials/admin/all');
      const list = data.data || [];
      setItems(list.map((t: any) => ({
        id: String(t._id),
        name: t.name || '',
        role: t.role || 'Student',
        city: t.city || '',
        rating: t.rating || 5,
        text: t.text || '',
        status: t.status || 'active',
        avatar: t.avatar || '',
        featured: t.featured || false,
        order: t.order || 0,
      })));
    } catch (err) {
      console.error('Failed to load testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(t => {
    if (q && !t.name.toLowerCase().includes(q.toLowerCase()) && !t.city.toLowerCase().includes(q.toLowerCase())) return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    return true;
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const openAdd = () => {
    setForm({ name: "", role: "Student", city: "", rating: "5", text: "", status: "active", featured: false, order: "0" });
    setAvatarFile(null); setAvatarPreview(""); setEditing(null); setShowForm(true);
  };
  const openEdit = (t: Testimonial) => {
    setForm({ name: t.name, role: t.role, city: t.city, rating: String(t.rating), text: t.text, status: t.status, featured: t.featured, order: String(t.order) });
    setAvatarPreview(t.avatar || ""); setAvatarFile(null); setEditing(t); setShowForm(true);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.text.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));
      if (avatarFile) formData.append('avatar', avatarFile);

      const token = localStorage.getItem('roomhy_admin_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://roohmy-backend-6q6z.vercel.app';
      const url = editing ? `${apiBase}/api/testimonials/${editing.id}` : `${apiBase}/api/testimonials`;
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Save failed');

      showToast(editing ? "Testimonial updated" : "Testimonial added");
      setShowForm(false);
      loadTestimonials();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      await api.delete(`/api/testimonials/${id}`);
      showToast("Testimonial deleted");
      setItems(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
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
        title="Testimonials"
        subtitle={`${items.length} testimonials · ${items.filter(t => t.status === 'active').length} active`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Content" }, { label: "Testimonials" }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadTestimonials}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Testimonial</Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: items.length, color: "text-primary" },
          { label: "Active", value: items.filter(t => t.status === 'active').length, color: "text-emerald-600" },
          { label: "Featured", value: items.filter(t => t.featured).length, color: "text-amber-600" },
          { label: "5-Star", value: items.filter(t => t.rating === 5).length, color: "text-yellow-500" },
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
          <Input placeholder="Search by name or city…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading testimonials…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t, i) => (
            <div key={t.id} className={`rounded-xl border p-5 transition-all hover:border-primary/30 hover:shadow-sm ${t.status === 'active' ? 'border-border bg-card' : 'border-border/40 bg-muted/20 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-1">
                      {t.name} {t.featured && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="text-xs text-muted-foreground">{t.role}{t.city ? ` · ${t.city}` : ''}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`h-3.5 w-3.5 ${s <= t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">"{t.text}"</p>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className={`text-xs font-medium ${t.status === 'active' ? 'text-emerald-600' : 'text-muted-foreground'}`}>{t.status}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-sm text-muted-foreground">
              <MessageSquareQuote className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              No testimonials found.
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl my-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? "Edit Testimonial" : "Add Testimonial"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Name <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Role</label>
                  <Input placeholder="e.g. IIT Student" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">City</label>
                  <Input placeholder="e.g. Kota" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Review <span className="text-destructive">*</span></label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={4} placeholder="Share the experience…"
                  value={form.text} onChange={e => setForm({ ...form, text: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Rating</label>
                  <Select value={form.rating} onValueChange={v => setForm({ ...form, rating: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[5,4,3,2,1].map(r => <SelectItem key={r} value={String(r)}>{r} Stars</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Status</label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Avatar Photo</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border p-3 hover:border-primary/50 transition-colors"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">{avatarFile ? avatarFile.name : "Click to upload avatar"}</span>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="rounded" />
                Mark as Featured
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={!form.name.trim() || !form.text.trim() || saving} onClick={handleSave}>
                {saving ? "Saving…" : <><Check className="mr-2 h-4 w-4" />{editing ? "Save" : "Add"}</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}