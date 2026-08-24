import React, { useEffect, useState, useCallback } from "react";
import {
  FileCheck, Search, ShieldCheck, X, ChevronDown, ChevronUp,
  Upload, Trash2, CheckCircle2, AlertCircle, Clock, Eye,
  Users, FileText, RefreshCw, Plus, Loader2, User
} from "lucide-react";
import { fetchJson, getApiBase, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const DOC_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Police Clearance Certificate",
  "Appointment Letter",
  "Experience Certificate",
  "Training Certificate",
  "Driving License",
  "Voter ID",
  "Other"
];

const STATUS_CONFIG = {
  Verified:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
  Pending:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400",   icon: Clock },
  Rejected:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     icon: AlertCircle }
};

const buildInitials = (name) =>
  (name || "").split(" ").slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "--";

export default function StaffDocumentsAdmin() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  // Add Document modal state
  const [addModal, setAddModal] = useState({ open: false, employee: null });
  const [addForm, setAddForm] = useState({ type: DOC_TYPES[0], number: "", fileUrl: "", fileName: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Reject modal state
  const [rejectModal, setRejectModal] = useState({ open: false, employee: null, docId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/employees/all-with-docs");
      setEmployees(res.data || []);
    } catch (e) {
      showToast("Failed to load staff list", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // Derived stats
  const totalDocs = employees.reduce((acc, e) => acc + (e.documents?.length || 0), 0);
  const verifiedDocs = employees.reduce((acc, e) => acc + (e.documents?.filter(d => d.status === "Verified").length || 0), 0);
  const pendingDocs = employees.reduce((acc, e) => acc + (e.documents?.filter(d => d.status === "Pending").length || 0), 0);
  const staffWithNoDocs = employees.filter(e => !e.documents?.length).length;

  const filtered = employees.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.loginId?.toLowerCase().includes(search.toLowerCase()) ||
      e.role?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatus === "No Documents") return !e.documents?.length;
    if (filterStatus === "Has Pending") return e.documents?.some(d => d.status === "Pending");
    if (filterStatus === "All Verified") return e.documents?.length > 0 && e.documents.every(d => d.status === "Verified");
    return true;
  });

  const handleVerify = async (empId, docId) => {
    setActionLoading(docId);
    try {
      await fetchJson(`/api/employees/${empId}/documents/${docId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ status: "Verified" })
      });
      showToast("Document verified successfully");
      fetchEmployees();
    } catch {
      showToast("Failed to verify document", "error");
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async () => {
    if (!rejectModal.docId) return;
    setActionLoading(rejectModal.docId);
    try {
      await fetchJson(`/api/employees/${rejectModal.employee._id}/documents/${rejectModal.docId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ status: "Rejected", rejectionReason: rejectReason })
      });
      showToast("Document rejected");
      setRejectModal({ open: false, employee: null, docId: null });
      setRejectReason("");
      fetchEmployees();
    } catch {
      showToast("Failed to reject document", "error");
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteDoc = async (empId, docId) => {
    if (!confirm("Remove this document?")) return;
    setActionLoading(docId);
    try {
      await fetchJson(`/api/employees/${empId}/documents/${docId}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      showToast("Document removed");
      fetchEmployees();
    } catch {
      showToast("Failed to remove document", "error");
    } finally {
      setActionLoading("");
    }
  };

  const handleAddDoc = async () => {
    if (!addForm.type) return setAddError("Document type is required");
    setAddLoading(true);
    setAddError("");
    try {
      await fetchJson(`/api/employees/${addModal.employee._id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(addForm)
      });
      showToast("Document added successfully");
      setAddModal({ open: false, employee: null });
      setAddForm({ type: DOC_TYPES[0], number: "", fileUrl: "", fileName: "" });
      fetchEmployees();
    } catch {
      setAddError("Failed to add document. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Staff Documents"
        subtitle="Manage and verify identity, KYC, and certification documents for all staff members."
        icon={<FileCheck size={22} />}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Docs", value: totalDocs, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Verified", value: verifiedDocs, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Review", value: pendingDocs, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "No Docs Uploaded", value: staffWithNoDocs, color: "text-red-600", bg: "bg-red-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border border-border ${s.bg} p-4 flex flex-col gap-1`}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
            <span className={`text-3xl font-extrabold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, or role..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-10 px-3 rounded-xl border border-border bg-card text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="All">All Staff</option>
          <option value="No Documents">No Documents</option>
          <option value="Has Pending">Has Pending</option>
          <option value="All Verified">All Verified</option>
        </select>
        <button
          onClick={fetchEmployees}
          className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold flex items-center gap-1.5 border border-border transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Staff List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading staff...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
          <Users size={32} className="opacity-30" />
          <span className="text-sm">No staff members found</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(emp => {
            const docs = emp.documents || [];
            const isOpen = expandedId === emp._id;
            const docSummary = {
              Verified: docs.filter(d => d.status === "Verified").length,
              Pending: docs.filter(d => d.status === "Pending").length,
              Rejected: docs.filter(d => d.status === "Rejected").length,
            };
            return (
              <div key={emp._id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Header Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-all"
                  onClick={() => setExpandedId(isOpen ? null : emp._id)}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {emp.photoDataUrl ? (
                      <img src={emp.photoDataUrl} alt={emp.name} className="size-10 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="size-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[13px] border border-border">
                        {buildInitials(emp.name)}
                      </div>
                    )}
                    <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card ${emp.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[14px] text-foreground">{emp.name}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-border">{emp.loginId}</span>
                      <span className="text-[10px] text-muted-foreground">{emp.customRole || emp.role}</span>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {docs.length === 0 ? (
                        <span className="text-[11px] text-red-500 font-semibold">No documents uploaded</span>
                      ) : (
                        <>
                          {docSummary.Verified > 0 && <span className="text-[11px] text-emerald-600 font-bold">{docSummary.Verified} Verified</span>}
                          {docSummary.Pending > 0 && <span className="text-[11px] text-amber-600 font-bold">{docSummary.Pending} Pending</span>}
                          {docSummary.Rejected > 0 && <span className="text-[11px] text-red-600 font-bold">{docSummary.Rejected} Rejected</span>}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setAddModal({ open: true, employee: emp }); setAddForm({ type: DOC_TYPES[0], number: "", fileUrl: "", fileName: "" }); }}
                      className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus size={12} /> Add Doc
                    </button>
                    {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded Documents */}
                {isOpen && (
                  <div className="border-t border-border/60 p-4">
                    {docs.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-6">
                        <FileText size={28} className="mx-auto mb-2 opacity-30" />
                        No documents uploaded for this staff member yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {docs.map(doc => {
                          const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.Pending;
                          const StatusIcon = cfg.icon;
                          return (
                            <div key={doc._id} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 flex flex-col gap-3`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <FileCheck size={16} className="text-blue-600 shrink-0" />
                                  <span className="font-bold text-[13px] text-foreground leading-tight">{doc.type}</span>
                                </div>
                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.text}`}>
                                  <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                                  {doc.status}
                                </span>
                              </div>

                              {doc.number && <p className="text-[11px] text-muted-foreground font-mono">Doc#: {doc.number}</p>}
                              {doc.fileName && <p className="text-[11px] text-muted-foreground truncate">File: {doc.fileName}</p>}
                              {doc.rejectionReason && (
                                <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-2 py-1">Reason: {doc.rejectionReason}</p>
                              )}

                              {doc.fileUrl && (
                                <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-1 text-[11px] text-blue-600 underline hover:text-blue-700">
                                  <Eye size={12} /> View Document
                                </a>
                              )}

                              <div className="flex gap-2 pt-1">
                                {doc.status !== "Verified" && (
                                  <button
                                    onClick={() => handleVerify(emp._id, doc._id)}
                                    disabled={actionLoading === doc._id}
                                    className="flex-1 h-7 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
                                  >
                                    {actionLoading === doc._id ? <Loader2 size={10} className="animate-spin" /> : <ShieldCheck size={10} />}
                                    Verify
                                  </button>
                                )}
                                {doc.status !== "Rejected" && (
                                  <button
                                    onClick={() => setRejectModal({ open: true, employee: emp, docId: doc._id })}
                                    disabled={actionLoading === doc._id}
                                    className="flex-1 h-7 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
                                  >
                                    <X size={10} /> Reject
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteDoc(emp._id, doc._id)}
                                  disabled={actionLoading === doc._id}
                                  className="h-7 w-7 flex items-center justify-center bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-border transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Modal */}
      {addModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-[16px] text-foreground">Add Document</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">For: <strong>{addModal.employee?.name}</strong></p>
              </div>
              <button onClick={() => setAddModal({ open: false, employee: null })} className="size-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Document Type *</label>
                <select
                  value={addForm.type}
                  onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Document Number</label>
                <input
                  value={addForm.number}
                  onChange={e => setAddForm(f => ({ ...f, number: e.target.value }))}
                  placeholder="e.g. XXXX-XXXX-9011"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">File Name / Reference</label>
                <input
                  value={addForm.fileName}
                  onChange={e => setAddForm(f => ({ ...f, fileName: e.target.value }))}
                  placeholder="aadhaar_ramesh.pdf"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Document URL (optional)</label>
                <input
                  value={addForm.fileUrl}
                  onChange={e => setAddForm(f => ({ ...f, fileUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {addError && <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{addError}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAddModal({ open: false, employee: null })} className="flex-1 h-10 rounded-xl border border-border bg-slate-50 text-[13px] font-bold hover:bg-slate-100 transition-all">Cancel</button>
              <button onClick={handleAddDoc} disabled={addLoading} className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                {addLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-[15px] text-foreground mb-1">Reject Document</h3>
            <p className="text-[12px] text-muted-foreground mb-4">Provide a reason for rejection (optional):</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Document is blurry, incorrect information..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal({ open: false, employee: null, docId: null })} className="flex-1 h-10 rounded-xl border border-border bg-slate-50 text-[13px] font-bold hover:bg-slate-100 transition-all">Cancel</button>
              <button onClick={handleReject} disabled={!!actionLoading} className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-[13px] font-semibold flex items-center gap-2 transition-all
          ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.type === "error" ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
