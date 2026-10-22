// src/config/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getMessaging, MessagePayload, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

if (typeof window !== "undefined") {
  const host = window.location.hostname;
  const authWithEmulator = auth as any;

  if (!authWithEmulator._isEmulator && !authWithEmulator.emulatorConfig) {
    const emulatorHost = `http://${host}:9099`;

    connectAuthEmulator(auth, emulatorHost, { disableWarnings: true });

    auth.settings.appVerificationDisabledForTesting = true;

    console.log(`Connected Auth Emulator to: ${emulatorHost}`);
  }
}
export const getFirebaseMessaging = () => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    return getMessaging(app);
  }
  return null;
};

export const onForegroundMessage = (
  callback: (payload: MessagePayload) => void
) => {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};
