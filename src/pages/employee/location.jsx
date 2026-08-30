import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { getApiBase, getAuthHeader } from "../../utils/api";
import { useLegacySidebar } from "../../utils/legacyUi";
import { compressImage } from "../../utils/imageCompression";

export default function Location() {
  useHtmlPage({
    title: "Roomhy - Locations",
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
      { rel: "stylesheet", href: "/superadmin/assets/css/location.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useLegacySidebar();

  const [tab, setTab] = useState("cities");
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("city");
  const [name, setName] = useState("");
  const [stateName, setStateName] = useState("");
  const [cityId, setCityId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const apiBase = getApiBase();

  const loadLocations = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [citiesRes, areasRes] = await Promise.all([
        fetch(`${apiBase}/api/locations/cities`, { headers: { ...getAuthHeader() } }),
        fetch(`${apiBase}/api/locations/areas`, { headers: { ...getAuthHeader() } })
      ]);
      if (!citiesRes.ok || !areasRes.ok) throw new Error("Failed to fetch locations");
      const citiesData = await citiesRes.json();
      const areasData = await areasRes.json();
      setCities(citiesData?.data || []);
      setAreas(areasData?.data || []);
    } catch (err) {
      setErrorMsg(err?.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [tab, cities, areas, modalOpen]);

  const openModal = (type) => {
    setModalType(type);
    setName("");
    setStateName("");
    setCityId("");
    setImageFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (modalType === "city" && !stateName.trim()) return;
    if (modalType === "area" && !cityId) return;
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", name.trim());
      if (modalType === "city") {
        formData.append("state", stateName.trim());
      } else {
        formData.append("cityId", cityId);
      }
      if (imageFile) {
        // Resize/compress before upload — camera originals are 3-12MB.
        formData.append("image", await compressImage(imageFile));
      }
      const endpoint = modalType === "city" ? "/api/locations/cities" : "/api/locations/areas";
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { ...getAuthHeader() },
        body: formData
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save");
      }
      await loadLocations();
      closeModal();
    } catch (err) {
      window.alert(err?.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const deleteLocation = async (type, id) => {
    if (!window.confirm("Delete this location?")) return;
    try {
      const response = await fetch(`${apiBase}/api/locations/${type}/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to delete");
      }
      await loadLocations();
    } catch (err) {
      window.alert(err?.message || "Failed to delete location");
    }
  };

  const cityOptions = useMemo(() => cities.map((city) => ({ id: city._id, name: city.name })), [cities]);

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
              <button id="mobile-menu-open" className="md:hidden mr-4 text-slate-500"><i data-lucide="menu" className="w-6 h-6"></i></button>
              <div className="flex items-center text-sm">
                <span className="text-slate-500 font-medium">System</span>
                <i data-lucide="chevron-right" className="w-4 h-4 mx-2 text-slate-400"></i>
                <span className="text-slate-800 font-semibold">Locations</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={loadLocations} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-2">
                <i data-lucide="refresh-cw" className="w-4 h-4"></i> Refresh
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Serviceable Locations</h1>
                  <p className="text-sm text-slate-500 mt-1">Manage Cities and Areas separately.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal("city")} className="bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center shadow-sm transition-all">
                    <i data-lucide="map" className="w-4 h-4 mr-2"></i> Add City
                  </button>
                  <button onClick={() => openModal("area")} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center shadow-md transition-all hover:shadow-lg">
                    <i data-lucide="map-pin" className="w-4 h-4 mr-2"></i> Add Area
                  </button>
                </div>
              </div>

              <div className="mb-6 flex space-x-3">
                <button className={`filter-tab ${tab === "cities" ? "active" : ""}`} onClick={() => setTab("cities")}>Cities</button>
                <button className={`filter-tab ${tab === "areas" ? "active" : ""}`} onClick={() => setTab("areas")}>Areas</button>
              </div>

              {errorMsg && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-2">{errorMsg}</div>
              )}

              {loading && (
                <div className="text-center py-12 text-slate-400">Loading locations...</div>
              )}

              {!loading && tab === "cities" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full data-table">
                      <thead>
                        <tr>
                          <th>City Name</th>
                          <th>State</th>
                          <th>Image</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cities.length === 0 && (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">No cities found</td></tr>
                        )}
                        {cities.map((city) => (
                          <tr key={city._id}>
                            <td className="text-sm font-medium text-gray-900">{city.name}</td>
                            <td className="text-sm text-gray-700">{city.state}</td>
                            <td>
                              {city.imageUrl ? <img src={city.imageUrl} alt={city.name} className="h-10 w-16 object-cover rounded" /> : "-"}
                            </td>
                            <td>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {city.status || "Active"}
                              </span>
                            </td>
                            <td className="text-right">
                              <button onClick={() => deleteLocation("cities", city._id)} className="text-red-600 hover:text-red-800 text-xs font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!loading && tab === "areas" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full data-table">
                      <thead>
                        <tr>
                          <th>Area Name</th>
                          <th>City</th>
                          <th>Image</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {areas.length === 0 && (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">No areas found</td></tr>
                        )}
                        {areas.map((area) => (
                          <tr key={area._id}>
                            <td className="text-sm font-medium text-gray-900">{area.name}</td>
                            <td className="text-sm text-gray-700">{area.cityName || area.city?.name || "-"}</td>
                            <td>
                              {area.imageUrl ? <img src={area.imageUrl} alt={area.name} className="h-10 w-16 object-cover rounded" /> : "-"}
                            </td>
                            <td>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {area.status || "Active"}
                              </span>
                            </td>
                            <td className="text-right">
                              <button onClick={() => deleteLocation("areas", area._id)} className="text-red-600 hover:text-red-800 text-xs font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {modalOpen && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {modalType === "city" ? "Add City" : "Add Area"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <i data-lucide="x" className="w-5 h-5"></i>
              </button>
            </div>
            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  required
                />
              </div>
              {modalType === "city" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(event) => setStateName(event.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                </div>
              )}
              {modalType === "area" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent City</label>
                  <select
                    value={cityId}
                    onChange={(event) => setCityId(event.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a city</option>
                    {cityOptions.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end pt-2 border-t">
                <button type="button" onClick={closeModal} className="mr-3 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-60">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




