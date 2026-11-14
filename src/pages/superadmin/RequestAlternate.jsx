import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { fetchJson } from "../../utils/api";
import { uniqueAlternativeRequests } from "../../utils/alternativeRequests";
import "../../components/refund/refundTable.css";
import AlternateApprovalModal from "../../components/AlternateApprovalModal";
import { toast } from "react-hot-toast";

const emailStatusLabel = status => ({ pending: "Sending", sent: "Sent", failed: "Failed", partial: "Some failed", unavailable: "No email address" }[status] || status);

const formatDate = value => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleString("en-IN") : "N/A";
};

export default function RequestAlternate() {
  const isEmployeePanel = useLocation().pathname.startsWith("/employee");
  const [params, setParams] = useSearchParams();
  const bookingId = (params.get("bookingId") || "").trim();
  const [search, setSearch] = useState(bookingId);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [approving, setApproving] = useState(null);

  useEffect(() => setSearch(bookingId), [bookingId]);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ request_type: "alternative_property" });
    if (bookingId) query.set("booking_id", bookingId);
    fetchJson(`/api/booking/refund-requests?${query}`).then(response => {
      if (!current) return;
      const rows = response?.data || response;
      if (!Array.isArray(rows)) throw new Error("Unable to load alternate requests.");
      setRequests(uniqueAlternativeRequests(rows));
    }).catch(err => {
      if (current) {
        setRequests([]);
        setError(err.message || "Unable to load alternate requests.");
      }
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [bookingId, revision]);

  return (
    <div className="min-w-0 space-y-4 text-[#10242A]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">Request Alternate</h1>
          <p className="text-sm text-[#4A5961]">{isEmployeePanel ? "Website alternative property requests for your assigned city, area, or properties." : "Alternative property requests submitted from the website. One request per booking."}</p>
        </div>
        <button type="button" onClick={() => setRevision(value => value + 1)} disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[#CBD3D9] bg-white px-3 py-2 text-sm disabled:opacity-50">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      <form role="search" aria-label="Find alternate request" onSubmit={event => {
        event.preventDefault();
        setParams(search.trim() ? { bookingId: search.trim() } : {});
      }} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E1E6EA] bg-white p-4">
        <label htmlFor="alternate-booking-id" className="text-sm font-semibold">Booking ID</label>
        <input id="alternate-booking-id" type="search" value={search} onChange={event => setSearch(event.target.value)}
          placeholder="e.g. 6ae2d7acc92162010feba254" className="min-w-0 flex-1 rounded-lg border border-[#CBD3D9] px-3 py-2 text-sm sm:min-w-[260px]" />
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#0E7C86] px-4 py-2 text-sm font-semibold text-white"><Search size={15} /> Search</button>
        {bookingId && <button type="button" onClick={() => setParams({})} className="text-sm font-semibold text-[#0E7C86]">Clear search</button>}
      </form>
      <div className="overflow-hidden rounded-xl border border-[#E1E6EA] bg-white p-4">
        {loading ? <p role="status" className="flex items-center justify-center gap-2 py-8 text-sm"><Loader2 size={18} className="animate-spin" /> Loading alternate requests...</p>
          : error ? <div role="alert" className="py-8 text-center text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => setRevision(value => value + 1)} className="mt-3 font-semibold underline">Retry</button></div>
          : requests.length === 0 ? <p className="py-8 text-center text-sm text-[#4A5961]">{bookingId ? `No alternate request found for Booking ID ${bookingId}.` : "No alternate property requests yet."}</p>
          : <div className="refund-table-scroll">
            <table className="refund-table text-left text-sm">
              <thead><tr className="border-b border-[#E1E6EA] text-xs uppercase text-[#4A5961]">
                {["Booking ID", "Tenant", "Current Property & Owner", "Preferences & Reason", "Selected Properties", "Submitted & Status", "Action"].map(heading => <th key={heading}>{heading}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#F0F4F6]">
                {requests.map(request => <tr key={request._id || request.booking_record_id || request.booking_id}>
                  <td className="py-4"><span className="block font-mono text-xs font-bold text-[#0E7C86]">{request.booking_id}</span></td>
                  <td className="py-4"><p className="font-semibold">{request.user_name || "Tenant"}</p><p className="text-xs text-[#4A5961]">{request.user_phone}</p><p className="break-all text-xs text-[#4A5961]">{request.user_email}</p></td>
                  <td className="py-4"><p className="font-semibold">{request.property_name || "N/A"}</p><p className="text-xs text-[#4A5961]">{request.owner_name || request.owner_id || "N/A"}</p><p className="mt-1 text-xs text-[#4A5961]">Employee: {request.assigned_employee || "Needs assignment"}</p></td>
                  <td className="max-w-[260px] py-4"><p>{request.preferred_area || "No preferred area"}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs text-[#4A5961]">{request.property_requirements || request.other_details || "No reason provided"}</p></td>
                  <td className="max-w-[260px] py-4">{request.resolution_message?.text && <p className="mb-2 whitespace-pre-wrap break-words text-xs"><strong>Message sent:</strong> {request.resolution_message.text}</p>}{request.rounds?.length > 0 && <div className="mb-2">{request.rounds.map((round, index) => <div key={round._id || index} className="mb-2 text-xs"><p><strong>Round {index + 1}:</strong> {round.properties.map(property => property.property_name).join(", ")}</p>{round.tenant_email_status && <p className={round.tenant_email_status === "failed" || round.tenant_email_status === "unavailable" ? "mt-1 text-red-700" : "mt-1 text-slate-600"}>Tenant email: {emailStatusLabel(round.tenant_email_status)}</p>}{round.tenant_email_error && <p className="text-red-700">{round.tenant_email_error}</p>}{round.owner_email_status && <p className={round.owner_email_status === "sent" ? "mt-1 text-slate-600" : "mt-1 text-amber-800"}>Owner email: {emailStatusLabel(round.owner_email_status)}</p>}{round.owner_email_error && <p className="text-red-700">{round.owner_email_error}</p>}</div>)}</div>}{request.selected_alternative_properties?.length ? <ul className="space-y-1">{request.selected_alternative_properties.map((property, index) => <li key={property.property_id || index} className="text-xs">{property.property_name || property.property_id || "Selected property"}</li>)}</ul> : <span className="text-xs text-[#4A5961]">No properties selected</span>}</td>
                  <td className="py-4"><p className="mb-2 whitespace-nowrap text-xs text-[#4A5961]">{formatDate(request.created_at)}</p><span className="inline-block whitespace-nowrap rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold uppercase text-amber-800">{request.workflow_status || request.refund_status || "pending"}</span></td>
                  <td className="py-4">{(!request.workflow_status || request.workflow_status === "pending") ? <button type="button" onClick={() => setApproving(request)} className="rounded-lg bg-teal-700 px-3 py-2 font-semibold text-white">Approve</button> : <span className="text-xs">{request.rounds?.length || 0} round(s) sent</span>}</td>
                </tr>)}
              </tbody>
            </table>
          </div>}
      </div>
      {approving && <AlternateApprovalModal request={approving} onClose={() => setApproving(null)} onApproved={response => {
        toast.success(response.message); if (response.notificationWarning) toast.error(response.notificationWarning);
        setApproving(null); setRevision(value => value + 1);
      }} />}
    </div>
  );
}
