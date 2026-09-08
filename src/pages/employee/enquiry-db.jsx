import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const normalizeVisit = (visit) => {
  const stableId = visit?.visitId || visit?._id || "";
  return { ...visit, _id: stableId, visitId: visit.visitId || stableId };
};

export default function EnquiryDb() {
  useHtmlPage({
    title: "Admin Enquiry - Approve Properties",
    bodyClass: "bg-gray-50",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/superadmin/assets/css/enquiry-db.css" }],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [visits, setVisits] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selected, setSelected] = useState(null);

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
  }, [visits, selected]);

  const filtered = useMemo(() => {
    if (filter === "all") return visits;
    return visits.filter((v) => v.status === filter);
  }, [visits, filter]);

  const approveVisit = async (visitId) => {
    try {
      await fetchJson("/api/visits/approve", {
        method: "POST",
        body: JSON.stringify({ visitId, status: "approved", isLiveOnWebsite: false })
      });
      await loadVisits();
      setSelected(null);
    } catch (err) {
      window.alert(err?.message || "Approve failed");
    }
  };

  const holdVisit = async (visitId) => {
    const reason = window.prompt("Enter hold reason:");
    if (reason === null) return;
    try {
      await fetchJson("/api/visits/hold", {
        method: "POST",
        body: JSON.stringify({ visitId, holdReason: reason })
      });
      await loadVisits();
      setSelected(null);
    } catch (err) {
      window.alert(err?.message || "Hold failed");
    }
  };

  const rejectVisit = async (visitId) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await fetchJson(`/api/visits/${encodeURIComponent(visitId)}/reject`, {
        method: "POST",
        body: JSON.stringify({ approvalNotes: reason, approvedBy: "superadmin" })
      });
      await loadVisits();
      setSelected(null);
    } catch (err) {
      window.alert(err?.message || "Reject failed");
    }
  };

  return (
    <div className="html-page">
      <div className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Enquiry Management</h1>
          <p className="text-gray-600">Review and approve property submissions</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setFilter("all")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              All Visits
            </button>
            <button onClick={() => setFilter("submitted")} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
              Pending
            </button>
            <button onClick={() => setFilter("approved")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Approved
            </button>
            <button onClick={() => setFilter("rejected")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Rejected
            </button>
            <button onClick={loadVisits} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 ml-auto">
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading && <div className="text-center py-8 text-gray-500">Loading visits...</div>}
          {!loading && errorMsg && <div className="text-center py-8 text-red-500">{errorMsg}</div>}
          {!loading && !errorMsg && filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500">No visits found.</div>
          )}
          {filtered.map((visit) => {
            const prop = visit.propertyInfo || {};
            const image = (visit.professionalPhotos && visit.professionalPhotos[0]) || (visit.photos && visit.photos[0]);
            return (
              <div key={visit._id} className="bg-white rounded-lg shadow-md p-4 border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-40">
                  {image ? (
                    <img src={image} alt="Property" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-32 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{prop.name || visit.propertyName || "Property"}</h3>
                  <p className="text-sm text-gray-600">{visit.address || prop.address || "-"}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    Status: <span className="font-semibold">{visit.status || "submitted"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(visit)} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
                    View
                  </button>
                  <button onClick={() => approveVisit(visit.visitId || visit._id)} className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                    Approve
                  </button>
                  <button onClick={() => holdVisit(visit.visitId || visit._id)} className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                    Hold
                  </button>
                  <button onClick={() => rejectVisit(visit.visitId || visit._id)} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Visit Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                Close
              </button>
            </div>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
{JSON.stringify(selected, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}




