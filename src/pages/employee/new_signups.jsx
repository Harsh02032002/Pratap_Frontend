import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function NewSignups() {
  useHtmlPage({
    title: "Roomhy - New Signups",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic", crossorigin: true },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/superadmin/assets/css/new_signups.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useLegacySidebar();

  const [signups, setSignups] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionId, setActionId] = useState("");

  const loadSignups = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await fetchJson("/api/kyc");
      const list = Array.isArray(data) ? data : data?.data || data?.users || [];
      setSignups(list);
    } catch (err) {
      setErrorMsg(err?.message || "Failed to load signups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignups();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [signups, statusFilter, query]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return signups.filter((signup) => {
      const status = (signup.status || signup.kycStatus || "pending").toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      const name = `${signup.firstName || ""} ${signup.lastName || ""}`.trim().toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        String(signup.email || "").toLowerCase().includes(normalizedQuery) ||
        String(signup.phone || "").toLowerCase().includes(normalizedQuery) ||
        String(signup.id || signup.loginId || "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [signups, statusFilter, query]);

  const stats = useMemo(() => {
    const total = signups.length;
    const pending = signups.filter((s) => (s.status || s.kycStatus || "pending") === "pending").length;
    const verified = signups.filter((s) => (s.status || s.kycStatus) === "verified").length;
    const rejected = signups.filter((s) => (s.status || s.kycStatus) === "rejected").length;
    return { total, pending, verified, rejected };
  }, [signups]);

  const verifySignup = async (signup) => {
    if (!signup?.email) return;
    if (!window.confirm(`Verify account for ${signup.email}?`)) return;
    try {
      setActionId(signup._id || signup.email);
      await fetchJson("/api/kyc/verify", {
        method: "POST",
        body: JSON.stringify({ email: signup.email, status: "verified", kycStatus: "verified" })
      });
      await loadSignups();
    } catch (err) {
      window.alert(err?.message || "Failed to verify signup");
    } finally {
      setActionId("");
    }
  };

  const rejectSignup = async (signup) => {
    if (!signup?._id) return;
    if (!window.confirm(`Reject signup for ${signup.email || signup.id || "this user"}?`)) return;
    try {
      setActionId(signup._id);
      await fetchJson(`/api/kyc/${signup._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "rejected", kycStatus: "rejected" })
      });
      await loadSignups();
    } catch (err) {
      window.alert(err?.message || "Failed to reject signup");
    } finally {
      setActionId("");
    }
  };

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
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

        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center">
              <button id="mobile-menu-open" className="md:hidden mr-4 text-slate-500">
                <i data-lucide="menu" className="w-6 h-6"></i>
              </button>
              <div className="flex items-center text-sm">
                <span className="text-slate-500 font-medium">Management</span>
                <i data-lucide="chevron-right" className="w-4 h-4 mx-2 text-slate-400"></i>
                <span className="text-slate-800 font-semibold">New Signups</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={loadSignups} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-2">
                <i data-lucide="refresh-cw" className="w-4 h-4"></i> Refresh
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">New Signups</h1>
                  <p className="text-sm text-slate-500 mt-1">Review and verify user registrations.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Verified</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.verified}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Rejected</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-t-xl border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="relative w-full md:w-96">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <i data-lucide="search" className="w-4 h-4 text-gray-400 absolute left-3 top-3"></i>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <select
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-b-xl shadow-sm overflow-hidden border border-gray-200 border-t-0">
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Signup ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500 text-sm">Loading signups...</td>
                        </tr>
                      )}
                      {!loading && errorMsg && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-red-500 text-sm">{errorMsg}</td>
                        </tr>
                      )}
                      {!loading && !errorMsg && filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500 text-sm">No signup records found</td>
                        </tr>
                      )}
                      {filtered.map((signup) => {
                        const status = (signup.status || signup.kycStatus || "pending").toLowerCase();
                        const statusColor =
                          status === "verified"
                            ? "bg-green-100 text-green-800"
                            : status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800";
                        const fullName = `${signup.firstName || ""} ${signup.lastName || ""}`.trim() || "-";
                        const id = signup.id || signup.loginId || signup._id || "-";
                        const disabled = actionId === signup._id || actionId === signup.email;
                        return (
                          <tr key={signup._id || signup.email || id}>
                            <td><span className="font-mono text-xs text-gray-700 font-medium">{String(id)}</span></td>
                            <td><span className="text-sm font-medium text-gray-900">{fullName}</span></td>
                            <td><span className="text-sm text-gray-700">{signup.email || "-"}</span></td>
                            <td><span className="text-sm text-gray-700">{signup.phone || "-"}</span></td>
                            <td><span className="text-xs text-gray-500 uppercase">{signup.role || "tenant"}</span></td>
                            <td>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="flex gap-2 justify-end">
                                {status !== "verified" && (
                                  <button
                                    disabled={disabled}
                                    onClick={() => verifySignup(signup)}
                                    className="text-green-600 hover:text-green-800 text-xs font-medium border border-green-200 px-3 py-1 rounded hover:bg-green-50 transition-colors disabled:opacity-60"
                                  >
                                    Verify
                                  </button>
                                )}
                                {status !== "rejected" && status !== "verified" && (
                                  <button
                                    disabled={disabled}
                                    onClick={() => rejectSignup(signup)}
                                    className="text-red-600 hover:text-red-800 text-xs font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-60"
                                  >
                                    Reject
                                  </button>
                                )}
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
          </main>
        </div>

        <div id="mobile-overlay" className="fixed inset-0 bg-black/50 z-30 hidden md:hidden backdrop-blur-sm"></div>
        <aside id="mobile-sidebar" className="fixed inset-y-0 left-0 w-72 bg-[#111827] z-40 transform -translate-x-full transition-transform duration-300 md:hidden flex flex-col">
          <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>
      </div>
    </div>
  );
}




