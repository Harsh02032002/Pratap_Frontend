import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJson } from './api';
import { getAuthSession, onAuthSessionChange } from './authScope';

const unavailable = () => ({ state: 'unavailable', receipt: null });
const validId = value => typeof value === 'string' && value.trim().length > 0;

// A legacy status response or success flag alone is never receipt evidence.
export function parsePaymentConfirmation(data, orderId) {
  if (data?.success !== true) return unavailable();
  if (data.state === 'pending' || data.state === 'failed') return { state: data.state, receipt: null };
  const r = data.receipt;
  if (data.state !== 'paid' || data.verified !== true || !r || r.status !== 'PAID' ||
      r.orderId !== orderId || !validId(r.receiptId) || !validId(r.bookingId) || !validId(r.paymentId) ||
      !validId(r.propertyName) || r.currency !== 'INR' || typeof r.amount !== 'number' ||
      !Number.isFinite(r.amount) || r.amount <= 0 || !validId(r.paidAt) ||
      !Number.isFinite(Date.parse(r.paidAt))) return unavailable();
  return { state: 'paid', receipt: r };
}

export async function loadPaymentConfirmation(orderId, signal) {
  if (typeof orderId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(orderId)) return unavailable();
  const data = await fetchJson(`/api/payments/payu/confirmation/${encodeURIComponent(orderId)}`, {
    signal, cache: 'no-store', referrerPolicy: 'no-referrer', credentials: 'omit',
  });
  return parsePaymentConfirmation(data, orderId);
}

export function usePaymentConfirmation(orderId) {
  const [result, setResult] = useState({ state: 'loading', receipt: null });
  const sequence = useRef(0);
  const currentRequest = useRef(null);

  const check = useCallback(async () => {
    const generation = getAuthSession().generation;
    const id = ++sequence.current;
    currentRequest.current?.abort();
    const controller = new AbortController();
    currentRequest.current = controller;
    setResult({ state: 'loading', receipt: null });
    try {
      const next = await loadPaymentConfirmation(orderId, controller.signal);
      if (sequence.current !== id || controller.signal.aborted || getAuthSession().generation !== generation) return unavailable();
      setResult({ ...next, orderId, generation });
      return next;
    } catch (_) {
      if (sequence.current === id) setResult({ ...unavailable(), orderId });
      return unavailable();
    }
  }, [orderId]);

  useEffect(() => {
    const unsubscribe = onAuthSessionChange(() => {
      sequence.current += 1;
      currentRequest.current?.abort();
      setResult({ ...unavailable(), orderId });
    });
    check();
    return () => { unsubscribe(); sequence.current += 1; currentRequest.current?.abort(); };
  }, [check]);

  // A changed URL must not render the previous order's receipt for one frame.
  const visible = result.orderId === orderId ? result : { state: 'loading', receipt: null };
  return { ...visible, check };
}
