// src/config/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getMessaging, MessagePayload, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBAdSPE1XNxhE9hCbuEpEidKlYMQnBKjuA",

  authDomain: "school-82ec4.firebaseapp.com",

  projectId: "school-82ec4",

  storageBucket: "school-82ec4.firebasestorage.app",

  messagingSenderId: "858714475571",

  appId: "1:858714475571:web:c12b76bc7bdba5b3f2e746",

  measurementId: "G-JJDJQ8XE72",
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
