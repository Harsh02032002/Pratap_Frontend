import React, { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
   Search, Edit3, Trash2, Plus, X,
   Download, Image as ImageIcon, Loader2
} from "lucide-react";
import { fetchJson, clearApiCache } from "../../utils/api";
import { compressImage } from "../../utils/imageCompression";
import { PROPERTY_TIERS, normalizeTierKey } from "../../utils/propertyTiers";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// "Co-living" / "coliving" / "Co Living" all compare equal.
const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const emptyForm = () => ({ title: "", category: "", description: "", image: "", status: "Active" });

export default function Categories() {
   const [types, setTypes] = useState([]);
   const [properties, setProperties] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [search, setSearch] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");

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
      return types.filter((c) => {
         const matchSearch = !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
         const st = c.status || "Active";
         const matchStatus = statusFilter === "all" || st.toLowerCase() === statusFilter.toLowerCase();
         return matchSearch && matchStatus;
      });
   }, [types, search, statusFilter]);

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

   const inputCls = "w-full bg-white border border-[#CBD3D9] rounded-[8px] py-2 px-3 text-[13px] text-[#10242A] outline-none focus:border-[#0E7C86] shadow-xs";
   const labelCls = "block text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider mb-1";

   return (
      <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Property Categories</h1>
               <p className="text-[13px] text-[#4A5961] mt-0.5">Manage platform property categories and classification schemas</p>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={handleExport} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition shadow-xs flex items-center gap-2 cursor-pointer">
                  <Download className="w-4 h-4 text-[#4A5961]" /> Export
               </button>
               <button onClick={openAdd} className="bg-[#0E7C86] hover:bg-[#0B666E] text-white px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition shadow-xs flex items-center gap-2 cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Category
               </button>
            </div>
         </div>

         {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[13px] rounded-[12px] px-4 py-3 flex items-center justify-between">
               <span>{error}</span>
               <button onClick={load} className="font-semibold underline cursor-pointer">Retry</button>
            </div>
         )}

         {/* Stat Cards (NO ICONS) */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Property types" value={loading ? "..." : types.length} />
            <Stat label="Active" value={loading ? "..." : activeCount} />
            <Stat label="Inactive" value={loading ? "..." : (types.length - activeCount)} />
            <Stat label="Properties listed" value={loading ? "..." : properties.length} />
         </div>

         {/* Search & Filter Row (Outside & Above the Table Card) */}
         <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-[320px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
               <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search category or code..."
                  className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
               />
               {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5961] hover:text-[#10242A]">
                     <X className="w-3.5 h-3.5" />
                  </button>
               )}
            </div>
            <div className="flex items-center gap-3">
               <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
               >
                  <option value="all">Status ▾</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
               </select>
            </div>
         </div>

         {/* Table Card — Property Types */}
         <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Category</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Code</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Description</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Properties</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                     {loading ? (
                        <tr><td colSpan="6" className="py-6 text-center text-[13px] text-[#4A5961]">Loading categories...</td></tr>
                     ) : filtered.length === 0 ? (
                        <tr><td colSpan="6" className="py-6 text-center text-[13px] text-[#4A5961]">No categories found.</td></tr>
                     ) : filtered.map((c) => {
                        const count = typeCounts[norm(c.category)] || 0;
                        return (
                           <tr key={c._id} className="hover:bg-[#F9FAFB] transition-colors">
                              <td className="py-2.5 pl-2 pr-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-7 rounded-[6px] overflow-hidden bg-[#F4F6F8] border border-[#E1E6EA] flex items-center justify-center shrink-0">
                                       {c.images?.[0] ? <img src={c.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-3.5 h-3.5 text-[#708088]" />}
                                    </div>
                                    <span className="font-semibold text-[#10242A] text-[13px]">{c.title}</span>
                                 </div>
                              </td>
                              <td className="py-2.5 pr-4 text-[13px] text-[#4A5961] font-mono uppercase">{c.category}</td>
                              <td className="py-2.5 pr-4 text-[13px] text-[#4A5961] max-w-[280px] truncate">{c.description || "—"}</td>
                              <td className="py-2.5 pr-4 text-[13px] text-[#10242A] font-semibold">{count} {count === 1 ? "property" : "properties"}</td>
                              <td className="py-2.5 pr-4">
                                 <span className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                                    c.status === "Inactive" ? "bg-[#FDE8E8] text-[#991B1B]" : "bg-[#DDF3E4] text-[#14532D]"
                                 )}>
                                    {c.status || "Active"}
                                 </span>
                              </td>
                              <td className="py-2.5 pl-4 pr-2 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => openEdit(c)} className="px-3 py-1 bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] rounded-[6px] text-[11px] font-semibold transition shadow-xs cursor-pointer">
                                       Edit
                                    </button>
                                    <button onClick={() => handleDelete(c)} className="px-3 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-[6px] text-[11px] font-semibold transition shadow-xs cursor-pointer">
                                       Delete
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Section 2 — Quality Tiers */}
         <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-[14px] font-bold text-[#10242A]">Quality Tiers</h2>
                  <p className="text-[12px] text-[#4A5961]">Assigned to each property when a visit report is approved</p>
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               {PROPERTY_TIERS.map((t) => (
                  <div key={t.key} className="bg-[#F9FAFB] rounded-[10px] p-3.5 border border-[#E1E6EA] flex items-center justify-between">
                     <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#10242A]">{t.label}</p>
                        <p className="text-[12px] text-[#4A5961] truncate">{t.publicName}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[20px] font-bold text-[#10242A] leading-none">{tierCounts[t.key] || 0}</p>
                        <p className="text-[10px] font-semibold text-[#4A5961] uppercase tracking-wider mt-1">properties</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Add / Edit modal */}
         {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
               <form onSubmit={handleSave} onClick={(e) => e.stopPropagation()} className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xl w-full max-w-lg p-5 space-y-4">
                  <div>
                     <h3 className="text-[16px] font-bold text-[#10242A]">{editingId ? "Edit Category" : "Add Category"}</h3>
                     <p className="text-[12px] text-[#4A5961]">A property type shown on the platform, like PG or Apartment.</p>
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
                        <label className="shrink-0 bg-white text-[#10242A] border border-[#CBD3D9] rounded-[8px] px-3 flex items-center text-[12px] font-semibold cursor-pointer hover:bg-gray-50">
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
                     <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-1.5 rounded-[8px] text-[13px] font-semibold bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50 cursor-pointer">Cancel</button>
                     <button type="submit" disabled={saving || uploading} className="px-4 py-1.5 rounded-[8px] text-[13px] font-semibold bg-[#0E7C86] text-white hover:bg-[#0B666E] disabled:opacity-40 cursor-pointer">
                        {saving ? "Saving..." : editingId ? "Save Changes" : "Add Category"}
                     </button>
                  </div>
               </form>
            </div>
         )}
      </div>
   );
}

function Stat({ label, value }) {
   return (
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
         <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
         <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{value}</h3>
         </div>
      </div>
   );
}
