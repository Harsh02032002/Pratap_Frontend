import React, { useEffect, useState, useCallback } from 'react';
import { Lock, Clock, Crown, Phone, ChevronRight, AlertTriangle, RefreshCw, CreditCard, ShieldCheck } from 'lucide-react';
import { getApiBase, fetchJson } from '../../utils/api';
import { getOwnerRuntimeSession } from '../../utils/propertyowner';

const CACHE_KEY = 'owner_trial_status';

// Dynamically load Cashfree JS SDK v3
const loadCashfreeSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) return resolve(window.Cashfree);
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve(window.Cashfree);
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.body.appendChild(script);
  });
};

/**
 * TrialGuard — wraps all Owner Panel pages.
 * If trial is expired: shows full blur overlay + non-dismissable Cashfree payment modal.
 * If trial is active / subscribed / unconfigured: renders children normally.
 */
export default function TrialGuard({ owner, children }) {
  const [trialData, setTrialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  const runtimeOwner = getOwnerRuntimeSession();
  const loginId = owner?.loginId || runtimeOwner?.loginId;

  const fetchTrialStatus = useCallback(async () => {
    if (!loginId) { setLoading(false); return; }

    try {
      const res = await fetch(`${getApiBase()}/api/owners/subscription-status?loginId=${encodeURIComponent(loginId)}`);
      const data = await res.json();
      if (data.success) {
        setTrialData(data);
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

  // Handle Online Subscription Payment via Cashfree
  const handleCashfreeSubscription = async () => {
    if (!loginId) return;
    setPaying(true);
    setPayError('');

    try {
      // 1. Ensure Cashfree SDK is loaded
      const Cashfree = await loadCashfreeSDK();

      // 2. Create order on backend
      const orderRes = await fetchJson('/api/owners/create-subscription-order', {
        method: 'POST',
        body: JSON.stringify({ loginId })
      });

      if (!orderRes.success || (!orderRes.payment_session_id && !orderRes.order_id)) {
        throw new Error(orderRes.message || 'Could not initiate Cashfree payment session');
      }

      const paymentSessionId = orderRes.payment_session_id;
      const orderId = orderRes.order_id;

      if (Cashfree && paymentSessionId) {
        const cf = Cashfree({ mode: 'sandbox' });
        cf.checkout({
          paymentSessionId: paymentSessionId,
          redirectTarget: '_modal'
        }).then(async (result) => {
          console.log('[TrialGuard] Cashfree checkout complete:', result);
          // Verify payment with backend
          try {
            const verifyRes = await fetchJson('/api/owners/verify-subscription-payment', {
              method: 'POST',
              body: JSON.stringify({ loginId, order_id: orderId })
            });

            if (verifyRes.success) {
              setLoading(true);
              fetchTrialStatus();
            }
          } catch (vErr) {
            console.error('[TrialGuard] Verification error:', vErr);
            // Refresh trial status anyway
            fetchTrialStatus();
          }
        });
      } else {
        throw new Error('Cashfree SDK is unavailable');
      }
    } catch (err) {
      console.error('[TrialGuard] Cashfree payment error:', err);
      setPayError(err.message || 'Payment initiation failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  // Don't block if still loading or no data
  if (loading || !trialData) return <>{children}</>;

  // Don't block if not expired
  const isExpired = trialData.trialExpired === true || trialData.status === 'expired';
  if (!isExpired) return <>{children}</>;

  // Dynamic price display from backend settings (Superadmin configuration)
  const dynamicPrice = trialData.price != null ? Number(trialData.price) : 999;
  const priceDisplay = `₹${dynamicPrice.toLocaleString('en-IN')}`;

  // Format trial end date
  const endDateStr = trialData.trialEndDate
    ? new Date(trialData.trialEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="relative w-full h-full min-h-screen">
      {/* Blurred children — completely non-interactive when expired */}
      <div
        style={{
          filter: 'blur(12px)',
          pointerEvents: 'none',
          userSelect: 'none',
          transition: 'filter 0.3s ease',
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Strict Fullscreen Dark Overlay */}
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
        style={{ background: 'rgba(10, 14, 28, 0.88)', backdropFilter: 'blur(8px)' }}
      >
        <div className="w-full max-w-md mx-auto relative animate-in fade-in zoom-in-95 duration-300">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-red-500/40 via-orange-500/30 to-red-600/40 rounded-3xl blur-xl" />

          <div className="relative bg-[#0f172a] border border-red-500/40 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600" />

            {/* Icon & Title */}
            <div className="flex flex-col items-center pt-8 pb-4 px-8">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <Lock size={36} className="text-red-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                  <AlertTriangle size={14} className="text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight text-center">
                Free Trial Period Expired
              </h2>
              <p className="text-slate-400 text-xs text-center mt-2 leading-relaxed">
                {owner?.name ? `${owner.name}, your` : 'Your'} Roomhy Owner Panel trial has ended.
                {endDateStr && <> Expired on <span className="text-red-400 font-bold">{endDateStr}</span>.</>}
                <br />Renew your subscription online to regain immediate full access.
              </p>
            </div>

            {/* Info Cards */}
            <div className="px-8 space-y-3 mb-6">
              {/* Dynamic Subscription Price */}
              <div className="flex items-center gap-3 bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Crown size={20} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Subscription</p>
                  <p className="text-xl font-black text-white">
                    {priceDisplay} <span className="text-slate-400 font-normal text-xs">/ month</span>
                  </p>
                </div>
              </div>

              {/* Account ID */}
              <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
                  <span className="text-slate-400 font-black text-xs">ID</span>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Account Login ID</p>
                  <p className="text-xs font-bold text-white font-mono">{loginId}</p>
                </div>
              </div>

              {payError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold text-center">
                  {payError}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="px-8 pb-8 space-y-3">
              {/* Pay Online via Cashfree */}
              <button
                onClick={handleCashfreeSubscription}
                disabled={paying}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/30 text-sm active:scale-95 disabled:opacity-50"
              >
                {paying ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Connecting Cashfree...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Pay {priceDisplay} Online & Unlock Panel</span>
                    <ChevronRight size={16} className="opacity-70" />
                  </>
                )}
              </button>

              {/* Contact Support */}
              <a
                href="tel:+918764425030"
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-3.5 rounded-xl transition-all border border-slate-700 text-xs"
              >
                <Phone size={14} />
                Need Assistance? Contact Roomhy Support
              </a>

              {/* Refresh Status */}
              <button
                onClick={() => {
                  setLoading(true);
                  fetchTrialStatus();
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-400 py-1 transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} />
                Refresh Subscription Status
              </button>
            </div>

            {/* Branding */}
            <div className="text-center pb-5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                ROOMHY.COM — Owner Panel Protection
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
