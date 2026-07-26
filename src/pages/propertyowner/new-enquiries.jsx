import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { 
  Inbox, Search, MessageSquare, Phone, Calendar, 
  CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight, Loader2, X, User, MapPin, Building2, Wallet, Check
} from "lucide-react";

export default function NewEnquiriesPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingBid, setAcceptingBid] = useState(null);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/owners/${owner.loginId}/enquiries`);
      if (data) {
        // Filter for new/pending/request to connect
        const isNew = (status = "") => {
          const s = status.toLowerCase();
          return s === "new" || s === "pending" || s === "request to connect" || s === "";
        };
        const isBookingOrBidding = (item) => {
          const type = String(item.type || item.enquiryType || item.source || item.category || "").toLowerCase();
          const notes = String(item.notes || "").toLowerCase();
          const interest = String(item.interest || "").toLowerCase();
          
          const isBid = type.includes("bid") || notes.includes("bid") || item.bidAmount != null || item.isBid;
          const isBooking = type.includes("book") || notes.includes("book") || interest.includes("book") || item.bookingAmount != null || item.isBooking;
          
          return isBid || isBooking;
        };
        setEnquiries(data.filter(e => isNew(e.status) && isBookingOrBidding(e)));
      }
    } catch (err) {
      console.error("Error fetching enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [owner.loginId]);

  const handleAcceptBid = async (id) => {
    try {
      setAcceptingBid(id);
      await apiFetch(`/api/owners/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "accepted", chatEnabled: true })
      });
      setEnquiries(prev => prev.filter(e => e._id !== id));
      alert("Bid accepted! Chat has been enabled. You can now communicate with the tenant.");
    } catch (err) {
      console.error("Error accepting bid:", err);
      alert(`Failed to accept bid: ${err.message}`);
    } finally {
      setAcceptingBid(null);
    }
  };

  const handleReject = async (id) => {
    try {
      if (!window.confirm("Are you sure you want to reject this enquiry?")) return;
      await apiFetch(`/api/owners/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" })
      });
      setEnquiries(prev => prev.filter(e => e._id !== id));
    } catch (err) {
      console.error("Error rejecting enquiry:", err);
      alert(`Failed to reject: ${err.message}`);
    }
  };

  const filteredEnquiries = enquiries.filter(e => 
    (e.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.interest || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.propertyName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="New Enquiries" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">New Enquiries</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Review inbound tenant prospects, budget limits, and immediately trigger replies.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search enquiries by name or room preference..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading new enquiries...</p>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <Clock size={40} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-serif text-[20px] font-bold text-foreground">No New Enquiries</h3>
          <p className="text-[13px] text-muted-foreground mt-1">You are all caught up! No pending enquiries at the moment.</p>
        </div>
      ) : (
        /* Grid of New Enquiries */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnquiries.map((item) => (
            <div key={item._id} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Inbox size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {item.source || "Website"}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-[21px] font-bold text-foreground">{item.studentName || "Prospect"}</h3>
                  <p className="text-[12.5px] text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Clock size={12} /> Received {item.ts ? new Date(item.ts).toLocaleDateString("en-IN") : "Today"}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Preferred City:</span>
                    <span className="font-bold text-foreground">{item.preferredCity || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Preferred Area:</span>
                    <span className="font-bold text-foreground">{item.preferredArea || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Property Type:</span>
                    <span className="font-bold text-foreground">{item.propertyType || item.interest || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1"><Wallet size={12} /> {item.budget || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gender Preference:</span>
                    <span className="font-bold text-foreground">{item.genderPreference || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Preferred Location:</span>
                    <span className="font-bold text-foreground truncate max-w-[150px]">{item.preferredLocation || "—"}</span>
                  </div>
                  
                  {/* Verification Badges */}
                  <div className="flex gap-2 pt-2">
                    {item.mobileVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                        <Check size={10} /> Mobile Verified
                      </span>
                    )}
                    {item.emailVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                        <Check size={10} /> Email Verified
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <div className="pt-1.5">
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">Notes / Requirement:</p>
                      <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded border border-border/40 text-[11px] leading-relaxed line-clamp-2 italic">
                        "{item.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border/60 mt-6 pt-4 flex gap-2">
                <button 
                  onClick={() => handleAcceptBid(item._id)}
                  disabled={acceptingBid === item._id}
                  className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center transition disabled:opacity-50"
                >
                  {acceptingBid === item._id ? (
                    <>
                      <Loader2 size={14} className="mr-1 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={14} className="mr-1" /> Accept Bid & Enable Chat
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handleReject(item._id)}
                  className="px-4 h-10 border border-border rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center transition gap-1"
                >
                  <XCircle size={15} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PropertyOwnerLayout>
  );
}

