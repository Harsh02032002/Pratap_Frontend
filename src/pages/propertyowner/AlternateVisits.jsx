import React, { useEffect, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession } from "../../utils/propertyowner";
import { fetchJson } from "../../utils/api";

export default function AlternateVisits() {
  const owner = getOwnerRuntimeSession();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setError("");
    fetchJson("/api/booking/alternate-visits").then(response => {
      if (!Array.isArray(response?.data)) throw new Error("Unable to load alternate visits.");
      if (current) setVisits(response.data);
    }).catch(err => { if (current) setError(err.message || "Unable to load alternate visits."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [revision]);
  return <PropertyOwnerLayout owner={owner} title="Alternate Visits">
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Alternate Visits</h1>
        <p className="text-sm text-slate-600">Tenants invited by Roomhy to visit your properties. These are visit notices.</p></div>
        <button type="button" disabled={loading} onClick={() => setRevision(value => value + 1)} className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-50">Refresh</button></div>
      {loading ? <p role="status">Loading alternate visits...</p> : error ? <p role="alert" className="text-red-700">{error} <button type="button" onClick={() => setRevision(value => value + 1)} className="underline">Retry</button></p>
        : visits.length === 0 ? <p>No alternate visits yet.</p> : <div className="grid gap-4 md:grid-cols-2">{visits.map(visit => <article key={`${visit.round_id}:${visit.property.property_id}`} className="space-y-2 rounded-xl border bg-white p-5">
          <h2 className="text-lg font-bold">{visit.property.property_name}</h2>
          <p className="text-sm">{visit.tenant_name} · {visit.tenant_phone}</p>
          <p className="text-sm">Booking ID: <span className="break-all font-mono">{visit.booking_id}</span></p>
          <p className="text-sm">Visit round {visit.round_number} · Sent {new Date(visit.sent_at).toLocaleString("en-IN")}</p>
          <p className="text-sm text-slate-600">{visit.workflow_status === "refund_requested" ? "Tenant requested a refund." : visit.tenant_response === "another_alternative" ? "Tenant requested another alternative after this round." : "Tenant invited to visit."}</p>
        </article>)}</div>}
    </div>
  </PropertyOwnerLayout>;
}
