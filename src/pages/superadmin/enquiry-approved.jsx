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
    <div className="p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <a href="/superadmin/enquiry" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-600">
              <i data-lucide="arrow-left" className="w-5 h-5"></i>
            </a>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Approved Enquiries</h1>
              <p className="text-sm text-slate-500">View all properties that have been successfully reviewed and approved.</p>
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
                      <tr key={visit._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          {image ? (
                            <img src={image} alt="Property" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 border border-dashed border-gray-300 uppercase">No Image</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{prop.name || visit.propertyName || "-"}</div>
                          <div className="text-xs text-slate-500">{visit.address || prop.address || "-"}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-slate-800 font-medium">{prop.ownerName || visit.ownerName || "-"}</div>
                          <div className="text-xs text-slate-500">{prop.ownerEmail || visit.ownerEmail || "-"}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{prop.area || visit.area || "-"}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">₹{visit.monthlyRent || prop.monthlyRent || 0}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              if (!visit.latitude || !visit.longitude) return;
                              window.open(`https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`, "_blank");
                            }}
                            className="text-xs px-3 py-1 rounded border border-gray-200 bg-white text-slate-600 hover:bg-gray-50 transition-colors font-medium shadow-sm"
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
  );
}


