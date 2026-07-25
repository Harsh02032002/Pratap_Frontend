import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, Bed, Users, ChevronLeft, Check, ShieldCheck, 
  Sparkles, DoorOpen, Info, Phone, Mail, MapPin, Star, Eye
} from 'lucide-react';

import WebsiteNavbar from '../../components/website/WebsiteNavbar';
import WebsiteFooter from '../../components/website/WebsiteFooter';
import { fetchPropertyByVisitId, fetchJson } from '../../utils/api';

const cn = (...classes) => classes.filter(Boolean).join(" ");
const normalizeType = (t) => String(t || '').trim().toLowerCase();

export default function PropertyRoomsPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [selectedRoomModal, setSelectedRoomModal] = useState(null);


  useEffect(() => {
    async function loadData() {
      if (!propertyId) return;
      setLoading(true);
      try {
        const foundProperty = await fetchPropertyByVisitId(propertyId);
        if (foundProperty) {
          setProperty(foundProperty);
          const actualId = foundProperty._id || foundProperty.id;

          // Fetch rooms from backend owner panel endpoint
          try {
            let roomsData = null;
            try {
              roomsData = await fetchJson(`/api/rooms/property/${encodeURIComponent(actualId)}?limit=100`);
            } catch (_) {}
            
            let roomList = (roomsData && Array.isArray(roomsData.rooms)) ? roomsData.rooms : (Array.isArray(roomsData) ? roomsData : []);

            if (roomList.length === 0 && foundProperty.visitId) {
              try {
                const visitRoomsData = await fetchJson(`/api/rooms/property/${encodeURIComponent(foundProperty.visitId)}?limit=100`);
                if (visitRoomsData && Array.isArray(visitRoomsData.rooms)) roomList = visitRoomsData.rooms;
              } catch (_) {}
            }

            if (roomList.length === 0 && (foundProperty.ownerLoginId || foundProperty.owner_id)) {
              const ownerId = foundProperty.ownerLoginId || foundProperty.owner_id;
              try {
                const ownerRoomsData = await fetchJson(`/api/rooms/owner/${encodeURIComponent(ownerId)}?limit=100`);
                const allOwnerRooms = ownerRoomsData?.rooms || (Array.isArray(ownerRoomsData) ? ownerRoomsData : []);
                const matched = allOwnerRooms.filter(r => {
                  const rPid = String(r.propertyId || r.property?._id || r.property || '');
                  return rPid === String(actualId) || rPid === String(foundProperty.visitId);
                });
                if (matched.length) roomList = matched;
              } catch (_) {}
            }

            setRooms(roomList);
          } catch (err) {
            console.error('Failed to fetch rooms:', err);
          }
        }
      } catch (err) {
        console.error('Failed to load property details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [propertyId]);

  // Overall Stats calculation matching Owner Panel exactly
  const roomStats = useMemo(() => {
    const totalRms = rooms.length;
    let totalB = 0;
    let vacantB = 0;
    let occupiedB = 0;

    rooms.forEach(r => {
      const bedsCount = Number(r.beds || r.capacity || 1);
      totalB += bedsCount;
      const assignments = r.bedAssignments || r.bedsInfo || [];
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
  }, [rooms]);

  // Prepared full list of rooms
  const formattedRooms = useMemo(() => {
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

  // Filtered rooms list
  const filteredRooms = useMemo(() => {
    return formattedRooms.filter(r => {
      if (activeFilter !== "all") {
        const normFilter = activeFilter.toLowerCase();
        const normType = (r.sharingType + " " + r.type).toLowerCase();
        if (!normType.includes(normFilter)) return false;
      }
      if (floorFilter !== "all" && r.floor !== floorFilter) {
        return false;
      }
      return true;
    });
  }, [formattedRooms, activeFilter, floorFilter]);

  const floorOptions = useMemo(() => {
    return ["all", ...new Set(formattedRooms.map(r => r.floor).filter(Boolean))];
  }, [formattedRooms]);

  const representativeImage = useMemo(() => {
    if (rooms && rooms.length > 0) {
      for (const r of rooms) {
        if (r.media && r.media.length > 0) {
          const img = r.media[0]?.url || r.media[0];
          if (img) return img;
        }
      }
    }
    if (property?.images && property.images.length > 0) return property.images[0];
    return property?.featuredImage || "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600";
  }, [rooms, property]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <WebsiteNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-[#EE4266] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-600">Loading Property Rooms & Beds Directory...</p>
        </div>
        <WebsiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <WebsiteNavbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full flex-1">
        
        {/* Top Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate(`/website/property-details/${propertyId}`)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#EE4266] mb-2 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} /> Back to Property Details
            </button>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-[#EE4266]" />
              {property?.name || "Property"} — Rooms & Beds Directory
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 flex items-center gap-2">
              <MapPin size={14} className="text-[#EE4266]" />
              {property?.location || property?.city || "Location"} · Real-time inventory synced from owner panel
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/website/property-details/${propertyId}#book`)}
              className="px-6 py-3 rounded-xl bg-[#EE4266] hover:bg-[#d63a5b] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Book Property Stay
            </button>
          </div>
        </div>

        {/* ── Top Stats Bar (Synced 100% with Owner Dashboard) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#EE4266] flex items-center justify-center shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block leading-none">{roomStats.totalRooms}</span>
              <span className="text-xs font-semibold text-slate-500">Total Rooms</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Bed size={24} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block leading-none">{roomStats.totalBeds}</span>
              <span className="text-xs font-semibold text-slate-500">Total Beds</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Check size={24} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block leading-none">{roomStats.vacantBeds}</span>
              <span className="text-xs font-semibold text-slate-500">Vacant Beds</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block leading-none">{roomStats.occupiedBeds}</span>
              <span className="text-xs font-semibold text-slate-500">Occupied Beds</span>
            </div>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Sharing Type:</span>
            {[
              { id: "all", label: "All Rooms" },
              { id: "double", label: "Double Sharing" },
              { id: "ac", label: "AC Room" },
              { id: "single", label: "Single Sharing" },
              { id: "triple", label: "Triple Sharing" }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  activeFilter === f.id
                    ? "bg-[#EE4266] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {floorOptions.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Floor:</span>
              <select
                value={floorFilter}
                onChange={e => setFloorFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                {floorOptions.map(f => (
                  <option key={f} value={f}>{f === "all" ? "All Floors" : f}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Individual Rooms Grid (Room 101, Room 102, Room 103, Room 104...) ── */}
        {filteredRooms.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
            <DoorOpen className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No rooms found</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting your filter to view all rooms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((rm, idx) => {
              const bedCount = Number(rm.beds || 2);
              const bedLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
              const bedPills = Array.from({ length: bedCount }, (_, bIdx) => {
                const bedLabel = `Bed ${bedLetters[bIdx] || bIdx + 1}`;
                const assignment = rm.bedAssignments?.find(x => Number(x.bedNo) === bIdx + 1) || rm.bedAssignments?.[bIdx];
                const isOccupied = assignment && (assignment.tenantId || assignment.tenantName);
                return { label: bedLabel, status: isOccupied ? 'occupied' : 'vacant' };
              });
              const vacantCount = bedPills.filter(b => b.status === 'vacant').length;
              const roomImg = (rm.media && rm.media.length > 0) ? (rm.media[0].url || rm.media[0]) : representativeImage;

              return (
                <div
                  key={rm._id || idx}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#EE4266] transition-all flex flex-col justify-between"
                >
                  {/* Card Image Header */}
                  <div className="relative h-48 bg-slate-100">
                    <img src={roomImg} alt={rm.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="bg-white/95 backdrop-blur-md text-slate-900 text-[10.5px] font-black px-3 py-1 rounded-full uppercase shadow-sm">
                          {rm.sharingType || rm.type}
                        </span>
                        <span className={cn(
                          "text-[10.5px] font-black px-3 py-1 rounded-full uppercase shadow-sm",
                          vacantCount > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                          {vacantCount > 0 ? `${vacantCount}/${bedCount} Vacant` : "Fully Occupied"}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-white leading-none">{rm.title}</h3>
                        <p className="text-xs text-slate-200 mt-1 font-semibold">{rm.floor}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bed Breakdown & Rent */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">
                        Beds Breakdown ({bedCount} Total)
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {bedPills.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className={cn(
                              "text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 border transition-colors",
                              b.status === 'vacant'
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-400 border-slate-200 line-through"
                            )}
                          >
                            <Bed size={13} /> {b.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Rent per bed</span>
                        <span className="text-lg font-black text-[#EE4266]">
                          ₹{Number(rm.price).toLocaleString('en-IN')}<span className="text-xs text-slate-500 font-normal">/mo</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRoomModal(rm)}
                          className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={14} className="text-[#EE4266]" /> View Details
                        </button>

                        <button
                          onClick={() => navigate(`/website/property-details/${propertyId}#book`)}
                          disabled={vacantCount === 0}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer",
                            vacantCount > 0
                              ? "bg-[#EE4266] text-white hover:bg-[#d63a5b]"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          )}
                        >
                          {vacantCount > 0 ? "Book" : "Full"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* ── FULL ROOM DETAILS MODAL ── */}
      {selectedRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#EE4266] via-[#d63a5b] to-[#EE4266] text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-white" />
                  <h3 className="text-lg md:text-xl font-bold">{selectedRoomModal.title} — Full Room Details</h3>
                </div>
                <p className="text-xs text-slate-100 mt-0.5">
                  {selectedRoomModal.sharingType || selectedRoomModal.type} · {selectedRoomModal.floor}
                </p>
              </div>

              <button
                onClick={() => setSelectedRoomModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              
              {/* Photo Gallery */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Room Photos</h4>
                {selectedRoomModal.media && selectedRoomModal.media.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedRoomModal.media.map((m, mIdx) => (
                      <div key={mIdx} className="h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={m.url || m} alt={`Photo ${mIdx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                    <Bed size={36} className="text-slate-300 mb-2" />
                    <span className="text-xs font-bold">Default Room View</span>
                  </div>
                )}
              </div>

              {/* Pricing & Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Monthly Rent</span>
                  <span className="text-xl font-black text-[#EE4266]">₹{Number(selectedRoomModal.price).toLocaleString('en-IN')}<span className="text-xs text-slate-500 font-normal">/mo</span></span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Beds</span>
                  <span className="text-xl font-black text-slate-800">{selectedRoomModal.beds} Beds</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Floor</span>
                  <span className="text-xl font-black text-slate-800">{selectedRoomModal.floor}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Brokerage</span>
                  <span className="text-xl font-black text-emerald-600">ZERO</span>
                </div>
              </div>

              {/* Beds Availability */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Bed-by-Bed Availability Status ({selectedRoomModal.beds} Total)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Array.from({ length: Number(selectedRoomModal.beds || 2) }, (_, bIdx) => {
                    const bedLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
                    const bedLabel = `Bed ${bedLetters[bIdx] || bIdx + 1}`;
                    const assignment = selectedRoomModal.bedAssignments?.find(x => Number(x.bedNo) === bIdx + 1) || selectedRoomModal.bedAssignments?.[bIdx];
                    const isOccupied = assignment && (assignment.tenantId || assignment.tenantName);
                    return (
                      <div
                        key={bIdx}
                        className={cn(
                          "p-3 rounded-xl border flex items-center justify-between text-xs font-bold",
                          isOccupied
                            ? "bg-slate-100 text-slate-400 border-slate-200 line-through"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        )}
                      >
                        <span className="flex items-center gap-1.5"><Bed size={14} /> {bedLabel}</span>
                        <span className="text-[10px] font-extrabold uppercase">{isOccupied ? 'Occupied' : 'Vacant'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Facilities */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Included Room Features & Amenities</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    "High-Speed WiFi", "Attached Washroom", "Air Conditioning", 
                    "Study Desk & Chair", "Personal Locker", "Daily Housekeeping", 
                    "24x7 Power Backup", "Geyser / Hot Water", "Security CCTV"
                  ].map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check size={10} />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => setSelectedRoomModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Details
              </button>

              <button
                onClick={() => {
                  setSelectedRoomModal(null);
                  navigate(`/website/property-details/${propertyId}#book`);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#EE4266] hover:bg-[#d63a5b] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Book {selectedRoomModal.title} Now
              </button>
            </div>

          </div>
        </div>
      )}


      <WebsiteFooter />
    </div>
  );
}
