import React, { useState, useEffect, useMemo } from "react";
import { Star, Search, Download, CheckCircle, XCircle, EyeOff, BookOpen, ShieldCheck, Building2, Eye, MapPin, X, Loader2 } from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { fetchJson } from "../../utils/api";

const cn = (...c) => c.filter(Boolean).join(" ");

const MOD_CONFIG = {
  Approved: { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: "Approved" },
  Pending: { cls: "bg-amber-50 text-amber-700 border border-amber-200", label: "Pending" },
  Flagged: { cls: "bg-red-50 text-red-700 border border-red-200", label: "Flagged" },
  Hidden: { cls: "bg-slate-100 text-slate-600 border border-slate-200", label: "Hidden" },
  Rejected: { cls: "bg-rose-50 text-rose-700 border border-rose-200", label: "Rejected" },
};

function Stars({ rating, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size} className={s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
      ))}
    </div>
  );
}

export default function AllReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingF, setRatingF] = useState("all");
  const [modF, setModF] = useState("all");
  const [verifiedF, setVerifiedF] = useState("all");

  // Property details modal state
  const [selectedPropId, setSelectedPropId] = useState(null);
  const [propDetails, setPropDetails] = useState(null);
  const [propLoading, setPropLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!selectedPropId) {
      setPropDetails(null);
      setActiveImageIndex(0);
      return;
    }
    const fetchProp = async () => {
      setPropLoading(true);
      try {
        let res = await fetchJson(`/api/approved-properties/${selectedPropId}`);
        if (res && res.success && res.property) {
          setPropDetails(res.property);
        } else {
          res = await fetchJson(`/api/properties/${selectedPropId}`);
          if (res && res.success && res.property) {
            setPropDetails(res.property);
          }
        }
      } catch (err) {
        console.error("Error fetching property:", err);
      } finally {
        setPropLoading(false);
      }
    };
    fetchProp();
  }, [selectedPropId]);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/reviews/admin/all");
      if (res.success) {
        setReviews(res.data || []);
      }
    } catch (err) {
      console.error("Error loading admin reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => reviews.filter(r => {
    const s = search.toLowerCase();
    const reviewTextVal = r.review || r.reviewText || "";
    const matchSearch = !search || (r.name && r.name.toLowerCase().includes(s)) || (r.propertyName && r.propertyName.toLowerCase().includes(s)) || reviewTextVal.toLowerCase().includes(s);
    const matchRating = ratingF === "all" || r.rating === Number(ratingF);
    const matchMod = modF === "all" || String(r.status).toLowerCase() === modF.toLowerCase();
    const matchVerified = verifiedF === "all" || (verifiedF === "verified" ? r.isVerifiedStay : !r.isVerifiedStay);
    return matchSearch && matchRating && matchMod && matchVerified;
  }), [reviews, search, ratingF, modF, verifiedF]);

  const counts = {
    total: reviews.length,
    avg: reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "0.0",
    verified: reviews.filter(r => r.isVerifiedStay).length,
    hidden: reviews.filter(r => r.status === "Hidden").length,
  };

  const handleAction = async (id, action) => {
    const statusMap = { approve: "Approved", reject: "Rejected", hide: "Hidden" };
    try {
      const res = await fetchJson(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusMap[action] })
      });
      if (res.success) {
        loadReviews();
      }
    } catch (err) {
      alert("Error moderating review: " + err.message);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Review ID", "Tenant", "Property", "Owner", "Rating", "Date", "Verified Stay", "Status"],
      ...filtered.map(r => [r._id, r.name, r.propertyName, r.ownerId, r.rating, r.createdAt, r.isVerifiedStay, r.status])
    ].map(row => row.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "reviews.csv";
    a.click();
  };

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <PageHeader
        title="All Reviews"
        subtitle="Manage verified tenant reviews across all properties."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="bg-white border border-slate-200/80 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer">
              <Download size={14} /> Export CSV
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-semibold text-xs">Loading reviews...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Reviews", val: counts.total, icon: BookOpen },
              { label: "Average Rating", val: `${counts.avg} ★`, icon: Star },
              { label: "Verified Stay", val: counts.verified, icon: ShieldCheck },
              { label: "Hidden Reviews", val: counts.hidden, icon: EyeOff },
            ].map(c => (
              <div key={c.label} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-[#095256]/10 text-[#095256] flex items-center justify-center mb-2.5">
                    <c.icon size={16} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{c.val}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{c.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Outside Search & Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative group w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, property, review text..." className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#095256]/20 focus:border-[#095256] transition-all shadow-2xs" />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select value={ratingF} onChange={e => setRatingF(e.target.value)} className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer">
                <option value="all">All Ratings</option>
                {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} Stars</option>)}
              </select>
              <select value={modF} onChange={e => setModF(e.target.value)} className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer">
                <option value="all">All Moderation</option>
                {Object.keys(MOD_CONFIG).map(k => <option key={k} value={k.toLowerCase()}>{MOD_CONFIG[k].label}</option>)}
              </select>
              <select value={verifiedF} onChange={e => setVerifiedF(e.target.value)} className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer">
                <option value="all">All Verified</option>
                <option value="verified">Verified Stay</option>
                <option value="unverified">Non-Verified</option>
              </select>
            </div>
          </div>

          {/* Standalone Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
                  <tr>
                    <th className="px-5 py-3">Reviewer / Property</th>
                    <th className="px-5 py-3">Rating</th>
                    <th className="px-5 py-3">Content</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E6EA]">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-[#4A5961] font-semibold">No Data Available</td></tr>
                  ) : filtered.map(r => {
                    const statusKey = Object.keys(MOD_CONFIG).find(k => k.toLowerCase() === String(r.status).toLowerCase()) || "Approved";
                    const statusInfo = MOD_CONFIG[statusKey];
                    return (
                      <tr key={r._id} className="hover:bg-[#F4F6F8]/60 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-bold text-[#10242A] flex items-center gap-1.5">
                            {r.name || "Tenant User"}
                            {r.isVerifiedStay && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck size={9} /> Verified Stay
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#4A5961] mt-0.5 flex items-center gap-1">
                            <Building2 size={10} /> {r.propertyName || "Property"}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Stars rating={r.rating} />
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs text-[#4A5961] max-w-sm truncate" title={r.review || r.reviewText}>
                            {r.review || r.reviewText || "Great stay experience."}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#4A5961]">
                          {new Date(r.createdAt || r.reviewDate || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold", statusInfo.cls)}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setSelectedPropId(r.propertyId)} className="p-1.5 text-[#4A5961] hover:text-[#0E7C86] hover:bg-[#E6F4F5] rounded-[6px] transition-all" title="View Property"><Eye size={14} /></button>
                            <button onClick={() => handleAction(r._id, "approve")} className="p-1.5 text-[#4A5961] hover:text-emerald-700 hover:bg-emerald-50 rounded-[6px] transition-all" title="Approve"><CheckCircle size={14} /></button>
                            <button onClick={() => handleAction(r._id, "reject")} className="p-1.5 text-[#4A5961] hover:text-rose-700 hover:bg-rose-50 rounded-[6px] transition-all" title="Reject"><XCircle size={14} /></button>
                            <button onClick={() => handleAction(r._id, "hide")} className="p-1.5 text-[#4A5961] hover:text-slate-700 hover:bg-slate-100 rounded-[6px] transition-all" title="Hide"><EyeOff size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Property Details Modal */}
          {selectedPropId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="bg-white w-full max-w-2xl rounded-[16px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative border border-[#E1E6EA]">
                {/* Modal Header */}
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => setSelectedPropId(null)}
                    className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#10242A] flex items-center justify-center shadow-md transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                {propLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#0E7C86] animate-spin" />
                    <p className="text-xs font-bold text-[#4A5961] uppercase tracking-wider animate-pulse">Loading Property details...</p>
                  </div>
                ) : !propDetails ? (
                  <div className="py-20 text-center">
                    <Building2 className="w-16 h-16 text-[#4A5961] mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-[#10242A]">Property Details Not Found</h3>
                    <p className="text-xs text-[#4A5961] mt-1">We couldn't retrieve the details for this property.</p>
                    <button 
                      onClick={() => setSelectedPropId(null)} 
                      className="mt-6 px-5 py-2 bg-[#0E7C86] text-white rounded-[10px] text-xs font-semibold shadow-xs hover:bg-[#09626A] transition-all"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (() => {
                  const title = propDetails.title || propDetails.propertyInfo?.name || propDetails.propertyName || "Unnamed Property";
                  const desc = propDetails.description || propDetails.propertyInfo?.description || "No description available.";
                  const address = propDetails.address || propDetails.propertyInfo?.address || "";
                  const area = propDetails.locality || propDetails.propertyInfo?.area || "";
                  const city = propDetails.city || propDetails.propertyInfo?.city || "";
                  const state = propDetails.state || propDetails.propertyInfo?.state || "";
                  const rent = propDetails.monthlyRent || propDetails.propertyInfo?.rent || 0;
                  const type = propDetails.propertyType || propDetails.propertyInfo?.propertyType || "Co-living";
                  const gender = propDetails.gender || propDetails.propertyInfo?.genderSuitability || "Any";
                  
                  // Extract images
                  const allImages = [];
                  if (propDetails.featuredImage) allImages.push(propDetails.featuredImage);
                  if (propDetails.images && Array.isArray(propDetails.images)) {
                    propDetails.images.forEach(img => { if (img && !allImages.includes(img)) allImages.push(img); });
                  }

                  return (
                    <div className="flex flex-col h-full overflow-y-auto">
                      {/* Photo Section */}
                      <div className="relative w-full h-[260px] bg-[#F4F6F8] shrink-0">
                        {allImages.length > 0 ? (
                          <>
                            <img 
                              src={allImages[activeImageIndex]} 
                              alt={title}
                              className="w-full h-full object-cover"
                            />
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#4A5961]">
                            <Building2 size={44} className="text-[#4A5961] mb-2" />
                            <span className="text-xs font-bold uppercase tracking-wider">No photos uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* Info Section */}
                      <div className="p-6 space-y-5">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="bg-[#E6F4F5] text-[#0E7C86] border border-[#0E7C86]/20 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px]">
                              {type}
                            </span>
                          </div>
                          <h2 className="text-xl font-bold text-[#10242A] tracking-tight leading-snug">{title}</h2>
                          {(address || area || city) && (
                            <p className="text-xs text-[#4A5961] font-medium mt-1 flex items-center gap-1">
                              <MapPin size={12} className="text-[#0E7C86] shrink-0" />
                              {[address, area, city, state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-y border-[#E1E6EA] py-3">
                          <div>
                            <p className="text-[9px] font-bold text-[#4A5961] uppercase tracking-wider mb-1">Starting Rent</p>
                            <p className="text-lg font-bold text-[#10242A] leading-none">₹{Number(rent).toLocaleString("en-IN")}<span className="text-xs font-normal text-[#4A5961]">/mo</span></p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-[#10242A] uppercase tracking-wider mb-2">About Property</h4>
                          <p className="text-xs text-[#4A5961] leading-relaxed font-medium">{desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
