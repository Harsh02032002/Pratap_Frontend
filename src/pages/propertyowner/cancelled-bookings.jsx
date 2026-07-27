import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { 
  Ban, Search, FileText, Download, User, Info, Calendar
} from "lucide-react";

export default function CancelledBookingsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  React.useEffect(() => {
    let active = true;
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`/api/booking?owner_id=${owner.loginId}`);
        if (active && response?.data) {
          const cancelledList = response.data.filter(b => 
            b.status === "rejected" || 
            b.status === "cancelled" || 
            b.booking_status === "rejected" || 
            b.booking_status === "cancelled"
          );
          setBookings(cancelledList);
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

  const handleViewSettlement = (b) => {
    setSelectedSettlement(b);
  };

  const filteredBookings = bookings.filter(b => 
    (b.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.property_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Cancelled Reservations" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Cancelled Reservations</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Historical records of cancelled booking requests, refund details, and reasons.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cancelled bookings by name or property..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading cancelled bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <Ban size={40} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-serif text-[20px] font-bold text-foreground">No Cancelled Bookings</h3>
          <p className="text-[13px] text-muted-foreground mt-1">There are no cancelled or rejected bookings on record.</p>
        </div>
      ) : (
        /* Grid of Cancelled Bookings */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((item) => (
            <div key={item._id} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <Ban size={20} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                    Retained (No Refund)
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-[21px] font-bold text-foreground">{item.name}</h3>
                  <p className="text-[12.5px] text-muted-foreground mt-1">Property: <strong className="text-foreground">{item.property_name}</strong></p>
                  <p className="text-[12.5px] text-muted-foreground mt-1">Cancelled On: <strong className="text-foreground">{item.updated_at ? new Date(item.updated_at).toLocaleDateString("en-IN") : "Today"}</strong></p>
                  {item.message && (
                    <p className="text-[12.5px] text-muted-foreground mt-2 italic bg-muted/40 p-3 rounded-xl border border-border/40">
                      " {item.message} "
                    </p>
                  )}
                </div>

                <div className="border-t border-border/60 pt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground font-medium block">Token Amount Paid</span>
                    <strong className="text-[14px] text-foreground">
                      ₹{((item.payment_status === 'paid' || item.is_paid || item.payment_amount > 0 || item.token_paid > 0) ? (item.payment_amount || item.token_paid || item.rent_amount || 0) : 0).toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block font-bold text-rose-600">Refund Settlement</span>
                    <strong className="text-[14px] text-rose-600">
                      ₹0
                    </strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 mt-6 pt-4 flex gap-2">
                <button 
                  onClick={() => handleViewSettlement(item)}
                  className="flex-1 h-11 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                >
                  <FileText size={14} className="mr-1.5" /> View Settlement details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settlement Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-serif text-[22px] text-foreground font-bold flex items-center gap-2">
                <FileText className="size-5 text-primary" /> Settlement Details
              </h3>
              <button onClick={() => setSelectedSettlement(null)} className="p-1 text-muted-foreground hover:bg-muted rounded-full">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[12px] font-bold text-slate-700 mb-1">Tenant Name</p>
                <p className="text-[14px] text-foreground">{selectedSettlement.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] font-bold text-slate-700 mb-1">Token Paid</p>
                  <p className="text-[16px] font-bold text-emerald-600">
                    ₹{((selectedSettlement.payment_status === 'paid' || selectedSettlement.is_paid || selectedSettlement.payment_amount > 0 || selectedSettlement.token_paid > 0) ? (selectedSettlement.payment_amount || selectedSettlement.token_paid || selectedSettlement.rent_amount || 0) : 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-700 mb-1">Status</p>
                  <p className="text-[14px] text-foreground capitalize">{selectedSettlement.status || selectedSettlement.booking_status}</p>
                </div>
              </div>
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl mt-4">
                <p className="text-[12px] font-bold text-rose-800 mb-1">Refund Policy</p>
                <p className="text-[13px] text-rose-600">Retained (No refund for owner rejection or client cancellation unless authorized)</p>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedSettlement(null)}
                className="px-6 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
