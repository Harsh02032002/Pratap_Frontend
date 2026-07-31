import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, RefreshCw,
  LayoutGrid, ShieldCheck, Fingerprint, Check, X,
  Eye, ShieldAlert, Activity, CreditCard,
  Sparkles, Layers, Box, Globe2, IndianRupee,
  Inbox, FileText, ImageIcon, Save, Loader2,
  Lock, Key, ShieldQuestion, UserCheck, UserX,
  Download, CheckCircle2, AlertCircle, Trash
} from "lucide-react";
import { fetchJson, getAuthHeader, API_URL } from "../../utils/api";
import { toast } from "react-hot-toast";

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
  const [tab, setTab] = useState("owners");
  const [owners, setOwners] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [tab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ownerData, tenantData] = await Promise.all([
        fetchJson("/api/owners"),
        fetchJson("/api/tenants")
      ]);
      const baseOwners = Array.isArray(ownerData) ? ownerData : (ownerData.owners || []);
      const baseTenants = Array.isArray(tenantData) ? tenantData : (tenantData.tenants || []);

      // Fetch deep checkin KYC data for tenants if available
      const mergedTenants = await Promise.all(baseTenants.map(async (t) => {
        if (!t?.loginId) return t;
        try {
          const checkin = await fetchJson(`/api/checkin/tenant/${encodeURIComponent(t.loginId)}`);
          return {
            ...t,
            digitalCheckin: checkin?.record || t.digitalCheckin || {}
          };
        } catch (_) { return t; }
      }));

      setOwners(baseOwners);
      setTenants(mergedTenants);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const [statusFilter, setStatusFilter] = useState("all");

  const pendingOwners = useMemo(() => owners.filter(o => (o.kycStatus || o.kyc?.status || "pending") === "pending"), [owners]);
  const pendingTenants = useMemo(() => tenants.filter(t => ["submitted", "pending", "pending_verification", "audit_pending", "mismatch_review"].includes(t.kycStatus || t.kyc?.status || "pending")), [tenants]);

  const stats = useMemo(() => {
    const total = owners.length + tenants.length;
    const pending = pendingOwners.length + pendingTenants.length;
    const rate = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;
    return { total, pending, rate };
  }, [owners, tenants, pendingOwners, pendingTenants]);

  const activeList = useMemo(() => {
    const base = tab === "owners" ? owners : tenants;
    if (statusFilter === "pending") {
      return tab === "owners" ? pendingOwners : pendingTenants;
    }
    if (statusFilter === "verified") {
      return base.filter(item => (item.kycStatus || item.kyc?.status) === "verified");
    }
    return base;
  }, [tab, owners, tenants, pendingOwners, pendingTenants, statusFilter]);

  const filteredList = activeList.filter(item => 
    (item.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (item.loginId || "").toLowerCase().includes(search.toLowerCase()) ||
    (item.phone || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdate = async (item, status) => {
    try {
      setIsUpdating(true);
      if (tab === "owners") {
        await fetchJson(`/api/owners/${item.loginId}/kyc`, {
          method: "PATCH",
          headers: getAuthHeader(),
          body: JSON.stringify({ status })
        });
      } else {
        const endpoint = status === "verified" ? "/api/tenants/kyc/approve" : "/api/tenants/kyc/reject";
        await fetchJson(endpoint, {
          method: "POST",
          headers: getAuthHeader(),
          body: JSON.stringify({ tenantId: item._id })
        });
      }
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkUpdate = async (status) => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    const toastId = toast.loading(`Updating KYC status for ${selectedIds.size} stakeholders...`);
    try {
      const itemsToUpdate = filteredList.filter(item => selectedIds.has(item._id || item.loginId));
      let successCount = 0;
      for (const item of itemsToUpdate) {
        if (tab === "owners") {
          await fetchJson(`/api/owners/${item.loginId}/kyc`, {
            method: "PATCH",
            headers: getAuthHeader(),
            body: JSON.stringify({ status })
          });
          successCount++;
        } else {
          const endpoint = status === "verified" ? "/api/tenants/kyc/approve" : "/api/tenants/kyc/reject";
          await fetchJson(endpoint, {
            method: "POST",
            headers: getAuthHeader(),
            body: JSON.stringify({ tenantId: item._id })
          });
          successCount++;
        }
      }
      toast.success(`Successfully updated ${successCount} items to ${status}!`, { id: toastId });
      setSelectedIds(new Set());
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status for some items", { id: toastId });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="p-8 space-y-10 bg-[#F8FAFC] min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight leading-none">KYC / Documents Verification</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Audit identity documents, Aadhaar cards, and signed rental agreements.</p>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={loadData} className="bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95">
               <RefreshCw className={cn("w-4 h-4 text-blue-600", loading && "animate-spin")} /> Refresh
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal label="Verification Rate" value={`${stats.rate}%`} trend="Active Verified" up icon={ShieldCheck} color="blue" />
        <StatCardHorizontal label="Pending KYC" value={stats.pending} trend="Pending List" up={false} icon={Fingerprint} color="amber" />
        <StatCardHorizontal label="Total Users" value={stats.total} trend="Synced" up icon={Users} color="indigo" />
        <StatCardHorizontal label="Verified Users" value={stats.total - stats.pending} trend="Verified" up icon={Activity} color="emerald" />
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
         <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6">
               <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <Fingerprint size={20} />
               </div>
               <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
                  {["owners", "tenants"].map(f => (
                    <button 
                      key={f} onClick={() => setTab(f)}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        tab === f ? "bg-white text-blue-600 shadow-md border border-slate-100" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                       {f === "owners" ? "Asset Owners" : "Residents / Tenants"}
                    </button>
                  ))}
               </div>
               <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                 {[
                   { key: "all", label: "All" },
                   { key: "pending", label: "Pending" },
                   { key: "verified", label: "Verified" }
                 ].map(s => (
                   <button
                     key={s.key}
                     onClick={() => setStatusFilter(s.key)}
                     className={cn(
                       "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                       statusFilter === s.key ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                     )}
                   >
                     {s.label}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="relative w-72 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, ID or phone..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" 
                  />
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-100">
                      <th className="px-6 py-5 w-10 text-center">
                         <input
                           type="checkbox"
                           disabled={isBulkProcessing}
                           className="rounded border-slate-300 cursor-pointer disabled:opacity-50"
                           checked={filteredList.length > 0 && filteredList.every(item => selectedIds.has(item._id || item.loginId))}
                           onChange={() => {
                             const allSelected = filteredList.every(item => selectedIds.has(item._id || item.loginId));
                             const next = new Set(selectedIds);
                             if (allSelected) {
                               filteredList.forEach(item => next.delete(item._id || item.loginId));
                             } else {
                               filteredList.forEach(item => next.add(item._id || item.loginId));
                             }
                             setSelectedIds(next);
                           }}
                         />
                      </th>
                      <th className="px-6 py-5">User Profile</th>
                      <th className="px-6 py-5">Contact Details</th>
                      <th className="px-6 py-5">Aadhaar & Identity Docs</th>
                      {tab === "tenants" && <th className="px-6 py-5 text-center">Signed Agreement</th>}
                      <th className="px-6 py-5 text-center">KYC Status</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {loading ? (
                     <tr><td colSpan={tab === "tenants" ? "7" : "6"} className="py-32 text-center">
                        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading identity documents...</p>
                     </td></tr>
                   ) : filteredList.length === 0 ? (
                     <tr><td colSpan={tab === "tenants" ? "7" : "6"} className="py-32 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                           <ShieldCheck size={36} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Records Found</p>
                     </td></tr>
                   ) : filteredList.map((item, i) => {
                     // Extract Document URLs
                     const aadhaarFrontUrl = resolveUrl(item.kyc?.aadhaarFront) || resolveUrl(item.digitalCheckin?.kyc?.aadhaarFront) || resolveUrl(item.checkinAadhaarFront) || resolveUrl(item.checkinAadhaarImage) || resolveUrl(item.kyc?.documentImage);
                     const aadhaarBackUrl = resolveUrl(item.kyc?.aadhaarBack) || resolveUrl(item.digitalCheckin?.kyc?.aadhaarBack) || resolveUrl(item.checkinAadhaarBack);
                     const aadharFileUrl = resolveUrl(item.kyc?.aadharFile) || resolveUrl(item.digitalCheckin?.kyc?.aadharFile);
                     const aadhaarNumber = item.kyc?.aadhaarNumber || item.digitalCheckin?.kyc?.aadhaarNumber || item.checkinAadhaarNumber || item.aadharNumber || "";

                     // Agreement URL
                     const agreementPdfUrl = item.digitalCheckin?.agreement?.pdfUrl || item.agreementPdfUrl || null;
                     const agreementSigned = Boolean(item.agreementSigned || item.digitalCheckin?.agreement?.acceptedAt || agreementPdfUrl);
                     const agreementHref = agreementPdfUrl 
                       ? (agreementPdfUrl.startsWith("http") ? agreementPdfUrl : `${API_URL}${agreementPdfUrl}`)
                       : `${API_URL}/api/checkin/tenant/agreement/pdf/${encodeURIComponent(item.loginId || "")}`;

                     return (
                      <tr key={i} className="group hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => {
                         const next = new Set(selectedIds);
                         const id = item._id || item.loginId;
                         if (next.has(id)) next.delete(id);
                         else next.add(id);
                         setSelectedIds(next);
                      }}>
                         <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              disabled={isBulkProcessing}
                              className="rounded border-slate-300 cursor-pointer disabled:opacity-50"
                              checked={selectedIds.has(item._id || item.loginId)}
                              onChange={() => {
                                const next = new Set(selectedIds);
                                const id = item._id || item.loginId;
                                if (next.has(id)) next.delete(id);
                                else next.add(id);
                                setSelectedIds(next);
                              }}
                            />
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                               <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shrink-0 border border-blue-100">
                                  {(item.name || "U").charAt(0).toUpperCase()}
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-slate-800 leading-snug">{item.name || "Unknown User"}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">{item.loginId || "N/A"}</span>
                                  </div>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="space-y-0.5">
                               <p className="text-xs font-bold text-slate-800">{item.phone || "No Phone"}</p>
                               <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{item.email || "No Email"}</p>
                            </div>
                         </td>
                         {/* Aadhaar & Identity Docs Column */}
                         <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                {aadhaarFrontUrl ? (
                                  <a href={aadhaarFrontUrl} target="_blank" rel="noopener noreferrer" title="View Aadhaar Front">
                                    <img src={aadhaarFrontUrl} alt="Aadhaar Front"
                                      className="w-14 h-9 object-cover rounded-lg border border-slate-200 hover:scale-105 transition-transform shadow-sm"
                                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                                    />
                                  </a>
                                ) : null}
                                {aadhaarBackUrl ? (
                                  <a href={aadhaarBackUrl} target="_blank" rel="noopener noreferrer" title="View Aadhaar Back">
                                    <img src={aadhaarBackUrl} alt="Aadhaar Back"
                                      className="w-14 h-9 object-cover rounded-lg border border-slate-200 hover:scale-105 transition-transform shadow-sm"
                                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                                    />
                                  </a>
                                ) : null}
                                {aadharFileUrl && (
                                  <a href={aadharFileUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 border border-blue-100 transition-colors">
                                    <Download size={11} /> PDF
                                  </a>
                                )}
                              </div>
                              {!aadhaarFrontUrl && !aadhaarBackUrl && !aadharFileUrl && (
                                <span className="text-xs text-slate-400 italic">No document image</span>
                              )}
                              {aadhaarNumber && (
                                <span className="text-[10px] font-mono font-bold text-slate-600">
                                  🆔 {aadhaarNumber}
                                </span>
                              )}
                            </div>
                         </td>

                         {/* Signed Agreement Column (Only for Tenants) */}
                         {tab === "tenants" && (
                           <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                              {agreementSigned ? (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <a
                                    href={agreementHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-200 shadow-sm flex items-center gap-1.5 text-xs font-bold"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Signed Agreement</span>
                                  </a>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Pending Signature</span>
                              )}
                           </td>
                         )}

                         <td className="px-6 py-5 text-center">
                            <span className={cn(
                               "text-[9px] font-bold px-3 py-1 rounded-lg border uppercase tracking-wider",
                               (item.kycStatus || item.kyc?.status) === "mismatch_review" ? "bg-rose-100 text-rose-700 border-rose-300 animate-pulse" :
                               (item.kycStatus || item.kyc?.status) === "verified" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                               {item.kycStatus || item.kyc?.status || "Pending"}
                            </span>
                            {(item.kyc?.mismatchReasons || item.digitalCheckin?.kyc?.mismatchReasons || item.kycVerificationData?.mismatchReasons) && (
                              <div className="text-[10px] text-rose-600 font-semibold mt-1 max-w-[180px] mx-auto leading-tight" title={item.kyc?.mismatchReasons || item.digitalCheckin?.kyc?.mismatchReasons || item.kycVerificationData?.mismatchReasons}>
                                ⚠️ {item.kyc?.mismatchReasons || item.digitalCheckin?.kyc?.mismatchReasons || item.kycVerificationData?.mismatchReasons}
                              </div>
                            )}
                         </td>
                         <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                               <button 
                                  onClick={() => handleUpdate(item, "verified")}
                                  disabled={isUpdating}
                                  title="Approve KYC"
                                  className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200 flex items-center justify-center shadow-sm active:scale-95 disabled:opacity-50"
                               >
                                  <Check className="w-4 h-4" />
                               </button>
                               <button 
                                  onClick={() => handleUpdate(item, "rejected")}
                                  disabled={isUpdating}
                                  title="Reject KYC"
                                  className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-200 flex items-center justify-center shadow-sm active:scale-95 disabled:opacity-50"
                               >
                                  <X className="w-4 h-4" />
                               </button>
                               {aadhaarFrontUrl && (
                                 <button 
                                    onClick={() => window.open(aadhaarFrontUrl, "_blank")}
                                    title="View Aadhaar"
                                    className="w-9 h-9 bg-slate-50 text-slate-500 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-200 flex items-center justify-center shadow-sm active:scale-95"
                                 >
                                    <Eye className="w-4 h-4" />
                                 </button>
                               )}
                            </div>
                         </td>
                      </tr>
                     );
                   })}
                </tbody>
             </table>
          </div>
       </div>
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-8 py-4 rounded-3xl border border-slate-800 shadow-2xl flex items-center gap-6 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 border-r border-slate-800 pr-6">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shadow-lg animate-pulse">
              {selectedIds.size}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={isBulkProcessing}
              onClick={() => handleBulkUpdate("verified")}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isBulkProcessing ? "Processing..." : <><Check size={14} /> Verify Selected</>}
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={() => handleBulkUpdate("rejected")}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isBulkProcessing ? "Processing..." : <><X size={14} /> Reject Selected</>}
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors pl-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100" 
  };
  
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 flex items-start gap-5 group hover:translate-y-[-5px] transition-all duration-500">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm transition-transform group-hover:rotate-6", bgColors[color])}>
         <Icon className="w-7 h-7" />
      </div>
      <div className="min-w-0">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none truncate">{label}</p>
         <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-3">{value}</p>
         <div className={cn(
           "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider",
           up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
         )}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
         </div>
      </div>
    </div>
  );
}
