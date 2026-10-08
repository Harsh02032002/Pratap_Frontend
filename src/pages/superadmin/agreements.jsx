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
      <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
         {/* Page Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Agreements</h1>
               <p className="text-[13px] text-[#4A5961] mt-0.5">Owner contracts and signatures</p>
            </div>
            <button
               onClick={() => alert("Create New Agreement action triggered")}
               className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-colors cursor-pointer shadow-xs flex items-center gap-2"
            >
               <Plus className="w-4 h-4" /> New Agreement
            </button>
         </div>

         {/* 3 Top Stat Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs">
               <p className="text-[13px] font-medium text-[#4A5961]">Active</p>
               <p className="text-[24px] font-bold text-[#10242A] tracking-tight mt-1">{String(stats.active).padStart(2, '0')}</p>
            </div>
            <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs">
               <p className="text-[13px] font-medium text-[#4A5961]">Awaiting Signature</p>
               <p className="text-[24px] font-bold text-[#10242A] tracking-tight mt-1">{String(stats.awaitingSignature).padStart(2, '0')}</p>
            </div>
            <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs">
               <p className="text-[13px] font-medium text-[#4A5961]">Expiring Soon</p>
               <p className="text-[24px] font-bold text-[#10242A] tracking-tight mt-1">{String(stats.expiringSoon).padStart(2, '0')}</p>
            </div>
         </div>

         {/* Outside Filter Bar */}
         <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-[320px]">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
               <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Search owner or property..."
                  className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-10 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
               />
            </div>
            <select
               value={statusFilter}
               onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
               className="bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold text-[#10242A] outline-none cursor-pointer shadow-xs w-full sm:w-[180px]"
            >
               <option value="all">Status ▾</option>
               <option value="active">Active</option>
               <option value="awaiting">Awaiting signature</option>
            </select>
         </div>

         {/* Agreements Table Card */}
         <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs overflow-hidden p-4">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Owner</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Start</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">End</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-sm">
                     {loading ? (
                        <tr><td colSpan="6" className="py-8 text-center text-[#4A5961] text-[13px]">Loading digital agreements...</td></tr>
                     ) : filteredOwners.length === 0 ? (
                        <tr><td colSpan="6" className="py-8 text-center text-[#4A5961] text-[13px]">No agreement records found.</td></tr>
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
                           <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                              <td className="py-2.5 px-4 font-medium text-[#10242A] pl-2">
                                 <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#D9E1E7] flex items-center justify-center font-bold text-[11px] text-[#4A5961]">
                                       {(o.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-[13px] text-[#10242A]">{o.name || "[Name]"}</span>
                                 </div>
                              </td>
                              <td className="py-2.5 px-4 text-[#4A5961] text-[13px]">{o.propertyName || o.propertyType || "[Property name]"}</td>
                              <td className="py-2.5 px-4 text-[#4A5961] text-[13px]">{startDateStr}</td>
                              <td className="py-2.5 px-4 text-[#4A5961] text-[13px]">{endDateStr}</td>
                              <td className="py-2.5 px-4">
                                 <span className={cn(
                                    "text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center",
                                    hasSigned ? "bg-[#DDF3E4] text-[#14532D]" : "bg-[#FDEBD0] text-[#7A3E00]"
                                 )}>
                                    {hasSigned ? "Active" : "Awaiting signature"}
                                 </span>
                              </td>
                              <td className="py-2.5 px-4 text-right pr-2">
                                 <div className="flex items-center justify-end gap-2">
                                    <button
                                       onClick={() => setAgreementModalOwner(o)}
                                       className="border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[11px] font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer"
                                    >
                                       View
                                    </button>
                                    <button
                                       onClick={() => setAgreementModalOwner(o)}
                                       className="border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[11px] font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer"
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
               <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E1E6EA]">
                  <p className="text-[12px] font-semibold text-[#4A5961]">
                     Showing {((currentPage - 1) * LIMIT) + 1} to {Math.min(currentPage * LIMIT, totalRecords)} of{" "}
                     <span className="text-[#10242A] font-bold">{totalRecords}</span> agreements
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
