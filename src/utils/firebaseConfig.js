// Firebase configuration for Roomhy Web Push Notifications
// This config is used by Firebase Messaging SDK in the browser

export const firebaseConfig = {
  apiKey: "AIzaSyDrwkLf124ghleUgPzU9zQyxcH_hmTEcNQ",
  authDomain: "roomhy-notification.firebaseapp.com",
  projectId: "roomhy-notification",
  storageBucket: "roomhy-notification.firebasestorage.app",
  messagingSenderId: "497326250606",
  appId: "1:497326250606:web:a69c87247ffc0f996ea47f",
  measurementId: "G-VL3SM150N2"
};

// VAPID Public Key from Firebase Cloud Console
// (Project Settings → Cloud Messaging → Web Push certificates → Key pair)
// Replace this with the actual VAPID key from your Firebase project
export const VAPID_KEY = 'BLsEFQMQ8a6Clz-JS_tXhsotfH8-UlR2NF3Mj-a3pNcGJnfqai58cHqIzah-roBEHGYrvHieb4gQwt5TQ-2-Jo';
