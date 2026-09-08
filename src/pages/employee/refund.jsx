import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

export default function Refund() {
  useHtmlPage({
    title: "Refund Requests - Roomhy SuperAdmin",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: "/superadmin/assets/css/refund.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadRefunds = async () => {
    try {
      setErrorMsg("");
      const data = await fetchJson("/api/booking/refund-requests");
      setRequests(data?.data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err?.message || "Error loading refunds");
    }
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [requests]);

  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.refund_status === "pending");
    const processed = requests.filter((r) => r.refund_status === "processed" || r.refund_status === "approved");
    const rejected = requests.filter((r) => r.refund_status === "rejected");
    const pendingAmount = pending.reduce((sum, r) => sum + (r.refund_amount || 0), 0);
    const processedAmount = processed.reduce((sum, r) => sum + (r.refund_amount || 0), 0);
    return { pending, processed, rejected, pendingAmount, processedAmount };
  }, [requests]);

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

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white h-16 shadow-sm flex items-center justify-between px-8 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">Refund Requests</h1>
            <button onClick={loadRefunds} className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              <i data-lucide="refresh-cw" className="w-3 h-3"></i> Refresh
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border">
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-2xl font-bold">{stats.pending.length}</div>
                <div className="text-sm text-gray-500">₹{stats.pendingAmount.toLocaleString("en-IN")}</div>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <div className="text-sm text-gray-500">Processed</div>
                <div className="text-2xl font-bold">{stats.processed.length}</div>
                <div className="text-sm text-gray-500">₹{stats.processedAmount.toLocaleString("en-IN")}</div>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <div className="text-sm text-gray-500">Rejected</div>
                <div className="text-2xl font-bold">{stats.rejected.length}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow border overflow-x-auto">
              <table className="w-full text-left min-w-full">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase border-b">
                  <tr>
                    <th className="px-6 py-4">Refund ID</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td>
                    </tr>
                  )}
                  {!loading && errorMsg && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-red-500">{errorMsg}</td>
                    </tr>
                  )}
                  {!loading && !errorMsg && requests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">No refund requests found</td>
                    </tr>
                  )}
                  {requests.map((request) => {
                    const requestDate = request.created_at ? new Date(request.created_at).toLocaleDateString("en-IN") : "-";
                    return (
                      <tr key={request._id}>
                        <td className="px-6 py-4 text-xs font-mono">#{request._id?.slice(0, 8).toUpperCase()}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">{request.user_name || "N/A"}</div>
                          <div className="text-xs text-gray-500">{request.booking_id || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold">₹{request.refund_amount || 500}</td>
                        <td className="px-6 py-4 text-sm">{request.request_type === "refund" ? "Refund" : "Alternative"}</td>
                        <td className="px-6 py-4 text-sm">{(request.refund_method || "N/A").toUpperCase()}</td>
                        <td className="px-6 py-4 text-sm">{requestDate}</td>
                        <td className="px-6 py-4 text-sm font-semibold">{request.refund_status || "pending"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}




