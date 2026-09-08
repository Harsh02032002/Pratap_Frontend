import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const normalizeVisit = (visit) => {
  const stableId = visit?.visitId || visit?._id || "";
  return { ...visit, _id: stableId, visitId: visit.visitId || stableId };
};

export default function EnquiryHold() {
  useHtmlPage({
    title: "Roomhy - Enquiries On Hold",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: "/superadmin/assets/css/enquiry-hold.css" }
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

  const held = useMemo(() => visits.filter((v) => v.status === "hold"), [visits]);

  const approveVisit = async (visitId) => {
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
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <a href="/superadmin/enquiry" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-600">
              <i data-lucide="arrow-left" className="w-5 h-5"></i>
            </a>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">On Hold</h1>
              <p className="text-sm text-slate-500">Property visits currently pending additional information or professional photos.</p>
            </div>
          </div>
          <button onClick={loadVisits} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            <i data-lucide="refresh-cw" className="w-4 h-4"></i> Refresh
          </button>
        </div>

        <main className="">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase border-b">
                  <tr>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Hold Reason</th>
                    <th className="px-6 py-4">Prof. Photo Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
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
                  {!loading && !errorMsg && held.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No on-hold visits.</td>
                    </tr>
                  )}
                  {held.map((visit) => {
                    const prop = visit.propertyInfo || {};
                    const profCount = (visit.professionalPhotos || []).length;
                    return (
                      <tr key={visit._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{prop.name || visit.propertyName || "-"}</div>
                          <div className="text-xs text-slate-500">{visit.address || prop.address || "-"}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{visit.holdReason || "On hold"}</td>
                        <td className="px-6 py-4 text-sm">
                          {profCount > 0 ? (
                            <span className="text-blue-600 font-medium">{profCount} photos</span>
                          ) : (
                            <span className="text-amber-600 font-medium italic">Missing</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => approveVisit(visit.visitId || visit._id)}
                            className="text-xs px-3 py-1 rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


