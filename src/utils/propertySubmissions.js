export const PROPERTY_SUBMISSIONS_PATH = "/my-property-submissions";

export const submissionStages = {
  submitted: { label: "Submitted to Roomhy", description: "Your property details are with our team. We’ll assign someone to help you with the next steps.", step: 0, color: "bg-slate-100 text-slate-700" },
  assigned: { label: "Employee assigned", description: "A Roomhy team member has been assigned. They’ll contact you soon to help get your property listed.", step: 1, color: "bg-blue-50 text-blue-700" },
  reviewing: { label: "Listing under review", description: "Our team is reviewing your property. Your listing will appear here once it is published on the website.", step: 1, color: "bg-amber-50 text-amber-800" },
  live: { label: "Live on Roomhy", description: "Your property is listed on the website. Open the live listing to see what visitors see.", step: 2, color: "bg-teal-50 text-teal-700" },
  rejected: { label: "Rejected", description: "Your submission has not been approved. Please contact our team with your reference number for the next steps.", step: 0, color: "bg-rose-50 text-rose-700" },
  offline: { label: "Listing currently offline", description: "Your property is currently unavailable on the website. Contact our team for help getting it live again.", step: 1, color: "bg-slate-100 text-slate-700" },
};

export function getSubmissionPresentation(submission) {
  const stage = Object.hasOwn(submissionStages, submission?.stage) ? submissionStages[submission.stage] : submissionStages.reviewing;
  const listingUrl = submission?.stage === "live" && /^\/property-details\/[a-f\d]{24}$/i.test(submission?.listingUrl || "")
    ? submission.listingUrl : null;
  return { ...stage, listingUrl };
}

// Only these local destinations may be requested by the listing sign-in flow.
export function getListingReturnPath(search) {
  const path = new URLSearchParams(search).get("redirect");
  return ["/list-property", PROPERTY_SUBMISSIONS_PATH].includes(path) ? path : "/";
}
