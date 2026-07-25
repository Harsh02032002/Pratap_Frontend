import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, Search, Filter, RefreshCw, LayoutGrid, Eye, Trash2, 
  X, Edit2, Loader2, ArrowUpRight, ArrowDownRight, BedDouble, 
  Home, ShieldAlert, CheckCircle, HelpCircle, UploadCloud, ChevronUp, ChevronDown, 
  Star, ClipboardList, Thermometer, Wifi, Plus, Check, Tv, Wind, 
  ShowerHead, DoorClosed, Refrigerator, Shield, Trash, List, EyeOff
} from "lucide-react";
import { fetchJson, getApiBase, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import toast from "react-hot-toast";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const compressImage = (file, maxWidth = 1200, quality = 0.75) =>
  new Promise((resolve) => {
    if (!file.type.startsWith("image/")) { resolve(file); return; }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => resolve(file);
  });

export default function RoomsManagement() {
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [sharingFilter, setSharingFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");

  // Global stats from backend response
  const [stats, setStats] = useState({
    totalRooms: 0,
    vacantRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    totalProperties: 0
  });

  // Edit Room Modal state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({
    title: "",
    unitType: "",
    floor: "",
    sharingType: "",
    price: 0,
    remarks: "",
    isAvailable: true,
    facilities: [],
    roomTypeFeatures: [],
    media: [],
    type: "AC",
    gender: "",
    beds: 1,
    electricityUnitCost: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const loadProperties = async () => {
    try {
      const data = await fetchJson("/api/properties?limit=1000");
      const list = Array.isArray(data) ? data : data?.properties || data?.data || [];
      setProperties(list);
    } catch (err) {
      console.error("Failed to load properties:", err);
    }
  };

  const loadRooms = async (pNum = page) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pNum,
        limit: 10,
        search,
        property: propertyFilter,
        sharingType: sharingFilter
      });
      const data = await fetchJson(`/api/rooms/all?${queryParams.toString()}`);
      if (data?.success) {
        setRooms(data.rooms || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load rooms:", err);
      toast.error(err.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadRooms(1);
  }, [propertyFilter, sharingFilter]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRooms(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setPropertyFilter("all");
    setSharingFilter("all");
    setFloorFilter("all");
    loadRooms(1);
  };

  // Soft delete room handler
  const handleDeleteRoom = async (room) => {
    const roomId = room._id || room.id;
    if (!window.confirm(`Are you sure you want to delete room ${room.title || room.number}?`)) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetchJson(`/api/rooms/${roomId}`, { method: "DELETE" });
      if (res?.success) {
        toast.success("Room deleted successfully");
        loadRooms(page);
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete room");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (room) => {
    setSelectedRoom(room);
    setRoomForm({
      title: room.title || room.number || "",
      unitType: room.unitType || "",
      floor: room.floor || "",
      sharingType: room.sharingType || "",
      price: room.price || room.rent || 0,
      remarks: room.remarks || "",
      isAvailable: room.isAvailable !== false,
      facilities: room.facilities || [],
      roomTypeFeatures: room.roomTypeFeatures || [],
      media: room.media || [],
      type: room.type || "AC",
      gender: room.gender || "",
      beds: room.beds?.length || room.beds || 1,
      electricityUnitCost: room.electricity?.unitCost || room.electricityUnitCost || 0
    });
    setEditModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return;
    const roomId = selectedRoom._id || selectedRoom.id;
    try {
      setIsSubmitting(true);
      const res = await fetchJson(`/api/rooms/${roomId}`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify(roomForm)
      });
      if (res) {
        toast.success("Room updated successfully");
        setEditModalOpen(false);
        loadRooms(page);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update room");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reordering media helper methods
  const moveMediaIndex = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= roomForm.media.length) return;
    const reordered = [...roomForm.media];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setRoomForm(prev => ({ ...prev, media: reordered }));
  };

  const setAsCover = (index) => {
    if (index === 0) return;
    const reordered = [...roomForm.media];
    const [moved] = reordered.splice(index, 1);
    reordered.unshift(moved);
    setRoomForm(prev => ({ ...prev, media: reordered }));
    toast.success("Cover image updated");
  };

  const deleteMedia = (index) => {
    setRoomForm(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingMedia(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const compressed = await compressImage(file);
        const formData = new FormData();
        formData.append("image", compressed);
        const base = getApiBase();
        const res = await fetch(`${base}/api/upload`, {
          method: "POST",
          body: formData,
          headers: getAuthHeader()
        });

        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || `HTTP error ${res.status}`);
        }

        if (!res.ok) throw new Error(data.error || "Upload failed");
        return { preview: data.url, url: data.url };
      });
      const uploadedFiles = await Promise.all(uploadPromises);
      setRoomForm(prev => ({
        ...prev,
        media: [...(prev.media || []), ...uploadedFiles]
      }));
      toast.success("Media uploaded successfully");
    } catch (err) {
      toast.error("Failed to upload media: " + err.message);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Get bed assignments length
  const getOccupancyInfo = (room) => {
    const totalBeds = Array.isArray(room.beds) ? room.beds.length : Number(room.beds || 1);
    const assignedCount = Array.isArray(room.bedAssignments) 
      ? room.bedAssignments.filter(b => b && b.tenantId).length 
      : 0;
    return { assignedCount, totalBeds };
  };

  // Get floor options list
  const floorOptions = ["Basement", "Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor"];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Rooms Management"
        subtitle="Operational logistics, asset status monitoring, and image management matrix."
        actions={
          <button 
            onClick={() => loadRooms(1)}
            className="bg-white text-slate-600 border border-slate-100 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-200 transition-all flex items-center gap-2 active:scale-95"
          >
             <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh Table
          </button>
        }
      />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCardHorizontal label="Total Rooms" value={stats.totalRooms} up icon={Home} color="blue" />
        <StatCardHorizontal label="Total Properties" value={stats.totalProperties} up icon={Building2} color="indigo" />
        <StatCardHorizontal label="Vacant Rooms" value={stats.vacantRooms} up icon={CheckCircle} color="emerald" />
        <StatCardHorizontal label="Occupied Rooms" value={stats.occupiedRooms} up icon={BedDouble} color="blue" />
        <StatCardHorizontal label="Maintenance Rooms" value={stats.maintenanceRooms} up icon={ShieldAlert} color="amber" />
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
         
         {/* Filter Section */}
         <div className="p-10 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <LayoutGrid size={20} />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-slate-800">Rooms Registry</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-owner inventory metrics & asset portfolio details</p>
               </div>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-4">
               
               {/* Search Input */}
               <div className="relative w-72 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    value={search} 
                    onChange={handleSearchChange}
                    placeholder="Search rooms, owners, properties..." 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" 
                  />
               </div>

               {/* Property Filter */}
               <select
                 value={propertyFilter}
                 onChange={e => setPropertyFilter(e.target.value)}
                 className="bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-xs font-bold text-slate-600 outline-none focus:bg-white shadow-sm"
               >
                 <option value="all">All Properties</option>
                 {properties.map(p => (
                   <option key={p._id} value={p._id}>{p.title || p.name}</option>
                 ))}
               </select>

               {/* Sharing Filter */}
               <select
                 value={sharingFilter}
                 onChange={e => setSharingFilter(e.target.value)}
                 className="bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-xs font-bold text-slate-600 outline-none focus:bg-white shadow-sm"
               >
                 <option value="all">All Sharing Types</option>
                 <option value="Single Sharing">Single Sharing</option>
                 <option value="Double Sharing">Double Sharing</option>
                 <option value="Triple Sharing">Triple Sharing</option>
                 <option value="Four Sharing">Four Sharing</option>
                 <option value="Private Room (No Sharing)">Private Room (No Sharing)</option>
               </select>

               <button 
                 type="submit" 
                 className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-slate-900/10 active:scale-95 transition-all"
               >
                 Search
               </button>

               {(search || propertyFilter !== "all" || sharingFilter !== "all") && (
                 <button 
                   type="button"
                   onClick={handleClearFilters}
                   className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors py-2 px-1"
                 >
                   Clear Filters
                 </button>
               )}
            </form>
         </div>

         {/* Table list */}
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                     <th className="px-10 py-8">Room No.</th>
                     <th className="px-6 py-8">Property Allocation</th>
                     <th className="px-6 py-8">Owner Details</th>
                     <th className="px-6 py-8 text-center">Floor / Sharing</th>
                     <th className="px-6 py-8 text-center">Occupancy Index</th>
                     <th className="px-6 py-8 text-center">Rent Pulse</th>
                     <th className="px-6 py-8 text-center">Images</th>
                     <th className="px-6 py-8 text-center">Status</th>
                     <th className="px-10 py-8 text-right">Operations</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-40 text-center">
                         <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-8" />
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Accessing Property Intelligence...</p>
                      </td>
                    </tr>
                  ) : rooms.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-40 text-center">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                            <Home size={40} />
                         </div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching rooms found</p>
                      </td>
                    </tr>
                  ) : rooms.map((room) => {
                    const { assignedCount, totalBeds } = getOccupancyInfo(room);
                    const hasCover = room.media && room.media.length > 0;
                    return (
                      <tr key={room._id || room.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-6">
                               <div className={cn(
                                 "w-12 h-12 rounded-2xl text-blue-600 flex items-center justify-center font-bold text-lg shadow-xl shadow-slate-200/40 shrink-0 border border-slate-100 bg-white"
                               )}>
                                  {room.title || room.number}
                               </div>
                               <div>
                                  <p className="text-base font-bold text-slate-800 tracking-tight">Room {room.title || room.number}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">AC Type: {room.type || "AC"}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-8">
                            <div className="space-y-1">
                               <p className="text-xs font-bold text-slate-700 leading-tight max-w-[200px] truncate">{room.property?.title || "Undefined Property"}</p>
                               <p className="text-[9px] text-slate-400 font-medium leading-none">{room.property?.address || "Address unavailable"}</p>
                            </div>
                         </td>
                         <td className="px-6 py-8">
                            <div className="space-y-1">
                               <p className="text-xs font-bold text-slate-700 leading-none">{room.property?.ownerName || "No Owner"}</p>
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{room.property?.ownerLoginId || "N/A"}</span>
                            </div>
                         </td>
                         <td className="px-6 py-8 text-center">
                            <div className="space-y-1">
                               <p className="text-xs font-bold text-slate-700 leading-none">{room.floor || "Ground Floor"}</p>
                               <span className="text-[9px] font-semibold text-slate-400">{room.sharingType || "Double Sharing"}</span>
                            </div>
                         </td>
                         <td className="px-6 py-8 text-center">
                            <div className="inline-flex flex-col items-center">
                               <span className={cn(
                                 "text-[10px] font-bold px-3 py-1 rounded-lg border",
                                 assignedCount === totalBeds ? "bg-rose-50 text-rose-600 border-rose-100" :
                                 assignedCount === 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                 "bg-amber-50 text-amber-600 border-amber-100"
                               )}>
                                 {assignedCount} / {totalBeds} Occupied
                               </span>
                            </div>
                         </td>
                         <td className="px-6 py-8 text-center">
                            <span className="text-xs font-bold text-slate-800 leading-none">
                              ₹{(room.price || room.rent || 0).toLocaleString("en-IN")}
                            </span>
                            <p className="text-[9px] font-semibold text-slate-400 mt-1">/ Bed</p>
                         </td>
                         <td className="px-6 py-8 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {hasCover ? (
                                <div className="relative group/media">
                                  <img 
                                    src={room.media[0]?.preview || room.media[0]?.url} 
                                    alt="Cover" 
                                    className="w-10 h-10 object-cover rounded-lg border border-slate-200" 
                                  />
                                  {room.media.length > 1 && (
                                    <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                      +{room.media.length - 1}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold text-slate-300 uppercase">No Media</span>
                              )}
                            </div>
                         </td>
                         <td className="px-6 py-8 text-center">
                            <span className={cn(
                               "text-[8px] font-bold px-3 py-1 rounded-xl border uppercase tracking-wider",
                               room.isAvailable !== false ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                               {room.isAvailable !== false ? "Active" : "Maintenance"}
                            </span>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <div className="flex items-center justify-end gap-3">
                               <button onClick={() => handleEditClick(room)} className="p-3 rounded-2xl bg-white text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all border border-slate-100 shadow-md active:scale-95" title="Edit Room & Images"><Edit2 className="w-4 h-4" /></button>
                               <button onClick={() => handleDeleteRoom(room)} className="p-3 rounded-2xl bg-white text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all border border-slate-100 shadow-md active:scale-95" title="Soft Delete Room"><Trash2 className="w-4 h-4" /></button>
                            </div>
                         </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>

         {/* Pagination Footer */}
         {totalPages > 1 && (
            <div className="p-10 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => loadRooms(page - 1)}
                  className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => loadRooms(p)}
                    className={cn(
                      "w-8 h-8 rounded-xl text-xs font-bold transition-all",
                      p === page ? "bg-slate-900 text-white" : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => loadRooms(page + 1)}
                  className="px-4 py-2 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
         )}
      </div>

      {/* Edit Room Modal Dialog */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in scale-in duration-300">
            
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                  <h3 className="text-xl font-bold text-slate-800">Edit Room Details</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Property: {selectedRoom?.property?.title || "Undefined"}</p>
               </div>
               <button onClick={() => setEditModalOpen(false)} className="p-3 rounded-2xl bg-white text-slate-400 hover:text-rose-600 transition-all shadow-md border border-slate-100 active:scale-95">
                  <X size={18} />
               </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-10 space-y-6">
              
              {/* Owner Info Card - Pre-filled from property data */}
              {selectedRoom?.property && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {(selectedRoom.property.ownerName || "O").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Property Owner Info</p>
                    <p className="text-sm font-bold text-slate-800 leading-none">{selectedRoom.property.ownerName || "Owner"}</p>
                    {selectedRoom.property.ownerLoginId && (
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">ID: {selectedRoom.property.ownerLoginId}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      {selectedRoom.property.ownerPhone && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-lg">📞 {selectedRoom.property.ownerPhone}</span>
                      )}
                      {selectedRoom.property.ownerEmail && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-lg">✉ {selectedRoom.property.ownerEmail}</span>
                      )}
                      {selectedRoom.property.address && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">📍 {selectedRoom.property.address}</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-1.5">
                      Property: <span className="text-blue-700">{selectedRoom.property.title}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Grid 1: Basic details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room Number / Name</label>
                  <input
                    type="text"
                    required
                    value={roomForm.title}
                    onChange={e => setRoomForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rent per Bed (₹)</label>
                  <input
                    type="number"
                    required
                    value={roomForm.price}
                    onChange={e => setRoomForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Grid 2: Types */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Floor</label>
                  <select
                    value={roomForm.floor}
                    onChange={e => setRoomForm(p => ({ ...p, floor: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  >
                    <option value="">Select Floor</option>
                    {floorOptions.map(floor => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sharing Type</label>
                  <select
                    value={roomForm.sharingType}
                    onChange={e => {
                      const val = e.target.value;
                      let beds = roomForm.beds;
                      if (val === 'Single Sharing' || val === 'Private Room (No Sharing)') beds = 1;
                      else if (val === 'Double Sharing') beds = 2;
                      else if (val === 'Triple Sharing') beds = 3;
                      else if (val === 'Four Sharing') beds = 4;
                      setRoomForm(p => ({ ...p, sharingType: val, beds }));
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  >
                    <option value="">Select Sharing Type</option>
                    <option value="Single Sharing">Single Sharing</option>
                    <option value="Double Sharing">Double Sharing</option>
                    <option value="Triple Sharing">Triple Sharing</option>
                    <option value="Four Sharing">Four Sharing</option>
                    <option value="Private Room (No Sharing)">Private Room (No Sharing)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Beds / Capacity</label>
                  <input
                    type="number"
                    required
                    value={roomForm.beds}
                    onChange={e => setRoomForm(p => ({ ...p, beds: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Electricity Unit Cost (₹/Unit)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={roomForm.electricityUnitCost}
                    onChange={e => setRoomForm(p => ({ ...p, electricityUnitCost: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room Type Category</label>
                  <select
                    value={roomForm.type}
                    onChange={e => setRoomForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  >
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender Suitability</label>
                  <select
                    value={roomForm.gender}
                    onChange={e => setRoomForm(p => ({ ...p, gender: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  >
                    <option value="">Mixed / Co-ed</option>
                    <option value="male">Boys / Male Only</option>
                    <option value="female">Girls / Female Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Is Available to Rent</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="isAvailable" 
                      checked={roomForm.isAvailable} 
                      onChange={() => setRoomForm(p=>({...p,isAvailable:true}))} 
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900 accent-slate-900" 
                    /> Yes (Active)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="isAvailable" 
                      checked={!roomForm.isAvailable} 
                      onChange={() => setRoomForm(p=>({...p,isAvailable:false}))} 
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900 accent-slate-900" 
                    /> No (Under Maintenance)
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room Remarks</label>
                <textarea
                  value={roomForm.remarks}
                  onChange={e => setRoomForm(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="Additional room notes or rules..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm min-h-[80px]"
                />
              </div>

              {/* MEDIA GALLERY SECTION - IMAGES MANAGEMENT */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Room Images Manager</h4>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase">Upload, Delete, Reorder, or Set Cover Photo</p>
                  </div>
                  
                  {/* Upload Label Button */}
                  <label className={cn(
                    "cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95",
                    isUploadingMedia && "opacity-50 cursor-wait"
                  )}>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="sr-only" 
                      disabled={isUploadingMedia} 
                    />
                    <UploadCloud size={14} /> Upload Photos
                  </label>
                </div>

                {isUploadingMedia && (
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compressing & uploading image assets...</span>
                  </div>
                )}

                {/* Media list manager */}
                {roomForm.media && roomForm.media.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {roomForm.media.map((file, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-4 relative group">
                        
                        {/* Thumbnail */}
                        <img 
                          src={file.preview || file.url} 
                          alt="Room Preview" 
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white" 
                        />
                        
                        {/* Control actions */}
                        <div className="flex-1 space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {idx === 0 ? "★ COVER PHOTO" : `IMAGE ${idx + 1}`}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            {idx !== 0 && (
                              <button 
                                type="button" 
                                onClick={() => setAsCover(idx)} 
                                className="text-[8px] bg-slate-900 text-white font-bold px-2 py-1 rounded hover:bg-black transition-colors"
                              >
                                Set Cover
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveMediaIndex(idx, idx - 1)}
                              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move Up / Left"
                            >
                              <ChevronUp size={10} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === roomForm.media.length - 1}
                              onClick={() => moveMediaIndex(idx, idx + 1)}
                              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move Down / Right"
                            >
                              <ChevronDown size={10} />
                            </button>
                          </div>
                        </div>

                        {/* Image Deletion overlay button */}
                        <button
                          type="button"
                          onClick={() => deleteMedia(idx)}
                          className="absolute -top-1.5 -right-1.5 p-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-md"
                          title="Delete Photo"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                    <UploadCloud size={32} className="text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No images uploaded</p>
                    <p className="text-[9px] text-slate-400 mt-1">Upload premium visuals to attract quality bookings</p>
                  </div>
                )}
              </div>
            </form>

            {/* Modal Actions Footer */}
            <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleFormSubmit}
                disabled={isSubmitting || isUploadingMedia}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100" 
  };
  
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 flex items-start gap-4 group hover:translate-y-[-4px] transition-all duration-500">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:rotate-6 bg-white", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5 leading-none truncate">{label}</p>
         <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1.5">{value}</p>
      </div>
    </div>
  );
}
