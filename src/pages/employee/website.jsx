import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

export default function Website() {
  useHtmlPage({
    title: "Roomhy - Website Properties",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "referrer", content: "no-referrer-when-downgrade" }
    ],
    links: [
      { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: "/superadmin/assets/css/website.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [filter, setFilter] = useState("online");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadWebsite = async () => {
    try {
      setErrorMsg("");
      const data = await fetchJson("/api/approved-properties/public/approved");
      const list = Array.isArray(data) ? data : (data.properties || data.visits || []);
      setProperties(list);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err?.message || "Error loading properties");
    }
  };

  useEffect(() => {
    loadWebsite();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [properties, filter]);

  const filtered = useMemo(() => {
    return properties.filter((v) =>
      filter === "online" ? v.isLiveOnWebsite === true : v.isLiveOnWebsite === false
    );
  }, [properties, filter]);

  const toggleLive = async (propertyId) => {
    try {
      await fetchJson(`/api/approved-properties/${propertyId}/toggle-live`, { method: "PUT" });
      await loadWebsite();
    } catch (err) {
      window.alert(err?.message || "Failed to toggle status");
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
            <h2 className="text-lg font-semibold text-slate-800">Website Properties</h2>
            <button onClick={loadWebsite} className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              <i data-lucide="refresh-cw" className="w-3 h-3"></i> Refresh
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter("online")}
                className={`px-4 py-2 rounded ${filter === "online" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Online
              </button>
              <button
                onClick={() => setFilter("offline")}
                className={`px-4 py-2 rounded ${filter === "offline" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Offline
              </button>
            </div>

            <div className="bg-white rounded-xl shadow border overflow-x-auto">
              <table className="w-full text-left min-w-full">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase border-b">
                  <tr>
                    <th className="px-4 py-3">Visit ID</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Area</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Rent</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
                  )}
                  {!loading && errorMsg && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-red-500">{errorMsg}</td></tr>
                  )}
                  {!loading && !errorMsg && filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No properties found.</td></tr>
                  )}
                  {filtered.map((v) => {
                    const prop = v.propertyInfo || {};
                    const visitId = v.visitId || v._id || "";
                    const rent = prop.rent || v.monthlyRent || 0;
                    return (
                      <tr key={visitId}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{visitId.slice(-8).toUpperCase()}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{prop.name || "-"}</td>
                        <td className="px-4 py-3">{prop.area || "-"}</td>
                        <td className="px-4 py-3">{prop.ownerName || "-"}</td>
                        <td className="px-4 py-3 font-bold">₹{rent}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleLive(v.propertyId || visitId)}
                            className={`px-3 py-1 rounded text-xs font-medium ${v.isLiveOnWebsite ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                          >
                            {v.isLiveOnWebsite ? "ONLINE" : "OFFLINE"}
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




