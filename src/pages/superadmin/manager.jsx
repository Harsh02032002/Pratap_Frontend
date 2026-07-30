import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { 
  Users, Shield, Clock, Search, ArrowUpRight, 
  ArrowDownRight, MoreVertical, Filter, Globe, 
  MapPin, Zap, Trash2, ChevronRight, Phone, 
  Mail, User, Megaphone, Calculator, Hammer, 
  Headset, Star, ShieldCheck, Key, LogOut, RefreshCw,
  Activity, LayoutGrid, FileText, Sparkles,
  Layers, Box, Globe2, Loader2, Save, Plus, X,
  CheckCircle2, AlertCircle, Camera, Fingerprint, Lock, Unlock, UserPlus,
  Building2, UserCog, ChevronDown
} from "lucide-react";
import { fetchJson, getApiBase, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import {
  EMPLOYEE_MODULE_OPTIONS,
  RESTRICTED_MODULE_GROUPS,
  DEFAULT_RESTRICTED_MODULES,
  EMPLOYEE_TYPES,
  ROLES_REQUIRING_ASSIGNED_PROPERTIES,
} from "../../utils/permissionKeys";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// Kept for backwards-compat with existing role filter chips
const standardTeams = [
  "Marketing Team",
  "Accounts Department",
  "Maintenance Team",
  "Customer Support"
];

const buildInitials = (name) =>
  (name || "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "--";

export default function Manager() {
  const [employees, setEmployees] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTeam, setCurrentTeam] = useState("All");
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterArea, setFilterArea] = useState("");
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [parentLoginId, setParentLoginId] = useState("");
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

  // ── New scope state ───────────────────────────────────────────────────────
  const [formEmployeeType, setFormEmployeeType]       = useState("Field Executive");
  const [assignedProperties, setAssignedProperties]   = useState([]);   // array of {_id, title}
  const [assignedOwners, setAssignedOwners]           = useState([]);   // array of {_id, name}
  const [restrictedModules, setRestrictedModules]     = useState(new Set(DEFAULT_RESTRICTED_MODULES));
  const [allProperties, setAllProperties]             = useState([]);   // dropdown options
  const [allOwners, setAllOwners]                     = useState([]);   // dropdown options
  const [propSearch, setPropSearch]                   = useState("");
  const [ownerSearch, setOwnerSearch]                 = useState("");
  const [propDropOpen, setPropDropOpen]               = useState(false);
  const [ownerDropOpen, setOwnerDropOpen]             = useState(false);
  const [fieldErrors, setFieldErrors]                 = useState({});
  const [saving, setSaving]                           = useState(false);
  const [toast, setToast] = useState(null);
  const uploadRef = useRef(null);


  const showNotification = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [empData, cityData, areaData, propData, ownerData] = await Promise.all([
        fetchJson(`/api/employees?_t=${Date.now()}`),
        fetchJson("/api/locations/cities").catch(() => ({ data: [] })),
        fetchJson("/api/locations/areas").catch(() => ({ data: [] })),
        fetchJson("/api/properties?limit=300&status=Active").catch(() => ({ data: [] })),
        fetchJson("/api/owners?limit=300").catch(() => ({ data: [] })),
      ]);

      setEmployees(empData.data || empData.employees || empData || []);
      setCities(cityData.data || cityData || []);
      setAreas(areaData.data || areaData || []);
      setAllProperties(propData.data || propData.properties || []);
      setAllOwners(ownerData.data || ownerData.owners || []);
    } catch (err) {
      console.error("Load failed:", err);
      showNotification("Failed to synchronize personnel data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = (e.name || "").toLowerCase().includes(search.toLowerCase()) || 
                           (e.loginId || "").toLowerCase().includes(search.toLowerCase());
      const matchesTeam = currentTeam === "All" ? true : 
                         currentTeam === "Custom" ? !standardTeams.includes(e.role) : 
                         e.role === currentTeam;
      const matchesCity = !filterCity || e.city === filterCity;
      const matchesArea = !filterArea || e.area === filterArea;
      
      return matchesSearch && matchesTeam && matchesCity && matchesArea;
    });
  }, [employees, search, currentTeam, filterCity, filterArea]);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.isActive !== false).length;
    const locked = employees.filter(e => e.isActive === false).length;
    return { 
      total, 
      active, 
      marketing: employees.filter(e => e.role === "Marketing Team").length, 
      maintenance: employees.filter(e => e.role === "Maintenance Team").length,
      restricted: employees.filter(e => !e.permissions || e.permissions.length === 0).length,
      locked
    };
  }, [employees]);

  // Logic from react-app
  const getLocalCode = (city, area) => {
    const base = (area || city || "").replace(/[^A-Za-z]/g, "").toUpperCase();
    return base.slice(0, 4);
  };

  const generateCreds = (city = formCity, area = formArea) => {
    const localCode = getLocalCode(city, area);
    const prefix = localCode ? `RY${localCode}` : "RY";
    const genId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
    const password = Math.random().toString(36).slice(-8).toUpperCase();
    setFormLoginId(genId);
    setFormPassword(password);
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("profilePhoto", file);
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
        showNotification("Profile biometric updated");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      showNotification("Photo upload failed: " + err.message, "error");
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

  const openModal = (emp = null, parentId = "") => {
    setFieldErrors({});
    if (emp) {
      setEditingId(emp.id || emp.loginId);
      setParentLoginId(emp.parentLoginId || "");
      setFormName(emp.name || "");
      setFormRole(standardTeams.includes(emp.role) ? emp.role : "Custom");
      setCustomRole(standardTeams.includes(emp.role) ? "" : emp.role);
      setFormCity(emp.city || "");
      setFormArea(emp.area || "");
      setFormPhone(emp.phone || "");
      setFormEmail(emp.email || "");
      setFormLoginId(emp.loginId || "");
      setFormPassword(emp.password || "");
      setFormPhoto(emp.photoDataUrl || emp.photoUrl || "");
      setSelectedPerms(new Set(emp.permissions || []));
      // ── New scope fields ──────────────────────────────────────────
      setFormEmployeeType(emp.employeeType || "Field Executive");
      setAssignedProperties(emp.assignedProperties || []);
      setAssignedOwners(emp.assignedOwners || []);
      setRestrictedModules(new Set(emp.restrictedModules || DEFAULT_RESTRICTED_MODULES));
    } else {
      setEditingId(null);
      setParentLoginId(parentId);
      setFormName("");
      setFormRole("Marketing Team");
      setCustomRole("");
      setFormCity("");
      setFormArea("");
      setFormPhone("");
      setFormEmail("");
      setFormPhoto("");
      setSelectedPerms(new Set());
      // ── New scope fields (defaults) ───────────────────────────────
      setFormEmployeeType("Field Executive");
      setAssignedProperties([]);
      setAssignedOwners([]);
      setRestrictedModules(new Set(DEFAULT_RESTRICTED_MODULES));
      generateCreds("", "");
    }
    setShowModal(true);
  };

  const saveEmployee = async () => {
    if (saving) return;

    setFieldErrors({});

    setSaving(true);
    const finalRole = formRole === "Custom" ? customRole : formRole;
    const areaCode = getLocalCode(formCity, formArea);
    
    const payload = {
      name:              formName,
      email:             formEmail,
      phone:             formPhone,
      password:          formPassword,
      role:              finalRole,
      loginId:           formLoginId,
      city:              formCity,
      area:              formArea,
      areaCode:          areaCode,
      permissions:       Array.from(selectedPerms),
      photoDataUrl:      formPhoto,
      parentLoginId:     parentLoginId || undefined,
      // ── New scope fields ─────────────────────────────────────────
      employeeType:      formEmployeeType,
      assignedProperties: assignedProperties.map(p => p._id || p),
      assignedOwners:     assignedOwners.map(o => o._id || o),
      restrictedModules:  Array.from(restrictedModules),
    };

    try {
      if (editingId) {
        const res = await fetchJson(`/api/employees/${encodeURIComponent(formLoginId)}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        showNotification("Staff details updated successfully");
        if (res?.data) {
          setEmployees(prev => prev.map(e => (e.loginId === formLoginId || e.id === formLoginId) ? res.data : e));
        }
      } else {
        const res = await fetchJson("/api/employees", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showNotification("New employee created & login credentials sent");
        if (res?.data) {
          setEmployees(prev => [res.data, ...prev.filter(e => e.loginId !== res.data.loginId)]);
        }
      }
      // Reset directory filters so newly added staff member is instantly visible
      setCurrentTeam("All");
      setFilterCity("");
      setFilterArea("");
      setSearch("");
      setShowModal(false);
      loadData();
    } catch (err) {
      const msg = err.message || "Operation failed";
      if (msg.toLowerCase().includes("assigned properties")) {
        setFieldErrors({ assignedProperties: msg });
      }
      showNotification(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (emp) => {
    const targetId = typeof emp === 'object' ? (emp.loginId || emp.id || emp._id || emp.email) : emp;
    if (!confirm("Permanently purge this personnel record?")) return;
    try {
      await fetchJson(`/api/employees/${encodeURIComponent(targetId)}`, { method: "DELETE" });
      showNotification("Personnel purged from system");
      setEmployees(prev => prev.filter(e => e.loginId !== targetId && e.id !== targetId && e._id !== targetId && e.email !== targetId));
      loadData();
    } catch (err) {
      showNotification(`Purge failed: ${err.message}`, "error");
    }
  };

  const toggleStatus = async (emp) => {
    const active = emp.isActive !== false;
    const action = active ? "deactivate" : "reactivate";
    if (!confirm(`${active ? "Lock" : "Unlock"} this personnel access?`)) return;
    try {
      await fetchJson(`/api/employees/${encodeURIComponent(emp.loginId)}/${action}`, { method: "POST" });
      showNotification(`Access ${active ? "suspended" : "restored"}`);
      loadData();
    } catch (err) {
      showNotification("Status update failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        )}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-[10px] font-bold uppercase tracking-widest">{toast.message}</p>
        </div>
      )}

      <PageHeader 
        title="Team Management"
        subtitle="Manage your team members, departments, and access permissions."
        breadcrumbs={[
          { label: "Dashboard" },
          { label: "Staff Directory", active: true }
        ]}
        actions={
          <button 
            onClick={() => openModal()}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all flex items-center gap-2"
          >
            <UserPlus size={14} /> Add Staff
          </button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardSmall label="Total Employees" value={stats.total} icon={Users} color="blue" trend="Staff Count" up />
        <StatCardSmall label="Active Now" value={stats.active} icon={Activity} color="emerald" trend="Currently Active" up />
        <StatCardSmall label="Marketing Team" value={stats.marketing} icon={Megaphone} color="indigo" trend="Department Staff" up />
        <StatCardSmall label="Locked Access" value={stats.locked} icon={Lock} color="rose" trend="Disabled Accounts" up={false} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Filters & Directory */}
        <div className="xl:col-span-12 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-6">
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Staff Directory</h3>
                 <div className="hidden lg:flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    {["All", "Marketing Team", "Accounts Department", "Maintenance Team", "Custom"].map(team => (
                      <button 
                        key={team} 
                        onClick={() => setCurrentTeam(team)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[9px] font-bold uppercase transition-all",
                          currentTeam === team ? "bg-white text-blue-600 shadow-md border border-slate-100" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                         {team === "All" ? "Global" : team.split(" ")[0]}
                      </button>
                    ))}
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100">
                    <MapPin size={12} className="text-slate-400" />
                    <select 
                      value={filterCity}
                      onChange={e => { setFilterCity(e.target.value); setFilterArea(""); }}
                      className="bg-transparent text-[10px] font-bold text-slate-600 outline-none border-none focus:ring-0 w-24"
                    >
                       <option value="">All Cities</option>
                       {cities.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="relative group flex-1 md:flex-none">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search employee ID or name..." 
                      className="bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-11 pr-4 text-[10px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all w-full md:w-64" 
                    />
                 </div>
                 <button onClick={loadData} className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100">
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                 </button>
              </div>
           </div>

           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[900px]">
                 <thead>
                    <tr className="text-slate-400 text-[9px] font-bold uppercase border-b border-slate-50">
                       <th className="pb-6 pl-4">Staff Member</th>
                       <th className="pb-6">Role / Department</th>
                       <th className="pb-6 text-center">Assigned Area</th>
                       <th className="pb-6 text-center">Account Status</th>
                       <th className="pb-6 text-right pr-4">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan="5" className="py-24 text-center">
                         <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading staff directory...</p>
                      </td></tr>
                    ) : filteredEmployees.length === 0 ? (
                      <tr><td colSpan="5" className="py-24 text-center">
                         <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching staff found</p>
                      </td></tr>
                    ) : filteredEmployees.map((e, i) => {
                       const active = e.isActive !== false;
                       return (
                        <tr key={i} className="group hover:bg-slate-50/50 transition-all duration-300">
                           <td className="py-5 pl-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                                    {e.photoDataUrl ? (
                                      <img src={e.photoDataUrl} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm uppercase">
                                        {buildInitials(e.name)}
                                      </div>
                                    )}
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold text-slate-800 leading-none">{e.name || "Unknown Node"}</p>
                                      {e.parentLoginId && <span className="text-[7px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase leading-none">Sub</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2">
                                      <code className="text-[10px] font-black text-blue-600 tracking-tighter uppercase">{e.loginId}</code>
                                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{e.phone || "No Contact"}</p>
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="py-5">
                              <div className="space-y-1.5">
                                 <p className="text-[11px] font-bold text-slate-700 leading-none">{e.role}</p>
                                 <p className="text-[9px] font-bold text-slate-400 truncate max-w-[180px] opacity-60 leading-none">{e.email}</p>
                              </div>
                           </td>
                           <td className="py-5 text-center">
                              <div className="inline-flex flex-col items-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm group-hover:bg-white transition-colors">
                                 <p className="text-[10px] font-bold text-slate-800 leading-none">{e.area || "HQ"}</p>
                                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 leading-none opacity-60">{e.city || "Head Office"}</p>
                              </div>
                           </td>
                           <td className="py-5 text-center">
                              <span className={cn(
                                 "text-[8px] font-bold px-3 py-1 rounded-xl border uppercase tracking-widest shadow-sm",
                                 active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                              )}>
                                 {active ? "Active" : "Disabled"}
                              </span>
                           </td>
                           <td className="py-5 text-right pr-4">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                   onClick={() => openModal(e)}
                                   className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white transition-all border border-slate-100 shadow-sm"
                                 >
                                    <Shield size={14} />
                                 </button>
                                 <button 
                                   onClick={() => toggleStatus(e)}
                                   className={cn(
                                     "p-2.5 rounded-xl bg-slate-50 transition-all border border-slate-100 shadow-sm",
                                     active ? "text-slate-400 hover:text-rose-600 hover:bg-white" : "text-emerald-600 hover:bg-white"
                                   )}
                                 >
                                    {active ? <Lock size={14} /> : <Unlock size={14} />}
                                 </button>
                                 <button 
                                   onClick={() => openModal(null, e.loginId)}
                                   className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all border border-slate-100 shadow-sm"
                                 >
                                    <UserPlus size={14} />
                                 </button>
                                  <button 
                                    onClick={() => deleteEmployee(e)}
                                    className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white transition-all border border-slate-100 shadow-sm"
                                    title="Delete Staff Member"
                                  >
                                     <Trash2 size={14} />
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
      </div>

      {/* Modal - Implementation follows same Premium UI patterns */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                 <div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{editingId ? "Edit Staff Member" : "Add New Staff"}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage employee details and access permissions</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-3 rounded-2xl bg-white text-slate-400 hover:text-rose-600 transition-all shadow-sm border border-slate-100">
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
                 {/* Section 1: Identity */}
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
                               onClick={() => uploadRef.current?.click()}
                               className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
                             >
                                <Camera size={16} />
                             </button>
                             <input ref={uploadRef} type="file" className="hidden" onChange={e => handlePhotoUpload(e.target.files?.[0])} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800 mb-1">Staff Photo</p>
                             <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-xs">Upload a profile photo. This will be visible in the staff directory.</p>
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
                          <div className="flex items-center justify-between px-1">
                             <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Login Identifier</label>
                             {!editingId && <button onClick={() => generateCreds()} className="text-[10px] font-bold text-indigo-600 hover:underline">Re-generate</button>}
                          </div>
                          <input value={formLoginId} readOnly className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 text-sm font-black text-indigo-700 tracking-wider shadow-sm outline-none" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1">Access Password</label>
                          <input value={formPassword} onChange={e => setFormPassword(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all outline-none" />
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
                          <button onClick={() => setSelectedPerms(new Set(EMPLOYEE_MODULE_OPTIONS.map(p => p.id)))} className="text-[10px] font-bold text-emerald-600 uppercase hover:underline">Select All</button>
                          <button onClick={() => setSelectedPerms(new Set())} className="text-[10px] font-bold text-slate-400 uppercase hover:underline">Clear All</button>
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
                               "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer group",
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






                  {/* ─── Section 4: Restricted Modules ───────────────────────────── */}
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-lg shadow-rose-200">4</div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 tracking-tight">Restricted Modules</h4>
                          <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-0.5">Default Recommended</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
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

                    <div className="space-y-5">
                      {RESTRICTED_MODULE_GROUPS.map(group => (
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
                  </section>

               </div>

               <div className="px-10 py-8 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-4">
                  <button onClick={() => setShowModal(false)} disabled={saving} className="px-8 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-white transition-all disabled:opacity-50">Cancel</button>
                  <button
                    onClick={saveEmployee}
                    disabled={saving}
                    className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <>
                        <Save size={16} /> Save Staff
                      </>
                    )}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

function StatCardSmall({ label, value, icon: Icon, color, trend, up }) {
  const colors = {
    blue: "bg-blue-600 text-white shadow-blue-100",
    emerald: "bg-emerald-600 text-white shadow-emerald-100",
    indigo: "bg-indigo-600 text-white shadow-indigo-100",
    rose: "bg-rose-600 text-white shadow-rose-100"
  };

  const bgLight = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    rose: "bg-rose-50 text-rose-600"
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40 group hover:translate-y-[-5px] transition-all duration-500">
       <div className="flex items-center gap-4 mb-6">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6", colors[color])}>
             <Icon size={22} />
          </div>
          <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
             <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{value}</p>
          </div>
       </div>
       <div className={cn(
         "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest",
         up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
       )}>
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
       </div>
    </div>
  );
}
