import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const normalizeVisit = (visit) => {
  const stableId = visit?.visitId || visit?._id || "";
  return { ...visit, _id: stableId, visitId: visit.visitId || stableId };
};

export default function EnquiryRejected() {
  useHtmlPage({
    title: "Roomhy - Rejected Enquiries",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: "/superadmin/assets/css/enquiry-rejected.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadVisits = async () => {
    try {
      setErrorMsg("");
      const data = await fetchJson("/api/visits");
      const list = (data?.visits || data || []).map(normalizeVisit);
      setVisits(list);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err?.message || "Failed to load visits");
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [visits]);

  const rejected = useMemo(() => visits.filter((v) => v.status === "rejected"), [visits]);

  const reApprove = async (visitId) => {
    try {
      await fetchJson("/api/visits/approve", {
        method: "POST",
        body: JSON.stringify({ visitId, status: "approved", isLiveOnWebsite: false })
      });
      await loadVisits();
    } catch (err) {
      window.alert(err?.message || "Approve failed");
    }
  };

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className="sidebar bg-[#111827] w-72 flex-shrink-0 hidden md:flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827]">
            <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
          </div>
          <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="bg-white h-16 shadow-sm flex items-center px-8 border-b border-gray-200">
            <a href="/employee/enquiry" className="mr-4 text-gray-400 hover:text-purple-600 transition-colors">
              <i data-lucide="arrow-left" className="w-5 h-5"></i>
            </a>
            <h1 className="text-xl font-bold text-gray-800">Rejected Visits</h1>
            <button onClick={loadVisits} className="ml-auto text-sm text-purple-600 hover:underline flex items-center gap-1">
              <i data-lucide="refresh-cw" className="w-3 h-3"></i> Refresh
            </button>
          </header>
          <main className="flex-1 p-8">
            <div className="bg-white rounded-xl shadow border overflow-x-auto">
              <table className="w-full text-left min-w-full">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase border-b">
                  <tr>
                    <th className="px-6 py-4">Property Name</th>
                    <th className="px-6 py-4">Rejection Reason</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Loading...</td>
                    </tr>
                  )}
                  {!loading && errorMsg && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-red-500">{errorMsg}</td>
                    </tr>
                  )}
                  {!loading && !errorMsg && rejected.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No rejected visits.</td>
                    </tr>
                  )}
                  {rejected.map((visit) => {
                    const prop = visit.propertyInfo || {};
                    return (
                      <tr key={visit._id}>
                        <td className="px-6 py-4">{prop.name || visit.propertyName || "-"}</td>
                        <td className="px-6 py-4 text-sm">{visit.approvalNotes || visit.rejectionReason || "Rejected"}</td>
                        <td className="px-6 py-4 text-center text-red-600 font-semibold">Rejected</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => reApprove(visit.visitId || visit._id)}
                            className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Re-Approve
                          </button>
                        </td>
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




