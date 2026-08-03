import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Clock, CheckCircle2, XCircle, Eye, Search, RefreshCw, Filter,
  ChevronLeft, ChevronRight, MoreHorizontal, Building2, Star,
  MapPin, User, Calendar, AlertTriangle, MessageSquare, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/status-pill";
import { PROPERTIES, CITIES, CATEGORIES } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/properties/pending")({
  head: () => ({
    meta: [
      { title: "Pending Approvals — Roomhy Admin" },
      { name: "description", content: "Review properties awaiting approval." },
    ],
  }),
  component: PendingApprovalsPage,
});

const PENDING = PROPERTIES.filter((p) => p.status === "Pending");
const PAGE_SIZE = 8;

type ModalMode = "approve" | "reject" | "preview" | null;

function PendingApprovalsPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ mode: ModalMode; id: string | null }>({ mode: null, id: null });
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const filtered = useMemo(() => {
    return PENDING.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q.toLowerCase()) || p.code.toLowerCase().includes(q.toLowerCase()) || p.owner.toLowerCase().includes(q.toLowerCase()))) return false;
      if (city !== "All" && p.city !== city) return false;
      if (category !== "All" && p.category !== category) return false;
      return true;
    });
  }, [q, city, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allChecked = paged.length > 0 && paged.every((p) => selected.has(p.id));

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    const s = new Set(selected);
    if (allChecked) paged.forEach((p) => s.delete(p.id));
    else paged.forEach((p) => s.add(p.id));
    setSelected(s);
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const doApprove = () => {
    const name = modal.id ? PENDING.find((p) => p.id === modal.id)?.name : `${selected.size} properties`;
    setModal({ mode: null, id: null });
    showToast(`✓ ${name} approved successfully`);
    setSelected(new Set());
  };

  const doReject = () => {
    if (!rejectReason.trim()) return;
    const name = modal.id ? PENDING.find((p) => p.id === modal.id)?.name : `${selected.size} properties`;
    setModal({ mode: null, id: null });
    setRejectReason("");
    showToast(`${name} rejected`, "error");
    setSelected(new Set());
  };

  const previewProp = modal.id ? PENDING.find((p) => p.id === modal.id) : null;

  const kpis = [
    { label: "Total Pending", value: PENDING.length, color: "text-amber-600", bg: "bg-amber-50", icon: <Clock className="h-5 w-5 text-amber-500" /> },
    { label: "Submitted Today", value: 4, color: "text-blue-600", bg: "bg-blue-50", icon: <Calendar className="h-5 w-5 text-blue-500" /> },
    { label: "Avg. Wait Time", value: "2.3d", color: "text-violet-600", bg: "bg-violet-50", icon: <AlertTriangle className="h-5 w-5 text-violet-500" /> },
    { label: "Approved This Month", value: 31, color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-lg transition-all ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <PageHeader
        title="Pending Approvals"
        subtitle={`${filtered.length} properties awaiting review`}
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Property Management" }, { label: "Pending Approvals" }]}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
            {selected.size > 0 && (
              <>
                <Button size="sm" onClick={() => setModal({ mode: "approve", id: null })}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Approve {selected.size}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setModal({ mode: "reject", id: null })}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject {selected.size}
                </Button>
              </>
            )}
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${k.bg}`}>
              {k.icon}
            </span>
            <div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, code or owner…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={city} onValueChange={(v) => { setCity(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Cities</SelectItem>
              {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> More filters</Button>
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setCity("All"); setCategory("All"); setPage(1); }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
        {selected.size > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-md bg-amber-50 px-3 py-2 text-sm border border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-amber-800">{selected.size} selected</span>
            <Button size="sm" onClick={() => setModal({ mode: "approve", id: null })}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Approve All
            </Button>
            <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => setModal({ mode: "reject", id: null })}>
              <XCircle className="mr-1 h-4 w-4" /> Reject All
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">City / Area</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Rooms</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-amber-50/30 transition-colors">
                  <td className="px-4 py-3"><Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-10 w-10 rounded-md object-cover ring-1 ring-border" />
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          {p.name}
                          {p.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.code} · {p.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{p.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{p.city}</div>
                    <div className="text-xs text-muted-foreground pl-5">{p.area}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" />{p.owner}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">₹{p.price.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">{p.availableRooms}/{p.totalRooms}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {p.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.createdAt}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                        onClick={() => setModal({ mode: "approve", id: p.id })}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 px-2 text-xs text-rose-700 hover:bg-rose-50"
                        onClick={() => setModal({ mode: "reject", id: p.id })}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setModal({ mode: "preview", id: p.id })}>
                            <Eye className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem><MessageSquare className="mr-2 h-4 w-4" /> Message Owner</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-rose-600">
                            <XCircle className="mr-2 h-4 w-4" /> Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-sm text-muted-foreground">
                    <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                    No pending properties match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((n) => (
              <Button key={n} variant={n === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setPage(n)}>{n}</Button>
            ))}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {modal.mode === "approve" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Approve Property</h2>
                <p className="text-xs text-muted-foreground">
                  {modal.id
                    ? `"${PENDING.find((p) => p.id === modal.id)?.name}" will be published.`
                    : `${selected.size} selected properties will be published.`}
                </p>
              </div>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              The property listing will go live on Roomhy and the owner will be notified via email.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModal({ mode: null, id: null })}>Cancel</Button>
              <Button onClick={doApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {modal.mode === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <XCircle className="h-5 w-5 text-rose-600" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Reject Property</h2>
                <p className="text-xs text-muted-foreground">
                  {modal.id
                    ? `"${PENDING.find((p) => p.id === modal.id)?.name}"`
                    : `${selected.size} selected properties`}
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium">Rejection reason <span className="text-destructive">*</span></label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a clear reason that will be sent to the property owner…"
                rows={4}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {!rejectReason.trim() && <p className="mt-1 text-xs text-muted-foreground">Reason is required before rejecting.</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setModal({ mode: null, id: null }); setRejectReason(""); }}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={!rejectReason.trim()}
                onClick={doReject}
              >
                <XCircle className="mr-2 h-4 w-4" /> Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {modal.mode === "preview" && previewProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="relative h-48">
              <img src={previewProp.image} alt={previewProp.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <div className="text-xl font-bold text-white">{previewProp.name}</div>
                <div className="text-sm text-white/80">{previewProp.code} · {previewProp.type}</div>
              </div>
              <button
                onClick={() => setModal({ mode: null, id: null })}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Category</span><p className="font-medium">{previewProp.category}</p></div>
                <div><span className="text-muted-foreground">City / Area</span><p className="font-medium">{previewProp.city}, {previewProp.area}</p></div>
                <div><span className="text-muted-foreground">Owner</span><p className="font-medium">{previewProp.owner}</p></div>
                <div><span className="text-muted-foreground">Price</span><p className="font-medium">₹{previewProp.price.toLocaleString("en-IN")}/mo</p></div>
                <div><span className="text-muted-foreground">Rooms</span><p className="font-medium">{previewProp.availableRooms} available / {previewProp.totalRooms} total</p></div>
                <div><span className="text-muted-foreground">Rating</span><p className="font-medium flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{previewProp.rating}</p></div>
                <div><span className="text-muted-foreground">Submitted</span><p className="font-medium">{previewProp.createdAt}</p></div>
                <div><span className="text-muted-foreground">Status</span><StatusPill status={previewProp.status} /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setModal({ mode: null, id: null })}>Close</Button>
                <Button variant="destructive" onClick={() => setModal({ mode: "reject", id: previewProp.id })}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => setModal({ mode: "approve", id: previewProp.id })} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}