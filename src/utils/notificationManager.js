// Notification Manager for Roomhy Web & Mobile Devices Push Notifications
// Supports: Laptop/Desktop (Chrome, Edge, Firefox) & Mobile Phone (Android Chrome, iOS PWA)
// Uses native Web Push API (VAPID) — no Firebase SDK required in frontend bundle
// API base URL — uses VITE_API_URL env var if set, else localhost:5001 in dev / production origin
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001'
    : typeof window !== 'undefined' ? 'https://api.roomhy.com' : '');

// ─────────────────────────────────────────────
// Device Detection
// ─────────────────────────────────────────────
/**
 * Detect Device Type (Laptop / Desktop vs Mobile / Tablet)
 */
export function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'mobile';
  }
  return 'laptop';
}

/**
 * Check if Web Push Notifications are supported on current browser
 */
export function isPushSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

// ─────────────────────────────────────────────
// Service Worker Registration
// ─────────────────────────────────────────────
/**
 * Register Firebase Messaging Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    await registration.update(); // Force SW update check
    console.log('[NotificationManager] ✅ ServiceWorker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.warn('[NotificationManager] ServiceWorker registration failed:', error.message);
    return null;
  }
}

// ─────────────────────────────────────────────
// Web Push Subscription (Native VAPID Push API)
// ─────────────────────────────────────────────

/**
 * Convert URL-safe Base64 string to Uint8Array (required for VAPID applicationServerKey)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * VAPID Public Key for Web Push Subscriptions.
 * Set VITE_VAPID_PUBLIC_KEY in your .env file.
 * Get it from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Public Key
 */
const VAPID_PUBLIC_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VAPID_PUBLIC_KEY) ||
  'BLsEFQMQ8a6Clz-JS_tXhsotfH8-UlR2NF3Mj-a3pNcGJnfqai58cHqIzah-roBEHGYrvHieb4gQwt5TQ-2-Jo';

// Validate the VAPID key looks like a real Base64url key (≥ 80 chars)
const isVapidKeyValid = VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY.length >= 80 && /^[A-Za-z0-9_-]+$/.test(VAPID_PUBLIC_KEY);

/**
 * Subscribe device using native Web Push API with VAPID authentication.
 * Returns a push subscription endpoint string (which serves as the device token).
 */
async function subscribeWebPush(swRegistration) {
  if (!swRegistration) return null;

  // Skip silently if VAPID key is not configured or invalid format
  if (!isVapidKeyValid) {
    console.info('[NotificationManager] Web Push skipped — VAPID_PUBLIC_KEY not configured. Set VITE_VAPID_PUBLIC_KEY in .env to enable.');
    return null;
  }

  try {
    // Check if already subscribed
    const existingSubscription = await swRegistration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('[NotificationManager] ✅ Existing Web Push subscription found.');
      return JSON.stringify(existingSubscription);
    }

    // Create new subscription
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('[NotificationManager] ✅ New Web Push subscription obtained!');
    return JSON.stringify(subscription);
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      console.warn('[NotificationManager] Push subscription blocked by browser permissions.');
    } else {
      // Log as info, not warn/error — this is a config issue not a runtime error
      console.info('[NotificationManager] Web Push subscription skipped:', err.message);
    }
    return null;
  }
}

// ─────────────────────────────────────────────
// Backend Token Registration
// ─────────────────────────────────────────────
/**
 * Send registered push subscription / FCM token to Roomhy Backend API
 */
export async function sendTokenToBackend(token, loginId = null) {
  if (!token) return;

  try {
    const deviceType = getDeviceType();
    let activeLoginId = loginId;
    let jwtToken = null;

    if (!activeLoginId) {
      try {
        const ownerSession = JSON.parse(
          localStorage.getItem('owner_session') ||
          sessionStorage.getItem('owner_session') ||
          '{}'
        );
        const userSession = JSON.parse(
          localStorage.getItem('roomhy_user') ||
          localStorage.getItem('website_user') ||
          localStorage.getItem('user') ||
          '{}'
        );
        const tenantSession = JSON.parse(
          localStorage.getItem('tenant_session') ||
          sessionStorage.getItem('tenant_session') ||
          '{}'
        );
        activeLoginId =
          ownerSession.loginId || ownerSession.ownerLoginId ||
          tenantSession.loginId ||
          userSession.loginId || userSession._id || userSession.phone;
        jwtToken =
          ownerSession.token || tenantSession.token || userSession.token ||
          localStorage.getItem('roomhy_jwt') || null;
      } catch (_) {}
    }

    if (!activeLoginId) {
      console.warn('[NotificationManager] No loginId available — token will not be saved to backend until user logs in.');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications/register-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {})
      },
      body: JSON.stringify({ token, deviceType, loginId: activeLoginId })
    });

    const data = await response.json();
    console.log('[NotificationManager] 📱 Token registration status:', data);
    return data;
  } catch (err) {
    console.error('[NotificationManager] Failed to send token to backend:', err);
  }
}

// ─────────────────────────────────────────────
// Show Native Browser & In-App Toast Notification
// ─────────────────────────────────────────────
/**
 * Show a visually guaranteed floating toast notification inside the app window
 * with Web Audio API chime sound.
 */
export function showInAppToast(title, body = '', options = {}) {
  if (typeof document === 'undefined') return;

  // 🔔 Play pleasant Web Audio API notification chime
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (_) {}

  let container = document.getElementById('roomhy-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'roomhy-toast-container';
    container.style.cssText = 'position:fixed;top:1.25rem;right:1.25rem;z-index:999999;display:flex;flex-direction:column;gap:0.75rem;max-width:380px;width:calc(100vw - 2.5rem);pointer-events:none;';
    document.body.appendChild(container);
  }

  const safeTitle = String(title).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const safeBody = String(body || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const toast = document.createElement('div');
  toast.style.cssText = 'pointer-events:auto;background:#ffffff;color:#0f172a;border:1px solid #e2e8f0;box-shadow:0 20px 35px -10px rgba(15,23,42,0.15), 0 0 0 1px rgba(15,23,42,0.05);border-radius:1rem;padding:1rem 1.25rem;display:flex;align-items:center;gap:0.875rem;transform:translateY(-20px) scale(0.95);opacity:0;transition:all 0.35s cubic-bezier(0.16,1,0.3,1);font-family:system-ui,-apple-system,sans-serif;';

  toast.innerHTML = `
    <div style="width:2.5rem;height:2.5rem;border-radius:0.75rem;background:linear-gradient(135deg,#0FA89C,#0C8B81);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(15,168,156,0.3);">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color:#ffffff;">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-weight:700;font-size:0.875rem;line-height:1.25rem;color:#0f172a;margin-bottom:0.125rem;">${safeTitle}</div>
      ${safeBody ? `<div style="font-size:0.75rem;line-height:1.125rem;color:#475569;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${safeBody}</div>` : ''}
    </div>
    <button style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:0.25rem;border-radius:0.375rem;display:flex;align-items:center;justify-content:center;transition:color 0.2s;" onmouseover="this.style.color='#0f172a'" onmouseout="this.style.color='#94a3b8'">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  const closeBtn = toast.querySelector('button');
  const dismiss = () => {
    toast.style.transform = 'translateY(-20px) scale(0.95)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  };

  closeBtn.addEventListener('click', dismiss);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0) scale(1)';
      toast.style.opacity = '1';
    });
  });

  setTimeout(dismiss, 5500);
}

/**
 * Show a native browser / OS system notification AND floating in-app popup.
 */
export async function showNativeNotification(title, options = {}) {
  // Always trigger visual in-app toast notification first so user ALWAYS sees popup on screen
  showInAppToast(title, options.body || '', options);

  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const notifOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    body: options.body || '',
    ...options
  };

  // Try ServiceWorker first with a 300ms timeout race so desktop doesn't hang
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const swPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SW timeout')), 300));
      const reg = await Promise.race([swPromise, timeoutPromise]);
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return;
      }
    }
  } catch (_) { /* fallthrough to Notification constructor */ }

  // Direct Browser Desktop Notification fallback
  try {
    const n = new Notification(title, notifOptions);
    n.onclick = () => {
      window.focus();
      if (options.url) window.location.href = options.url;
    };
  } catch (err) {
    console.warn('[NotificationManager] Direct notification error:', err.message);
  }
}

// ─────────────────────────────────────────────
// Main API: Request Permission & Register Token
// ─────────────────────────────────────────────
/**
 * Request Push Notification Permission from User on any device (Laptop, Phone).
 * This triggers the native browser "Allow / Block" dialog.
 * Must be called in direct response to a user gesture (button click) for browsers to honor it.
 */
export async function requestNotificationPermission(loginId = null, autoPrompt = false) {
  if (!isPushSupported()) {
    console.warn('[NotificationManager] Push notifications are not supported on this browser.');
    return { status: 'unsupported' };
  }

  // If user previously dismissed auto-prompt in this session, don't nag repeatedly
  if (autoPrompt && sessionStorage.getItem('roomhy_notif_prompt_dismissed')) {
    return { status: 'dismissed' };
  }

  // If permission already denied and this is auto-prompt, skip silently
  if (Notification.permission === 'denied' && autoPrompt) {
    return { status: 'denied' };
  }

  // If already granted, silently register token
  if (Notification.permission === 'granted') {
    await _registerDeviceToken(loginId);
    return { status: 'granted' };
  }

  // 🔔 Show native browser permission dialog
  // NOTE: Browsers require this to be called directly from a user-initiated event
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[NotificationManager] ✅ Notification permission GRANTED!');
      await _registerDeviceToken(loginId);
      return { status: 'granted' };
    } else {
      console.log('[NotificationManager] Notification permission DENIED or dismissed.');
      sessionStorage.setItem('roomhy_notif_prompt_dismissed', 'true');
      return { status: 'denied' };
    }
  } catch (error) {
    console.error('[NotificationManager] Error requesting notification permission:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Internal: register ServiceWorker, get Web Push subscription, send token to backend
 */
async function _registerDeviceToken(loginId = null) {
  try {
    const swReg = await registerServiceWorker();
    const token = await subscribeWebPush(swReg);

    if (token) {
      localStorage.setItem('roomhy_fcm_token', token);
      await sendTokenToBackend(token, loginId);
    }
  } catch (e) {
    console.warn('[NotificationManager] Device token registration info:', e);
  }
  return { status: 'granted' };
}

// ─────────────────────────────────────────────
// App Startup Init (silent token sync)
// ─────────────────────────────────────────────
/**
 * Initialize notification listener on app startup.
 * Silently syncs push subscription with backend if user already granted permission.
 */
// Both owner layouts call this on mount, and each page mounts its own layout,
// so without a guard the token was re-registered (a backend write) twice per
// navigation. A device token does not change between pages — sync it once per
// loginId per app load. A failed sync is forgotten so the next mount retries.
const _initDone = new Map();

export async function initNotificationManager(loginId = null) {
  if (!isPushSupported()) return;

  if (Notification.permission === 'granted') {
    const key = loginId || '__anon__';
    if (_initDone.has(key)) return _initDone.get(key);
    console.log('[NotificationManager] Permission already granted — syncing push token on startup...');
    const p = Promise.resolve(_registerDeviceToken(loginId)).catch((e) => {
      _initDone.delete(key);
      throw e;
    });
    _initDone.set(key, p);
    await p;
  }
}
