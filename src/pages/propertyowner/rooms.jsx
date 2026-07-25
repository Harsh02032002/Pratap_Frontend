import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { X, Plus, Building2, ChevronDown, UploadCloud, Loader2, Wind, Table as TableIcon, Tv, Bath, LayoutTemplate, Refrigerator, DoorClosed, Armchair, Utensils, Microwave, Flame, Shirt, Video, Fan, Check, Edit2, Trash2, BedDouble, Home, Layers } from "lucide-react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getApiBase, getAuthHeader } from "../../utils/api";
import {
  assignTenant, clearOwnerFetchCache, clearOwnerRuntimeSession, createRoom, updateRoom, deleteRoom, bulkCreateRooms,
  fetchOwnerProperties, fetchOwnerRooms, fetchOwnerTenants, getOwnerRuntimeSession
} from "../../utils/propertyowner";

const cn = (...c) => c.filter(Boolean).join(" ");

const toLegacyBeds = (room) => {
  let targetCount = 0;
  if (room?.sharingType) {
    const sType = String(room.sharingType).trim();
    if (sType === 'Single Sharing' || sType === 'Private Room (No Sharing)') targetCount = 1;
    else if (sType === 'Double Sharing') targetCount = 2;
    else if (sType === 'Triple Sharing') targetCount = 3;
    else if (sType === 'Four Sharing') targetCount = 4;
  }
  if (!targetCount) {
    targetCount = typeof room?.beds === 'number' ? room.beds : (Array.isArray(room?.beds) ? room.beds.length : 0);
  }
  if (!targetCount && room?.capacity) targetCount = Number(room.capacity);
  if (!targetCount && room?.totalBeds) targetCount = Number(room.totalBeds);
  if (!targetCount) targetCount = 1;

  let rawBeds = Array.isArray(room?.beds) && typeof room.beds[0] === 'object' && 'status' in room.beds[0]
    ? room.beds
    : [];

  const assignments = room?.bedAssignments || room?.bedsInfo || [];
  
  return Array.from({ length: targetCount }, (_, i) => {
    if (rawBeds[i]) return rawBeds[i];
    const a = assignments[i];
    const tid = a?.tenantId;
    const hasOccupant = !!(a && (a.tenantName || a.name || (tid && String(tid).length > 0 && String(tid) !== '[object Object]')));
    return hasOccupant
      ? { status: "occupied", tenantId: tid ? String(tid) : null, tenantName: a.tenantName || a.name || null }
      : { status: "available", tenantId: null, tenantName: null };
  });
};


const normalizeRoom = (room, ownerId, properties = []) => {
  const number = room?.number || room?.roomNo || room?.title || "Room";
  let bedCount = typeof room?.beds === 'number' ? room.beds : (Array.isArray(room?.beds) ? room.beds.length : 1);
  if (room?.sharingType === 'Single Sharing' || room?.sharingType === 'Private Room (No Sharing)') bedCount = 1;
  else if (room?.sharingType === 'Double Sharing') bedCount = 2;
  else if (room?.sharingType === 'Triple Sharing') bedCount = 3;
  else if (room?.sharingType === 'Four Sharing') bedCount = 4;

  let gender = room?.gender || room?.roomGender || "";
  const propId = room?.propertyId || room?.property?._id || "";
  const propTitle = room?.propertyTitle || room?.property?.title || "";
  const targetProp = (Array.isArray(properties) ? properties : []).find(p =>
    (p._id && String(p._id) === String(propId)) ||
    (p.id && String(p.id) === String(propId)) ||
    (p.title && propTitle && p.title.trim().toLowerCase() === propTitle.trim().toLowerCase()) ||
    (p.name && propTitle && p.name.trim().toLowerCase() === propTitle.trim().toLowerCase())
  );

  if (targetProp) {
    const pGender = String(targetProp.gender || targetProp.genderSuitability || targetProp.propertyDetails?.genderPref || targetProp.pgType || targetProp.propertyType || "").toLowerCase();
    const pTitle = String(targetProp.title || targetProp.name || "").toLowerCase();
    const pCat = String(targetProp.propertyCategory || targetProp.category || "").toLowerCase();

    if (pGender.includes("female") || pGender.includes("girl") || pGender === "female" || pTitle.includes("girls") || pTitle.includes("female") || pCat.includes("girls") || pCat.includes("female")) {
      if (!gender || gender === "Mixed" || gender === "Co-ed" || gender === "any") {
        gender = "Female";
      }
    } else if (pGender.includes("male") || pGender.includes("boy") || pGender === "male" || pTitle.includes("boys") || pTitle.includes("male") || pCat.includes("boys") || pCat.includes("male")) {
      if (!gender || gender === "Mixed" || gender === "Co-ed" || gender === "any") {
        gender = "Male";
      }
    }
  }

  return {
    ...room,
    id: room?.id || room?._id || `R-${Date.now()}`,
    _id: room?._id || room?.id || null,
    ownerLoginId: room?.ownerLoginId || ownerId,
    propertyId: propId,
    propertyTitle: propTitle,
    number, roomNo: number, title: number,
    type: room?.type || room?.roomType || "AC",
    rent: Number(room?.rent ?? room?.price ?? room?.roomRent ?? 0),
    gender: gender || "Co-ed",
    beds: toLegacyBeds({ ...room, beds: bedCount }),
  };
};

const readJson = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };

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

export default function Rooms() {
  const location = useLocation();
  const [owner, setOwner] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const defaultRoomForm = { roomNo: "", unitType: "", floor: "", sharingType: "", roomRent: "", remarks: "", isAvailable: true, facilities: [], roomTypeFeatures: [], media: [], roomType: "AC", roomGender: "", roomBeds: 2, electricityUnitCost: 0, meterReadings: [] };
  const [roomForm, setRoomForm] = useState(defaultRoomForm);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    propertyId: "",
    prefix: "Room ",
    startNumber: 101,
    count: 5,
    unitType: "Room",
    floor: "1st Floor",
    sharingType: "Double Sharing",
    roomRent: 2000,
    roomGender: "Mixed",
    facilities: ["WiFi", "AC"]
  });
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [assignMode, setAssignMode] = useState("existing");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBedIndex, setSelectedBedIndex] = useState(null);
  const [selectedBedOccupied, setSelectedBedOccupied] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [newTenantForm, setNewTenantForm] = useState({ name: "", phone: "", email: "" });
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    const propId = bulkForm.propertyId || currentProperty?._id || "";
    if (!propId) {
      toast.error("Please select a property");
      return;
    }
    const totalCount = Number(bulkForm.count || 1);
    const startNum = Number(bulkForm.startNumber || 101);
    let bedCount = 2;
    if (bulkForm.sharingType === 'Single Sharing' || bulkForm.sharingType === 'Private Room (No Sharing)') bedCount = 1;
    else if (bulkForm.sharingType === 'Double Sharing') bedCount = 2;
    else if (bulkForm.sharingType === 'Triple Sharing') bedCount = 3;
    else if (bulkForm.sharingType === 'Four Sharing') bedCount = 4;

    const roomItems = [];
    for (let i = 0; i < totalCount; i++) {
      const roomNum = startNum + i;
      const title = `${bulkForm.prefix || ""}${roomNum}`;
      roomItems.push({
        title,
        roomNo: title,
        unitType: bulkForm.unitType,
        floor: bulkForm.floor,
        sharingType: bulkForm.sharingType,
        price: Number(bulkForm.roomRent || 0),
        rent: Number(bulkForm.roomRent || 0),
        beds: bedCount,
        capacity: bedCount,
        totalBeds: bedCount,
        gender: bulkForm.roomGender,
        isAvailable: true,
        facilities: bulkForm.facilities,
        status: "active"
      });
    }

    try {
      setIsBulkSubmitting(true);
      await bulkCreateRooms({ propertyId: propId, rooms: roomItems, ownerLoginId: owner.loginId });
      toast.success(`${totalCount} Rooms created successfully!`);
      setBulkModalOpen(false);
      clearOwnerFetchCache(owner.loginId);
      await load(owner, 1, ROOMS_PER_PAGE, true);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to create bulk rooms");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploadingMedia(true);
    try {
      const uploadedMedia = [];
      const token = localStorage.getItem("token") || localStorage.getItem("roomhy_owner_token") || localStorage.getItem("owner_token") || localStorage.getItem("user_token");
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : getAuthHeader();

      for (const file of files) {
        let fileToUpload = file;
        try {
          fileToUpload = await compressImage(file);
        } catch (cErr) {
          console.warn("Compress failed, using original file", cErr);
        }
        const formData = new FormData();
        formData.append("image", fileToUpload);
        const res = await fetch(`${getApiBase()}/api/upload`, {
          method: "POST",
          headers: authHeaders,
          body: formData,
        });
        const data = await res.json();
        const mediaUrl = data.url || data.filePath || data.location || data.fileUrl;
        if (mediaUrl) {
          uploadedMedia.push({
            url: mediaUrl,
            type: file.type.startsWith("video/") ? "video" : "image",
            uploadedAt: new Date().toISOString()
          });
        } else {
          console.warn("Upload response missing mediaUrl:", data);
        }
      }

      if (uploadedMedia.length > 0) {
        setRoomForm(prev => ({
          ...prev,
          media: [...(prev.media || []), ...uploadedMedia]
        }));
        toast.success(`${uploadedMedia.length} photo(s) uploaded successfully!`);
      } else {
        toast.error("Failed to upload photo. Please try again.");
      }
    } catch (err) {
      console.error("Room media upload error:", err);
      toast.error("Failed to upload photos");
    } finally {
      setIsUploadingMedia(false);
      e.target.value = "";
    }
  };

  const handleRemoveMedia = (index) => {
    setRoomForm(prev => ({
      ...prev,
      media: (prev.media || []).filter((_, i) => i !== index)
    }));
  };

  const [showFilter, setShowFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [clientPage, setClientPage] = useState(1);
  const [propPages, setPropPages] = useState({});
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [floorFilter, setFloorFilter] = useState("all");
  const [sharingFilter, setSharingFilter] = useState("all");
  const ROOMS_PER_PAGE = 5;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentProperty = useMemo(() => properties[0] || null, [properties]);
  const currentPropertyDisplay = useMemo(() => {
    const title = currentProperty?.title || currentProperty?.name || owner?.propertyName || "";
    const loc = currentProperty?.city || currentProperty?.area || currentProperty?.locationCode || "";
    return title ? (loc ? `${title} (${loc})` : title) : "Loading…";
  }, [currentProperty, owner]);
  const currentPropertyLocation = useMemo(() => currentProperty?.city || currentProperty?.area || "", [currentProperty]);

  const mergeRooms = (ownerId, backendRooms) =>
    (backendRooms || []).map(r => normalizeRoom(r, ownerId, properties));

  const handlePropertyPageChange = async (propTitle, propId, newPage) => {
    setPropPages(prev => ({ ...prev, [propTitle]: newPage }));

    const currentPropRoomsCount = rooms.filter(r => r.propertyId === propId).length;
    const expectedRoomsCount = newPage * ROOMS_PER_PAGE;
    const totalPropRooms = propertyTotals[propId] || currentPropRoomsCount;

    if (currentPropRoomsCount < expectedRoomsCount && currentPropRoomsCount < totalPropRooms) {
      try {
        const { fetchRoomsByPropertyId } = require("../../utils/propertyowner");
        const res = await fetchRoomsByPropertyId(propId, newPage, ROOMS_PER_PAGE);
        if (res.rooms && res.rooms.length > 0) {
          const normalizedNewRooms = res.rooms.map(r => normalizeRoom(r, owner?.loginId, properties));
          setRooms(prev => {
            const newRooms = [...prev];
            normalizedNewRooms.forEach(nr => {
              if (!newRooms.find(x => (x._id || x.id) === (nr._id || nr.id))) {
                newRooms.push(nr);
              }
            });
            return newRooms;
          });
        }
      } catch (e) {
        console.error("Failed to fetch more rooms", e);
      }
    }
  };

  const [propertyTotals, setPropertyTotals] = useState({});

  const load = async (session, page = 1, limit = 5, skipCache = false) => {
    setLoading(true);
    try {
      const [props, roomData, tList] = await Promise.all([
        fetchOwnerProperties(session.loginId),
        fetchOwnerRooms(session.loginId, page, limit, skipCache),
        fetchOwnerTenants(session.loginId),
      ]);
      setProperties(props);
      const merged = mergeRooms(session.loginId, roomData.rooms || []);
      setRooms(merged);
      writeJson("roomhy_rooms", merged);
      setTenants(tList);
      setPropertyTotals(roomData.propertyTotals || {});
    } catch (e) {
      setErrorMsg(e?.body || e?.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const s = getOwnerRuntimeSession();
    if (!s?.loginId) { window.location.href = "/propertyowner/ownerlogin"; return; }
    setOwner(s);
    load(s, 1, ROOMS_PER_PAGE);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "add") {
      setRoomForm(defaultRoomForm);
      setRoomModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.search]);

  const openAssignModal = (room, bedIdx) => {
    const beds = toLegacyBeds(room);
    const bed = beds[bedIdx];
    const isOccupied = !!(bed?.status === "occupied" || bed?.tenantId);
    setSelectedRoom(room);
    setSelectedBedIndex(bedIdx);
    setSelectedBedOccupied(isOccupied);
    setSelectedTenantId("");
    setNewTenantForm({ name: "", phone: "", email: "" });
    setAssignMode("existing");
    setAssignModalOpen(true);
  };

  const handleAddTenant = (room) => {
    const beds = toLegacyBeds(room);
    const occupiedBed = beds.find(b => b.status === "occupied" || b.tenantId);
    const tenantId = occupiedBed?.tenantId || "";
    setSelectedRoom(room);
    setSelectedBedIndex(beds.findIndex(b => b.tenantId === tenantId));
    setSelectedBedOccupied(!!occupiedBed);
    setSelectedTenantId(tenantId);
    if (tenantId) {
      const t = tenants.find(x => (x._id || x.id) === tenantId);
      if (t) setNewTenantForm({ name: t.name || "", phone: t.phone || "", email: t.email || "" });
    } else {
      setNewTenantForm({ name: "", phone: "", email: "" });
    }
    setAssignMode("existing");
    setAssignModalOpen(true);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!owner?.loginId) return;

    const propId = currentProperty?._id || "";
    if (!propId && !roomForm._id) {
      setErrorMsg("Please wait for properties to load or add a property first.");
      return;
    }

    try {
      setErrorMsg("");
      const bedCount = Number(roomForm.roomBeds || 1);

      const payload = {
        propertyId: propId,
        title: roomForm.roomNo,
        type: roomForm.roomType,
        price: Number(roomForm.roomRent || 0),
        beds: bedCount,
        gender: roomForm.roomGender,
        ownerLoginId: owner.loginId,
        unitType: roomForm.unitType,
        floor: roomForm.floor,
        sharingType: roomForm.sharingType,
        remarks: roomForm.remarks,
        isAvailable: roomForm.isAvailable,
        facilities: roomForm.facilities,
        roomTypeFeatures: roomForm.roomTypeFeatures,
        media: roomForm.media,
        electricityUnitCost: Number(roomForm.electricityUnitCost || 0)
      };

      if (roomForm._id) {
        await updateRoom(roomForm._id, payload);
        setErrorMsg("");
        setRoomModalOpen(false);
        setRoomForm(defaultRoomForm);
        clearOwnerFetchCache(owner.loginId);
        await load(owner, 1, ROOMS_PER_PAGE, true);
        toast.success("Room updated");
      } else {
        const created = await createRoom(payload);
        setErrorMsg("");
        setRoomModalOpen(false);
        setRoomForm(defaultRoomForm);
        if (created?._id || created?.id) {
          setRooms(prev => [...prev, normalizeRoom(created, owner.loginId)]);
        }
        clearOwnerFetchCache(owner.loginId);
        await load(owner, 1, ROOMS_PER_PAGE, true);
        toast.success("Room added");
      }
    } catch (e) { setErrorMsg(e?.message || "Failed."); }
  };

  const handleEditRoom = (room) => {
    let sType = room.sharingType || "";
    let bedCount = 2;
    if (sType === 'Single Sharing' || sType === 'Private Room (No Sharing)') bedCount = 1;
    else if (sType === 'Double Sharing') bedCount = 2;
    else if (sType === 'Triple Sharing') bedCount = 3;
    else if (sType === 'Four Sharing') bedCount = 4;
    else {
      const bedsArr = toLegacyBeds(room);
      bedCount = bedsArr.length;
      if (bedCount === 1) sType = "Single Sharing";
      else if (bedCount === 2) sType = "Double Sharing";
      else if (bedCount === 3) sType = "Triple Sharing";
      else if (bedCount === 4) sType = "Four Sharing";
      else if (bedCount > 4) sType = "Custom";
    }

    setRoomForm({
      ...defaultRoomForm,
      ...room,
      roomNo: room.number || room.roomNo || room.title || "",
      roomType: room.type || "AC",
      roomRent: room.rent || room.price || "",
      roomGender: room.gender || "",
      roomBeds: bedCount,
      electricityUnitCost: room.electricity?.unitCost || room.electricityUnitCost || 0,
      unitType: room.unitType || "Room",
      floor: room.floor || "",
      sharingType: sType,
      remarks: room.remarks || "",
      facilities: room.facilities || [],
      roomTypeFeatures: room.roomTypeFeatures || [],
      media: room.media || []
    });
    setRoomModalOpen(true);
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Are you sure you want to delete room ${room.number || room.title}?`)) return;
    const roomId = room._id || room.id;
    try {
      setErrorMsg("");
      setRooms(prev => prev.filter(r => (r._id || r.id) !== roomId));
      await deleteRoom(roomId, owner.loginId);
      clearOwnerFetchCache(owner.loginId);
      await load(owner, 1, ROOMS_PER_PAGE, true);
      toast.success("Room deleted");
    } catch (e) {
      setErrorMsg(e?.message || "Failed to delete room.");
      await load(owner, 1, ROOMS_PER_PAGE, true);
    }
  };

  const handleAssignTenant = async (e) => {
    e.preventDefault();
    if (!owner?.loginId || !selectedRoom) return;
    if (isAssigning) return;

    if (!window.confirm(`Are you sure you want to assign this tenant to Room ${selectedRoom.number || selectedRoom.roomNo}, Bed ${Number(selectedBedIndex) + 1}?`)) {
      return;
    }

    try {
      setIsAssigning(true);
      setErrorMsg("");
      const roomNo = selectedRoom.number || selectedRoom.roomNo || "";
      const agreedRent = Number(selectedRoom.rent || 0);
      const moveInDate = new Date().toISOString().split("T")[0];

      const t = tenants.find(x => (x._id || x.id) === selectedTenantId);
      if (!t) { setErrorMsg("Select a tenant."); setIsAssigning(false); return; }

      const payload = {
        name: t.name,
        phone: t.phone,
        email: t.email,
        propertyId: currentProperty?._id || "",
        roomNo,
        bedNo: Number(selectedBedIndex) + 1,
        moveInDate,
        agreedRent,
        ownerLoginId: owner.loginId
      };

      await assignTenant(payload);
      setAssignModalOpen(false);
      clearOwnerFetchCache(owner.loginId);
      await load(owner);
    } catch (e) {
      setErrorMsg(e?.body || e?.message || "Failed.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Group rooms by property
  const grouped = useMemo(() => {
    const g = {};
    // Pre-fill properties so even properties with 0 rooms show up
    properties.forEach(p => {
      g[p.title || p.name || "Your Property"] = [];
    });

    const filteredRooms = rooms.filter(r => {
      // Show filter (vacant means has at least one vacant bed, occupied means has at least one occupied bed)
      if (showFilter === "vacant" && !r.beds.some(b => b.status === 'available')) return false;
      if (showFilter === "occupied" && !r.beds.some(b => b.status === 'occupied')) return false;
      // Floor filter
      if (floorFilter !== "all" && r.floor !== floorFilter) return false;
      // Sharing filter
      if (sharingFilter !== "all" && r.sharingType !== sharingFilter) return false;
      return true;
    });

    filteredRooms.forEach(r => {
      const k = r.propertyTitle || r.propertyId || "Your Property";
      if (!g[k]) g[k] = [];
      g[k].push(r);
    });
    return g;
  }, [rooms, showFilter, floorFilter, sharingFilter, properties]);

  const roomStats = useMemo(() => {
    const totalBeds = rooms.reduce((s, r) => s + (r.beds?.length || 0), 0);
    const vacantBeds = rooms.reduce((s, r) => s + r.beds.filter(b => b.status === 'available').length, 0);
    const occupiedBeds = rooms.reduce((s, r) => s + r.beds.filter(b => b.status === 'occupied').length, 0);
    const vacantRooms = rooms.filter(r => r.beds.filter(b => b.status === 'available').length > 0).length;
    const occupiedRooms = rooms.filter(r => r.beds.filter(b => b.status === 'occupied').length > 0).length;
    return { totalBeds, vacantBeds, occupiedBeds, vacantRooms, occupiedRooms };
  }, [rooms]);

  const floorOptions = useMemo(
    () => Array.from(new Set(rooms.map(r => r.floor).filter(Boolean))),
    [rooms]
  );

  const assignedIds = useMemo(
    () => new Set(assignModalOpen ? rooms.flatMap(r => toLegacyBeds(r).map(b => b.tenantId).filter(Boolean)) : []),
    [rooms, assignModalOpen]
  );

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Rooms & Beds" 
      rooms={rooms} 
      loading={loading} 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }} 
      contentClassName="max-w-7xl mx-auto"
    >

      {/* Header */}
      {/* Stats Panel */}
      {/* Stats Panel */}
      <div className="flex overflow-x-auto snap-x gap-3 pb-3 mb-6 no-scrollbar scroll-smooth md:grid md:grid-cols-3 lg:grid-cols-6 md:pb-0">
        <div className="w-[38%] md:w-auto shrink-0 snap-start bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[90px] md:min-h-[120px] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div className="mt-3">
            <h3 className="text-[22px] font-black text-slate-900 leading-tight">{rooms.length}</h3>
            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">Total Rooms</p>
          </div>
        </div>
        <div className="w-[38%] md:w-auto shrink-0 snap-start bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[90px] md:min-h-[120px] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BedDouble size={20} />
          </div>
          <div className="mt-3">
            <h3 className="text-[22px] font-black text-slate-900 leading-tight">{roomStats.totalBeds}</h3>
            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">Total Beds</p>
          </div>
        </div>
        <div className="w-[38%] md:w-auto shrink-0 snap-start bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[90px] md:min-h-[120px] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BedDouble size={20} />
          </div>
          <div className="mt-3">
            <h3 className="text-[22px] font-black text-slate-900 leading-tight">{roomStats.vacantBeds}</h3>
            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">Vacant Beds</p>
          </div>
        </div>
        <div className="w-[38%] md:w-auto shrink-0 snap-start bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[90px] md:min-h-[120px] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <BedDouble size={20} />
          </div>
          <div className="mt-3">
            <h3 className="text-[22px] font-black text-slate-900 leading-tight">{roomStats.occupiedBeds}</h3>
            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">Occupied Beds</p>
          </div>
        </div>
        <div className="w-[38%] md:w-auto shrink-0 snap-start bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[90px] md:min-h-[120px] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Home size={20} />
          </div>
          <div className="mt-3">
            <h3 className="text-[22px] font-black text-slate-900 leading-tight">{roomStats.vacantRooms}</h3>
            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">Vacant Rooms</p>
          </div>
        </div>
        <div className="w-[38%] md:w-auto shrink-0 snap-start bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[90px] md:min-h-[120px] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div className="mt-3">
            <h3 className="text-[22px] font-black text-slate-900 leading-tight">{roomStats.occupiedRooms}</h3>
            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">Occupied Rooms</p>
          </div>
        </div>
      </div>
      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-muted-foreground">Show:</span>
            <select value={showFilter} onChange={e => setShowFilter(e.target.value)} className="bg-card border border-border rounded-lg px-2 py-1 text-[12px] outline-none focus:ring-1 focus:ring-primary">
              <option value="all">All Rooms</option>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-muted-foreground">Floor:</span>
            <select value={floorFilter} onChange={e => setFloorFilter(e.target.value)} className="bg-card border border-border rounded-lg px-2 py-1 text-[12px] outline-none focus:ring-1 focus:ring-primary max-w-[100px]">
              <option value="all">All Floors</option>
              {floorOptions.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-muted-foreground">Sharing:</span>
            <select value={sharingFilter} onChange={e => setSharingFilter(e.target.value)} className="bg-card border border-border rounded-lg px-2 py-1 text-[12px] outline-none focus:ring-1 focus:ring-primary max-w-[120px]">
              <option value="all">All Sharing</option>
              <option value="Single Sharing">Single</option>
              <option value="Double Sharing">Double</option>
              <option value="Triple Sharing">Triple</option>
              <option value="Four Sharing">Four</option>
              <option value="Private Room (No Sharing)">Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-card p-4 rounded-xl border border-border mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Room status colors */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="text-muted-foreground font-medium mr-1">Room Occupancy:</span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Fully Vacant (0% Filled)
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-orange-300 bg-orange-50 text-orange-800 text-[11px] font-bold">
              <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" /> Partially Occupied
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-rose-300 bg-rose-50 text-rose-700 text-[11px] font-bold">
              <span className="size-1.5 rounded-full bg-rose-500" /> Fully Occupied (100% Filled)
            </span>
          </div>
          {/* Bed status colors */}
          <div className="flex flex-wrap items-center gap-4 text-[12px]">
            <span className="text-muted-foreground font-medium">Bed Status:</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary/80" /> Occupied</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-warning/40" /> Reserved</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-dashed border-border bg-card" /> Vacant</span>
          </div>
        </div>
      </div>

      {errorMsg && <div className="text-sm text-destructive mb-6 bg-destructive/10 p-4 rounded-xl">{errorMsg}</div>}

      <div className="space-y-7">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="animate-spin text-primary mb-2" size={48} />
            <span className="text-sm text-muted-foreground">Loading rooms...</span>
          </div>
        ) : properties.length === 0 && rooms.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-16 shadow-soft flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-muted/60 rounded-full flex items-center justify-center mb-3"><Building2 className="size-7 text-muted-foreground" /></div>
            <h3 className="font-serif text-[22px] text-foreground mb-1">No properties or rooms</h3>
            <p className="text-[13.5px] text-muted-foreground mb-4">Add a property first, then you can add rooms to it.</p>
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([propTitle, allPropRooms]) => {
              const allBeds = allPropRooms.flatMap(r => toLegacyBeds(r));
              const pOcc = allBeds.filter(b => b.status === "occupied" || b.tenantId).length;
              const pTotal = allBeds.length;
              const pct = pTotal ? Math.round((pOcc / pTotal) * 100) : 0;
              // Per-property pagination
              const propId = allPropRooms[0]?.propertyId || "";
              const totalPropRooms = propertyTotals[propId] || allPropRooms.length;
              const propPage = propPages[propTitle] || 1;
              const propTotalPages = Math.max(1, Math.ceil(totalPropRooms / ROOMS_PER_PAGE));
              const safePropPage = Math.min(propPage, propTotalPages);
              const propRooms = allPropRooms.slice((safePropPage - 1) * ROOMS_PER_PAGE, safePropPage * ROOMS_PER_PAGE);
              const setPropertyPage = (p) => handlePropertyPageChange(propTitle, propId, p);
              return (
                <section key={propTitle} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  {/* Property Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="font-semibold text-[17px] leading-tight text-slate-800">{propTitle}</h2>
                      <div className="text-[12px] text-slate-400 mt-0.5">
                        {currentPropertyLocation && `${currentPropertyLocation} · `}
                        {allPropRooms.length} rooms · {pOcc}/{pTotal} beds occupied
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold mr-1",
                        pct > 90 ? "bg-blue-50 text-blue-600" : pct > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      )}>{pct}% full</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const targetProp = properties.find(p => (p.title || p.name) === propTitle) || currentProperty;
                          setRoomForm({ ...defaultRoomForm, propertyId: targetProp?._id || propId });
                          setRoomModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold shadow-sm transition-all active:scale-95"
                      >
                        <Plus size={14} /> Add Room
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          const targetProp = properties.find(p => (p.title || p.name) === propTitle) || currentProperty;
                          setBulkForm(prev => ({ ...prev, propertyId: targetProp?._id || propId }));
                          setBulkModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
                      >
                        <Layers size={14} /> Bulk Add Rooms
                      </button>
                    </div>
                  </div>

                  {/* Room Cards Grid */}
                  {allPropRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3">
                        <LayoutTemplate className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-slate-800 mb-1">No Rooms Added Yet</h3>
                      <p className="text-[13px] text-slate-500 mb-5 max-w-sm">Manage beds and track tenants easily by adding rooms to {propTitle}.</p>
                      <button type="button" onClick={() => {
                        setRoomForm({ ...defaultRoomForm, propertyId: propId || (properties.find(p => p.title === propTitle || p.name === propTitle)?._id) });
                        setRoomModalOpen(true);
                      }} className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-blue-600 text-white text-[13px] font-bold shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors">
                        <Plus size={16} /> Add First Room
                      </button>
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto snap-x gap-3 pb-3 no-scrollbar scroll-smooth md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {propRooms.map(room => {
                        const beds = toLegacyBeds(room);
                        const occupiedCount = beds.filter(b => b.status === "occupied" || b.tenantId).length;
                        const totalBeds = beds.length;

                        let cardBorderClass, badgeClass, statusLabel, dotColor, manageBtnClass, bedVacantClass, footerBorder;

                        if (occupiedCount === 0) {
                          cardBorderClass = "border-emerald-200";
                          badgeClass = "bg-emerald-100 text-emerald-700";
                          statusLabel = "Vacant";
                          dotColor = "bg-emerald-500";
                          footerBorder = "border-slate-100";
                          manageBtnClass = "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100";
                          bedVacantClass = "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100";
                        } else if (occupiedCount === totalBeds) {
                          cardBorderClass = "border-rose-300";
                          badgeClass = "bg-rose-100 text-rose-700";
                          statusLabel = "Full";
                          dotColor = "bg-rose-500";
                          footerBorder = "border-slate-100";
                          manageBtnClass = "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100";
                          bedVacantClass = "bg-rose-50 border-rose-200 text-rose-300 hover:bg-rose-100";
                        } else {
                          cardBorderClass = "border-orange-300";
                          badgeClass = "bg-orange-100 text-orange-700";
                          statusLabel = `${occupiedCount}/${totalBeds} Beds`;
                          dotColor = "bg-orange-500";
                          footerBorder = "border-slate-100";
                          manageBtnClass = "bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100";
                          bedVacantClass = "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100";
                        }

                        return (
                          <div key={room._id || room.id} className={cn("group rounded-2xl border shadow-sm relative overflow-hidden bg-white hover:shadow-md transition-all w-[85%] md:w-auto shrink-0 snap-start p-4", cardBorderClass)}>
                            {/* Header Row */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0 border shadow-inner",
                                  occupiedCount === totalBeds ? "bg-rose-100 text-rose-600 border-rose-200" :
                                    occupiedCount === 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                      "bg-orange-50 text-orange-600 border-orange-100"
                                )}>
                                  <BedDouble className="w-4 h-4" />
                                </div>
                                <div>
                                  <h3 className="text-[14px] font-bold text-slate-900 leading-tight">Room {room.number || room.roomNo || room.title}</h3>
                                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                                    {(() => {
                                      let g = room.gender;
                                      const targetProp = properties.find(p => (p._id && String(p._id) === String(room.propertyId)) || p.title === propTitle || p.name === propTitle);
                                      const pGen = String(targetProp?.gender || targetProp?.genderSuitability || targetProp?.propertyDetails?.genderPref || targetProp?.pgType || targetProp?.propertyType || "").toLowerCase();
                                      const pTitleStr = String(propTitle || targetProp?.title || targetProp?.name || "").toLowerCase();
                                      const pCatStr = String(targetProp?.propertyCategory || targetProp?.category || "").toLowerCase();

                                      if (!g || g === "Mixed" || g === "Co-ed" || g === "any") {
                                        if (pGen.includes("female") || pGen.includes("girl") || pTitleStr.includes("girls") || pTitleStr.includes("female") || pCatStr.includes("girls") || pCatStr.includes("female")) return "Female";
                                        if (pGen.includes("male") || pGen.includes("boy") || pTitleStr.includes("boys") || pTitleStr.includes("male") || pCatStr.includes("boys") || pCatStr.includes("male")) return "Male";
                                        return "Co-ed";
                                      }
                                      return g === "Mixed" ? "Co-ed" : g;
                                    })()} • {room.type || "AC"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5">
                                <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold", badgeClass)}>
                                  <span className={cn("size-1.5 rounded-full", dotColor)} />
                                  {statusLabel}
                                </span>
                                {/* Edit/Delete visible on hover for desktop */}
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity hidden md:flex mt-1">
                                  <button onClick={(e) => { e.stopPropagation(); handleEditRoom(room); }} className="p-1 opacity-60 hover:opacity-100"><Edit2 size={11} /></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room); }} className="p-1 opacity-60 hover:opacity-100 text-rose-500"><Trash2 size={11} /></button>
                                </div>
                              </div>
                            </div>

                            {/* Beds Grid */}
                            <div className="flex gap-1.5 py-1 mb-2">
                              {beds.map((bed, i) => {
                                const isOcc = bed.status === "occupied" || !!bed.tenantId;
                                return (
                                  <div key={i}
                                    onClick={() => openAssignModal(room, i)}
                                    title={isOcc ? `Occupied${bed.tenantName ? ` — ${bed.tenantName}` : ""}` : "Vacant — Click to assign"}
                                    className={cn("flex-1 h-8 rounded-lg grid place-items-center text-[10px] font-bold transition-colors cursor-pointer border",
                                      isOcc
                                        ? cn(badgeClass, "shadow-sm")
                                        : cn(bedVacantClass, "border-dashed"))}
                                  >
                                    {String.fromCharCode(65 + i)}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Footer */}
                            <div className={cn("flex items-center justify-between pt-2.5 border-t mt-2", footerBorder)}>
                              <div className="flex gap-4 mb-1">
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Rent</p>
                                  <p className="text-[13.5px] font-black text-slate-800 leading-none">₹{(room.rent || 0).toLocaleString("en-IN")}<span className="text-[10px] text-slate-500 font-semibold">/bed</span></p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button type="button" onClick={() => {
                                  const firstVacant = beds.findIndex(b => !(b.status === "occupied" || b.tenantId));
                                  openAssignModal(room, firstVacant !== -1 ? firstVacant : 0);
                                }} className={cn("h-7 px-3.5 rounded-full flex items-center gap-1.5 transition-colors text-[11px] font-bold", manageBtnClass)}>
                                  Manage
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Per-Property Pagination */}
                  {propTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <span className="text-[12px] text-slate-400 font-medium">
                        Showing {(safePropPage - 1) * ROOMS_PER_PAGE + 1}–{Math.min(safePropPage * ROOMS_PER_PAGE, totalPropRooms)} of {totalPropRooms} rooms
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={safePropPage <= 1}
                          onClick={() => setPropertyPage(safePropPage - 1)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-[12px] font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          ←
                        </button>
                        {Array.from({ length: propTotalPages }, (_, i) => i + 1).map(p => (
                          <button
                            key={p}
                            onClick={() => setPropertyPage(p)}
                            className={cn("w-8 h-8 rounded-lg text-[12px] font-semibold transition-all",
                              p === safePropPage
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          disabled={safePropPage >= propTotalPages}
                          onClick={() => setPropertyPage(safePropPage + 1)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-[12px] font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </>
        )}
      </div>

      {/* Add Room Modal */}
      <div className={cn("fixed inset-0 z-[100] flex items-center justify-center bg-black/70 transition-all", roomModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
        <div className={cn("bg-white dark:bg-card w-full max-w-md rounded-2xl shadow-2xl flex flex-col transition-transform duration-300", roomModalOpen ? "scale-100" : "scale-95")}>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <button type="button" onClick={() => setRoomModalOpen(false)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"><X size={18} /></button>
            <h2 className="text-[18px] font-semibold text-foreground flex-1">{roomForm._id ? 'Edit Room' : 'Add Room Details'}</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-180px)]">
            <form id="addRoomForm" onSubmit={handleCreateRoom} className="space-y-6">

              <div>
                <label className="block text-[13px] text-muted-foreground mb-1.5">Room Name <span className="text-destructive">*</span></label>
                <input required className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 transition-colors" placeholder="Ex. Room 001" value={roomForm.roomNo} onChange={e => setRoomForm(p => ({ ...p, roomNo: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">Unit Type</label>
                  <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-colors" value={roomForm.unitType} onChange={e => setRoomForm(p => ({ ...p, unitType: e.target.value }))}>
                    <option value="">Select Unit Type</option>
                    <option value="Room">Room</option>
                    <option value="Bed">Bed</option>
                    <option value="PG">PG</option>
                    <option value="1RK">1RK</option>
                    <option value="2RK">2RK</option>
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                    <option value="4BHK">4BHK</option>
                    <option value="5BHK">5BHK</option>
                    <option value="Studio Apartment">Studio Apartment</option>
                    <option value="Apartment">Apartment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">Select Floor</label>
                  <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-colors" value={roomForm.floor} onChange={e => setRoomForm(p => ({ ...p, floor: e.target.value }))}>
                    <option value="">Select Floor</option>
                    <option value="Basement">Basement</option>
                    <option value="Ground Floor">Ground Floor</option>
                    {Array.from({ length: 100 }, (_, i) => i + 1).map(floor => (
                      <option key={floor} value={`${floor}${floor === 1 ? 'st' : floor === 2 ? 'nd' : floor === 3 ? 'rd' : 'th'} Floor`}>
                        {floor}{floor === 1 ? 'st' : floor === 2 ? 'nd' : floor === 3 ? 'rd' : 'th'} Floor
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">Sharing Type</label>
                  <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none transition-colors" value={roomForm.sharingType} onChange={e => {
                    const val = e.target.value;
                    let beds = roomForm.roomBeds;
                    if (val === 'Single Sharing' || val === 'Private Room (No Sharing)') beds = 1;
                    else if (val === 'Double Sharing') beds = 2;
                    else if (val === 'Triple Sharing') beds = 3;
                    else if (val === 'Four Sharing') beds = 4;
                    setRoomForm(p => ({ ...p, sharingType: val, roomBeds: beds }));
                  }}>
                    <option value="">Select Unit Sharing Type</option>
                    <option value="Single Sharing">Single Sharing</option>
                    <option value="Double Sharing">Double Sharing</option>
                    <option value="Triple Sharing">Triple Sharing</option>
                    <option value="Four Sharing">Four Sharing</option>
                    <option value="Private Room (No Sharing)">Private Room (No Sharing)</option>
                    <option value="Custom">Custom Sharing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">Amount Per Bed</label>
                  <input type="number" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="0" value={roomForm.roomRent} onChange={e => setRoomForm(p => ({ ...p, roomRent: e.target.value }))} />
                </div>
                {roomForm.sharingType === 'Custom' && (
                  <div className="col-span-2">
                    <label className="block text-[13px] text-muted-foreground mb-1.5">Custom Number of Beds</label>
                    <input type="number" min="1" max="100" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="Enter number of beds (e.g. 6)" value={roomForm.roomBeds} onChange={e => setRoomForm(p => ({ ...p, roomBeds: Math.max(1, Number(e.target.value) || 1) }))} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] text-muted-foreground mb-1.5">Room Remarks</label>
                <textarea className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 transition-colors min-h-[80px]" placeholder="Remarks" value={roomForm.remarks} onChange={e => setRoomForm(p => ({ ...p, remarks: e.target.value }))}></textarea>
              </div>

              <div>
                <label className="block text-[13px] text-muted-foreground mb-2">Is this room available to rent <span className="text-destructive">*</span></label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-[14px] text-foreground cursor-pointer">
                    <input type="radio" name="isAvailable" checked={roomForm.isAvailable} onChange={() => setRoomForm(p => ({ ...p, isAvailable: true }))} className="w-4 h-4 text-primary focus:ring-primary accent-primary" /> Yes
                  </label>
                  <label className="flex items-center gap-2 text-[14px] text-foreground cursor-pointer">
                    <input type="radio" name="isAvailable" checked={!roomForm.isAvailable} onChange={() => setRoomForm(p => ({ ...p, isAvailable: false }))} className="w-4 h-4 text-primary focus:ring-primary accent-primary" /> No
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-[14px] font-semibold text-primary mb-4">Room Facilities</h3>
                <div className="mb-3">
                  <label className="text-[13px] text-muted-foreground">Facilities</label>
                </div>
                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                  {[
                    { name: "AC", icon: Wind }, { name: "Table", icon: TableIcon }, { name: "TV", icon: Tv }, { name: "Washroom", icon: Bath },
                    { name: "Balcony", icon: LayoutTemplate }, { name: "Fridge", icon: Refrigerator }, { name: "Almirah", icon: DoorClosed }, { name: "Chair", icon: Armchair },
                    { name: "Food", icon: Utensils }, { name: "Microwave", icon: Microwave }, { name: "Geyser", icon: Flame }, { name: "Laundry", icon: Shirt },
                    { name: "CCTV", icon: Video }, { name: "Toilet", icon: Bath }, { name: "Cooler", icon: Fan }
                  ].map(fac => {
                    const isSelected = roomForm.facilities.includes(fac.name);
                    return (
                      <label key={fac.name} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" className="peer sr-only" checked={isSelected} onChange={(e) => {
                            setRoomForm(p => ({
                              ...p,
                              facilities: e.target.checked ? [...p.facilities, fac.name] : p.facilities.filter(f => f !== fac.name)
                            }));
                          }} />
                          <div className={cn("w-5 h-5 rounded border border-border flex items-center justify-center transition-colors absolute -left-6 top-1/2 -translate-y-1/2", isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-card group-hover:border-primary/50")}>
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                          <div className="flex flex-col items-center gap-1 pl-1">
                            <fac.icon size={22} className={cn("transition-colors", isSelected ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("text-[12px] font-medium transition-colors text-center leading-tight", isSelected ? "text-foreground" : "text-muted-foreground")}>{fac.name}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <div className="mb-4">
                  <label className="text-[13px] text-muted-foreground">Room Type</label>
                </div>
                <div className="grid grid-cols-3 gap-y-4 gap-x-4">
                  {["Corner Room", "Large Room", "Ventilation", "Furnished", "Unfurnished", "Semi-Furnished", "Female", "Male", "Non Attached", "Attached", "Hall", "Short Term", "Long Term"].map(rt => {
                    const isSelected = roomForm.roomTypeFeatures.includes(rt);
                    return (
                      <label key={rt} className="flex items-start gap-2 cursor-pointer group">
                        <div className="relative flex items-center mt-0.5">
                          <input type="checkbox" className="peer sr-only" checked={isSelected} onChange={(e) => {
                            setRoomForm(p => ({
                              ...p,
                              roomTypeFeatures: e.target.checked ? [...p.roomTypeFeatures, rt] : p.roomTypeFeatures.filter(f => f !== rt)
                            }));
                          }} />
                          <div className={cn("w-4 h-4 rounded border border-border flex items-center justify-center transition-colors", isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-card group-hover:border-primary/50")}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                        <span className={cn("text-[13px] leading-tight transition-colors", isSelected ? "text-foreground" : "text-muted-foreground")}>{rt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 pb-4 border-t border-border">
                <h3 className="text-[14px] font-semibold text-primary mb-4">Electricity Meter</h3>
                <div>
                  <label className="block text-[13px] text-muted-foreground mb-1.5">Unit Cost (₹/Unit)</label>
                  <input type="number" step="0.01" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g., 8.50" value={roomForm.electricityUnitCost} onChange={e => setRoomForm(p => ({ ...p, electricityUnitCost: Number(e.target.value) }))} />
                  <p className="text-[11px] text-muted-foreground mt-1">Set the cost per unit. Staff will add readings later.</p>
                </div>
              </div>

              <div className="pt-4 pb-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[14px] font-semibold text-primary">Room Media (Photos/Videos)</h3>
                  <span className="text-[11px] text-slate-400 font-medium">Multiple photos allowed</span>
                </div>

                {/* Admin Approval Info Banner */}
                <div className="mb-4 bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 text-[12px] leading-relaxed font-medium">
                  <span className="text-amber-500 font-bold shrink-0 text-[15px] mt-0.5">ℹ️</span>
                  <div>
                    <span className="font-bold text-amber-950">Approval Required for Live Website:</span>
                    <p className="text-[11.5px] text-amber-800 mt-0.5 font-medium">
                      Uploaded photos will be submitted to Admin for approval before going live on the website.
                    </p>
                  </div>
                </div>

                {/* Uploaded Photos/Videos Preview Grid */}
                {roomForm.media && roomForm.media.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                    {roomForm.media.map((file, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-square bg-slate-100">
                        {file.type === "video" ? (
                          <video src={file.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={file.preview || file.url} alt={`media-${idx}`} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md"
                          title="Remove photo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File Upload Trigger */}
                <label className={cn(
                  "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center",
                  isUploadingMedia 
                    ? "border-blue-400 bg-blue-50/50 cursor-wait" 
                    : "border-slate-200 hover:border-blue-500 hover:bg-slate-50/80"
                )}>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    disabled={isUploadingMedia}
                    className="hidden"
                  />
                  {isUploadingMedia ? (
                    <>
                      <Loader2 size={30} className="text-blue-600 animate-spin mb-1" />
                      <span className="text-[13px] font-bold text-blue-600">Uploading photos...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <p className="text-[13.5px] font-bold text-slate-800">Click to upload room photos</p>
                        <p className="text-[11.5px] text-slate-400 mt-0.5 font-medium">Select multiple images (JPG, PNG, WEBP, MP4)</p>
                      </div>
                    </>
                  )}
                </label>
              </div>

            </form>
          </div>

          <div className="p-4 border-t border-border bg-card">
            {errorMsg && <p className="text-[12px] text-destructive mb-3 px-1">{errorMsg}</p>}
            <button type="submit" form="addRoomForm" className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-[14px] font-medium hover:opacity-90 transition-opacity shadow-sm">
              {roomForm._id ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </div>
      </div>

      {/* Assign Tenant Modal */}
      <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm transition-all", assignModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <div>
              <h2 className="text-[18px] font-semibold text-foreground">
                {selectedBedOccupied ? "Bed Info" : "Assign Tenant"}
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Room {selectedRoom?.number || selectedRoom?.roomNo} · Bed {selectedBedIndex != null ? selectedBedIndex + 1 : ""}
                {selectedBedOccupied && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary">Occupied</span>
                )}
              </p>
            </div>
            <button onClick={() => setAssignModalOpen(false)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"><X size={20} /></button>
          </div>

          {selectedBedOccupied ? (
            // Show occupied bed details — no reassignment allowed
            (() => {
              const bed = selectedRoom ? toLegacyBeds(selectedRoom)[selectedBedIndex] : null;
              const assignedTenant = tenants.find(t => (t._id || t.id) === bed?.tenantId) || null;
              return (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/8 border border-primary/20">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[16px]">
                      {(bed?.tenantName || assignedTenant?.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{bed?.tenantName || assignedTenant?.name || "Tenant"}</p>
                      {assignedTenant?.phone && <p className="text-[12px] text-muted-foreground">{assignedTenant.phone}</p>}
                      {assignedTenant?.email && <p className="text-[11px] text-muted-foreground">{assignedTenant.email}</p>}
                    </div>
                  </div>
                  <p className="text-[12px] text-muted-foreground text-center">
                    This bed is currently occupied. To reassign, first move out the current tenant.
                  </p>
                  <button type="button" onClick={() => setAssignModalOpen(false)}
                    className="w-full h-10 rounded-lg bg-muted text-foreground text-[13px] font-medium hover:bg-muted/80">
                    Close
                  </button>
                </div>
              );
            })()
          ) : (
            // Show assign form for vacant bed
            <form onSubmit={handleAssignTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Select Existing Tenant</label>
                <select required className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-[13.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" value={selectedTenantId} onChange={e => setSelectedTenantId(e.target.value)}>
                  <option value="">-- Select Tenant --</option>
                  {tenants
                    .filter(t => !assignedIds.has(t._id || t.id))
                    .map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name} ({t.phone})</option>)
                  }
                </select>
              </div>
              {errorMsg && <p className="text-[12px] text-destructive">{errorMsg}</p>}
              <button type="submit" disabled={isAssigning} className="w-full h-10 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-50">
                {isAssigning ? "Assigning..." : "Assign Tenant"}
              </button>
              <div className="pt-2.5 border-t border-slate-100 mt-4 text-center">
                <a
                  href={`/propertyowner/tenantrec?propertyId=${encodeURIComponent(selectedRoom?.propertyId || '')}&room=${encodeURIComponent(selectedRoom?.number || selectedRoom?.roomNo || '')}`}
                  className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
                >
                  <Plus size={14} /> Onboard a new tenant instead
                </a>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Bulk Add Rooms Modal */}
      <div className={cn("fixed inset-0 z-[100] flex items-center justify-center bg-black/70 transition-all", bulkModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
        <div className={cn("bg-white dark:bg-card w-full max-w-lg rounded-2xl shadow-2xl flex flex-col transition-transform duration-300", bulkModalOpen ? "scale-100" : "scale-95")}>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <button type="button" onClick={() => setBulkModalOpen(false)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"><X size={18} /></button>
            <div className="flex-1">
              <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" /> Bulk Add Rooms
              </h2>
              <p className="text-[12px] text-muted-foreground">Add multiple rooms at once automatically</p>
            </div>
          </div>
          <form onSubmit={handleBulkCreate} className="p-6 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-1">Select Property <span className="text-destructive">*</span></label>
              <select required className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px]" value={bulkForm.propertyId} onChange={e => setBulkForm(p => ({ ...p, propertyId: e.target.value }))}>
                <option value="">-- Select Property --</option>
                {properties.map(p => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.title || p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">Prefix</label>
                <input className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px]" placeholder="e.g. Room " value={bulkForm.prefix} onChange={e => setBulkForm(p => ({ ...p, prefix: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">Start Room No.</label>
                <input type="number" min="1" required className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px]" placeholder="101" value={bulkForm.startNumber} onChange={e => setBulkForm(p => ({ ...p, startNumber: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">Total Rooms</label>
                <input type="number" min="1" max="50" required className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px]" placeholder="5" value={bulkForm.count} onChange={e => setBulkForm(p => ({ ...p, count: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">Sharing Type</label>
                <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px]" value={bulkForm.sharingType} onChange={e => setBulkForm(p => ({ ...p, sharingType: e.target.value }))}>
                  <option value="Single Sharing">Single Sharing (1 Bed)</option>
                  <option value="Double Sharing">Double Sharing (2 Beds)</option>
                  <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
                  <option value="Four Sharing">Four Sharing (4 Beds)</option>
                  <option value="Private Room (No Sharing)">Private Room (1 Bed)</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">Amount Per Bed (₹)</label>
                <input type="number" required className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px]" placeholder="2000" value={bulkForm.roomRent} onChange={e => setBulkForm(p => ({ ...p, roomRent: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">Floor</label>
                <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px]" value={bulkForm.floor} onChange={e => setBulkForm(p => ({ ...p, floor: e.target.value }))}>
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="2nd Floor">2nd Floor</option>
                  <option value="3rd Floor">3rd Floor</option>
                  <option value="4th Floor">4th Floor</option>
                  <option value="5th Floor">5th Floor</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1">Gender</label>
                <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-[14px]" value={bulkForm.roomGender} onChange={e => setBulkForm(p => ({ ...p, roomGender: e.target.value }))}>
                  <option value="Mixed">Co-ed</option>
                  <option value="Male">Male Only</option>
                  <option value="Female">Female Only</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-border">
              <button type="button" onClick={() => setBulkModalOpen(false)} className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-muted text-foreground hover:bg-muted/80">Cancel</button>
              <button type="submit" disabled={isBulkSubmitting} className="px-5 py-2 rounded-xl text-[13px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-emerald-600/20">
                {isBulkSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                {isBulkSubmitting ? "Generating..." : `Create ${bulkForm.count || 1} Rooms`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
