import React, { useState } from "react";
import toast from "react-hot-toast";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { fetchJson } from "../../utils/api";
import { cacheGet, cacheSet, cacheInvalidate } from "../../utils/cache";

const BOOKING_TTL = 2 * 60 * 1000; // 2 minutes
import { 
  Inbox, Search, MessageSquare, Phone, Calendar, 
  CheckCircle2, XCircle, Clock, CreditCard, ArrowRight, Loader2,
  Eye, X, User, Mail, MapPin
} from "lucide-react";

export default function BookingRequestPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestForView, setSelectedRequestForView] = useState(null);
  const [activeTab, setActiveTab] = useState("direct");

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvingItem, setApprovingItem] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = React.useCallback(async (bustCache = false) => {
    const cacheKey = `booking-requests:${owner.loginId}`;
    if (!bustCache) {
      const cached = cacheGet(cacheKey);
      if (cached && cached.length > 0) {
        setRequests(cached); setLoading(false);
        return;
      }
    } else {
      cacheInvalidate(cacheKey);
    }
    try {
      setLoading(true);
      const response = await fetchJson(`/api/booking?owner_id=${encodeURIComponent(owner.loginId)}&status=pending`);
      const data = response?.data || [];
      if (data.length > 0) cacheSet(cacheKey, data, BOOKING_TTL);
      setRequests(data);
    } catch (err) {
      console.error("Error fetching booking requests:", err);
    } finally {
      setLoading(false);
    }
  }, [owner.loginId]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      if (action === "approve") {
        await fetchJson(`/api/booking/requests/${id}/approve`, { method: "PUT" });
      } else if (action === "reject") {
        await fetchJson(`/api/booking/requests/${id}/reject`, { method: "PUT" });
      }
      cacheInvalidate(`booking-requests:${owner.loginId}`);
      setRequests(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error(`Error performing booking action ${action}:`, err);
      toast.error(`Action failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const confirmApprove = async () => {
    if (!approvingItem) return;
    setProcessingId(approvingItem._id);
    try {
      await fetchJson(`/api/booking/requests/${approvingItem._id}/approve`, {
        method: "PUT",
        body: JSON.stringify({
          approved_amount: paymentAmount
        })
      });
      cacheInvalidate(`booking-requests:${owner.loginId}`);
      setRequests(prev => prev.filter(r => r._id !== approvingItem._id));
      setShowApprovalModal(false);
      toast.success(`Bid approved. Chat enabled and welcome message sent to tenant.`);
    } catch(err) {
      toast.error(`Action failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = (r.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.property_name || "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeTab === "bid") {
      return r.request_type === "bid";
    } else {
      return r.request_type !== "bid";
    }
  });

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Booking Requests" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Booking Requests</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Approve incoming reservation requests, verify online token receipts, and allocate rooms.</p>
        </div>
        <button
          onClick={() => fetchRequests(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-[13px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 shrink-0"
        >
          <Loader2 size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking requests by name or property..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab("direct")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "direct" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Direct Bookings ({requests.filter(r => r.request_type !== 'bid').length})
        </button>
        <button
          onClick={() => setActiveTab("bid")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "bid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Bidding ({requests.filter(r => r.request_type === 'bid').length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading booking requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <Clock size={40} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-serif text-[20px] font-bold text-foreground">No Pending Requests</h3>
          <p className="text-[13px] text-muted-foreground mt-1">There are no new booking requests at the moment.</p>
          <button onClick={() => fetchRequests(true)} className="mt-4 text-[13px] text-primary underline underline-offset-2">Check for new requests</button>
        </div>
      ) : (
        /* Grid of Booking Requests */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map((item) => (
            <div key={item._id} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  {(() => {
                    const isPaid = item.payment_status === 'paid' || item.payment_status === 'completed' || item.is_paid === true || (item.payment_amount && item.payment_amount > 0) || (item.token_paid && item.token_paid > 0);
                    const amount = isPaid ? (item.payment_amount || item.token_paid || item.rent_amount || 0) : 0;
                    return isPaid ? (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        Token Paid: ₹{amount.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Unpaid / Payment Pending
                      </span>
                    );
                  })()}
                </div>

                <div>
                  <h3 className="font-serif text-[21px] font-bold text-foreground">{item.name}</h3>
                  <p className="text-[12.5px] text-muted-foreground mt-1">Property: <strong className="text-foreground">{item.property_name}</strong></p>
                  {item.request_type && (
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">Type: <span className="uppercase text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">{item.request_type}</span></p>
                  )}
                  <p className="text-[12px] text-muted-foreground font-mono mt-1">{item.phone || "No phone"} • {item.email}</p>
                </div>

                <div className="border-t border-border/60 pt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground font-medium block">Proposed Move-In</span>
                    <strong className="text-foreground">
                      {item.check_in_date ? new Date(item.check_in_date).toLocaleDateString("en-IN") : "Not specified"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block">Received On</span>
                    <strong className="text-foreground">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN") : "Today"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 mt-6 pt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  {item.request_type === 'bid' ? (
                    <button 
                      onClick={() => handleAction(item._id, "approve")}
                      disabled={processingId !== null}
                      className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processingId === item._id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Enabling Chat...
                        </>
                      ) : (
                        "Accept Bid & Enable Chat"
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAction(item._id, "approve")}
                      disabled={processingId !== null}
                      className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processingId === item._id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Enabling Chat...
                        </>
                      ) : (
                        "Approve & Enable Chat"
                      )}
                    </button>
                  )}
                  <button 
                    onClick={() => handleAction(item._id, "reject")}
                    disabled={processingId !== null}
                    className="px-4 h-11 border border-border rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {processingId === item._id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Reject Request"
                    )}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRequestForView(item)}
                    className="flex-1 h-10 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                  <button
                    onClick={() => window.location.href = `/propertyowner/tenantrec?name=${encodeURIComponent(item.name || '')}&email=${encodeURIComponent(item.email || '')}&phone=${encodeURIComponent(item.phone || '')}&propertyId=${encodeURIComponent(item.property_id || item.property || '')}&paidAmount=${encodeURIComponent(item.payment_amount || item.rent_amount || item.total_amount || 0)}`}
                    className="flex-[1.5] h-10 border border-blue-250 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    Onboard directly as Tenant
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRequestForView && (
        <ViewDetailsModal 
          item={selectedRequestForView} 
          onClose={() => setSelectedRequestForView(null)} 
        />
      )}
    </PropertyOwnerLayout>
  );
}

function ViewDetailsModal({ item, onClose }) {
  if (!item) return null;

  const getRequestTypeBadge = (type) => {
    switch (type) {
      case "bid":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">Bid Request</span>;
      case "website":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100 uppercase">Website Request</span>;
      case "direct":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">Direct Booking</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100 uppercase">{type || "Booking"}</span>;
    }
  };

  const formattedMoveIn = item.check_in_date 
    ? new Date(item.check_in_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
    : "Not specified";

  const formattedCreated = item.created_at
    ? new Date(item.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
    : "Today";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Eye size={20} />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Tenant Details & Bidding</h2>
              <p className="text-xs text-muted-foreground">Booking request info and tenant profile</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section: Profile & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-500/5 p-4 rounded-xl border border-border/60">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Tenant Profile</span>
              <h3 className="font-serif text-lg font-bold text-foreground">{item.name}</h3>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground font-mono">
                <div className="flex items-center gap-1.5 font-sans">
                  <Mail size={12} className="text-muted-foreground" />
                  <span>{item.email}</span>
                </div>
                {item.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-muted-foreground" />
                    <span>{item.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col md:items-end md:justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Request Type</span>
              {getRequestTypeBadge(item.request_type)}
              <span className="text-[11px] text-muted-foreground mt-2 block font-mono">
                Booking ID: {item._id}
              </span>
            </div>
          </div>

          {/* Section: Booking Details & Dates */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-1.5 border-b border-border">Stay & Property</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block font-medium">Property Name</span>
                <span className="text-foreground font-semibold">{item.property_name || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">Proposed Move-In Date</span>
                <span className="text-foreground font-semibold">{formattedMoveIn}</span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">Received On</span>
                <span className="text-foreground font-semibold">{formattedCreated}</span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">Status</span>
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-bold capitalize text-[10px] inline-block">
                  {item.status || "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Pricing & Payments */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-1.5 border-b border-border">Financial Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block font-medium">Original Rent</span>
                <span className="text-slate-600 font-bold">₹{(item.rent_amount || 0).toLocaleString("en-IN")}/mo</span>
              </div>
              {item.request_type === "bid" && (
                <div>
                  <span className="text-muted-foreground block font-medium">Proposed Bid Rent</span>
                  <span className="text-indigo-600 font-extrabold text-sm">₹{(item.bid_amount || 0).toLocaleString("en-IN")}/mo</span>
                </div>
              )}
              {item.request_type !== "bid" && (
                <>
                  <div>
                    <span className="text-muted-foreground block font-medium">Token Paid</span>
                    <span className="text-emerald-600 font-extrabold text-sm">₹{(item.payment_amount || item.rent_amount || item.total_amount || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Payment ID</span>
                    <span className="text-foreground font-mono font-medium truncate block max-w-[120px]" title={item.payment_id || item.paymentId || "N/A"}>
                      {item.payment_id || item.paymentId || "N/A"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section: Guardian / Emergency */}
          {(item.guardian_name || item.guardian_phone) && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-1.5 border-b border-border">Emergency / Guardian Details</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {item.guardian_name && (
                  <div>
                    <span className="text-muted-foreground block font-medium">Guardian Name</span>
                    <span className="text-foreground font-semibold">{item.guardian_name}</span>
                  </div>
                )}
                {item.guardian_phone && (
                  <div>
                    <span className="text-muted-foreground block font-medium">Guardian Phone</span>
                    <span className="text-foreground font-semibold font-mono">{item.guardian_phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Permanent Address */}
          {(item.address_street || item.address_city || item.address_state || item.address_postal_code) && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-1.5 border-b border-border">Permanent Address</h4>
              <div className="flex gap-2 text-xs items-start">
                <MapPin className="text-muted-foreground mt-0.5 flex-shrink-0" size={14} />
                <div>
                  <span className="text-foreground font-medium">
                    {[
                      item.address_street,
                      item.address_city,
                      item.address_state,
                      item.address_postal_code,
                      item.address_country
                    ].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Bid Note / Message */}
          {item.message && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">Message from Tenant</span>
              <p className="text-xs text-foreground italic">"{item.message}"</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-muted/20 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 h-10 border border-border bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Close
          </button>
          <button
            onClick={() => window.location.href = `/propertyowner/tenantrec?name=${encodeURIComponent(item.name || '')}&email=${encodeURIComponent(item.email || '')}&phone=${encodeURIComponent(item.phone || '')}&propertyId=${encodeURIComponent(item.property_id || item.property || '')}&paidAmount=${encodeURIComponent(item.payment_amount || item.rent_amount || item.total_amount || 0)}`}
            className="px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            Onboard directly as Tenant
          </button>
        </div>

      </div>
    </div>
  );
}
