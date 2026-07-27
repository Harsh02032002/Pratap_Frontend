import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerProperties } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { cacheGet, cacheSet, cacheInvalidate } from "../../utils/cache";
import { 
  Search, Plus, Phone, MessageCircle, X, Mail, MapPin, Loader2, Trash2, Users, 
  TrendingUp, CalendarCheck, BookOpen, Check, MessageSquare, Wallet, Building2
} from "lucide-react";

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
    interest: "Single Room",
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
      
      // Filter out deleted/rejected items
      const activeLeads = normalizedEnquiries.filter(e => {
        const s = String(e.status || '').toLowerCase();
        return s !== 'deleted' && s !== 'rejected' && s !== 'cancelled' && !e.isDeleted;
      });

      setEnquiries(activeLeads);
      cacheSet(ENQ_KEY, activeLeads, 3 * 60 * 1000);
      if (propRes) setProperties(propRes);
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

      setForm({
        studentName: "",
        studentPhone: "",
        studentEmail: "",
        propertyId: "",
        propertyName: "",
        source: "Website",
        interest: "Single Room",
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
      // Instantly update local state so lead disappears
      setEnquiries(prev => prev.filter(e => e._id !== id));
      cacheInvalidate(`enquiries:`);

      await apiFetch(`/api/owners/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "deleted", isDeleted: true })
      });
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert(`Action failed: ${err.message}`);
      loadData({ silent: true });
    }
  };

  const formatNoteSimple = (notes, budgetStr = "") => {
    if (!notes) return "";
    const str = String(notes);
    if (str.includes("Tenant Budget:") || str.includes("Tenant Max Budget:") || str.includes("Flexible Bid:") || str.includes("Agar aap")) {
      const cleanBudget = String(budgetStr).replace(/[^\d]/g, "");
      const match = str.match(/₹([\d,]+)/);
      const amount = cleanBudget && cleanBudget !== "0" ? Number(cleanBudget).toLocaleString("en-IN") : (match ? match[1] : "7,000");
      return `Tenant Max Budget: ₹${amount}. If you can offer this property for ₹${amount}/month, please accept the bid.`;
    }
    return str;
  };

  const getEnquiryStatusGroup = (status = "") => {
    const s = String(status).toLowerCase();
    if (s === "new" || s === "pending" || s === "request to connect" || s === "follow-up" || s === "") return "new";
    if (s === "site-visit" || s === "visit" || s === "scheduled") return "site-visit";
    if (s === "booking" || s === "confirmed" || s === "booked" || s === "active" || s === "closed") return "bookings";
    return s;
  };

  const filtered = enquiries.filter(l => {
    const matchesTab = tab === "all" || getEnquiryStatusGroup(l.status) === tab;
    const matchesSearch = !search || 
      (l.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.studentPhone || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.propertyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.preferredCity || l.city || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Leads & Enquiries</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Track every lead, view budget preferences, and convert prospects to tenants.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm md:mt-2"
        >
          <Plus className="size-4"/> Add Manual Lead
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Leads", value: totalCount, sub: "Leads", color: "text-blue-600" },
          { label: "New Enquiries", value: newCount, sub: "Enquiries", color: "text-indigo-600" },
          { label: "Bookings", value: bookingsCount, sub: "Confirmed", color: "text-purple-600" }
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-md transition-all">
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
            <h3 className={`text-[28px] font-bold mt-1 ${color}`}>
              {value} <span className="text-[14px] font-semibold text-muted-foreground">{sub}</span>
            </h3>
          </div>
        ))}
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
          {[
            { k: "all", l: `All (${totalCount})` },
            { k: "new", l: `New (${newCount})` },
            { k: "bookings", l: `Bookings (${bookingsCount})` }
          ].map(({ k, l }) => (
            <button 
              key={k} 
              onClick={() => setTab(k)} 
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${tab === k ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search leads by name, city, or property..." 
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Cards Grid UI */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading leads & enquiries...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center shadow-soft">
          <Users size={44} className="mx-auto text-muted-foreground/60 mb-4" />
          <h3 className="font-serif text-[22px] font-bold text-foreground">No Leads Found</h3>
          <p className="text-[13px] text-muted-foreground mt-1">There are no leads matching your current search or tab filter.</p>
          <button onClick={() => { setTab("all"); setSearch(""); }} className="mt-4 text-xs font-bold text-primary underline underline-offset-2">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(l => {
            const cityDisplay = String(l.preferredCity || l.city || l.filter_criteria?.city || (l.location ? l.location.split(',').pop().trim() : "")).trim();
            const areaRaw = String(l.preferredArea || l.area || l.filter_criteria?.area || l.filter_criteria?.location || (l.location && l.location.includes(',') ? l.location.split(',')[0].trim() : "")).trim();
            const areaDisplay = areaRaw.toLowerCase() === cityDisplay.toLowerCase() ? "" : areaRaw;
            const phoneClean = String(l.studentPhone || l.phone || "").replace(/[^0-9]/g, "");

            return (
              <div key={l._id} className="rounded-3xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-4">
                  {/* Top Status & Date Row */}
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      {l.source || "Website"}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {l.ts ? new Date(l.ts).toLocaleDateString("en-IN") : "Today"}
                    </span>
                  </div>

                  {/* Profile & Name */}
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg font-black uppercase shadow-sm shrink-0">
                      {(l.studentName || "P")[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-[21px] font-bold text-foreground truncate">{l.studentName || "Prospect"}</h3>
                      <p className="text-[12px] font-semibold text-muted-foreground truncate flex items-center gap-1">
                        <Building2 size={12} className="text-slate-400" /> {l.propertyName || "Any Property"}
                      </p>
                    </div>
                  </div>

                  {/* Verification Badges (Privacy Shield - OTP Verified) */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                      <Check size={11} className="text-emerald-600 stroke-[3]" /> OTP Verified Phone
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                      <Check size={11} className="text-emerald-600 stroke-[3]" /> OTP Verified Email
                    </span>
                  </div>

                  {/* Preferred City & Location Details */}
                  <div className="border-t border-border/60 pt-4 space-y-2 text-xs">
                    {cityDisplay && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Preferred City:</span>
                        <span className="font-bold text-foreground">{cityDisplay}</span>
                      </div>
                    )}
                    {areaDisplay && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Preferred Area:</span>
                        <span className="font-bold text-foreground">{areaDisplay}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Room Interest:</span>
                      <span className="font-bold text-indigo-600">{l.interest || "PG / Hostel"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Budget:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Wallet size={12} className="text-emerald-600" /> {l.budget || (l.bid_amount ? `₹${l.bid_amount.toLocaleString("en-IN")}` : "Flexible")}
                      </span>
                    </div>

                    {l.notes && (
                      <div className="pt-2">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Requirement / Notes:</p>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 italic leading-relaxed">
                          "{formatNoteSimple(l.notes, l.budget)}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="border-t border-border/60 mt-6 pt-4 space-y-2">
                  <button
                    onClick={() => window.location.href = `/propertyowner/tenantrec?name=${encodeURIComponent(l.studentName || '')}&email=${encodeURIComponent(l.studentEmail || '')}&phone=${encodeURIComponent(l.studentPhone || '')}&propertyId=${encodeURIComponent(l.propertyId || '')}`}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    Onboard as Tenant
                  </button>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDelete(l._id)}
                      className="w-full h-10 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      title="Delete Lead"
                    >
                      <Trash2 size={14} /> Drop Lead
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Phone Number *</label>
                  <input 
                    required
                    type="tel"
                    value={form.studentPhone}
                    onChange={e => setForm(prev => ({ ...prev, studentPhone: e.target.value }))}
                    placeholder="e.g. 9876543210"
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Target Property</label>
                  <select 
                    value={form.propertyId}
                    onChange={e => setForm(prev => ({ ...prev, propertyId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    placeholder="e.g. Single Room AC"
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Target Budget</label>
                  <input 
                    value={form.budget}
                    onChange={e => setForm(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="e.g. ₹7,000/mo"
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-muted-foreground uppercase mb-1">Conversation Notes</label>
                <textarea 
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Summarize customer call or chat..."
                  className="w-full p-3 rounded-xl bg-muted/40 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-border mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-11 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
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
