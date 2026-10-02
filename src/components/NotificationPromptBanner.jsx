import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, X, Check, Laptop, Smartphone, Settings, ShieldAlert } from 'lucide-react';
import { isPushSupported, requestNotificationPermission, showNativeNotification } from '../utils/notificationManager';
import { useLocation } from 'react-router-dom';

/**
 * NotificationPromptBanner
 * Independent Floating Bottom-Right Notification Activation Card for Each Panel:
 * 1. SuperAdmin / Employee Panel -> "Enable SuperAdmin Alerts"
 * 2. Property Owner Panel -> "Enable Owner Alerts"
 * 3. Tenant Panel -> "Enable Tenant Alerts"
 * 4. Main Website -> "Enable Roomhy Alerts"
 *
 * Each panel tracks its own independent activation state in localStorage/sessionStorage.
 */
export default function NotificationPromptBanner({ userLoginId = null }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const location = useLocation();

  const getPanelConfig = (pathname = '') => {
    if (pathname.startsWith('/superadmin') || pathname.startsWith('/employee')) {
      return {
        key: 'roomhy_notif_panel_admin',
        title: "Enable SuperAdmin Alerts",
        description: "Get real-time push alerts on your laptop & phone for new support complaints, ticket assignments & platform updates.",
        badge: "Admin Push",
        color: "from-blue-600 via-indigo-600 to-violet-600",
        btnColor: "linear-gradient(135deg, #2563EB, #4F46E5)",
        btnShadow: "rgba(37, 99, 235, 0.4)",
        iconBg: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
        iconBorder: "rgba(37, 99, 235, 0.2)",
        iconColor: "#2563EB"
      };
    }
    if (pathname.startsWith('/propertyowner')) {
      return {
        key: 'roomhy_notif_panel_owner',
        title: "Enable Owner Alerts",
        description: "Get instant push alerts for new bookings, rent collections, bidding offers & tenant chat messages.",
        badge: "Owner Push",
        color: "from-teal-600 via-emerald-600 to-cyan-600",
        btnColor: "linear-gradient(135deg, #0FA89C, #0C8B81)",
        btnShadow: "rgba(15, 168, 156, 0.4)",
        iconBg: "linear-gradient(135deg, #F0FAFA 0%, #E0F7F6 100%)",
        iconBorder: "rgba(15, 168, 156, 0.2)",
        iconColor: "#0FA89C"
      };
    }
    if (pathname.startsWith('/tenant')) {
      return {
        key: 'roomhy_notif_panel_tenant',
        title: "Enable Tenant Alerts",
        description: "Get instant push alerts for rent receipts, gate passes, maintenance updates & owner messages.",
        badge: "Tenant Push",
        color: "from-emerald-600 via-teal-600 to-indigo-600",
        btnColor: "linear-gradient(135deg, #10B981, #059669)",
        btnShadow: "rgba(16, 185, 129, 0.4)",
        iconBg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
        iconBorder: "rgba(16, 185, 129, 0.2)",
        iconColor: "#10B981"
      };
    }
    return {
      key: 'roomhy_notif_panel_website',
      title: "Enable Roomhy Alerts",
      description: "Get real-time updates for top PGs, hostels, co-living spaces & smart bidding price drops.",
      badge: "Roomhy Push",
      color: "from-teal-600 via-sky-600 to-indigo-600",
      btnColor: "linear-gradient(135deg, #0FA89C, #0C8B81)",
      btnShadow: "rgba(15, 168, 156, 0.4)",
      iconBg: "linear-gradient(135deg, #F0FAFA 0%, #E0F7F6 100%)",
      iconBorder: "rgba(15, 168, 156, 0.2)",
      iconColor: "#0FA89C"
    };
  };

  const panel = getPanelConfig(location.pathname);

  useEffect(() => {
    if (!isPushSupported()) return;

    const currentPermission = Notification.permission;
    setPermissionStatus(currentPermission);
    setIsDenied(currentPermission === 'denied');

    // Check if this specific panel was already activated or dismissed for this session
    const isPanelActive = localStorage.getItem(`${panel.key}_active`) === 'true';
    const isPanelDismissed = sessionStorage.getItem(`${panel.key}_dismissed`) === 'true';

    if (!isPanelActive && !isPanelDismissed) {
      setShowPrompt(false);
      setIsAnimatingIn(false);

      const timer = setTimeout(() => {
        setShowPrompt(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsAnimatingIn(true));
        });
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setShowPrompt(false);
    }
  }, [location.pathname]);

  const handleAllow = async () => {
    setIsSubmitting(true);
    const result = await requestNotificationPermission(userLoginId);
    setIsSubmitting(false);

    if (result.status === 'granted') {
      setPermissionStatus('granted');
      localStorage.setItem(`${panel.key}_active`, 'true');
      setIsAnimatingIn(false);

      // Trigger instant push alert notification to confirm
      showNativeNotification(`🔔 ${panel.title} Activated!`, {
        body: `Instant notifications are now live for ${panel.badge}.`
      });

      setTimeout(() => setShowPrompt(false), 350);
    } else if (result.status === 'denied') {
      setPermissionStatus('denied');
      setIsDenied(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(`${panel.key}_dismissed`, 'true');
    setIsAnimatingIn(false);
    setTimeout(() => setShowPrompt(false), 350);
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Mobile subtle backdrop */}
      <div
        className="fixed inset-0 bg-black/10 z-[9998] md:hidden pointer-events-none"
        style={{
          opacity: isAnimatingIn ? 1 : 0,
          transition: 'opacity 0.35s ease'
        }}
      />

      {/* Floating Card: Floating above MobileBottomNav on mobile (bottom-20), bottom-5 on desktop */}
      <div
        className="fixed z-[9999] bottom-20 md:bottom-5 right-3 left-3 md:right-5 md:left-auto md:max-w-[420px]"
        style={{
          maxWidth: 'min(calc(100vw - 1.5rem), 420px)',
          transform: isAnimatingIn ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
          opacity: isAnimatingIn ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease',
          pointerEvents: isAnimatingIn ? 'auto' : 'none'
        }}
      >
        <div
          className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100"
          style={{
            boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08)'
          }}
        >
          {/* Top accent gradient bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${panel.color}`} />

          <div className="p-5">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Dismiss for this session"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header row */}
            <div className="flex items-start gap-3.5">
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background: panel.iconBg,
                  border: `1px solid ${panel.iconBorder}`
                }}
              >
                <Bell className="w-5 h-5" style={{ color: panel.iconColor, animation: 'bellRing 2.5s ease-in-out infinite' }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pr-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                    {panel.title}
                  </h4>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(37,99,235,0.1)', color: panel.iconColor }}
                  >
                    {panel.badge}
                  </span>
                </div>

                <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                  {panel.description}
                </p>

                {/* Device support badges */}
                <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Laptop className="w-3.5 h-3.5" style={{ color: panel.iconColor }} /> Laptop
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Smartphone className="w-3.5 h-3.5" style={{ color: panel.iconColor }} /> Phone
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
                className="flex-1 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-75 active:scale-95 cursor-pointer"
                style={{
                  background: panel.btnColor,
                  boxShadow: `0 4px 14px -2px ${panel.btnShadow}`
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
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Allow Notifications</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs py-2.5 px-3 rounded-xl transition-all whitespace-nowrap cursor-pointer"
              >
                Maybe Later
              </button>
            </div>

            {/* Help hint for blocked users */}
            {isDenied && (
              <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5 leading-tight">
                <Settings className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>Notifications Blocked: Click 🔒 lock icon in URL bar → Notifications → set to Allow.</span>
              </p>
            )}
          </div>
        </div>
      </div>

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
