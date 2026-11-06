import React from "react";
import { ShieldAlert } from "lucide-react";
import useOwnerLeadAccess from "../../utils/useOwnerLeadAccess";
import { LEAD_BLOCK_MESSAGE } from "../../utils/ownerLeadAccess";

/**
 * Wrap the body of a lead / bid / chat page. When the owner is lead-blocked the
 * children are NOT rendered at all (so no old data is shown) and a plain notice
 * appears instead. Every other page of the panel is unaffected.
 */
export default function LeadAccessGuard({ owner, children }) {
  const { blocked } = useOwnerLeadAccess(owner);
  if (!blocked) return children;
  return (
    <div className="max-w-xl mx-auto mt-16 border border-slate-300 rounded-2xl bg-white p-8 text-center">
      <ShieldAlert className="w-10 h-10 mx-auto text-slate-800 mb-4" />
      <h2 className="text-lg font-bold text-slate-900 mb-2">Leads, bids and chats are blocked</h2>
      <p className="text-sm text-slate-700 leading-relaxed">{LEAD_BLOCK_MESSAGE}</p>
    </div>
  );
}
