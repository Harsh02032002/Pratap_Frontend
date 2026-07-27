import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { 
  CheckCircle, Search, Mail, Phone, Calendar, 
  FileText, ShieldCheck, Download, Ban
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function ConfirmedBookingsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("direct");

  React.useEffect(() => {
    let active = true;
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`/api/booking?owner_id=${owner.loginId}&status=confirmed`);
        if (active && response?.data) {
          setBookings(response.data);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBookings();
    return () => { active = false; };
  }, [owner.loginId]);

  const handleDownload = (b) => {
    const headers = ["Booking ID,Tenant Name,Email,Phone,Property,Token Amount,Booking Date,Check-in Date,Status"];
    const row = `"${b._id}","${b.name || ""}","${b.email || ""}","${b.phone || ""}","${b.property_name || ""}","${b.payment_amount || b.rent_amount || b.total_amount || 0}","${b.created_at ? new Date(b.created_at).toLocaleDateString() : ""}","${b.check_in_date ? new Date(b.check_in_date).toLocaleDateString() : ""}","${b.payment_status || "confirmed"}"`;
    const csvContent = "data:text/csv;charset=utf-8," + [headers, row].join("\n");
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `booking_${b._id}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await apiFetch(`/api/booking/requests/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" })
      });
      setBookings(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesTab = activeTab === "bid" ? b.request_type === "bid" : b.request_type !== "bid";
    const matchesSearch = (b.name || "").toLowerCase().includes(search.toLowerCase()) ||
                          (b.property_name || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Confirmed Bookings" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 hidden md:flex">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Confirmed Bookings</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">List of confirmed tenant bookings, agreement signing states, and schedules.</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6 w-fit">
        <button
          onClick={() => setActiveTab("direct")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-bold transition-all",
            activeTab === "direct" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Direct Bookings
        </button>
        <button
          onClick={() => setActiveTab("bid")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-bold transition-all",
            activeTab === "bid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Bid Bookings
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings by name or property..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <CheckCircle size={40} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-serif text-[20px] font-bold text-foreground">No Confirmed Bookings</h3>
          <p className="text-[13px] text-muted-foreground mt-1">There are no confirmed bookings for your properties at this time.</p>
        </div>
      ) : (
        /* Bookings List */
        <div className="w-full">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                    <th className="px-6 py-3.5 font-semibold">Tenant Name</th>
                    <th className="px-6 py-3.5 font-semibold">Property</th>
                    <th className="px-6 py-3.5 font-semibold">Token Surcharge</th>
                    <th className="px-6 py-3.5 font-semibold">Booking Date</th>
                    <th className="px-6 py-3.5 font-semibold">Scheduled Check-in</th>
                    <th className="px-6 py-3.5 font-semibold">Rent Agreement</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{b.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{b.phone || b.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{b.property_name}</div>
                        {b.request_type && (
                          <div className="text-[11px] text-muted-foreground uppercase">{b.request_type}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        {((b.payment_status === 'paid' || b.payment_status === 'completed' || b.is_paid || b.payment_amount > 0 || b.token_paid > 0) ? `₹${(b.payment_amount || b.token_paid || b.rent_amount || 0).toLocaleString("en-IN")}` : "₹0 (Unpaid)")}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN") : "Today"}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {b.check_in_date ? new Date(b.check_in_date).toLocaleDateString("en-IN") : "Not scheduled"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          b.payment_status === "completed" 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {b.payment_status === "completed" ? "Signed & Paid" : "Pending Sign"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => window.location.href = `/propertyowner/tenantrec?name=${encodeURIComponent(b.name || '')}&email=${encodeURIComponent(b.email || '')}&phone=${encodeURIComponent(b.phone || '')}&propertyId=${encodeURIComponent(b.property_id || b.property || '')}&paidAmount=${encodeURIComponent(b.payment_amount || b.rent_amount || b.total_amount || 0)}`}
                          className="h-8 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[11.5px] font-medium transition-colors"
                          title="Onboard as Tenant"
                        >
                          Add Tenant
                        </button>
                        <button 
                          onClick={() => handleDownload(b)}
                          className="size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors" 
                          title="Download Booking Summary"
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          onClick={() => handleCancel(b._id)}
                          className="size-8 rounded-lg border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 inline-flex items-center justify-center transition-colors" 
                          title="Cancel Booking"
                        >
                          <Ban size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden space-y-3 pb-12">
            {filteredBookings.map((b) => (
              <div key={`mob-${b._id}`} className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-[16px] font-black text-slate-900">{b.name}</h3>
                    <p className="text-[11.5px] font-semibold text-slate-500 mt-0.5">{b.phone || b.email}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                    b.payment_status === "completed" 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-amber-50 text-amber-600 border-amber-100"
                  }`}>
                    {b.payment_status === "completed" ? "Signed & Paid" : "Pending Sign"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Property</p>
                    <p className="text-[13px] font-black text-slate-800">{b.property_name}</p>
                    {b.request_type && (
                      <p className="text-[10px] font-bold text-blue-600 mt-0.5">{b.request_type.toUpperCase()}</p>
                    )}
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Token Amt</p>
                    <p className="text-[16px] font-black text-emerald-700">
                      {((b.payment_status === 'paid' || b.payment_status === 'completed' || b.is_paid || b.payment_amount > 0 || b.token_paid > 0) ? `₹${(b.payment_amount || b.token_paid || b.rent_amount || 0).toLocaleString("en-IN")}` : "₹0 (Unpaid)")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Booked On</p>
                    <p className="text-[11px] font-semibold text-slate-700">{b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN") : "Today"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check-in</p>
                    <p className="text-[11px] font-semibold text-slate-700">{b.check_in_date ? new Date(b.check_in_date).toLocaleDateString("en-IN") : "Not scheduled"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => window.location.href = `/propertyowner/tenantrec?name=${encodeURIComponent(b.name || '')}&email=${encodeURIComponent(b.email || '')}&phone=${encodeURIComponent(b.phone || '')}&propertyId=${encodeURIComponent(b.property_id || b.property || '')}&paidAmount=${encodeURIComponent(b.payment_amount || b.rent_amount || b.total_amount || 0)}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-blue-705 transition-colors shadow-sm"
                  >
                    Add Tenant (Onboard)
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleDownload(b)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button 
                      onClick={() => handleCancel(b._id)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
