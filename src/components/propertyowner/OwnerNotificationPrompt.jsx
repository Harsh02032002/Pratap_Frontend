import React, { useState, useEffect } from 'react';
import { Bell, X, Check, BellOff } from 'lucide-react';
import { isPushSupported, requestNotificationPermission } from '../../utils/notificationManager';

/**
 * OwnerNotificationPrompt
 * Prominently displayed banner on Owner Dashboard when notification permission is NOT yet enabled.
 * 1. Default -> Prompts user to click "Allow Now" for instant laptop & mobile alerts.
 * 2. Granted -> Returns null so dashboard stays 100% clean and unobstructed.
 * 3. Denied  -> Displays subtle instructions on how to unblock via browser settings.
 */
export default function OwnerNotificationPrompt({ loginId = null }) {
  const [permissionState, setPermissionState] = useState(null); // null = loading
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setPermissionState('unsupported');
      return;
    }
    const perm = Notification.permission;
    setPermissionState(perm);

    const dismissed = localStorage.getItem('roomhy_owner_notif_dismissed');
    if (dismissed && perm !== 'granted') setIsDismissed(true);
  }, []);

  const handleAllow = async () => {
    setIsLoading(true);
    sessionStorage.removeItem('roomhy_notif_banner_dismissed_owner');

    const result = await requestNotificationPermission(loginId);
    setIsLoading(false);

    if (result.status === 'granted') {
      setPermissionState('granted');
      localStorage.removeItem('roomhy_owner_notif_dismissed');
      setIsDismissed(false);
    } else if (result.status === 'denied') {
      setPermissionState('denied');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('roomhy_owner_notif_dismissed', 'true');
    setIsDismissed(true);
  };

  // Don't show anything if loading, unsupported, already granted, or explicitly dismissed
  if (permissionState === null || permissionState === 'unsupported' || permissionState === 'granted') return null;
  if (isDismissed) return null;

  // Denied State -> Orange step-by-step instructions
  if (permissionState === 'denied') {
    return (
      <div className="flex items-start md:items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5">
        <BellOff className="w-4 h-4 text-orange-500 shrink-0 mt-0.5 md:mt-0" />
        <p className="text-xs text-orange-800 flex-1 leading-snug">
          <strong>Notifications blocked.</strong> Click the 🔒 lock icon in your browser address bar → Notifications → <strong>Allow</strong>, then refresh to receive booking &amp; payment alerts.
        </p>
        <button onClick={handleDismiss} className="text-orange-400 hover:text-orange-600 p-0.5 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Default State -> Teal gradient prompt banner
  return (
    <div
      className="relative flex items-center gap-4 rounded-2xl px-5 py-4 mb-5 text-white"
      style={{
        background: 'linear-gradient(135deg, #0FA89C 0%, #0b7a73 100%)',
        boxShadow: '0 8px 24px -6px rgba(15, 168, 156, 0.4)'
      }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/60 hover:text-white p-0.5 rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
        <Bell className="w-5 h-5 text-white" style={{ animation: 'bellRing 2.5s ease-in-out infinite' }} />
      </div>

      <div className="flex-1 min-w-0 pr-6">
        <p className="text-white font-bold text-sm leading-tight">
          🔔 Enable Owner Push Notifications
        </p>
        <p className="text-white/80 text-xs mt-0.5 leading-snug">
          Get instant alerts for new bookings, rent payments, chat messages &amp; inquiries on your <strong className="text-white">laptop &amp; phone</strong>.
        </p>
      </div>

      <button
        onClick={handleAllow}
        disabled={isLoading}
        className="shrink-0 bg-white text-[#0FA89C] font-bold text-xs px-4 py-2 rounded-xl hover:bg-white/90 transition-all flex items-center gap-1.5 disabled:opacity-70 shadow-sm cursor-pointer"
      >
        {isLoading ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Enabling...
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5" />
            Allow Now
          </>
        )}
      </button>

      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-15deg); }
          20%, 40% { transform: rotate(15deg); }
          50% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
