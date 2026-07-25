import React, { useEffect, useState, useCallback } from 'react';
import { Lock, Clock, Crown, Phone, ChevronRight, AlertTriangle, X, RefreshCw } from 'lucide-react';

const CACHE_KEY = 'owner_trial_status';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * TrialGuard — wraps all Owner Panel pages.
 * If trial is expired: shows blur overlay + modal popup.
 * If trial is active / subscribed / unconfigured: renders children normally.
 */
export default function TrialGuard({ owner, children }) {
  const [trialData, setTrialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false); // allow dismiss for 1 session to avoid aggressive blocking

  const loginId = owner?.loginId;

  const fetchTrialStatus = useCallback(async () => {
    if (!loginId) { setLoading(false); return; }

    // Check cache first
    try {
      const cached = sessionStorage.getItem(`${CACHE_KEY}_${loginId}`);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setTrialData(data);
          setLoading(false);
          return;
        }
      }
    } catch (_) {}

    try {
      const BASE = import.meta.env?.VITE_API_BASE || '';
      const res = await fetch(`${BASE}/api/owners/subscription-status?loginId=${encodeURIComponent(loginId)}`);
      const data = await res.json();
      if (data.success) {
        setTrialData(data);
        // Cache it
        try {
          sessionStorage.setItem(
            `${CACHE_KEY}_${loginId}`,
            JSON.stringify({ data, ts: Date.now() })
          );
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[TrialGuard] Could not fetch trial status:', err);
    } finally {
      setLoading(false);
    }
  }, [loginId]);

  useEffect(() => {
    fetchTrialStatus();
  }, [fetchTrialStatus]);

  // Don't block if still loading or no data
  if (loading || !trialData) return <>{children}</>;

  // Don't block if not expired
  const isExpired = trialData.trialExpired === true || trialData.status === 'expired';
  if (!isExpired) return <>{children}</>;

  // Format price display
  const priceDisplay = trialData.price != null
    ? `${trialData.currency === 'INR' ? '₹' : trialData.currency} ${Number(trialData.price).toLocaleString('en-IN')}`
    : null;

  // Format trial end date
  const endDateStr = trialData.trialEndDate
    ? new Date(trialData.trialEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="relative w-full h-full">
      {/* Blurred children */}
      <div
        style={{
          filter: dismissed ? 'none' : 'blur(6px)',
          pointerEvents: dismissed ? 'auto' : 'none',
          userSelect: 'none',
          transition: 'filter 0.3s ease',
        }}
        aria-hidden={!dismissed}
      >
        {children}
      </div>

      {/* Dark overlay */}
      {!dismissed && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(10, 14, 28, 0.75)', backdropFilter: 'blur(4px)' }}
        >
          <TrialExpiredModal
            priceDisplay={priceDisplay}
            endDateStr={endDateStr}
            ownerName={owner?.name}
            loginId={loginId}
            onDismiss={() => setDismissed(true)}
            onRefresh={() => {
              try { sessionStorage.removeItem(`${CACHE_KEY}_${loginId}`); } catch (_) {}
              setDismissed(false);
              setLoading(true);
              fetchTrialStatus();
            }}
          />
        </div>
      )}

      {/* Floating reminder badge if dismissed */}
      {dismissed && (
        <button
          onClick={() => setDismissed(false)}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-full shadow-2xl shadow-red-600/40 text-sm font-bold transition-all animate-pulse"
        >
          <AlertTriangle size={16} />
          Trial Expired — View Details
        </button>
      )}
    </div>
  );
}

function TrialExpiredModal({ priceDisplay, endDateStr, ownerName, loginId, onDismiss, onRefresh }) {
  return (
    <div className="w-full max-w-md mx-4 relative animate-in fade-in zoom-in-95 duration-300">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-br from-red-500/30 via-orange-500/20 to-red-600/30 rounded-3xl blur-xl" />

      <div className="relative bg-[#0f172a] border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600" />

        {/* Icon area */}
        <div className="flex flex-col items-center pt-8 pb-4 px-8">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Lock size={36} className="text-red-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
              <AlertTriangle size={14} className="text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight text-center">
            Free Trial Expired
          </h2>
          <p className="text-slate-400 text-sm text-center mt-2 leading-relaxed">
            {ownerName ? `${ownerName}, your` : 'Your'} Roomhy Owner Panel free trial has ended.
            {endDateStr && <> Trial ended on <span className="text-red-400 font-bold">{endDateStr}</span>.</>}
          </p>
        </div>

        {/* Info cards */}
        <div className="px-8 space-y-3 mb-6">
          {/* Days info */}
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trial Status</p>
              <p className="text-sm font-bold text-white">Trial period has ended</p>
            </div>
          </div>

          {/* Price info */}
          {priceDisplay && (
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Crown size={18} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscription Price</p>
                <p className="text-sm font-bold text-white">{priceDisplay} <span className="text-slate-400 font-normal text-xs">/ month</span></p>
              </div>
            </div>
          )}

          {/* Account ID */}
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <div className="w-9 h-9 rounded-lg bg-slate-600/30 flex items-center justify-center shrink-0">
              <span className="text-slate-300 font-black text-xs">ID</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Account ID</p>
              <p className="text-sm font-bold text-white font-mono">{loginId}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-8 pb-8 space-y-3">
          {/* Contact support CTA */}
          <a
            href="tel:+919999999999"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm"
          >
            <Phone size={16} />
            Contact Support to Subscribe
            <ChevronRight size={14} className="opacity-70" />
          </a>

          {/* Refresh (in case superadmin just extended) */}
          <button
            onClick={onRefresh}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-3 rounded-xl transition-all border border-slate-700 text-sm"
          >
            <RefreshCw size={14} />
            I've subscribed — Refresh Access
          </button>

          {/* Dismiss (view blurred for this session) */}
          <button
            onClick={onDismiss}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-400 py-1 transition-colors"
          >
            View panel (limited access) →
          </button>
        </div>

        {/* Roomhy branding */}
        <div className="text-center pb-5">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            ROOMHY.COM — Owner Panel
          </span>
        </div>
      </div>
    </div>
  );
}
