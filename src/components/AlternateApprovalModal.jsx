import React, { useEffect, useRef, useState } from "react";
import { clearApiCache, fetchJson } from "../utils/api";

export default function AlternateApprovalModal({ request, onClose, onApproved }) {
  const [pool, setPool] = useState(null);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const busy = useRef(false);
  const closeButton = useRef(null);
  useEffect(() => {
    let current = true;
    setPool(null); setSelected([]); setMessage(""); setError("");
    fetchJson(`/api/booking/alternate-requests/${encodeURIComponent(request._id)}/properties`).then(response => {
      if (current) setPool(response.data);
    }).catch(err => { if (current) setError(err.message || "Unable to load available properties."); });
    closeButton.current?.focus();
    return () => { current = false; };
  }, [request._id, revision]);
  const send = async () => {
    if (busy.current || !pool || (pool.required_count ? selected.length !== pool.required_count : !message.trim())) return;
    busy.current = true; setSaving(true); setError("");
    try {
      const response = await fetchJson(`/api/booking/alternate-requests/${encodeURIComponent(request._id)}/approve`, {
        method: "POST", body: JSON.stringify({ workflow_version: pool.workflow_version, ...(pool.required_count ? { property_ids: selected } : { message: message.trim() }) })
      });
      clearApiCache(); onApproved(response);
    } catch (err) { setError(err.message || "Approval could not be saved."); }
    finally { busy.current = false; setSaving(false); }
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="alternate-approval-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 text-slate-900"
      onKeyDown={event => {
        if (event.key === "Escape" && !saving) onClose();
        if (event.key === "Tab") {
          const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
          const first = buttons[0], last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <div className="flex items-center justify-between gap-4"><h2 id="alternate-approval-title" className="text-xl font-bold">Approve alternate visits</h2>
        <button ref={closeButton} type="button" onClick={onClose} disabled={saving} className="rounded border px-3 py-1">Close</button></div>
      {error && <p role="alert" className="my-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!pool ? <div className="py-6">{error ? <button onClick={() => setRevision(value => value + 1)} className="font-semibold underline">Retry</button> : <p role="status">Loading available properties...</p>}</div>
        : <>
          <p className="my-3 text-sm">Area: {pool.area.area}, {pool.area.city}{pool.area.state ? `, ${pool.area.state}` : ""}.{pool.required_count > 0 && <> Select exactly {pool.required_count} {pool.required_count === 1 ? "property" : "properties"}.</>}</p>
          {pool.price_range && <p className="mb-3 text-sm font-semibold">Allowed monthly rent: ₹{Number(pool.price_range.min_rent).toLocaleString("en-IN")}–₹{Number(pool.price_range.max_rent).toLocaleString("en-IN")}</p>}
          {pool.workflow_status !== "pending" ? <p>This round has already been handled. Close and refresh the queue.</p>
                        : pool.required_count === 0 ? <div className="space-y-3">
              <p className="text-sm">No unshown properties match this area and rent range. Send a message to the tenant. After it is sent, only the refund option will be shown.</p>
              <label htmlFor="alternate-final-message" className="block text-sm font-semibold">Message to tenant</label>
              <textarea id="alternate-final-message" value={message} onChange={event => setMessage(event.target.value)} rows={5} maxLength={5000} disabled={saving} className="w-full rounded-lg border p-3 text-sm" placeholder="Explain the available next step to the tenant..." />
              <button type="button" onClick={send} disabled={saving || !message.trim()} className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Sending..." : "Send message"}</button>
            </div>
              : <><div className="space-y-2">{pool.properties.map(property => <label key={property.property_id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                <input type="checkbox" aria-label={property.property_name} checked={selected.includes(property.property_id)} disabled={saving || (!selected.includes(property.property_id) && selected.length >= pool.required_count)}
                  onChange={event => setSelected(previous => event.target.checked ? [...previous, property.property_id] : previous.filter(id => id !== property.property_id))} />
                <span><span className="block font-semibold">{property.property_name}</span><span className="block text-sm">{property.address || property.area} · ₹{Number(property.rent || 0).toLocaleString("en-IN")}/month</span></span>
              </label>)}</div><p className="my-3 text-sm" aria-live="polite">{selected.length} of {pool.required_count} selected</p>
                <button type="button" onClick={send} disabled={saving || selected.length !== pool.required_count} className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Sending..." : "Approve and Send"}</button></>}
        </>}
    </section>
  </div>;
}
