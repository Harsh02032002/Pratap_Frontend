import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function OwnerPending() {
   const [owners, setOwners] = useState([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [currentPage, setCurrentPage] = useState(1);
   const LIMIT = 10;

   const loadOwners = async () => {
      try {
         setLoading(true);
         const res = await fetchJson("/api/owners");
         const baseOwners = Array.isArray(res) ? res : (res.data || res.owners || []);
         setOwners(baseOwners);
      } catch (err) {
         console.error("Failed to load pending owners:", err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadOwners();
   }, []);

   const pendingOwners = useMemo(() => {
      return owners.filter(o => {
         const q = search.toLowerCase();
         const isPending = o.status === "pending" || !o.isApproved;
         const matchQ = !q || (o.name || "").toLowerCase().includes(q) || (o.email || "").toLowerCase().includes(q) || (o.loginId || "").toLowerCase().includes(q);
         return isPending && matchQ;
      });
   }, [owners, search]);

   const totalRecords = pendingOwners.length;
   const totalPages = Math.ceil(totalRecords / LIMIT) || 1;
   const paginatedOwners = useMemo(() => {
      const start = (currentPage - 1) * LIMIT;
      return pendingOwners.slice(start, start + LIMIT);
   }, [pendingOwners, currentPage]);

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
         alert("Cannot approve owner: Owner has not submitted KYC documents yet.");
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
         alert(res.message || "Owner approved and credentials email sent successfully!");
         loadOwners();
      } catch (err) {
         alert("Failed to approve owner: " + (err.message));
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
         {/* Page Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Approved / Pending</h1>
               <p className="text-[13px] text-[#4A5961] mt-0.5">Review newly submitted property owner applications.</p>
            </div>
         </div>

         {/* Approved / Pending Table Card */}
         <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs">
            {/* Filter Bar (Only Search Bar) */}
            <div className="flex items-center gap-3 mb-4">
               <div className="relative w-full sm:w-[320px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#708088]" />
                  <input
                     value={search}
                     onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                     placeholder="Search"
                     className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-10 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
                  />
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Owner</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Submitted</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">KYC</th>
                        <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F6] text-sm">
                     {loading ? (
                        <tr><td colSpan="4" className="py-8 text-center text-[#4A5961] text-[13px]">Loading pending applications...</td></tr>
                     ) : pendingOwners.length === 0 ? (
                        <tr><td colSpan="4" className="py-8 text-center text-[#4A5961] text-[13px]">No pending property owner applications.</td></tr>
                     ) : paginatedOwners.map((o, i) => {
                        const kycStat = (o.kycStatus || o.kyc?.status || "pending").toLowerCase();
                        const submittedDateStr = o.createdAt
                           ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
                           : "Recently";

                        return (
                           <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                              <td className="py-2.5 px-4 font-medium text-[#10242A] pl-2">
                                 <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#D9E1E7] flex items-center justify-center font-bold text-[11px] text-[#4A5961]">
                                       {(o.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                       <span className="font-semibold text-[#10242A] text-[13px] block">{o.name || "Owner"}</span>
                                       <span className="text-[12px] text-[#708088]">{o.email || o.phone || "—"}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-2.5 px-4 text-[#4A5961] text-[13px]">{submittedDateStr}</td>
                              <td className="py-2.5 px-4">
                                 <span className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                                    kycStat === "verified" ? "bg-[#DDF3E4] text-[#14532D]" : kycStat === "docs_missing" ? "bg-[#FDE8E8] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                                 )}>
                                    {kycStat === "verified" ? "Verified" : kycStat === "docs_missing" ? "Docs missing" : "Pending"}
                                 </span>
                              </td>
                              <td className="py-2.5 px-4 text-right pr-2">
                                 <button
                                    onClick={() => handleApproveOwner(o)}
                                    className="border border-[#0E7C86] text-[#0E7C86] hover:bg-[#E6F4F5] text-[11px] font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer"
                                 >
                                    Review
                                 </button>
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
                     <span className="text-[#10242A] font-bold">{totalRecords}</span> applications
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
      </div>
   );
}
