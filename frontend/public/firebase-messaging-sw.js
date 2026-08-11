importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBYJhRe5cfkntYd-baX8wqn24_7LOOqgJE",
  authDomain: "triton-senior-assist.firebaseapp.com",
  projectId: "triton-senior-assist",
  storageBucket: "triton-senior-assist.firebasestorage.app",
  messagingSenderId: "58982977379",
  appId: "1:58982977379:web:f9e0cc39f69083f7cecd56"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "🔥 [SW] Background message received:",
    payload
  );

  const title =
    payload?.notification?.title ||
    payload?.data?.title ||
    "NeighborCare";

  const body =
    payload?.notification?.body ||
    payload?.data?.body ||
    "You have a new notification.";

  const notificationOptions = {
    body: body,
    icon: "/logo.png",
    badge: "/logo.png",
    tag: "neighborcare-notification",
    requireInteraction: false
  };

  self.registration.showNotification(
    title,
    notificationOptions
  );
}); 