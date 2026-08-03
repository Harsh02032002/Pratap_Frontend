import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Map, Plus, Pencil, Trash2, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/areas")({
  head: () => ({
    meta: [
      { title: "Areas & Localities — Roomhy Admin" },
      { name: "description", content: "Manage areas and localities within each city." },
    ],
  }),
  component: AreasPage,
});

interface AreaItem {
  id: string;
  name: string;
  city: string;
  slug: string;
  count: number;
  active: boolean;
}

function AreasPage() {
  const [items, setItems] = useState<AreaItem[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AreaItem | null>(null);
  const [form, setForm] = useState({ name: "", city: "", slug: "" });
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAreas();
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await api.get('/api/locations/cities');
      const list = data.data || data || [];
      setCitiesList(list.map((c: any) => c.name || c));
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  const loadAreas = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/locations/areas');
      const list = data.data || data || [];
      const mapped: AreaItem[] = list.map((a: any, i: number) => ({
        id: String(a._id || i),
        name: a.name || a.areaName || '',
        city: a.cityName || a.city || '',
        slug: a.slug || (a.name || '').toLowerCase().replace(/\s+/g, "-"),
        count: typeof a.propertyCount === 'number' ? a.propertyCount : 0,
        active: a.status !== 'Inactive',
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Failed to load areas:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() =>
    items.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (cityFilter !== "All" && a.city !== cityFilter) return false;
      return true;
    }), [items, q, cityFilter]
  );

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
  const openAdd = () => { setForm({ name: "", city: citiesList[0] || "", slug: "" }); setEditing(null); setShowForm(true); };
  const openEdit = (a: AreaItem) => { setForm({ name: a.name, city: a.city, slug: a.slug }); setEditing(a); setShowForm(true); };
  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await api.put(`/api/locations/areas/${editing.id}`, { name: form.name, cityName: form.city, slug: form.slug });
        setItems((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...form } : a));
        showToast(`"${form.name}" updated`);
      } else {
        const data = await api.post('/api/locations/areas', { name: form.name, cityName: form.city, slug: form.slug });
        setItems((prev) => [...prev, { id: data._id || `area-${Date.now()}`, name: form.name, city: form.city, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"), count: 0, active: true }]);
        showToast(`"${form.name}" added`);
      }
      setShowForm(false);
    } catch (err: any) {
      showToast(err.message || 'Save failed');
    }
  };
  const handleDelete = async (id: string) => {
    const name = items.find((a) => a.id === id)?.name;
    try {
      await api.delete(`/api/locations/areas/${id}`);
      setItems((prev) => prev.filter((a) => a.id !== id));
      showToast(`"${name}" deleted`);
    } catch (err: any) {
      showToast(err.message || 'Delete failed');
    }
  };
  const toggleActive = (id: string) => setItems((prev) => prev.map((a) => a.id === id ? { ...a, active: !a.active } : a));

  const citiesWithAreas = [...new Set(items.map((a) => a.city))];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Areas & Localities"
        subtitle={`${items.length} areas · ${citiesWithAreas.length} cities`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "City & Area Management" }, { label: "Areas" }]}
        actions={<Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Area</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading areas…</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Areas", value: items.length, color: "text-primary" },
              { label: "Cities Covered", value: citiesWithAreas.length, color: "text-emerald-600" },
              { label: "Active", value: items.filter((a) => a.active).length, color: "text-blue-600" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search areas…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All cities</SelectItem>
                {citiesList.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Properties</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((a) => (
                  <tr key={a.id} className={!a.active ? "opacity-60" : ""}>
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.city}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">/{a.slug}</td>
                    <td className="px-4 py-3">{a.count}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(a.id)} className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${a.active ? "bg-emerald-500" : "bg-muted"}`}>
                        <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${a.active ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No areas found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? "Edit Area" : "Add Area"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Area Name <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Vigyan Nagar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">City</label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {citiesList.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Slug</label>
                <Input placeholder="auto-generated if empty" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={!form.name.trim() || !form.city} onClick={handleSave}><Check className="mr-2 h-4 w-4" /> {editing ? "Save" : "Add"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
