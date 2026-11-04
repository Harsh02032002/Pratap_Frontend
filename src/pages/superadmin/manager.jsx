import { compressImage, PRESETS } from "../../utils/imageCompression";
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { 
  Users, Clock, Search, ArrowUpRight, 
  ArrowDownRight, MoreVertical, Filter, Globe, 
  MapPin, Zap, Trash2, ChevronRight, Phone, 
  Mail, User, Megaphone, Calculator, Hammer, 
  Headset, Star, ShieldCheck, Key, LogOut, RefreshCw,
  Activity, LayoutGrid, FileText, Sparkles,
  Layers, Box, Globe2, Loader2, Save, Plus, X,
  CheckCircle2, AlertCircle, Camera,
  Building2, UserCog, ChevronDown
} from "lucide-react";
import { fetchJson, getApiBase, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
const FALLBACK_STAFF_ROLES = ["Admin", "Manager", "Accountant", "Support Agent", "Field Agent"];
const SHIFT_PRESETS = {
  "General Shift": { startTime: "09:30 AM", endTime: "06:30 PM" },
  "Morning Shift": { startTime: "08:00 AM", endTime: "05:00 PM" },
  "Afternoon Shift": { startTime: "12:00 PM", endTime: "09:00 PM" },
  "Evening Shift": { startTime: "02:00 PM", endTime: "11:00 PM" },
  "Night Shift": { startTime: "09:00 PM", endTime: "06:00 AM" },
};
const ALL_WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const cn = (...classes) => classes.filter(Boolean).join(" ");

// Legacy department names still stored on older staff records.
const legacyTeams = [
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
  const [staffRoles, setStaffRoles] = useState([]);
  const [formRole, setFormRole] = useState(FALLBACK_STAFF_ROLES[0]);
  const [formCity, setFormCity] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formLoginId, setFormLoginId] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formShiftName, setFormShiftName] = useState("General Shift");
  const [formShiftStart, setFormShiftStart] = useState("09:30 AM");
  const [formShiftEnd, setFormShiftEnd] = useState("06:30 PM");
  const [formShiftDays, setFormShiftDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);

  // ── New scope state ───────────────────────────────────────────────────────
  const [assignedProperties, setAssignedProperties]   = useState([]);   // array of {_id, title}
  const [assignedOwners, setAssignedOwners]           = useState([]);   // array of {_id, name}
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
      const [empData, cityData, areaData, propData, ownerData, roleData] = await Promise.all([
        fetchJson(`/api/employees?_t=${Date.now()}`),
        fetchJson("/api/locations/cities").catch(() => ({ data: [] })),
        fetchJson("/api/locations/areas").catch(() => ({ data: [] })),
        fetchJson("/api/properties?limit=300&status=Active").catch(() => ({ data: [] })),
        fetchJson("/api/owners?limit=300").catch(() => ({ data: [] })),
        fetchJson("/api/roles").catch(() => ({ data: [] })),
      ]);
      const loadedRoles = Array.isArray(roleData?.data) ? roleData.data : [];
      setStaffRoles(loadedRoles);

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
      const matchesTeam = currentTeam === "All" ? true : e.role === currentTeam;
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
        showNotification("Profile biometric updated");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      showNotification("Photo upload failed: " + err.message, "error");
    }
  };

  const roleOptions = staffRoles.length
    ? staffRoles.map((r) => r.name)
    : FALLBACK_STAFF_ROLES;

  const openModal = (emp = null, parentId = "") => {
    setFieldErrors({});
    if (emp) {
      setEditingId(emp.id || emp.loginId);
      setParentLoginId(emp.parentLoginId || "");
      setFormName(emp.name || "");
      setFormRole(emp.role || roleOptions[0] || FALLBACK_STAFF_ROLES[0]);
      setFormCity(emp.city || "");
      setFormArea(emp.area || "");
      setFormPhone(emp.phone || "");
      setFormEmail(emp.email || "");
      setFormLoginId(emp.loginId || "");
      setFormPassword(emp.password || "");
      setFormPhoto(emp.photoDataUrl || emp.photoUrl || "");
      setAssignedProperties(emp.assignedProperties || []);
      setAssignedOwners(emp.assignedOwners || []);
      setFormShiftName(emp.shift?.shiftName || "General Shift");
      setFormShiftStart(emp.shift?.startTime || "09:30 AM");
      setFormShiftEnd(emp.shift?.endTime || "06:30 PM");
      setFormShiftDays(Array.isArray(emp.shift?.days) && emp.shift.days.length ? emp.shift.days : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
    } else {
      setEditingId(null);
      setParentLoginId(parentId);
      setFormName("");
      setFormRole(roleOptions[0] || FALLBACK_STAFF_ROLES[0]);
      setFormCity("");
      setFormArea("");
      setFormPhone("");
      setFormEmail("");
      setFormPhoto("");
      setAssignedProperties([]);
      setAssignedOwners([]);
      setFormShiftName("General Shift");
      setFormShiftStart("09:30 AM");
      setFormShiftEnd("06:30 PM");
      setFormShiftDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
      generateCreds("", "");
    }
    setShowModal(true);
  };

  const saveEmployee = async () => {
    if (saving) return;

    setFieldErrors({});

    setSaving(true);
    const finalRole = formRole;
    const areaCode = getLocalCode(formCity, formArea);
    
    const payload = {
      name:              formName,
      email:             formEmail,
      phone:             formPhone,
      ...(formPassword && formPassword.trim() ? { password: formPassword } : {}),
      role:              finalRole,
      loginId:           formLoginId,
      city:              formCity,
      area:              formArea,
      areaCode:          areaCode,
      photoDataUrl:      formPhoto,
      parentLoginId:     parentLoginId || undefined,
      assignedProperties: assignedProperties.map(p => p._id || p),
      assignedOwners:     assignedOwners.map(o => o._id || o),
      shift: {
        shiftName: formShiftName || "General Shift",
        startTime: formShiftStart || "09:30 AM",
        endTime: formShiftEnd || "06:30 PM",
        days: formShiftDays.length ? formShiftDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      },
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
        category="TEAM MANAGEMENT"
        title="All Staff"
        subtitle="Manage all team members"
        actions={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => showNotification("Exporting staff directory CSV...")}
              className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-2 rounded-[8px] transition-all shadow-xs cursor-pointer"
            >
              Export
            </button>
            <button 
              onClick={() => openModal()}
              className="bg-[#0E7C86] hover:bg-[#0B656D] text-white text-[13px] font-semibold px-4 py-2 rounded-[8px] transition-all shadow-xs cursor-pointer"
            >
              + Add Staff
            </button>
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-[320px]">
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Search" 
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 py-2 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
          />
        </div>
        <select 
          value={currentTeam}
          onChange={e => setCurrentTeam(e.target.value)}
          className="appearance-none bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-2 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs min-w-[140px]"
        >
          <option value="All">All roles</option>
          {roleOptions.map(t => <option key={t} value={t}>{t}</option>)}
          {employees.some(e => e.role && !roleOptions.includes(e.role) && legacyTeams.includes(e.role)) &&
            legacyTeams.filter(t => employees.some(e => e.role === t)).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
        </select>
        <select 
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          className="appearance-none bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-2 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-[85px] sm:w-[90px]"
        >
          <option value="">Status ▾</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-[#E1E6EA] rounded-[12px] p-5 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-3 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left pl-2">Name</th>
                <th className="pb-3 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Role</th>
                <th className="pb-3 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Phone</th>
                <th className="pb-3 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Email</th>
                <th className="pb-3 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Status</th>
                <th className="pb-3 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6]">
                    {loading ? (
                      <tr><td colSpan="6" className="py-12 text-center">
                         <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0E7C86] rounded-full animate-spin mx-auto mb-3" />
                         <p className="text-[13px] font-medium text-[#4A5961]">Loading staff directory...</p>
                      </td></tr>
                    ) : filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-[13px] text-[#4A5961]">
                          No staff members found
                        </td>
                      </tr>
                    ) : filteredEmployees.map((e, i) => {
                       const active = e.isActive !== false;
                       return (
                        <tr key={e._id || i} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3 text-left pl-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#D9E1E7] flex items-center justify-center font-bold text-[12px] text-[#4A5961] shrink-0">
                                {buildInitials(e.name)}
                              </div>
                              <span className="text-[13px] font-medium text-[#10242A]">{e.name || "�"}</span>
                            </div>
                          </td>
                          <td className="py-3 text-left text-[13px] text-[#4A5961]">{e.role || "�"}</td>
                          <td className="py-3 text-left text-[13px] text-[#4A5961]">{e.phone || "�"}</td>
                          <td className="py-3 text-left text-[13px] text-[#4A5961]">{e.email || "�"}</td>
                          <td className="py-3 text-left">
                            <span className={cn(
                              "inline-block px-3 py-1 rounded-full text-[12px] font-semibold",
                              active ? "bg-[#DDF3E4] text-[#14532D]" : "bg-[#FDE8E8] text-[#991B1B]"
                            )}>
                              {active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 text-left pr-2">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openModal(e)} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[12px] font-semibold px-3 py-1 rounded-[6px] transition-all shadow-xs cursor-pointer">
                                View
                              </button>
                              <button onClick={() => openModal(e)} className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[12px] font-semibold px-3 py-1 rounded-[6px] transition-all shadow-xs cursor-pointer">
                                Edit
                              </button>
                              <button onClick={() => deleteEmployee(e)} className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[12px] font-semibold px-3 py-1 rounded-[6px] transition-all shadow-xs cursor-pointer">
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
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                          <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm appearance-none">
                             {roleOptions.map(t => <option key={t} value={t}>{t}</option>)}
                             {formRole && !roleOptions.includes(formRole) && (
                               <option value={formRole}>{formRole}</option>
                             )}
                          </select>
                          <p className="text-[11px] text-slate-400 font-medium px-1">
                            Access follows this role. Module permissions are set in Roles & Permissions, and they update for signed-in staff without a logout.
                          </p>
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
                             {areas
                                .filter(a => {
                                  if (!formCity) return true;
                                  const aCityName = typeof a.city === 'object' ? (a.city?.name || '') : (a.city || '');
                                  return a.cityName === formCity || aCityName === formCity;
                                })
                                .map(a => (
                                  <option key={a._id || a.id || a.name} value={a.name}>{a.name}</option>
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

                 {/* Section 2: Work Shift & Timing */}
                 <section>
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-200">2</div>
                       <div>
                          <h4 className="text-lg font-bold text-slate-800 tracking-tight">Work Shift & Timing</h4>
                          <p className="text-[11px] text-slate-400 font-medium">Assign employee shift timing and working days for check-in / check-out</p>
                       </div>
                    </div>

                    <div className="bg-emerald-50/50 rounded-[2.5rem] p-8 border border-emerald-100 space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest ml-1">Shift Type / Name</label>
                             <select
                               value={formShiftName}
                               onChange={e => {
                                 const val = e.target.value;
                                 setFormShiftName(val);
                                 if (SHIFT_PRESETS[val]) {
                                   setFormShiftStart(SHIFT_PRESETS[val].startTime);
                                   setFormShiftEnd(SHIFT_PRESETS[val].endTime);
                                 }
                               }}
                               className="w-full bg-white border border-emerald-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-100 transition-all outline-none shadow-sm"
                             >
                                {Object.keys(SHIFT_PRESETS).map(s => (
                                  <option key={s} value={s}>{s} ({SHIFT_PRESETS[s].startTime} - {SHIFT_PRESETS[s].endTime})</option>
                                ))}
                                {!SHIFT_PRESETS[formShiftName] && formShiftName && (
                                  <option value={formShiftName}>{formShiftName}</option>
                                )}
                             </select>
                          </div>

                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest ml-1">Shift Start Time</label>
                             <input
                               value={formShiftStart}
                               onChange={e => setFormShiftStart(e.target.value)}
                               placeholder="09:30 AM"
                               className="w-full bg-white border border-emerald-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-100 transition-all outline-none shadow-sm"
                             />
                          </div>

                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest ml-1">Shift End Time</label>
                             <input
                               value={formShiftEnd}
                               onChange={e => setFormShiftEnd(e.target.value)}
                               placeholder="06:30 PM"
                               className="w-full bg-white border border-emerald-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-emerald-100 transition-all outline-none shadow-sm"
                             />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest ml-1">Working Days</label>
                          <div className="flex flex-wrap gap-2 pt-1">
                             {ALL_WEEK_DAYS.map(day => {
                               const selected = formShiftDays.includes(day);
                               return (
                                 <button
                                   key={day}
                                   type="button"
                                   onClick={() => {
                                     setFormShiftDays(prev =>
                                       prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                                     );
                                   }}
                                   className={cn(
                                     "px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                                     selected
                                       ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                       : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
                                   )}
                                 >
                                   {day.slice(0, 3)}
                                 </button>
                               );
                             })}
                          </div>
                       </div>
                    </div>
                 </section>

                 {/* Section 3: Credentials */}
                 <section>
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-200">3</div>
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
                          <input value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="•••••••• saved — leave blank to keep, or type a new password" autoComplete="new-password" className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all outline-none" />
                       </div>
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

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40 group hover:translate-y-[-5px] transition-all duration-500">
       <div className="flex items-center justify-between gap-4 mb-4">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 shrink-0", colors[color])}>
             <Icon size={22} />
          </div>
          <div className="text-right flex-1 min-w-0">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
             <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none truncate">{value}</p>
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
