import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const normalizeVisit = (visit) => {
  const stableId = visit?.visitId || visit?._id || "";
  return { ...visit, _id: stableId, visitId: visit.visitId || stableId };
};

export default function EnquiryApproved() {
  useHtmlPage({
    title: "Roomhy - Approved Visits",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: "/superadmin/assets/css/enquiry-approved.css" }
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

  const approved = useMemo(
    () => visits.filter((v) => v.status === "approved"),
    [visits]
  );

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827]">
            <div className="flex items-center gap-3">
              <div>
                <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
              </div>
            </div>
          </div>
          <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white h-16 shadow-sm flex items-center justify-between px-8 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <a href="/employee/enquiry" className="text-gray-400 hover:text-purple-600 transition-colors">
                <i data-lucide="arrow-left" className="w-5 h-5"></i>
              </a>
              <h1 className="text-xl font-bold text-gray-800">Approved Enquiries</h1>
            </div>
            <button onClick={loadVisits} className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              <i data-lucide="refresh-cw" className="w-3 h-3"></i> Refresh
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1600px] mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left min-w-full">
                  <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase border-b">
                    <tr>
                      <th className="px-6 py-4">Image</th>
                      <th className="px-6 py-4">Property</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Area</th>
                      <th className="px-6 py-4">Rent</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading...</td>
                      </tr>
                    )}
                    {!loading && errorMsg && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-red-500">{errorMsg}</td>
                      </tr>
                    )}
                    {!loading && !errorMsg && approved.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No approved visits found.</td>
                      </tr>
                    )}
                    {approved.map((visit) => {
                      const prop = visit.propertyInfo || {};
                      const image = (visit.professionalPhotos && visit.professionalPhotos[0]) || (visit.photos && visit.photos[0]);
                      return (
                        <tr key={visit._id}>
                          <td className="px-6 py-4">
                            {image ? (
                              <img src={image} alt="Property" className="w-16 h-16 rounded-lg object-cover border" />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Image</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-800">{prop.name || visit.propertyName || "-"}</div>
                            <div className="text-xs text-gray-500">{visit.address || prop.address || "-"}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="text-gray-800">{prop.ownerName || visit.ownerName || "-"}</div>
                            <div className="text-xs text-gray-500">{prop.ownerEmail || visit.ownerEmail || "-"}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">{prop.area || visit.area || "-"}</td>
                          <td className="px-6 py-4 text-sm">₹{visit.monthlyRent || prop.monthlyRent || 0}</td>
                          <td className="px-6 py-4 text-sm text-green-600 font-semibold">Approved</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                if (!visit.latitude || !visit.longitude) return;
                                window.open(`https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`, "_blank");
                              }}
                              className="text-xs px-3 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                              Map
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
    </div>
  );
}




