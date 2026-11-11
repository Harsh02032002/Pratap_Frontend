import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
   Building2, Users, Shield, Clock, Search,
   Filter, MapPin, Sheet, Trash2,
   ChevronRight, ChevronLeft, Phone, Mail, User, RefreshCw,
   Loader2, ShieldCheck, CheckCircle2, AlertCircle,
   Calendar, Fingerprint, Banknote,
   Eye, UserPlus, FileCheck, ClipboardList, FileText,
   ShieldAlert, Send, Save, Lock, Plus, X
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchJson, getAuthHeader, clearApiCache } from "../../utils/api";
import { broadcastStatusChange, useLiveStatusSync } from "../../utils/liveStatusSync";
import { safeOwnerOnboardingLink } from "../../utils/ownerOnboarding";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { StatCard } from "../../components/superadmin/StatCard";
import OwnerAgreementModal from "../../components/superadmin/OwnerAgreementModal";
import * as XLSX from 'xlsx';

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function Owner() {
   const [searchParams, setSearchParams] = useSearchParams();
   const currentView = searchParams.get("view") || "list";

   const [owners, setOwners] = useState([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [areaFilter, setAreaFilter] = useState("all");
   const [selectedOwner, setSelectedOwner] = useState(null);
   const [agreementModalOwner, setAgreementModalOwner] = useState(null);
   const [isUpdatingKyc, setIsUpdatingKyc] = useState(false);
   const [isEditingOwner, setIsEditingOwner] = useState(false);
   const [editOwnerForm, setEditOwnerForm] = useState({});
   const [savingEdit, setSavingEdit] = useState(false);

   // Add Form State
   const [formName, setFormName] = useState("");
   const [formEmail, setFormEmail] = useState("");
   const [formPhone, setFormPhone] = useState("");
   const [formArea, setFormArea] = useState("");
   const [formCity, setFormCity] = useState("");
   const [formLoginId, setFormLoginId] = useState("");
   const [formPassword, setFormPassword] = useState("");
   const [saving, setSaving] = useState(false);
   const [addedOwnerResult, setAddedOwnerResult] = useState(null); // {loginId, kycLink, email}
   const [resendingKycLink, setResendingKycLink] = useState(false);

   // Banking fields
   const [formBankName, setFormBankName] = useState("");
   const [formBranchName, setFormBranchName] = useState("");
   const [formBankAccountNumber, setFormBankAccountNumber] = useState("");
   const [formIfscCode, setFormIfscCode] = useState("");
   const [formAccountHolderName, setFormAccountHolderName] = useState("");
   const [formUpiId, setFormUpiId] = useState("");

   const loadOwners = async (opts = {}) => {
      const silent = Boolean(opts?.silent);
      // Check for authentication token
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
         console.error("No authentication token found");
         window.location.href = "/superadmin/login";
         return;
      }

      try {
         if (!silent) setLoading(true);
         const [res, visitsRes] = await Promise.all([
            fetchJson("/api/owners"),
            fetchJson("/api/visits?lite=1").catch(() => ({ visits: [] }))
         ]);

         const baseOwners = Array.isArray(res) ? res : (res.data || res.owners || []);
         const visits = visitsRes.visits || [];

         const visitMap = {};
         visits.forEach(v => {
            const id = v.generatedCredentials?.loginId || "";
            if (id) {
               visitMap[id] = {
                  vacantRooms: v.vacantRooms || v.propertyInfo?.vacantRooms || 0,
                  vacantBeds: v.vacantBeds || v.propertyInfo?.vacantBeds || 0,
                  occupiedRooms: v.occupiedRooms || v.propertyInfo?.occupiedRooms || 0,
                  occupiedBeds: v.occupiedBeds || v.propertyInfo?.occupiedBeds || 0,
                  monthlyRent: v.monthlyRent || v.propertyInfo?.rent || 0,
                  deposit: v.deposit || v.propertyInfo?.deposit || 0
               };
            }
         });

         const mergedOwners = baseOwners.map(o => ({
            ...o,
            ...(visitMap[o.loginId] || {})
         }));
         setOwners(mergedOwners);
         setSelectedOwner(prev => {
            if (!prev) return prev;
            const refreshed = mergedOwners.find(
               o => (prev.loginId && o.loginId === prev.loginId) || (prev._id && o._id === prev._id)
            );
            return refreshed || prev;
         });
      } catch (err) {
         console.error("Failed to load owners:", err);
         // If auth error, redirect to login
         if (err?.message?.includes("Not authorized") || err?.status === 401) {
            window.location.href = "/superadmin/login";
         }
      }
      finally { if (!silent) setLoading(false); }
   };

   useEffect(() => { loadOwners(); }, []);

   useLiveStatusSync(() => loadOwners({ silent: true }), {
      enabled: currentView !== "add" && !isEditingOwner,
      pollMs: 10000,
      types: ["kyc", "owner", "visit"],
   });

   useEffect(() => {
      if (currentView === "add") generateCreds();
   }, [currentView]);

   const generateCreds = () => {
      const genId = `ROOMHY${Math.floor(1000 + Math.random() * 9000)}`;
      const password = Math.random().toString(36).slice(-8).toUpperCase();
      setFormLoginId(genId);
      setFormPassword(password);
   };

   const handleAddOwner = async (e) => {
      e.preventDefault();
      if (!formName || !formPhone || !formEmail) return alert("Please fill in all required fields.");
      setSaving(true);
      try {
         const res = await fetchJson("/api/owners", {
            method: "POST",
            headers: getAuthHeader(),
            body: JSON.stringify({
               loginId: formLoginId,
               name: formName,
               email: formEmail,
               phone: formPhone,
               locationCode: formArea || formCity,
               credentials: { password: formPassword, firstTime: true },
               checkinBankName: formBankName,
               checkinBranchName: formBranchName,
               checkinBankAccountNumber: formBankAccountNumber,
               checkinIfscCode: formIfscCode,
               checkinAccountHolderName: formAccountHolderName,
               checkinUpiId: formUpiId
            })
         });

         const kycLink = safeOwnerOnboardingLink(res?.kycLink);

         setAddedOwnerResult({
            loginId: res?.loginId || formLoginId,
            email: formEmail,
            name: formName,
            kycLink,
            kycLinkSent: res?.kycLinkSent === true
         });

         broadcastStatusChange({ type: "owner", loginId: res?.loginId || formLoginId });
         loadOwners({ silent: true });
      } catch (err) { alert(err.message || "Failed to add property owner."); }
      finally { setSaving(false); }
   };

   const handleResendKycLink = async () => {
      if (!addedOwnerResult?.loginId || resendingKycLink) return;
      const loginId = addedOwnerResult.loginId;
      setResendingKycLink(true);
      try {
         const res = await fetchJson(`/api/owners/${encodeURIComponent(loginId)}/onboarding-link`, { method: "POST" });
         const kycLink = safeOwnerOnboardingLink(res?.kycLink);
         if (!kycLink) throw new Error("A secure onboarding link could not be generated.");
         setAddedOwnerResult(current => current?.loginId === loginId ? { ...current, kycLink, kycLinkSent: res.kycLinkSent === true } : current);
         toast.success(res.kycLinkSent ? "A fresh onboarding link was emailed to the owner." : "Fresh link generated. Copy it to share with the owner.");
      } catch (err) {
         toast.error(err.message || "Could not resend the onboarding link.");
      } finally {
         setResendingKycLink(false);
      }
   };

   const handleSaveEdit = async () => {
      if (!selectedOwner) return;
      setSavingEdit(true);
      try {
         const id = selectedOwner.loginId || selectedOwner._id;
         const payload = {
            email: editOwnerForm.email,
            checkinEmail: editOwnerForm.email,
            phone: editOwnerForm.phone,
            checkinPhone: editOwnerForm.phone,
            checkinDob: editOwnerForm.checkinDob,
            address: editOwnerForm.address,
            checkinAddress: editOwnerForm.address,
            bankName: editOwnerForm.bankName,
            checkinBankName: editOwnerForm.bankName,
            accountNumber: editOwnerForm.accountNumber,
            checkinBankAccountNumber: editOwnerForm.accountNumber,
            ifscCode: editOwnerForm.ifscCode,
            checkinIfscCode: editOwnerForm.ifscCode,
            branchName: editOwnerForm.branchName,
            checkinBranchName: editOwnerForm.branchName,
            checkinAccountHolderName: editOwnerForm.accountHolderName,
            checkinUpiId: editOwnerForm.checkinUpiId
         };

         await fetchJson(`/api/owners/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: getAuthHeader(),
            body: JSON.stringify(payload)
         });

         alert("Owner details updated successfully!");
         setIsEditingOwner(false);
         broadcastStatusChange({ type: "owner", loginId: id });
         loadOwners({ silent: true });
         setSelectedOwner(prev => ({
            ...prev,
            ...payload
         }));
      } catch (err) {
         alert("Failed to update owner details: " + (err.body?.message || err.message));
      } finally {
         setSavingEdit(false);
      }
   };

   const deleteOwner = async (owner) => {
      const id = owner.loginId || owner._id;
      if (!confirm("Remove this owner's access? Their staff and tenants will also lose access. All data is kept and nobody is notified.")) return;
      try {
         await fetchJson(`/api/owners/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: getAuthHeader()
         });
         broadcastStatusChange({ type: "owner", loginId: id });
         setOwners(prev => prev.filter(o => o.loginId !== id && o._id !== id));
         toast.success("Owner access removed. Data kept.");
      } catch (err) {
         toast.error("Failed to remove owner: " + (err.body?.message || err.message));
      }
   };


   const filteredOwners = useMemo(() => {
      const query = search.trim().toLowerCase();
      let base = owners;

      if (currentView === "pending") {
         base = owners.filter(o => o.isActive === false || String(o.status || '').toLowerCase().includes('pending') || o.isEmployeeSubmitted);
      } else if (currentView === "kyc" || currentView === "agreements") {
         base = owners;
      } else {
         // Default / "list": Show all registered property owners (exclude explicitly blocked accounts)
         base = owners.filter(o => o.isActive !== false && String(o.status || '').toLowerCase() !== 'blocked');
      }

      return base.filter(o => {
         const id = (o.loginId || o._id || "").toString().toLowerCase();
         const name = (o.name || o.owner_name || o.profile?.name || "").toLowerCase();
         const area = (o.locationCode || o.checkinArea || o.city || "").toLowerCase();
         const email = (o.email || o.profile?.email || "").toLowerCase();
         const phone = (o.phone || o.profile?.phone || "").toLowerCase();

         const matchesSearch = !query || id.includes(query) || name.includes(query) || email.includes(query) || phone.includes(query) || area.includes(query);
         const matchesArea = areaFilter === "all" || area.includes(areaFilter.toLowerCase());
         return matchesSearch && matchesArea;
      });
   }, [owners, search, areaFilter, currentView]);

   const LIMIT = 10;
   const [currentPage, setCurrentPage] = useState(1);
   const totalRecords = filteredOwners.length;
   const totalPages = Math.ceil(totalRecords / LIMIT) || 1;

   useEffect(() => {
      if (currentPage > totalPages) {
         setCurrentPage(1);
      }
   }, [totalPages, currentPage]);

   const paginatedOwners = useMemo(() => {
      const start = (currentPage - 1) * LIMIT;
      return filteredOwners.slice(start, start + LIMIT);
   }, [filteredOwners, currentPage]);

   const areas = useMemo(() => {
      const set = new Set(owners.map(o => (o.locationCode || o.checkinArea || "").toUpperCase()).filter(Boolean));
      return Array.from(set).sort();
   }, [owners]);

   const stats = useMemo(() => {
      const total = owners.length;
      const verified = owners.filter(o => (o.kycStatus === "verified" || o.kyc?.status === "verified")).length;
      const properties = owners.reduce((acc, o) => acc + (o.propertyCount || 0), 0);
      return { total, verified, pending: total - verified, properties };
   }, [owners]);

   const handleToggleDeactivate = async (owner) => {
      const id = owner.loginId || owner._id;
      if (!id) return alert("Owner ID not found");
      const isCurrentlyActive = owner.isActive !== false;
      const action = isCurrentlyActive ? "deactivate" : "reactivate";
      if (!window.confirm(`Are you sure you want to ${action} ${owner.name || "this owner"}?`)) return;

      try {
         setLoading(true);
         const res = await fetchJson(`/api/owners/${encodeURIComponent(id)}/${action}`, {
            method: "POST",
            headers: getAuthHeader()
         });
         alert(res.message || `Owner ${action}d successfully`);
         loadOwners();
      } catch (err) {
         alert(`Failed to ${action} owner: ` + (err.message));
      } finally {
         setLoading(false);
      }
   };

   const handleApproveOwner = async (owner) => {
      const hasSubmittedKyc = Boolean(
         owner.kycStatus === 'verified' ||
         (owner.kyc?.status && owner.kyc.status !== 'pending' && owner.kyc.status !== 'requested') ||
         owner.checkinSubmittedAt ||
         owner.checkinAadhaarNumber ||
         owner.kyc?.aadhaarNumber ||
         owner.checkinOwnerPhoto
      );

      if (!hasSubmittedKyc) {
         alert("❌ Cannot approve owner: Owner has not submitted KYC documents yet.");
         return;
      }

      if (!window.confirm(`Are you sure you want to approve owner ${owner.name} (${owner.loginId}) and send credentials email?`)) return;

      try {
         setLoading(true);
         const res = await fetchJson(`/api/owners/${encodeURIComponent(owner.loginId || owner._id)}/approve`, {
            method: "POST",
            headers: getAuthHeader(),
            body: JSON.stringify({})
         });
         alert(res.message || "✅ Owner approved and credentials email sent successfully!");
         broadcastStatusChange({ type: "kyc", loginId: owner.loginId || owner._id, kycStatus: "completed" });
         loadOwners({ silent: true });
      } catch (err) {
         alert("Failed to approve owner: " + (err.message));
      } finally {
         setLoading(false);
      }
   };

   const exportToExcel = () => {
      const data = filteredOwners.map(o => ({
         "Owner ID": o.loginId,
         "Name": o.name,
         "Email": o.email,
         "Phone": o.phone,
         "Area": o.locationCode || o.checkinArea,
         "Bank": o.bankName || o.checkinBankName,
         "KYC Status": o.kycStatus || o.kyc?.status || "pending",
         "Properties": o.propertyCount || 0
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Owners");
      XLSX.writeFile(wb, `Roomhy_Owners_${new Date().toISOString().split('T')[0]}.xlsx`);
   };

   return (
      <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
         {/* Page Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">View All Owners</h1>
               <p className="text-[13px] text-[#4A5961] mt-0.5">Manage and view all registered property owners</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
               <button
                  onClick={exportToExcel}
                  className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] font-semibold text-[13px] px-4 py-1.5 rounded-[8px] transition-colors cursor-pointer shadow-xs"
               >
                  Export
               </button>
               <button
                  onClick={() => navigate("/superadmin/add-owner")}
                  className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-[13px] px-4 py-1.5 rounded-[8px] flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
               >
                  <Plus size={16} /> Add Owner
               </button>
            </div>
         </div>

          {/* Search & Filter Bar (OUTSIDE Table Card) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
             <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
                <input
                   value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search"
                   className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-10 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
                />
             </div>
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <select className="appearance-none px-3 py-1.5 bg-white border border-[#CBD3D9] rounded-[8px] text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-full sm:w-[110px]">
                   <option value="">KYC status ▾</option>
                   <option value="verified">Verified</option>
                   <option value="pending">Pending</option>
                </select>
                <select className="appearance-none px-3 py-1.5 bg-white border border-[#CBD3D9] rounded-[8px] text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-full sm:w-[110px]">
                   <option value="">Subscription ▾</option>
                   <option value="basic">Basic</option>
                   <option value="standard">Standard</option>
                   <option value="premium">Premium</option>
                </select>
                <select className="appearance-none px-3 py-1.5 bg-white border border-[#CBD3D9] rounded-[8px] text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs w-full sm:w-[100px]">
                   <option value="">Status ▾</option>
                   <option value="approved">Approved</option>
                   <option value="pending">Pending</option>
                </select>
             </div>
          </div>

          {/* Separate Table Card Below */}
          <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                   <thead>
                      <tr className="border-b border-[#E1E6EA]">
                         <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Owner</th>
                         <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Properties</th>
                         <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Phone</th>
                         <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">KYC</th>
                         <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Subscription</th>
                         <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                         <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Action</th>
                      </tr>
                   </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-sm">
                     {loading ? (
                        <tr><td colSpan="7" className="py-8 text-center text-[#4A5961] text-[13px]">Loading Property Owners...</td></tr>
                     ) : filteredOwners.length === 0 ? (
                        <tr><td colSpan="7" className="py-8 text-center text-[#4A5961] text-[13px]">No property owners found.</td></tr>
                     ) : paginatedOwners.map((o, i) => {
                        const kycStat = (o.kycStatus || o.kyc?.status || "pending").toLowerCase();
                        const isApproved = o.status === "approved" || o.isApproved;

                        return (
                           <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                              <td className="py-2.5 px-6 font-medium text-[#10242A] pl-2">
                                 <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#D9E1E7] flex items-center justify-center font-bold text-[11px] text-[#4A5961] shrink-0">
                                       {(o.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                       <span className="font-semibold text-[#10242A] text-[13px] block">{o.name || "Owner"}</span>
                                       <span className="text-[12px] text-[#708088]">{o.loginId || "—"}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-2.5 text-[#4A5961] text-[13px]">{o.propertyCount || 1} Properties</td>
                              <td className="py-2.5 text-[#4A5961] text-[13px]">{o.phone || o.profile?.phone || "—"}</td>
                              <td className="py-2.5">
                                 <span className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                                    (kycStat === "verified" || kycStat === "completed") ? "bg-[#DDF3E4] text-[#14532D]" : kycStat === "submitted" ? "bg-[#E0F2FE] text-[#0369A1]" : kycStat === "docs_missing" ? "bg-[#FDE8E8] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                                 )}>
                                    {(kycStat === "verified" || kycStat === "completed") ? "Verified" : kycStat === "submitted" ? "Submitted" : kycStat === "docs_missing" ? "Docs missing" : "Pending"}
                                 </span>
                              </td>
                              <td className="py-2.5">
                                 <span className="bg-[#E0F2FE] text-[#0369A1] text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center">
                                    Trial Active
                                 </span>
                              </td>
                              <td className="py-2.5">
                                 <span className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                                    isApproved ? "bg-[#DDF3E4] text-[#14532D]" : "bg-[#FDEBD0] text-[#7A3E00]"
                                 )}>
                                    {isApproved ? "Approved" : "Pending"}
                                 </span>
                              </td>
                              <td className="py-2.5 px-6 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => { setSelectedOwner(o); setIsEditingOwner(false); }} className="px-3 py-1 bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] rounded-[6px] text-[11px] font-semibold transition shadow-xs cursor-pointer">
                                       View
                                    </button>
                                    <button onClick={() => { setSelectedOwner(o); setIsEditingOwner(true); }} className="px-3 py-1 bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] rounded-[6px] text-[11px] font-semibold transition shadow-xs cursor-pointer">
                                       Edit
                                    </button>
                                    <button onClick={() => deleteOwner(o)} className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-semibold px-3 py-1 rounded-[6px] transition-all shadow-xs cursor-pointer">
                                       Delete
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>

               {/* Pagination */}
               {totalRecords > 0 && (
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E1E6EA]">
                     <p className="text-[12px] font-semibold text-[#4A5961]">
                        Showing {((currentPage - 1) * LIMIT) + 1} to {Math.min(currentPage * LIMIT, totalRecords)} of{" "}
                        <span className="text-[#10242A] font-bold">{totalRecords.toLocaleString()}</span> property owners
                     </p>
                     <div className="flex items-center gap-2">
                        <button
                           disabled={currentPage === 1}
                           onClick={() => setCurrentPage(currentPage - 1)}
                           className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#CBD3D9] text-[12px] font-semibold text-[#10242A] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                           <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <span className="text-[12px] text-[#4A5961] font-semibold px-2">Page {currentPage} of {totalPages}</span>
                        <button
                           disabled={currentPage === totalPages}
                           onClick={() => setCurrentPage(currentPage + 1)}
                           className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#CBD3D9] text-[12px] font-semibold text-[#10242A] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                           Next <ChevronRight className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               )}
            </div>

         {/* Detail Slide-over Panel */}
         {selectedOwner && (
            <div className="fixed inset-0 z-[120] flex items-center justify-end p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="bg-white w-full max-w-xl h-full rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20">
                           {selectedOwner.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">{selectedOwner.name}</h3>
                           <p className="text-xs text-slate-500 font-medium mt-0.5">ID: {selectedOwner.loginId}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        {isEditingOwner && (
                           <button
                              onClick={handleSaveEdit}
                              disabled={savingEdit}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center gap-1.5 active:scale-95"
                           >
                              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              Save
                           </button>
                        )}
                        <button onClick={() => setIsEditingOwner(!isEditingOwner)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200">
                           {isEditingOwner ? "Cancel" : "Edit"}
                        </button>
                        <button onClick={() => setSelectedOwner(null)} className="p-2 rounded-xl bg-white text-slate-400 hover:text-slate-700 transition-all border border-slate-200 shadow-sm">
                           <X size={20} />
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                     <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                           <User size={18} className="text-blue-600" />
                           <span>Owner Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({ ...editOwnerForm, email: e.target.value })} type="email" icon={Mail} label="Email Address" value={isEditingOwner ? editOwnerForm.email : (selectedOwner.email || selectedOwner.checkinEmail)} />
                           <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({ ...editOwnerForm, phone: e.target.value })} type="tel" icon={Phone} label="Phone Number" value={isEditingOwner ? editOwnerForm.phone : (selectedOwner.phone || selectedOwner.checkinPhone)} />
                           <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({ ...editOwnerForm, checkinDob: e.target.value })} type="date" icon={Calendar} label="Date of Birth" value={isEditingOwner ? editOwnerForm.checkinDob : (selectedOwner.checkinDob || "Not Defined")} />
                           <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({ ...editOwnerForm, address: e.target.value })} type="text" icon={MapPin} label="Address" value={isEditingOwner ? editOwnerForm.address : (selectedOwner.address || selectedOwner.checkinAddress)} />
                        </div>
                     </section>

                     <section className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                           <Banknote size={18} className="text-emerald-600" />
                           <span>Banking Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({ ...editOwnerForm, bankName: e.target.value })} type="text" icon={Building2} label="Bank Name" value={isEditingOwner ? editOwnerForm.bankName : (selectedOwner.bankName || selectedOwner.checkinBankName)} />
                           <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({ ...editOwnerForm, branchName: e.target.value })} type="text" icon={MapPin} label="Branch Name" value={isEditingOwner ? editOwnerForm.branchName : (selectedOwner.branchName || selectedOwner.checkinBranchName)} />
                           <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({ ...editOwnerForm, accountNumber: e.target.value })} type="text" icon={Fingerprint} label="Account Number" value={isEditingOwner ? editOwnerForm.accountNumber : (selectedOwner.accountNumber || selectedOwner.checkinBankAccountNumber)} />
                           <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({ ...editOwnerForm, ifscCode: e.target.value })} type="text" icon={Shield} label="IFSC Code" value={isEditingOwner ? editOwnerForm.ifscCode : (selectedOwner.ifscCode || selectedOwner.checkinIfscCode)} />
                        </div>
                     </section>

                     {/* KYC & Uploaded Documents Section */}
                     <section className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                              <ShieldCheck size={18} className="text-blue-600" />
                              <span>KYC & Verification Documents</span>
                           </div>
                           <span className={cn(
                              "text-xs font-bold px-2.5 py-1 rounded-lg uppercase",
                              (selectedOwner.kycStatus || selectedOwner.kyc?.status) === "verified" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                           )}>
                              {selectedOwner.kycStatus || selectedOwner.kyc?.status || "Pending"}
                           </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem icon={Fingerprint} label="Aadhaar Number" value={selectedOwner.checkinAadhaarNumber || selectedOwner.aadharNumber || selectedOwner.kyc?.aadharNumber || "Not Provided"} />
                           <DetailItem icon={Phone} label="Aadhaar Phone" value={selectedOwner.checkinAadhaarLinkedPhone || selectedOwner.kyc?.aadhaarLinkedPhone || "Not Provided"} />
                        </div>

                        {/* Uploaded Document Previews */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                           {selectedOwner.checkinOwnerPhoto && (
                              <a href={selectedOwner.checkinOwnerPhoto} target="_blank" rel="noreferrer" className="group relative rounded-xl border border-slate-200 p-2 text-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all">
                                 <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-200 mb-1.5">
                                    <img src={selectedOwner.checkinOwnerPhoto} alt="Owner Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement && (e.currentTarget.parentElement.innerHTML = '<div class=\'flex items-center justify-center h-full text-slate-400 text-xs\'>No Preview</div>'); }} />
                                 </div>
                                 <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Owner Photo ↗</span>
                              </a>
                           )}
                           {(selectedOwner.checkinAadhaarImage || selectedOwner.kyc?.documentImage || selectedOwner.documentImage) && (
                              <a href={selectedOwner.checkinAadhaarImage || selectedOwner.kyc?.documentImage || selectedOwner.documentImage} target="_blank" rel="noreferrer" className="group relative rounded-xl border border-slate-200 p-2 text-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all">
                                 <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-200 mb-1.5 flex items-center justify-center">
                                    <img src={selectedOwner.checkinAadhaarImage || selectedOwner.kyc?.documentImage || selectedOwner.documentImage} alt="Aadhaar Card" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement && (e.currentTarget.parentElement.innerHTML = '<div class=\'flex items-center justify-center h-full text-slate-400 text-xs\'>No Preview</div>'); }} />
                                 </div>
                                 <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Aadhaar Card ↗</span>
                              </a>
                           )}
                           {(selectedOwner.checkinBankProof || selectedOwner.checkinCancelledCheque) && (
                              <a href={typeof selectedOwner.checkinBankProof === 'string' ? selectedOwner.checkinBankProof : (typeof selectedOwner.checkinCancelledCheque === 'string' ? selectedOwner.checkinCancelledCheque : selectedOwner.checkinCancelledCheque?.dataUrl)} target="_blank" rel="noreferrer" className="group relative rounded-xl border border-slate-200 p-2 text-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all">
                                 <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-200 mb-1.5 flex items-center justify-center text-slate-400">
                                    {String(selectedOwner.checkinBankProof || selectedOwner.checkinCancelledCheque?.dataUrl || '').startsWith("http") ? (
                                       <img src={selectedOwner.checkinBankProof || selectedOwner.checkinCancelledCheque?.dataUrl} alt="Bank Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement && (e.currentTarget.parentElement.innerHTML = '<div class=\'flex items-center justify-center h-full text-slate-400 text-xs\'>No Preview</div>'); }} />
                                    ) : (
                                       <FileText size={28} />
                                    )}
                                 </div>
                                 <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Bank Proof ↗</span>
                              </a>
                           )}
                           {selectedOwner.checkinCancelledCheque && typeof selectedOwner.checkinCancelledCheque === 'object' && selectedOwner.checkinCancelledCheque.dataUrl && !selectedOwner.checkinBankProof && (
                              <a href={selectedOwner.checkinCancelledCheque.dataUrl} target="_blank" rel="noreferrer" className="group relative rounded-xl border border-slate-200 p-2 text-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all">
                                 <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-200 mb-1.5 flex items-center justify-center text-slate-400">
                                    <img src={selectedOwner.checkinCancelledCheque.dataUrl} alt="Cancelled Cheque" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement && (e.currentTarget.parentElement.innerHTML = '<div class=\'flex items-center justify-center h-full text-slate-400 text-xs\'>No Preview</div>'); }} />
                                 </div>
                                 <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Cancelled Cheque ↗</span>
                              </a>
                           )}
                        </div>
                     </section>
                  </div>
               </div>
            </div>
         )}

         {/* Owner Agreement Modal */}
         {agreementModalOwner && (
            <OwnerAgreementModal
               owner={agreementModalOwner}
               onClose={() => setAgreementModalOwner(null)}
            />
         )}

         {/* Add Owner Success Modal */}
         {addedOwnerResult && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-sm animate-in fade-in duration-200">
               <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Send size={22} />
                     </div>
                     <div>
                        <h3 className="text-base font-black text-slate-800">Owner Added{addedOwnerResult.kycLinkSent ? " & KYC Link Sent!" : ""}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{addedOwnerResult.kycLinkSent ? "A KYC verification email has been sent to the owner." : "The owner was created. Request a new onboarding link if the email did not arrive."}</p>
                     </div>
                  </div>

                  <div className="space-y-3 text-xs">
                     <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                        <div>
                           <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Owner Name</span>
                           <p className="font-bold text-slate-800 mt-0.5">{addedOwnerResult.name}</p>
                        </div>
                        <div>
                           <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Login ID</span>
                           <p className="font-mono font-bold text-blue-700 mt-0.5">{addedOwnerResult.loginId}</p>
                        </div>
                        <div>
                           <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">KYC Email Sent To</span>
                           <p className="font-bold text-slate-800 mt-0.5">{addedOwnerResult.email}</p>
                        </div>
                     </div>

                     <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <span className="text-blue-600 font-bold uppercase tracking-wider text-[10px]">KYC Verification Link</span>
                        <p className="font-mono text-[10px] text-blue-800 mt-1 break-all leading-relaxed">{addedOwnerResult.kycLink || "A secure link could not be generated. Please resend the onboarding link."}</p>
                        <button
                           onClick={() => { navigator.clipboard.writeText(addedOwnerResult.kycLink); alert("KYC link copied!"); }}
                           disabled={!addedOwnerResult.kycLink}
                           className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all"
                        >
                           Copy KYC Link
                        </button>
                        <button
                           onClick={handleResendKycLink}
                           disabled={resendingKycLink}
                           className="mt-2 ml-2 px-3 py-1.5 bg-white text-blue-700 rounded-lg text-[10px] font-bold border border-blue-200 disabled:opacity-50"
                        >
                           {resendingKycLink ? "Sending…" : "Resend KYC Email"}
                        </button>
                     </div>

                     <p className="text-slate-400 text-[10px] text-center">Owner will appear in <b>Pending Owners</b> tab until KYC is completed.</p>
                  </div>

                  <div className="flex gap-3 mt-5">
                     <button
                        onClick={() => { setAddedOwnerResult(null); setSearchParams({ view: "pending" }); }}
                        className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-xs border border-slate-200 hover:bg-slate-200 transition"
                     >
                        View Pending Owners
                     </button>
                     <button
                        onClick={() => { setAddedOwnerResult(null); setSearchParams({ view: "add" }); generateCreds(); setFormName(""); setFormEmail(""); setFormPhone(""); setFormArea(""); setFormCity(""); setFormBankName(""); setFormBranchName(""); setFormBankAccountNumber(""); setFormIfscCode(""); setFormAccountHolderName(""); setFormUpiId(""); }}
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition shadow-sm"
                     >
                        Add Another Owner
                     </button>
                  </div>
               </div>
            </div>
         )}

      </div>
   );
}

function DetailItem({ label, value, icon: Icon, isEditing, onChange, type = "text" }) {
   return (
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
         <div className="flex items-center gap-1.5 text-slate-400">
            {Icon && <Icon size={14} />}
            <span className="text-[11px] font-semibold text-slate-500">{label}</span>
         </div>
         {isEditing ? (
            <input
               type={type}
               value={value || ""}
               onChange={onChange}
               className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
         ) : (
            <p className="text-xs font-bold text-slate-900 truncate">{value || "Not Set"}</p>
         )}
      </div>
   );
}
