import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, Info, Users, Bed, ChevronRight, Image as ImageIcon, 
  Star, Sparkles, Building2, ChevronDown, ChevronUp, Eye, X, 
  DoorOpen, ShieldCheck 
} from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(" ");
const normalizeType = (t) => String(t || '').trim().toLowerCase();

export default function RoomTypesSection({ roomTypes = [], rooms = [], property = {}, onSelectRoom }) {
  const navigate = useNavigate();
  const [inlineExpanded, setInlineExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Property ID for navigation
  const targetPropId = property._id || property.id || property.visitId;

  // Build full room list from real owner panel rooms array
  const fullRoomsList = useMemo(() => {
    if (rooms && rooms.length > 0) {
      return rooms.map((r, idx) => ({
        _id: r._id || r.id || `room-${idx}`,
        title: r.title || r.roomNo || r.number || `Room ${101 + idx}`,
        type: r.type || r.sharingType || 'Standard',
        sharingType: r.sharingType || r.type || 'Double Sharing',
        floor: r.floor || `Floor ${Math.floor(idx / 4) + 1}`,
        price: Number(r.price ?? r.rent ?? r.roomRent ?? property?.monthlyRent ?? property?.price ?? 0),
        beds: Number(r.beds || r.capacity || 2),
        isAvailable: r.isAvailable !== false,
        media: r.media || [],
        bedAssignments: r.bedAssignments || []
      }));
    }
    return [];
  }, [rooms, property]);

  // Overall Stats calculation matching Owner Panel exactly
  const roomStats = useMemo(() => {
    const totalRms = fullRoomsList.length;
    let totalB = 0;
    let vacantB = 0;
    let occupiedB = 0;

    fullRoomsList.forEach(r => {
      const bedsCount = Number(r.beds || 1);
      totalB += bedsCount;
      const assignments = r.bedAssignments || [];
      const occCount = assignments.filter(a => a && (a.tenantId || a.tenantName)).length;
      occupiedB += occCount;
      vacantB += Math.max(0, bedsCount - occCount);
    });

    return {
      totalRooms: totalRms || 1,
      totalBeds: totalB || 1,
      vacantBeds: vacantB || totalB || 1,
      occupiedBeds: occupiedB || 0
    };
  }, [fullRoomsList]);

  // Representative room image from owner uploads
  const firstRoomImage = useMemo(() => {
    if (rooms && rooms.length > 0) {
      for (const r of rooms) {
        if (r.media && r.media.length > 0) {
          const img = r.media[0]?.url || r.media[0];
          if (img) return img;
        }
      }
    }
    if (property.images && property.images.length > 0) return property.images[0];
    return property.featuredImage || "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600";
  }, [rooms, property]);

  // Filtered inline rooms
  const filteredInlineRooms = useMemo(() => {
    return fullRoomsList.filter(r => {
      if (activeFilter !== "all") {
        const normFilter = activeFilter.toLowerCase();
        const normType = (r.sharingType + " " + r.type).toLowerCase();
        if (!normType.includes(normFilter)) return false;
      }
      return true;
    });
  }, [fullRoomsList, activeFilter]);

  const handleOpenRoomsDirectory = () => {
    if (targetPropId) {
      navigate(`/website/property-rooms/${targetPropId}`);
    } else {
      setInlineExpanded(prev => !prev);
    }
  };

  return (
    <div className="py-8 bg-white" style={{ borderBottom: '1px solid #f0f0f0' }}>
      
      {/* ── Section Title ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#222] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#EE4266]" />
            Choose Your Room & Bed
          </h2>
          <p className="text-xs md:text-sm text-[#6d787d] mt-1">
            Real-time room occupancy & bed availability directly synced from property owner.
          </p>
        </div>

        {/* View All Rooms Button */}
        <button
          onClick={handleOpenRoomsDirectory}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#EE4266] hover:bg-[#d63a5b] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
        >
          <Eye size={16} className="text-white" />
          View All Rooms ({fullRoomsList.length})
        </button>
      </div>

      {/* ── Single Summary Banner Card (1 Room Image + 4 Stat Pillars) ── */}
      <div className="border border-slate-200 rounded-3xl overflow-hidden hover:border-[#EE4266] hover:shadow-xl transition-all bg-white flex flex-col md:flex-row">
        
        {/* Left Side: Representative Room Image */}
        <div className="w-full md:w-[45%] h-64 md:h-auto relative bg-slate-100 group overflow-hidden">
          <img 
            src={firstRoomImage} 
            alt={property.name || "Property Room"} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="bg-[#EE4266] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                Verified Inventory
              </span>
              <span className="bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {roomStats.totalRooms} Rooms Available
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white leading-tight">{property.name || "Property"} Accommodation</h3>
              <p className="text-xs text-slate-200 mt-1 font-medium">Fully furnished with bed, mattress, study desk & locker</p>
            </div>
          </div>
        </div>

        {/* Right Side: Owner Synced Stats & Rent */}
        <div className="w-full md:w-[55%] p-6 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#EE4266] block mb-1">
              Owner Panel Synced Inventory
            </span>
            <h3 className="text-xl font-black text-slate-900 mb-4">
              Room & Bed Availability Overview
            </h3>

            {/* 4 Stat Pillars matching Owner Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Rooms</span>
                <span className="text-base font-black text-slate-900">{roomStats.totalRooms}</span>
              </div>
              <div className="border-l border-slate-200 pl-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Beds</span>
                <span className="text-base font-black text-slate-900">{roomStats.totalBeds} Beds</span>
              </div>
              <div className="border-l border-slate-200 pl-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Vacant Beds</span>
                <span className="text-base font-black text-emerald-600">{roomStats.vacantBeds}</span>
              </div>
              <div className="border-l border-slate-200 pl-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Occupied</span>
                <span className="text-base font-black text-amber-600">{roomStats.occupiedBeds}</span>
              </div>
            </div>
          </div>

          {/* Pricing & Primary Action Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Starting Rent</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#EE4266]">
                  ₹{Number(property.price || property.monthlyRent || (fullRoomsList[0]?.price) || 2000).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-medium">/mo</span>
              </div>
            </div>

            <button
              onClick={handleOpenRoomsDirectory}
              className="px-6 py-3 rounded-2xl bg-[#EE4266] hover:bg-[#d63a5b] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Eye size={16} /> Explore All Rooms & Beds ({fullRoomsList.length})
            </button>
          </div>
        </div>

      </div>

      {/* ── Inline Expandable Rooms Directory (Appears when toggled or expanded) ── */}
      {inlineExpanded && (
        <div className="mt-8 pt-8 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-[#EE4266]" />
              Available Rooms & Bed Directory ({fullRoomsList.length})
            </h3>
            
            <div className="flex items-center gap-2">
              {["all", "double", "ac", "single"].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize",
                    activeFilter === f
                      ? "bg-[#EE4266] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredInlineRooms.map((rm, idx) => {
              const bedCount = Number(rm.beds || 2);
              const bedLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
              const bedPills = Array.from({ length: bedCount }, (_, bIdx) => {
                const bedLabel = `Bed ${bedLetters[bIdx] || bIdx + 1}`;
                const assignment = rm.bedAssignments?.find(x => Number(x.bedNo) === bIdx + 1) || rm.bedAssignments?.[bIdx];
                const isOccupied = assignment && (assignment.tenantId || assignment.tenantName);
                return { label: bedLabel, status: isOccupied ? 'occupied' : 'vacant' };
              });
              const vacantCount = bedPills.filter(b => b.status === 'vacant').length;
              const roomImg = (rm.media && rm.media.length > 0) ? (rm.media[0].url || rm.media[0]) : firstRoomImage;

              return (
                <div
                  key={rm._id || idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="relative h-40 bg-slate-100">
                    <img src={roomImg} alt={rm.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          {rm.sharingType || rm.type}
                        </span>
                        <span className={cn(
                          "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase",
                          vacantCount > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                          {vacantCount > 0 ? `${vacantCount}/${bedCount} Vacant` : "Occupied"}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white leading-none">{rm.title}</h4>
                        <p className="text-[11px] text-slate-200 mt-0.5">{rm.floor}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase block mb-1.5">Beds ({bedCount})</span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {bedPills.map((b, bI) => (
                          <span
                            key={bI}
                            className={cn(
                              "text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border",
                              b.status === 'vacant'
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-400 border-slate-200 line-through"
                            )}
                          >
                            <Bed size={11} /> {b.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Rent</span>
                        <span className="text-base font-black text-[#EE4266]">
                          ₹{Number(rm.price).toLocaleString('en-IN')}<span className="text-[10px] text-slate-500 font-normal">/mo</span>
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (onSelectRoom) onSelectRoom(rm);
                          else window.location.hash = "#book";
                        }}
                        disabled={vacantCount === 0}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer",
                          vacantCount > 0
                            ? "bg-[#EE4266] text-white hover:bg-[#d63a5b]"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {vacantCount > 0 ? "Book Room" : "Occupied"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

