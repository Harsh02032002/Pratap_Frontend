import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Plus, Search, Pencil, Trash2, Check, X, Upload, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/amenities")({
  head: () => ({
    meta: [
      { title: "Amenities — Roomhy Admin" },
      { name: "description", content: "Manage the master list of amenities." },
    ],
  }),
  component: AmenitiesPage,
});

interface AmenityItem {
  id: string;
  name: string;
  icon: string;
  iconSvg: string;
  category: string;
  description: string;
  active: boolean;
}

const CATEGORIES = ["basic", "comfort", "luxury", "safety", "other"];

function AmenitiesPage() {
  const [items, setItems] = useState<AmenityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AmenityItem | null>(null);
  const [form, setForm] = useState({ name: "", icon: "", iconSvg: "", category: "basic", description: "" });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAmenities(); }, []);

  const loadAmenities = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/amenities');
      const list = data.data || data || [];
      const mapped: AmenityItem[] = list.map((a: any) => ({
        id: String(a._id || a.id),
        name: a.name || '',
        icon: a.icon || 'check',
        iconSvg: a.iconSvg || '',
        category: a.category || 'basic',
        description: a.description || '',
        active: a.status !== 'Inactive',
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Failed to load amenities:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const openAdd = () => {
    setForm({ name: "", icon: "", iconSvg: "", category: "basic", description: "" });
    setIconFile(null); setIconPreview(""); setEditing(null); setShowForm(true);
  };
  const openEdit = (a: AmenityItem) => {
    setForm({ name: a.name, icon: a.icon, iconSvg: a.iconSvg, category: a.category, description: a.description });
    setIconPreview(a.iconSvg || ""); setIconFile(null); setEditing(a); setShowForm(true);
  };

  const handleIconFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('icon', form.icon || 'check');
      formData.append('iconSvg', form.iconSvg);
      formData.append('category', form.category);
      formData.append('description', form.description);
      if (iconFile) formData.append('iconFile', iconFile);

      const token = localStorage.getItem('roomhy_admin_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://roohmy-backend-6q6z.vercel.app';
      const url = editing ? `${apiBase}/api/amenities/${editing.id}` : `${apiBase}/api/amenities`;
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Save failed');

      showToast(editing ? `"${form.name}" updated` : `"${form.name}" added`);
      setShowForm(false);
      loadAmenities();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/api/amenities/${id}`);
      showToast(`"${name}" deleted`);
      setItems(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const data = await api.patch(`/api/amenities/${id}/toggle`, {});
      const updated = data.data;
      setItems(prev => prev.map(a => a.id === id ? { ...a, active: updated.status === 'Active' } : a));
    } catch (err) {
      console.error('Toggle failed', err);
    }
  };

  const filtered = items.filter(a => {
    if (catFilter !== 'all' && a.category !== catFilter) return false;
    if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Amenities Management"
        subtitle={`${items.length} amenities · ${items.filter(a => a.active).length} active`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Property Management" }, { label: "Amenities" }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadAmenities}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Amenity</Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Amenities", value: items.length, color: "text-primary" },
          { label: "Active", value: items.filter(a => a.active).length, color: "text-emerald-600" },
          { label: "Inactive", value: items.filter(a => !a.active).length, color: "text-muted-foreground" },
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
          <Input placeholder="Search amenities…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading amenities…</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(a => (
            <div
              key={a.id}
              className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                a.active ? "border-border bg-card hover:border-primary/30" : "border-border/50 bg-muted/20 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary overflow-hidden">
                  {a.iconSvg ? (
                    <img src={a.iconSvg} alt={a.name} className="h-5 w-5 object-contain" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{a.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleActive(a.id)}
                  className={`h-5 w-9 rounded-full transition-colors ${a.active ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform mx-0.5 ${a.active ? "translate-x-4" : "translate-x-0"}`} />
                </button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id, a.name)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-4 py-16 text-center text-sm text-muted-foreground">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              No amenities found.
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? "Edit Amenity" : "Add Amenity"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Name <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Swimming Pool" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Icon Name (Lucide)</label>
                <Input placeholder="e.g. Waves, Wifi, Dumbbell" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">SVG / Image Icon Upload</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border p-3 hover:border-primary/50 transition-colors"
                >
                  {iconPreview ? (
                    <img src={iconPreview} alt="preview" className="h-8 w-8 object-contain rounded" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">{iconFile ? iconFile.name : "Click to upload SVG / PNG icon"}</span>
                </div>
                <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleIconFile} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Description</label>
                <Input placeholder="Brief description…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={!form.name.trim() || saving} onClick={handleSave}>
                {saving ? "Saving…" : <><Check className="mr-2 h-4 w-4" />{editing ? "Save" : "Add"}</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}