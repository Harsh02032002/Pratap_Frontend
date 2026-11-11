import React from "react";
import { HelpCircle, ShieldAlert, ShieldCheck } from "lucide-react";

export default function RefundOnboardingBadge({ isOnboarded, verificationStatus }) {
  if (verificationStatus !== "verified") {
    return (
      <span title="Onboarding could not be verified for this property and owner." className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
        <HelpCircle size={13} className="shrink-0" /> Unable to Verify
      </span>
    );
  }

  return isOnboarded ? (
    <span title="Completed onboarding found for this property and owner." className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-md bg-red-50 text-red-800 border border-red-200 text-[11px] font-bold">
      <ShieldAlert size={13} className="shrink-0 text-red-600" /> ⚠️ Already Onboarded
    </span>
  ) : (
    <span title="No completed onboarding found for this property and owner." className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
      <ShieldCheck size={13} className="shrink-0 text-emerald-600" /> Not Onboarded
    </span>
  );
}
