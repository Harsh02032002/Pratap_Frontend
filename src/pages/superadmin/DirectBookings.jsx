import React, { useEffect, useMemo, useState } from "react";
import { 
  Users, Calendar, MapPin, Clock, Search,
  MoreVertical, CheckCircle2, RefreshCw, Eye, Mail, Phone,
  Building2, Banknote, ShieldCheck,
  Zap, Sheet, Loader2,
  CalendarCheck, User, X, Globe
} from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";
import * as XLSX from 'xlsx';

const cn = (...c) => c.filter(Boolean).join(" ");

export default function DirectBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("direct");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/bookings");
      const data = Array.isArray(res) ? res : (res.data || []);
      setBookings(data);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    let list = bookings;
    
    // Filter by Tab (Direct vs Online)
    if (activeTab === "direct") {
      list = list.filter(b => (b.request_type?.toLowerCase() === "direct" || !b.request_type));
    } else {
      list = list.filter(b => ["online", "website", "bid", "request"].includes(b.request_type?.toLowerCase()));
    }

    if (statusFilter !== "all") {
      list = list.filter(b => (b.booking_status || b.status) === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => 
        (b.name || "").toLowerCase().includes(q) ||
        (b.property_name || "").toLowerCase().includes(q) ||
        (b.email || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, search, statusFilter, activeTab]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => ["confirmed", "booked", "active"].includes(b.booking_status || b.status)).length;
    const pending = bookings.filter(b => (b.booking_status || b.status) === "pending").length;
    const revenue = bookings.reduce((acc, b) => acc + (Number(b.total_amount || b.rent_amount || 0)), 0);
    
    return { total, confirmed, pending, revenue };
  }, [bookings]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setIsProcessing(true);
      const endpoint = newStatus === 'confirmed' ? `/api/bookings/${id}/approve` : `/api/bookings/${id}/status`;
      await fetchJson(endpoint, {
        method: newStatus === 'confirmed' ? 'POST' : 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ status: newStatus })
      });
      loadBookings();
      setSelectedBooking(null);
    } catch (err) {
      alert("Failed to update booking status");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToExcel = () => {
    const data = filteredBookings.map(b => ({
      "Guest": b.name,
      "Property": b.property_name,
      "Email": b.email,
      "Phone": b.phone,
      "Check-In": b.check_in_date ? new Date(b.check_in_date).toLocaleDateString() : 'N/A',
      "Amount": b.total_amount || b.rent_amount || 0,
      "Status": b.booking_status || b.status,
      "Created At": new Date(b.created_at).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `Roomhy_Bookings_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Direct Bookings</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Verified direct reservations and guest stay intelligence hub.</p>
        </div>
        <button 
          onClick={exportToExcel}
          className="bg-white border border-[#CBD3D9] text-[#10242A] px-4 py-1.5 rounded-[8px] text-[13px] font-semibold shadow-xs hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sheet size={14} /> Export Fiscal Audit
        </button>
      </div>

      {/* Stats Grid (No Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" val={stats.total} trend="+12% Delta" />
        <StatCard label="Confirmed Pulse" val={stats.confirmed} trend="Optimal" />
        <StatCard label="Pending Audit" val={stats.pending} trend="Awaiting" />
        <StatCard label="Gross Value" val={`₹${(stats.revenue / 100000).toFixed(1)}L`} trend="Revenue Flow" />
      </div>

      {/* Outside Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search Guests, Properties..." 
              className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
            />
          </div>

          {/* Filter */}
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">All States</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <button onClick={loadBookings} className="p-2 rounded-[8px] bg-white text-[#4A5961] hover:text-[#0E7C86] transition-all border border-[#CBD3D9] shadow-xs cursor-pointer">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* Tabs switcher */}
        <div className="flex bg-white border border-[#CBD3D9] p-1 rounded-[8px] shadow-xs">
          {[
            { id: "direct", label: "Direct Bookings", icon: Users },
            { id: "online", label: "Online Requests", icon: Globe }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1 rounded-[6px] text-[13px] font-medium transition-all cursor-pointer",
                activeTab === t.id ? "bg-[#0E7C86] text-white font-semibold" : "text-[#4A5961] hover:text-[#10242A]"
              )}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Standalone Table Card */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Guest Identity</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Asset Allocation</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Check-In Index</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Stay Status</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr><td colSpan="5" className="py-10 text-center text-[13px] text-[#4A5961]">
                  Accessing Stay Intelligence...
                </td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr><td colSpan="5" className="py-10 text-center text-[13px] text-[#4A5961]">
                  No matching bookings found
                </td></tr>
              ) : filteredBookings.map((b, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer" onClick={() => setSelectedBooking(b)}>
                  <td className="py-2.5 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-xs shrink-0">
                        {(b.name || "G").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#10242A]">{b.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-[#708088] truncate max-w-[150px]">
                            {b.email || b.phone || 'NO CONTACT'}
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase",
                            b.request_type?.toLowerCase() === 'direct' ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-purple-600"
                          )}>
                            {b.request_type || 'DIRECT'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <div>
                      <p className="font-semibold text-[#10242A] truncate max-w-[220px]">{b.property_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#708088]" />
                        <span className="text-[11px] text-[#4A5961]">{b.area}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-center">
                    <div>
                      <p className="font-semibold text-[#10242A]">{b.check_in_date ? new Date(b.check_in_date).toLocaleDateString('en-IN', {day:'2-digit', month:'short'}) : 'N/A'}</p>
                      <span className="text-[11px] text-[#708088]">Entry Protocol</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={cn(
                      "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase",
                      ["confirmed", "booked", "active"].includes(b.booking_status || b.status) ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      (b.booking_status || b.status) === "pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {b.booking_status || b.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setSelectedBooking(b)} className="p-1.5 rounded-[8px] bg-[#F4F6F8] text-[#4A5961] hover:text-[#0E7C86] hover:bg-[#E6F4F5] transition-all border border-[#E1E6EA] cursor-pointer"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-[8px] bg-[#F4F6F8] text-[#4A5961] hover:text-[#0E7C86] transition-all border border-[#E1E6EA] cursor-pointer"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Slide-over */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[120] flex items-center justify-end p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl h-full rounded-[24px] shadow-2xl relative overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
            <div className="px-8 py-6 border-b border-[#E1E6EA] flex items-center justify-between bg-[#F4F6F8]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[12px] bg-[#10242A] text-white flex items-center justify-center font-bold text-xl">
                  {selectedBooking.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#10242A] tracking-tight">{selectedBooking.name}</h3>
                  <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider mt-1">Reservation ID: {selectedBooking._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2.5 rounded-[10px] bg-white text-[#4A5961] hover:text-rose-600 transition-all border border-[#E1E6EA] cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold">
                    <User size={16} />
                  </div>
                  <h4 className="text-sm font-bold text-[#10242A] uppercase tracking-wider">Guest Identity</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <DetailItem icon={Mail} label="Guest Email" value={selectedBooking.email} />
                  <DetailItem icon={Phone} label="Pulse Contact" value={selectedBooking.phone || "N/A"} />
                  <DetailItem icon={Calendar} label="Booking Date" value={new Date(selectedBooking.created_at).toLocaleDateString()} />
                  <DetailItem icon={Clock} label="Protocol Type" value={selectedBooking.request_type?.toUpperCase() || "DIRECT"} highlight />
                </div>
              </section>

              <section className="bg-[#F4F6F8] p-6 rounded-[12px] border border-[#E1E6EA]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold">
                    <Building2 size={16} />
                  </div>
                  <h4 className="text-sm font-bold text-[#10242A] uppercase tracking-wider">Asset Allocation</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <DetailItem icon={Building2} label="Target Property" value={selectedBooking.property_name} />
                  <DetailItem icon={MapPin} label="Area Segment" value={selectedBooking.area} />
                  <DetailItem icon={Calendar} label="Check-In Index" value={selectedBooking.check_in_date ? new Date(selectedBooking.check_in_date).toLocaleDateString() : "Not Fixed"} />
                  <DetailItem icon={Banknote} label="Gross Value" value={`₹${selectedBooking.total_amount || selectedBooking.rent_amount}`} highlight />
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Zap size={16} />
                  </div>
                  <h4 className="text-sm font-bold text-[#10242A] uppercase tracking-wider">Operational Protocol</h4>
                </div>
                <div className="p-5 bg-[#F4F6F8] rounded-[12px] border border-[#E1E6EA] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Current Status</p>
                      <p className="text-base font-bold text-[#10242A] mt-0.5 uppercase">{(selectedBooking.booking_status || selectedBooking.status).toUpperCase()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#4A5961] italic">"{(selectedBooking.message || "No special instructions from the guest.")}"</p>
                </div>
              </section>
            </div>

            <div className="px-8 py-5 border-t border-[#E1E6EA] bg-[#F4F6F8] flex justify-between items-center">
              <button className="text-xs font-bold text-rose-500 uppercase tracking-wider hover:underline cursor-pointer">Revoke Reservation</button>
              <div className="flex gap-3">
                {(selectedBooking.booking_status || selectedBooking.status) === "pending" ? (
                  <>
                    <button 
                      onClick={() => handleStatusChange(selectedBooking._id, "rejected")}
                      disabled={isProcessing}
                      className="px-5 py-2.5 bg-white text-[#4A5961] border border-[#CBD3D9] rounded-[8px] text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Reject Lead
                    </button>
                    <button 
                      onClick={() => handleStatusChange(selectedBooking._id, "confirmed")}
                      disabled={isProcessing}
                      className="px-5 py-2.5 bg-[#0E7C86] text-white rounded-[8px] text-xs font-bold uppercase tracking-wider hover:bg-[#0B656D] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Confirm Booking
                    </button>
                  </>
                ) : (
                  <button 
                    disabled
                    className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-[8px] text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Finalized
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, val, trend }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
      <div className="mt-2">
        <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{val}</h3>
        {trend && (
          <p className="text-[11px] text-[#708088] mt-1">{trend}</p>
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, highlight }) {
  return (
    <div className="space-y-1">
       <div className="flex items-center gap-1.5 text-[#4A5961]">
          <Icon size={12} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
       </div>
       <p className={cn(
         "text-sm font-bold tracking-tight",
         highlight ? "text-[#0E7C86]" : "text-[#10242A]",
         !value && "text-[#8C9BA5] italic font-medium"
       )}>
          {value || "Field Null"}
       </p>
    </div>
  );
}
