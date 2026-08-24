import React, { useMemo, useState, useEffect, useCallback } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerProperties } from "../../utils/propertyowner";
import {
  Users, Search, Plus, CheckCircle2, AlertCircle, Phone, Mail,
  Building2, Clock, Shield, MoreVertical, X, TrendingUp,
  Briefcase, UserCheck, UserX, Filter, ChevronDown, Eye, Edit3, Power
} from "lucide-react";
import { apiFetch } from "../../utils/api";
import { cacheGet, cacheSet } from "../../utils/cache";
import { STAFF_MODULE_GROUPS } from "../../utils/staffAccess";

const ROLE_COLORS = {
  Warden: "bg-blue-100 text-blue-700",
  Reception: "bg-emerald-100 text-emerald-700",
  Accountant: "bg-purple-100 text-purple-700",
  Housekeeping: "bg-amber-100 text-amber-700",
  Maintenance: "bg-orange-100 text-orange-700",
  "Property Manager": "bg-indigo-100 text-indigo-700",
  Custom: "bg-slate-100 text-slate-700",
};

const ROLE_AVATAR_BG = {
  Warden: "bg-blue-600",
  Reception: "bg-emerald-600",
  Accountant: "bg-purple-600",
  Housekeeping: "bg-amber-500",
  Maintenance: "bg-orange-500",
  "Property Manager": "bg-indigo-600",
  Custom: "bg-slate-600",
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
  </div>
);

export default function AllStaffPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, presentToday: 0 });
  const [loading, setLoading] = useState(true);
  const [detailStaff, setDetailStaff] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingPerms, setEditingPerms] = useState(false);
  const [permDraft, setPermDraft] = useState([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [properties, setProperties] = useState([]);
  const [editingProperty, setEditingProperty] = useState(false);
  const [propertyDraft, setPropertyDraft] = useState("");
  const [savingProperty, setSavingProperty] = useState(false);

  useEffect(() => {
    if (!owner?.loginId) return;
    fetchOwnerProperties(owner.loginId, true).then(list => setProperties(list || [])).catch(() => {});
  }, [owner?.loginId]);

  const closeDetail = () => { setDetailStaff(null); setEditingPerms(false); setEditingProperty(false); };
  const openPermsEditor = () => { setPermDraft(detailStaff?.permissions || []); setEditingPerms(true); };
  const togglePermDraft = (key) =>
    setPermDraft(d => d.includes(key) ? d.filter(p => p !== key) : [...d, key]);

  const openPropertyEditor = () => { setPropertyDraft(detailStaff?.assignedProperty || ""); setEditingProperty(true); };

  const saveProperty = async () => {
    if (!detailStaff) return;
    setSavingProperty(true);
    try {
      await apiFetch(`/api/employees/${detailStaff.loginId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedProperties: propertyDraft ? [propertyDraft] : [] }),
        timeout: 30000,
      });
      const propName = properties.find(p => String(p._id || p.id) === propertyDraft)?.title || "";
      const newStaff = staff.map(e => e.id === detailStaff.id
        ? { ...e, assignedProperty: propertyDraft, assignedPropertyName: propName }
        : e);
      setStaff(newStaff);
      setDetailStaff(d => ({ ...d, assignedProperty: propertyDraft, assignedPropertyName: propName }));
      cacheSet(`staff:${owner.loginId}`, { staff: newStaff, stats }, 2 * 60 * 1000);
      setEditingProperty(false);
    } catch (err) {
      alert("Failed to save assigned property: " + (err?.message || "Please try again."));
    } finally {
      setSavingProperty(false);
    }
  };

  const savePerms = async () => {
    if (!detailStaff) return;
    setSavingPerms(true);

    // Saving is a mutation on a sometimes-cold backend, so give it a longer
    // window than the default 12s and retry once on a timeout before failing.
    const patchWithRetry = async (attempt = 1) => {
      try {
        return await apiFetch(`/api/employees/${detailStaff.loginId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: permDraft }),
          timeout: 30000,
        });
      } catch (err) {
        if ((err?.name === "TimeoutError" || err?.status === 408) && attempt < 2) {
          return patchWithRetry(attempt + 1);
        }
        throw err;
      }
    };

    try {
      await patchWithRetry();
      const newStaff = staff.map(e => e.id === detailStaff.id ? { ...e, permissions: permDraft } : e);
      setStaff(newStaff);
      setDetailStaff(d => ({ ...d, permissions: permDraft }));
      cacheSet(`staff:${owner.loginId}`, { staff: newStaff, stats }, 2 * 60 * 1000);
      setEditingPerms(false);
    } catch (err) {
      alert("Failed to save permissions: " + (err?.message || "Please try again."));
    } finally {
      setSavingPerms(false);
    }
  };

  const fetchStaff = useCallback(async ({ silent = false } = {}) => {
    const CACHE_KEY = `staff:${owner.loginId}`;
    if (!silent) {
      const cached = cacheGet(CACHE_KEY);
      if (cached) {
        setStaff(cached.staff);
        setStats(cached.stats);
        setLoading(false);
        fetchStaff({ silent: true });
        return;
      }
      setLoading(true);
    }
    try {
      const [empData, statsData, shiftsData] = await Promise.allSettled([
        apiFetch(`/api/employees?parentLoginId=${owner.loginId}`),
        apiFetch(`/api/employees/stats/${owner.loginId}`),
        apiFetch(`/api/hr/shifts/${owner.loginId}`),
      ]);

      const employees = (empData.status === "fulfilled" ? empData.value?.data : null) || [];
      const statsRes = statsData.status === "fulfilled" ? statsData.value?.data : {};
      const shifts = (shiftsData.status === "fulfilled" ? shiftsData.value?.data : null) || [];

      const shiftsMap = {};
      shifts.forEach(sh => {
        const id = sh.employeeId?._id || sh.employeeId;
        if (id) shiftsMap[id] = `${sh.startTime} – ${sh.endTime}`;
      });

      const mapped = employees.map(e => ({
        id: e._id,
        loginId: e.loginId,
        name: e.name || "Unknown",
        role: e.role || "Staff",
        phone: e.phone || "",
        email: e.email || "",
        status: e.isActive ? "Active" : "Inactive",
        photoDataUrl: e.photoDataUrl || "",
        shift: shiftsMap[e._id] || "Standard Hours",
        permissions: e.permissions || [],
        assignedProperty: e.assignedProperties?.[0]?._id || e.assignedProperties?.[0]?.id || e.assignedProperties?.[0] || "",
        assignedPropertyName: e.assignedPropertyName || e.assignedProperties?.[0]?.title || e.assignedProperties?.[0]?.name || "",
        joiningDate: e.joiningDate || e.createdAt || "",
        address: e.address || "",
      }));

      const newStats = {
        total: statsRes.total || mapped.length,
        active: statsRes.active || mapped.filter(s => s.status === "Active").length,
        inactive: statsRes.inactive || mapped.filter(s => s.status === "Inactive").length,
        presentToday: statsRes.presentToday || 0,
      };
      setStaff(mapped);
      setStats(newStats);
      cacheSet(`staff:${owner.loginId}`, { staff: mapped, stats: newStats }, 2 * 60 * 1000);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [owner.loginId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleToggle = async (s) => {
    const action = s.status === "Active" ? "deactivate" : "reactivate";
    if (!window.confirm(`${action === "deactivate" ? "Deactivate" : "Reactivate"} ${s.name}?`)) return;
    setActionLoading(s.id);
    try {
      await apiFetch(`/api/employees/${s.loginId}/${action}`, { method: "POST" });
      setStaff(prev => prev.map(e => e.id === s.id ? { ...e, status: action === "deactivate" ? "Inactive" : "Active" } : e));
      setStats(prev => ({
        ...prev,
        active: prev.active + (action === "deactivate" ? -1 : 1),
        inactive: prev.inactive + (action === "deactivate" ? 1 : -1),
      }));
    } catch (err) { alert("Action failed: " + err.message); }
    finally { setActionLoading(null); }
  };

  const roles = useMemo(() => ["All", ...Array.from(new Set(staff.map(s => s.role)))], [staff]);
  const filtered = useMemo(() => staff.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.loginId.toLowerCase().includes(q) || s.phone.includes(q);
    const matchRole = roleFilter === "All" || s.role === roleFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  }), [staff, search, roleFilter, statusFilter]);

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Staff Management"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage your hostel team — roles, shifts, and performance</p>
        </div>
        <button
          onClick={() => window.location.href = "/propertyowner/add-staff"}
          className="flex items-center gap-2 px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={15} /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Staff" value={stats.total} color="bg-blue-600" />
        <StatCard icon={UserCheck} label="Active" value={stats.active} color="bg-emerald-500" />
        <StatCard icon={UserX} label="Inactive" value={stats.inactive} color="bg-rose-500" />
        <StatCard icon={CheckCircle2} label="Present Today" value={stats.presentToday} color="bg-amber-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, role, ID, or phone..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-blue-400">
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-blue-400">
          {["All", "Active", "Inactive"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Loading staff...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Users size={40} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-bold">No staff members found.</p>
          <p className="text-xs text-slate-300 mt-1">Try adjusting your filters or add new staff.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(s => {
            const avatarBg = ROLE_AVATAR_BG[s.role] || "bg-slate-600";
            const roleColor = ROLE_COLORS[s.role] || "bg-slate-100 text-slate-700";
            const isActive = s.status === "Active";

            return (
              <div
                key={s.id}
                className={`group relative bg-white rounded-3xl border ${isActive ? "border-slate-100" : "border-rose-100 bg-rose-50/30"} p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-13 h-13 rounded-2xl ${avatarBg} flex items-center justify-center text-white font-black text-lg shadow-lg overflow-hidden`}
                      style={{ width: 52, height: 52 }}>
                      {s.photoDataUrl
                        ? <img src={s.photoDataUrl} alt={s.name} className="w-full h-full object-cover" />
                        : <span>{s.name[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-[15px] leading-tight truncate">{s.name}</h3>
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-1 ${roleColor}`}>{s.role}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
                    {s.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-5">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">ID: <span className="text-blue-600 font-mono">{s.loginId}</span></div>
                  {s.phone && (
                    <div className="flex items-center gap-2 text-[12px] text-slate-600 font-medium">
                      <Phone size={11} className="text-slate-400 shrink-0" /> {s.phone}
                    </div>
                  )}
                  {s.shift && (
                    <div className="flex items-center gap-2 text-[12px] text-slate-600 font-medium">
                      <Clock size={11} className="text-slate-400 shrink-0" /> {s.shift}
                    </div>
                  )}
                  {s.assignedPropertyName && (
                    <div className="flex items-center gap-2 text-[12px] text-slate-600 font-medium">
                      <Building2 size={11} className="text-slate-400 shrink-0" /> {s.assignedPropertyName}
                    </div>
                  )}
                </div>

                {/* Permissions preview */}
                {s.permissions?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-5">
                    {s.permissions.slice(0, 4).map(p => (
                      <span key={p} className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{p}</span>
                    ))}
                    {s.permissions.length > 4 && (
                      <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">+{s.permissions.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-slate-100 pt-4 flex gap-2">
                  <button
                    onClick={() => setDetailStaff(s)}
                    className="flex-1 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 text-xs font-black transition-all flex items-center justify-center gap-1"
                  >
                    <Eye size={13} /> View
                  </button>
                  <button
                    onClick={() => handleToggle(s)}
                    disabled={actionLoading === s.id}
                    className={`flex-1 h-9 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 border ${isActive
                      ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200"
                    }`}
                  >
                    {actionLoading === s.id
                      ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <Power size={13} />}
                    {isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {detailStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg">Staff Profile</h3>
              <button onClick={closeDetail} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl ${ROLE_AVATAR_BG[detailStaff.role] || "bg-slate-600"} flex items-center justify-center text-white text-2xl font-black shadow-lg overflow-hidden`}>
                  {detailStaff.photoDataUrl
                    ? <img src={detailStaff.photoDataUrl} alt={detailStaff.name} className="w-full h-full object-cover" />
                    : detailStaff.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">{detailStaff.name}</h4>
                  <p className="text-xs text-slate-500 font-bold font-mono">{detailStaff.loginId}</p>
                  <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-1 ${ROLE_COLORS[detailStaff.role] || "bg-slate-100 text-slate-700"}`}>{detailStaff.role}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Phone", value: detailStaff.phone || "N/A" },
                  { label: "Email", value: detailStaff.email || "N/A" },
                  { label: "Shift", value: detailStaff.shift || "N/A" },
                  { label: "Status", value: detailStaff.status },
                  { label: "Joining Date", value: detailStaff.joiningDate ? new Date(detailStaff.joiningDate).toLocaleDateString("en-IN") : "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-xs font-bold text-slate-800 break-all">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Property</p>
                  {!editingProperty && (
                    <button onClick={openPropertyEditor}
                      className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                      <Edit3 size={12} /> Edit
                    </button>
                  )}
                </div>

                {!editingProperty ? (
                  <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
                    <Building2 size={13} className="text-slate-400 shrink-0" />
                    <p className="text-xs font-bold text-slate-800">
                      {detailStaff.assignedPropertyName || "Not assigned — pick one so this staff member's dashboard is scoped correctly"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={propertyDraft}
                      onChange={(e) => setPropertyDraft(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="">— Unassigned —</option>
                      {properties.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>{p.title || p.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-3">
                      <button onClick={() => setEditingProperty(false)} disabled={savingProperty}
                        className="flex-1 h-10 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60">Cancel</button>
                      <button onClick={saveProperty} disabled={savingProperty}
                        className="flex-1 h-10 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {savingProperty
                          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <CheckCircle2 size={14} />}
                        Save Property
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions</p>
                  {!editingPerms && (
                    <button onClick={openPermsEditor}
                      className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                      <Edit3 size={12} /> Edit
                    </button>
                  )}
                </div>

                {!editingPerms ? (
                  detailStaff.permissions?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {detailStaff.permissions.map(p => (
                        <span key={p} className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">{p}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">No permissions assigned.</p>
                  )
                ) : (
                  <div className="space-y-4">
                    {Object.entries(STAFF_MODULE_GROUPS).map(([groupName, mods]) => (
                      <div key={groupName}>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{groupName}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {mods.map(mod => {
                            const active = permDraft.includes(mod.key);
                            return (
                              <button
                                key={mod.key}
                                type="button"
                                onClick={() => togglePermDraft(mod.key)}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${active
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600"}`}
                              >
                                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${active ? "border-white" : "border-slate-300"}`}>
                                  {active && <CheckCircle2 size={9} className="text-white" />}
                                </div>
                                <span className="text-[11px] font-bold truncate">{mod.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editingPerms ? (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditingPerms(false)} disabled={savingPerms}
                    className="flex-1 h-10 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60">Cancel</button>
                  <button onClick={savePerms} disabled={savingPerms}
                    className="flex-1 h-10 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {savingPerms
                      ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <CheckCircle2 size={14} />}
                    Save Permissions
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <button onClick={closeDetail} className="flex-1 h-10 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">Close</button>
                  <button
                    onClick={() => { handleToggle(detailStaff); closeDetail(); }}
                    className={`flex-1 h-10 rounded-xl text-xs font-black transition-all ${detailStaff.status === "Active" ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                  >
                    {detailStaff.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
