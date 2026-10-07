import React, { useEffect, useMemo, useState } from "react";
import { Search, Loader2, CheckCircle2, XCircle, FileText, Image as ImageIcon } from "lucide-react";
import { fetchJson, getAuthHeader, API_URL } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const resolveUrl = (val) => {
  if (!val) return null;
  const raw = typeof val === "object" ? (val.url || val.path || val.dataUrl || null) : val;
  if (!raw) return null;
  if (raw.startsWith("data:")) return raw;
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/")) return `${API_URL}${raw}`;
  return `${API_URL}/${raw}`;
};

export default function KycVerification() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadOwners = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/owners");
      const baseOwners = Array.isArray(res) ? res : (res.data || res.owners || []);
      setOwners(baseOwners);
      if (baseOwners.length > 0 && !selectedOwner) {
        setSelectedOwner(baseOwners[0]);
      }
    } catch (err) {
      console.error("Failed to load owners for KYC:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, []);

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
      loadOwners();
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
    <div className="space-y-6 text-[#10242A]">
      {/* Page Header */}
      <PageHeader
        title="KYC / Documents"
        subtitle="Review owner identity and property documents"
      />

      {/* 3 Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Pending Review</p>
          <p className="text-3xl font-bold text-slate-900">{String(stats.pending).padStart(2, '0')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Verified</p>
          <p className="text-3xl font-bold text-slate-900">{String(stats.verified).padStart(2, '0')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Rejected</p>
          <p className="text-3xl font-bold text-slate-900">{String(stats.rejected).padStart(2, '0')}</p>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Owner List */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading owners...</div>
          ) : owners.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">No owners found.</div>
          ) : (
            owners.map((o, idx) => {
              const kycStat = (o.kycStatus || o.kyc?.status || "pending").toLowerCase();
              const isSelected = selectedOwner && (selectedOwner._id === o._id || selectedOwner.loginId === o.loginId);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedOwner(o)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors border",
                    isSelected
                      ? "bg-teal-50/70 border-[#095256]"
                      : "bg-white border-slate-200/80 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200/70 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
                      {(o.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{o.name || "Owner"}</p>
                      <p className="text-xs text-slate-500">{o.loginId || "—"}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                    kycStat === "verified" ? "bg-emerald-100 text-emerald-700" : kycStat === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {kycStat === "verified" ? "Verified" : kycStat === "rejected" ? "Rejected" : "Pending"}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Right Panel: Selected Owner Documents */}
        <div className="md:col-span-8 bg-white rounded-[12px] border border-[#E1E6EA] p-6 shadow-sm">
          {selectedOwner ? (
            <div>
              <h3 className="text-base font-bold text-[#10242A] mb-5">
                [{selectedOwner.name || "Owner name"}] – documents
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. ID Proof Card */}
                {(() => {
                  const url = resolveUrl(selectedOwner.kyc?.idProof) || resolveUrl(selectedOwner.checkinAadhaarFront) || resolveUrl(selectedOwner.checkinAadhaarImage);
                  const status = (selectedOwner.kycStatus || selectedOwner.kyc?.status || "pending").toLowerCase();
                  return (
                    <div className="border border-[#CBD3D9] rounded-[12px] p-4 text-center space-y-3 bg-slate-50/30">
                      <div className="w-full h-36 bg-[#E1E6EA] rounded-[8px] flex flex-col items-center justify-center text-[#4A5961] text-xs p-2 overflow-hidden">
                        {url ? (
                          <img src={url} alt="ID proof" className="w-full h-full object-cover rounded-[6px]" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 mb-1 text-[#4A5961]" />
                            <span>Document preview</span>
                          </>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#10242A] mb-1">ID proof</p>
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block mb-3",
                          status === "verified" ? "bg-[#DDF3E4] text-[#14532D]" : status === "rejected" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                        )}>
                          {status === "verified" ? "Verified" : status === "rejected" ? "Rejected" : "Pending"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("idProof", "verified")}
                          className="w-full bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-xs py-2 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("idProof", "rejected")}
                          className="w-full bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] font-semibold text-xs py-2 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Address Proof Card */}
                {(() => {
                  const url = resolveUrl(selectedOwner.kyc?.addressProof) || resolveUrl(selectedOwner.checkinAadhaarBack);
                  const status = (selectedOwner.kycStatus || selectedOwner.kyc?.status || "pending").toLowerCase();
                  return (
                    <div className="border border-[#CBD3D9] rounded-[12px] p-4 text-center space-y-3 bg-slate-50/30">
                      <div className="w-full h-36 bg-[#E1E6EA] rounded-[8px] flex flex-col items-center justify-center text-[#4A5961] text-xs p-2 overflow-hidden">
                        {url ? (
                          <img src={url} alt="Address proof" className="w-full h-full object-cover rounded-[6px]" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 mb-1 text-[#4A5961]" />
                            <span>Document preview</span>
                          </>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#10242A] mb-1">Address proof</p>
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block mb-3",
                          status === "verified" ? "bg-[#DDF3E4] text-[#14532D]" : status === "rejected" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                        )}>
                          {status === "verified" ? "Verified" : status === "rejected" ? "Rejected" : "Pending"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("addressProof", "verified")}
                          className="w-full bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-xs py-2 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("addressProof", "rejected")}
                          className="w-full bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] font-semibold text-xs py-2 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Ownership Proof Card */}
                {(() => {
                  const url = resolveUrl(selectedOwner.kyc?.ownershipProof) || resolveUrl(selectedOwner.checkinBankProof);
                  const status = (selectedOwner.kycStatus || selectedOwner.kyc?.status || "pending").toLowerCase();
                  return (
                    <div className="border border-[#CBD3D9] rounded-[12px] p-4 text-center space-y-3 bg-slate-50/30">
                      <div className="w-full h-36 bg-[#E1E6EA] rounded-[8px] flex flex-col items-center justify-center text-[#4A5961] text-xs p-2 overflow-hidden">
                        {url ? (
                          <img src={url} alt="Ownership proof" className="w-full h-full object-cover rounded-[6px]" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 mb-1 text-[#4A5961]" />
                            <span>Document preview</span>
                          </>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#10242A] mb-1">Ownership proof</p>
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block mb-3",
                          status === "verified" ? "bg-[#DDF3E4] text-[#14532D]" : status === "rejected" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                        )}>
                          {status === "verified" ? "Verified" : status === "rejected" ? "Rejected" : "Pending"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("ownershipProof", "verified")}
                          className="w-full bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-xs py-2 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateKyc("ownershipProof", "rejected")}
                          className="w-full bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] font-semibold text-xs py-2 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
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
