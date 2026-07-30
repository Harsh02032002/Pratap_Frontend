import React, { useState, useEffect, useRef, useCallback } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerProperties, invalidateOwnerEmployeeCaches } from "../../utils/propertyowner";
import {
  UserPlus, CheckCircle2, AlertCircle, Camera, Building2,
  Clock, IndianRupee, Phone, Mail, Shield, Briefcase, Calendar, MapPin, User, Plus, X
} from "lucide-react";
import { apiFetch } from "../../utils/api";
// All Owner Panel modules — same as sidebar
const OWNER_PANEL_MODULES = [
  { key: "Dashboard",               label: "Dashboard" },
  { key: "Properties",              label: "Properties" },
  { key: "Tenants",                 label: "Tenants" },
  { key: "Leads & Bookings",        label: "Leads & Bookings" },
  { key: "Rent & Payments",         label: "Rent & Payments" },
  { key: "Complaints & Maintenance",label: "Complaints & Maintenance" },
  { key: "Staff Management",        label: "Staff Management" },
  { key: "Attendance & Entry",      label: "Attendance & Entry" },
  { key: "Communication",           label: "Communication" },
  { key: "Reports",                 label: "Reports" },
  { key: "Settings",                label: "Settings" },
];

// Sub-module restrictions — exactly matching sidebar sub-items, grouped by parent module
const OWNER_SUBMODULE_GROUPS = [
  {
    module: "Properties",
    items: [
      { key: "sm_all_properties",  label: "All Properties" },
      { key: "sm_add_property",    label: "Add Property" },
      { key: "sm_rooms",           label: "Rooms" },
      { key: "sm_add_room",        label: "Add Room" },
    ],
  },
  {
    module: "Tenants",
    items: [
      { key: "sm_all_tenants",        label: "All Tenants" },
      { key: "sm_add_tenant",         label: "Add Tenant" },
      { key: "sm_active_tenants",     label: "Active Tenants" },
      { key: "sm_upcoming_moveins",   label: "Upcoming Move-ins" },
      { key: "sm_moveout_requests",   label: "Move-out Requests" },
      { key: "sm_ex_tenants",         label: "Ex-Tenants" },
      { key: "sm_tenant_documents",   label: "Tenant Documents" },
      { key: "sm_police_verification",label: "Police Verification" },
      { key: "sm_tenant_feedback",    label: "Tenant Feedback" },
    ],
  },
  {
    module: "Leads & Bookings",
    items: [
      { key: "sm_all_leads",          label: "All Leads" },
      { key: "sm_new_enquiries",      label: "New Enquiries" },
      { key: "sm_booking_requests",   label: "Booking Requests" },
      { key: "sm_confirmed_bookings", label: "Confirmed Bookings" },
      { key: "sm_cancelled_bookings", label: "Cancelled Bookings" },
    ],
  },
  {
    module: "Rent & Payments",
    items: [
      { key: "sm_revenue_overview",   label: "Revenue Overview" },
      { key: "sm_revenue_analytics",  label: "Revenue Analytics" },
      { key: "sm_rent_collection",    label: "Rent Collection" },
      { key: "sm_pending_dues",       label: "Pending Dues" },
      { key: "sm_late_payments",      label: "Late Payments" },
      { key: "sm_payment_history",    label: "Payment History" },
      { key: "sm_online_payments",    label: "Online Payments" },
      { key: "sm_receipts",           label: "Receipts" },
      { key: "sm_electricity",        label: "Electricity Readings" },
      { key: "sm_security_deposits",  label: "Security Deposits" },
      { key: "sm_refunds",            label: "Refunds" },
      { key: "sm_penalty_settings",   label: "Penalty Settings" },
    ],
  },
  {
    module: "Complaints & Maintenance",
    items: [
      { key: "sm_all_complaints",     label: "All Complaints" },
      { key: "sm_open_tickets",       label: "Open Tickets" },
      { key: "sm_in_progress",        label: "In Progress" },
      { key: "sm_resolved",           label: "Resolved Complaints" },
      { key: "sm_maintenance_req",    label: "Maintenance Requests" },
      { key: "sm_assigned_staff",     label: "Assigned Staff" },
      { key: "sm_service_history",    label: "Service History" },
      { key: "sm_maintenance_cal",    label: "Maintenance Calendar" },
    ],
  },
  {
    module: "Staff Management",
    items: [
      { key: "sm_all_staff",         label: "All Staff" },
      { key: "sm_add_staff",         label: "Add Staff" },
      { key: "sm_staff_tasks",       label: "Staff Tasks" },
      { key: "sm_staff_attendance",  label: "Attendance" },
      { key: "sm_staff_performance", label: "Staff Performance" },
    ],
  },
  {
    module: "Attendance & Entry",
    items: [
      { key: "sm_tenant_attendance", label: "Tenant Attendance" },
      { key: "sm_visitor_entry",     label: "Visitor Entry" },
      { key: "sm_visitor_passes",    label: "Visitor Passes" },
      { key: "sm_entry_logs",        label: "Entry Logs" },
      { key: "sm_exit_logs",         label: "Exit Logs" },
      { key: "sm_leave_requests",    label: "Leave Requests" },
      { key: "sm_gate_management",   label: "Gate Management" },
    ],
  },
  {
    module: "Communication",
    items: [
      { key: "sm_chat",      label: "Chat" },
      { key: "sm_whatsapp",  label: "WhatsApp Broadcast" },
    ],
  },
  {
    module: "Settings",
    items: [
      { key: "sm_profile_settings", label: "Profile Settings" },
      { key: "sm_bank_accounts",    label: "Bank Accounts" },
      { key: "sm_data_backup",      label: "Data Backup" },
    ],
  },
];


const DEFAULT_ROLES = ["Warden", "Reception", "Accountant", "Housekeeping", "Maintenance", "Property Manager", "+ Add Custom Role"];
const SHIFTS = [
  { label: "Morning Shift (06:00 AM – 02:00 PM)", start: "06:00 AM", end: "02:00 PM" },
  { label: "Day Shift (09:00 AM – 06:00 PM)", start: "09:00 AM", end: "06:00 PM" },
  { label: "Evening Shift (02:00 PM – 10:00 PM)", start: "02:00 PM", end: "10:00 PM" },
  { label: "Night Shift (10:00 PM – 06:00 AM)", start: "10:00 PM", end: "06:00 AM" },
  { label: "Flexible Hours", start: "09:00 AM", end: "06:00 PM" },
];

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400";

const Field = ({ label, children, required }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export default function AddStaffPage() {
  // ── All hooks FIRST — no conditional returns before hooks ──
  const [owner] = useState(() => getOwnerRuntimeSession());
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", role: "Warden", customRole: "",
    phone: "", email: "",
    salary: "", shift: SHIFTS[1].label,
    joiningDate: new Date().toISOString().split("T")[0],
    address: "", emergencyContact: "",
    assignedProperty: "", assignedPropertyName: "",
    status: "Active",
    photoDataUrl: "",
    permissions: [], // Empty by default! Owner manually selects permissions
    restrictedModules: [], // Sub-module block list (Checked = Blocked)
  });
  const [customRoles, setCustomRoles] = useState(() => {
    try {
      const stored = localStorage.getItem(`owner_custom_roles_${owner?.loginId}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [customSubModules, setCustomSubModules] = useState(() => {
    try {
      const stored = localStorage.getItem("owner_custom_submodules");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [showAddCustomSubModal, setShowAddCustomSubModal] = useState(false);
  const [newSubModuleGroup, setNewSubModuleGroup] = useState("Staff Panel");
  const [newSubModuleName, setNewSubModuleName] = useState("");

  const handleCreateCustomSubModule = () => {
    if (!newSubModuleName.trim()) return;
    const cleanKey = `custom_${newSubModuleName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const newItem = { key: cleanKey, label: newSubModuleName.trim(), group: newSubModuleGroup };

    const updated = [...customSubModules, newItem];
    setCustomSubModules(updated);
    try {
      localStorage.setItem("owner_custom_submodules", JSON.stringify(updated));
    } catch (_) {}

    setFormData(prev => ({
      ...prev,
      restrictedModules: Array.from(new Set([...prev.restrictedModules, cleanKey]))
    }));
    setNewSubModuleName("");
    setShowAddCustomSubModal(false);
  };
  const [properties, setProperties] = useState([]);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextStaffId, setNextStaffId] = useState("STAFF0001");
  const photoRef = useRef(null);

  // Session redirect — inside useEffect to avoid hooks violation
  useEffect(() => {
    if (!owner?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
    }
  }, [owner]);

  useEffect(() => {
    if (!owner?.loginId) return;
    fetchOwnerProperties(owner.loginId, true)
      .then(list => setProperties(list || []))
      .catch(() => {});
    apiFetch(`/api/employees/generate-staff-id/${owner.loginId}`)
      .then(data => { if (data?.staffId) setNextStaffId(data.staffId); })
      .catch(() => {});
  }, [owner?.loginId]);

  // ── SINGLE stable handler — prevents re-render on every keystroke ──
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePropertyChange = useCallback((val) => {
    setFormData(prev => {
      const sel = properties.find(p => String(p._id || p.id) === val);
      return { ...prev, assignedProperty: val, assignedPropertyName: sel?.title || sel?.name || "" };
    });
  }, [properties]);

  const handlePhoto = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleChange("photoDataUrl", ev.target.result);
    reader.readAsDataURL(file);
  }, [handleChange]);

  const togglePermission = useCallback((perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  }, []);

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Generate secure temp password
      const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
      const password = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

      // Fetch fresh staff ID to avoid race conditions
      let staffId = nextStaffId;
      try {
        const idRes = await apiFetch(`/api/employees/generate-staff-id/${owner.loginId}`);
        if (idRes?.staffId) staffId = idRes.staffId;
      } catch (_) {}

      const shiftObj = SHIFTS.find(s => s.label === formData.shift) || SHIFTS[1];
      const roleFinal = (formData.role === "Custom" || formData.role === "+ Add Custom Role") 
        ? (formData.customRole || "Custom") 
        : formData.role;

      if (formData.customRole.trim() && !customRoles.includes(formData.customRole.trim())) {
        const updatedRoles = [...customRoles, formData.customRole.trim()];
        setCustomRoles(updatedRoles);
        try {
          localStorage.setItem(`owner_custom_roles_${owner?.loginId}`, JSON.stringify(updatedRoles));
        } catch (_) {}
      }

      // Create employee
      const empData = await apiFetch("/api/employees", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          loginId: staffId,
          phone: formData.phone,
          email: formData.email,
          password: password,
          role: roleFinal,
          parentLoginId: owner.loginId,
          photoDataUrl: formData.photoDataUrl,
          permissions: formData.permissions,
          restrictedModules: formData.restrictedModules || [],
          isActive: formData.status === "Active",
          requirePasswordReset: true,
          joiningDate: formData.joiningDate,
          address: formData.address,
          emergencyContact: formData.emergencyContact,
          assignedProperty: formData.assignedProperty,
          assignedPropertyName: formData.assignedPropertyName,
        }),
      });
      if (!empData?.data) throw new Error(empData?.error || "Failed to create staff");

      const employeeId = empData.data._id;

      // Setup salary
      if (formData.salary) {
        await apiFetch("/api/hr/salaries", {
          method: "POST",
          body: JSON.stringify({
            employeeId,
            ownerLoginId: owner.loginId,
            month: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
            baseSalary: Number(formData.salary) || 0,
            status: "Pending",
          }),
        });
      }

      // Setup shift
      await apiFetch("/api/hr/shifts", {
        method: "POST",
        body: JSON.stringify({
          employeeId,
          ownerLoginId: owner.loginId,
          shiftName: formData.shift.split("(")[0].trim(),
          startTime: shiftObj.start,
          endTime: shiftObj.end,
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        }),
      });

      setSuccessData({ staffId, password, name: formData.name, role: roleFinal, email: formData.email });
      invalidateOwnerEmployeeCaches(owner.loginId);
      setStep(1);
      setFormData({
        name: "", role: "Warden", customRole: "", phone: "", email: "", salary: "",
        shift: SHIFTS[1].label, joiningDate: new Date().toISOString().split("T")[0],
        address: "", emergencyContact: "", assignedProperty: "", assignedPropertyName: "",
        status: "Active", photoDataUrl: "", permissions: DEFAULT_PERMISSIONS,
      });
      // Refresh next ID
      try {
        const idRes = await apiFetch(`/api/employees/generate-staff-id/${owner.loginId}`);
        if (idRes?.staffId) setNextStaffId(idRes.staffId);
      } catch (_) {}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Add Staff"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <UserPlus size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add New Staff</h1>
              <p className="text-xs text-slate-500 font-medium">Auto ID: <span className="font-black text-blue-600">{nextStaffId}</span></p>
            </div>
          </div>
        </div>

        {/* Step Tabs */}
        <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-2xl w-fit">
          {[{ n: 1, label: "Profile" }, { n: 2, label: "Work Details" }, { n: 3, label: "Permissions" }].map(s => (
            <button
              key={s.n}
              onClick={() => setStep(s.n)}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${step === s.n ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {s.n}. {s.label}
            </button>
          ))}
        </div>

        {/* Success Banner */}
        {successData && (
          <div className="mb-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-4 text-emerald-800">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span className="font-black text-sm">Staff "{successData.name}" created successfully!</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Staff ID", value: successData.staffId, mono: true, color: "text-blue-700" },
                { label: "Temp Password", value: successData.password, mono: true, color: "text-slate-900" },
                { label: "Role", value: successData.role, mono: false, color: "text-slate-700" },
                { label: "Email Sent To", value: successData.email || "No email", mono: false, color: "text-slate-700" },
              ].map(item => (
                <div key={item.label} className="bg-white p-3 rounded-xl border border-emerald-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className={`text-sm font-black ${item.color} ${item.mono ? "font-mono tracking-wider" : ""} break-all`}>{item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3 font-medium">⚠️ Share these credentials with the staff member. They will be prompted to change their password on first login.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700">
            <AlertCircle size={18} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1 – Profile */}
          {step === 1 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4 flex items-center gap-2">
                <User size={16} className="text-blue-500" /> Profile Information
              </h2>

              {/* Photo Upload */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div
                    onClick={() => photoRef.current?.click()}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform overflow-hidden border-4 border-white shadow-xl shadow-blue-500/20"
                  >
                    {formData.photoDataUrl
                      ? <img src={formData.photoDataUrl} alt="Staff" className="w-full h-full object-cover" />
                      : <span className="text-3xl font-black text-white">{formData.name?.[0]?.toUpperCase() || "?"}</span>
                    }
                  </div>
                  <div
                    onClick={() => photoRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
                  >
                    <Camera size={13} className="text-white" />
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">Profile Photo</p>
                  <p className="text-xs text-slate-500 mt-0.5">Click to upload (optional)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Full Name" required>
                  <input type="text" value={formData.name} onChange={e => handleChange("name", e.target.value)}
                    placeholder="e.g. Ramesh Kumar" className={inputCls} required />
                </Field>
                <Field label="Job Role / Designation" required>
                  <select
                    value={formData.role}
                    onChange={e => {
                      const newRole = e.target.value;
                      handleChange("role", newRole);
                    }}
                    className={inputCls}
                  >
                    {DEFAULT_ROLES.filter(r => r !== "+ Add Custom Role").map(r => <option key={r} value={r}>{r}</option>)}
                    {customRoles.map(cr => <option key={cr} value={cr}>{cr}</option>)}
                    <option value="+ Add Custom Role">+ Add Custom Role / Designation</option>
                  </select>
                </Field>
                {(formData.role === "Custom" || formData.role === "+ Add Custom Role" || customRoles.includes(formData.role)) && (
                  <Field label="Custom Role / Designation Name" required>
                    <input
                      type="text"
                      value={formData.customRole || (customRoles.includes(formData.role) ? formData.role : "")}
                      onChange={e => handleChange("customRole", e.target.value)}
                      placeholder="e.g. Kitchen Supervisor, Security Guard..."
                      className={inputCls}
                      required
                    />
                  </Field>
                )}
                <Field label="Email Address" required>
                  <input type="email" value={formData.email} onChange={e => handleChange("email", e.target.value)}
                    placeholder="staff@example.com" className={inputCls} required />
                </Field>
                <Field label="Mobile Number" required>
                  <input type="tel" value={formData.phone} onChange={e => handleChange("phone", e.target.value)}
                    placeholder="+91 98765 43210" className={inputCls} required />
                </Field>
                <Field label="Emergency Contact">
                  <input type="tel" value={formData.emergencyContact} onChange={e => handleChange("emergencyContact", e.target.value)}
                    placeholder="Emergency phone" className={inputCls} />
                </Field>
                <Field label="Address">
                  <input type="text" value={formData.address} onChange={e => handleChange("address", e.target.value)}
                    placeholder="Residential address" className={inputCls} />
                </Field>
                <Field label="Status">
                  <select value={formData.status} onChange={e => handleChange("status", e.target.value)} className={inputCls}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </Field>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-50">
                <button type="button" onClick={() => setStep(2)}
                  className="px-8 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20">
                  Next: Work Details →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 – Work Details */}
          {step === 2 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-500" /> Work Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Assigned Property">
                  <select value={formData.assignedProperty} onChange={e => handlePropertyChange(e.target.value)} className={inputCls}>
                    <option value="">— All Properties / Not Assigned —</option>
                    {properties.map(p => (
                      <option key={p._id || p.id} value={p._id || p.id}>{p.title || p.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Shift Timing" required>
                  <select value={formData.shift} onChange={e => handleChange("shift", e.target.value)} className={inputCls}>
                    {SHIFTS.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                  </select>
                </Field>
                <Field label="Monthly Salary (₹)">
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" value={formData.salary} onChange={e => handleChange("salary", e.target.value)}
                      placeholder="e.g. 15000" className={`${inputCls} pl-8`} />
                  </div>
                </Field>
                <Field label="Joining Date" required>
                  <input type="date" value={formData.joiningDate} onChange={e => handleChange("joiningDate", e.target.value)}
                    className={inputCls} required />
                </Field>
              </div>

              {/* Auto-generated credentials preview */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <h3 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield size={14} /> Auto-Generated Login Credentials
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-blue-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff ID</p>
                    <p className="text-sm font-black text-blue-700 font-mono tracking-wider">{nextStaffId}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Temp Password</p>
                    <p className="text-sm font-black text-slate-600 font-mono">Auto-generated</p>
                  </div>
                </div>
                <p className="text-[10px] text-blue-700 mt-3 font-medium">
                  📧 Credentials will be emailed to {formData.email || "staff email"} after account creation.
                </p>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-50">
                <button type="button" onClick={() => setStep(1)}
                  className="px-6 h-11 border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all">
                  ← Back
                </button>
                <button type="button" onClick={() => setStep(3)}
                  className="px-8 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20">
                  Next: Permissions →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 – Owner Panel Access */}
          {step === 3 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-8">
              <div className="border-b border-slate-100 pb-5">
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Shield size={16} className="text-blue-500" /> Owner Panel Access
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Select which Owner Panel modules this staff member can access. These can be changed later.
                </p>
              </div>

              {/* Owner Panel Module Selection */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Allow Access To</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {OWNER_PANEL_MODULES.map(mod => {
                    const active = formData.permissions.includes(mod.key);
                    const Icon = mod.icon;
                    return (
                      <button
                        key={mod.key}
                        type="button"
                        onClick={() => togglePermission(mod.key)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${active
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600"}`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${active ? "border-white" : "border-slate-300"}`}>
                          {active && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        {Icon && <Icon size={14} className={active ? "text-white" : "text-slate-400"} />}
                        <span className="text-xs font-bold">{mod.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button"
                    onClick={() => setFormData(f => ({ ...f, permissions: OWNER_PANEL_MODULES.map(m => m.key) }))}
                    className="px-4 py-1.5 text-xs font-black text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all">
                    Select All
                  </button>
                  <button type="button"
                    onClick={() => setFormData(f => ({ ...f, permissions: [] }))}
                    className="px-4 py-1.5 text-xs font-black text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                    Clear
                  </button>
                </div>
              </div>

              {/* Sub-Module Restrictions — grouped by parent module */}
              <div className="pt-2 border-t border-slate-100 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Shield size={13} className="text-rose-400" /> Sub-Module Restrictions <span className="text-rose-400 normal-case font-bold">(Checked = Blocked)</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Block specific sub-features within Owner Panel modules</p>
                  </div>
                  <button type="button"
                    onClick={() => setFormData(f => ({ ...f, restrictedModules: [] }))}
                    className="px-3 py-1 text-[10px] font-bold text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all uppercase">
                    Clear All
                  </button>
                </div>

                <div className="space-y-5">
                  {[
                    ...OWNER_SUBMODULE_GROUPS,
                    // Custom sub-modules added by owner (shown under a "Custom" group)
                    ...(customSubModules.length > 0 ? [{ module: "Custom", items: customSubModules.map(c => ({ key: c.key, label: c.label })) }] : []),
                  ].map(group => (
                    <div key={group.module}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{group.module}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {group.items.map(item => {
                          const isBlocked = (formData.restrictedModules || []).includes(item.key);
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setFormData(prev => {
                                const list = prev.restrictedModules || [];
                                const next = list.includes(item.key) ? list.filter(k => k !== item.key) : [...list, item.key];
                                return { ...prev, restrictedModules: next };
                              })}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${isBlocked
                                ? "bg-rose-50 border-rose-200 text-rose-700"
                                : "bg-white border-slate-200 hover:border-rose-200 text-slate-600"}`}
                            >
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isBlocked ? "bg-rose-600 border-rose-600" : "border-slate-300 bg-white"}`}>
                                {isBlocked && <X size={9} className="text-white" />}
                              </div>
                              <span className="text-xs font-bold leading-tight">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add custom restriction inline */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubModuleName}
                    onChange={e => setNewSubModuleName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleCreateCustomSubModule())}
                    placeholder="Add custom blocked feature (e.g. View Rent Reports)..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-400 transition-all"
                  />
                  <button type="button" onClick={handleCreateCustomSubModule}
                    className="px-4 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5">
                    <Plus size={13} /> Add
                  </button>
                </div>

              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setStep(2)}
                  className="px-6 h-11 border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="px-10 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60 flex items-center gap-2">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                  ) : (
                    <><UserPlus size={15} />Create Staff Member</>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </PropertyOwnerLayout>
  );
}



