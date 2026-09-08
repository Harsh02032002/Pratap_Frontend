import React, { useEffect, useMemo, useState } from "react";
import { fetchJson, getApiBase } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { requireOwnerSession } from "../../utils/ownerSession";
import { MapPin, Plus, Search, Check, X, Trash2 } from "lucide-react";

// area.city can be a populated City object or a plain string
const cityName = (area) => {
  if (!area?.city) return "-";
  if (typeof area.city === "string") return area.city;
  return area.city?.name || area.city?.city || "-";
};

export default function Location() {
  useHtmlPage({
    title: "Roomhy - Serviceable Locations",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic", crossOrigin: "true" },
      {
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap",
        rel: "stylesheet"
      }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }]
  });

  const [owner, setOwner]           = useState(null);
  const [cities, setCities]         = useState([]);
  const [areas, setAreas]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [errorMsg, setErrorMsg]     = useState("");
  const [activeTab, setActiveTab]   = useState("cities");
  const [cityForm, setCityForm]     = useState({ name: "", state: "" });
  const [areaForm, setAreaForm]     = useState({ name: "", city: "", pincode: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting]     = useState(null); // id being deleted

  useEffect(() => {
    const session = requireOwnerSession();
    if (!session) return;
    setOwner(session);
    (async () => {
      try {
        const [citiesRes, areasRes] = await Promise.all([
          fetchJson("/api/locations/cities"),
          fetchJson("/api/locations/areas")
        ]);
        setCities(Array.isArray(citiesRes?.data) ? citiesRes.data : Array.isArray(citiesRes) ? citiesRes : []);
        setAreas(Array.isArray(areasRes?.data) ? areasRes.data : Array.isArray(areasRes) ? areasRes : []);
      } catch (err) {
        setErrorMsg(err?.message || "Failed to load locations.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const citiesOptions = useMemo(() => cities.map((c) => c.name || c.city || ""), [cities]);

  const createCity = async (e) => {
    e.preventDefault();
    if (!cityForm.name || !cityForm.state) { setErrorMsg("Please fill in both city name and state."); return; }
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("name", cityForm.name);
      formData.append("state", cityForm.state);
      const res = await fetch(`${getApiBase()}/api/locations/cities`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      setCities((prev) => [...prev, result?.data || result]);
      setCityForm({ name: "", state: "" });
    } catch (err) {
      setErrorMsg(err?.message || "Failed to create city.");
    }
  };

  const createArea = async (e) => {
    e.preventDefault();
    if (!areaForm.name || !areaForm.city || !areaForm.pincode) {
      setErrorMsg("Please fill in area name, select city and enter pincode.");
      return;
    }
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("name", areaForm.name);
      formData.append("city", areaForm.city);
      formData.append("pincode", areaForm.pincode);
      const res = await fetch(`${getApiBase()}/api/locations/areas`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      setAreas((prev) => [...prev, result?.data || result]);
      setAreaForm({ name: "", city: "", pincode: "" });
    } catch (err) {
      setErrorMsg(err?.message || "Failed to create area.");
    }
  };

  const handleDeleteCity = async (city) => {
    if (!city._id) return;
    if (!window.confirm(`Delete "${city.name || city.city}"? This will also remove all its areas.`)) return;
    setDeleting(city._id);
    try {
      const res = await fetch(`${getApiBase()}/api/locations/cities/${city._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      const deletedName = city.name || city.city || "";
      setCities((prev) => prev.filter((c) => c._id !== city._id));
      // Remove areas belonging to this city too
      setAreas((prev) => prev.filter((a) => cityName(a).toLowerCase() !== deletedName.toLowerCase()));
    } catch (err) {
      setErrorMsg(err?.message || "Failed to delete city.");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteArea = async (area) => {
    if (!area._id) return;
    if (!window.confirm(`Delete area "${area.name}"?`)) return;
    setDeleting(area._id);
    try {
      const res = await fetch(`${getApiBase()}/api/locations/areas/${area._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setAreas((prev) => prev.filter((a) => a._id !== area._id));
    } catch (err) {
      setErrorMsg(err?.message || "Failed to delete area.");
    } finally {
      setDeleting(null);
    }
  };

  const filteredCities = useMemo(() =>
    cities.filter((c) =>
      (c.name || c.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.state || "").toLowerCase().includes(searchQuery.toLowerCase())
    ), [cities, searchQuery]);

  const filteredAreas = useMemo(() =>
    areas.filter((a) =>
      (a.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      cityName(a).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.pincode || "").toLowerCase().includes(searchQuery.toLowerCase())
    ), [areas, searchQuery]);

  return (
    <PropertyOwnerLayout owner={owner} title="Serviceable Locations" onLogout={() => { window.location.href = "/propertyowner/ownerlogin"; }}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Serviceable locations</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Manage cities and areas where Roomhy is available.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="text-sm text-destructive mb-4 bg-destructive/10 px-4 py-3 rounded-lg flex items-center gap-2 border border-destructive/20">
          <X className="size-4 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="ml-auto shrink-0 opacity-60 hover:opacity-100">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50">
          <button
            type="button"
            className={`h-9 px-4 rounded-lg text-[12.5px] font-bold transition-all ${
              activeTab === "cities" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setActiveTab("cities"); setSearchQuery(""); }}
          >
            Cities
          </button>
          <button
            type="button"
            className={`h-9 px-4 rounded-lg text-[12.5px] font-bold transition-all ${
              activeTab === "areas" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setActiveTab("areas"); setSearchQuery(""); }}
          >
            Areas
          </button>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 shadow-soft flex flex-col items-center justify-center text-center animate-pulse">
          <div className="w-12 h-12 bg-muted rounded-full mb-3" />
          <div className="h-5 bg-muted rounded w-36 mb-2" />
          <div className="h-3 bg-muted rounded w-48" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="text-base font-bold text-foreground mb-4">
                {activeTab === "cities" ? "Add Serviceable City" : "Add Serviceable Area"}
              </h3>

              {activeTab === "cities" ? (
                <form onSubmit={createCity} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">City Name</label>
                    <input
                      value={cityForm.name}
                      onChange={(e) => setCityForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Indore"
                      className="w-full p-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">State Name</label>
                    <input
                      value={cityForm.state}
                      onChange={(e) => setCityForm((p) => ({ ...p, state: e.target.value }))}
                      placeholder="e.g. Madhya Pradesh"
                      className="w-full p-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-10 bg-foreground text-background text-xs font-bold rounded-lg uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <Plus className="size-4" /> Add City
                  </button>
                </form>
              ) : (
                <form onSubmit={createArea} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Area / Locality Name</label>
                    <input
                      value={areaForm.name}
                      onChange={(e) => setAreaForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Vijay Nagar"
                      className="w-full p-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">City</label>
                    <select
                      value={areaForm.city}
                      onChange={(e) => setAreaForm((p) => ({ ...p, city: e.target.value }))}
                      className="w-full p-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Serviceable City</option>
                      {citiesOptions.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Pincode</label>
                    <input
                      type="text"
                      value={areaForm.pincode}
                      onChange={(e) => setAreaForm((p) => ({ ...p, pincode: e.target.value }))}
                      placeholder="e.g. 452010"
                      className="w-full p-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-10 bg-foreground text-background text-xs font-bold rounded-lg uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <Plus className="size-4" /> Add Area
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* List Column */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
              <div className="overflow-x-auto">
                {activeTab === "cities" ? (
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="p-4 font-bold text-[12px] uppercase text-muted-foreground tracking-wider">City Name</th>
                        <th className="p-4 font-bold text-[12px] uppercase text-muted-foreground tracking-wider">State</th>
                        <th className="p-4 font-bold text-[12px] uppercase text-muted-foreground tracking-wider">Status</th>
                        <th className="p-4 font-bold text-[12px] uppercase text-muted-foreground tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredCities.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground font-medium">
                            No cities match your search.
                          </td>
                        </tr>
                      ) : (
                        filteredCities.map((city, idx) => (
                          <tr key={city._id || idx} className="hover:bg-muted/15 transition-colors">
                            <td className="p-4 font-bold text-foreground">{city.name || city.city || "-"}</td>
                            <td className="p-4 font-medium text-muted-foreground">{city.state || "-"}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 bg-success/10 text-success-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-success/20">
                                <Check className="size-3" /> Active
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteCity(city)}
                                disabled={deleting === city._id}
                                title="Delete city and all its areas"
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                <Trash2 className="size-3.5" />
                                {deleting === city._id ? "Deleting..." : "Delete"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="p-4 font-bold text-[12px] uppercase text-muted-foreground tracking-wider">Area / Locality</th>
                        <th className="p-4 font-bold text-[12px] uppercase text-muted-foreground tracking-wider">City</th>
                        <th className="p-4 font-bold text-[12px] uppercase text-muted-foreground tracking-wider">Pincode</th>
                        <th className="p-4 font-bold text-[12px] uppercase text-muted-foreground tracking-wider">Status</th>
                        <th className="p-4 font-bold text-[12px] uppercase text-muted-foreground tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredAreas.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground font-medium">
                            No areas match your search.
                          </td>
                        </tr>
                      ) : (
                        filteredAreas.map((area, idx) => (
                          <tr key={area._id || idx} className="hover:bg-muted/15 transition-colors">
                            <td className="p-4 font-bold text-foreground">{area.name || "-"}</td>
                            <td className="p-4 font-medium text-muted-foreground">{cityName(area)}</td>
                            <td className="p-4 font-medium text-slate-500 font-mono">{area.pincode || "-"}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 bg-success/10 text-success-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-success/20">
                                <Check className="size-3" /> Active
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteArea(area)}
                                disabled={deleting === area._id}
                                title="Delete this area"
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                <Trash2 className="size-3.5" />
                                {deleting === area._id ? "Deleting..." : "Delete"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
