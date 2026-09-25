import React, { useState, useEffect } from 'react';
import { Bell, X, Check, BellOff, ShieldAlert } from 'lucide-react';
import { isPushSupported, requestNotificationPermission, showNativeNotification } from '../utils/notificationManager';

/**
 * AdminNotificationPrompt
 * Displayed on Superadmin & Employee panels.
 * 1. Default -> Prompts user to click "Allow Notifications".
 * 2. Granted -> Displays active banner with "Test Notification Popup".
 * 3. Denied  -> Displays instructions on how to unblock via browser 🔒 lock icon.
 */
export default function AdminNotificationPrompt({ loginId = null }) {
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

    const dismissed = sessionStorage.getItem('roomhy_admin_notif_dismissed');
    if (dismissed) setIsDismissed(true);
  }, []);

  const handleAllow = async () => {
    setIsLoading(true);
    const result = await requestNotificationPermission(loginId || 'superadmin');
    setIsLoading(false);

    if (result.status === 'granted') {
      setPermissionState('granted');
      showNativeNotification("🔔 Push Notifications Activated!", {
        body: "You will now receive instant desktop & mobile push alerts for support tickets."
      });
    } else if (result.status === 'denied') {
      setPermissionState('denied');
    }
  };

  const handleTestAlert = () => {
    showNativeNotification("🔔 Roomhy Live Push Alert Test", {
      body: "Push alerts are working perfectly on Superadmin panel!"
    });
  };

  const handleDismiss = () => {
    sessionStorage.setItem('roomhy_admin_notif_dismissed', 'true');
    setIsDismissed(true);
  };

  if (permissionState === null || permissionState === 'unsupported') return null;
  if (isDismissed) return null;

  // Denied State -> Amber step-by-step unblock instructions
  if (permissionState === 'denied') {
    return (
      <div className="flex items-start md:items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 mb-6 shadow-sm animate-in fade-in duration-200">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 md:mt-0" />
        <p className="text-xs text-amber-900 flex-1 leading-relaxed">
          <strong className="font-bold">Notifications Blocked:</strong> Click the <strong className="bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-950">🔒 lock icon</strong> in your browser address bar → set Notifications to <strong className="text-emerald-700">Allow</strong> → then refresh this page to get instant push alerts.
        </p>
        <button onClick={handleDismiss} className="text-amber-400 hover:text-amber-700 p-1 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Granted State -> Emerald Active Banner with Test Button
  if (permissionState === 'granted') {
    return (
      <div
        className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl px-6 py-4 mb-6 text-emerald-950 bg-emerald-50 border border-emerald-200 shadow-sm transition-all animate-in fade-in duration-300"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 text-emerald-500 hover:text-emerald-800 p-1 rounded-full hover:bg-emerald-100 transition-colors"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
          <Bell className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <p className="font-extrabold text-sm text-emerald-900 tracking-wide leading-tight flex items-center gap-2">
            <span>🔔 Push Notifications Enabled</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </p>
          <p className="text-emerald-700 text-xs mt-0.5 leading-relaxed">
            Superadmin push alerts are active for live support complaints &amp; system updates.
          </p>
        </div>

        <button
          onClick={handleTestAlert}
          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Test Notification Popup</span>
        </button>
      </div>
    );
  }

  // Default State -> Blue/Indigo Gradient Prompt Banner
  return (
    <div
      className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl px-6 py-4.5 mb-6 text-white shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300"
      style={{
        background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)'
      }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3.5 right-3.5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        title="Dismiss for this session"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
        <Bell className="w-6 h-6 text-white" style={{ animation: 'adminBellRing 2.5s ease-in-out infinite' }} />
      </div>

      <div className="flex-1 min-w-0 pr-6">
        <p className="text-white font-extrabold text-sm tracking-wide leading-tight">
          🔔 Enable Push Notifications
        </p>
        <p className="text-blue-100 text-xs mt-1 leading-relaxed">
          Get instant desktop &amp; phone alerts for new support complaints, ticket updates, and admin assignments.
        </p>
      </div>

      <button
        onClick={handleAllow}
        disabled={isLoading}
        className="shrink-0 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-70 shadow-md active:scale-95 cursor-pointer border border-white/50"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin text-blue-700" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Enabling...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span>Allow Notifications</span>
          </>
        )}
      </button>

      <style>{`
        @keyframes adminBellRing {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-15deg); }
          20%, 40% { transform: rotate(15deg); }
          50% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
