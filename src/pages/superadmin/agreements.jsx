import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import OwnerAgreementModal from "../../components/superadmin/OwnerAgreementModal";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function Agreements() {
   const [owners, setOwners] = useState([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");
   const [agreementModalOwner, setAgreementModalOwner] = useState(null);
   const [currentPage, setCurrentPage] = useState(1);
   const LIMIT = 10;

   const loadOwners = async () => {
      try {
         setLoading(true);
         const res = await fetchJson("/api/owners");
         const baseOwners = Array.isArray(res) ? res : (res.data || res.owners || []);
         setOwners(baseOwners);
      } catch (err) {
         console.error("Failed to load owners for agreements:", err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadOwners();
   }, []);

   const stats = useMemo(() => {
      let active = 0;
      let awaitingSignature = 0;
      let expiringSoon = 0;

      owners.forEach(o => {
         const hasSigned = Boolean(o.checkinTermsAcceptedAt || o.checkinSubmittedAt || o.agreementStatus === "signed" || o.agreementSigned);
         if (hasSigned) active++;
         else awaitingSignature++;
      });

      return { active, awaitingSignature, expiringSoon };
   }, [owners]);

   const filteredOwners = useMemo(() => {
      return owners.filter(o => {
         const q = search.toLowerCase();
         const matchName = (o.name || "").toLowerCase().includes(q);
         const matchId = (o.loginId || "").toLowerCase().includes(q);
         const matchProperty = (o.propertyName || o.propertyType || "").toLowerCase().includes(q);
         const matchQ = !q || matchName || matchId || matchProperty;

         const hasSigned = Boolean(o.checkinTermsAcceptedAt || o.checkinSubmittedAt || o.agreementStatus === "signed" || o.agreementSigned);
         const matchStatus = statusFilter === "all" ||
            (statusFilter === "active" && hasSigned) ||
            (statusFilter === "awaiting" && !hasSigned);

         return matchQ && matchStatus;
      });
   }, [owners, search, statusFilter]);

   const totalRecords = filteredOwners.length;
   const totalPages = Math.ceil(totalRecords / LIMIT) || 1;
   const paginatedOwners = useMemo(() => {
      const start = (currentPage - 1) * LIMIT;
      return filteredOwners.slice(start, start + LIMIT);
   }, [filteredOwners, currentPage]);

   return (
      <div className="space-y-6 text-[#10242A]">
         {/* Page Header */}
         <PageHeader
            title="Agreements"
            subtitle="Owner contracts and signatures"
            actions={
               <button
                  onClick={() => alert("Create New Agreement action triggered")}
                  className="bg-[#095256] hover:bg-[#073d40] text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
               >
                  <Plus className="w-4 h-4" /> + New Agreement
               </button>
            }
         />

         {/* 3 Top Stat Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
               <p className="text-xs font-semibold text-slate-500 mb-1">Active</p>
               <p className="text-3xl font-bold text-slate-900">{String(stats.active).padStart(2, '0')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
               <p className="text-xs font-semibold text-slate-500 mb-1">Awaiting Signature</p>
               <p className="text-3xl font-bold text-slate-900">{String(stats.awaitingSignature).padStart(2, '0')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
               <p className="text-xs font-semibold text-slate-500 mb-1">Expiring Soon</p>
               <p className="text-3xl font-bold text-slate-900">{String(stats.expiringSoon).padStart(2, '0')}</p>
            </div>
         </div>

         {/* Outside Filter Bar */}
         <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Search owner or property..."
                  className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#095256]/20 focus:border-[#095256] transition-all shadow-2xs"
               />
            </div>
            <select
               value={statusFilter}
               onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
               className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-2xs w-full sm:w-44"
            >
               <option value="all">Status ▾</option>
               <option value="active">Active</option>
               <option value="awaiting">Awaiting signature</option>
            </select>
         </div>

         {/* Agreements Table Card */}
         <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">

            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Owner</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Property</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Start</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">End</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Status</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6EA] text-sm">
                     {loading ? (
                        <tr><td colSpan="6" className="py-12 text-center text-[#4A5961]">Loading digital agreements...</td></tr>
                     ) : filteredOwners.length === 0 ? (
                        <tr><td colSpan="6" className="py-12 text-center text-[#4A5961]">No agreement records found.</td></tr>
                     ) : paginatedOwners.map((o, i) => {
                        const hasSigned = Boolean(
                           o.checkinTermsAcceptedAt ||
                           o.checkinSubmittedAt ||
                           o.agreementStatus === "signed" ||
                           o.agreementSigned
                        );
                        const startDateStr = o.createdAt
                           ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
                           : "[Date]";
                        const endDateStr = o.agreementExpiryDate
                           ? new Date(o.agreementExpiryDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
                           : "[Date]";

                        return (
                           <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-4 font-medium text-[#10242A]">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#CBD3D9] flex items-center justify-center font-bold text-xs text-[#10242A]">
                                       {(o.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-[#10242A]">{o.name || "[Name]"}</span>
                                 </div>
                              </td>
                              <td className="py-3.5 px-4 text-[#4A5961]">{o.propertyName || o.propertyType || "[Property name]"}</td>
                              <td className="py-3.5 px-4 text-[#4A5961]">{startDateStr}</td>
                              <td className="py-3.5 px-4 text-[#4A5961]">{endDateStr}</td>
                              <td className="py-3.5 px-4">
                                 <span className={cn(
                                    "text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center",
                                    hasSigned ? "bg-[#DDF3E4] text-[#14532D]" : "bg-[#FDEBD0] text-[#7A3E00]"
                                 )}>
                                    {hasSigned ? "Active" : "Awaiting signature"}
                                 </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button
                                       onClick={() => setAgreementModalOwner(o)}
                                       className="border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer"
                                    >
                                       View
                                    </button>
                                    <button
                                       onClick={() => setAgreementModalOwner(o)}
                                       className="border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer"
                                    >
                                       Download
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
               <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E1E6EA]">
                  <p className="text-xs text-[#4A5961]">
                     Showing {((currentPage - 1) * LIMIT) + 1} to {Math.min(currentPage * LIMIT, totalRecords)} of{" "}
                     <span className="font-semibold text-[#10242A]">{totalRecords}</span> agreements
                  </p>
                  <div className="flex items-center gap-2">
                     <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="flex items-center gap-1 px-3 py-1 rounded-[6px] border border-[#CBD3D9] text-xs font-semibold text-[#10242A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                     >
                        <ChevronLeft className="w-4 h-4" /> Prev
                     </button>
                     <span className="text-xs text-[#4A5961] font-semibold px-2">Page {currentPage} of {totalPages}</span>
                     <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="flex items-center gap-1 px-3 py-1 rounded-[6px] border border-[#CBD3D9] text-xs font-semibold text-[#10242A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                     >
                        Next <ChevronRight className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            )}
         </div>

         {/* Agreement Modal Viewer */}
         {agreementModalOwner && (
            <OwnerAgreementModal
               owner={agreementModalOwner}
               onClose={() => setAgreementModalOwner(null)}
            />
         )}
      </div>
   );
}
