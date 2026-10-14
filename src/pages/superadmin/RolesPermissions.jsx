import React, { useEffect, useMemo, useState } from "react";
import { Check, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { fetchJson } from "../../utils/api";

const ACTIONS = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
];

const FALLBACK_MODULES = [
  { key: "dashboard", label: "Overview" },
  { key: "user_management", label: "User Management" },
  { key: "property_management", label: "Property Management" },
  { key: "accounting", label: "Accounting" },
  { key: "chat_management", label: "Chat Management" },
  { key: "visits", label: "Visit Report" },
  { key: "report_analytics", label: "Reports" },
  { key: "booking_leads", label: "Bookings" },
  { key: "review", label: "Reviews" },
  { key: "support", label: "Support" },
  { key: "settings", label: "Settings" },
];

const cn = (...classes) => classes.filter(Boolean).join(" ");

const emptyMatrix = (modules) => modules.map((m) => ({
  module: m.key, view: false, create: false, edit: false, delete: false,
}));

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState(FALLBACK_MODULES);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState([]);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [copyFromId, setCopyFromId] = useState("");
  const [creating, setCreating] = useState(false);

  const notify = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const load = async () => {
    try {
      const res = await fetchJson(`/api/roles?_t=${Date.now()}`);
      const list = res.data || [];
      setRoles(list);
      if (Array.isArray(res.modules) && res.modules.length) setModules(res.modules);
      setSelectedId((current) => current || list[0]?._id || null);
    } catch (err) {
      notify(err.message || "Could not load roles", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selected = roles.find((r) => r._id === selectedId) || null;

  useEffect(() => {
    if (!selected) return;
    const byModule = Object.fromEntries((selected.permissions || []).map((p) => [p.module, p]));
    setDraft(modules.map((m) => {
      const src = byModule[m.key] || {};
      return {
        module: m.key,
        view: !!src.view,
        create: !!src.create,
        edit: !!src.edit,
        delete: !!src.delete,
      };
    }));
    setDescription(selected.description || "");
  }, [selectedId, roles, modules]);

  const dirty = useMemo(() => {
    if (!selected) return false;
    if ((description || "") !== (selected.description || "")) return true;
    return JSON.stringify(draft) !== JSON.stringify(
      modules.map((m) => {
        const src = (selected.permissions || []).find((p) => p.module === m.key) || {};
        return { module: m.key, view: !!src.view, create: !!src.create, edit: !!src.edit, delete: !!src.delete };
      })
    );
  }, [draft, description, selected, modules]);

  const toggle = (moduleKey, action) => {
    setDraft((prev) => prev.map((row) => {
      if (row.module !== moduleKey) return row;
      const next = { ...row, [action]: !row[action] };
      if (action !== "view" && next[action]) next.view = true;
      if (action === "view" && !next.view) {
        next.create = false;
        next.edit = false;
        next.delete = false;
      }
      return next;
    }));
  };

  const save = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const res = await fetchJson(`/api/roles/${selected._id}`, {
        method: "PATCH",
        body: JSON.stringify({ description, permissions: draft }),
      });
      if (res?.data) {
        setRoles((prev) => prev.map((r) => (r._id === res.data._id ? res.data : r)));
      }
      notify("Permissions updated. Signed-in staff see this without logging out.");
    } catch (err) {
      notify(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const createRole = async () => {
    const name = newName.trim();
    if (!name) {
      notify("Role name is required", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetchJson("/api/roles", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: newDescription.trim(),
          copyFromId: copyFromId || undefined,
          permissions: copyFromId ? undefined : emptyMatrix(modules),
        }),
      });
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      setCopyFromId("");
      await load();
      if (res?.data?._id) setSelectedId(res.data._id);
      notify("Role created. It is now available in Add Staff.");
    } catch (err) {
      notify(err.message || "Could not create role", "error");
    } finally {
      setCreating(false);
    }
  };

  const cancelEdits = () => {
    if (!selected) return;
    const byModule = Object.fromEntries((selected.permissions || []).map((p) => [p.module, p]));
    setDraft(modules.map((m) => {
      const src = byModule[m.key] || {};
      return {
        module: m.key,
        view: !!src.view,
        create: !!src.create,
        edit: !!src.edit,
        delete: !!src.delete,
      };
    }));
    setDescription(selected.description || "");
  };

  const visibleModules = modules.filter((m) => m.key !== "dashboard");

  const removeRole = async (role) => {
    if (!role || role.isSystem) return;
    if (!window.confirm(`Delete the "${role.name}" role?`)) return;
    try {
      await fetchJson(`/api/roles/${role._id}`, { method: "DELETE" });
      if (selectedId === role._id) setSelectedId(null);
      notify("Role deleted");
      await load();
    } catch (err) {
      notify(err.message || "Could not delete role", "error");
    }
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        )}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-[12px] font-semibold">{toast.message}</p>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold text-[#10242A] tracking-tight leading-tight">Roles & Permissions</h1>
          <p className="text-[13px] text-[#4A5961] mt-1">Control what each role can access (View, Create, Edit, Delete)</p>
        </div>
        <button
          type="button"
          data-crud-action="create"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center whitespace-nowrap shrink-0 h-10 min-w-[132px] px-4 bg-[#14998C] hover:bg-[#0E7C86] text-white text-[14px] font-semibold rounded-[10px]"
        >
          + New Role
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E1E6EA] rounded-[16px] py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0E7C86]" />
        </div>
      ) : roles.length === 0 ? (
        <div className="bg-white border border-[#E1E6EA] rounded-[16px] px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-[#10242A]">Roles could not be loaded</p>
          <p className="text-[13px] text-[#4A5961] mt-1">Refresh this page. Admin, Manager, Accountant, Support Agent and Field Agent load automatically.</p>
          <button onClick={() => { setLoading(true); load(); }} className="mt-4 inline-flex whitespace-nowrap px-4 py-2 text-[13px] font-semibold text-white bg-[#14998C] rounded-[8px]">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 items-start">
          <aside className="bg-white border border-[#E6EBEF] rounded-[16px] p-4 shadow-xs">
            <p className="px-3 pb-2 text-[11px] font-bold tracking-[0.14em] text-[#8A98A1] uppercase">Roles</p>
            <div className="space-y-1">
              {roles.map((role) => {
                const active = selectedId === role._id;
                return (
                  <button
                    key={role._id}
                    type="button"
                    data-crud-ignore="true"
                    onClick={() => setSelectedId(role._id)}
                    className={cn(
                      "w-full text-left px-3 h-10 rounded-[10px] text-[14px] font-medium whitespace-nowrap border-l-[3px]",
                      active ? "bg-[#E7F6F4] text-[#10242A] border-[#14998C]" : "text-[#24343C] hover:bg-[#F4F7F8] border-transparent"
                    )}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="bg-white border border-[#E6EBEF] rounded-[16px] p-5 shadow-xs min-w-0">
            {!selected ? (
              <p className="text-[13px] text-[#4A5961]">Select a role to edit its module access.</p>
            ) : (
              <>
                <h2 className="text-[18px] font-bold text-[#10242A] mb-4">Permissions: {selected.name}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[560px]">
                    <thead>
                      <tr className="border-b border-[#EEF2F4]">
                        <th className="pb-3 text-[13px] font-semibold text-[#5C6B73]">Module</th>
                        {ACTIONS.map((a) => (
                          <th key={a.key} className="pb-3 text-[13px] font-semibold text-[#5C6B73] text-center w-[88px]">{a.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleModules.map((mod) => {
                        const row = draft.find((d) => d.module === mod.key) || {};
                        return (
                          <tr key={mod.key} className="border-b border-[#F3F6F8]">
                            <td className="py-3.5 text-[14px] text-[#24343C]">{mod.label}</td>
                            {ACTIONS.map((a) => {
                              const on = !!row[a.key];
                              return (
                                <td key={a.key} className="py-3.5 text-center">
                                  <button
                                    type="button"
                                    data-crud-action="edit"
                                    onClick={() => toggle(mod.key, a.key)}
                                    aria-pressed={on}
                                    aria-label={`${mod.label} ${a.label}`}
                                    className={cn(
                                      "inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] border transition-colors",
                                      on
                                        ? "bg-[#14998C] border-[#14998C] text-white"
                                        : "bg-white border-[#CBD3D9] hover:border-[#14998C] text-transparent"
                                    )}
                                  >
                                    {on ? <Check size={14} strokeWidth={3} /> : null}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-end gap-3 mt-5">
                  {!selected.isSystem && (
                    <button
                      type="button"
                      data-crud-action="delete"
                      onClick={() => removeRole(selected)}
                      className="mr-auto text-[13px] font-semibold text-rose-600 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete role
                    </button>
                  )}
                  <button
                    type="button"
                    data-crud-ignore="true"
                    onClick={cancelEdits}
                    disabled={!dirty || saving}
                    className="h-10 px-4 text-[14px] font-semibold text-[#24343C] whitespace-nowrap disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-crud-action="edit"
                    onClick={save}
                    disabled={!dirty || saving}
                    className="inline-flex items-center justify-center whitespace-nowrap h-10 min-w-[132px] px-4 text-[14px] font-semibold text-white bg-[#14998C] hover:bg-[#0E7C86] rounded-[10px] disabled:opacity-40"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#10242A]/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[20px] shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E1E6EA] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#10242A]">Add Role</h3>
                <p className="text-[12px] text-[#4A5961] mt-0.5">It will show in the Add Staff dropdown.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full border border-[#E1E6EA] text-[#4A5961] flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#708088] uppercase tracking-wide mb-1.5">Role name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. City Lead"
                  className="w-full border border-[#CBD3D9] rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#0E7C86]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#708088] uppercase tracking-wide mb-1.5">Description</label>
                <input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What this role is for"
                  className="w-full border border-[#CBD3D9] rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#0E7C86]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#708088] uppercase tracking-wide mb-1.5">Start from</label>
                <select
                  value={copyFromId}
                  onChange={(e) => setCopyFromId(e.target.value)}
                  className="w-full border border-[#CBD3D9] rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none bg-white"
                >
                  <option value="">Empty permissions</option>
                  {roles.map((r) => <option key={r._id} value={r._id}>Copy {r.name}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E1E6EA] bg-[#F8FAFB] flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-[13px] font-semibold text-[#4A5961]">Cancel</button>
              <button
                onClick={createRole}
                disabled={creating}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-[#0E7C86] rounded-[8px] disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
