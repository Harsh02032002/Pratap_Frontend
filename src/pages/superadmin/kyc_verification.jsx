import React, { useEffect, useMemo, useState } from "react";
import { Search, Loader2, CheckCircle2, XCircle, FileText, Image as ImageIcon } from "lucide-react";
import { fetchJson, getAuthHeader, API_URL } from "../../utils/api";
import { broadcastStatusChange, useLiveStatusSync } from "../../utils/liveStatusSync";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const resolveUrl = (val) => {
  if (!val) return null;
  const raw = typeof val === "object"
    ? (val.secure_url || val.url || val.path || val.dataUrl || val.src || val.fileUrl || null)
    : String(val);
  const clean = String(raw || "").trim();
  if (!clean) return null;
  if (/^(https?:|data:|blob:)/i.test(clean)) return clean;
  const base = (API_URL || "").replace(/\/+$/, "");
  return clean.startsWith("/") ? `${base}${clean}` : `${base}/${clean}`;
};

const toPreviewUrl = (url) => {
  if (!url) return "";
  if (/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(url) && /\.pdf(\?.*)?$/i.test(url)) {
    return url
      .replace(/\/image\/upload\//i, "/image/upload/f_jpg,pg_1/")
      .replace(/\.pdf(\?.*)?$/i, ".jpg$1");
  }
  return url;
};

function KycDocPreviewBox({ url, label }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url) {
    return (
      <div className="w-full h-32 bg-[#E1E6EA] rounded-[6px] flex flex-col items-center justify-center text-[#4A5961] text-[11px] p-2 overflow-hidden">
        <ImageIcon className="w-5 h-5 mb-1 text-[#4A5961]" />
        <span>Not uploaded</span>
      </div>
    );
  }

  const isDirectPdf =
    /^data:application\/pdf/i.test(url) ||
    (/\.pdf(\?.*)?$/i.test(url) && !/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(url));

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block w-full h-32 bg-[#E1E6EA] rounded-[6px] overflow-hidden relative group"
      title={`Open ${label}`}
    >
      {!isDirectPdf && !failed ? (
        <img
          src={toPreviewUrl(url)}
          alt={label}
          className="w-full h-full object-cover rounded-[4px] group-hover:scale-105 transition-transform"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-[#10242A] p-2">
          <FileText className="w-6 h-6 mb-1 text-[#0E7C86]" />
          <span className="text-[11px] font-semibold text-[#0E7C86] underline">Open Document ↗</span>
        </div>
      )}
    </a>
  );
}

export default function KycVerification() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadOwners = async (opts = {}) => {
    const silent = Boolean(opts?.silent);
    try {
      if (!silent) setLoading(true);
      const res = await fetchJson("/api/owners");
      const baseOwners = Array.isArray(res) ? res : (res.data || res.owners || []);
      setOwners(baseOwners);
      setSelectedOwner((prev) => {
        if (!prev) return baseOwners[0] || null;
        const refreshed = baseOwners.find(
          (o) => (prev.loginId && o.loginId === prev.loginId) || (prev._id && o._id === prev._id)
        );
        return refreshed || prev;
      });
    } catch (err) {
      console.error("Failed to load owners for KYC:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, []);

  useLiveStatusSync(() => loadOwners({ silent: true }), {
    pollMs: 8000,
    types: ["kyc", "owner", "visit"],
  });

  const stats = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let rejected = 0;

    owners.forEach(o => {
      const st = (o.kycStatus || o.kyc?.status || "pending").toLowerCase();
      if (st === "verified") verified++;
      else if (st === "rejected") rejected++;
      else pending++;
    });

    return { pending, verified, rejected };
  }, [owners]);

  const handleUpdateKyc = async (docType, status) => {
    if (!selectedOwner) return;
    const id = selectedOwner.loginId || selectedOwner._id;
    setUpdating(true);
    try {
      await fetchJson(`/api/owners/${encodeURIComponent(id)}/kyc-status`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify({ docType, status, kycStatus: status })
      });
      broadcastStatusChange({ type: "kyc", loginId: id, kycStatus: status === "verified" ? "completed" : "sent" });
      loadOwners({ silent: true });
      // Update current selected owner state
      setSelectedOwner(prev => ({
        ...prev,
        kycStatus: status,
        kyc: { ...(prev?.kyc || {}), status }
      }));
    } catch (err) {
      alert("Failed to update KYC status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
      <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
         {/* Page Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">KYC / Documents</h1>
               <p className="text-[13px] text-[#4A5961] mt-0.5">Review owner identity and property documents</p>
            </div>
         </div>

      {/* 3 Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs">
          <p className="text-[13px] font-medium text-[#4A5961]">Pending Review</p>
          <p className="text-[24px] font-bold text-[#10242A] tracking-tight mt-1">{String(stats.pending).padStart(2, '0')}</p>
        </div>
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs">
          <p className="text-[13px] font-medium text-[#4A5961]">Verified</p>
          <p className="text-[24px] font-bold text-[#10242A] tracking-tight mt-1">{String(stats.verified).padStart(2, '0')}</p>
        </div>
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs">
          <p className="text-[13px] font-medium text-[#4A5961]">Rejected</p>
          <p className="text-[24px] font-bold text-[#10242A] tracking-tight mt-1">{String(stats.rejected).padStart(2, '0')}</p>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Owner List */}
        <div className="md:col-span-4 bg-white rounded-[12px] border border-[#E1E6EA] p-3 shadow-xs space-y-1.5 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-[13px] text-[#4A5961] font-medium">Loading owners...</div>
          ) : owners.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#4A5961] font-medium">No owners found.</div>
          ) : (
            owners.map((o, idx) => {
              const kycStat = (o.kycStatus || o.kyc?.status || "pending").toLowerCase();
              const isSelected = selectedOwner && (selectedOwner._id === o._id || selectedOwner.loginId === o.loginId);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedOwner(o)}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-[8px] cursor-pointer transition-colors border",
                    isSelected
                      ? "bg-[#E6F4F5] border-[#0E7C86]"
                      : "bg-white border-transparent hover:bg-[#F9FAFB] hover:border-[#E1E6EA]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#D9E1E7] border border-[#CBD3D9] flex items-center justify-center font-bold text-[11px] text-[#4A5961] shrink-0">
                      {(o.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#10242A]">{o.name || "Owner"}</p>
                      <p className="text-[12px] text-[#708088]">{o.loginId || "—"}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                    kycStat === "verified" ? "bg-[#DDF3E4] text-[#14532D]" : (kycStat === "submitted" || kycStat === "completed") ? "bg-[#E0F2FE] text-[#0369A1]" : kycStat === "rejected" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                  )}>
                    {kycStat === "verified" ? "Verified" : (kycStat === "submitted" || kycStat === "completed") ? "Submitted" : kycStat === "rejected" ? "Rejected" : "Pending"}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Right Panel: Selected Owner Documents */}
        <div className="md:col-span-8 bg-white rounded-[12px] border border-[#E1E6EA] p-5 shadow-xs">
          {selectedOwner ? (
            <div>
              <h3 className="text-[14px] font-bold text-[#10242A] mb-4">
                {selectedOwner.name || "Owner"} – documents
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. ID Proof Card */}
                {(() => {
                  const url =
                    resolveUrl(selectedOwner.kyc?.idProof) ||
                    resolveUrl(selectedOwner.checkinAadhaarFront) ||
                    resolveUrl(selectedOwner.checkinAadhaarImage) ||
                    resolveUrl(selectedOwner.kyc?.documentImage) ||
                    resolveUrl(selectedOwner.documentImage);
                  const status = (selectedOwner.kycStatus || selectedOwner.kyc?.status || "pending").toLowerCase();
                  return (
                    <div className="border border-[#CBD3D9] rounded-[8px] p-3 text-center space-y-2 bg-[#F9FAFB]">
                      <KycDocPreviewBox url={url} label="ID proof" />
                      <div className="text-left">
                        <p className="text-[12px] font-bold text-[#10242A] mb-1">ID proof</p>
                        <span className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mb-2",
                          status === "verified" ? "bg-[#DDF3E4] text-[#14532D]" : status === "rejected" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                        )}>
                          {status === "verified" ? "Verified" : status === "rejected" ? "Rejected" : "Pending"}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("idProof", "verified")}
                          className="w-full bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-[11px] py-1.5 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("idProof", "rejected")}
                          className="w-full bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] font-semibold text-[11px] py-1.5 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Owner Photo / Address Proof Card */}
                {(() => {
                  const url =
                    resolveUrl(selectedOwner.kyc?.addressProof) ||
                    resolveUrl(selectedOwner.checkinAadhaarBack) ||
                    resolveUrl(selectedOwner.checkinOwnerPhoto) ||
                    resolveUrl(selectedOwner.profile?.photo);
                  const status = (selectedOwner.kycStatus || selectedOwner.kyc?.status || "pending").toLowerCase();
                  return (
                    <div className="border border-[#CBD3D9] rounded-[8px] p-3 text-center space-y-2 bg-[#F9FAFB]">
                      <KycDocPreviewBox url={url} label="Address / Owner photo" />
                      <div className="text-left">
                        <p className="text-[12px] font-bold text-[#10242A] mb-1">Address / Owner photo</p>
                        <span className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mb-2",
                          status === "verified" ? "bg-[#DDF3E4] text-[#14532D]" : status === "rejected" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                        )}>
                          {status === "verified" ? "Verified" : status === "rejected" ? "Rejected" : "Pending"}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("addressProof", "verified")}
                          className="w-full bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-[11px] py-1.5 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("addressProof", "rejected")}
                          className="w-full bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] font-semibold text-[11px] py-1.5 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Bank / Ownership Proof Card */}
                {(() => {
                  const url =
                    resolveUrl(selectedOwner.kyc?.ownershipProof) ||
                    resolveUrl(selectedOwner.checkinBankProof) ||
                    resolveUrl(selectedOwner.checkinCancelledCheque);
                  const status = (selectedOwner.kycStatus || selectedOwner.kyc?.status || "pending").toLowerCase();
                  return (
                    <div className="border border-[#CBD3D9] rounded-[8px] p-3 text-center space-y-2 bg-[#F9FAFB]">
                      <KycDocPreviewBox url={url} label="Bank / Ownership proof" />
                      <div className="text-left">
                        <p className="text-[12px] font-bold text-[#10242A] mb-1">Bank / Ownership proof</p>
                        <span className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mb-2",
                          status === "verified" ? "bg-[#DDF3E4] text-[#14532D]" : status === "rejected" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                        )}>
                          {status === "verified" ? "Verified" : status === "rejected" ? "Rejected" : "Pending"}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("ownershipProof", "verified")}
                          className="w-full bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-[11px] py-1.5 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("ownershipProof", "rejected")}
                          className="w-full bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] font-semibold text-[11px] py-1.5 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-[#4A5961]">
              Select an owner from the left list to review identity documents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
