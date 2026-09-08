import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function WebsiteDb() {
  useHtmlPage({
    title: "Roomhy - Website Properties",
    bodyClass: "text-slate-800",
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
      { rel: "stylesheet", href: "/superadmin/assets/css/website-db.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useLegacySidebar();

  const [filter, setFilter] = useState("online");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [gallery, setGallery] = useState([]);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const loadWebsite = async () => {
    try {
      setErrorMsg("");
      setLoading(true);
      const data = await fetchJson("/api/approved-properties/public/approved");
      const list = Array.isArray(data) ? data : (data.properties || data.visits || []);
      setProperties(list);
    } catch (err) {
      setErrorMsg(err?.message || "Error loading properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebsite();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [properties, filter, galleryOpen]);

  const filtered = useMemo(() => {
    return properties.filter((v) =>
      filter === "online" ? v.isLiveOnWebsite === true : v.isLiveOnWebsite === false
    );
  }, [properties, filter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const withPhotos = filtered.filter((v) => (v.propertyInfo?.photos || v.photos || []).length > 0).length;
    const withoutPhotos = total - withPhotos;
    return { total, withPhotos, withoutPhotos };
  }, [filtered]);

  const toggleLive = async (propertyId) => {
    try {
      await fetchJson(`/api/approved-properties/${propertyId}/toggle-live`, { method: "PUT" });
      await loadWebsite();
    } catch (err) {
      window.alert(err?.message || "Failed to toggle status");
    }
  };

  const openGallery = (photos) => {
    const list = Array.isArray(photos) ? photos : [];
    setGallery(list);
    setGalleryOpen(true);
  };

  const exportToCsv = () => {
    const rows = filtered.map((v) => {
      const prop = v.propertyInfo || {};
      return {
        id: v.visitId || v._id || "",
        name: prop.name || "",
        type: prop.type || "",
        area: prop.area || "",
        owner: prop.ownerName || "",
        contact: prop.ownerPhone || "",
        rent: prop.rent || v.monthlyRent || "",
        status: v.isLiveOnWebsite ? "ONLINE" : "OFFLINE"
      };
    });
    const headers = ["id", "name", "type", "area", "owner", "contact", "rent", "status"];
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(",")
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "website-properties.csv";
    link.click();
    URL.revokeObjectURL(link.href);
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
          <header className="bg-white h-16 flex items-center justify-between px-8 shadow-sm z-10 border-b border-gray-200">
            <div className="flex items-center">
              <button id="mobile-menu-open" className="md:hidden mr-4 text-slate-500"><i data-lucide="menu" className="w-6 h-6"></i></button>
              <h1 className="text-xl font-bold text-gray-800">Website Properties</h1>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={loadWebsite} className="text-sm text-purple-600 hover:underline flex items-center gap-1"><i data-lucide="refresh-cw" className="w-3 h-3"></i> Refresh</button>
              <button onClick={exportToCsv} className="text-sm text-gray-600 hover:underline flex items-center gap-1"><i data-lucide="download" className="w-3 h-3"></i> Export</button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setFilter("online")} className={`px-3 py-2 rounded ${filter === "online" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700"}`}>Online</button>
                <button onClick={() => setFilter("offline")} className={`px-3 py-2 rounded ${filter === "offline" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700"}`}>Offline</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Properties</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</h3>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">With Photos</p>
                  <h3 className="text-3xl font-bold text-green-600 mt-1">{stats.withPhotos}</h3>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Without Photos</p>
                  <h3 className="text-3xl font-bold text-orange-600 mt-1">{stats.withoutPhotos}</h3>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase border-b">
                      <tr>
                        <th className="px-4 py-3">Property ID</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Property Name</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Area</th>
                        <th className="px-4 py-3">Owner</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Rent</th>
                        <th className="px-4 py-3">Photos</th>
                        <th className="px-4 py-3">Web Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading && (
                        <tr><td colSpan={11} className="px-6 py-12 text-center text-gray-400">Loading properties...</td></tr>
                      )}
                      {!loading && errorMsg && (
                        <tr><td colSpan={11} className="px-6 py-12 text-center text-red-500">{errorMsg}</td></tr>
                      )}
                      {!loading && !errorMsg && filtered.length === 0 && (
                        <tr><td colSpan={11} className="px-6 py-12 text-center text-gray-400">No properties found.</td></tr>
                      )}
                      {filtered.map((v) => {
                        const prop = v.propertyInfo || {};
                        const photos = prop.photos || v.photos || [];
                        const visitId = v.visitId || v._id || "";
                        const rent = prop.rent || v.monthlyRent || 0;
                        return (
                          <tr key={visitId}>
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">{visitId.slice(-8).toUpperCase()}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">{(v.approvedAt || v.createdAt || "").toString().slice(0, 10) || "-"}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{prop.name || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{prop.type || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{prop.area || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{prop.ownerName || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{prop.ownerPhone || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">₹{rent}</td>
                            <td className="px-4 py-3">
                              {photos.length > 0 ? (
                                <button onClick={() => openGallery(photos)} className="text-purple-600 hover:underline text-xs">
                                  {photos.length} Photos
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">None</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v.isLiveOnWebsite ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                                {v.isLiveOnWebsite ? "ONLINE" : "OFFLINE"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleLive(v.propertyId || visitId)}
                                className="text-xs font-medium border border-gray-200 px-3 py-1 rounded hover:bg-gray-50"
                              >
                                Toggle
                              </button>
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
      </div>

      {galleryOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]" onClick={() => setGalleryOpen(false)}>
          <div className="relative w-full max-w-4xl p-4" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setGalleryOpen(false)} className="absolute -top-10 right-0 text-white">
              <i data-lucide="x" className="w-8 h-8"></i>
            </button>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto p-4 bg-black/20 rounded-lg">
              {gallery.map((src, idx) => (
                <img key={idx} src={src} alt={`Photo ${idx + 1}`} className="rounded-md object-cover" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




