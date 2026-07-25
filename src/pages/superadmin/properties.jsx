import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  Pencil, Phone, Mail, User, Image as ImageIcon, ChevronRight,
  Activity, Home, CheckCircle2, XCircle, RefreshCw, Layers, Plus, UploadCloud, Loader2,
  Eye, AlertCircle, ChevronDown, ChevronUp, BadgeCheck, Ban
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getApiBase, getAuthHeader } from "../../utils/api";
import LocationMapPicker from "../../components/website/LocationMapPicker";
import WebsitePropertyPreviewModal from "../../components/shared/WebsitePropertyPreviewModal";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getIconComponent = (iconName) => {
  const iconKey = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-./g, x => x[1].toUpperCase());
  return LucideIcons[iconKey] || LucideIcons.Circle;
};

const iconOptions = [
  { value: "wifi", label: "WiFi" },
  { value: "car", label: "Parking" },
  { value: "dumbbell", label: "Gym" },
  { value: "waves", label: "Swimming Pool" },
  { value: "wind", label: "Air Conditioning" },
  { value: "tv", label: "Television" },
  { value: "coffee", label: "Kitchen" },
  { value: "shield", label: "Security" },
  { value: "zap", label: "Power Backup" },
  { value: "bed", label: "Bed" },
  { value: "bath", label: "Bathroom" },
  { value: "washing-machine", label: "Laundry" },
  { value: "refrigerator", label: "Fridge" },
  { value: "armchair", label: "Furniture" },
  { value: "lock", label: "Lock" },
  { value: "camera", label: "CCTV" },
  { value: "tree-deciduous", label: "Garden" },
  { value: "users", label: "Common Area" },
  { value: "utensils", label: "Mess" },
  { value: "bus", label: "Transport" },
];

export default function SuperadminProperties() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const view = query.get("view") || "list";
  const editId = query.get("editId") || null;

  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [viewProperty, setViewProperty] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [previewProperty, setPreviewProperty] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const getApiUrl = getApiBase;

  const fetchPropertyDetail = async (id) => {
    try {
      setViewLoading(true);
      const res = await fetch(`${getApiUrl()}/api/properties/${id}`);
      const data = await res.json();
      if (data.success && data.property) {
        setViewProperty(data.property);
      } else {
        toast.error("Failed to load property details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading property");
    } finally {
      setViewLoading(false);
    }
  };

  const fetchProperties = async (pNum = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiUrl()}/api/properties?page=${pNum}&limit=100&t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.properties) {
          setProperties(data.properties.map(p => ({
            id: p._id,
            title: p.title || p.propertyInfo?.name || p.propertyName || "Property",
            locationCode: p.locationCode || p.visitId || "-",
            city: p.propertyInfo?.city || p.city || "-",
            address: p.propertyInfo?.address || p.address || "-",
            ownerName: p.owner?.name || p.propertyInfo?.ownerName || p.ownerName || "-",
            ownerLoginId: p.ownerLoginId || p.generatedCredentials?.loginId || "-",
            status: p.isLiveOnWebsite ? "Active" : p.status === "inactive" ? "Pending" : "Inactive",
            views: p.views || 0,
            clicks: p.clicks || 0,
            image: p.featuredImage || (p.images && p.images[0]) || ""
          })));
          setTotalPages(data.totalPages || 1);
          setTotalRecords(data.total || 0);
          setPage(data.page || 1);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/properties/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Property deleted successfully");
        fetchProperties();
      } else {
        toast.error(data.message || "Failed to delete property");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting property");
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [properties, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = properties.length;
    const active = properties.filter(p => p.status === "Active").length;
    const pending = properties.filter(p => p.status === "Pending").length;
    return { total, active, pending, inactive: total - active - pending, views: properties.reduce((a, b) => a + b.views, 0) };
  }, [properties]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning Inventory Ledger...</p>
      </div>
    );
  }

  const listView = (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Property List</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage platform properties and listings</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative group w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
               <input 
                 value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                 placeholder="Search properties, owners..." 
                 className="w-full bg-white border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
               />
            </div>
            <button onClick={() => navigate("?view=add")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-blue-200/10 hover:bg-blue-700 transition-all flex items-center gap-2">
               <Plus className="w-3.5 h-3.5" /> Add Property
            </button>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-200/10 hover:bg-emerald-700 transition-all flex items-center gap-2">
               <Sheet className="w-3.5 h-3.5" /> Export
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <StatCardHorizontal icon={Building2} label="Total Properties" value={stats.total} trend="+12.5% Delta" up color="blue" />
        <StatCardHorizontal icon={CheckCircle2} label="Live on Web" value={stats.active} trend="Active Flow" up color="emerald" />
        <StatCardHorizontal icon={Clock} label="Pending Approval" value={stats.pending} trend="Waiting Sync" up color="amber" />
        <StatCardHorizontal icon={Activity} label="Total Views" value={stats.views.toLocaleString()} trend="+25.4% Yield" up color="indigo" />
        <StatCardHorizontal icon={Zap} label="Avg Occupancy" value="84%" trend="Market Lead" up color="blue" />
      </div>

      {/* Main Ledger */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Property List</h3>
            <div className="flex items-center gap-3">
               <select 
                 value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                 className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-[9px] font-bold text-slate-500 outline-none hover:bg-slate-100 transition-all cursor-pointer"
               >
                  <option value="all">All Properties</option>
                  <option value="Active">Live on Website</option>
                  <option value="Pending">Pending Approval</option>
                  <option value="Inactive">Offline / Draft</option>
               </select>
               <button className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
                  <Filter className="w-4 h-4" />
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                     <th className="pb-4">Property Details</th>
                     <th className="pb-4">Owner Details</th>
                     <th className="pb-4 text-center">Engagement</th>
                     <th className="pb-4 text-center">Location Code</th>
                     <th className="pb-4 text-center">Status</th>
                     <th className="pb-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredProperties.map((p, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                       <td className="py-3">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-8 rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-slate-50 shrink-0">
                                {p.image ? (
                                  <img src={p.image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-4 h-4" /></div>
                                )}
                             </div>
                             <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[200px]">{p.title}</p>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate">{p.city}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-3">
                          <p className="text-[10px] font-bold text-slate-800 truncate max-w-[120px]">{p.ownerName}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter truncate">{p.ownerLoginId}</p>
                       </td>
                       <td className="py-3 text-center">
                          <div className="inline-flex items-center gap-3">
                             <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-800">{p.views.toLocaleString()}</p>
                                <p className="text-[7px] text-slate-400 font-bold uppercase">Views</p>
                             </div>
                             <div className="text-center">
                                <p className="text-[10px] font-bold text-blue-600">{p.clicks.toLocaleString()}</p>
                                <p className="text-[7px] text-slate-400 font-bold uppercase">Clicks</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-3 text-center">
                          <span className="text-[9px] font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100 font-bold shadow-sm">
                             {p.locationCode}
                          </span>
                       </td>
                       <td className="py-3 text-center">
                          <span className={cn(
                             "text-[7px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider",
                             p.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                             p.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                             "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                             {p.status}
                          </span>
                       </td>
                        <td className="py-3 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={async () => {
                                  setPreviewLoading(true);
                                  try {
                                    const res = await fetch(`${getApiUrl()}/api/properties/${p.id}`);
                                    const data = await res.json();
                                    if (data.success && data.property) setPreviewProperty(data.property);
                                    else toast.error("Failed to load preview");
                                  } catch { toast.error("Error loading preview"); }
                                  finally { setPreviewLoading(false); }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 hover:bg-teal-100 transition-all text-[9px] font-bold uppercase tracking-wider shadow-sm"
                                title="Preview on Website"
                              >
                                <Globe className="w-3 h-3" /> Preview
                              </button>
                              <button onClick={() => fetchPropertyDetail(p.id)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 shadow-sm" title="View Property"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => navigate(`?view=add&editId=${p.id}`)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm" title="Edit Property"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteProperty(p.id)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-100 shadow-sm" title="Delete Property"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-md mt-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {properties.length} of {totalRecords} Properties</p>
          <div className="flex items-center gap-2">
             <button 
               disabled={page === 1}
               onClick={() => fetchProperties(page - 1)}
               className="px-3 py-1.5 rounded-lg border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
             >
               Previous
             </button>
             <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                   <button 
                     key={i}
                     onClick={() => fetchProperties(i + 1)}
                     className={cn(
                       "w-8 h-8 rounded-lg text-[10px] font-bold transition-all",
                       page === i + 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-slate-50"
                     )}
                   >
                      {i + 1}
                   </button>
                ))}
             </div>
             <button 
               disabled={page === totalPages}
               onClick={() => fetchProperties(page + 1)}
               className="px-3 py-1.5 rounded-lg border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
             >
               Next
             </button>
          </div>
       </div>
    </div>
  );

  return (
    <>
      {view === "add" ? <AddPropertyView editId={editId} onBack={() => { fetchProperties(); navigate("?view=list"); }} apiUrl={getApiUrl()} /> : listView}
      {/* View Loading Overlay */}
      {viewLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Loading Property...</p>
          </div>
        </div>
      )}
      {/* Preview Loading Overlay */}
      {previewLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Loading Preview...</p>
          </div>
        </div>
      )}
      {/* Property View Modal */}
      {viewProperty && !viewLoading && (
        <PropertyViewModal
          property={viewProperty}
          onClose={() => setViewProperty(null)}
          apiUrl={getApiUrl()}
          onRefresh={() => { fetchProperties(); fetchPropertyDetail(viewProperty._id); }}
        />
      )}
      {/* Website Preview Modal */}
      {previewProperty && !previewLoading && (
        <WebsitePropertyPreviewModal
          property={previewProperty}
          onClose={() => setPreviewProperty(null)}
        />
      )}
    </>
  );
}

function AddPropertyView({ onBack, apiUrl, editId }) {
  const [formData, setFormData] = useState({
    title: "", address: "", city: "", locality: "", ownerName: "", ownerPhone: "", ownerLoginId: "", 
    propertyType: "pg", gender: "any", monthlyRent: "", discount: "", description: "",
    status: "active", isLiveOnWebsite: true, landmark: "", latitude: null, longitude: null
  });
  
  const [googleMapInput, setGoogleMapInput] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showLandmarkPicker, setShowLandmarkPicker] = useState(false);

  const parseLatLngFromUrl = (url) => {
    if (!url) return null;
    const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const atMatch = url.match(atRegex);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    const qRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = url.match(qRegex);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    const generalRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
    const genMatch = url.match(generalRegex);
    if (genMatch) return { lat: parseFloat(genMatch[1]), lng: parseFloat(genMatch[2]) };
    return null;
  };

  const handleGoogleMapInputChange = (val) => {
    setGoogleMapInput(val);
    const parsed = parseLatLngFromUrl(val);
    if (parsed) {
      setFormData(prev => ({
        ...prev,
        latitude: parsed.lat,
        longitude: parsed.lng
      }));
      toast.success(`Coordinates found: ${parsed.lat}, ${parsed.lng}`);
    }
  };
  
  // Amenities fetched from DB
  const [dbAmenities, setDbAmenities] = useState([]);
  const [selectedDbAmenities, setSelectedDbAmenities] = useState({});

  // Custom dynamic amenities (added inline, not in DB)
  const [amenities, setAmenities] = useState([]);
  const [newAmenityName, setNewAmenityName] = useState("");
  const [newAmenityIcon, setNewAmenityIcon] = useState("wifi");
  const [newAmenityCategory, setNewAmenityCategory] = useState("basic");

  // Owners fetched from DB
  const [dbOwners, setDbOwners] = useState([]);

  // Cities and Areas from DB
  const [dbCities, setDbCities] = useState([]);
  const [dbAreas, setDbAreas] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Modals for adding new City/Area
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCityState, setNewCityState] = useState("");
  const [newAreaName, setNewAreaName] = useState("");

  const fetchCities = async () => {
    try {
      setLoadingCities(true);
      const res = await fetch(`${apiUrl}/api/locations/cities`);
      const data = await res.json();
      if (data.success) setDbCities(data.data);
    } catch (err) { console.error("Failed to load cities", err); }
    finally { setLoadingCities(false); }
  };

  const fetchAreas = async (cityName) => {
    if (!cityName) {
      setDbAreas([]);
      return;
    }
    try {
      setLoadingAreas(true);
      const res = await fetch(`${apiUrl}/api/locations/areas/city/${cityName}`);
      const data = await res.json();
      if (data.success) setDbAreas(data.data);
    } catch (err) { console.error("Failed to load areas", err); }
    finally { setLoadingAreas(false); }
  };

  const handleAddCity = async () => {
    if (!newCityName || !newCityState) return toast.error("City name and state are required");
    try {
      const res = await fetch(`${apiUrl}/api/locations/cities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCityName, state: newCityState })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("City added successfully");
        setShowAddCityModal(false);
        setNewCityName("");
        setNewCityState("");
        fetchCities();
      } else {
        toast.error(data.message || "Failed to add city");
      }
    } catch (err) { console.error(err); toast.error("Error adding city"); }
  };

  const handleAddArea = async () => {
    if (!newAreaName || !formData.city) return toast.error("Area name and selected city are required");
    const cityObj = dbCities.find(c => c.name === formData.city);
    if (!cityObj) return toast.error("Selected city not found in database");

    try {
      const res = await fetch(`${apiUrl}/api/locations/areas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAreaName, cityId: cityObj._id, city: cityObj._id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Area added successfully");
        setShowAddAreaModal(false);
        setNewAreaName("");
        fetchAreas(formData.city);
      } else {
        toast.error(data.message || "Failed to add area");
      }
    } catch (err) { console.error(err); toast.error("Error adding area"); }
  };

  useEffect(() => {
    fetchCities();
    // Load amenities
    fetch(`${apiUrl}/api/amenities`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDbAmenities(data.data);
          const initial = {};
          data.data.forEach(a => { initial[a._id] = false; });
          setSelectedDbAmenities(initial);
        }
      })
      .catch(err => console.error("Failed to load amenities", err));

    // Load owners
    fetch(`${apiUrl}/api/superadmin/owners`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDbOwners(data.data);
        }
      })
      .catch(err => console.error("Failed to load owners", err));
  }, [apiUrl]);

  // Fetch areas when city changes
  useEffect(() => {
    if (formData.city) {
      fetchAreas(formData.city);
    }
  }, [formData.city]);

  const handleAddAmenity = () => {
    if (!newAmenityName.trim()) return;
    setAmenities([...amenities, { name: newAmenityName.trim(), icon: newAmenityIcon, category: newAmenityCategory }]);
    setNewAmenityName("");
  };

  const handleRemoveAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  // Global images
  const [globalImages, setGlobalImages] = useState([]);
  const [uploadingGlobal, setUploadingGlobal] = useState(false);

  // Dynamic custom categorized views
  const [propertyViews, setPropertyViews] = useState([
    { label: "Main", images: [], uploading: false }
  ]);

  const [saving, setSaving] = useState(false);

  // Fetch properties for edit mode
  useEffect(() => {
    if (editId) {
      fetch(`${apiUrl}/api/properties/${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.property) {
            const p = data.property;
            setFormData({
              title: p.title || p.propertyInfo?.name || p.propertyName || "",
              address: p.address || p.propertyInfo?.address || "",
              city: p.city || p.locationCode || p.propertyInfo?.city || "",
              locality: p.locality || p.propertyInfo?.area || "",
              ownerName: p.ownerName || p.owner?.name || p.propertyInfo?.ownerName || "",
              ownerPhone: p.ownerPhone || p.owner?.phone || "",
              ownerLoginId: p.ownerLoginId || p.owner?.loginId || "",
              owner: p.owner?._id || p.owner || "",
              propertyType: p.propertyType || p.propertyInfo?.propertyType || "pg",
              gender: p.gender || p.propertyInfo?.genderSuitability || "any",
              monthlyRent: p.monthlyRent || p.rent || p.propertyInfo?.rent || "",
              discount: p.discount || 0,
              description: p.description || p.propertyInfo?.description || "",
              status: p.status || "inactive",
              isLiveOnWebsite: p.isLiveOnWebsite || false,
              landmark: p.landmark || "",
              latitude: p.latitude || null,
              longitude: p.longitude || null
            });
            if (p.latitude && p.longitude) {
              setGoogleMapInput(`https://www.google.com/maps/@${p.latitude},${p.longitude},17z`);
            }
            if (p.images && p.images.length > 0) setGlobalImages(p.images);
            if (p.propertyViews && p.propertyViews.length > 0) setPropertyViews(p.propertyViews);
            
            // Map amenities back
            if (p.amenities && p.amenities.length > 0) {
              const mappedDb = {};
              const customArr = [];
              p.amenities.forEach(am => {
                 const name = typeof am === 'string' ? am : am.name;
                 const icon = typeof am === 'string' ? 'check' : am.icon;
                 const cat = typeof am === 'string' ? 'basic' : am.category;
                 // check if exists in dbAmenities (we have an issue here since dbAmenities might not be loaded yet, but it's fine for simple edit)
                 customArr.push({ name, icon: icon || 'check', category: cat || 'basic' });
              });
              setAmenities(customArr);
            }
          }
        })
        .catch(err => console.error("Failed to fetch property details", err));
    }
  }, [editId, apiUrl]);

  const handleGlobalUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingGlobal(true);
    const uploadedUrls = [];
    for (const file of files) {
      const data = new FormData();
      data.append("image", file);
      try {
        const res = await fetch(`${apiUrl}/api/upload`, { method: "POST", headers: getAuthHeader(), body: data });
        const json = await res.json();
        if (json.url) uploadedUrls.push(json.url);
      } catch (err) { console.error(err); }
    }
    setGlobalImages(prev => [...prev, ...uploadedUrls]);
    setUploadingGlobal(false);
  };

  const handleViewUpload = async (e, viewIndex) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newViews = [...propertyViews];
    newViews[viewIndex].uploading = true;
    setPropertyViews(newViews);
    const uploadedUrls = [];
    for (const file of files) {
      const data = new FormData();
      data.append("image", file);
      try {
        const res = await fetch(`${apiUrl}/api/upload`, { method: "POST", headers: getAuthHeader(), body: data });
        const json = await res.json();
        if (json.url) uploadedUrls.push(json.url);
      } catch (err) { console.error(err); }
    }
    const updatedViews = [...propertyViews];
    updatedViews[viewIndex].uploading = false;
    updatedViews[viewIndex].images = [...updatedViews[viewIndex].images, ...uploadedUrls];
    setPropertyViews(updatedViews);
  };

  const addCustomView = () => {
    setPropertyViews([...propertyViews, { label: "New Category", images: [], uploading: false }]);
  };

  const handleSubmit = async () => {
    if (!formData.title) return alert("Property Title is required!");
    setSaving(true);
    
    // Combine DB amenities and custom inline amenities
    const dbAmenitiesArr = dbAmenities
      .filter(a => selectedDbAmenities[a._id])
      .map(a => ({ name: a.name, icon: a.icon || "circle", category: a.category || "basic" }));
      
    const payload = {
      title: formData.title,
      property_name: formData.title,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      locality: formData.locality,
      landmark: formData.landmark || "",
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      owner: formData.owner,
      ownerName: formData.ownerName,
      ownerLoginId: formData.ownerLoginId,
      ownerPhone: formData.ownerPhone,
      propertyType: formData.propertyType,
      gender: formData.gender,
      monthlyRent: parseInt(formData.monthlyRent) || 0,
      rent: parseInt(formData.monthlyRent) || 0,
      discount: parseInt(formData.discount) || 0,
      status: formData.status,
      isLiveOnWebsite: formData.isLiveOnWebsite,
      images: globalImages,
      photos: globalImages, // For backwards compatibility
      propertyViews: propertyViews.filter(pv => pv.label.trim() && pv.images.length > 0),
      amenities: [...dbAmenitiesArr, ...amenities],
      propertyInfo: {
        name: formData.title,
        address: formData.address,
        city: formData.city,
        area: formData.locality,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        rent: parseInt(formData.monthlyRent) || 0,
        description: formData.description,
        genderSuitability: formData.gender,
        propertyType: formData.propertyType,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null
      }
    };

    try {
      const url = editId ? `${apiUrl}/api/properties/${editId}` : `${apiUrl}/api/properties/add`;
      const method = editId ? "PUT" : "POST";

      const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      const res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editId ? "Property Updated Successfully!" : "Property Added Successfully!");
        onBack();
      } else {
        toast.error(data.message || "Failed to save property");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving property");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
               <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="flex flex-col gap-1">
               <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">{editId ? "Edit Property" : "Add Property"}</h1>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{editId ? "Update property details" : "Fill in property details to create a new listing"}</p>
            </div>
         </div>
         <button onClick={handleSubmit} disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-200/10 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? "Saving..." : editId ? "Update Property" : "Add Property"}
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Left Column: Details */}
         <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /> Property Information</h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Property Name / Title *</label>
                    <input value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="e.g. Rohini Apartment - 42" />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">City</label>
                      <div className="flex gap-2">
                        <select 
                          value={formData.city} 
                          onChange={e=>setFormData({...formData, city: e.target.value, locality: ""})} 
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        >
                          <option value="">Select City</option>
                          {dbCities.map(city => (
                            <option key={city._id} value={city.name}>{city.name}</option>
                          ))}
                        </select>
                        <button onClick={() => setShowAddCityModal(true)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Locality / Area</label>
                      <div className="flex gap-2">
                        <select 
                          value={formData.locality} 
                          onChange={e=>setFormData({...formData, locality: e.target.value})} 
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          disabled={!formData.city}
                        >
                          <option value="">{formData.city ? "Select Area" : "Select City First"}</option>
                          {dbAreas.map(area => (
                            <option key={area._id} value={area.name}>{area.name}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => setShowAddAreaModal(true)} 
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors disabled:opacity-50"
                          disabled={!formData.city}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Full Address</label>
                    <textarea value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none" placeholder="Enter complete address" rows={2} />
                  </div>

                  {/* Landmark and Google Map Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nearby Landmarks (optional)</label>
                      <div className="flex gap-3 items-center">
                        <div className="flex-1 flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                          <input 
                            value={formData.landmark || ""} 
                            onChange={e => setFormData({...formData, landmark: e.target.value})} 
                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" 
                            placeholder="e.g. Near Christ University, Koramangala 4th Block" 
                          />
                        </div>
                        
                        {/* Map Picker Trigger for Landmark */}
                        <button
                          type="button"
                          onClick={() => setShowLandmarkPicker(true)}
                          className="w-16 h-11 bg-slate-50 border border-slate-100 rounded-xl relative hover:brightness-95 active:scale-95 transition-all shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center group"
                          title="Pick Landmark on Map"
                        >
                          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
                          <div className="absolute top-2 left-3 w-6 h-4 bg-emerald-100 rounded-full blur-sm" />
                          <div className="absolute bottom-1 right-2 w-8 h-5 bg-sky-100 rounded-full blur-sm" />
                          <div className="relative z-10 flex flex-col items-center">
                            <MapPin className="w-5 h-5 text-teal-600 fill-teal-600 drop-shadow-md group-hover:-translate-y-0.5 transition-transform duration-300" />
                            <div className="w-1.5 h-0.5 bg-black/20 rounded-full blur-[1px]" />
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Google Map Location (optional)</label>
                      <div className="flex gap-3 items-center">
                        <div className="flex-1 flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                          <input 
                            type="text" 
                            value={googleMapInput} 
                            onChange={e => handleGoogleMapInputChange(e.target.value)} 
                            placeholder="Search location on map" 
                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                          />
                        </div>
                        
                        {/* Map Thumbnail Button */}
                        <button
                          type="button"
                          onClick={() => setShowMapPicker(true)}
                          className="w-16 h-11 bg-slate-50 border border-slate-100 rounded-xl relative hover:brightness-95 active:scale-95 transition-all shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center group"
                          title="Pick on Map"
                        >
                          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
                          <div className="absolute top-2 left-3 w-6 h-4 bg-emerald-100 rounded-full blur-sm" />
                          <div className="absolute bottom-1 right-2 w-8 h-5 bg-sky-100 rounded-full blur-sm" />
                          <div className="relative z-10 flex flex-col items-center">
                            <MapPin className="w-5 h-5 text-red-500 fill-red-500 drop-shadow-md group-hover:-translate-y-0.5 transition-transform duration-300" />
                            <div className="w-1.5 h-0.5 bg-black/20 rounded-full blur-[1px]" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {showMapPicker && (
                    <LocationMapPicker 
                      onLocationSelect={({ latitude: lat, longitude: lng, location }) => {
                        setFormData(prev => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng,
                          landmark: location && !prev.landmark ? location : prev.landmark
                        }));
                        setGoogleMapInput(location || `https://www.google.com/maps/@${lat},${lng},17z`);
                        setShowMapPicker(false);
                        toast.success("Location confirmed from map!");
                      }}
                      onClose={() => setShowMapPicker(false)}
                    />
                  )}

                  {showLandmarkPicker && (
                    <LocationMapPicker 
                      onLocationSelect={({ latitude: lat, longitude: lng, location }) => {
                        setFormData(prev => ({
                          ...prev,
                          landmark: location || `Lat: ${lat}, Lng: ${lng}`,
                          latitude: prev.latitude || lat,
                          longitude: prev.longitude || lng
                        }));
                        if (!formData.latitude || !formData.longitude) {
                          setGoogleMapInput(location || `https://www.google.com/maps/@${lat},${lng},17z`);
                        }
                        setShowLandmarkPicker(false);
                        toast.success("Landmark set from map!");
                      }}
                      onClose={() => setShowLandmarkPicker(false)}
                    />
                  )}
                  <div className="pt-4 border-t border-slate-50">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Select Property Owner *</label>
                      <select 
                        onChange={(e) => {
                          const selected = dbOwners.find(o => o._id === e.target.value);
                          if (selected) {
                            setFormData({
                              ...formData, 
                              owner: selected._id,
                              ownerName: selected.name, 
                              ownerPhone: selected.phone || "", 
                              ownerLoginId: selected.loginId || selected.email || ""
                            });
                          } else {
                            setFormData({...formData, owner: "", ownerName: "", ownerPhone: "", ownerLoginId: ""});
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      >
                        <option value="">-- Select Registered Owner --</option>
                        {dbOwners.map(owner => (
                          <option key={owner._id} value={owner._id}>{owner.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Description</label>
                    <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none" placeholder="Premium features and detailed description..." rows={3} />
                  </div>

                  {/* Administrative Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Property Status</label>
                      <select 
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                      >
                        <option value="inactive">Inactive (Draft)</option>
                        <option value="active">Active (Verified)</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.isLiveOnWebsite} 
                          onChange={e => setFormData({...formData, isLiveOnWebsite: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Live on Website</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Syndicate to public listing</p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-600" /> Pricing & Features</h3>
               <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Type</label>
                    <select value={formData.propertyType} onChange={e=>setFormData({...formData, propertyType: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                       <option value="pg">PG</option>
                       <option value="hostel">Hostel</option>
                       <option value="co-living">Co-Living</option>
                       <option value="apartment">Apartment</option>
                       <option value="room">Room</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Gender</label>
                    <select value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                       <option value="any">Any / Unisex</option>
                       <option value="male">Male Only</option>
                       <option value="female">Female Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Monthly Rent</label>
                    <input type="number" value={formData.monthlyRent} onChange={e=>setFormData({...formData, monthlyRent: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="₹ 0" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Discount (₹)</label>
                    <input type="number" value={formData.discount} onChange={e=>setFormData({...formData, discount: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="₹ 0" />
                  </div>
               </div>
               
               <div className="mt-6 pt-6 border-t border-slate-50">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Platform Amenities</label>
                  <div className="flex flex-wrap gap-2 mb-6">
                     {dbAmenities.length > 0 ? dbAmenities.map(am => {
                        const IconComponent = getIconComponent(am.icon || "circle");
                        const isSelected = selectedDbAmenities[am._id];
                        return (
                           <label key={am._id} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all", isSelected ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
                              <input type="checkbox" className="hidden" checked={isSelected} onChange={(e) => setSelectedDbAmenities({...selectedDbAmenities, [am._id]: e.target.checked})} />
                              <IconComponent className="w-4 h-4" />
                              <span className="text-[11px] font-bold tracking-tight">{am.name}</span>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-blue-600 ml-1" />}
                           </label>
                        );
                     }) : <span className="text-xs text-slate-400 italic">Loading platform amenities...</span>}
                  </div>

                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Add Custom Inline Amenity</label>
                  <div className="flex items-center gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <input 
                       value={newAmenityName} 
                       onChange={(e) => setNewAmenityName(e.target.value)} 
                       placeholder="Amenity Name (e.g. Heated Pool)" 
                       className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                     />
                     <div className="relative w-40">
                        <input 
                          type="text"
                          value={newAmenityIcon} 
                          onChange={(e) => setNewAmenityIcon(e.target.value)}
                          placeholder="Icon (e.g. leaf, wifi)"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                           {(() => { const Icon = getIconComponent(newAmenityIcon); return <Icon className="w-3.5 h-3.5" />; })()}
                        </div>
                     </div>
                     <select 
                       value={newAmenityCategory} 
                       onChange={(e) => setNewAmenityCategory(e.target.value)}
                       className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                     >
                        <option value="basic">Basic</option>
                        <option value="comfort">Comfort</option>
                        <option value="luxury">Luxury</option>
                     </select>
                     <button type="button" onClick={handleAddAmenity} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1 whitespace-nowrap">
                        <Plus className="w-3.5 h-3.5" /> Add Custom
                     </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                     {amenities.map((am, idx) => {
                        const IconComponent = getIconComponent(am.icon);
                        return (
                           <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-blue-50 border-blue-200 text-blue-700">
                              <IconComponent className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{am.name}</span>
                              <button onClick={() => handleRemoveAmenity(idx)} className="ml-1 text-blue-400 hover:text-rose-500 transition-colors">
                                 <XCircle className="w-3.5 h-3.5" />
                              </button>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column: Media Uploads */}
         <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-purple-600" /> Property Images</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 leading-relaxed">Upload all property photos and custom categorized views.</p>
               
               {/* Global Images */}
               <div className="mb-8 border-b border-slate-100 pb-6">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">All Photos</span>
                     <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">{globalImages.length} Photos</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                     {globalImages.map((img, i) => (
                        <div key={i} className="aspect-square rounded-lg bg-slate-200 overflow-hidden relative group">
                           <img src={img} className="w-full h-full object-cover" alt="" />
                           <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => setGlobalImages(globalImages.filter((_, idx) => idx !== i))} className="text-white hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </div>
                     ))}
                     <label className="aspect-square rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors group">
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleGlobalUpload} disabled={uploadingGlobal} />
                        {uploadingGlobal ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" /> : <UploadCloud className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />}
                     </label>
                  </div>
               </div>

               {/* Categorized Views */}
               <div className="space-y-5">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Custom Views / Labels</span>
                     <button onClick={addCustomView} className="text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Category
                     </button>
                  </div>

                  {propertyViews.map((pv, index) => (
                     <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative group">
                        <button onClick={() => setPropertyViews(propertyViews.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <XCircle className="w-4 h-4" />
                        </button>
                        <div className="mb-3 w-3/4">
                           <input 
                             value={pv.label} 
                             onChange={(e) => {
                               const newViews = [...propertyViews];
                               newViews[index].label = e.target.value;
                               setPropertyViews(newViews);
                             }}
                             placeholder="e.g. Main, Room, Interior, Building"
                             className="w-full bg-transparent border-b border-slate-300 focus:border-blue-500 text-[11px] font-bold text-slate-700 uppercase tracking-widest outline-none py-1 transition-colors"
                           />
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                           {pv.images.map((img, i) => (
                              <div key={i} className="aspect-square rounded-lg bg-slate-200 border border-slate-200 overflow-hidden relative group/img">
                                 <img src={img} className="w-full h-full object-cover" alt="" />
                                 <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => {
                                      const newViews = [...propertyViews];
                                      newViews[index].images.splice(i, 1);
                                      setPropertyViews(newViews);
                                    }} className="text-white hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                                 </div>
                              </div>
                           ))}
                           <label className="aspect-square rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 transition-colors group/upload">
                              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleViewUpload(e, index)} disabled={pv.uploading} />
                              {pv.uploading ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> : <UploadCloud className="w-4 h-4 text-emerald-400 group-hover/upload:scale-110 transition-transform" />}
                           </label>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
      {/* Add City Modal */}
      {showAddCityModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 p-6 border-b border-slate-100">
                 <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Add New City</h4>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">City Name</label>
                    <input value={newCityName} onChange={e=>setNewCityName(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500" placeholder="e.g. Mumbai" />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">State</label>
                    <input value={newCityState} onChange={e=>setNewCityState(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500" placeholder="e.g. Maharashtra" />
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowAddCityModal(false)} className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200">Cancel</button>
                    <button onClick={handleAddCity} className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700">Add City</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Area Modal */}
      {showAddAreaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 p-6 border-b border-slate-100">
                 <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Add New Area to {formData.city}</h4>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Area Name</label>
                    <input value={newAreaName} onChange={e=>setNewAreaName(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500" placeholder="e.g. Andheri West" />
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowAddAreaModal(false)} className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200">Cancel</button>
                    <button onClick={handleAddArea} className="flex-1 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700">Add Area</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// PROPERTY VIEW MODAL — Beautiful full-detail modal for Superadmin
// =====================================================================
function PropertyViewModal({ property: p, onClose, apiUrl, onRefresh }) {
  const [approvingChanges, setApprovingChanges] = useState(false);
  const [rejectingChanges, setRejectingChanges] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [activeImgTab, setActiveImgTab] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);

  const hasPending = p.pendingChanges && p.pendingChanges.status === "pending";

  const allImages = [
    ...(p.images || []),
    ...((p.propertyViews || []).flatMap(v => v.images || []))
  ].filter(Boolean);

  const handleApprove = async () => {
    if (!window.confirm("Approve these changes? They will go live immediately.")) return;
    setApprovingChanges(true);
    try {
      const res = await fetch(`${apiUrl}/api/properties/${p._id}/approve-changes`, { method: "PUT", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data.success) { toast.success("Changes approved & live!"); onRefresh(); }
      else toast.error(data.message || "Failed to approve");
    } catch (err) { toast.error("Error approving changes"); } finally { setApprovingChanges(false); }
  };

  const handleReject = async () => {
    setRejectingChanges(true);
    try {
      const res = await fetch(`${apiUrl}/api/properties/${p._id}/reject-changes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectReason })
      });
      const data = await res.json();
      if (data.success) { toast.success("Changes rejected."); setShowRejectInput(false); onRefresh(); }
      else toast.error(data.message || "Failed to reject");
    } catch (err) { toast.error("Error rejecting changes"); } finally { setRejectingChanges(false); }
  };

  const fmt = (val) => {
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) {
      if (val.length === 0) return "—";
      return val.map(item => {
        if (typeof item === "object" && item !== null) return item.name || item.title || item.label || Object.values(item).filter(v => typeof v === "string").join(" ") || JSON.stringify(item);
        return String(item);
      }).join(", ");
    }
    if (typeof val === "object") {
      return Object.entries(val)
        .filter(([, v]) => v !== null && v !== "" && v !== undefined)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").trim()}: ${typeof v === "boolean" ? (v ? "Yes" : "No") : v}`)
        .join(" • ");
    }
    return String(val);
  };

  const Section = ({ title, icon: Icon, color = "blue", children, id }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className={`w-full flex items-center justify-between p-4 bg-${color}-50 border-b border-${color}-100 hover:bg-${color}-100 transition-colors`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 text-${color}-600`} />
          <span className={`text-xs font-bold text-${color}-700 uppercase tracking-widest`}>{title}</span>
        </div>
        {expandedSection === id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {(expandedSection === id || expandedSection === null) && (
        <div className="p-4">{children}</div>
      )}
    </div>
  );

  const Field = ({ label, value, highlight }) => (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className={`text-[11px] font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border ${highlight ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-100"} break-words`}>
        {fmt(value) || "—"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#F8FAFC] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">{p.title || "Property Details"}</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.city || ""} {p.locality ? `• ${p.locality}` : ""} {p.locationCode ? `• ${p.locationCode}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[8px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider ${
              p.isLiveOnWebsite ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              p.status === "active" ? "bg-blue-50 text-blue-600 border-blue-100" :
              "bg-amber-50 text-amber-600 border-amber-100"
            }`}>{p.isLiveOnWebsite ? "Live on Website" : p.status || "Inactive"}</span>
            {hasPending && (
              <span className="text-[8px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider bg-amber-50 text-amber-600 border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Pending Changes
              </span>
            )}
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><XCircle className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Pending Changes Section */}
          {hasPending && (
            <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800 uppercase tracking-tight">Owner Edit Request — Pending Approval</span>
                </div>
                <span className="text-[9px] text-amber-600 font-bold">{p.pendingChanges?.requestedBy} • {p.pendingChanges?.requestedAt ? new Date(p.pendingChanges.requestedAt).toLocaleDateString("en-IN") : ""}</span>
              </div>
              {p.pendingChanges?.reason && (
                <p className="text-xs text-amber-700 bg-amber-100 px-3 py-2 rounded-lg mb-4 border border-amber-200"><strong>Reason:</strong> {p.pendingChanges.reason}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {Object.entries(p.pendingChanges?.data || {}).filter(([k, v]) => v !== undefined && v !== null && v !== "").map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">{key.replace(/([A-Z])/g, " $1").trim()} (Proposed)</p>
                    <div className="text-[11px] font-semibold text-amber-900 bg-white px-3 py-2 rounded-lg border border-amber-300 break-words">{fmt(val)}</div>
                  </div>
                ))}
              </div>
              {!showRejectInput ? (
                <div className="flex gap-3">
                  <button onClick={handleApprove} disabled={approvingChanges} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 disabled:opacity-50">
                    {approvingChanges ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />} Approve & Go Live
                  </button>
                  <button onClick={() => setShowRejectInput(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-all">
                    <Ban className="w-3.5 h-3.5" /> Reject Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (optional)..."
                    className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-100"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setShowRejectInput(false)} className="flex-1 py-2 rounded-xl text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">Cancel</button>
                    <button onClick={handleReject} disabled={rejectingChanges} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50">
                      {rejectingChanges ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Confirm Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Images */}
          {allImages.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Property Images ({allImages.length})</span>
              </div>
              <div className="p-4">
                <div className="relative w-full h-56 rounded-xl overflow-hidden mb-3 bg-slate-100">
                  <img src={allImages[activeImgTab]} alt="Property" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setActiveImgTab(i)} className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${ i === activeImgTab ? "border-blue-500" : "border-slate-200 opacity-60 hover:opacity-100"}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-blue-50 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Basic Information</span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Title" value={p.title} />
              <Field label="Property Type" value={p.propertyType} />
              <Field label="Gender" value={p.gender} />
              <Field label="City" value={p.city} />
              <Field label="Locality" value={p.locality} />
              <Field label="Location Code" value={p.locationCode} />
              <Field label="Address" value={p.address} />
              <Field label="Landmark" value={p.landmark} />
              <Field label="State" value={p.state} />
              <Field label="Pincode" value={p.pincode} />
              <Field label="Latitude" value={p.latitude} />
              <Field label="Longitude" value={p.longitude} />
            </div>
          </div>

          {/* Contact & Owner */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-emerald-50 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Contact & Owner</span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Owner Name" value={p.ownerName} />
              <Field label="Owner Phone" value={p.ownerPhone} />
              <Field label="Owner Login ID" value={p.ownerLoginId} />
              <Field label="Contact Name" value={p.contact?.name} />
              <Field label="Contact Number" value={p.contact?.number} />
              <Field label="Contact Email" value={p.contact?.email} />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-indigo-50 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Pricing</span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Monthly Rent" value={p.monthlyRent ? `₹${p.monthlyRent?.toLocaleString()}` : null} />
              <Field label="Discount" value={p.discount ? `₹${p.discount}` : "0"} />
              <Field label="Rent Type" value={p.pricing?.rentType} />
              <Field label="Security Deposit" value={p.pricing?.securityDeposit} />
              <Field label="Advance Rent" value={p.pricing?.advanceRent} />
              <Field label="Notice Period" value={p.pricing?.noticePeriod} />
              <Field label="Lock-in Period" value={p.pricing?.lockInPeriod} />
              <Field label="Discount %" value={p.pricing?.discountPercent} />
              {(p.pricing?.additionalCharges || []).length > 0 && (
                <div className="md:col-span-3 space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Additional Charges</p>
                  <div className="flex flex-wrap gap-2">
                    {(p.pricing?.additionalCharges || []).map((c, i) => (
                      <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100 font-semibold">{c.name}: ₹{c.amount}/{c.per}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property Details */}
          {p.propertyDetails && Object.values(p.propertyDetails).some(v => v) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-amber-50 flex items-center gap-2">
                <Home className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Property Details</span>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Total Area" value={p.propertyDetails?.totalArea} />
                <Field label="Year Built" value={p.propertyDetails?.yearBuilt} />
                <Field label="Property Age" value={p.propertyDetails?.propertyAge} />
                <Field label="Floors" value={p.propertyDetails?.floors} />
                <Field label="Lift Available" value={p.propertyDetails?.liftAvailable} />
                <Field label="Parking" value={p.propertyDetails?.parkingAvailable} />
                <Field label="Notice Period" value={p.propertyDetails?.noticePeriod} />
                <Field label="Gender Pref" value={p.propertyDetails?.genderPref} />
                <Field label="Preferred For" value={p.propertyDetails?.preferredFor} />
              </div>
            </div>
          )}

          {/* Policies */}
          {p.policies && Object.values(p.policies).some(v => v) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-rose-50 flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-700 uppercase tracking-widest">Policies / House Rules</span>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Smoking" value={p.policies?.smokingAllowed} />
                <Field label="Alcohol" value={p.policies?.alcoholAllowed} />
                <Field label="Pets" value={p.policies?.petsAllowed} />
                <Field label="Cooking" value={p.policies?.cookingAllowed} />
                <Field label="Visitors" value={p.policies?.visitorsAllowed} />
                <Field label="Visitor Timing" value={p.policies?.visitorTiming} />
                <Field label="Party" value={p.policies?.partyAllowed} />
                <Field label="Outside Food" value={p.policies?.outsideFood} />
                <Field label="Quiet Hours" value={p.policies?.quietHours} />
                <Field label="Quiet Hours Timing" value={p.policies?.quietHoursTiming} />
                <Field label="Early Check-in" value={p.policies?.earlyCheckIn} />
              </div>
            </div>
          )}

          {/* Facilities */}
          {p.facilities && Object.values(p.facilities).some(Boolean) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-teal-50 flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">Facilities</span>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {Object.entries(p.facilities || {}).map(([k, v]) => (
                  <span key={k} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider ${
                    v ? "bg-teal-50 text-teal-600 border-teal-100" : "bg-slate-50 text-slate-400 border-slate-100"
                  }`}>
                    {v ? "✓" : "✗"} {k.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {(p.amenities || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-purple-50 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-700 uppercase tracking-widest">Amenities ({p.amenities.length})</span>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {(p.amenities || []).map((am, i) => (
                  <span key={i} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wider">
                    {typeof am === "string" ? am : am.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Room Types */}
          {(p.roomTypes || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Room Types</span>
              </div>
              <div className="p-4 space-y-3">
                {(p.roomTypes || []).map((rt, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-2">{rt.type || `Room Type ${i+1}`}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Field label="Occupancy" value={rt.occupancy} />
                      <Field label="Price/Bed" value={rt.pricePerBed ? `₹${rt.pricePerBed}` : null} />
                      <Field label="Price/Room" value={rt.pricePerRoom ? `₹${rt.pricePerRoom}` : null} />
                      <Field label="Total Rooms" value={rt.totalRooms} />
                      <Field label="Total Beds" value={rt.totalBeds} />
                      <Field label="Description" value={rt.desc} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Occupancy Stats */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Occupancy & Stats</span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Total Rooms" value={p.totalRooms || p.roomCount} />
              <Field label="Occupied Rooms" value={p.occupiedRooms} />
              <Field label="Vacant Rooms" value={p.vacantRooms} />
              <Field label="Total Beds" value={p.bedCount} />
              <Field label="Occupied Beds" value={p.occupiedBeds} />
              <Field label="Vacant Beds" value={p.vacantBeds} />
              <Field label="Beds Per Room" value={p.bedsPerRoom} />
              <Field label="Views" value={p.views} />
              <Field label="Clicks" value={p.clicks} />
            </div>
          </div>

          {/* Description */}
          {(p.description || p.tenantDescription) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Description</span>
              </div>
              <div className="p-4 space-y-3">
                {p.description && <Field label="Property Description" value={p.description} />}
                {p.tenantDescription && <Field label="Tenant Description" value={p.tenantDescription} />}
              </div>
            </div>
          )}

          {/* Status & Admin Fields */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Status & Admin</span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Status" value={p.status} />
              <Field label="Is Published" value={p.isPublished} />
              <Field label="Is Live on Website" value={p.isLiveOnWebsite} />
              <Field label="Property Category" value={p.propertyCategory} />
              <Field label="Title" value={p.title} />
              <Field label="Created At" value={p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : null} />
              <Field label="Updated At" value={p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("en-IN") : null} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 shrink-0">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {p._id}</p>
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

function StatCardHorizontal({ icon: Icon, color, label, value, trend, up }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md flex items-start gap-3 group hover:translate-y-[-2px] transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105", colors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none truncate">{label}</p>
         <p className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-2">{value}</p>
         <div className={cn(
           "flex items-center gap-1 text-[7px] font-bold uppercase",
           up ? "text-emerald-600" : "text-rose-600"
         )}>
            {up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {trend}
         </div>
      </div>
    </div>
  );
}
