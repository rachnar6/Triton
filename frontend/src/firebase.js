// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration (copy from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyBYJhRe5cfkntYd-baX8wqn24_7LOOqgJE",
  authDomain: "triton-senior-assist.firebaseapp.com",
  projectId: "triton-senior-assist",
  storageBucket: "triton-senior-assist.firebasestorage.app",
  messagingSenderId: "58982977379",
  appId: "1:58982977379:web:f9e0cc39f69083f7cecd56",
  measurementId: "G-VF4WSB2W9X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const messaging = getMessaging(app);

// Request FCM Token using your generated VAPID Key
export const requestFcmToken = async () => {
  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('Notifications or Service Workers are not supported in this browser environment.');
      return null;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const token = await getToken(messaging, {
        vapidKey: 'BEPnYnMH0-nlkymhhsjjtpnOpBeI9llxyCw4ZfVzRBOheK9Fwn9y5zZ7wNH4m5gKukzG8sJHd6ptfz_DE8o4jRE',
        serviceWorkerRegistration: registration
      });
      console.log('✅ FCM Token successfully acquired:', token);
      return token;
    } else {
      console.warn('Notification permission was not granted:', permission);
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
  }
  return null;
};

// Listen for messages while app is in foreground
export const onMessageListener = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log('Foreground notification received:', payload);
    if (callback) callback(payload);
  });
};