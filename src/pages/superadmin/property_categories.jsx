import React, { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
   Users, Home, Building, Building2, Search, Edit3, Trash2, Plus, X,
   Download, FolderTree, CheckCircle2, XCircle, BarChart3, Image as ImageIcon, Loader2, Crown
} from "lucide-react";
import { fetchJson, clearApiCache } from "../../utils/api";
import { compressImage } from "../../utils/imageCompression";
import { PROPERTY_TIERS, normalizeTierKey } from "../../utils/propertyTiers";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// "Co-living" / "coliving" / "Co Living" all compare equal.
const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const TYPE_ICON = { pg: Users, hostel: Building2, coliving: Users, apartment: Building, house: Home };
const TIER_STYLE = {
   basic: "bg-slate-100 text-slate-700 border-slate-200",
   prime: "bg-blue-50 text-blue-700 border-blue-100",
   luxury: "bg-amber-50 text-amber-700 border-amber-100",
};

const emptyForm = () => ({ title: "", category: "", description: "", image: "", status: "Active" });

export default function Categories() {
   const [types, setTypes] = useState([]);
   const [properties, setProperties] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [search, setSearch] = useState("");

   const [modalOpen, setModalOpen] = useState(false);
   const [editingId, setEditingId] = useState(null);
   const [form, setForm] = useState(emptyForm());
   const [saving, setSaving] = useState(false);
   const [uploading, setUploading] = useState(false);

   const load = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const [t, p] = await Promise.all([
            fetchJson("/api/property-types/admin/all"),
            fetchJson("/api/properties?limit=5000", { timeout: 30000 }).catch(() => ({ properties: [] })),
         ]);
         setTypes(t?.data || []);
         setProperties(p?.properties || []);
      } catch (err) {
         setError(err?.message || "Could not load categories");
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => { load(); }, [load]);

   // Real counts: properties per type (matched on the category code) and per tier.
   const typeCounts = useMemo(() => {
      const m = {};
      properties.forEach((p) => {
         const k = norm(p.propertyType || p.propertyInfo?.propertyType);
         if (k) m[k] = (m[k] || 0) + 1;
      });
      return m;
   }, [properties]);

   const tierCounts = useMemo(() => {
      const m = {};
      properties.forEach((p) => {
         const k = normalizeTierKey(p.tier);
         if (k) m[k] = (m[k] || 0) + 1;
      });
      return m;
   }, [properties]);

   const filtered = useMemo(() => {
      const q = search.trim().toLowerCase();
      return types.filter((c) => !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
   }, [types, search]);

   const activeCount = types.filter((c) => c.status !== "Inactive").length;

   const openAdd = () => { setEditingId(null); setForm(emptyForm()); setModalOpen(true); };
   const openEdit = (c) => {
      setEditingId(c._id);
      setForm({ title: c.title, category: c.category, description: c.description, image: c.images?.[0] || "", status: c.status || "Active" });
      setModalOpen(true);
   };

   const handleUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
         const body = new FormData();
         body.append("image", await compressImage(file));
         const res = await fetch("/api/upload", { method: "POST", body });
         const data = await res.json();
         if (data.url) setForm((f) => ({ ...f, image: data.url }));
         else toast.error(data.error || "Upload failed");
      } catch {
         toast.error("Failed to upload image");
      } finally {
         setUploading(false);
         e.target.value = "";
      }
   };

   const handleSave = async (e) => {
      e.preventDefault();
      if (!form.image.trim()) { toast.error("Add a cover image (paste a link or upload one)"); return; }
      setSaving(true);
      try {
         const payload = {
            title: form.title.trim(),
            category: form.category.trim(),
            description: form.description.trim(),
            images: [form.image.trim()],
            status: form.status,
         };
         await fetchJson(editingId ? `/api/property-types/${editingId}` : "/api/property-types", {
            method: editingId ? "PUT" : "POST",
            body: JSON.stringify(payload),
         });
         clearApiCache();
         toast.success(editingId ? "Category updated" : "Category added");
         setModalOpen(false);
         await load();
      } catch (err) {
         toast.error(err?.message || "Could not save category");
      } finally {
         setSaving(false);
      }
   };

   const handleDelete = async (c) => {
      if (!window.confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
      try {
         await fetchJson(`/api/property-types/${c._id}`, { method: "DELETE" });
         clearApiCache();
         toast.success("Category deleted");
         await load();
      } catch (err) {
         toast.error(err?.message || "Could not delete category");
      }
   };

   const handleExport = () => {
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = [["Title", "Code", "Status", "Properties"].map(esc).join(",")];
      types.forEach((c) => lines.push([c.title, c.category, c.status || "Active", typeCounts[norm(c.category)] || 0].map(esc).join(",")));
      const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url; a.download = "property-categories.csv"; a.click();
      URL.revokeObjectURL(url);
   };

   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center h-[600px] gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading categories...</p>
         </div>
      );
   }

   const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#095256]/20";
   const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1";

   return (
      <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Property Categories</h1>
               <p className="text-sm text-slate-500 mt-0.5">Manage platform property categories and classification schemas</p>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition shadow-2xs flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-500" /> Export
               </button>
               <button onClick={openAdd} className="bg-[#095256] hover:bg-[#074043] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition shadow-2xs flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Category
               </button>
            </div>
         </div>

         {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
               <span>{error}</span>
               <button onClick={load} className="font-semibold underline">Retry</button>
            </div>
         )}

         {/* Real counts */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Stat label="Property types" value={types.length} icon={FolderTree} color="blue" />
            <Stat label="Active" value={activeCount} icon={CheckCircle2} color="emerald" />
            <Stat label="Inactive" value={types.length - activeCount} icon={XCircle} color="amber" />
            <Stat label="Properties listed" value={properties.length} icon={BarChart3} color="indigo" />
         </div>

         {/* Section 1 — property types */}
         <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Property types</h2>
               <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                     className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#095256]/20 shadow-2xs" />
                  {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {filtered.map((c) => {
                  const Icon = TYPE_ICON[norm(c.category)] || Building2;
                  const count = typeCounts[norm(c.category)] || 0;
                  return (
                     <div key={c._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                           <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-[#095256]"><Icon className="w-5 h-5" /></div>
                           <div className="flex gap-1">
                              <button onClick={() => openEdit(c)} title="Edit" className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 border border-slate-100"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(c)} title="Delete" className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 border border-slate-100"><Trash2 className="w-3.5 h-3.5" /></button>
                           </div>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 truncate">{c.title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Code: {c.category}</p>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[2rem]">{c.description}</p>
                        <div className="aspect-[3/1] rounded-lg overflow-hidden bg-slate-50 border border-slate-100 my-3 flex items-center justify-center">
                           {c.images?.[0] ? <img src={c.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-300" />}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                           <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider",
                              c.status === "Inactive" ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                              {c.status || "Active"}
                           </span>
                           <span className="text-[11px] font-semibold text-slate-500">{count} {count === 1 ? "property" : "properties"}</span>
                        </div>
                     </div>
                  );
               })}

               <button onClick={openAdd} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-slate-800 hover:bg-white hover:shadow-lg transition-all group min-h-[200px]">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-sm">
                     <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Add property type</span>
               </button>
            </div>
            {filtered.length === 0 && search && <p className="text-sm text-slate-400">No category matches "{search}".</p>}
         </section>

         {/* Section 2 — quality tiers (fixed in code: the approval flow depends on exactly these three) */}
         <section className="space-y-4 pb-10">
            <div>
               <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Quality tiers</h2>
               <p className="text-xs text-slate-500 mt-0.5">Assigned to each property when a visit report is approved.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               {PROPERTY_TIERS.map((t) => (
                  <div key={t.key} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md flex items-center gap-4">
                     <div className={cn("w-11 h-11 rounded-xl border flex items-center justify-center shrink-0", TIER_STYLE[t.key])}><Crown className="w-5 h-5" /></div>
                     <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800">{t.label}</p>
                        <p className="text-[11px] text-slate-500 truncate">{t.publicName}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-2xl font-bold text-slate-800 leading-none">{tierCounts[t.key] || 0}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">properties</p>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         {/* Add / Edit modal */}
         {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
               <form onSubmit={handleSave} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg p-6 space-y-4">
                  <div>
                     <h3 className="text-lg font-bold text-slate-800">{editingId ? "Edit category" : "Add category"}</h3>
                     <p className="text-xs text-slate-400">A property type shown on the platform, like PG or Apartment.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className={labelCls}>Title</label>
                        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="e.g. Villa" />
                     </div>
                     <div>
                        <label className={labelCls}>Code</label>
                        <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} placeholder="e.g. Villa" />
                     </div>
                  </div>
                  <div>
                     <label className={labelCls}>Description</label>
                     <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                     <label className={labelCls}>Cover image</label>
                     <div className="flex gap-2">
                        <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={cn(inputCls, "flex-1")} placeholder="Paste an image link or upload" />
                        <label className="shrink-0 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-3 flex items-center text-xs font-bold cursor-pointer hover:bg-slate-200">
                           {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                           <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                        </label>
                     </div>
                  </div>
                  <div>
                     <label className={labelCls}>Status</label>
                     <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                     </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                     <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
                     <button type="submit" disabled={saving || uploading} className="px-4 py-2 rounded-xl text-sm font-medium bg-[#095256] text-white hover:bg-[#074043] disabled:opacity-40">
                        {saving ? "Saving..." : editingId ? "Save changes" : "Add category"}
                     </button>
                  </div>
               </form>
            </div>
         )}
      </div>
   );
}

function Stat({ label, value, icon: Icon, color }) {
   const bg = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      amber: "bg-amber-50 text-amber-600 border-amber-100",
      emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
   };
   return (
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md flex items-center gap-3">
         <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", bg[color])}><Icon className="w-5 h-5" /></div>
         <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{label}</p>
            <p className="text-xl font-bold text-slate-800 tracking-tight leading-tight">{value}</p>
         </div>
      </div>
   );
}
