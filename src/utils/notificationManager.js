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
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
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
 * 
 * ⚠️  ACTION REQUIRED:
 * Replace this with your real VAPID public key from Firebase Console:
 * Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Key pair (copy the Public Key)
 * 
 * OR generate a new VAPID key pair at: https://vapidkeys.com/
 */
const VAPID_PUBLIC_KEY = 'BLsEFQMQ8a6Clz-JS_tXhsotfH8-UlR2NF3Mj-a3pNcGJnfqai58cHqIzah-roBEHGYrvHieb4gQwt5TQ-2-Jo';

/**
 * Subscribe device using native Web Push API with VAPID authentication.
 * Returns a push subscription endpoint string (which serves as the device token).
 */
async function subscribeWebPush(swRegistration) {
  if (!swRegistration) return null;

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
      console.warn('[NotificationManager] Web Push subscription failed:', err.message);
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
    if (!activeLoginId) {
      try {
        const ownerSession = JSON.parse(localStorage.getItem('owner_session') || sessionStorage.getItem('owner_session') || '{}');
        const userSession = JSON.parse(localStorage.getItem('roomhy_user') || localStorage.getItem('website_user') || localStorage.getItem('user') || '{}');
        activeLoginId = ownerSession.loginId || ownerSession.ownerLoginId || userSession.loginId || userSession._id || userSession.phone;
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
        'Authorization': tokenData.token ? `Bearer ${tokenData.token}` : ''
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
// Show Native Browser Notification (Laptop & Mobile)
// ─────────────────────────────────────────────
/**
 * Show a native browser / OS system notification.
 * Uses ServiceWorker showNotification (required for Android/iOS PWA background)
 * with fallback to the Notification constructor (foreground desktop).
 */
export async function showNativeNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const notifOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    ...options
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return;
      }
    }
  } catch (_) { /* fallthrough to Notification constructor */ }

  try {
    new Notification(title, notifOptions);
  } catch (err) {
    console.warn('[NotificationManager] Notification display failed:', err.message);
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
    return await _registerDeviceToken(loginId);
  }

  // 🔔 Show native browser permission dialog
  // NOTE: Browsers require this to be called directly from a user-initiated event
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[NotificationManager] ✅ Notification permission GRANTED!');
      return await _registerDeviceToken(loginId);
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
  const swReg = await registerServiceWorker();
  const token = await subscribeWebPush(swReg);

  if (token) {
    localStorage.setItem('roomhy_fcm_token', token);
    await sendTokenToBackend(token, loginId);
  } else {
    console.warn('[NotificationManager] ⚠️ Could not obtain push token. Check VAPID_PUBLIC_KEY in notificationManager.js.');
  }

  return { status: 'granted', token };
}

// ─────────────────────────────────────────────
// App Startup Init (silent token sync)
// ─────────────────────────────────────────────
/**
 * Initialize notification listener on app startup.
 * Silently syncs push subscription with backend if user already granted permission.
 */
export async function initNotificationManager(loginId = null) {
  if (!isPushSupported()) return;

  if (Notification.permission === 'granted') {
    console.log('[NotificationManager] Permission already granted — syncing push token on startup...');
    await _registerDeviceToken(loginId);
  }
}
