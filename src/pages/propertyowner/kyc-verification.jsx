import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerTenants, clearOwnerFetchCache } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { 
  UserCheck, Search, FileText, CheckCircle2, XCircle, 
  Clock, ShieldCheck, Eye, Download, AlertTriangle
} from "lucide-react";

export default function KycVerificationPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchKycData = async () => {
    try {
      setLoading(true);
      const all = await fetchOwnerTenants(owner.loginId);
      const sorted = [...(all || [])].sort((a, b) => {
        if (a.kycStatus === "submitted" && b.kycStatus !== "submitted") return -1;
        if (a.kycStatus !== "submitted" && b.kycStatus === "submitted") return 1;
        return 0;
      });
      setTenants(sorted);
    } catch (err) {
      console.error("Error fetching KYC tenants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycData();
  }, [owner.loginId]);

  const handleApprove = async (tenantId) => {
    try {
      await apiFetch("/api/tenants/kyc/approve", {
        method: "POST",
        body: JSON.stringify({ tenantId })
      });
      clearOwnerFetchCache(owner.loginId);
      fetchKycData();
    } catch (err) {
      alert("Error approving KYC: " + err.message);
    }
  };

  const handleReject = async (tenantId) => {
    try {
      await apiFetch("/api/tenants/kyc/reject", {
        method: "POST",
        body: JSON.stringify({ tenantId })
      });
      clearOwnerFetchCache(owner.loginId);
      fetchKycData();
    } catch (err) {
      alert("Error rejecting KYC: " + err.message);
    }
  };

  const filteredKyc = tenants.filter(k => 
    (k.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (k.roomNo || k.room?.number || "").includes(search)
  );

  const [reviewModalTenant, setReviewModalTenant] = useState(null);

  const getStatusLabel = (status) => {
    if (status === "verified") return "Verified";
    if (status === "mismatch_review") return "🚨 Mismatch Review";
    if (status === "audit_pending" || status === "pending_verification") return "Audit Pending";
    if (status === "submitted") return "Pending Approval";
    if (status === "rejected") return "Rejected";
    return "Pending Upload";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "verified": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "mismatch_review": return "bg-rose-50 text-rose-600 border-rose-200 animate-pulse";
      case "audit_pending":
      case "pending_verification": return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
      case "submitted": return "bg-amber-50 text-amber-600 border-amber-100";
      case "rejected": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="KYC Validation" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">KYC Validation & Verification</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Verify national identity cards, detect Aadhaar OCR data mismatches, and approve tenant onboarding.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Tenant Name or Room..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* KYC Verification Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="px-6 py-3.5 font-semibold">Tenant Name</th>
                <th className="px-6 py-3.5 font-semibold">Room</th>
                <th className="px-6 py-3.5 font-semibold">Document Type</th>
                <th className="px-6 py-3.5 font-semibold">Aadhaar / Ref No</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading KYC validation list...</td>
                </tr>
              ) : filteredKyc.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No KYC entries found.</td>
                </tr>
              ) : (
                filteredKyc.map((k) => {
                  const docType = k.kyc?.idProof || "Aadhaar Card";
                  const docNo = k.kyc?.aadhaarNumber || k.kyc?.aadhar || "-";

                  return (
                    <tr key={k._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">{k.name || k.fullName}</td>
                      <td className="px-6 py-4 font-bold text-foreground">Room {k.roomNo || k.room?.number || "N/A"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{docType}</td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">{docNo}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusColor(k.kycStatus)}`}>
                          {k.kycStatus === "mismatch_review" && <AlertTriangle size={12} />}
                          {getStatusLabel(k.kycStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => setReviewModalTenant(k)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-bold hover:bg-muted inline-flex items-center gap-1.5 transition-colors cursor-pointer" 
                          title="Review & Compare Data"
                        >
                          <Eye size={14} className="text-[#EE4266]" /> Review Data
                        </button>

                        {(k.kycStatus !== "verified" && k.kycStatus !== "rejected") && (
                          <>
                            <button 
                              onClick={() => handleApprove(k._id)}
                              className="size-8 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 inline-flex items-center justify-center transition-colors cursor-pointer"
                              title="Approve & Verify Tenant"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleReject(k._id)}
                              className="size-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 inline-flex items-center justify-center transition-colors cursor-pointer"
                              title="Reject / Request Re-upload"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── KYC COMPARISON & VERIFICATION MODAL ── */}
      {reviewModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#EE4266] to-[#d63a5b] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck size={20} />
                  KYC Verification & Mismatch Review
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Tenant: {reviewModalTenant.name || reviewModalTenant.fullName} · Room {reviewModalTenant.roomNo || "N/A"}
                </p>
              </div>
              <button 
                onClick={() => setReviewModalTenant(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              
              {/* Mismatch Alert Banner if present */}
              {(reviewModalTenant.kycStatus === "mismatch_review" || reviewModalTenant.kyc?.mismatchReasons) && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-rose-900 uppercase">Aadhaar Data Mismatch Flagged</h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      {reviewModalTenant.kyc?.mismatchReasons || "The uploaded Aadhaar card data differs from the entered tenant information."}
                    </p>
                  </div>
                </div>
              )}

              {/* Side-by-Side Data Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Column 1: Tenant Submitted Information */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">1. Tenant / Owner Entered Profile</h4>
                  
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tenant Full Name</span>
                    <span className="text-sm font-black text-slate-800">{reviewModalTenant.name || reviewModalTenant.fullName || "—"}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Entered Aadhaar Number</span>
                    <span className="text-sm font-mono font-bold text-slate-800">{reviewModalTenant.kyc?.aadhaarNumber || reviewModalTenant.aadhar || reviewModalTenant.idProofNumber || "—"}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone Number</span>
                    <span className="text-sm font-semibold text-slate-800">{reviewModalTenant.phone || reviewModalTenant.guardianNumber || "—"}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Emergency Contact</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {reviewModalTenant.emergencyName || reviewModalTenant.additionalDetails?.emergencyName || "—"} 
                      ({reviewModalTenant.relationship || reviewModalTenant.additionalDetails?.relationship || "Father"})
                    </span>
                  </div>
                </div>

                {/* Column 2: Uploaded Document Card Images */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">2. Uploaded Aadhaar Document Cards</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      {(reviewModalTenant.kyc?.aadhaarFront || reviewModalTenant.aadhaarFront || reviewModalTenant.idProofFile) ? (
                        <img 
                          src={reviewModalTenant.kyc?.aadhaarFront || reviewModalTenant.aadhaarFront || reviewModalTenant.idProofFile} 
                          alt="Front" 
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => window.open(reviewModalTenant.kyc?.aadhaarFront || reviewModalTenant.aadhaarFront || reviewModalTenant.idProofFile, "_blank")}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">No Front File</div>
                      )}
                    </div>

                    <div className="h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      {(reviewModalTenant.kyc?.aadhaarBack || reviewModalTenant.aadhaarBack) ? (
                        <img 
                          src={reviewModalTenant.kyc?.aadhaarBack || reviewModalTenant.aadhaarBack} 
                          alt="Back" 
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => window.open(reviewModalTenant.kyc?.aadhaarBack || reviewModalTenant.aadhaarBack, "_blank")}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">No Back File</div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">Click on document image to open full size in new tab.</p>
                </div>

              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => setReviewModalTenant(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleReject(reviewModalTenant._id);
                    setReviewModalTenant(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Reject / Re-upload
                </button>

                <button
                  onClick={() => {
                    handleApprove(reviewModalTenant._id);
                    setReviewModalTenant(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Approve & Onboard Tenant
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </PropertyOwnerLayout>
  );
}

