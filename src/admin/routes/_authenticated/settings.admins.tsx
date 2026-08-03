import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  UserCog, Plus, Pencil, Trash2, Search, Check, X, MoreHorizontal, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/settings/admins")({
  head: () => ({
    meta: [
      { title: "Admin Users — Roomhy Admin" },
      { name: "description", content: "Manage admin users." },
    ],
  }),
  component: AdminUsersPage,
});

const ROLES = ["Super Admin", "Property Manager", "Content Manager", "SEO Manager", "Support"];
const AVATAR_COLORS = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-teal-500"];

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive" | "Pending";
  avatar: string;
  lastLogin: string;
  joinedAt: string;
}

const INIT_ADMINS: AdminUser[] = [
  { id: "a1", name: "Priya Verma", email: "priya@roomhy.com", role: "Super Admin", status: "Active", avatar: "PV", lastLogin: "2025-07-28", joinedAt: "2024-01-01" },
  { id: "a2", name: "Rahul Sharma", email: "rahul@roomhy.com", role: "Property Manager", status: "Active", avatar: "RS", lastLogin: "2025-07-27", joinedAt: "2024-03-15" },
  { id: "a3", name: "Anjali Rao", email: "anjali@roomhy.com", role: "Content Manager", status: "Active", avatar: "AR", lastLogin: "2025-07-25", joinedAt: "2024-05-10" },
  { id: "a4", name: "Karan Kapoor", email: "karan@roomhy.com", role: "SEO Manager", status: "Inactive", avatar: "KK", lastLogin: "2025-06-01", joinedAt: "2024-06-20" },
  { id: "a5", name: "Deepa Nair", email: "deepa@roomhy.com", role: "Support", status: "Active", avatar: "DN", lastLogin: "2025-07-26", joinedAt: "2024-08-01" },
  { id: "a6", name: "New Invite", email: "newinvite@roomhy.com", role: "Content Manager", status: "Pending", avatar: "NI", lastLogin: "—", joinedAt: "2025-07-20" },
];

function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(INIT_ADMINS);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: ROLES[0] });
  const [toast, setToast] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    if (q && !u.name.toLowerCase().includes(q.toLowerCase()) && !u.email.toLowerCase().includes(q.toLowerCase())) return false;
    if (roleFilter !== "All" && u.role !== roleFilter) return false;
    return true;
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
  const openAdd = () => { setForm({ name: "", email: "", role: ROLES[0] }); setEditing(null); setShowForm(true); };
  const openEdit = (u: AdminUser) => { setForm({ name: u.name, email: u.email, role: u.role }); setEditing(u); setShowForm(true); };
  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editing) {
      setUsers((prev) => prev.map((u) => u.id === editing.id ? { ...u, ...form } : u));
      showToast(`${form.name} updated`);
    } else {
      setUsers((prev) => [...prev, { id: `a-${Date.now()}`, ...form, status: "Pending", avatar: form.name.slice(0, 2).toUpperCase(), lastLogin: "—", joinedAt: new Date().toISOString().slice(0, 10) }]);
      showToast(`Invite sent to ${form.email}`);
    }
    setShowForm(false);
  };
  const handleDelete = (id: string) => { setUsers((prev) => prev.filter((u) => u.id !== id)); showToast("Admin removed"); };
  const toggleStatus = (id: string) => setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u));

  const statusColor: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-5 py-3 shadow-lg text-primary text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Admin Users"
        subtitle={`${users.length} admins · ${users.filter((u) => u.status === "Active").length} active`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Settings" }, { label: "Admins" }]}
        actions={<Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Invite Admin</Button>}
      />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Admins", value: users.length, color: "text-primary" },
          { label: "Active", value: users.filter((u) => u.status === "Active").length, color: "text-emerald-600" },
          { label: "Pending", value: users.filter((u) => u.status === "Pending").length, color: "text-amber-600" },
          { label: "Roles", value: new Set(users.map((u) => u.role)).size, color: "text-blue-600" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search admins…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Roles</SelectItem>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((u, ui) => (
          <div key={u.id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-md transition-all">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${AVATAR_COLORS[ui % AVATAR_COLORS.length]} text-sm font-bold text-white`}>
              {u.avatar}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold">{u.name}</div>
                {u.role === "Super Admin" && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                {u.status === "Inactive" && <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              </div>
              <div className="truncate text-xs text-muted-foreground">{u.email}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{u.role}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusColor[u.status]}`}>{u.status}</span>
              </div>
              <div className="mt-1.5 text-[10px] text-muted-foreground">Last login: {u.lastLogin}</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => openEdit(u)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleStatus(u.id)}>
                  {u.status === "Active" ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(u.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-sm text-muted-foreground">
            <UserCog className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            No admins found.
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing ? "Edit Admin" : "Invite Admin"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
                <Input placeholder="Rahul Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email <span className="text-destructive">*</span></label>
                <Input type="email" placeholder="admin@roomhy.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Role</label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button disabled={!form.name.trim() || !form.email.trim()} onClick={handleSave}>
                <Check className="mr-2 h-4 w-4" /> {editing ? "Save" : "Send Invite"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}