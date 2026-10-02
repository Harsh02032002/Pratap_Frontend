import React, { useEffect, useState } from "react";
import { X, Plus, UserPlus, Key, Trash2, Edit, Shield, CheckCircle, XCircle } from "lucide-react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { clearOwnerRuntimeSession, fetchOwnerProperties, getOwnerRuntimeSession } from "../../utils/propertyowner";
import { fetchJson } from "../../utils/api";

const cn = (...c) => c.filter(Boolean).join(" ");

export default function PropertyManagers() {
  const [owner, setOwner] = useState(null);
  const [managers, setManagers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [creatingManager, setCreatingManager] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState({ open: false, password: "", copied: false });
  const [managerForm, setManagerForm] = useState({
    name: "",
    email: "",
    phone: "",
    assignedProperty: "",
    permissions: []
  });

  const availableModules = [
    { id: "dashboard", label: "Dashboard" },
    { id: "properties", label: "Properties" },
    { id: "tenants", label: "Tenants" },
    { id: "leads", label: "Leads & Bookings" },
    { id: "rent", label: "Rent & Payments" },
    { id: "accounting", label: "Accounting" },
    { id: "complaints", label: "Complaints & Maintenance" },
    { id: "staff", label: "Staff Management" },
    { id: "gate", label: "Attendance & Entry" },
    { id: "communication", label: "Communication" },
    { id: "marketing", label: "Marketing" },
    { id: "reports", label: "Reports" }
  ];

  useEffect(() => {
    const s = getOwnerRuntimeSession();
    if (!s?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
      return;
    }
    setOwner(s);
    loadData(s.loginId);
  }, []);

  const loadData = async (loginId) => {
    setLoading(true);
    try {
      const [props, mgrs] = await Promise.all([
        fetchOwnerProperties(loginId),
        fetchJson(`/api/property-managers/owner/${encodeURIComponent(loginId)}`)
      ]);
      setProperties(props);
      setManagers(mgrs.managers || []);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    if (!owner?.loginId || creatingManager) return;
    
    try {
      setCreatingManager(true);
      setErrorMsg("");
      const data = await fetchJson("/api/property-managers", {
        method: "POST",
        body: JSON.stringify({
          ...managerForm,
          name: managerForm.name.trim(),
          email: managerForm.email.trim().toLowerCase(),
          phone: managerForm.phone.trim(),
          ownerLoginId: owner.loginId
        })
      });

      setSelectedManager(data.manager);
      setDetailsModalOpen(true);
      setModalOpen(false);
      setManagerForm({
        name: "",
        email: "",
        phone: "",
        assignedProperty: "",
        permissions: []
      });
      await loadData(owner.loginId);
    } catch (e) {
      let message = e?.message || "Failed to create manager";
      try {
        const parsed = JSON.parse(e?.body || "{}");
        message = parsed?.message || message;
      } catch (_) {}
      setErrorMsg(message);
    } finally {
      setCreatingManager(false);
    }
  };

  const handleToggleDeactivate = async (manager) => {
    const isCurrentlyActive = manager.status === "active";
    const action = isCurrentlyActive ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${action} manager ${manager.name}?`)) return;
    
    try {
      const data = await fetchJson(`/api/property-managers/${manager._id}/${action}`, {
        method: "POST"
      });
      if (!data.success) throw new Error(data.message);

      await loadData(owner.loginId);
    } catch (e) {
      setErrorMsg(e?.message || `Failed to ${action} manager`);
    }
  };

  const handleDeleteManager = async (managerId) => {
    if (!confirm("Are you sure you want to delete this manager?")) return;

    try {
      const data = await fetchJson(`/api/property-managers/${managerId}`, {
        method: "DELETE"
      });
      if (!data.success) throw new Error(data.message);

      await loadData(owner.loginId);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to delete manager");
    }
  };

  const handleResetPassword = async (managerId) => {
    if (!confirm("Reset password for this manager?")) return;

    try {
      const data = await fetchJson(`/api/property-managers/${managerId}/reset-password`, {
        method: "POST"
      });
      if (!data.success) throw new Error(data.message);

      setResetPasswordModal({ open: true, password: data.newPassword, copied: false });
    } catch (e) {
      setErrorMsg(e?.message || "Failed to reset password");
    }
  };

  const handleCloseResetModal = () => {
    setResetPasswordModal({ open: false, password: "", copied: false });
  };

  const handleCopyResetPassword = async () => {
    try {
      await navigator.clipboard.writeText(resetPasswordModal.password);
      setResetPasswordModal((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setResetPasswordModal((prev) => ({ ...prev, copied: false })), 2000);
    } catch (_) {}
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Property Managers"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
      contentClassName="max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Property Managers</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Add managers to handle specific properties
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90"
        >
          <Plus size={16} /> Add Manager
        </button>
      </div>

      {errorMsg && (
        <div className="text-sm text-destructive mb-6 bg-destructive/10 p-4 rounded-xl">{errorMsg}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Loading...</div>
        ) : managers.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border bg-card p-16 text-center">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="font-serif text-[22px] text-foreground mb-1">No managers yet</h3>
            <p className="text-[13.5px] text-muted-foreground mb-4">Add your first property manager</p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90"
            >
              <Plus size={16} /> Add Manager
            </button>
          </div>
        ) : (
          managers.map((mgr) => (
            <div key={mgr._id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-[16px] font-semibold text-foreground">{mgr.name}</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{mgr.email}</p>
                  <p className="text-[12px] text-muted-foreground">{mgr.phone}</p>
                </div>
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-semibold",
                    mgr.status === "active"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {mgr.status}
                </span>
              </div>

              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Assigned Property
                </p>
                <p className="text-[13px] font-medium text-foreground">
                  {mgr.assignedProperty?.title || "Unknown"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {mgr.assignedProperty?.city || ""}
                </p>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-[11px] font-semibold text-blue-600 uppercase mb-1">Login Credentials</p>
                <p className="text-[13px] font-mono font-bold text-blue-900">{mgr.loginId}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleDeactivate(mgr)}
                  className={cn(
                    "inline-flex items-center justify-center h-9 px-3 rounded-lg border text-[12px] font-medium transition-colors",
                    mgr.status === "active"
                      ? "border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100/50"
                      : "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/50"
                  )}
                >
                  {mgr.status === "active" ? "Deactivate" : "Reactivate"}
                </button>
                <button
                  onClick={() => handleResetPassword(mgr._id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-[12px] font-medium hover:border-primary/40"
                >
                  <Key size={14} /> Reset Password
                </button>
                <button
                  onClick={() => handleDeleteManager(mgr._id)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Manager Modal */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm transition-all",
          modalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-[18px] font-semibold text-foreground">Add Property Manager</h2>
            <button
              type="button"
              onClick={() => {
                if (!creatingManager) setModalOpen(false);
              }}
              disabled={creatingManager}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleCreateManager} className="p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                required
                className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Manager name"
                value={managerForm.name}
                onChange={(e) => setManagerForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                required
                className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="manager@example.com"
                value={managerForm.email}
                onChange={(e) => setManagerForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Phone <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                required
                className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Phone number"
                value={managerForm.phone}
                onChange={(e) => setManagerForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Assign Property <span className="text-destructive">*</span>
              </label>
              <select
                required
                className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={managerForm.assignedProperty}
                onChange={(e) => setManagerForm((p) => ({ ...p, assignedProperty: e.target.value }))}
              >
                <option value="">Select Property</option>
                {properties.map((prop) => (
                  <option key={prop._id} value={prop._id}>
                    {prop.title}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sidebar Modules Checkboxes */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Sidebar Access (Modules)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableModules.map((mod) => {
                  const isChecked = managerForm.permissions.includes(mod.id);
                  return (
                    <label key={mod.id} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/10 cursor-pointer hover:bg-muted/30">
                      <input 
                        type="checkbox" 
                        className="rounded border-border text-primary focus:ring-primary/20"
                        checked={isChecked}
                        onChange={(e) => {
                          const newPerms = e.target.checked 
                            ? [...managerForm.permissions, mod.id]
                            : managerForm.permissions.filter(p => p !== mod.id);
                          setManagerForm(p => ({ ...p, permissions: newPerms }));
                        }}
                      />
                      <span className="text-[12px] font-medium text-foreground">{mod.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {errorMsg && <p className="text-[12px] text-destructive">{errorMsg}</p>}
            <button
              type="submit"
              disabled={creatingManager}
              className={cn(
                "w-full h-10 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90",
                creatingManager && "opacity-60 cursor-not-allowed"
              )}
            >
              {creatingManager ? "Creating..." : "Create Manager"}
            </button>
          </form>
        </div>
      </div>

      {/* Credentials Modal */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm transition-all",
          detailsModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-[18px] font-semibold text-foreground">Manager Created Successfully!</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-[12px] font-semibold text-emerald-600 uppercase mb-2">Login Credentials</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] text-emerald-600 font-medium">Login ID</p>
                  <p className="text-[16px] font-mono font-bold text-emerald-900">
                    {selectedManager?.loginId}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-emerald-600 font-medium">Password</p>
                  <p className="text-[16px] font-mono font-bold text-emerald-900">
                    {selectedManager?.plainPassword}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[12px] text-destructive font-medium">
              ⚠️ Please save these credentials. The password will not be shown again!
            </p>
            <button
              onClick={() => { setDetailsModalOpen(false); setSelectedManager(null); }}
              className="w-full h-10 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm transition-all",
          resetPasswordModal.open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-[18px] font-semibold text-foreground">Password Reset</h2>
            <button
              onClick={handleCloseResetModal}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-[11px] text-emerald-600 font-medium mb-1">New Password</p>
              <p className="text-[18px] font-mono font-bold text-emerald-900 break-all">
                {resetPasswordModal.password}
              </p>
            </div>
            <p className="text-[12px] text-destructive font-medium">
              ⚠️ This password will only be shown once. Please save it before closing.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCopyResetPassword}
                className="flex-1 h-10 rounded-lg border border-border bg-card text-[13px] font-medium hover:bg-muted"
              >
                {resetPasswordModal.copied ? "Copied!" : "Copy Password"}
              </button>
              <button
                onClick={handleCloseResetModal}
                className="flex-1 h-10 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
