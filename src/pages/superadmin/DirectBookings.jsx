import React, { useEffect, useMemo, useState } from "react";
import { 
  Users, Calendar, ChevronRight, TrendingUp, ArrowUpRight, 
  MapPin, IndianRupee, Clock, Percent, Search, Filter,
  MoreVertical, Download, Plus, CheckCircle2, AlertCircle,
  XCircle, RefreshCw, Eye, Trash2, Mail, Phone,
  Building2, CreditCard, Banknote, ShieldCheck,
  Zap, ArrowDownRight, LayoutGrid, Sheet, Loader2,
  CalendarCheck, User, Info, Check, X, Globe
} from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
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
    <div className="space-y-6 text-[#10242A]">
      {/* Header */}
      <PageHeader
        title="Direct Bookings"
        subtitle="Verified direct reservations and guest stay intelligence hub."
        actions={
          <button 
            onClick={exportToExcel}
            className="bg-white border border-slate-200/80 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sheet size={14} /> Export Fiscal Audit
          </button>
        }
      />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={CalendarCheck} label="Total Bookings" val={stats.total} color="blue" trend="+12% Delta" up />
          <StatCard icon={CheckCircle2} label="Confirmed Pulse" val={stats.confirmed} color="emerald" trend="Optimal" up />
          <StatCard icon={AlertCircle} label="Pending Audit" val={stats.pending} color="amber" trend="Awaiting" />
          <StatCard icon={Banknote} label="Gross Value" val={`₹${(stats.revenue / 100000).toFixed(1)}L`} color="indigo" trend="Revenue Flow" up />
        </div>

        {/* Outside Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Tabs switcher */}
            <div className="flex bg-white border border-slate-200/80 p-1 rounded-xl shadow-2xs">
              {[
                { id: "direct", label: "Direct Bookings", icon: Users },
                { id: "online", label: "Online Requests", icon: Globe }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    activeTab === t.id ? "bg-[#095256] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filter */}
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer"
            >
              <option value="all">All States</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search Guests, Properties..." 
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#095256]/20 focus:border-[#095256] transition-all shadow-2xs" 
              />
            </div>
            <button onClick={loadBookings} className="p-2 rounded-xl bg-white text-slate-500 hover:text-[#095256] transition-all border border-slate-200/80 shadow-2xs cursor-pointer">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Standalone Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-10 py-8">Guest Identity</th>
                  <th className="px-6 py-8">Asset Allocation</th>
                  <th className="px-6 py-8 text-center">Check-In Index</th>
                  <th className="px-6 py-8 text-center">Stay Status</th>
                  <th className="px-10 py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="5" className="py-40 text-center">
                    <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-8" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Accessing Stay Intelligence...</p>
                  </td></tr>
                ) : filteredBookings.length === 0 ? (
                  <tr><td colSpan="5" className="py-40 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                      <CalendarCheck size={40} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching bookings found</p>
                  </td></tr>
                ) : filteredBookings.map((b, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-all duration-300 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 text-blue-600 flex items-center justify-center font-bold text-xl shadow-xl shadow-slate-200/40 transition-transform group-hover:scale-110 shrink-0">
                          {(b.name || "G").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-800 tracking-tight">{b.name}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                              {b.email || b.phone || 'NO CONTACT'}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                              b.request_type?.toLowerCase() === 'direct' ? "bg-amber-100 text-amber-600" : "bg-purple-100 text-purple-600"
                            )}>
                              {b.request_type || 'DIRECT'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-8">
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-bold text-slate-700 leading-none truncate max-w-[220px]">{b.property_name}</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{b.area}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-8 text-center">
                      <div className="inline-flex flex-col items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-800 leading-none">{b.check_in_date ? new Date(b.check_in_date).toLocaleDateString('en-IN', {day:'2-digit', month:'short'}) : 'N/A'}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Entry Protocol</span>
                      </div>
                    </td>
                    <td className="px-6 py-8 text-center">
                      <span className={cn(
                        "text-[8px] font-bold px-4 py-1.5 rounded-xl border uppercase tracking-[0.2em] shadow-sm",
                        ["confirmed", "booked", "active"].includes(b.booking_status || b.status) ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        (b.booking_status || b.status) === "pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {b.booking_status || b.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedBooking(b)} className="p-3.5 rounded-2xl bg-white text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all border border-slate-100 shadow-md active:scale-95"><Eye className="w-5 h-5" /></button>
                        <button className="p-3.5 rounded-2xl bg-white text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-md active:scale-95"><MoreVertical className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Booking Detail Slide-over */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[120] flex items-center justify-end p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl h-full rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
            <div className="px-10 py-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center font-bold text-3xl shadow-2xl">
                  {selectedBooking.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{selectedBooking.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Reservation ID: {selectedBooking._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-4 rounded-3xl bg-white text-slate-400 hover:text-rose-600 transition-all shadow-xl border border-slate-100 active:scale-90">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
              <section>
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-200">
                    <User size={20} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 uppercase tracking-widest">Guest Identity</h4>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <DetailItem icon={Mail} label="Guest Email" value={selectedBooking.email} />
                  <DetailItem icon={Phone} label="Pulse Contact" value={selectedBooking.phone || "N/A"} />
                  <DetailItem icon={Calendar} label="Booking Date" value={new Date(selectedBooking.created_at).toLocaleDateString()} />
                  <DetailItem icon={Clock} label="Protocol Type" value={selectedBooking.request_type?.toUpperCase() || "DIRECT"} highlight />
                </div>
              </section>

              <section className="bg-indigo-50/30 p-8 rounded-[2.5rem] border border-indigo-100">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-200">
                    <Building2 size={20} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 uppercase tracking-widest">Asset Allocation</h4>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <DetailItem icon={Building2} label="Target Property" value={selectedBooking.property_name} />
                  <DetailItem icon={MapPin} label="Area Segment" value={selectedBooking.area} />
                  <DetailItem icon={Calendar} label="Check-In Index" value={selectedBooking.check_in_date ? new Date(selectedBooking.check_in_date).toLocaleDateString() : "Not Fixed"} />
                  <DetailItem icon={Banknote} label="Gross Value" value={`₹${selectedBooking.total_amount || selectedBooking.rent_amount}`} highlight />
                </div>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-lg shadow-amber-200">
                    <Zap size={20} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 uppercase tracking-widest">Operational Protocol</h4>
                </div>
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</p>
                      <p className="text-lg font-bold text-slate-800 mt-1 uppercase tracking-tighter">{(selectedBooking.booking_status || selectedBooking.status).toUpperCase()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 italic">"{(selectedBooking.message || "No special instructions from the guest.")}"</p>
                </div>
              </section>
            </div>

            <div className="px-10 py-10 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <button className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline">Revoke Reservation</button>
              <div className="flex gap-4">
                {(selectedBooking.booking_status || selectedBooking.status) === "pending" ? (
                  <>
                    <button 
                      onClick={() => handleStatusChange(selectedBooking._id, "rejected")}
                      disabled={isProcessing}
                      className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      Reject Lead
                    </button>
                    <button 
                      onClick={() => handleStatusChange(selectedBooking._id, "confirmed")}
                      disabled={isProcessing}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Confirm Booking
                    </button>
                  </>
                ) : (
                  <button 
                    disabled
                    className="px-8 py-4 bg-emerald-100 text-emerald-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3"
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

function StatCard({ icon: Icon, label, val, color, trend, up }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 flex items-start gap-5 group hover:translate-y-[-5px] transition-all duration-500">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm transition-transform group-hover:rotate-6", colors[color])}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none truncate">{label}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-3">{val}</p>
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider",
          up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, highlight }) {
  return (
    <div className="space-y-2">
       <div className="flex items-center gap-2 text-slate-400">
          <Icon size={12} />
          <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
       </div>
       <p className={cn(
         "text-sm font-bold tracking-tight",
         highlight ? "text-blue-600" : "text-slate-700",
         !value && "text-slate-300 italic font-medium"
       )}>
          {value || "Field Null"}
       </p>
    </div>
  );
}
