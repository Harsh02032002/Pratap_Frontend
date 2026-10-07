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
import { fetchJson, getAuthHeader } from "../../utils/api";
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

   // Banking fields
   const [formBankName, setFormBankName] = useState("");
   const [formBranchName, setFormBranchName] = useState("");
   const [formBankAccountNumber, setFormBankAccountNumber] = useState("");
   const [formIfscCode, setFormIfscCode] = useState("");
   const [formAccountHolderName, setFormAccountHolderName] = useState("");
   const [formUpiId, setFormUpiId] = useState("");

   const loadOwners = async () => {
      // Check for authentication token
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
         console.error("No authentication token found");
         window.location.href = "/superadmin/login";
         return;
      }

      try {
         setLoading(true);
         const [res, visitsRes] = await Promise.all([
            fetchJson("/api/owners"),
            fetchJson("/api/visits").catch(() => ({ visits: [] }))
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

         setOwners(baseOwners.map(o => ({
            ...o,
            ...(visitMap[o.loginId] || {})
         })));
      } catch (err) {
         console.error("Failed to load owners:", err);
         // If auth error, redirect to login
         if (err?.message?.includes("Not authorized") || err?.status === 401) {
            window.location.href = "/superadmin/login";
         }
      }
      finally { setLoading(false); }
   };

   useEffect(() => { loadOwners(); }, []);

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
               checkinPassword: formPassword,
               checkinBankName: formBankName,
               checkinBranchName: formBranchName,
               checkinBankAccountNumber: formBankAccountNumber,
               checkinIfscCode: formIfscCode,
               checkinAccountHolderName: formAccountHolderName,
               checkinUpiId: formUpiId
            })
         });

         // Build KYC link from response or construct manually
         const kycLink = res?.kycLink ||
            `${window.location.origin}/digital-checkin/ownerprofile?loginId=${encodeURIComponent(formLoginId)}&email=${encodeURIComponent(formEmail)}&area=${encodeURIComponent(formArea || formCity)}&password=${encodeURIComponent(formPassword)}`;

         setAddedOwnerResult({
            loginId: res?.loginId || formLoginId,
            email: formEmail,
            name: formName,
            kycLink
         });

         loadOwners();
      } catch (err) { alert(err.message || "Failed to add property owner."); }
      finally { setSaving(false); }
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
         loadOwners();
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
         loadOwners();
      } catch (err) {
         alert("Failed to approve owner: " + (err.message));
      } finally {
         setLoading(false);
      }
   };

   const handleDelete = async (id) => {
      if (!window.confirm(`Are you sure you want to delete owner ${id}?`)) return;
      try {
         await fetchJson(`/api/owners/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: getAuthHeader()
         });
         loadOwners();
         if (selectedOwner?.loginId === id) setSelectedOwner(null);
      } catch (err) { alert("Failed to delete owner"); }
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
      <div className="space-y-6 text-[#10242A]">
         {/* Page Header matching PDF Page 8 Spec */}
         <PageHeader
            title="View All Owners"
            subtitle="Manage and view all registered property owners."
            actions={
               <div className="flex items-center gap-3">
                  <button
                     onClick={exportToExcel}
                     className="bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] font-semibold text-sm px-4 py-2 rounded-[8px] transition-colors cursor-pointer"
                  >
                     Export
                  </button>
                  <button
                     onClick={() => navigate("/superadmin/add-owner")}
                     className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-sm px-4 py-2 rounded-[8px] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                     <Plus className="w-4 h-4" /> + Add Owner
                  </button>
               </div>
            }
         />
         {/* Standard List View Table Card (PDF Page 8) */}
         <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
               <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5961]" />
                  <input
                     value={search} onChange={e => setSearch(e.target.value)}
                     placeholder="Search"
                     className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] pl-10 pr-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
                  />
               </div>
               <select className="h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] w-full sm:w-36">
                  <option value="">KYC status ▾</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
               </select>
               <select className="h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] w-full sm:w-36">
                  <option value="">Subscription ▾</option>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
               </select>
               <select className="h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] w-full sm:w-36">
                  <option value="">Status ▾</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
               </select>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Owner</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Properties</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Phone</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">KYC</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Subscription</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Status</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6EA] text-sm">
                     {loading ? (
                        <tr><td colSpan="7" className="py-12 text-center text-[#4A5961]">Loading Property Owners...</td></tr>
                     ) : filteredOwners.length === 0 ? (
                        <tr><td colSpan="7" className="py-12 text-center text-[#4A5961]">No property owners found.</td></tr>
                     ) : paginatedOwners.map((o, i) => {
                        const kycStat = (o.kycStatus || o.kyc?.status || "pending").toLowerCase();
                        const isApproved = o.status === "approved" || o.isApproved;

                        return (
                           <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-4 font-medium text-[#10242A]">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#E1E6EA] flex items-center justify-center font-bold text-xs text-[#10242A]">
                                       {(o.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                       <span className="font-semibold text-[#10242A] block">{o.name || "Owner"}</span>
                                       <span className="text-xs text-[#4A5961]">{o.loginId || "—"}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-3.5 px-4 text-[#4A5961]">{o.propertyCount || 1} Properties</td>
                              <td className="py-3.5 px-4 text-[#4A5961]">{o.phone || o.profile?.phone || "—"}</td>
                              <td className="py-3.5 px-4">
                                 <span className={cn(
                                    "text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center",
                                    kycStat === "verified" ? "bg-[#DDF3E4] text-[#14532D]" : kycStat === "docs_missing" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                                 )}>
                                    {kycStat === "verified" ? "Verified" : kycStat === "docs_missing" ? "Docs missing" : "Pending"}
                                 </span>
                              </td>
                              <td className="py-3.5 px-4">
                                 <span className="bg-[#E6F4F5] text-[#0E7C86] text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center">
                                    Trial Active
                                 </span>
                              </td>
                              <td className="py-3.5 px-4">
                                 <span className={cn(
                                    "text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center",
                                    isApproved ? "bg-[#DDF3E4] text-[#14532D]" : "bg-[#FDEBD0] text-[#7A3E00]"
                                 )}>
                                    {isApproved ? "Approved" : "Pending"}
                                 </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => { setSelectedOwner(o); setIsEditingOwner(false); }} className="border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer">
                                       View
                                    </button>
                                    <button onClick={() => { setSelectedOwner(o); setIsEditingOwner(true); }} className="border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer">
                                       Edit
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
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
                     <p className="text-xs font-semibold text-slate-500">
                        Showing {((currentPage - 1) * LIMIT) + 1} to {Math.min(currentPage * LIMIT, totalRecords)} of{" "}
                        <span className="text-slate-900 font-bold">{totalRecords.toLocaleString()}</span> property owners
                     </p>
                     <div className="flex items-center gap-2">
                        <button
                           disabled={currentPage === 1}
                           onClick={() => setCurrentPage(currentPage - 1)}
                           className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                           <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                           let n;
                           if (totalPages <= 7) n = i + 1;
                           else if (currentPage <= 4) n = i + 1;
                           else if (currentPage >= totalPages - 3) n = totalPages - 6 + i;
                           else n = currentPage - 3 + i;
                           return (
                              <button
                                 key={n}
                                 onClick={() => setCurrentPage(n)}
                                 className={cn("w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                    currentPage === n ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 border border-slate-200")}
                              >
                                 {n}
                              </button>
                           );
                        })}
                        <button
                           disabled={currentPage === totalPages}
                           onClick={() => setCurrentPage(currentPage + 1)}
                           className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                        <h3 className="text-base font-black text-slate-800">Owner Added & KYC Link Sent!</h3>
                        <p className="text-xs text-slate-500 mt-0.5">A KYC verification email has been sent to the owner.</p>
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
                        <p className="font-mono text-[10px] text-blue-800 mt-1 break-all leading-relaxed">{addedOwnerResult.kycLink}</p>
                        <button
                           onClick={() => { navigator.clipboard.writeText(addedOwnerResult.kycLink); alert("KYC link copied!"); }}
                           className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all"
                        >
                           Copy KYC Link
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
