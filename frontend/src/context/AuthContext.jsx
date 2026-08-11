import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { requestFcmToken, onMessageListener } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('nc_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to request notification permission & sync FCM token to backend
  async function syncPushToken(authToken) {
    try {
      const fcmToken = await requestFcmToken();

      if (fcmToken) {
        console.log(
          '📤 Syncing FCM token to backend:',
          fcmToken.substring(0, 20) + '...'
        );

        const result = await api.updateProfile(
          { fcmToken },
          authToken
        );

        console.log(
          '✅ FCM token saved to backend successfully. User fcmToken:',
          result?.user?.fcmToken?.substring(0, 20) + '...'
        );
      } else {
        console.warn(
          '⚠️ No FCM token returned — permission may be denied or VAPID key mismatch.'
        );
      }
    } catch (err) {
      console.error(
        '❌ Could not sync FCM push token:',
        err
      );
    }
  }

  // Handle foreground notifications when app is active
  useEffect(() => {
    const unsubscribe = onMessageListener((payload) => {
      console.log(
        '🔔 Received foreground push notification:',
        payload
      );

      const title =
        payload?.notification?.title ||
        payload?.data?.title ||
        'NeighborCare Notification';

      const body =
        payload?.notification?.body ||
        payload?.data?.body ||
        'You have a new update.';

      const options = {
        body: body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'neighborcare-notification',
        requireInteraction: false,
      };

      console.log(
        '🔔 Trying to display:',
        title,
        body
      );

      if (Notification.permission !== 'granted') {
        console.warn(
          '⚠️ Notification permission is:',
          Notification.permission
        );
        return;
      }

      if (!('serviceWorker' in navigator)) {
        console.error(
          '❌ Service Worker is not supported.'
        );
        return;
      }

      navigator.serviceWorker.ready
        .then((registration) => {
          console.log(
            '✅ Service Worker ready:',
            registration
          );

          return registration.showNotification(
            title,
            options
          );
        })
        .then(() => {
          console.log(
            '✅ Browser notification displayed successfully'
          );
        })
        .catch((error) => {
          console.error(
            '❌ Could not display notification:',
            error
          );
        });
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Restore user session
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .me(token)
      .then(({ user }) => {
        setUser(user);

        // Sync FCM token whenever user session is restored
        syncPushToken(token);
      })
      .catch(() => {
        localStorage.removeItem('nc_token');
        setToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Login
  function login(newToken, newUser) {
    localStorage.setItem('nc_token', newToken);
    setToken(newToken);
    setUser(newUser);

    // Sync FCM token immediately upon successful login
    syncPushToken(newToken);
  }

  // Logout
  function logout() {
    localStorage.removeItem('nc_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}