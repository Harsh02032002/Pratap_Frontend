import React, { useEffect, useState } from "react";
import { X, Plus, Zap, RotateCw, Calendar, Edit2, Trash2 } from "lucide-react";
import StaffLayout from "../../components/StaffLayout";
import { toast } from "react-hot-toast";
import { useStaffElectricity, useStaffElectricityMutations } from "../../hooks/useStaffLists";
import { getActiveOwnerPropertyId } from "../../utils/propertyowner";

const cn = (...c) => c.filter(Boolean).join(" ");

function getStaffSession() {
  try {
    const raw = sessionStorage.getItem("staff_session") || localStorage.getItem("staff_session");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export default function StaffElectricityReadings() {
  const staff = getStaffSession();
  const parentLoginId = staff?.parentLoginId || "";
  const assignedPropertyName = staff?.assignedPropertyName || "";

  if (!staff?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [readingForm, setReadingForm] = useState({
    billingMonth: new Date().toISOString().slice(0, 7),
    currentReading: "",
  });
  const [saving, setSaving] = useState(false);

  const {
    data: fetchedRooms = [],
    isLoading,
    refetch,
  } = useStaffElectricity(parentLoginId, {
    // The backend already scopes this list to the active property via
    // propertyId (see useStaffElectricity). If no active property is set at
    // all (e.g. a staff member with no assignment yet), default to showing
    // nothing rather than every property's readings — a title-string match
    // against assignedPropertyName isn't reliable enough to gate this alone.
    select: (list = []) => {
      const propertyId = getActiveOwnerPropertyId();
      if (!propertyId && !assignedPropertyName) return [];
      if (!propertyId && assignedPropertyName) {
        return list.filter((r) => r.propertyTitle === assignedPropertyName);
      }
      return list;
    },
  });
  const { addReading, deleteReading } = useStaffElectricityMutations(parentLoginId);

  useEffect(() => {
    setRooms(fetchedRooms);
    if (selectedRoom) {
      const refreshed = fetchedRooms.find((r) => String(r.roomId) === String(selectedRoom.roomId));
      if (refreshed) setSelectedRoom(refreshed);
    }
  }, [fetchedRooms, selectedRoom]);

  const handleAddReading = async (e) => {
    e.preventDefault();
    if (!selectedRoom || !readingForm.currentReading || !readingForm.billingMonth) {
      toast.error("Please fill all fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        propertyId: selectedRoom.propertyId,
        roomNo: selectedRoom.roomNo,
        billingMonth: readingForm.billingMonth,
        currentReading: Number(readingForm.currentReading),
      };

      const data = await addReading.mutateAsync(payload);
      if (data.success) {
        toast.success("Reading saved successfully!");
        setModalOpen(false);
      } else {
        toast.error(data.message || "Failed to save reading");
      }
    } catch (e) {
      toast.error("Error saving reading");
    } finally {
      setSaving(false);
    }
  };

  const handleEditReading = (reading) => {
    setReadingForm({
      billingMonth: reading.billingMonth,
      currentReading: reading.currentReading,
    });
    setModalOpen(true);
  };

  const handleDeleteReading = async (reading) => {
    if (!window.confirm(`Are you sure you want to delete the reading for ${reading.billingMonth}?`)) return;
    try {
      const data = await deleteReading.mutateAsync({ id: reading._id });
      if (data.success) {
        toast.success("Reading deleted successfully!");
      } else {
        toast.error(data.message || "Failed to delete reading");
      }
    } catch (e) {
      toast.error("Error deleting reading");
    }
  };

  return (
    <StaffLayout title="Electricity Readings" subtitle="Log monthly meter readings for rooms">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex md:hidden overflow-x-auto gap-3 pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {[
            { title: "Total Rooms", value: isLoading ? "..." : rooms.length, subtext: "Metered rooms", icon: Zap, bg: "bg-amber-50", ic: "text-amber-500" },
            { title: "Readings Logged", value: isLoading ? "..." : rooms.filter((r) => r.history?.length > 0).length, subtext: "Have history", icon: Calendar, bg: "bg-blue-50", ic: "text-blue-600" },
            { title: "This Month", value: isLoading ? "..." : rooms.filter((r) => r.latest?.billingMonth === new Date().toISOString().slice(0, 7)).length, subtext: "Updated", icon: RotateCw, bg: "bg-emerald-50", ic: "text-emerald-600" },
          ].map(({ title, value, subtext, icon: Icon, bg, ic }) => (
            <div key={title} className="shrink-0 w-[130px] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex items-start mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${ic}`} />
                </div>
              </div>
              <div>
                <h3 className="text-[22px] font-black text-slate-900 leading-tight">{value}</h3>
                <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{title}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-1">{subtext}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
              <Zap size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No rooms found</p>
            </div>
          ) : rooms.map((room) => (
            <div
              key={room.roomId}
              onClick={() => setSelectedRoom(selectedRoom?.roomId === room.roomId ? null : room)}
              className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all ${
                selectedRoom?.roomId === room.roomId ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-100"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-black text-slate-900 text-[15px]">Room {room.roomNo || "—"}</p>
                  <p className="text-[11px] text-slate-500">{room.propertyTitle}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              {room.latest ? (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Last Reading</p>
                    <p className="text-[16px] font-black text-slate-900">{room.latest.currentReading}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Unit Cost</p>
                    <p className="text-[16px] font-black text-slate-900">₹{room.latest.unitCost || room.roomUnitCost || 0}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 mt-2">No readings yet — tap to add</p>
              )}
              {selectedRoom?.roomId === room.roomId && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[12px] font-bold text-slate-800 mb-3">Reading History</h4>
                  {!selectedRoom.history || selectedRoom.history.length === 0 ? (
                    <p className="text-[11px] text-slate-500 mb-3 text-center py-2 bg-slate-50 rounded-lg">No readings recorded yet</p>
                  ) : (
                    <div className="space-y-2 mb-3 max-h-[250px] overflow-y-auto">
                      {selectedRoom.history.map((reading) => (
                        <div key={reading._id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5">
                              <Calendar size={12} className="text-blue-500" /> {reading.billingMonth}
                            </span>
                            <span className="text-[13px] font-bold text-red-500">
                              ₹{(reading.totalBill || (reading.unitsConsumed * (reading.unitCost || selectedRoom.roomUnitCost || 0))).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 flex justify-between items-center bg-white p-1.5 rounded border border-slate-100">
                            <span>{reading.previousReading} → <span className="font-bold text-slate-700">{reading.currentReading}</span></span>
                            <span className="font-medium">{reading.unitsConsumed} Units <span className="opacity-60">@ ₹{reading.unitCost || selectedRoom.roomUnitCost || 0}</span></span>
                          </div>
                          <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-slate-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditReading(reading);
                              }}
                              className="text-[11px] text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReading(reading);
                              }}
                              className="text-[11px] text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalOpen(true);
                    }}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={16} /> Log New Reading
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h2 className="text-[16px] font-semibold text-slate-900 mb-4 flex justify-between items-center">
              Rooms
              <button onClick={() => refetch()} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
            </h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-slate-100 rounded-lg" />)}
                </div>
              ) : rooms.length === 0 ? (
                <p className="text-[13px] text-slate-500">No rooms found</p>
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.roomId}
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg text-[13px] font-medium transition-all border",
                      selectedRoom?.roomId === room.roomId
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white text-slate-600 border-slate-100 hover:border-blue-200 hover:bg-blue-50"
                    )}
                  >
                    <div className="font-bold">Room {room.roomNo || "-"}</div>
                    <div className={cn("text-[11px] mt-0.5", selectedRoom?.roomId === room.roomId ? "text-blue-100" : "text-slate-400")}>
                      {room.propertyTitle}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!selectedRoom ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center h-full flex flex-col items-center justify-center">
                <Zap size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-[14px] font-bold text-slate-700 mb-1">Select a room</p>
                <p className="text-[12px] text-slate-500">Choose a room to view or log their monthly reading</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Previous Reading</div>
                    <div className="text-[28px] font-black text-slate-900">{selectedRoom.latest ? selectedRoom.latest.currentReading : 0}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Unit Cost</div>
                    <div className="text-[28px] font-black text-slate-900">₹{selectedRoom.latest?.unitCost || selectedRoom.roomUnitCost || 0}</div>
                  </div>
                </div>

                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-600 text-white text-[14px] font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                  <Plus size={18} /> Log Current Reading
                </button>

                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex-1">
                  <h3 className="text-[16px] font-bold text-slate-900 mb-4">Reading History</h3>
                  {!selectedRoom.history || selectedRoom.history.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-[13px] font-medium">No readings recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedRoom.history.map((reading) => (
                        <div key={reading._id} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/50 transition-colors group">
                          <div className="flex-1">
                            <div className="text-[14px] font-bold text-slate-900 flex items-center gap-2 mb-1">
                              <Calendar size={14} className="text-blue-500" /> {reading.billingMonth}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity ml-2">
                                <button onClick={() => handleEditReading(reading)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white rounded-md shadow-sm"><Edit2 size={12} /></button>
                                <button onClick={() => handleDeleteReading(reading)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-white rounded-md shadow-sm"><Trash2 size={12} /></button>
                              </div>
                            </div>
                            <div className="text-[12px] font-medium text-slate-500 flex items-center gap-2">
                              <span><span className="text-slate-400">Prev:</span> {reading.previousReading}</span>
                              <span className="text-slate-300">|</span>
                              <span><span className="text-slate-400">Curr:</span> <span className="text-slate-700 font-bold">{reading.currentReading}</span></span>
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                              Consumed: {reading.unitsConsumed} units
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[18px] font-black text-rose-600">
                              ₹{(reading.totalBill || (reading.unitsConsumed * (reading.unitCost || selectedRoom.roomUnitCost || 0))).toFixed(2)}
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                              @ ₹{reading.unitCost || selectedRoom.roomUnitCost || 0}/unit
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-[16px] font-bold text-slate-900">Log Meter Reading</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddReading} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Billing Month <span className="text-rose-500">*</span></label>
                <input
                  type="month"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                  value={readingForm.billingMonth}
                  onChange={(e) => setReadingForm((p) => ({ ...p, billingMonth: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Current Meter Reading <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="e.g. 1045.5"
                  value={readingForm.currentReading}
                  onChange={(e) => setReadingForm((p) => ({ ...p, currentReading: e.target.value }))}
                />
                <p className="text-[11px] font-medium text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-700 font-bold">Note:</span> Previous reading ({selectedRoom?.latest ? selectedRoom.latest.currentReading : 0}) will be automatically subtracted to calculate the bill.
                </p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full h-12 rounded-xl bg-blue-600 text-white text-[14px] font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:pointer-events-none"
              >
                {saving ? <RotateCw className="animate-spin w-4 h-4" /> : <Zap className="w-4 h-4" />}
                {saving ? "Saving..." : "Save & Generate Bill"}
              </button>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
