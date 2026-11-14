import React, { useCallback, useEffect, useRef, useState } from "react";
import { clearApiCache, fetchJson } from "../utils/api";
import { toast } from "react-hot-toast";

export function useAlternateWorkflow(bookingId, email, revision = 0) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const refresh = useCallback(() => setRetry(value => value + 1), []);
  useEffect(() => {
    let current = true;
    setData(null); setError("");
    if (!bookingId || !email) { setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      const query = new URLSearchParams({ bookingId, email });
      fetchJson(`/api/booking/alternate-workflow?${query}`).then(response => {
        if (current) setData(response.data);
      }).catch(err => { if (current) setError(err.message || "Unable to load alternate visits."); })
        .finally(() => { if (current) setLoading(false); });
    }, 250);
    return () => { current = false; clearTimeout(timer); };
  }, [bookingId, email, revision, retry]);
  return { data, setData, error, loading, refresh };
}

export default function AlternateVisitStatus({ data, bookingId, email, onRefund, onChange, onRefresh, compact = false }) {
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const request = data?.request;
  if (!request) return null;
  const rounds = request.rounds || [];
  const another = async () => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError("");
    try {
      const response = await fetchJson("/api/booking/alternate-workflow/respond", { method: "POST", body: JSON.stringify({
        booking_id: bookingId, user_email: email, response: "another_alternative", workflow_version: request.workflow_version
      }) });
      clearApiCache(); onChange?.(response.data); toast.success(response.message);
      if (response.notificationWarning) toast.error(response.notificationWarning);
    } catch (err) { setError(err.message || "Your response could not be saved. Please try again."); }
    finally { busy.current = false; setSaving(false); }
  };
  return <section aria-label="Alternate visits" className="my-4 space-y-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-slate-900">
    {onRefresh && <button type="button" onClick={onRefresh} disabled={saving} className="text-sm font-semibold text-teal-800 underline">Refresh alternate visits</button>}
    {data.price_range && <p className="text-sm font-semibold">Your monthly rent range: ₹{Number(data.price_range.min_rent).toLocaleString("en-IN")}–₹{Number(data.price_range.max_rent).toLocaleString("en-IN")}</p>}
    {request.resolution_message?.text && <div className="rounded-lg border border-teal-300 bg-white p-3"><h3 className="font-bold">Message from Roomhy</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{request.resolution_message.text}</p></div>}
    {rounds.map((round, index) => <div key={round._id || index}>
      <h3 className="font-bold">{index === rounds.length - 1 && round.properties.length ? `You can visit these ${round.properties.length} properties` : `Previous visit round ${index + 1}`}</h3>
      <p className="text-xs text-slate-600">Round {index + 1}{round.sent_at ? ` · Sent ${new Date(round.sent_at).toLocaleDateString("en-IN")}` : ""}</p>
      <div className={`mt-2 grid gap-2 ${compact ? "" : "sm:grid-cols-3"}`}>{round.properties.map(property => <article key={property.property_id} className="rounded-lg border bg-white p-3">
        {property.image && <img src={property.image} alt={property.property_name} className="mb-2 h-24 w-full rounded object-cover" />}
        <h4 className="font-semibold">{property.property_name}</h4>
        <p className="text-xs">{[property.area, property.city, property.state].filter(Boolean).join(", ")}</p>
        {property.address && <p className="mt-1 text-xs">{property.address}</p>}
        <p className="mt-1 text-sm">₹{Number(property.rent || 0).toLocaleString("en-IN")}/month</p>
        {property.phone && <p className="text-xs">Contact: {property.phone}</p>}
      </article>)}</div>
      {round.tenant_response === "another_alternative" && <p className="mt-1 text-xs">You requested another alternative after this round.</p>}
    </div>)}
    {data.availability_error && <p role="alert" className="text-sm text-amber-800">{data.availability_error}</p>}
    {request.workflow_status === "refund_requested" ? <p className="text-sm font-semibold">Refund requested. Your existing refund request will be handled by the team.</p>
      : <>
        {request.workflow_status === "pending" && <p role="status" className="text-sm">Your alternate request is waiting for approval.</p>}
        {request.workflow_status === "awaiting_tenant" && <p className="text-sm">Still not satisfied? {data.can_request_another ? data.remaining_count === 0 ? "You can request another review from your area team, or choose a refund." : "Choose another alternative or request a token refund." : "Please use the refund option or contact the team."}</p>}
        {request.workflow_status === "refund_only" && <p className="text-sm">Your area team has sent its update. You can request a token refund below.</p>}
        <div className="flex flex-wrap gap-2">
          {data.can_request_another && <button type="button" disabled={saving} onClick={another} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Another alternative"}</button>}
          <button type="button" onClick={onRefund} disabled={saving} className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700">Request token refund</button>
        </div>
      </>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>;
}

export function BookingAlternateVisits({ booking, revision, onRefund, children }) {
  const bookingId = String(booking.booking_id || booking._id || booking.id || "");
  const email = booking.email || booking.user_email || "";
  const workflow = useAlternateWorkflow(bookingId, email, revision);
  if (workflow.loading) return <p role="status" className="my-2 text-sm">Loading alternate visits...</p>;
  if (workflow.error) return <p role="alert" className="my-2 text-sm text-red-700">{workflow.error} <button type="button" onClick={workflow.refresh} className="underline">Retry</button></p>;
  if (!workflow.data?.request) return children;
  return <AlternateVisitStatus data={workflow.data} bookingId={bookingId} email={email} onRefund={onRefund} onChange={workflow.setData} onRefresh={workflow.refresh} compact />;
}
