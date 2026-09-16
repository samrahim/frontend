// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
} from "firebase/auth";

// Replace these values with your project's configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAdSPE1XNxhE9hCbuEpEidKlYMQnBKjuA",

  authDomain: "school-82ec4.firebaseapp.com",

  projectId: "school-82ec4",

  storageBucket: "school-82ec4.firebasestorage.app",

  messagingSenderId: "858714475571",

  appId: "1:858714475571:web:c12b76bc7bdba5b3f2e746",

  measurementId: "G-JJDJQ8XE72",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connect to Auth Emulator if running in local development
if (import.meta.env.DEV || import.meta.env.VITE_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}
