// backend/utils/pushNotifier.js
// ---------------------------------------------------
// Firebase Admin SDK v14+ – FCM push notifications
// Uses the modular API: getMessaging() from firebase-admin/messaging
// ---------------------------------------------------

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging }                  = require('firebase-admin/messaging');
const path = require('path');
const fs   = require('fs');

// ── Resolve service-account file ────────────────────────────────────────────
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
let serviceAccount = null;

if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = require(serviceAccountPath);
  console.log('✅ Service account loaded from', serviceAccountPath);
} else {
  console.error('❌ firebase-service-account.json not found at', serviceAccountPath);
}

// ── Initialise Firebase Admin (once) ────────────────────────────────────────
let firebaseApp = null;

if (serviceAccount) {
  if (getApps().length === 0) {
    firebaseApp = initializeApp({ credential: cert(serviceAccount) });
    console.log('✅ Firebase Admin SDK initialized');
  } else {
    const { getApp } = require('firebase-admin/app');
    firebaseApp = getApp();
    console.log('✅ Firebase Admin SDK already initialized – reusing existing app');
  }
} else {
  console.warn('⚠️  Firebase Admin SDK NOT initialized – service-account file missing');
}

// ── Send push notification ───────────────────────────────────────────────────
/**
 * Send an FCM push notification to a single device token.
 * @param {string} fcmToken      Device FCM registration token.
 * @param {string} title         Notification title.
 * @param {string} body          Notification body.
 * @param {Object} dataPayload   Optional key/value data (all values become strings).
 * @returns {Promise<string>}    Message ID returned by FCM.
 */
async function sendPushNotification(fcmToken, title, body, dataPayload = {}) {
  if (!firebaseApp) {
    console.warn('⚠️ Cannot send push notification: Firebase Admin SDK is not initialized.');
    return;
  }
  if (!fcmToken) {
    console.warn('⚠️ Cannot send push notification: FCM token is missing.');
    return;
  }

  // FCM requires all data values to be strings
  const stringifiedData = {};
  for (const [key, val] of Object.entries(dataPayload)) {
    stringifiedData[key] = String(val);
  }

  const message = {
    notification: { title, body },
    data: stringifiedData,
    token: fcmToken,
  };

  try {
    // ✅ Correct API for firebase-admin v14+
    const response = await getMessaging(firebaseApp).send(message);
    console.log('✅ Push notification sent. MessageId:', response);
    return response;
  } catch (error) {
    console.error('❌ FCM send FAILED. Code:', error.code, '| Message:', error.message);
    throw error;
  }
}

module.exports = { sendPushNotification };