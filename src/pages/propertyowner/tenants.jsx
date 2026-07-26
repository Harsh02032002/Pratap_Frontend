import React, { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { MobileTabs, MobileEmptyState, cn } from "../../components/propertyowner/MobileComponents";
import {
  Plus, Search, ArrowUpDown, Download, Users, ExternalLink,
  User, CalendarClock, CheckCircle, AlertTriangle, Phone,
  Shield, Building2, FileText, BadgeCheck, X, MapPin, Mail,
  CreditCard, Home, Edit, Eye, Activity, MessageSquare, IndianRupee, Send, Trash2
} from "lucide-react";
import {
  clearOwnerRuntimeSession,
  fetchOwnerTenants,
  getOwnerRuntimeSession,
  updateTenant,
  clearOwnerFetchCache,
  fetchOwnerRooms
} from "../../utils/propertyowner";
import { API_URL } from "../../utils/api";

const getFileUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return `${API_URL}/${url}`;
};

const Pill = ({ tone = "muted", children }) => {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success-foreground",
    warning: "bg-warning/20 text-foreground",
    info: "bg-info/15 text-foreground",
    danger: "bg-destructive/15 text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium ${toneMap[tone] || toneMap.muted}`}>
      {children}
    </span>
  );
};

const PAGE_SIZE = 30;

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const val = (...sources) => sources.find(v => v !== undefined && v !== null && v !== "") || "—";

const InfoField = ({ label, value, mono, wide }) => (
  <div className={wide ? "col-span-2 sm:col-span-3" : ""}>
    <div className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wide">{label}</div>
    <div className={`text-[13px] font-medium text-foreground break-words ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
  </div>
);

const SectionHead = ({ icon: Icon, title, color = "text-primary" }) => (
  <h3 className={`text-[13.5px] font-semibold text-foreground mb-3 flex items-center gap-2`}>
    <Icon size={15} className={color} /> {title}
  </h3>
);

export default function Tenants() {
  const [owner, setOwner] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState("all");

  const getDisplayStatus = (t) => {
    if ((t.status === "active" || t.active) && (t.kycStatus !== "verified" && t.kyc !== "verified")) {
      return "pending";
    }
    return t.status || "active";
  };
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("overview");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "", phone: "", email: "",
    dob: "", gender: "",
    idProofType: "Aadhaar Card", idProofNumber: "",
    roomNo: "", bedNo: "",
    agreedRent: "", depositAmount: "",
    moveInDate: "", paymentFrequency: "Monthly",
    floor: "", building: "",
    emergencyName: "", emergencyPhone: "", relationship: "",
    occupation: "", permanentAddress: "", remarks: ""
  });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");

  // Transfer room states
  const [rooms, setRooms] = useState([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferringTenant, setTransferringTenant] = useState(null);
  const [transferForm, setTransferForm] = useState({
    roomId: "",
    roomNo: "",
    bedNo: "",
    agreedRent: 0,
    transferDate: new Date().toISOString().split("T")[0]
  });

  const handleEditClick = (t) => {
    // Navigate to full Add Tenant form in edit mode (same page, pre-filled)
    const tenantId = t._id || t.id;
    window.location.href = `/propertyowner/tenantrec?edit=${tenantId}`;
  };

  const handleDeleteClick = async (t) => {
    if (!window.confirm(`Are you sure you want to delete tenant ${t.name}? This action cannot be undone.`)) {
      return;
    }
    const tenantId = t._id || t.id;
    try {
      await fetchJson(`/api/tenants/${tenantId}`, { method: 'DELETE' });
      setTenants(prev => prev.filter(t => (t._id !== tenantId && t.id !== tenantId)));
      if (owner?.loginId) clearOwnerFetchCache(owner.loginId);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || 'Failed to delete tenant.');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTenant?._id && !editingTenant?.id) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const updated = await updateTenant(editingTenant._id || editingTenant.id, {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        dob: editForm.dob,
        gender: editForm.gender,
        idProof: { type: editForm.idProofType, number: editForm.idProofNumber },
        roomNo: editForm.roomNo,
        bedNo: editForm.bedNo,
        agreedRent: Number(editForm.agreedRent),
        securityDepositTotal: Number(editForm.depositAmount) || 0,
        moveInDate: editForm.moveInDate,
        paymentFrequency: editForm.paymentFrequency,
        floor: editForm.floor,
        building: editForm.building,
        additional: {
          emergencyName: editForm.emergencyName,
          emergencyPhone: editForm.emergencyPhone,
          relationship: editForm.relationship,
          occupation: editForm.occupation,
          permanentAddress: editForm.permanentAddress,
          remarks: editForm.remarks,
        }
      });
      const returnedTenant = updated?.tenant || updated;
      setTenants(prev => prev.map(t => (t._id === editingTenant._id || t.id === editingTenant.id) ? { ...t, ...returnedTenant } : t));
      setEditModalOpen(false);
      setEditingTenant(null);
      if (owner?.loginId) clearOwnerFetchCache(owner.loginId);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to update tenant details.");
    } finally {
      setSaving(false);
    }
  };

  const handleTransferClick = (t) => {
    setTransferringTenant(t);
    setTransferForm({
      roomId: t.room || "",
      roomNo: t.roomNo || "",
      bedNo: t.bedNo || "",
      agreedRent: t.agreedRent || t.rent || 0,
      transferDate: new Date().toISOString().split("T")[0]
    });
    setTransferModalOpen(true);
  };

  const handleSaveTransfer = async (e) => {
    e.preventDefault();
    if (!transferringTenant?._id && !transferringTenant?.id) return;
    if (!transferForm.roomNo) {
      setErrorMsg("Please select a target room.");
      return;
    }
    if (!transferForm.bedNo) {
      setErrorMsg("Please select a target bed.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const updated = await updateTenant(transferringTenant._id || transferringTenant.id, {
        roomNo: transferForm.roomNo,
        bedNo: transferForm.bedNo,
        agreedRent: Number(transferForm.agreedRent),
        moveInDate: transferForm.transferDate ? new Date(transferForm.transferDate) : undefined
      });
      
      // Update tenant in local state
      setTenants(prev => prev.map(t => (t._id === transferringTenant._id || t.id === transferringTenant.id || t._id === updated._id || t.id === updated.id) ? { ...t, ...updated } : t));
      setTransferModalOpen(false);
      setTransferringTenant(null);
      
      // Clear owner fetch cache so that re-fetch gives fresh data
      if (owner?.loginId) {
        clearOwnerFetchCache(owner.loginId);
      }
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to transfer room.");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveKyc = async (tenantId) => {
    const confirmApprove = window.confirm("Are you sure you want to approve KYC and activate this tenant?");
    if (!confirmApprove) return;
    try {
      await fetchJson("/api/tenants/kyc/approve", {
        method: "POST",
        body: JSON.stringify({ tenantId })
      });
      if (owner?.loginId) clearOwnerFetchCache(owner.loginId);
      // Reload tenants data
      const data = await fetchOwnerTenants(owner.loginId);
      const activeTenantsOnly = (data || []).filter(t => t.status !== "inactive");
      setTenants(activeTenantsOnly);
    } catch (err) {
      alert("Error approving KYC: " + (err.message || err));
    }
  };

  const handleResendKycLink = async (tenantId, tenantName) => {
    const confirmSend = window.confirm(`Resend KYC / Digital Check-in re-upload link to ${tenantName || 'tenant'} via Email?`);
    if (!confirmSend) return;
    try {
      const res = await fetchJson(`/api/tenants/${tenantId}/resend-kyc-link`, {
        method: "POST"
      });
      alert(res.message || "KYC link sent successfully!");
    } catch (err) {
      alert("Error sending KYC link: " + (err.message || err));
    }
  };

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) { window.location.href = "/propertyowner/ownerlogin"; return; }
    setOwner(session);
    const load = async () => {
      // Show stale localStorage data instantly so the page never feels blank
      try {
        const stale = JSON.parse(localStorage.getItem("roomhy_tenants") || "[]");
        if (Array.isArray(stale) && stale.length) {
          setTenants(stale.filter(t => t.status !== "inactive"));
          setLoading(false);
        }
      } catch (_) {}

      // Fetch fresh data in background — updates UI when ready
      try {
        const [tenantsData, roomsData] = await Promise.all([
          fetchOwnerTenants(session.loginId),
          fetchOwnerRooms(session.loginId).catch(() => ({ rooms: [] }))
        ]);
        const activeTenantsOnly = (tenantsData || []).filter(t => t.status !== "inactive");
        setTenants(activeTenantsOnly);
        setRooms(roomsData?.rooms || []);
      } catch (err) {
        setErrorMsg(err?.body || err?.message || "Failed to load tenants.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const counts = useMemo(() => ({
    all: tenants.length,
    active: tenants.filter(t => getDisplayStatus(t) === "active").length,
    notice: tenants.filter(t => t.status === "notice" || t.status === "move-out").length,
    dues: tenants.filter(t => (t.dueAmount || t.dues || t.balance) > 0).length,
  }), [tenants]);

  const filtered = useMemo(() => tenants.filter(t => {
    const matchTab = tab === "all" || (tab === "active" && getDisplayStatus(t) === "active") || (tab === "notice" && (t.status === "notice" || t.status === "move-out")) || (tab === "dues" && (t.dueAmount || t.dues || t.balance) > 0);
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !debouncedSearch || (t.name || "").toLowerCase().includes(q) || (t.phone || "").includes(q) || (t.roomNo || "").toLowerCase().includes(q);
    return matchTab && matchSearch;
  }).sort((a, b) => {
    let valA = a[sortKey] || "";
    let valB = b[sortKey] || "";
    if (sortKey === "rent") {
      valA = Number(a.agreedRent || a.rent || 0);
      valB = Number(b.agreedRent || b.rent || 0);
    } else if (sortKey === "dues") {
      valA = Number(a.dueAmount || a.dues || a.balance || 0);
      valB = Number(b.dueAmount || b.dues || b.balance || 0);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  }), [tenants, tab, debouncedSearch, sortKey, sortOrder]);

  useEffect(() => { setPage(0); }, [filtered]);

  const paginated = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  );

  const handleExportCSV = () => {
    const headers = ["Name,Phone,Room,Rent,Dues,Status,KYC"];
    const rows = filtered.map(t => {
      const roomStr = `Room ${t.roomNo || ""} / Bed ${t.bedNo || ""}`;
      const rentStr = t.agreedRent || t.rent || 0;
      const duesStr = t.dueAmount || t.dues || t.balance || 0;
      return `"${t.name || ""}","${t.phone || ""}","${roomStr}","${rentStr}","${duesStr}","${t.status || "active"}","${t.kycStatus || t.kyc || "pending"}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tenants_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkExportCSV = () => {
    const selectedTenants = filtered.filter(t => selectedIds.has(t._id || t.id));
    const headers = ["Name,Phone,Room,Rent,Dues,Status,KYC"];
    const rows = selectedTenants.map(t => {
      const roomStr = `Room ${t.roomNo || ""} / Bed ${t.bedNo || ""}`;
      const rentStr = t.agreedRent || t.rent || 0;
      const duesStr = t.dueAmount || t.dues || t.balance || 0;
      return `"${t.name || ""}","${t.phone || ""}","${roomStr}","${rentStr}","${duesStr}","${t.status || "active"}","${t.kycStatus || t.kyc || "pending"}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `selected_tenants_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    const confirmMsg = `Send WhatsApp broadcast to all ${selectedIds.size} selected tenants?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const selectedTenants = filtered.filter(t => selectedIds.has(t._id || t.id));
      const ownerName = owner?.name || owner?.fullName || owner?.ownerName || "Your Property Owner";

      for (const tenant of selectedTenants) {
        if (!tenant.phone) {
          failCount++;
          continue;
        }
        try {
          const res = await fetchJson("/api/whatsapp/test-template", {
            method: "POST",
            body: JSON.stringify({
              to: tenant.phone,
              templateName: "roomhy_tenant_broadcast",
              parameters: [tenant.name, broadcastMessage.trim(), ownerName]
            })
          });
          if (res.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(err);
          failCount++;
        }
      }
      alert(`Broadcast complete! Sent: ${successCount}, Failed: ${failCount}`);
      setBroadcastModalOpen(false);
      setBroadcastMessage("");
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      alert("Broadcast failed.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const getInitial = (name) => (name || "T").charAt(0).toUpperCase();
  const getKycTone = (kyc) => 
    kyc === "verified" ? "success" : 
    kyc === "mismatch_review" ? "danger" : 
    kyc === "submitted" ? "warning" : "muted";

  const getStatusTone = (status) => status === "active" ? "success" : status === "notice" ? "warning" : "muted";

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Tenants"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 hidden md:flex">
        <div>
          <h1 className="text-[20px] md:text-[44px] font-bold md:font-serif leading-[1.05] text-foreground">Tenants</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Every person living in your property — their rent, KYC and history in one place.</p>
        </div>
        <div className="flex items-center gap-2 md:mt-2">
          <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-border bg-card text-[13px] font-medium hover:border-primary/40 transition-colors">
            <Download className="size-3.5" /> Export
          </button>
          <a href="/propertyowner/tenantrec" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Plus className="size-4" /> Add tenant
          </a>
        </div>
      </div>




      {errorMsg && <div className="text-sm text-destructive mb-4 bg-destructive/10 px-4 py-3 rounded-lg">{errorMsg}</div>}

      {/* Desktop Tabs */}
      <div className="hidden md:flex flex-wrap items-center gap-1.5 mb-4 border-b border-border">
        {[
          { k: "all", label: "All", count: counts.all },
          { k: "active", label: "Active", count: counts.active },
          { k: "notice", label: "On notice", count: counts.notice },
          { k: "dues", label: "With dues", count: counts.dues }
        ].map((t, i) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={[
              "px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors",
              tab === t.k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            ].join(" ")}
          >
            {t.label} {t.count !== undefined && <span className="text-muted-foreground/70 ml-0.5">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="hidden md:flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, room…"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
        <select value={tab} onChange={e => setTab(e.target.value)} className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-border bg-card text-[13px] font-medium hover:border-primary/40 transition-colors outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="notice">On notice</option>
          <option value="dues">With dues</option>
        </select>
        <div className="relative">
          <select value={`${sortKey}-${sortOrder}`} onChange={e => {
            const [k, o] = e.target.value.split('-');
            setSortKey(k);
            setSortOrder(o);
          }} className="inline-flex items-center gap-1.5 h-10 pl-3 pr-8 rounded-lg border border-border bg-card text-[13px] font-medium hover:border-primary/40 transition-colors outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
            <option value="name-asc">Sort A-Z</option>
            <option value="name-desc">Sort Z-A</option>
            <option value="rent-desc">Rent (High-Low)</option>
            <option value="rent-asc">Rent (Low-High)</option>
            <option value="dues-desc">Dues (High-Low)</option>
          </select>
          <ArrowUpDown className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      </div>
      <div className="block md:hidden mb-4">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tenants..."
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-[14px] shadow-sm focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Bulk Action Bar - Shows when items are selected */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {selectedIds.size}
            </div>
            <span className="text-sm font-semibold text-indigo-900">{selectedIds.size} tenant(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => setBroadcastModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare size={14} /> Send Broadcast
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              <X size={14} /> Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* List Container */}
      <div className="w-full">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
            {[1,2,3].map(i => <div key={i} className="w-full h-12 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <>
            <div className="hidden md:flex py-16 flex-col items-center justify-center text-center rounded-2xl border border-border bg-card">
              <div className="w-14 h-14 bg-muted/60 rounded-full flex items-center justify-center mb-3">
                <Users className="size-7 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-[20px] text-foreground mb-1">No tenants found</h3>
              <p className="text-[13px] text-muted-foreground">Add your first tenant to get started.</p>
            </div>
            <div className="block md:hidden">
              <MobileEmptyState
                icon={Users}
                title="No Tenants Yet"
                description="Manage all your residing tenants and track rent collections from here."
                actionText="Add Tenant"
                onAction={() => window.location.href = '/propertyowner/tenantrec'}
              />
            </div>
          </>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 cursor-pointer"
                          checked={paginated.length > 0 && paginated.every(t => selectedIds.has(t._id || t.id))}
                          onChange={() => {
                            const allSelected = paginated.every(t => selectedIds.has(t._id || t.id));
                            const next = new Set(selectedIds);
                            if (allSelected) {
                              paginated.forEach(t => next.delete(t._id || t.id));
                            } else {
                              paginated.forEach(t => next.add(t._id || t.id));
                            }
                            setSelectedIds(next);
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 font-semibold">Tenant</th>
                      <th className="px-4 py-3 font-semibold">Property · Room</th>
                      <th className="px-4 py-3 font-semibold">Rent</th>
                      <th className="px-4 py-3 font-semibold">Dues</th>
                      <th className="px-4 py-3 font-semibold">KYC</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated.map((t) => (
                      <tr key={t._id || t.id} className="hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => {
                          const next = new Set(selectedIds);
                          const id = t._id || t.id;
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          setSelectedIds(next);
                        }}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 cursor-pointer"
                            checked={selectedIds.has(t._id || t.id)}
                            onChange={() => {
                              const next = new Set(selectedIds);
                              const id = t._id || t.id;
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              setSelectedIds(next);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-[14px] shrink-0">
                              {getInitial(t.name)}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{t.name || "—"}</div>
                              <div className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                                <Phone className="size-3" /> {t.phone || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[13px] text-foreground">
                            {t.propertyTitle || t.propertyName || (t.property && typeof t.property === "object" ? t.property.title || t.property.name : t.property) || "—"}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground">Room {t.roomNo || "—"} / Bed {t.bedNo || "—"}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">₹{(t.agreedRent || t.rent || 0).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3">
                          {(t.dueAmount || t.dues || t.balance) > 0
                            ? <span className="font-medium text-destructive">₹{((t.dueAmount || t.dues || t.balance) || 0).toLocaleString("en-IN")}</span>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            onClick={() => {
                              if (t.kycStatus === "mismatch_review" || t.kyc?.mismatchReasons || t.digitalCheckin?.kyc?.mismatchReasons || t.kycVerificationData?.mismatchReasons) {
                                setSelectedTenant(t);
                                setModalTab("verification");
                                setModalOpen(true);
                              }
                            }}
                            className={cn("cursor-pointer", (t.kycStatus === "mismatch_review" || t.kyc?.mismatchReasons || t.digitalCheckin?.kyc?.mismatchReasons || t.kycVerificationData?.mismatchReasons) ? "hover:opacity-80" : "")}
                          >
                            <Pill tone={getKycTone(t.kycStatus || t.kyc)}>{t.kycStatus || t.kyc || "pending"}</Pill>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Pill tone={getStatusTone(getDisplayStatus(t))}>{getDisplayStatus(t)}</Pill>
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {(t.kycStatus !== "verified" && t.kycStatus !== "rejected") && (
                              <>
                                <button 
                                  onClick={() => handleResendKycLink(t._id || t.id, t.name)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200/60 rounded-lg transition-colors"
                                  title="Resend KYC Re-upload Link via Email"
                                >
                                  <Send size={14} />
                                </button>
                                <button 
                                  onClick={() => handleApproveKyc(t._id || t.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[11.5px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors shrink-0"
                                  title="Approve KYC & Activate Tenant"
                                >
                                  <CheckCircle size={13} /> Approve KYC
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => { setSelectedTenant(t); setModalTab("overview"); setModalOpen(true); }}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              onClick={() => handleEditClick(t)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Tenant"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleTransferClick(t)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Transfer Room"
                            >
                              <ArrowUpDown size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(t)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Tenant"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border flex items-center justify-between text-[12px] text-muted-foreground">
                <span>Showing {Math.min(page * PAGE_SIZE + 1, filtered.length)}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                <div className="flex gap-1">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-8 px-2.5 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40">Prev</button>
                  <button className="h-8 px-2.5 rounded-md border border-border bg-muted">{page + 1}</button>
                  <button disabled={(page + 1) * PAGE_SIZE >= filtered.length} onClick={() => setPage(p => p + 1)} className="h-8 px-2.5 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40">Next</button>
                </div>
              </div>
            </div>

            {/* Mobile Cards (Redesigned) */}
            <div className="block md:hidden space-y-3 pb-12">
              {paginated.map((t) => (
                <div key={`mob-${t._id || t.id}`} className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm relative overflow-hidden"
                  onClick={() => {
                    const next = new Set(selectedIds);
                    const id = t._id || t.id;
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    setSelectedIds(next);
                  }}
                >
                  
                  {/* Header Row: Avatar, Name, Room, Status */}
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={isBulkProcessing}
                        className="rounded border-slate-300 cursor-pointer w-4 h-4 mr-1 shrink-0"
                        checked={selectedIds.has(t._id || t.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          const id = t._id || t.id;
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          setSelectedIds(next);
                        }}
                      />
                      <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[16px] font-bold shrink-0 border border-slate-200/50 shadow-inner cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedTenant(t); setModalTab("overview"); setModalOpen(true); }}>
                        {getInitial(t.name)}
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); setSelectedTenant(t); setModalTab("overview"); setModalOpen(true); }} className="cursor-pointer">
                        <h3 className="text-[15px] font-bold text-slate-900 leading-tight hover:text-primary transition-colors">{t.name || "—"}</h3>
                        <p className="text-[11.5px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          Room {t.roomNo || "—"} • {t.propertyTitle || t.propertyName || (t.property && typeof t.property === "object" ? t.property.title || t.property.name : t.property) || "Property"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Badges */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                        getDisplayStatus(t) === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" :
                        getDisplayStatus(t) === "notice" ? "bg-amber-50 text-amber-600 border border-amber-100/50" :
                        "bg-slate-50 text-slate-600 border border-slate-200/50"
                      )}>
                        {getDisplayStatus(t)}
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (t.kycStatus === "mismatch_review" || t.kyc?.mismatchReasons || t.digitalCheckin?.kyc?.mismatchReasons || t.kycVerificationData?.mismatchReasons) {
                            setSelectedTenant(t);
                            setModalTab("verification");
                            setModalOpen(true);
                          }
                        }}
                        className={cn("text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md cursor-pointer",
                          (t.kycStatus || t.kyc) === "verified" ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" :
                          (t.kycStatus || t.kyc) === "mismatch_review" ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse hover:opacity-80" :
                          "bg-amber-50 text-amber-600 border border-amber-100/50"
                        )}
                      >
                        {(t.kycStatus || t.kyc) === "verified" ? "Verified" : (t.kycStatus || t.kyc) === "mismatch_review" ? "🚨 Mismatch Review" : "Pending"}
                      </span>
                      {(t.kyc?.mismatchReasons || t.digitalCheckin?.kyc?.mismatchReasons || t.kycVerificationData?.mismatchReasons) && (
                        <span className="text-[8px] text-rose-600 font-semibold max-w-[140px] text-right leading-tight">
                          ⚠️ {t.kyc?.mismatchReasons || t.digitalCheckin?.kyc?.mismatchReasons || t.kycVerificationData?.mismatchReasons}
                        </span>
                      )}
                    </div>
                  </div>
 
                  {/* Footer: Financials and Actions */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100/80" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-4 mb-1">
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Rent</p>
                          <p className="text-[13.5px] font-black text-slate-800 leading-none">₹{(t.agreedRent || t.rent || 0).toLocaleString("en-IN")}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dues</p>
                          {(t.dueAmount || t.dues || t.balance) > 0 ? (
                             <p className="text-[13.5px] font-black text-rose-600 leading-none">₹{((t.dueAmount || t.dues || t.balance) || 0).toLocaleString("en-IN")}</p>
                          ) : (
                             <p className="text-[13px] font-bold text-emerald-500 leading-none">Cleared</p>
                          )}
                       </div>
                    </div>
 
                    <div className="flex gap-1.5 items-center shrink-0">
                       <a href={`tel:${t.phone}`} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                          <Phone size={13} />
                       </a>
                       <a href={`https://wa.me/${String(t.phone).replace(/\D/g, '')}?text=Hi%20${t.name}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
                          <MessageSquare size={13} className="fill-emerald-600/20" />
                       </a>
                       <button onClick={() => { setSelectedTenant(t); setModalTab("overview"); setModalOpen(true); }} className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200/50 flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-colors" title="View Details">
                          <Eye size={13} />
                       </button>
                       <button onClick={() => handleEditClick(t)} className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600 hover:bg-amber-100 transition-colors" title="Edit Tenant">
                          <Edit size={13} />
                       </button>
                       {(t.kycStatus !== "verified" && t.kycStatus !== "rejected") ? (
                          <div className="flex gap-1 items-center ml-1">
                            {(t.kycStatus === "mismatch_review" || t.kyc?.mismatchReasons || t.digitalCheckin?.kyc?.mismatchReasons || t.kycVerificationData?.mismatchReasons) && (
                              <button onClick={() => { setSelectedTenant(t); setModalTab("verification"); setModalOpen(true); }} className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200/50 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-colors" title="View Mismatch Reason">
                                 <AlertTriangle size={12} />
                              </button>
                            )}
                            <button onClick={() => handleResendKycLink(t._id || t.id, t.name)} className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100/50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors" title="Resend KYC Link">
                               <Send size={12} />
                            </button>
                            <button onClick={() => handleApproveKyc(t._id || t.id)} className="h-8 px-3 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-700 flex items-center gap-1 hover:bg-emerald-100 transition-colors text-[11px] font-bold">
                               <CheckCircle size={12} /> Approve KYC
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => window.location.href = `/propertyowner/payment?tenant=${t._id}`} className="h-8 px-3.5 rounded-full bg-blue-50 border border-blue-100/50 text-blue-700 flex items-center gap-1.5 hover:bg-blue-100 transition-colors text-[11px] font-bold ml-1">
                             Collect
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center text-[12px] font-semibold text-slate-400 py-2">
                Showing {Math.min(page * PAGE_SIZE + 1, filtered.length)}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} tenants
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tenant Details Modal */}
      {modalOpen && selectedTenant && (() => {
        const t = selectedTenant;
        const kyc = t.kyc || {};
        const profile = t.digitalCheckin?.profile || {};
        const agr = t.digitalCheckin?.agreementDetails || {};

        const tenantPhoto = getFileUrl(t.photo || kyc.idProofFile);
        const aadhaarFront = getFileUrl(kyc.aadhaarFront);
        const aadhaarBack  = getFileUrl(kyc.aadhaarBack);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">

              {/* ── Header ── */}
              <div className="flex flex-col bg-muted/30 border-b border-border">
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {tenantPhoto ? (
                      <img src={tenantPhoto} alt={t.name} className="size-14 rounded-full object-cover border-2 border-border shrink-0" />
                    ) : (
                      <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[22px] shrink-0">
                        {getInitial(t.name)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-[20px] font-semibold text-foreground">{t.name || "—"}</h2>
                      <p className="text-[12px] text-muted-foreground font-mono mt-0.5">{t.loginId || "—"}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Pill tone={getStatusTone(getDisplayStatus(t))}>{getDisplayStatus(t)}</Pill>
                        <Pill tone={getKycTone(t.kycStatus || t.kyc)}>{t.kycStatus || t.kyc || "pending"} KYC</Pill>
                        <button
                          onClick={() => handleResendKycLink(t._id || t.id, t.name)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100 transition-colors"
                          title="Resend KYC Re-upload Link via Email"
                        >
                          <Send size={11} /> Resend KYC Link
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setModalOpen(false); setSelectedTenant(null); }}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                {/* Tabs Navigation */}
                <div className="flex overflow-x-auto hide-scrollbar px-6 gap-6 pt-2">
                  {["overview", "documents", "payments", "verification", "activity"].map(mTab => (
                    <button
                      key={mTab}
                      onClick={() => setModalTab(mTab)}
                      className={cn(
                        "py-2.5 text-[12px] font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap",
                        modalTab === mTab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mTab}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {(t.kyc?.mismatchReasons || t.digitalCheckin?.kyc?.mismatchReasons || t.kycVerificationData?.mismatchReasons) && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[12.5px] font-semibold flex items-start gap-2.5">
                    <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-950 text-[13px] uppercase tracking-wide">KYC Mismatch Warning</div>
                      <div className="mt-0.5 text-amber-800 font-medium">{t.kyc?.mismatchReasons || t.digitalCheckin?.kyc?.mismatchReasons || t.kycVerificationData?.mismatchReasons}</div>
                    </div>
                  </div>
                )}

                {modalTab === "overview" && (
                  <>
                    {/* Room & Rent */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-border bg-muted/10">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Room Details</span>
                        <div className="font-medium text-foreground text-[14px]">
                          {val(t.propertyTitle, t.propertyName, typeof t.property === "object" ? t.property?.title : null, "—")}
                        </div>
                        <div className="text-[12.5px] text-muted-foreground mt-0.5">
                          Room {t.roomNo || "—"}{t.bedNo ? ` / Bed ${t.bedNo}` : ""}
                          {agr.accommodationType || profile.accommodationType ? ` · ${agr.accommodationType || profile.accommodationType}` : ""}
                        </div>
                        {(agr.propertyAddress || profile.propertyAddress) && (
                          <div className="text-[12px] text-muted-foreground mt-1 flex items-start gap-1">
                            <MapPin size={11} className="mt-0.5 shrink-0" />
                            {agr.propertyAddress || profile.propertyAddress}
                          </div>
                        )}
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-emerald-50/50">
                        <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1.5">Rent Information</span>
                        <div className="font-bold text-emerald-700 text-[18px]">
                          ₹{(t.agreedRent || t.rent || 0).toLocaleString("en-IN")}
                          <span className="text-[13px] font-normal text-emerald-600/70"> / month</span>
                        </div>
                        {(agr.securityDeposit || t.securityDepositTotal) && (
                          <div className="text-[12.5px] text-emerald-600 mt-0.5">
                            Security deposit: ₹{Number(agr.securityDeposit || t.securityDepositTotal || 0).toLocaleString("en-IN")}
                          </div>
                        )}
                        {(t.dueAmount || t.dues) > 0 && (
                          <span className="inline-block mt-1.5 text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                            Dues: ₹{(t.dueAmount || t.dues).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div>
                      <SectionHead icon={User} title="Personal Information" />
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 p-4 rounded-xl border border-border">
                        <InfoField label="Phone Number" value={val(t.phone, profile.phone)} />
                        <InfoField label="Email Address" value={val(t.email, profile.email)} />
                        <InfoField label="Date of Birth" value={val(t.dob, profile.dob) !== "—" ? fmtDate(val(t.dob, profile.dob)) : "—"} />
                        <InfoField label="Gender" value={t.gender ? t.gender.charAt(0).toUpperCase() + t.gender.slice(1) : "—"} />
                        <InfoField label="Occupation" value={val(t.occupation, profile.occupation)} />
                        <InfoField label="Guardian / Emergency No." value={val(t.guardianNumber, profile.guardianNumber)} />
                        {(agr.permanentAddress || profile.permanentAddress) && (
                          <InfoField label="Permanent Address" value={agr.permanentAddress || profile.permanentAddress} wide />
                        )}
                        {(agr.backupEmail || profile.backupEmail) && (
                          <InfoField label="Backup Email" value={agr.backupEmail || profile.backupEmail} />
                        )}
                      </div>
                    </div>

                    {/* Agreement & Financial Details */}
                    {(agr.licenseDuration || agr.licenseEndDate || agr.inclusions || agr.moveOutCharges || agr.gstCharges) && (
                      <div>
                        <SectionHead icon={FileText} title="Agreement & Financial Terms" color="text-amber-600" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 p-4 rounded-xl border border-border">
                          {t.moveInDate && <InfoField label="Move-in Date" value={fmtDate(t.moveInDate)} />}
                          {agr.licenseEndDate && <InfoField label="License End Date" value={fmtDate(agr.licenseEndDate)} />}
                          {agr.licenseDuration && <InfoField label="License Duration" value={agr.licenseDuration} />}
                          {agr.licenseFeeDueDate && <InfoField label="Rent Due Day" value={`${agr.licenseFeeDueDate}th of month`} />}
                          {agr.minimumStayDuration && <InfoField label="Minimum Stay" value={agr.minimumStayDuration} />}
                          {agr.moveOutCharges && <InfoField label="Move-out Charges" value={`₹${Number(agr.moveOutCharges).toLocaleString("en-IN")}`} />}
                          {agr.noticePeriodCharges && <InfoField label="Notice Period Charges" value={`₹${Number(agr.noticePeriodCharges).toLocaleString("en-IN")}`} />}
                          {agr.gstCharges && Number(agr.gstCharges) > 0 && <InfoField label="GST Charges" value={`₹${Number(agr.gstCharges).toLocaleString("en-IN")}`} />}
                          {agr.inclusions && <InfoField label="Inclusions" value={agr.inclusions} wide />}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {modalTab === "documents" && (
                  <>
                    {/* KYC & Identity Documents */}
                    <div>
                      <SectionHead icon={Shield} title="KYC & Identity Documents" color="text-indigo-500" />
                      <div className="p-4 rounded-xl border border-border space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                          {kyc.aadhaarNumber && <InfoField label="Aadhaar Number" value={kyc.aadhaarNumber} mono />}
                          {kyc.aadhaarLinkedPhone && <InfoField label="Aadhaar Linked Phone" value={kyc.aadhaarLinkedPhone} />}
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wide">Verification Status</div>
                            {kyc.digilockerVerified ? (
                              <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-emerald-600">
                                <BadgeCheck size={14} /> Verified {kyc.digilockerVerifiedAt ? `· ${fmtDate(kyc.digilockerVerifiedAt)}` : ""}
                              </span>
                            ) : (
                              <span className="text-[12.5px] text-muted-foreground">Not verified</span>
                            )}
                          </div>
                        </div>

                        {/* Aadhaar Images */}
                        {(aadhaarFront || aadhaarBack) && (
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wide">Aadhaar Card Photos</div>
                            <div className="flex gap-4 flex-wrap">
                              {aadhaarFront && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[11px] text-muted-foreground">Front Side</span>
                                  <a href={aadhaarFront} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={aadhaarFront}
                                      alt="Aadhaar Front"
                                      className="h-32 w-52 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity cursor-zoom-in"
                                    />
                                  </a>
                                </div>
                              )}
                              {aadhaarBack && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[11px] text-muted-foreground">Back Side</span>
                                  <a href={aadhaarBack} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={aadhaarBack}
                                      alt="Aadhaar Back"
                                      className="h-32 w-52 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity cursor-zoom-in"
                                    />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tenant Photo */}
                    {tenantPhoto && (
                      <div>
                        <SectionHead icon={CreditCard} title="Tenant Photo" color="text-rose-400" />
                        <div className="p-4 rounded-xl border border-border">
                          <a href={tenantPhoto} target="_blank" rel="noopener noreferrer">
                            <img
                              src={tenantPhoto}
                              alt="Tenant Photo"
                              className="h-40 w-32 object-cover rounded-xl border border-border hover:opacity-90 transition-opacity cursor-zoom-in"
                            />
                          </a>
                          <p className="text-[11.5px] text-muted-foreground mt-2">Click to open full size</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {modalTab === "payments" && (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                      <CreditCard className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-[15px] font-bold text-slate-800">Rent & Payments</h3>
                    <p className="text-[12px] text-slate-500 mt-1 max-w-xs mx-auto">Rent history, pending dues, and payment receipts will appear here.</p>
                  </div>
                )}

                {modalTab === "verification" && (
                  <div className="space-y-6">
                    {(t.kyc?.mismatchReasons || t.digitalCheckin?.kyc?.mismatchReasons || t.kycVerificationData?.mismatchReasons) ? (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[13px] font-semibold flex items-start gap-3">
                        <AlertTriangle className="size-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-rose-950 uppercase tracking-wide">Data Mismatch Detected</div>
                          <div className="mt-1 text-rose-800 font-medium">{t.kyc?.mismatchReasons || t.digitalCheckin?.kyc?.mismatchReasons || t.kycVerificationData?.mismatchReasons}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[13px] font-semibold flex items-start gap-3">
                        <CheckCircle className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-emerald-950 uppercase tracking-wide">Data Matching Clean</div>
                          <div className="mt-0.5 text-emerald-800 font-medium">Aadhaar details and tenant entry match owner records. Ready for verification.</div>
                        </div>
                      </div>
                    )}

                    {/* Comparison Table */}
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                            <th className="px-4 py-3 font-semibold">Field</th>
                            <th className="px-4 py-3 font-semibold">Owner Record</th>
                            <th className="px-4 py-3 font-semibold">Tenant Submitted</th>
                            <th className="px-4 py-3 font-semibold text-center">Match Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <tr>
                            <td className="px-4 py-3 font-medium text-foreground">Aadhaar Number</td>
                            <td className="px-4 py-3 font-mono">{t.kycVerificationData?.adminEnteredAadhaar || t.idProofNumber || t.aadhaarNumber || "—"}</td>
                            <td className="px-4 py-3 font-mono">{kyc.aadhaarNumber || kyc.aadhar || "—"}</td>
                            <td className="px-4 py-3 text-center">
                              {((t.kycVerificationData?.adminEnteredAadhaar || t.idProofNumber || t.aadhaarNumber || "") && (kyc.aadhaarNumber || kyc.aadhar || "")) ? (
                                (String(t.kycVerificationData?.adminEnteredAadhaar || t.idProofNumber || t.aadhaarNumber || "").replace(/\D/g, "") === String(kyc.aadhaarNumber || kyc.aadhar || "").replace(/\D/g, "")) ? (
                                  <span className="text-emerald-600 font-bold text-[11px]">✓ Match</span>
                                ) : (
                                  <span className="text-rose-600 font-bold text-[11px]">✗ Mismatch</span>
                                )
                              ) : <span className="text-muted-foreground text-[11px]">—</span>}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-medium text-foreground">Tenant Name</td>
                            <td className="px-4 py-3">{t.kycVerificationData?.adminEnteredName || t.name || "—"}</td>
                            <td className="px-4 py-3">{profile.name || t.name || "—"}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-emerald-600 font-bold text-[11px]">✓ Match</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-medium text-foreground">Mobile Number</td>
                            <td className="px-4 py-3 font-mono">{t.phone || "—"}</td>
                            <td className="px-4 py-3 font-mono">{kyc.aadhaarLinkedPhone || t.phone || "—"}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-emerald-600 font-bold text-[11px]">✓ Match</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Aadhaar Images */}
                    {(aadhaarFront || aadhaarBack) && (
                      <div>
                        <h4 className="text-[13px] font-bold text-foreground mb-3">Uploaded Aadhaar Images</h4>
                        <div className="flex gap-4 flex-wrap">
                          {aadhaarFront && (
                            <a href={aadhaarFront} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={aadhaarFront} alt="Aadhaar Front" className="h-36 w-60 object-cover rounded-xl border border-border" />
                            </a>
                          )}
                          {aadhaarBack && (
                            <a href={aadhaarBack} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={aadhaarBack} alt="Aadhaar Back" className="h-36 w-60 object-cover rounded-xl border border-border" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Approve Action Button */}
                    {(t.kycStatus !== "verified" && t.kycStatus !== "rejected") && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setModalOpen(false);
                            handleApproveKyc(t._id || t.id);
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[13px] flex items-center gap-2 shadow-sm transition-colors"
                        >
                          <CheckCircle size={16} /> Approve KYC & Activate Tenant Now
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {modalTab === "activity" && (
                  <>
                    {/* Timeline & Status */}
                    <div>
                      <SectionHead icon={CalendarClock} title="Timeline & Status" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-border bg-slate-50">
                          <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">Move-in Date</div>
                          <div className="text-[13px] font-medium text-foreground">{t.moveInDate ? fmtDate(t.moveInDate) : "Not specified"}</div>
                        </div>
                        <div className="p-4 rounded-xl border border-border bg-slate-50">
                          <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">Agreement Signed</div>
                          <div className="text-[13px] font-medium">
                            {t.agreementSigned ? (
                              <span className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle size={14} /> Yes {t.agreementSignedAt ? `· ${fmtDate(t.agreementSignedAt)}` : ""}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-rose-600"><AlertTriangle size={14} /> Pending</span>
                            )}
                          </div>
                        </div>
                        {kyc.digilockerVerifiedAt && (
                          <div className="p-4 rounded-xl border border-border bg-slate-50">
                            <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">KYC Verified On</div>
                            <div className="text-[13px] font-medium text-foreground">{fmtDate(kyc.digilockerVerifiedAt)}</div>
                          </div>
                        )}
                        <div className="p-4 rounded-xl border border-border bg-slate-50">
                          <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wide">Tenant Status</div>
                          <Pill tone={getStatusTone(getDisplayStatus(t))}>{getDisplayStatus(t)}</Pill>
                        </div>
                      </div>
                    </div>

                    {/* Activity Log Placeholders */}
                    <div>
                      <SectionHead icon={Activity} title="Recent Activity" color="text-blue-500" />
                      <div className="space-y-3">
                        <div className="flex gap-4 p-4 rounded-xl border border-border">
                          <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <div>
                            <p className="text-[13px] font-medium text-slate-800">Rent Paid: ₹{(t.agreedRent || t.rent || 0).toLocaleString("en-IN")}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Payment processed via UPI • 2 days ago</p>
                          </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-xl border border-border">
                          <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          <div>
                            <p className="text-[13px] font-medium text-slate-800">Maintenance Request Logged</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">AC not cooling in Room {t.roomNo} • 1 week ago</p>
                          </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-xl border border-border">
                          <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <div>
                            <p className="text-[13px] font-medium text-slate-800">Tenant Moved In</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Completed digital check-in • {t.moveInDate ? fmtDate(t.moveInDate) : "2 months ago"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setModalOpen(false); handleEditClick(t); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <Edit size={14} /> Edit Tenant
                  </button>
                  <button 
                    onClick={() => { setModalOpen(false); handleTransferClick(t); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ArrowUpDown size={14} /> Transfer Room
                  </button>
                </div>
                <button
                  onClick={() => { setModalOpen(false); setSelectedTenant(null); }}
                  className="px-6 py-2 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Tenant Modal */}
      {editModalOpen && editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-border">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Edit size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-foreground">Edit Tenant Details</h2>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">{editingTenant.loginId || "—"}</p>
                </div>
              </div>
              <button
                onClick={() => { setEditModalOpen(false); setEditingTenant(null); }}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-left">

                {/* Section: Basic Info */}
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Personal Details</div>
                <div>
                  <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tenant Name *</label>
                  <input required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Phone *</label>
                    <input type="tel" required value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date of Birth</label>
                    <input type="date" value={editForm.dob} onChange={e => setEditForm(p => ({ ...p, dob: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Gender</label>
                    <select value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">ID Proof Type</label>
                    <select value={editForm.idProofType} onChange={e => setEditForm(p => ({ ...p, idProofType: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                      <option>Aadhaar Card</option>
                      <option>PAN Card</option>
                      <option>Passport</option>
                      <option>Voter ID</option>
                      <option>Driving License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">ID Proof Number</label>
                    <input value={editForm.idProofNumber} onChange={e => setEditForm(p => ({ ...p, idProofNumber: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>

                {/* Section: Room & Rent */}
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 mb-1 border-t border-border">Room & Rent</div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Room Number</label>
                    <select value={editForm.roomNo} onChange={e => setEditForm(p => ({ ...p, roomNo: e.target.value, bedNo: "" }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                      <option value="">Select room...</option>
                      {(() => {
                        const tenantPropId = editingTenant.property?._id || editingTenant.property || editingTenant.propertyId;
                        return rooms.filter(r => String(r.property?._id || r.property || r.propertyId) === String(tenantPropId)).map(room => (
                          <option key={room._id || room.id} value={room.roomNo || room.number}>Room {room.roomNo || room.number}</option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Bed Number</label>
                    <select value={editForm.bedNo} onChange={e => setEditForm(p => ({ ...p, bedNo: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                      <option value="">Select bed...</option>
                      {(() => {
                        const tenantPropId = editingTenant.property?._id || editingTenant.property || editingTenant.propertyId;
                        const propRooms = rooms.filter(r => String(r.property?._id || r.property || r.propertyId) === String(tenantPropId));
                        const selRoom = propRooms.find(r => r.roomNo === editForm.roomNo || r.number === editForm.roomNo);
                        if (!selRoom) return null;
                        const capacity = selRoom.capacity || selRoom.totalBeds || 1;
                        return Array.from({ length: capacity }, (_, idx) => {
                          const bedNum = String(idx + 1);
                          const assignment = (selRoom.bedAssignments || [])[idx];
                          const isOccupied = assignment?.tenantId && String(assignment.tenantId) !== String(editingTenant._id);
                          return <option key={bedNum} value={bedNum} disabled={isOccupied}>Bed {bedNum}{isOccupied ? ` (${assignment.tenantName || 'Occupied'})` : " (Vacant)"}</option>;
                        });
                      })()}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Monthly Rent (₹) *</label>
                    <input type="number" required value={editForm.agreedRent} onChange={e => setEditForm(p => ({ ...p, agreedRent: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Security Deposit (₹)</label>
                    <input type="number" value={editForm.depositAmount} onChange={e => setEditForm(p => ({ ...p, depositAmount: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Move-in Date</label>
                    <input type="date" value={editForm.moveInDate} onChange={e => setEditForm(p => ({ ...p, moveInDate: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Payment Frequency</label>
                    <select value={editForm.paymentFrequency} onChange={e => setEditForm(p => ({ ...p, paymentFrequency: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                      <option>Monthly</option>
                      <option>Quarterly</option>
                      <option>Half-Yearly</option>
                      <option>Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Section: Emergency Contact */}
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 mb-1 border-t border-border">Emergency Contact</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Emergency Name</label>
                    <input value={editForm.emergencyName} onChange={e => setEditForm(p => ({ ...p, emergencyName: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Emergency Phone</label>
                    <input type="tel" value={editForm.emergencyPhone} onChange={e => setEditForm(p => ({ ...p, emergencyPhone: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Relationship</label>
                    <input value={editForm.relationship} onChange={e => setEditForm(p => ({ ...p, relationship: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Occupation</label>
                    <input value={editForm.occupation} onChange={e => setEditForm(p => ({ ...p, occupation: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Permanent Address</label>
                  <textarea rows={2} value={editForm.permanentAddress} onChange={e => setEditForm(p => ({ ...p, permanentAddress: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Remarks</label>
                  <textarea rows={2} value={editForm.remarks} onChange={e => setEditForm(p => ({ ...p, remarks: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                </div>

                {errorMsg && <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{errorMsg}</div>}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditingTenant(null); }}
                  className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Tenant Room Modal */}
      {transferModalOpen && transferringTenant && (() => {
        // Filter owner's rooms by the tenant's current property
        const tenantPropertyId = transferringTenant.property?._id || transferringTenant.property || transferringTenant.propertyId;
        const propertyRooms = rooms.filter(r => {
          const rPropId = r.property?._id || r.property || r.propertyId;
          return String(rPropId) === String(tenantPropertyId);
        });

        // Find currently selected target room object to show available beds
        const selectedRoomObj = propertyRooms.find(r => r.roomNo === transferForm.roomNo || r.number === transferForm.roomNo);
        const bedAssignments = selectedRoomObj?.bedAssignments || [];
        const capacity = selectedRoomObj?.capacity || selectedRoomObj?.totalBeds || 1;

        // Generate list of bed slots (1-indexed)
        const bedSlots = Array.from({ length: capacity }, (_, idx) => {
          const bedNum = String(idx + 1);
          const assignment = bedAssignments[idx];
          const isOccupied = assignment && assignment.tenantId && String(assignment.tenantId) !== String(transferringTenant._id);
          return {
            bedNo: bedNum,
            isOccupied,
            occupiedBy: assignment?.tenantName || "Another tenant"
          };
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] border border-border animate-in fade-in zoom-in duration-200">
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <ArrowUpDown size={20} />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-foreground">Transfer Room</h2>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">Move {transferringTenant.name} to another room</p>
                  </div>
                </div>
                <button
                  onClick={() => { setTransferModalOpen(false); setTransferringTenant(null); }}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveTransfer} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
                  
                  {/* Current Room Info Summary */}
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Current Placement</span>
                    <div className="text-[13px] font-semibold text-foreground">
                      Room {transferringTenant.roomNo || "—"} / Bed {transferringTenant.bedNo || "—"}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">
                      Current Rent: ₹{(transferringTenant.agreedRent || transferringTenant.rent || 0).toLocaleString("en-IN")} · Property: {transferringTenant.propertyTitle || "—"}
                    </div>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Transfer Date</label>
                    <input
                      type="date"
                      required
                      value={transferForm.transferDate}
                      onChange={e => setTransferForm(prev => ({ ...prev, transferDate: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Room Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">New Room</label>
                    <select
                      value={transferForm.roomNo}
                      onChange={e => {
                        const targetRoomNo = e.target.value;
                        const targetRoomObj = propertyRooms.find(r => r.roomNo === targetRoomNo || r.number === targetRoomNo);
                        const targetRoomRent = targetRoomObj?.roomRent || targetRoomObj?.rent || 0;
                        setTransferForm(prev => ({
                          ...prev,
                          roomNo: targetRoomNo,
                          roomId: targetRoomObj?._id || "",
                          bedNo: "", // Reset bed number on room change
                          agreedRent: targetRoomRent || prev.agreedRent // Default to room's rent if available
                        }));
                      }}
                      required
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                    >
                      <option value="">Select target room...</option>
                      {propertyRooms.map(room => {
                        // Calculate vacant beds count
                        const currentRoomCapacity = room.capacity || room.totalBeds || 1;
                        const currentAssignments = room.bedAssignments || [];
                        let occupiedCount = 0;
                        for (let i = 0; i < currentRoomCapacity; i++) {
                          const assignment = currentAssignments[i];
                          // Do not count the transferring tenant as occupied in their own room
                          if (assignment && assignment.tenantId && String(assignment.tenantId) !== String(transferringTenant._id)) {
                            occupiedCount++;
                          }
                        }
                        const vacantCount = Math.max(0, currentRoomCapacity - occupiedCount);
                        const isCurrent = String(room.roomNo) === String(transferringTenant.roomNo);

                        return (
                          <option key={room._id || room.id} value={room.roomNo}>
                            Room {room.roomNo} ({vacantCount} / {currentRoomCapacity} beds vacant) {isCurrent ? " - Current" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Bed Selector (Visual grid) */}
                  {transferForm.roomNo && (
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Select Bed</label>
                      {bedSlots.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground italic">No beds defined for this room.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2.5">
                          {bedSlots.map(slot => {
                            const isSelected = transferForm.bedNo === slot.bedNo;
                            const isCurrentBed = String(slot.bedNo) === String(transferringTenant.bedNo) && String(transferForm.roomNo) === String(transferringTenant.roomNo);
                            
                            return (
                              <button
                                key={slot.bedNo}
                                type="button"
                                disabled={slot.isOccupied}
                                onClick={() => setTransferForm(prev => ({ ...prev, bedNo: slot.bedNo }))}
                                className={[
                                  "p-3 rounded-xl border flex flex-col items-center justify-center transition-all text-center gap-1 min-h-[70px]",
                                  slot.isOccupied 
                                    ? "bg-muted/40 border-border text-muted-foreground/50 cursor-not-allowed"
                                    : isCurrentBed
                                    ? "bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-300/30"
                                    : isSelected
                                    ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold ring-2 ring-blue-500/20"
                                    : "bg-background border-border text-foreground hover:border-blue-300 hover:bg-blue-50/10"
                                ].join(" ")}
                              >
                                <span className="text-[13px] font-medium">Bed {slot.bedNo}</span>
                                <span className="text-[9.5px] uppercase tracking-wide">
                                  {isCurrentBed ? "Current" : slot.isOccupied ? "Occupied" : "Vacant"}
                                </span>
                                {slot.isOccupied && (
                                  <span className="text-[8px] text-muted-foreground truncate w-full max-w-[80px]" title={slot.occupiedBy}>
                                    ({slot.occupiedBy})
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rent Override */}
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">New Monthly Rent (₹)</label>
                    <input
                      type="number"
                      required
                      value={transferForm.agreedRent}
                      onChange={e => setTransferForm(prev => ({ ...prev, agreedRent: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Current rent: ₹{(transferringTenant.agreedRent || transferringTenant.rent || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setTransferModalOpen(false); setTransferringTenant(null); }}
                    className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !transferForm.roomNo || !transferForm.bedNo}
                    className="px-5 py-2 rounded-lg bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving ? "Transferring..." : "Confirm Transfer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* WhatsApp Broadcast Dialog */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-border">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MessageSquare size={20} className="fill-emerald-700/20" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-foreground text-left">Send Broadcast</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5 text-left">Sending to {selectedIds.size} selected tenants</p>
                </div>
              </div>
              <button
                onClick={() => { setBroadcastModalOpen(false); setBroadcastMessage(""); }}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBulkSendBroadcast} className="flex flex-col">
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-left">Message Body</label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    placeholder="e.g. Your monthly rent is pending. Please complete payment today to avoid late fees."
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-left"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed text-left">
                    Note: This uses the official template <span className="font-mono font-bold">roomhy_tenant_broadcast</span>.
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setBroadcastModalOpen(false); setBroadcastMessage(""); }}
                  className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBulkProcessing || !broadcastMessage.trim()}
                  className="px-5 py-2 rounded-lg bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isBulkProcessing ? "Sending..." : `Send to ${selectedIds.size} Tenants`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-8 py-4 rounded-3xl border border-slate-800 shadow-2xl flex items-center gap-6 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 border-r border-slate-800 pr-6">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shadow-lg animate-pulse">
              {selectedIds.size}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={isBulkProcessing}
              onClick={handleBulkExportCSV}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={() => setBroadcastModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <MessageSquare size={14} className="fill-white/20" /> Send Broadcast
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors pl-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
