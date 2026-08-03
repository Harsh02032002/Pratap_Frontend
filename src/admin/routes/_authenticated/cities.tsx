import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MapPin, Plus, Pencil, Trash2, Search, Check, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/cities")({
  head: () => ({
    meta: [
      { title: "Cities — Roomhy Admin" },
      { name: "description", content: "Manage cities available on Roomhy." },
    ],
  }),
  component: CitiesPage,
});

interface CityItem {
  id: string;
  name: string;
  slug: string;
  state: string;
  count: number;
  active: boolean;
  image: string;
}

const STATES: Record<string, string> = {
  Kota: "Rajasthan", Jaipur: "Rajasthan", Delhi: "Delhi", Indore: "Madhya Pradesh",
  Bhopal: "Madhya Pradesh", Nagpur: "Maharashtra", Sikar: "Rajasthan",
  Mumbai: "Maharashtra", Pune: "Maharashtra", Bengaluru: "Karnataka",
  Hyderabad: "Telangana", Chennai: "Tamil Nadu", Ahmedabad: "Gujarat",
  Lucknow: "Uttar Pradesh", Chandigarh: "Chandigarh", Noida: "Uttar Pradesh",
  Gurugram: "Haryana", Surat: "Gujarat", Vadodara: "Gujarat", Patna: "Bihar",
};

const CITY_IMGS: Record<string, string> = {
  Kota: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=200",
  Sikar: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=200",
  Indore: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=200",
};

function CitiesPage() {
  const [cities, setCities] = useState<CityItem[]>([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CityItem | null>(null);
  const [form, setForm] = useState({ name: "", state: "", slug: "" });
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/locations/cities');
      const list = data.data || data || [];
      const mapped: CityItem[] = list.map((c: any, i: number) => ({
        id: String(c._id || c.name || i),
        name: c.name || c,
        slug: c.slug || (c.name || c).toLowerCase().replace(/\s+/g, "-"),
        state: c.state || STATES[c.name] || "India",
        count: typeof c.propertyCount === 'number' ? c.propertyCount : 0,
        active: c.status !== 'Inactive',
        image: c.imageUrl || CITY_IMGS[c.name] || `https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=200`,
      }));
      setCities(mapped);
    } catch (err) {
      console.error('Failed to load cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = cities.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.state.toLowerCase().includes(q.toLowerCase()));

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
  const openAdd = () => { setForm({ name: "", state: "", slug: "" }); setEditing(null); setShowForm(true); };
  const openEdit = (c: CityItem) => { setForm({ name: c.name, state: c.state, slug: c.slug }); setEditing(c); setShowForm(true); };
  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await api.put(`/api/locations/cities/${editing.id}`, { name: form.name, state: form.state, slug: form.slug });
        setCities((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...form } : c));
        showToast(`"${form.name}" updated`);
      } else {
        const data = await api.post('/api/locations/cities', { name: form.name, state: form.state });
        setCities((prev) => [...prev, { id: data._id || `city-${Date.now()}`, name: form.name, state: form.state, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"), count: 0, active: true, image: CITY_IMGS[form.name] || `https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=200` }]);
        showToast(`"${form.name}" added`);
      }
      setShowForm(false);
    } catch (err: any) {
      showToast(err.message || 'Save failed');
    }
  };
  const handleDelete = async (id: string) => {
    const name = cities.find((c) => c.id === id)?.name;
    try {
      await api.delete(`/api/locations/cities/${id}`);
      setCities((prev) => prev.filter((c) => c.id !== id));
      showToast(`"${name}" deleted`);
    } catch (err: any) {
      showToast(err.message || 'Delete failed');
    }
  };
  const toggleActive = (id: string) => setCities((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c));

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Cities"
        subtitle={`${cities.length} cities · ${cities.filter((c) => c.active).length} active`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "City & Area Management" }, { label: "Cities" }]}
        actions={<Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add City</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading cities…</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Cities", value: cities.length, color: "text-primary" },
              { label: "Active", value: cities.filter((c) => c.active).length, color: "text-emerald-600" },
              { label: "Total Properties", value: cities.reduce((sum, c) => sum + c.count, 0), color: "text-blue-600" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search cities…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
          </div>

          {/* City Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => (
              <div key={c.id} className={`group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md ${!c.active ? "opacity-60" : ""}`}>
                <div className="relative h-32 overflow-hidden">
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <div className="text-lg font-bold text-white">{c.name}</div>
                    <div className="text-xs text-white/80">{c.state}</div>
                  </div>
                  <div className="absolute right-2 top-2">
                    <button
                      onClick={() => toggleActive(c.id)}
                      className={`flex h-6 w-11 rounded-full transition-colors ${c.active ? "bg-emerald-500" : "bg-muted/80"}`}
                    >
                      <div className={`h-5 w-5 rounded-full bg-white shadow my-auto mx-0.5 transition-transform ${c.active ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {c.count} properties
                    <span className="mx-1">·</span>
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-mono">/{c.slug}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-4 py-16 text-center text-sm text-muted-foreground">
                <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                No cities found.
              </div>
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? "Edit City" : "Add City"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">City Name <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Kota" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">State</label>
                <Input placeholder="e.g. Rajasthan" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Slug</label>
                <Input placeholder="auto-generated if empty" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={!form.name.trim()} onClick={handleSave}><Check className="mr-2 h-4 w-4" /> {editing ? "Save" : "Add"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}