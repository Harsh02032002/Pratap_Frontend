import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Check, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/settings/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions — Roomhy Admin" },
      { name: "description", content: "Manage roles and permissions." },
    ],
  }),
  component: RolesPage,
});

const ALL_PERMISSIONS = [
  "View Properties", "Edit Properties", "Approve Properties", "Delete Properties",
  "View Users", "Edit Users", "Manage Admins",
  "Manage Cities", "Manage Areas", "Manage Categories", "Manage Amenities",
  "Manage Blogs", "Manage Media", "Manage Banners", "Manage Testimonials",
  "Manage SEO", "Manage Redirects", "Manage Sitemap",
  "View Dashboard", "View Analytics",
  "Manage Settings", "Manage Roles",
];

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  adminCount: number;
  color: string;
}

const INIT_ROLES: Role[] = [
  { id: "r1", name: "Super Admin", description: "Full access to everything", permissions: ALL_PERMISSIONS, adminCount: 1, color: "bg-violet-500" },
  { id: "r2", name: "Property Manager", description: "Manage property listings and approvals", permissions: ["View Properties", "Edit Properties", "Approve Properties", "Manage Cities", "Manage Areas", "Manage Categories", "Manage Amenities", "View Dashboard"], adminCount: 2, color: "bg-blue-500" },
  { id: "r3", name: "Content Manager", description: "Manage blogs, media and banners", permissions: ["Manage Blogs", "Manage Media", "Manage Banners", "Manage Testimonials", "View Dashboard"], adminCount: 1, color: "bg-emerald-500" },
  { id: "r4", name: "SEO Manager", description: "Handle SEO, redirects and sitemap", permissions: ["Manage SEO", "Manage Redirects", "Manage Sitemap", "View Dashboard", "View Analytics"], adminCount: 1, color: "bg-amber-500" },
  { id: "r5", name: "Support", description: "View-only access for support team", permissions: ["View Properties", "View Users", "View Dashboard"], adminCount: 1, color: "bg-rose-500" },
];

function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(INIT_ROLES);
  const [selected, setSelected] = useState<Role>(roles[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [localPerms, setLocalPerms] = useState<Set<string>>(new Set(selected.permissions));
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const selectRole = (r: Role) => { setSelected(r); setLocalPerms(new Set(r.permissions)); };
  const togglePerm = (p: string) => {
    const s = new Set(localPerms);
    s.has(p) ? s.delete(p) : s.add(p);
    setLocalPerms(s);
  };
  const savePerms = () => {
    setRoles((prev) => prev.map((r) => r.id === selected.id ? { ...r, permissions: Array.from(localPerms) } : r));
    setSelected((prev) => ({ ...prev, permissions: Array.from(localPerms) }));
    showToast(`"${selected.name}" permissions saved`);
  };
  const handleAdd = () => {
    if (!form.name.trim()) return;
    const newRole: Role = { id: `r-${Date.now()}`, name: form.name, description: form.description, permissions: [], adminCount: 0, color: "bg-slate-500" };
    setRoles((prev) => [...prev, newRole]);
    showToast(`"${form.name}" role created`);
    setShowForm(false);
  };
  const handleDelete = (id: string) => {
    if (id === selected.id) setSelected(roles[0]);
    setRoles((prev) => prev.filter((r) => r.id !== id));
    showToast("Role deleted");
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Roles & Permissions"
        subtitle="Fine-grained access control across the admin panel"
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Settings" }, { label: "Roles" }]}
        actions={<Button size="sm" onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" /> Create Role</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Role List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-3">Roles ({roles.length})</div>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => selectRole(r)}
              className={`w-full text-left flex items-center gap-3 rounded-xl border p-3 transition-all ${selected.id === r.id ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/20"}`}
            >
              <span className={`h-9 w-9 flex shrink-0 items-center justify-center rounded-full ${r.color} text-white text-xs font-bold`}>
                {r.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.permissions.length} permissions · {r.adminCount} admins</div>
              </div>
              {r.id !== "r1" && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </button>
          ))}
        </div>

        {/* Permissions Editor */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-semibold">{selected.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{selected.description}</div>
            </div>
            <Button size="sm" onClick={savePerms}><Check className="mr-2 h-4 w-4" /> Save Permissions</Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALL_PERMISSIONS.map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-2.5 hover:bg-muted/30 transition-colors">
                <div
                  onClick={() => selectRole === null || true ? togglePerm(p) : null}
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${localPerms.has(p) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}
                >
                  {localPerms.has(p) && <Check className="h-2.5 w-2.5" />}
                </div>
                <span className="text-xs font-medium">{p}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {localPerms.size} of {ALL_PERMISSIONS.length} permissions selected
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Create Role</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Role Name <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Finance Manager" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Description</label>
                <Input placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={!form.name.trim()} onClick={handleAdd}><Check className="mr-2 h-4 w-4" /> Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}