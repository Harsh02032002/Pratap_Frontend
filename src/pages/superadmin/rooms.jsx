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
import { compressImage } from "../../utils/imageCompression";

const cn = (...classes) => classes.filter(Boolean).join(" ");

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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Rooms Management</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Manage rooms, floor layouts, and bed occupancy across properties.</p>
        </div>
        <button 
          onClick={() => loadRooms(1)}
          className="bg-white text-[#10242A] border border-[#CBD3D9] px-3.5 py-1.5 rounded-[8px] text-[13px] font-semibold shadow-xs hover:bg-[#F4F6F8] transition-all flex items-center gap-2 cursor-pointer"
        >
           <RefreshCw className={cn("w-3.5 h-3.5 text-[#4A5961]", loading && "animate-spin")} /> Refresh Rooms
        </button>
      </div>

      {/* Stats Cards Row (NO ICONS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCardHorizontal label="Total Rooms" value={stats.totalRooms} />
        <StatCardHorizontal label="Total Properties" value={stats.totalProperties} />
        <StatCardHorizontal label="Vacant Rooms" value={stats.vacantRooms} />
        <StatCardHorizontal label="Occupied Rooms" value={stats.occupiedRooms} />
        <StatCardHorizontal label="Maintenance Rooms" value={stats.maintenanceRooms} />
      </div>

      {/* Search & Filter Bar (Outside & Above Table/Cards) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
            <input 
              value={search} 
              onChange={handleSearchChange}
              placeholder="Search rooms, owners, properties..." 
              className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
            />
          </div>

          <select
            value={propertyFilter}
            onChange={e => setPropertyFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">All Properties</option>
            {properties.map(p => (
              <option key={p._id} value={p._id}>{p.title || p.name}</option>
            ))}
          </select>

          <select
            value={sharingFilter}
            onChange={e => setSharingFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
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
            className="px-3.5 py-1.5 bg-[#095256] hover:bg-[#073E42] text-white font-semibold text-[13px] rounded-[8px] shadow-xs transition-all cursor-pointer"
          >
            Search
          </button>

          {(search || propertyFilter !== "all" || sharingFilter !== "all") && (
            <button 
              type="button"
              onClick={handleClearFilters}
              className="text-[13px] font-medium text-rose-600 hover:underline px-2 cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[12px] font-medium text-[#4A5961]">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span>Vacant</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /><span>Partial</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /><span>Occupied</span></div>
        </div>
      </div>

      {/* OWNER PANEL STYLE - PROPERTY ROOM CARD GRIDS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-[#0E7C86] mb-2" />
          <p className="text-[12px] font-semibold text-[#4A5961]">Loading Room Cards...</p>
        </div>
      ) : Object.keys(groupedRooms).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs">
          <p className="text-[13px] font-semibold text-[#4A5961]">No rooms found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRooms).map(([propTitle, group]) => {
            const propRooms = group.rooms;
            const totalBeds = propRooms.reduce((acc, r) => acc + (Array.isArray(r.beds) ? r.beds.length : Number(r.beds || 1)), 0);
            const occupiedBeds = propRooms.reduce((acc, r) => {
              const assigned = Array.isArray(r.bedAssignments) ? r.bedAssignments.filter(b => b && b.tenantId).length : 0;
              return acc + assigned;
            }, 0);
            const pct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

            return (
              <div key={propTitle} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs space-y-3 overflow-hidden">
                {/* Property Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1E6EA] pb-3">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#10242A]">{propTitle}</h3>
                    <p className="text-[12px] text-[#4A5961] mt-0.5">
                      {group.property?.address || group.property?.city || "Property Location"} • {propRooms.length} Rooms • {occupiedBeds}/{totalBeds} Beds Occupied
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                      pct > 80 ? "bg-rose-50 text-rose-600 border-rose-100" : pct > 0 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      {pct}% Full
                    </span>
                  </div>
                </div>

                {/* Owner Panel Card Grid */}
                {propRooms.length === 0 ? (
                  <div className="py-6 text-center text-[12px] font-medium text-[#4A5961] bg-[#F9FAFB] rounded-[8px]">
                    No rooms listed under this property yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {propRooms.map(room => {
                      const totalRoomBeds = Array.isArray(room.beds) ? room.beds.length : Number(room.beds || 1);
                      const assignedBeds = Array.isArray(room.bedAssignments) ? room.bedAssignments.filter(b => b && b.tenantId) : [];
                      const occCount = assignedBeds.length;
                      const roomPct = totalRoomBeds > 0 ? Math.round((occCount / totalRoomBeds) * 100) : 0;

                      const rawNo = (room.title || room.number || "Room").toString().trim();
                      const cleanRoomNo = rawNo.replace(/^room\s*/i, "").trim() || rawNo;
                      const roomDisplayName = rawNo.toLowerCase().startsWith("room") ? rawNo : `Room ${rawNo}`;

                      return (
                        <div key={room._id || room.id} className="bg-[#F9FAFB] border border-[#E1E6EA] rounded-[10px] p-3.5 hover:border-[#CBD3D9] transition-all flex flex-col justify-between space-y-2.5">
                          
                          {/* Card Header */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5 gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-7 h-7 rounded-[6px] bg-[#095256] text-white flex items-center justify-center font-bold text-[11px] shrink-0 uppercase">
                                  {cleanRoomNo}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="text-[13px] font-bold text-[#10242A] leading-none truncate">{roomDisplayName}</h4>
                                  <p className="text-[11px] text-[#4A5961] mt-1 leading-none">{room.floor || "Ground Floor"}</p>
                                </div>
                              </div>
                              <span className="text-[13px] font-bold text-[#10242A] shrink-0">
                                ₹{(room.price || room.rent || 0).toLocaleString('en-IN')}<span className="text-[10px] font-normal text-[#4A5961]">/bed</span>
                              </span>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-1.5 my-2">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#E6F4F5] text-[#0E7C86]">{room.sharingType || "Double Sharing"}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-white border border-[#E1E6EA] text-[#4A5961]">{room.type || "AC"}</span>
                              {room.gender && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-purple-50 text-purple-600">{room.gender}</span>
                              )}
                            </div>

                            {/* Occupancy Progress Bar */}
                            <div className="mt-2.5 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-semibold">
                                <span className="text-[#4A5961]">Occupancy</span>
                                <span className={cn(
                                  roomPct === 100 ? "text-rose-600" : roomPct > 0 ? "text-amber-600" : "text-emerald-600"
                                )}>
                                  {occCount}/{totalRoomBeds} Beds ({roomPct}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-[#E1E6EA] rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full transition-all", roomPct === 100 ? "bg-rose-500" : roomPct > 0 ? "bg-amber-500" : "bg-emerald-500")}
                                  style={{ width: `${roomPct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bed Badges & Actions */}
                          <div className="border-t border-[#E1E6EA] pt-2.5 flex items-center justify-between gap-2 mt-1.5">
                            <div className="flex flex-wrap items-center gap-1 max-w-[75%]">
                              {Array.from({ length: totalRoomBeds }, (_, bIdx) => {
                                const isOcc = bIdx < occCount;
                                const bedTenant = assignedBeds[bIdx];
                                return (
                                  <span 
                                    key={bIdx} 
                                    title={isOcc ? `Occupied by: ${bedTenant?.tenantName || 'Tenant'}` : 'Vacant Bed'}
                                    className={cn(
                                      "w-5 h-5 rounded-[4px] text-[9px] font-bold flex items-center justify-center border",
                                      isOcc ? "bg-[#095256] text-white border-[#095256]" : "bg-white text-[#4A5961] border-[#CBD3D9]"
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
                                className="w-7 h-7 rounded-[6px] bg-white border border-[#CBD3D9] text-[#4A5961] hover:text-[#10242A] hover:bg-[#F4F6F8] flex items-center justify-center transition-all cursor-pointer"
                                title="Edit Room"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteRoom(room)}
                                className="w-7 h-7 rounded-[6px] bg-white border border-[#CBD3D9] text-[#4A5961] hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer"
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

function StatCardHorizontal({ label, value }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
      <div className="mt-2">
        <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  );
}
