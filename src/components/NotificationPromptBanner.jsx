import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, X, Check, Laptop, Smartphone, Settings } from 'lucide-react';
import { isPushSupported, requestNotificationPermission } from '../utils/notificationManager';
import { useLocation } from 'react-router-dom';

export default function NotificationPromptBanner({ userLoginId = null }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const location = useLocation();

  // Each panel (owner, admin, tenant, website) has its own dismiss state
  // so dismissing on the website doesn't suppress the banner on owner panel
  const getPanelKey = () => {
    const path = location.pathname || '';
    if (path.startsWith('/propertyowner')) return 'roomhy_notif_banner_dismissed_owner';
    if (path.startsWith('/superadmin') || path.startsWith('/employee')) return 'roomhy_notif_banner_dismissed_admin';
    if (path.startsWith('/tenant')) return 'roomhy_notif_banner_dismissed_tenant';
    return 'roomhy_notif_banner_dismissed_website';
  };

  useEffect(() => {
    if (!isPushSupported()) return;

    const currentPermission = Notification.permission;
    setPermissionStatus(currentPermission);
    setIsDenied(currentPermission === 'denied');

    if (currentPermission === 'default') {
      const panelKey = getPanelKey();
      const isDismissed = sessionStorage.getItem(panelKey);
      if (!isDismissed) {
        setShowPrompt(false);
        setIsAnimatingIn(false);
        // 2.5s delay after page load / route change
        const timer = setTimeout(() => {
          setShowPrompt(true);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setIsAnimatingIn(true));
          });
        }, 2500);
        return () => clearTimeout(timer);
      }
    } else {
      // Already decided — hide any existing prompt
      setShowPrompt(false);
    }
  }, [location.pathname]); // Re-run whenever route changes

  const handleAllow = async () => {
    setIsSubmitting(true);
    const result = await requestNotificationPermission(userLoginId);
    setIsSubmitting(false);

    if (result.status === 'granted') {
      setPermissionStatus('granted');
      setIsAnimatingIn(false);
      setTimeout(() => setShowPrompt(false), 350);
    } else if (result.status === 'denied') {
      setPermissionStatus('denied');
      setIsDenied(true);
      setIsAnimatingIn(false);
      setTimeout(() => setShowPrompt(false), 350);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(getPanelKey(), 'true');
    setIsAnimatingIn(false);
    setTimeout(() => setShowPrompt(false), 350);
  };

  if (!showPrompt) return null;
  if (permissionStatus !== 'default') return null;

  return (
    <>
      {/* Backdrop overlay on mobile for better visibility */}
      <div
        className="fixed inset-0 bg-black/10 z-[9998] md:hidden"
        style={{
          opacity: isAnimatingIn ? 1 : 0,
          transition: 'opacity 0.35s ease'
        }}
        onClick={handleDismiss}
      />

      {/* Notification Banner */}
      <div
        className="fixed z-[9999]"
        style={{
          bottom: '1.25rem',
          right: '1.25rem',
          left: 'clamp(1.25rem, 5vw, auto)',
          maxWidth: 'min(calc(100vw - 2.5rem), 420px)',
          transform: isAnimatingIn ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
          opacity: isAnimatingIn ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease',
          pointerEvents: isAnimatingIn ? 'auto' : 'none'
        }}
      >
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            boxShadow: '0 24px 48px -12px rgba(15, 168, 156, 0.22), 0 0 0 1px rgba(15, 168, 156, 0.1)',
          }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0FA89C, #0EA5E9, #6366F1)' }} />

          <div className="p-5">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Dismiss for now"
              style={{ position: 'absolute' }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header row */}
            <div className="flex items-start gap-3.5">
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #F0FAFA 0%, #E0F7F6 100%)',
                  border: '1px solid rgba(15, 168, 156, 0.2)'
                }}
              >
                <Bell className="w-5 h-5 text-[#0FA89C]" style={{ animation: 'bellRing 2.5s ease-in-out infinite' }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pr-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-[#102A43] text-sm leading-tight">
                    Enable Instant Alerts
                  </h4>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(15,168,156,0.1)', color: '#0FA89C' }}
                  >
                    Free
                  </span>
                </div>

                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Get real-time alerts on your <strong className="text-slate-700">laptop &amp; phone</strong> for
                  bookings, rent receipts, bidding offers &amp; gate passes.
                </p>

                {/* Device support badges */}
                <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Laptop className="w-3.5 h-3.5 text-[#0FA89C]" /> Laptop
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Smartphone className="w-3.5 h-3.5 text-[#0FA89C]" /> Phone
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Free
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleAllow}
                disabled={isSubmitting}
                className="flex-1 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-75"
                style={{
                  background: isSubmitting
                    ? 'linear-gradient(135deg, #0c8b81, #0a7a71)'
                    : 'linear-gradient(135deg, #0FA89C, #0C8B81)',
                  boxShadow: '0 4px 12px -2px rgba(15,168,156,0.45)'
                }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Enabling...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Allow Notifications
                  </>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs py-2.5 px-3 rounded-xl transition-all whitespace-nowrap"
              >
                Maybe Later
              </button>
            </div>

            {/* Help hint for blocked users */}
            {isDenied && (
              <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                <Settings className="w-3 h-3 shrink-0" />
                To enable: click the 🔒 lock icon in your browser address bar → Notifications → Allow.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bell ring animation keyframes */}
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-15deg); }
          20%, 40% { transform: rotate(15deg); }
          50% { transform: rotate(0deg); }
        }
      `}</style>
    </>
  );
}
