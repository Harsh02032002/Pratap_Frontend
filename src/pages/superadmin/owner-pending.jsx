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
      <div className="space-y-6 text-[#10242A]">
         {/* Page Header matching PDF Page 10 Spec */}
         <PageHeader
            title="Approved / Pending"
            subtitle="Review newly submitted property owner applications."
         />

         {/* Approved / Pending Table Card */}
         <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm">
            {/* Filter Bar (Only Search Bar as per PDF Page 10) */}
            <div className="flex items-center gap-3 mb-6">
               <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5961]" />
                  <input
                     value={search}
                     onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                     placeholder="Search"
                     className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] pl-10 pr-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
                  />
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-[#E1E6EA]">
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Owner</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">Submitted</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4">KYC</th>
                        <th className="text-xs font-semibold text-[#4A5961] py-3 px-4 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E6EA] text-sm">
                     {loading ? (
                        <tr><td colSpan="4" className="py-12 text-center text-[#4A5961]">Loading pending applications...</td></tr>
                     ) : pendingOwners.length === 0 ? (
                        <tr><td colSpan="4" className="py-12 text-center text-[#4A5961]">No pending property owner applications.</td></tr>
                     ) : paginatedOwners.map((o, i) => {
                        const kycStat = (o.kycStatus || o.kyc?.status || "pending").toLowerCase();
                        const submittedDateStr = o.createdAt
                           ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
                           : "Recently";

                        return (
                           <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-4 font-medium text-[#10242A]">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#E1E6EA] flex items-center justify-center font-bold text-xs text-[#10242A]">
                                       {(o.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                       <span className="font-semibold text-[#10242A] block">{o.name || "Owner"}</span>
                                       <span className="text-xs text-[#4A5961]">{o.email || o.phone || "—"}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-3.5 px-4 text-[#4A5961]">{submittedDateStr}</td>
                              <td className="py-3.5 px-4">
                                 <span className={cn(
                                    "text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center",
                                    kycStat === "verified" ? "bg-[#DDF3E4] text-[#14532D]" : kycStat === "docs_missing" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                                 )}>
                                    {kycStat === "verified" ? "Verified" : kycStat === "docs_missing" ? "Docs missing" : "Pending"}
                                 </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                 <button
                                    onClick={() => handleApproveOwner(o)}
                                    className="border border-[#0E7C86] text-[#0E7C86] hover:bg-[#E6F4F5] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer"
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
               <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E1E6EA]">
                  <p className="text-xs text-[#4A5961]">
                     Showing {((currentPage - 1) * LIMIT) + 1} to {Math.min(currentPage * LIMIT, totalRecords)} of{" "}
                     <span className="font-semibold text-[#10242A]">{totalRecords}</span> applications
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
      </div>
   );
}
