import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { MobileTabs, MobileEmptyState, MobileStatCard, cn } from "../../components/propertyowner/MobileComponents";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerProperties } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { cacheGet, cacheSet, cacheInvalidate } from "../../utils/cache";
import { Search, Plus, Phone, MessageCircle, MoreHorizontal, X, Mail, MapPin, Loader2, Trash2, Users, TrendingUp, CalendarCheck, UserCheck, BookOpen, Check, MessageSquare } from "lucide-react";

const Pill = ({ tone="muted", children }) => {
  const t = { 
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30", 
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30", 
    muted: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/30", 
    info: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30" 
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${t[tone] || t.muted}`}>{children}</span>;
};

export default function Enquiry() {
  const owner = getOwnerRuntimeSession();
  
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [enquiries, setEnquiries] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  
  // Add Lead Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    studentName: "",
    studentPhone: "",
    studentEmail: "",
    propertyId: "",
    propertyName: "",
    source: "Website",
    interest: "Single AC Room",
    budget: "",
    status: "new",
    notes: ""
  });

  const loadData = async ({ silent = false } = {}) => {
    const ENQ_KEY = `enquiries:${owner.loginId}`;
    if (!silent) {
      const cached = cacheGet(ENQ_KEY);
      if (cached) {
        setEnquiries(cached);
        setLoading(false);
        loadData({ silent: true });
        return;
      }
      setLoading(true);
    }
    try {
      const [enqRes, propRes] = await Promise.all([
        apiFetch(`/api/owners/${owner.loginId}/enquiries`),
        fetchOwnerProperties(owner.loginId).catch(() => [])
      ]);
      const normalizedEnquiries = Array.isArray(enqRes) ? enqRes : (enqRes?.data || enqRes?.enquiries || []);
      setEnquiries(normalizedEnquiries);
      cacheSet(ENQ_KEY, normalizedEnquiries, 3 * 60 * 1000);
      if (propRes) {
        setProperties(propRes);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [owner.loginId]);

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Resolve selected property name
      let selectedPropName = "";
      if (form.propertyId) {
        const found = properties.find(p => p._id === form.propertyId);
        if (found) selectedPropName = found.title || found.name || "";
      }

      const bodyData = {
        ...form,
        ownerLoginId: owner.loginId,
        propertyName: selectedPropName
      };

      await apiFetch(`/api/owners/${owner.loginId}/enquiries`, {
        method: "POST",
        body: JSON.stringify(bodyData)
      });

      // Reset Form & reload
      setForm({
        studentName: "",
        studentPhone: "",
        studentEmail: "",
        propertyId: "",
        propertyName: "",
        source: "Website",
        interest: "Single AC Room",
        budget: "",
        status: "new",
        notes: ""
      });
      setShowModal(false);
      cacheInvalidate(`enquiries:`);
      await loadData();
    } catch (err) {
      console.error("Error creating enquiry:", err);
      alert(`Failed to add lead: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      // We will PATCH status to 'rejected' / 'deleted', or call DELETE.
      // Since Enquiry schema doesn't have deleted status specifically, let's update status to 'rejected'
      await apiFetch(`/api/owners/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" })
      });
      cacheInvalidate(`enquiries:`);
      await loadData();
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert(`Action failed: ${err.message}`);
    }
  };

  // Status checks for mapping tabs
  const getEnquiryStatusGroup = (status = "") => {
    const s = status.toLowerCase();
    if (s === "new" || s === "pending" || s === "request to connect" || s === "follow-up") return "new";
    if (s === "site-visit" || s === "visit" || s === "scheduled") return "site-visit";
    if (s === "booking" || s === "confirmed" || s === "closed") return "bookings";
    return s;
  };

  const filtered = enquiries.filter(l => {
    const matchesTab = tab === "all" || getEnquiryStatusGroup(l.status) === tab;
    const matchesSearch = !search || 
      (l.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.studentPhone || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.propertyName || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Calculate counts dynamically
  const totalCount = enquiries.length;
  const newCount = enquiries.filter(x => getEnquiryStatusGroup(x.status) === "new").length;
  const visitCount = enquiries.filter(x => getEnquiryStatusGroup(x.status) === "site-visit").length;
  const bookingsCount = enquiries.filter(x => getEnquiryStatusGroup(x.status) === "bookings").length;

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Leads & Enquiries" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 hidden md:flex">
        <div>
          <h1 className="text-[20px] md:text-[44px] font-bold md:font-serif leading-[1.05] text-foreground">Leads & Enquiries</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Track every lead and convert them to tenants.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition md:mt-2"
        >
          <Plus className="size-4"/> Add Lead
        </button>
      </div>



      {/* Stats Cards — Desktop: 4-col horizontal strip, Mobile: 2x2 grid */}
      <div className="hidden md:grid md:grid-cols-4 gap-3 mb-6">
        {[
          { l: "Total", v: totalCount, bg: "bg-blue-50/50 border border-blue-150/60 text-blue-600 dark:bg-blue-950/10", text: "text-blue-900 dark:text-blue-300" },
          { l: "New", v: newCount, bg: "bg-indigo-50/50 border border-indigo-150/60 text-indigo-600 dark:bg-indigo-950/10", text: "text-indigo-900 dark:text-indigo-300" },
          { l: "Site Visit", v: visitCount, bg: "bg-emerald-50/50 border border-emerald-150/60 text-emerald-600 dark:bg-emerald-950/10", text: "text-emerald-900 dark:text-emerald-300" },
          { l: "Bookings", v: bookingsCount, bg: "bg-purple-50/50 border border-purple-150/60 text-purple-600 dark:bg-purple-950/10", text: "text-purple-900 dark:text-purple-300" }
        ].map(({ l, v, bg, text }) => (
          <div key={l} className={`rounded-xl border p-4 shadow-sm text-center hover:shadow-md transition-all ${bg}`}>
            <div className={`text-2xl font-black leading-none ${text}`}>{v}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider mt-1.5">{l}</div>
          </div>
        ))}
      </div>

      {/* Mobile Stats: single row horizontal scroll (MobileStatCard style) */}
      <div className="flex overflow-x-auto gap-3 pb-2 mb-5 md:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {[
          { title: "Total",     value: totalCount,    subtext: "All leads",    icon: Users,         bg: "bg-blue-50",   ic: "text-blue-600" },
          { title: "New",       value: newCount,      subtext: "Needs action", icon: TrendingUp,    bg: "bg-indigo-50", ic: "text-indigo-600" },
          { title: "Site Visit",value: visitCount,    subtext: "Scheduled",    icon: CalendarCheck, bg: "bg-emerald-50",ic: "text-emerald-600" },
          { title: "Bookings",  value: bookingsCount, subtext: "Confirmed",    icon: BookOpen,      bg: "bg-purple-50", ic: "text-purple-600" },
        ].map(({ title, value, subtext, icon: Icon, bg, ic }) => (
          <div key={title} className="shrink-0 w-[130px] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-transform">
            <div className="flex items-start justify-between mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${ic}`} />
              </div>
            </div>
            <div>
              <h3 className="text-[22px] font-black text-slate-900 leading-tight">{value}</h3>
              <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{title}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-1">{subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="hidden md:flex flex-wrap items-center gap-1.5 mb-5 border-b border-border">
        {[
          { k: "all", l: "All" },
          { k: "new", l: "New" },
          { k: "site-visit", l: "Site Visit" },
          { k: "bookings", l: "Bookings" }
        ].map(({ k, l }) => (
          <button 
            key={k} 
            onClick={() => setTab(k)} 
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search leads by name, phone or property..." 
          className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
        />
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading leads...</p>
        </div>
      ) : filtered.length === 0 ? (
        <>
          <div className="hidden md:flex rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
            <p className="text-[13.5px] text-muted-foreground">No leads found matching current filters.</p>
          </div>
          <div className="block md:hidden">
            <MobileEmptyState
              icon={Users}
              title="No Leads Found"
              description="You have no leads in this category or matching your search."
              actionText="Add New Lead"
              onAction={() => setShowModal(true)}
            />
          </div>
        </>
      ) : (
        <div>
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border">
                  <th className="px-5 py-3.5 font-bold">Name</th>
                  <th className="px-5 py-3.5 font-bold">Contact</th>
                  <th className="px-5 py-3.5 font-bold">Property</th>
                  <th className="px-5 py-3.5 font-bold">Interest</th>
                  <th className="px-5 py-3.5 font-bold">Source</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Date</th>
                  <th className="px-5 py-3.5 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(l => {
                  const mappedStatus = getEnquiryStatusGroup(l.status);
                  const phoneClean = (l.studentPhone || "").replace(/[^0-9]/g, "");
                  
                  return (
                    <tr key={l._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-foreground">{l.studentName || "N/A"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-muted-foreground text-[12px]">
                            <Phone className="size-3 shrink-0" /> {l.studentPhone || "—"}
                          </span>
                          {l.studentEmail && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Mail className="size-2.5 shrink-0" /> {l.studentEmail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground font-medium">
                        {l.propertyName ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3 text-slate-400" />
                            {l.propertyName}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{l.interest || "—"}</td>
                      <td className="px-5 py-3.5">
                        <Pill tone="info">{l.source || "Website"}</Pill>
                      </td>
                      <td className="px-5 py-3.5">
                        <Pill tone={mappedStatus === "new" ? "info" : mappedStatus === "site-visit" ? "success" : "warning"}>
                          {l.status}
                        </Pill>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {l.ts ? new Date(l.ts).toLocaleDateString("en-IN") : "Recent"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => window.location.href = `/propertyowner/tenantrec?name=${encodeURIComponent(l.studentName || '')}&email=${encodeURIComponent(l.studentEmail || '')}&phone=${encodeURIComponent(l.studentPhone || '')}&propertyId=${encodeURIComponent(l.propertyId || '')}`}
                            className="h-8 px-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11.5px] font-bold transition-colors"
                            title="Add Tenant"
                          >
                            Add Tenant
                          </button>
                          {phoneClean && (
                            <a 
                              href={`https://wa.me/${phoneClean}`}
                              target="_blank"
                              rel="noreferrer"
                              className="size-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 grid place-items-center transition"
                            >
                              <MessageCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                            </a>
                          )}
                          <button 
                            onClick={() => handleDelete(l._id)}
                            className="size-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 grid place-items-center transition text-rose-600 dark:text-rose-400"
                          >
                            <Trash2 className="size-4" />
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

          {/* Mobile Cards (Redesigned - Tenants style) */}
          <div className="block md:hidden space-y-3 pb-12">
            {filtered.map(l => {
              const mappedStatus = getEnquiryStatusGroup(l.status);
              const phoneClean = (l.studentPhone || "").replace(/[^0-9]/g, "");

              return (
                <div key={`mob-${l._id}`} className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm relative overflow-hidden">
                  {/* Status Badges Row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                      mappedStatus === "new" ? "bg-blue-50 text-blue-600 border-blue-100" :
                      mappedStatus === "site-visit" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      mappedStatus === "bookings" ? "bg-purple-50 text-purple-600 border-purple-100" :
                      "bg-amber-50 text-amber-600 border-amber-100"
                    }`}>
                      {l.status || "New"}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {l.ts ? new Date(l.ts).toLocaleDateString("en-IN") : "Recent"}
                    </span>
                  </div>

                  {/* Profile Row */}
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[18px] font-black shrink-0 border border-blue-100 uppercase">
                      {(l.studentName || "N")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-black text-slate-900 truncate">{l.studentName || "N/A"}</h3>
                      <p className="text-[11.5px] font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5" /> {l.propertyName || "Any"}
                      </p>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Budget</p>
                       <p className="text-[14px] font-black text-slate-800 leading-none">₹{(l.budget || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Interest</p>
                       <p className="text-[12px] font-bold text-indigo-600 mt-0.5">{l.interest || "PG"}</p>
                    </div>
                  </div>

                  {/* CRM Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => window.location.href = `/propertyowner/tenantrec?name=${encodeURIComponent(l.studentName || '')}&email=${encodeURIComponent(l.studentEmail || '')}&phone=${encodeURIComponent(l.studentPhone || '')}&propertyId=${encodeURIComponent(l.propertyId || '')}`}
                      className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Onboard Tenant
                    </button>
                    <div className="flex gap-2">
                      <a href={`tel:${l.studentPhone}`} className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm">
                        <Phone className="w-4 h-4 text-blue-500 mb-0.5" />
                        Call
                      </a>
                      {phoneClean && (
                        <a href={`https://wa.me/${phoneClean}?text=Hi%20${l.studentName}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-600 text-[11px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm">
                          <MessageCircle className="w-4 h-4 text-emerald-500 mb-0.5" />
                          WhatsApp
                        </a>
                      )}
                      <button onClick={() => handleDelete(l._id)} className="w-12 py-3 rounded-xl bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 hover:bg-rose-100 transition-colors border border-rose-100 shadow-sm shrink-0">
                        <Trash2 className="w-4 h-4 text-rose-500 mb-0.5" />
                        Drop
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition p-1 hover:bg-muted rounded-full"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-serif text-[24px] font-bold text-foreground mb-4">Add Manual Lead</h3>
            
            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Lead Name *</label>
                  <input 
                    required
                    value={form.studentName}
                    onChange={e => setForm(prev => ({ ...prev, studentName: e.target.value }))}
                    placeholder="Enter full name"
                    className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Phone Number *</label>
                  <input 
                    required
                    type="tel"
                    value={form.studentPhone}
                    onChange={e => setForm(prev => ({ ...prev, studentPhone: e.target.value }))}
                    placeholder="e.g. +91 9999999999"
                    className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Email Address</label>
                <input 
                  type="email"
                  value={form.studentEmail}
                  onChange={e => setForm(prev => ({ ...prev, studentEmail: e.target.value }))}
                  placeholder="e.g. name@domain.com"
                  className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Target Property</label>
                  <select 
                    value={form.propertyId}
                    onChange={e => setForm(prev => ({ ...prev, propertyId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Property...</option>
                    {properties.map(p => (
                      <option key={p._id} value={p._id}>{p.title || p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Lead Source</label>
                  <select 
                    value={form.source}
                    onChange={e => setForm(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Website">Website</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Referral">Referral</option>
                    <option value="Instagram Ad">Instagram Ad</option>
                    <option value="Google Maps">Google Maps</option>
                    <option value="Cold Call">Cold Call</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Room Interest</label>
                  <input 
                    value={form.interest}
                    onChange={e => setForm(prev => ({ ...prev, interest: e.target.value }))}
                    placeholder="e.g. Double Sharing AC"
                    className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Target Budget</label>
                  <input 
                    value={form.budget}
                    onChange={e => setForm(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="e.g. ₹9,000/mo"
                    className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Initial Status</label>
                  <select 
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="new">New Lead</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="site-visit">Site Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Conversation Notes</label>
                <textarea 
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Summarize customer call or chat..."
                  className="w-full p-3 rounded-lg bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-border mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 border border-border rounded-lg text-[13px] font-bold text-muted-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 h-10 bg-foreground text-background rounded-lg text-[13px] font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Lead"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}

