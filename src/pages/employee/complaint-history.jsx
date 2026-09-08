import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";
import { useLegacySidebar } from "../../utils/legacyUi";

const STATUS_ORDER = ["Open", "Taken", "Resolved", "Rejected"];

export default function ComplaintHistory() {
  useHtmlPage({
    title: "Roomhy - Complaint History & Management",
    bodyClass: "text-gray-900",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/superadmin/assets/css/complaint-history.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useLegacySidebar();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [actionId, setActionId] = useState("");

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await fetchJson("/api/complaints");
      setComplaints(data?.complaints || data || []);
    } catch (err) {
      setErrorMsg(err?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [complaints, filter, query]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return complaints.filter((c) => {
      const status = String(c.status || "Open");
      if (filter !== "all" && status !== filter) return false;
      if (!normalizedQuery) return true;
      const name = String(c.complaintBy || c.tenantName || c.tenantId || "").toLowerCase();
      const message = String(c.message || c.complaint || c.title || "").toLowerCase();
      return name.includes(normalizedQuery) || message.includes(normalizedQuery);
    });
  }, [complaints, filter, query]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => (c.status || "Open") === "Open").length;
    const taken = complaints.filter((c) => (c.status || "") === "Taken").length;
    const resolved = complaints.filter((c) => (c.status || "") === "Resolved").length;
    const rejected = complaints.filter((c) => (c.status || "") === "Rejected").length;
    return { total, open, taken, resolved, rejected };
  }, [complaints]);

  const updateStatus = async (complaint, status) => {
    if (!complaint?._id) return;
    if (!window.confirm(`Mark complaint as ${status}?`)) return;
    try {
      setActionId(complaint._id);
      await fetchJson(`/api/complaints/${complaint._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      await loadComplaints();
    } catch (err) {
      window.alert(err?.message || "Failed to update complaint");
    } finally {
      setActionId("");
    }
  };

  return (
    <div className="html-page">
      <div className="flex h-screen bg-gray-100">
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div>
                <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
                <span className="text-[10px] text-gray-500">SUPER ADMIN</span>
              </div>
            </div>
          </div>
          <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center">
              <button id="mobile-menu-open" className="md:hidden mr-4 text-slate-500"><i data-lucide="menu" className="w-6 h-6"></i></button>
              <div className="flex items-center text-sm">
                <span className="text-slate-500 font-medium">Support</span>
                <i data-lucide="chevron-right" className="w-4 h-4 mx-2 text-slate-400"></i>
                <span className="text-slate-800 font-semibold">Complaint History</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={loadComplaints} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-2">
                <i data-lucide="refresh-cw" className="w-4 h-4"></i> Refresh
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Complaint History & Management</h1>
                <p className="text-sm text-slate-500 mt-1">View all complaints across the platform with full tracking and resolution history.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-slate-400">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Total</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Open</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.open}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
                  <p className="text-xs text-slate-500 uppercase font-semibold">In Progress</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.taken}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Resolved</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.resolved}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-400">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Rejected</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.rejected}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-grow md:flex-grow-0">
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by tenant name or complaint..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 w-full md:w-80"
                  />
                  <i data-lucide="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"></i>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["all", "Open", "Taken", "Resolved"].map((label) => (
                    <button
                      key={label}
                      onClick={() => setFilter(label)}
                      className={`filter-btn px-4 py-2 rounded-lg text-sm font-medium ${filter === label ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      {label === "all" ? "All" : label === "Taken" ? "In Progress" : label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y">
                  {loading && (
                    <div className="text-center py-12 text-slate-400">
                      <i data-lucide="loader-2" className="w-8 h-8 animate-spin mx-auto mb-2"></i>
                      <p>Loading complaints...</p>
                    </div>
                  )}
                  {!loading && errorMsg && (
                    <div className="text-center py-12 text-red-500">
                      {errorMsg}
                    </div>
                  )}
                  {!loading && !errorMsg && filtered.length === 0 && (
                    <div className="text-center py-12 text-slate-400">No complaints found.</div>
                  )}
                  {!loading && !errorMsg && filtered.map((complaint) => {
                    const status = complaint.status || "Open";
                    return (
                      <div key={complaint._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{complaint.complaintBy || complaint.tenantName || "Tenant"}</p>
                          <p className="text-xs text-gray-500">{complaint.tenantId || complaint.propertyName || complaint.propertyId || "-"}</p>
                          <p className="text-sm text-gray-700 mt-2">{complaint.message || complaint.complaint || complaint.title || "-"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {status}
                          </span>
                          <div className="flex gap-2">
                            {STATUS_ORDER.filter((s) => s !== status).map((nextStatus) => (
                              <button
                                key={nextStatus}
                                disabled={actionId === complaint._id}
                                onClick={() => updateStatus(complaint, nextStatus)}
                                className="text-xs font-medium border border-gray-200 px-3 py-1 rounded hover:bg-gray-50 disabled:opacity-60"
                              >
                                {nextStatus}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}




