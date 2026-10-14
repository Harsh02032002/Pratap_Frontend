import { compressImage, PRESETS } from "../../utils/imageCompression";
import React, { useEffect, useState, useRef } from "react";
import { 
  ShieldCheck, Users, Search, Filter, 
  ChevronRight, Save, RotateCcw, X, 
  UserPlus, ShieldAlert, CheckCircle2, 
  Activity, Lock, Edit3, Trash2, Camera,
  Fingerprint, Loader2, MapPin, Building2, Shield, User, Plus
} from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchJson, getAuthHeader, getApiBase } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { 
  EMPLOYEE_TYPES, 
  ROLES_REQUIRING_ASSIGNED_PROPERTIES, 
  DEFAULT_RESTRICTED_MODULES, 
  RESTRICTED_MODULE_GROUPS, 
  EMPLOYEE_MODULE_OPTIONS 
} from "../../utils/permissionKeys";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const standardTeams = ["Marketing Team", "Accounts Department", "Maintenance Team"];

const buildInitials = (name = "") => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2) || "ST").toUpperCase();
};

export default function RolesPermissions() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [allOwners, setAllOwners] = useState([]);
  
  // Matrix / Full Edit Modal State
  const [editingStaff, setEditingStaff] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("Marketing Team");
  const [customRole, setCustomRole] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formLoginId, setFormLoginId] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [selectedPerms, setSelectedPerms] = useState(new Set());
  const [formEmployeeType, setFormEmployeeType] = useState("Field Executive");
  const [assignedProperties, setAssignedProperties] = useState([]);
  const [assignedOwners, setAssignedOwners] = useState([]);
  const [restrictedModules, setRestrictedModules] = useState(new Set());
  const [customSubModules, setCustomSubModules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("custom_restricted_submodules") || "[]");
    } catch {
      return [];
    }
  });
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newSubModuleGroup, setNewSubModuleGroup] = useState("Reports");
  const [newSubModuleName, setNewSubModuleName] = useState("");

  const handleCreateCustomSubModule = () => {
    if (!newSubModuleName.trim()) return;
    const cleanKey = `custom_${newSubModuleName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const newItem = { key: cleanKey, label: newSubModuleName.trim(), group: newSubModuleGroup };

    const updated = [...customSubModules, newItem];
    setCustomSubModules(updated);
    try {
      localStorage.setItem("custom_restricted_submodules", JSON.stringify(updated));
    } catch (_) {}

    setRestrictedModules(prev => new Set([...prev, cleanKey]));
    setNewSubModuleName("");
    setShowAddCustomModal(false);
  };

  const uploadRef = useRef(null);

  useEffect(() => {
    fetchEmployees();
    fetchLocationsAndMasters();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetchJson(`/api/employees?_t=${Date.now()}`, { headers: getAuthHeader() });
      if (res.success || Array.isArray(res.data)) setEmployees(res.data || res);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationsAndMasters = async () => {
    try {
      const [cRes, aRes, pRes, oRes] = await Promise.all([
        fetchJson("/api/locations/cities").catch(() => ({ data: [] })),
        fetchJson("/api/locations/areas").catch(() => ({ data: [] })),
        fetchJson("/api/properties?limit=300&status=Active").catch(() => ({ data: [] })),
        fetchJson("/api/owners?limit=300").catch(() => ({ data: [] }))
      ]);
      setCities(cRes.data || cRes || []);
      setAreas(aRes.data || aRes || []);
      setAllProperties(pRes.properties || pRes.data || []);
      setAllOwners(oRes.owners || oRes.data || []);
    } catch (e) {
      console.warn("Failed to load master data:", e);
    }
  };

  const openMatrix = (staff) => {
    setEditingStaff(staff);
    setFormName(staff.name || "");
    setFormRole(standardTeams.includes(staff.role) ? staff.role : "Custom");
    setCustomRole(standardTeams.includes(staff.role) ? "" : staff.role || "");
    setFormCity(staff.city || "");
    setFormArea(staff.area || "");
    setFormPhone(staff.phone || "");
    setFormEmail(staff.email || "");
    setFormLoginId(staff.loginId || "");
    setFormPassword(staff.password || "");
    setFormPhoto(staff.photoDataUrl || staff.photoUrl || "");
    setSelectedPerms(new Set(staff.permissions || []));
    setFormEmployeeType(staff.employeeType || "Field Executive");
    setAssignedProperties(staff.assignedProperties || []);
    setAssignedOwners(staff.assignedOwners || []);
    setRestrictedModules(new Set(staff.restrictedModules || DEFAULT_RESTRICTED_MODULES));
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    // Avatars render small — the tighter AVATAR budget is plenty.
    const optimizedFile = await compressImage(file, PRESETS.AVATAR);
    const formData = new FormData();
    formData.append("profilePhoto", optimizedFile);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/upload-profile-photo`, { 
        method: "POST", 
        body: formData,
        headers: getAuthHeader()
      });
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `HTTP error ${res.status}`);
      }

      if (res.ok && data.url) {
        setFormPhoto(data.url);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Photo upload failed: " + err.message);
    }
  };

  const togglePerm = (id) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const savePermissions = async () => {
    if (!editingStaff) return;
    setSaving(true);
    const finalRole = formRole === "Custom" ? customRole : formRole;

    const payload = {
      name:               formName,
      email:              formEmail,
      phone:              formPhone,
      // Only send a password when a new one was typed; the list API never returns
      // the stored one, so the field is blank and sending it would wipe the login.
      ...(formPassword && formPassword.trim() ? { password: formPassword } : {}),
      role:               finalRole,
      loginId:            formLoginId,
      city:               formCity,
      area:               formArea,
      permissions:        Array.from(selectedPerms),
      photoDataUrl:       formPhoto,
      employeeType:       formEmployeeType,
      assignedProperties: assignedProperties.map(p => p._id || p),
      assignedOwners:     assignedOwners.map(o => o._id || o),
      restrictedModules:  Array.from(restrictedModules),
    };

    try {
      const res = await fetchJson(`/api/employees/${encodeURIComponent(formLoginId)}`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });
      if (res.success || res.data) {
        setEmployees(prev => prev.map(e => e.loginId === formLoginId ? (res.data || { ...e, ...payload }) : e));
        setEditingStaff(null);
      }
    } catch (err) {
      alert("Failed to update staff: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(e => 
    (e.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (e.loginId || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Roles: real data from /api/roles (saved templates + roles staff already hold) ──
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [draftPerms, setDraftPerms] = useState(new Set());
  const [applyToStaff, setApplyToStaff] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState(null); // null = closed

  const loadRoles = async (keepSelection) => {
    try {
      setRolesError("");
      const res = await fetchJson(`/api/roles?_t=${Date.now()}`, { headers: getAuthHeader() });
      const list = res.roles || [];
      setRoles(list);
      const pick = list.find((r) => r.name === keepSelection) || list[0];
      setSelectedRole(pick ? pick.name : "");
      setDraftPerms(new Set(pick ? pick.permissions : []));
    } catch (err) {
      setRolesError(err.message || "Could not load roles");
    } finally {
      setRolesLoading(false);
    }
  };
  useEffect(() => { loadRoles(); }, []);

  const currentRole = roles.find((r) => r.name === selectedRole) || null;
  const savedPerms = new Set(currentRole ? currentRole.permissions : []);
  const dirty = !!currentRole && (draftPerms.size !== savedPerms.size || [...draftPerms].some((p) => !savedPerms.has(p)));

  const chooseRole = (r) => { setSelectedRole(r.name); setDraftPerms(new Set(r.permissions)); setApplyToStaff(false); };
  const toggleDraftPerm = (key) => setDraftPerms((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const saveRole = async (name, permissions, apply) => {
    setSavingRole(true);
    try {
      const res = await fetchJson("/api/roles", {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify({ name, permissions, applyToStaff: apply }),
      });
      toast.success(apply ? `Saved. Updated ${res.appliedTo} staff member(s).` : "Role saved.");
      setApplyToStaff(false);
      await loadRoles(name);
      if (apply) fetchEmployees();
    } catch (err) {
      toast.error(err.message || "Could not save role");
    } finally {
      setSavingRole(false);
    }
  };

  const createRole = async (e) => {
    e.preventDefault();
    const name = (newRoleName || "").trim();
    if (!name) return;
    await saveRole(name, [], false);
    setNewRoleName(null);
  };

  const deleteRole = async () => {
    if (!currentRole?.id || !window.confirm(`Delete the "${currentRole.name}" role template? Staff keep the access they already have.`)) return;
    try {
      await fetchJson(`/api/roles/${currentRole.id}`, { method: "DELETE", headers: getAuthHeader() });
      toast.success("Role deleted.");
      await loadRoles();
    } catch (err) {
      toast.error(err.message || "Could not delete role");
    }
  };

  return (
    <div className="space-y-4 text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight">Roles & Permissions</h1>
          <p className="text-[13px] text-[#4A5961]">Choose which sections each role can open</p>
        </div>
        <button
          onClick={() => setNewRoleName("")}
          className="bg-[#0E7C86] hover:bg-[#0B666E] text-white text-[13px] font-semibold px-4 py-2 rounded-[8px] transition-all shadow-xs cursor-pointer"
        >
          + New Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-4 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-sm">
          <h3 className="text-[12px] font-bold text-[#4A5961] uppercase tracking-wider mb-3">ROLES</h3>
          {newRoleName !== null && (
            <form onSubmit={createRole} className="flex gap-2 mb-3">
              <input
                autoFocus
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                maxLength={60}
                placeholder="Role name"
                className="flex-1 min-w-0 border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px]"
              />
              <button disabled={savingRole || !newRoleName.trim()} className="bg-[#0E7C86] text-white text-[13px] font-semibold px-3 rounded-[8px] disabled:opacity-50">Add</button>
              <button type="button" onClick={() => setNewRoleName(null)} className="text-[13px] text-[#4A5961] px-1">✕</button>
            </form>
          )}
          {rolesLoading && <p className="text-[13px] text-[#4A5961]">Loading roles…</p>}
          {rolesError && <p className="text-[13px] text-red-600">{rolesError}</p>}
          {!rolesLoading && !rolesError && roles.length === 0 && (
            <p className="text-[13px] text-[#4A5961]">No roles yet. Click “+ New Role” to create one.</p>
          )}
          <div className="space-y-1">
            {roles.map((role) => {
              const isActive = role.name === selectedRole;
              return (
                <button
                  key={role.name}
                  onClick={() => chooseRole(role)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-[13px] font-semibold transition-all flex items-center justify-between cursor-pointer rounded-[8px] border-l-[3.5px]",
                    isActive ? "bg-[#E6F4F5] text-[#0E7C86] border-[#0E7C86]" : "text-[#10242A] hover:bg-slate-50 border-transparent"
                  )}
                >
                  <span>{role.name}{!role.saved && <span className="ml-2 text-[10px] font-medium text-[#4A5961]">not saved yet</span>}</span>
                  <span className="text-[11px] font-medium text-[#4A5961]">{role.staffCount} staff</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col">
          {currentRole ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-bold text-[#10242A]">Permissions: {currentRole.name}</h3>
                {currentRole.saved && (
                  <button onClick={deleteRole} className="text-[12px] font-semibold text-red-600 hover:underline">Delete role</button>
                )}
              </div>
              <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-sm flex flex-col justify-between">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E1E6EA]">
                      <th className="text-[12px] font-semibold text-[#4A5961] pb-2 px-3">Section</th>
                      <th className="text-[12px] font-semibold text-[#4A5961] pb-2 px-3 text-center w-28">Can open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6EA] text-[13px]">
                    {EMPLOYEE_MODULE_OPTIONS.map((m) => (
                      <tr key={m.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-2 px-3 text-[#10242A] font-medium">{m.label}</td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={`${currentRole.name} can open ${m.label}`}
                            checked={draftPerms.has(m.id)}
                            onChange={() => toggleDraftPerm(m.id)}
                            className="w-4 h-4 accent-[#0E7C86] cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[12px] text-[#4A5961] mt-3">
                  Accounting and Settings are superadmin-only and can’t be given to a role. Fine-grained blocks inside a section are set per staff member.
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[#E1E6EA]">
                  <label className={cn("flex items-center gap-2 text-[13px]", currentRole.staffCount ? "cursor-pointer" : "opacity-50")}>
                    <input
                      type="checkbox"
                      disabled={!currentRole.staffCount}
                      checked={applyToStaff}
                      onChange={(e) => setApplyToStaff(e.target.checked)}
                      className="w-4 h-4 accent-[#0E7C86]"
                    />
                    Also update the {currentRole.staffCount} staff member(s) who have this role
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      disabled={!dirty || savingRole}
                      onClick={() => setDraftPerms(new Set(currentRole.permissions))}
                      className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={(!dirty && !applyToStaff && currentRole.saved) || savingRole}
                      onClick={() => saveRole(currentRole.name, [...draftPerms], applyToStaff)}
                      className="bg-[#0E7C86] hover:bg-[#0B656D] text-white text-[13px] font-semibold px-4 py-1.5 rounded-[8px] disabled:opacity-50"
                    >
                      {savingRole ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            !rolesLoading && <p className="text-[13px] text-[#4A5961]">Select or create a role to edit its access.</p>
          )}
        </div>
      </div>

      {/* Comprehensive Edit Personnel & Access Control Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingStaff(null)} />
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                 <div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Staff Member Details</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel: <span className="text-blue-600">{editingStaff.name}</span> ({editingStaff.loginId})</p>
                 </div>
                 <button onClick={() => setEditingStaff(null)} className="p-3 rounded-2xl bg-white text-slate-400 hover:text-rose-600 transition-all shadow-sm border border-slate-100">
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
                 {/* Section 1: Personal Details */}
                 <section>
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-200">1</div>
                       <h4 className="text-lg font-bold text-slate-800 tracking-tight">Personal Details</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="md:col-span-2 flex items-center gap-8">
                          <div className="relative group">
                             <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                                {formPhoto ? <img src={formPhoto} className="w-full h-full object-cover" /> : <p className="text-3xl font-black text-slate-200">{buildInitials(formName)}</p>}
                             </div>
                             <button 
                               type="button"
                               onClick={() => uploadRef.current?.click()}
                               className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
                             >
                                <Camera size={16} />
                             </button>
                             <input ref={uploadRef} type="file" className="hidden" onChange={e => handlePhotoUpload(e.target.files?.[0])} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800 mb-1">Staff Biometric Photo</p>
                             <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-xs">Upload or update profile photo. Visible in staff directory and identity cards.</p>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                          <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Aman Kumar" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm" />
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role / Department</label>
                          <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm appearance-none">
                             {standardTeams.map(t => <option key={t} value={t}>{t}</option>)}
                             <option value="Custom">Custom Role</option>
                          </select>
                          {formRole === "Custom" && (
                            <input value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="Type custom role..." className="w-full mt-3 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm" />
                          )}
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Employee Type</label>
                          <select
                            value={formEmployeeType}
                            onChange={e => setFormEmployeeType(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm appearance-none"
                          >
                            {EMPLOYEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {ROLES_REQUIRING_ASSIGNED_PROPERTIES.includes(formEmployeeType) && (
                            <p className="text-[10px] text-amber-600 font-semibold px-1 flex items-center gap-1">
                              <Shield size={10} /> This type requires at least one Assigned Property
                            </p>
                          )}
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">City</label>
                          <select value={formCity} onChange={e => { setFormCity(e.target.value); setFormArea(""); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm appearance-none">
                             <option value="">Select City</option>
                             {cities.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                          </select>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Area</label>
                          <select value={formArea} onChange={e => setFormArea(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm appearance-none">
                             <option value="">Select Area</option>
                             {areas.filter(a => a.cityName === formCity || a.city === formCity).map(a => (
                               <option key={a.id || a.name} value={a.name}>{a.name}</option>
                             ))}
                          </select>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                          <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+91 XXXX" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm" />
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                          <input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="personnel@roomhy.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm" />
                       </div>
                    </div>
                 </section>

                 {/* Section 2: Credentials */}
                 <section>
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-200">2</div>
                       <h4 className="text-lg font-bold text-slate-800 tracking-tight">Login Credentials</h4>
                    </div>
                    
                    <div className="bg-indigo-50/50 rounded-[2.5rem] p-8 border border-indigo-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1">Login Identifier</label>
                          <input value={formLoginId} readOnly className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 text-sm font-black text-indigo-700 tracking-wider shadow-sm outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1">Access Password</label>
                          <input value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="•••••••• saved — leave blank to keep, or type a new password" autoComplete="new-password" className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all outline-none" />
                       </div>
                    </div>
                 </section>

                 {/* Section 3: Module Access Permissions */}
                 <section>
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-200">3</div>
                          <div>
                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">Module Access Permissions</h4>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Select which top-level modules this employee can access</p>
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <button type="button" onClick={() => setSelectedPerms(new Set(EMPLOYEE_MODULE_OPTIONS.map(p => p.id)))} className="text-[10px] font-bold text-emerald-600 uppercase hover:underline">Select All</button>
                          <button type="button" onClick={() => setSelectedPerms(new Set())} className="text-[10px] font-bold text-slate-400 uppercase hover:underline">Clear All</button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                       {EMPLOYEE_MODULE_OPTIONS.map(perm => {
                         const selected = selectedPerms.has(perm.id);
                         return (
                           <div 
                             key={perm.id} 
                             onClick={() => togglePerm(perm.id)}
                             className={cn(
                               "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer group select-none",
                               selected ? "bg-emerald-50 border-emerald-100 shadow-sm" : "bg-white border-slate-100 hover:border-emerald-100"
                             )}
                           >
                              <div className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center border transition-all",
                                selected ? "bg-emerald-600 border-emerald-600 text-white" : "bg-slate-50 border-slate-200 text-transparent"
                              )}>
                                 <Fingerprint size={12} />
                              </div>
                              <span className={cn("text-[10px] font-bold uppercase tracking-tight", selected ? "text-emerald-700" : "text-slate-500 group-hover:text-slate-800")}>{perm.label}</span>
                           </div>
                         );
                       })}
                    </div>
                 </section>

                 {/* Section 4: Restricted Modules */}
                 <section>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-lg shadow-rose-200">4</div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 tracking-tight">Restricted Modules</h4>
                          <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-0.5">Sub-Module Gating (Checked = Blocked)</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <button type="button" onClick={() => setShowAddCustomModal(true)}
                          className="px-3.5 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all uppercase flex items-center gap-1.5 shadow-sm">
                          <Plus size={12} /> Add Custom Sub-Module
                        </button>
                        <button type="button" onClick={() => setRestrictedModules(new Set(DEFAULT_RESTRICTED_MODULES))}
                          className="px-3 py-1.5 text-[10px] font-bold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-all uppercase">
                          Select All
                        </button>
                        <button type="button" onClick={() => setRestrictedModules(new Set())}
                          className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all uppercase">
                          Clear All
                        </button>
                        <button type="button" onClick={() => setRestrictedModules(new Set(DEFAULT_RESTRICTED_MODULES))}
                          className="px-3 py-1.5 text-[10px] font-bold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all uppercase">
                          Reset Recommended
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium mb-8 ml-14 leading-relaxed">
                      These permissions are sensitive. <strong className="text-slate-600">Checked (red) = Blocked.</strong>{" "}
                      Uncheck only to grant access.
                    </p>

                    {(() => {
                      const mergedGroups = RESTRICTED_MODULE_GROUPS.map(group => {
                        const customItems = customSubModules
                          .filter(c => c.group === group.moduleLabel)
                          .map(c => ({ key: c.key, label: c.label }));
                        return {
                          ...group,
                          items: [...group.items, ...customItems]
                        };
                      });

                      const customOnlyGroupNames = Array.from(new Set(customSubModules.map(c => c.group)))
                        .filter(g => !RESTRICTED_MODULE_GROUPS.some(rg => rg.moduleLabel === g));

                      customOnlyGroupNames.forEach(gName => {
                        const items = customSubModules
                          .filter(c => c.group === gName)
                          .map(c => ({ key: c.key, label: c.label }));
                        mergedGroups.push({ moduleLabel: gName, items });
                      });

                      return (
                        <div className="space-y-5">
                          {mergedGroups.map(group => (
                            <div key={group.moduleLabel} className="bg-slate-50/60 rounded-[2rem] p-6 border border-slate-100">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{group.moduleLabel}</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {group.items.map(item => {
                                  const isBlocked = restrictedModules.has(item.key);
                                  return (
                                    <div key={item.key}
                                      onClick={() => setRestrictedModules(prev => {
                                        const next = new Set(prev);
                                        if (next.has(item.key)) next.delete(item.key); else next.add(item.key);
                                        return next;
                                      })}
                                      className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                                        isBlocked ? "bg-rose-50 border-rose-200" : "bg-white border-slate-100 hover:border-rose-100"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0",
                                        isBlocked ? "bg-rose-600 border-rose-600 text-white" : "bg-white border-slate-200"
                                      )}>
                                        {isBlocked && <X size={10} />}
                                      </div>
                                      <span className={cn("text-[10px] font-bold leading-tight", isBlocked ? "text-rose-700" : "text-slate-500")}>{item.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                 </section>
              </div>

              <div className="px-10 py-8 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-4">
                 <button type="button" onClick={() => setEditingStaff(null)} disabled={saving} className="px-8 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-white transition-all disabled:opacity-50">Cancel</button>
                 <button 
                   type="button"
                   onClick={savePermissions}
                   disabled={saving}
                   className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all flex items-center gap-3 disabled:opacity-50"
                 >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...</>
                    ) : (
                      <><Save size={16} /> Save All Personnel Details</>
                    )}
                 </button>
              </div>
           </div>
         </div>
      )}

      {/* Modal to Add Custom Restricted Sub-Module */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddCustomModal(false)} />
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative z-10 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Add Custom Restricted Sub-Module</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Define new operational boundary for gating</p>
              </div>
              <button onClick={() => setShowAddCustomModal(false)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-rose-600 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Parent Module Group</label>
                <select
                  value={newSubModuleGroup}
                  onChange={e => setNewSubModuleGroup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                >
                  {RESTRICTED_MODULE_GROUPS.map(g => (
                    <option key={g.moduleLabel} value={g.moduleLabel}>{g.moduleLabel}</option>
                  ))}
                  <option value="Accounting">Accounting</option>
                  <option value="Visit Reports">Visit Reports</option>
                  <option value="Settings">Settings</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sub-Module Label / Feature Name</label>
                <input
                  type="text"
                  value={newSubModuleName}
                  onChange={e => setNewSubModuleName(e.target.value)}
                  placeholder="e.g. Occupancy Rate Report or Due Rent Reminders"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-6 py-3 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomSubModule}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all"
              >
                Create Sub-Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
