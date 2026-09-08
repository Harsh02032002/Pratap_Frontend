
import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson, getApiBase } from "../../utils/api";
import { clearAllAuthKeys } from "../../contexts/AuthContext";
import {
  Home, LogOut, Wrench, AlertCircle, Loader2,
  Inbox, AlertTriangle, X,
} from "lucide-react";

const FILTERS = ["All", "Open", "In Progress", "Resolved"];
const LOCAL_MAJOR_DRAFT_KEY = "roomhy_tenant_major_issue_drafts";

const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};

const isEscalated = (complaint) => {
  if (["Resolved", "Rejected"].includes(complaint.status)) return false;
  return Boolean(complaint.escalated);
};

const statusColor = (status, escalated) => {
  if (escalated) return "bg-orange-100 text-orange-700 border border-orange-300";
  const map = {
    Open: "bg-red-100 text-red-700",
    Taken: "bg-yellow-100 text-yellow-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
    Resolved: "bg-green-100 text-green-700",
    Rejected: "bg-gray-100 text-gray-600"
  };
  return map[status] || "bg-slate-100 text-slate-600";
};

const priorityColor = (p) => {
  const map = { High: "text-red-600 font-bold", Medium: "text-yellow-600 font-semibold", Low: "text-green-600" };
  return map[p] || "text-slate-500";
};

const resolveOwnerLoginId = (tenantRecord = {}) =>
  String(
    tenantRecord.ownerLoginId ||
    tenantRecord.ownerId ||
    tenantRecord.owner_id ||
    tenantRecord.property?.ownerLoginId ||
    tenantRecord.property?.ownerId ||
    tenantRecord.property?.owner ||
    tenantRecord.owner ||
    ""
  ).trim().toUpperCase();

const readLocalMajorDrafts = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_MAJOR_DRAFT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalMajorDrafts = (drafts) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_MAJOR_DRAFT_KEY, JSON.stringify(drafts));
  } catch {
    // Ignore storage quota / private mode failures.
  }
};

const mergeLocalMajorDrafts = (serverComplaints, tenantRecord) => {
  const tenantId = String(tenantRecord?._id || "");
  const tenantLoginId = String(tenantRecord?.loginId || "").toUpperCase();
  const drafts = readLocalMajorDrafts().filter((draft) => {
    const draftTenantId = String(draft?.tenantId || "");
    const draftLoginId = String(draft?.tenantLoginId || "").toUpperCase();
    return draftTenantId === tenantId || draftLoginId === tenantLoginId;
  });

  const keyFor = (item) => {
    const createdAt = item?.createdAt || item?.submittedAt || "";
    const description = String(item?.description || "").trim().toLowerCase();
    const priority = String(item?.priority || "").trim().toLowerCase();
    const tenant = String(item?.tenantId || item?.tenantLoginId || "").trim().toLowerCase();
    return `${tenant}|${createdAt}|${priority}|${description}`;
  };

  const draftByKey = new Map(drafts.map((draft) => [keyFor(draft), draft]));
  const merged = [];

  for (const complaint of serverComplaints || []) {
    const key = keyFor(complaint);
    const draft = draftByKey.get(key);
    if (draft) {
      merged.push({
        ...complaint,
        category: draft.issueType || complaint.category || "General",
        imageStr: complaint.imageStr || complaint.imageUrl || draft.imageStr || "",
        imageUrl: complaint.imageUrl || draft.imageStr || "",
      });
      draftByKey.delete(key);
      continue;
    }
    merged.push(complaint);
  }

  draftByKey.forEach((draft) => {
    merged.push({
      ...draft,
      _id: draft._id || `local-${draft.createdAt || Date.now()}`,
      category: draft.issueType || draft.category || "General",
      imageStr: draft.imageStr || "",
      status: draft.status || "Open",
      escalated: draft.escalated || false,
      localDraft: true
    });
  });

  writeLocalMajorDrafts([]);
  return merged;
};

export default function Tenantcomplints() {
  useHtmlPage({
    title: "Roomhy - My Complaints & Requests",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/tenant/assets/css/tenantcomplints.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }],
    inlineScripts: []
  });

  const [tenant, setTenant] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("All");

  // Modal Visibility States
  const [minorModalOpen, setMinorModalOpen] = useState(false);
  const [majorModalOpen, setMajorModalOpen] = useState(false);

  // Minor Complaint State
  const [minorCategory, setMinorCategory] = useState("");
  const [minorDesc, setMinorDesc] = useState("");
  const [minorStatus, setMinorStatus] = useState({ loading: false, error: "" });

  // Major/Priority Complaint State
  const [majorDesc, setMajorDesc] = useState("");
  const [majorImageFile, setMajorImageFile] = useState(null); // File object — uploaded to Cloudinary on submit
  const [majorStatus, setMajorStatus] = useState({ loading: false, error: "" });
  const [imagePreview, setImagePreview] = useState(null);


  const loadTenant = async () => {
    const stored = JSON.parse(
      localStorage.getItem("tenant_user") || "null"
    );
    if (!stored?.loginId) {
      window.location.href = "/tenant/tenantlogin";
      return null;
    }
    try {
      const data = await fetchJson("/api/tenants/me");
      const match = data?.tenant || data;
      if (!match?.loginId) throw new Error("Tenant profile not found.");
      const nextTenant = {
        ...stored,
        ...match,
        ownerLoginId: resolveOwnerLoginId(match) || resolveOwnerLoginId(stored),
        propertyId: match.propertyId || match.property?._id || stored.propertyId || stored.property?._id || "",
        roomNo: match.roomNo || stored.roomNo || stored.roomNumber || "",
        bedNo: match.bedNo || stored.bedNo || ""
      };
      setTenant(nextTenant);
      return nextTenant;
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        window.location.href = "/tenant/tenantlogin";
        return null;
      }
      setErrorMsg(err?.message || "Failed to load tenant data.");
      return null;
    }
  };

  const loadComplaints = async (tenantRecord) => {
    if (!tenantRecord?._id) return;
    try {
      setLoading(true);
      const data = await fetchJson(`/api/complaints/tenant/${tenantRecord._id}`);
      const list = data?.complaints || data || [];
      setComplaints(mergeLocalMajorDrafts(list, tenantRecord));
    } catch (err) {
      setErrorMsg(err?.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const t = await loadTenant();
      if (t) await loadComplaints(t);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return complaints;
    if (filter === "In Progress") return complaints.filter((c) => c.status === "Taken" || c.status === "In Progress");
    return complaints.filter((c) => (c.status || "Open") === filter);
  }, [complaints, filter]);

  // Stats
  const stats = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter((c) => c.status === "Open" || !c.status).length,
    escalated: complaints.filter(isEscalated).length,
    resolved: complaints.filter((c) => c.status === "Resolved").length
  }), [complaints]);

  // Handle Minor Submission
  const submitMinorComplaint = async () => {
    if (!tenant) return;
    if (!minorCategory || !minorDesc.trim()) {
      setMinorStatus({ loading: false, error: "Please select a category and enter a description." });
      return;
    }
    setMinorStatus({ loading: true, error: "" });
    
    try {
      await fetchJson("/api/complaints", {
        method: "POST",
        body: JSON.stringify({
          tenantId: tenant._id,
          tenantLoginId: tenant.loginId,
          tenantName: tenant.name,
          tenantPhone: tenant.phone,
          tenantEmail: tenant.email,
          property: tenant.propertyTitle || tenant.property?.title,
          propertyId: tenant.propertyId || tenant.property?._id,
          ownerLoginId: resolveOwnerLoginId(tenant),
          roomNo: tenant.roomNo,
          bedNo: tenant.bedNo,
          category: minorCategory,
          description: minorDesc,
          priority: "Low",
          status: "Open",
          escalated: false,
          createdAt: new Date().toISOString()
        })
      });
      setMinorCategory("");
      setMinorDesc("");
      setMinorStatus({ loading: false, error: "" });
      setMinorModalOpen(false); // Close Modal on success
      await loadComplaints(tenant);
    } catch (err) {
      setMinorStatus({ loading: false, error: err?.message || "Failed to submit minor complaint." });
    }
  };

  // Store the File object — the actual upload to Cloudinary happens in submitMajorComplaint.
  // Reading as base64 here would store hundreds of KB in React state unnecessarily.
  const handleImageUpload = (e) => {
    setMajorImageFile(e.target.files[0] || null);
  };

  // Handle Major Submission
  const submitMajorComplaint = async () => {
    if (!tenant) return;
    if (!majorDesc.trim()) {
      setMajorStatus({ loading: false, error: "Please enter a description for the priority issue." });
      return;
    }
    setMajorStatus({ loading: true, error: "" });

    // Upload image to Cloudinary first so the database stores a URL, not a base64 blob.
    let imageStr = null;
    if (majorImageFile) {
      try {
        const formData = new FormData();
        formData.append("file", majorImageFile);
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const uploadRes = await fetch(`${getApiBase()}/api/upload-file`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageStr = uploadData.url || null;
        }
      } catch {
        // Image upload failure is non-fatal — submit the complaint without the image.
      }
    }

    const createdAt = new Date().toISOString();
    const basePayload = {
      tenantId: tenant._id,
      tenantLoginId: tenant.loginId,
      tenantName: tenant.name,
      tenantPhone: tenant.phone,
      tenantEmail: tenant.email,
      property: tenant.propertyTitle || tenant.property?.title,
      propertyId: tenant.propertyId || tenant.property?._id,
      ownerLoginId: resolveOwnerLoginId(tenant),
      roomNo: tenant.roomNo,
      bedNo: tenant.bedNo,
      description: majorDesc,
      priority: "High",
      imageStr,
      status: "Open",
      escalated: false,
      createdAt
    };

    try {
      await fetchJson("/api/complaints", {
        method: "POST",
        body: JSON.stringify({
          ...basePayload,
          category: "Major Issue",
          issueType: "Major Issue"
        })
      });
      writeLocalMajorDrafts(readLocalMajorDrafts().filter((draft) => draft?.createdAt !== createdAt));
      setMajorDesc("");
      setMajorImageFile(null);
      const fileInput = document.getElementById("majorImageInput");
      if (fileInput) fileInput.value = "";
      setMajorStatus({ loading: false, error: "" });
      setMajorModalOpen(false);
      await loadComplaints(tenant);
      return;
    } catch (firstErr) {
      try {
        await fetchJson("/api/complaints", {
          method: "POST",
          body: JSON.stringify({
            ...basePayload,
            category: "Other",
            issueType: "Major Issue",
            majorIssue: true
          })
        });

        writeLocalMajorDrafts([
          ...readLocalMajorDrafts().filter((draft) => draft?.createdAt !== createdAt),
          {
            ...basePayload,
            category: "Other",
            issueType: "Major Issue",
            localDraft: true
          }
        ]);

        setMajorDesc("");
        setMajorImageFile(null);
        const fileInput = document.getElementById("majorImageInput");
        if (fileInput) fileInput.value = "";
        setMajorStatus({ loading: false, error: "" });
        setMajorModalOpen(false);
        await loadComplaints(tenant);
      } catch (fallbackErr) {
        writeLocalMajorDrafts([
          ...readLocalMajorDrafts().filter((draft) => draft?.createdAt !== createdAt),
          {
            ...basePayload,
            category: "Other",
            issueType: "Major Issue",
            localDraft: true
          }
        ]);
        setMajorStatus({
          loading: false,
          error: fallbackErr?.message || firstErr?.message || "Failed to submit priority complaint."
        });
      }
    }
  };

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0f172a] flex-shrink-0 hidden md:flex flex-col transition-all duration-300">
          <div className="h-20 flex items-center px-6 border-b border-slate-800">
            <div className="bg-purple-600 p-2 rounded-lg mr-3">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
              <p className="text-[10px] text-slate-400 font-medium tracking-wider">TENANT PORTAL</p>
            </div>
          </div>
          <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
            <a href="/tenant/tenantdashboard" className="sidebar-item">Dashboard</a>
            <div className="sidebar-section-title">Information Hub</div>
            <a href="/tenant/tenantcomplints" className="sidebar-item active">View My Requests</a>
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => { clearAllAuthKeys(); window.location.href = "/tenant/tenantlogin"; }}
              className="flex items-center text-slate-400 hover:text-white w-full px-4 py-2 text-sm font-medium transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" /> Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <header className="bg-white h-16 flex items-center justify-between px-6 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800">My Requests & Complaints</h2>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
            <div className="max-w-5xl mx-auto">

              {/* Header & Action Buttons */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Issues History</h1>
                  <p className="text-sm text-slate-500 mt-1">Track status of your maintenance requests and complaints.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setMinorModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center transition-transform hover:scale-105"
                  >
                    <Wrench className="w-4 h-4 mr-2" /> Raise Minor Issue
                  </button>
                  <button
                    onClick={() => setMajorModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center transition-transform hover:scale-105"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" /> Raise Major Issue
                  </button>
                </div>
              </div>

              {/* Stats row */}
              {complaints.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    <p className="text-xs text-slate-500 mt-1">Total</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.open}</p>
                    <p className="text-xs text-slate-500 mt-1">Open</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-orange-600">{stats.escalated}</p>
                    <p className="text-xs text-slate-500 mt-1">Escalated</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                    <p className="text-xs text-slate-500 mt-1">Resolved</p>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {FILTERS.map((label) => (
                  <button
                    key={label}
                    onClick={() => setFilter(label)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm whitespace-nowrap ${
                      filter === label
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {errorMsg && <div className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{errorMsg}</div>}

              {/* Complaint cards */}
              <div className="space-y-4">
                {loading && (
                  <div className="text-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Loading your requests...</p>
                  </div>
                )}
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No complaints found.</p>
                  </div>
                )}
                {!loading && filtered.map((complaint) => {
                  const escalated = isEscalated(complaint);
                  const days = daysSince(complaint.createdAt || complaint.submittedAt);
                  const status = complaint.status || "Open";
                  return (
                    <div
                      key={complaint._id}
                      className={`bg-white rounded-xl border shadow-sm p-5 transition ${
                        escalated ? "border-orange-300 bg-orange-50/30" : "border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {complaint.issueType || complaint.category || "General"}
                            </p>
                            {escalated && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                                <AlertTriangle className="w-3 h-3" /> Escalated to Admin
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{complaint.description}</p>
                          
                          {/* Display Image Thumbnail if exists */}
                          {(complaint.imageStr || complaint.imageUrl) && (
                            <button
                              type="button"
                              onClick={() => setImagePreview(complaint.imageStr || complaint.imageUrl)}
                              className="mt-2 block"
                              aria-label="Open complaint image preview"
                            >
                              <img
                                src={complaint.imageStr || complaint.imageUrl}
                                alt="Complaint Issue"
                                className="h-16 w-16 object-cover rounded-md border border-slate-200 cursor-zoom-in transition hover:scale-105"
                              />
                            </button>
                          )}

                          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
                            <span className={priorityColor(complaint.priority)}>
                              Priority: {complaint.priority || "Low"}
                            </span>
                            <span>•</span>
                            <span>{days === 0 ? "Today" : `${days} day${days > 1 ? "s" : ""} ago`}</span>
                            {complaint.roomNo && <><span>•</span><span>Room {complaint.roomNo}</span></>}
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${statusColor(status, escalated)}`}>
                          {escalated && status !== "Resolved" ? "Escalated" : status}
                        </span>
                      </div>

                      {/* Owner response if any */}
                      {complaint.ownerResponse && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 mb-1">
                            Response by {complaint.ownerResponseBy || complaint.ownerLoginId || complaint.ownerId || "Owner"}:
                          </p>
                          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                            {complaint.ownerResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* --- MINOR COMPLAINT MODAL --- */}
      {minorModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setMinorModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-blue-500" /> Raise Minor Issue
              </h3>
              <button onClick={() => setMinorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500">For less critical issues. Standard priority and normal response time.</p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Category</label>
                <select
                  value={minorCategory}
                  onChange={(e) => setMinorCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="" disabled>Select a category...</option>
                  <option value="Plumbing">Plumbing (Leaks, Taps)</option>
                  <option value="Electrical">Electrical (Lights, Fan)</option>
                  <option value="Furniture">Furniture / Carpentry</option>
                  <option value="Appliances">Appliances (AC, Geyser)</option>
                  <option value="Cleaning">Housekeeping / Cleaning</option>
                  <option value="Internet">WiFi / Internet</option>
                  <option value="Ragging">Ragging</option>
                  <option value="Food Issue">Food Issue</option>
                  <option value="Other">Other Complaint</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={minorDesc}
                  onChange={(e) => setMinorDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Please describe the minor issue in detail..."
                />
              </div>
            </div>

            {minorStatus.error && <p className="mt-3 text-xs text-red-600">{minorStatus.error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMinorModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMinorComplaint}
                disabled={minorStatus.loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {minorStatus.loading ? "Submitting..." : "Submit Minor Issue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAJOR COMPLAINT MODAL --- */}
      {majorModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setMajorModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-red-700 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-600" /> Raise Major Issue
              </h3>
              <button onClick={() => setMajorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded">For urgent, critical problems requiring immediate attention.</p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={majorDesc}
                  onChange={(e) => setMajorDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  placeholder="Please describe the urgent issue in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Optional Image Proof</label>
                <input
                  type="file"
                  id="majorImageInput"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                />
              </div>
            </div>

            {majorStatus.error && <p className="mt-3 text-xs text-red-600">{majorStatus.error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMajorModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMajorComplaint}
                disabled={majorStatus.loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {majorStatus.loading ? "Submitting..." : "Submit Major Issue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {imagePreview && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-white text-slate-700 shadow-lg flex items-center justify-center hover:bg-slate-100"
              aria-label="Close image preview"
            >
              <span className="text-xl leading-none">×</span>
            </button>
            <img
              src={imagePreview}
              alt="Complaint proof enlarged"
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain bg-white"
            />
          </div>
        </div>
      )}

    </div>
  );
}
