import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layers, Plus, Pencil, Trash2, Search, Check, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { CATEGORIES, PROPERTIES } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({
    meta: [
      { title: "Property Categories — Roomhy Admin" },
      { name: "description", content: "Manage property categories such as PG, Hostel, Co-living." },
    ],
  }),
  component: CategoriesPage,
});

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  active: boolean;
  color: string;
}

const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"];

const INIT_CATS: Category[] = CATEGORIES.map((c, i) => ({
  id: `cat-${i}`,
  name: c,
  slug: c.toLowerCase().replace(/\s+/g, "-"),
  count: PROPERTIES.filter((p) => p.category === c).length,
  active: i % 8 !== 0,
  color: COLORS[i % COLORS.length],
}));

function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>(INIT_CATS);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", color: COLORS[0] });
  const [toast, setToast] = useState<string | null>(null);

  const filtered = cats.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()));

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
  const openAdd = () => { setForm({ name: "", slug: "", color: COLORS[0] }); setEditing(null); setShowForm(true); };
  const openEdit = (c: Category) => { setForm({ name: c.name, slug: c.slug, color: c.color }); setEditing(c); setShowForm(true); };
  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setCats((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-") } : c));
      showToast(`"${form.name}" updated`);
    } else {
      setCats((prev) => [...prev, { id: `cat-${Date.now()}`, name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"), count: 0, active: true, color: form.color }]);
      showToast(`"${form.name}" added`);
    }
    setShowForm(false);
  };
  const handleDelete = (id: string) => {
    const name = cats.find((c) => c.id === id)?.name;
    setCats((prev) => prev.filter((c) => c.id !== id));
    showToast(`"${name}" deleted`);
  };
  const toggleActive = (id: string) => setCats((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c));

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Property Categories"
        subtitle={`${cats.length} categories · ${cats.filter((c) => c.active).length} active`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Property Management" }, { label: "Categories" }]}
        actions={<Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Category</Button>}
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Categories", value: cats.length, color: "text-primary" },
          { label: "Active", value: cats.filter((c) => c.active).length, color: "text-emerald-600" },
          { label: "Properties Listed", value: PROPERTIES.length, color: "text-blue-600" },
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
          <Input placeholder="Search categories…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Properties</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <button className="cursor-grab text-muted-foreground"><GripVertical className="h-4 w-4" /></button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-3 w-3 rounded-full ${c.color}`} />
                    <div>
                      <div className="font-medium">{c.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">/{c.slug}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {c.count} properties
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c.id)}
                    className={`flex h-5 w-9 rounded-full transition-colors ${c.active ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white shadow my-auto mx-0.5 transition-transform ${c.active ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">
                <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                No categories found.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? "Edit Category" : "Add Category"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Category Name <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Co-living" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Slug (URL)</label>
                <Input placeholder="auto-generated if empty" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((col) => (
                    <button key={col} onClick={() => setForm({ ...form, color: col })}
                      className={`h-7 w-7 rounded-full ${col} ${form.color === col ? "ring-2 ring-primary ring-offset-2" : ""}`} />
                  ))}
                </div>
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