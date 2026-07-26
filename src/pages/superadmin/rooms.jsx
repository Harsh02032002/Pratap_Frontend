import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, Search, Filter, RefreshCw, LayoutGrid, Eye, Trash2, 
  X, Edit2, Loader2, ArrowUpRight, ArrowDownRight, BedDouble, 
  Home, ShieldAlert, CheckCircle, HelpCircle, UploadCloud, ChevronUp, ChevronDown, 
  Star, ClipboardList, Thermometer, Wifi, Plus, Check, Tv, Wind, 
  ShowerHead, DoorClosed, Refrigerator, Shield, Trash, List, EyeOff, LayoutTemplate, Layers
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

  // Global stats
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
        limit: 100,
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

  // Group rooms by property for owner-style card sections
  const groupedRooms = useMemo(() => {
    const map = {};
    properties.forEach(p => {
      map[p.title || p.name || "Property"] = { property: p, rooms: [] };
    });

    rooms.forEach(room => {
      const propTitle = room.property?.title || room.property?.name || room.propertyTitle || "Unassigned Property";
      if (!map[propTitle]) {
        map[propTitle] = { property: room.property || { title: propTitle }, rooms: [] };
      }
      map[propTitle].rooms.push(room);
    });

    return map;
  }, [rooms, properties]);

  const floorOptions = ["Basement", "Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor"];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Rooms Management"
        subtitle="Manage rooms, floor layouts, and bed occupancy across properties."
        actions={
          <button 
            onClick={() => loadRooms(1)}
            className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
             <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh Rooms
          </button>
        }
      />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCardHorizontal label="Total Rooms" value={stats.totalRooms} icon={Home} color="blue" />
        <StatCardHorizontal label="Total Properties" value={stats.totalProperties} icon={Building2} color="indigo" />
        <StatCardHorizontal label="Vacant Rooms" value={stats.vacantRooms} icon={CheckCircle} color="emerald" />
        <StatCardHorizontal label="Occupied Rooms" value={stats.occupiedRooms} icon={BedDouble} color="blue" />
        <StatCardHorizontal label="Maintenance Rooms" value={stats.maintenanceRooms} icon={ShieldAlert} color="amber" />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              value={search} 
              onChange={handleSearchChange}
              placeholder="Search rooms, owners, properties..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
            />
          </div>

          <select
            value={propertyFilter}
            onChange={e => setPropertyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer"
          >
            <option value="all">All Properties</option>
            {properties.map(p => (
              <option key={p._id} value={p._id}>{p.title || p.name}</option>
            ))}
          </select>

          <select
            value={sharingFilter}
            onChange={e => setSharingFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer"
          >
            <option value="all">All Sharing Types</option>
            <option value="Single Sharing">Single Sharing</option>
            <option value="Double Sharing">Double Sharing</option>
            <option value="Triple Sharing">Triple Sharing</option>
            <option value="Four Sharing">Four Sharing</option>
            <option value="Private Room (No Sharing)">Private Room</option>
          </select>

          <button 
            type="submit" 
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Search
          </button>

          {(search || propertyFilter !== "all" || sharingFilter !== "all") && (
            <button 
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-bold text-rose-600 hover:underline px-2"
            >
              Reset
            </button>
          )}
        </form>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-slate-500">Vacant</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-slate-500">Partial</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span className="text-slate-500">Occupied</span></div>
        </div>
      </div>

      {/* OWNER PANEL STYLE - PROPERTY ROOM CARD GRIDS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Room Cards...</p>
        </div>
      ) : Object.keys(groupedRooms).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Home className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-600">No rooms found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRooms).map(([propTitle, group]) => {
            const propRooms = group.rooms;
            const totalBeds = propRooms.reduce((acc, r) => acc + (Array.isArray(r.beds) ? r.beds.length : Number(r.beds || 1)), 0);
            const occupiedBeds = propRooms.reduce((acc, r) => {
              const assigned = Array.isArray(r.bedAssignments) ? r.bedAssignments.filter(b => b && b.tenantId).length : 0;
              return acc + assigned;
            }, 0);
            const pct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

            return (
              <div key={propTitle} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                {/* Property Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">{propTitle}</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      {group.property?.address || group.property?.city || "Property Location"} • {propRooms.length} Rooms • {occupiedBeds}/{totalBeds} Beds Occupied
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold border",
                      pct > 80 ? "bg-rose-50 text-rose-600 border-rose-100" : pct > 0 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      {pct}% Full
                    </span>
                  </div>
                </div>

                {/* Owner Panel Card Grid */}
                {propRooms.length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-slate-400 bg-slate-50/50 rounded-xl">
                    No rooms listed under this property yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {propRooms.map(room => {
                      const totalRoomBeds = Array.isArray(room.beds) ? room.beds.length : Number(room.beds || 1);
                      const assignedBeds = Array.isArray(room.bedAssignments) ? room.bedAssignments.filter(b => b && b.tenantId) : [];
                      const occCount = assignedBeds.length;
                      const roomPct = totalRoomBeds > 0 ? Math.round((occCount / totalRoomBeds) * 100) : 0;

                      const rawNo = (room.title || room.number || "Room").toString().trim();
                      const cleanRoomNo = rawNo.replace(/^room\s*/i, "").trim() || rawNo;
                      const roomDisplayName = rawNo.toLowerCase().startsWith("room") ? rawNo : `Room ${rawNo}`;

                      return (
                        <div key={room._id || room.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                          
                          {/* Card Header */}
                          <div>
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-[11px] shadow-sm shrink-0 uppercase tracking-tighter">
                                  {cleanRoomNo}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-extrabold text-slate-900 leading-none truncate">{roomDisplayName}</h4>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">{room.floor || "Ground Floor"}</p>
                                </div>
                              </div>
                              <span className="text-xs font-black text-slate-900 shrink-0">
                                ₹{(room.price || room.rent || 0).toLocaleString('en-IN')}<span className="text-[9px] font-medium text-slate-400">/bed</span>
                              </span>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-1.5 my-2">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">{room.sharingType || "Double Sharing"}</span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">{room.type || "AC"}</span>
                              {room.gender && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-600">{room.gender}</span>
                              )}
                            </div>

                            {/* Occupancy Progress Bar */}
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-slate-500">Occupancy</span>
                                <span className={cn(
                                  roomPct === 100 ? "text-rose-600" : roomPct > 0 ? "text-amber-600" : "text-emerald-600"
                                )}>
                                  {occCount}/{totalRoomBeds} Beds ({roomPct}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full transition-all", roomPct === 100 ? "bg-rose-500" : roomPct > 0 ? "bg-amber-500" : "bg-emerald-500")}
                                  style={{ width: `${roomPct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bed Badges & Actions */}
                          <div className="border-t border-slate-200 pt-3 flex items-center justify-between gap-2 mt-2">
                            <div className="flex flex-wrap items-center gap-1 max-w-[75%]">
                              {Array.from({ length: totalRoomBeds }, (_, bIdx) => {
                                const isOcc = bIdx < occCount;
                                const bedTenant = assignedBeds[bIdx];
                                return (
                                  <span 
                                    key={bIdx} 
                                    title={isOcc ? `Occupied by: ${bedTenant?.tenantName || 'Tenant'}` : 'Vacant Bed'}
                                    className={cn(
                                      "w-5 h-5 rounded-md text-[8px] font-bold flex items-center justify-center border",
                                      isOcc ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-400 border-slate-200"
                                    )}
                                  >
                                    B{bIdx + 1}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleEditClick(room)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center shadow-sm transition-all"
                                title="Edit Room"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteRoom(room)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center shadow-sm transition-all"
                                title="Delete Room"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Room Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <div>
                  <h3 className="text-base font-bold text-slate-800">Edit Room</h3>
                  <p className="text-xs font-semibold text-slate-400">Property: {selectedRoom?.property?.title || "Undefined"}</p>
               </div>
               <button onClick={() => setEditModalOpen(false)} className="p-2 rounded-xl bg-white text-slate-400 hover:text-slate-700 transition-all border border-slate-200">
                  <X size={16} />
               </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Room Number / Name</label>
                  <input
                    type="text"
                    required
                    value={roomForm.title}
                    onChange={e => setRoomForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Rent per Bed (₹)</label>
                  <input
                    type="number"
                    required
                    value={roomForm.price}
                    onChange={e => setRoomForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Floor</label>
                  <select
                    value={roomForm.floor}
                    onChange={e => setRoomForm(p => ({ ...p, floor: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="">Select Floor</option>
                    {floorOptions.map(floor => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sharing Type</label>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="">Select Sharing Type</option>
                    <option value="Single Sharing">Single Sharing</option>
                    <option value="Double Sharing">Double Sharing</option>
                    <option value="Triple Sharing">Triple Sharing</option>
                    <option value="Four Sharing">Four Sharing</option>
                    <option value="Private Room (No Sharing)">Private Room</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">AC Type</label>
                  <select
                    value={roomForm.type}
                    onChange={e => setRoomForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gender Suitability</label>
                  <select
                    value={roomForm.gender}
                    onChange={e => setRoomForm(p => ({ ...p, gender: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="">Mixed / Co-ed</option>
                    <option value="male">Boys / Male Only</option>
                    <option value="female">Girls / Female Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Remarks</label>
                <textarea
                  value={roomForm.remarks}
                  onChange={e => setRoomForm(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="Additional notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none min-h-[60px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCardHorizontal({ label, value, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100", 
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100" 
  };
  
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-start gap-3 group hover:translate-y-[-2px] transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-none truncate">{label}</p>
         <p className="text-xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );
}
