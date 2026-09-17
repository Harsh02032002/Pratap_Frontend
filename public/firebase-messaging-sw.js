// Firebase Cloud Messaging Service Worker for Roomhy Web Push Notifications
// Handles background push on: Laptop (Chrome/Edge/Firefox) & Mobile Phone (Android/iOS PWA)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDrwkLf124ghleUgPzU9zQyxcH_hmTEcNQ",
  authDomain: "roomhy-notification.firebaseapp.com",
  projectId: "roomhy-notification",
  storageBucket: "roomhy-notification.firebasestorage.app",
  messagingSenderId: "497326250606",
  appId: "1:497326250606:web:a69c87247ffc0f996ea47f",
  measurementId: "G-VL3SM150N2"
};

// Initialize Firebase App in Service Worker
let messaging = null;
try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
    if (!self.firebase?.apps?.length) {
      firebase.initializeApp(firebaseConfig);
    }
    messaging = firebase.messaging();
    console.log('[firebase-messaging-sw.js] ✅ Firebase initialized in Service Worker');
  }
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Firebase init failed:', err.message);
}

// ─────────────────────────────────────────────
// Background Message Handler (FCM via Firebase SDK)
// ─────────────────────────────────────────────
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background FCM push message:', payload);

    const notificationTitle =
      payload.notification?.title ||
      payload.data?.title ||
      'Roomhy Notification';

    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: payload.notification?.icon || payload.data?.icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.data?.tag || 'roomhy-notification',
      renotify: true,
      requireInteraction: false,
      data: {
        click_action: payload.data?.click_action || payload.notification?.click_action || '/',
        ...(payload.data || {})
      },
      actions: [
        { action: 'open', title: '🏠 Open Roomhy' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// ─────────────────────────────────────────────
// Native Web Push API Background Handler
// (Works when Firebase SDK is unavailable — e.g. on Firefox, or older Android)
// ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  // Skip if Firebase SDK already handled this (Firebase sets its own push handler)
  let payload = null;

  try {
    payload = event.data ? event.data.json() : null;
  } catch (_) {
    payload = event.data ? { notification: { title: 'Roomhy', body: event.data.text() } } : null;
  }

  if (!payload) return;

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    'Roomhy Notification';

  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.icon || payload.data?.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.data?.tag || 'roomhy-push',
    renotify: true,
    data: {
      click_action: payload.data?.click_action || '/',
      ...(payload.data || {})
    },
    actions: [
      { action: 'open', title: '🏠 Open Roomhy' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─────────────────────────────────────────────
// Notification Click Handler
// ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // 'dismiss' action — just close the notification
  if (event.action === 'dismiss') return;

  const clickUrl =
    (event.notification.data && event.notification.data.click_action)
      ? event.notification.data.click_action
      : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing tab if possible
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.navigate(clickUrl);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});

// ─────────────────────────────────────────────
// Service Worker Lifecycle
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing...');
  self.skipWaiting(); // Activate immediately without waiting for old SW to finish
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated — ready for push notifications!');
  event.waitUntil(clients.claim()); // Take control of all clients immediately
});
