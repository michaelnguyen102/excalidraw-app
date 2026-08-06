import { initializeApp, getApps, getApp } from "firebase/app";

export let FIREBASE_CONFIG: Record<string, any>;
try {
  FIREBASE_CONFIG = JSON.parse(import.meta.env.VITE_APP_FIREBASE_CONFIG);
} catch {
  FIREBASE_CONFIG = {};
}
if (!FIREBASE_CONFIG?.apiKey) {
  console.warn("[firebaseApp] VITE_APP_FIREBASE_CONFIG missing apiKey - auth will not work. Check Vercel env vars.");
}

export const getFirebaseApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }
  if (!FIREBASE_CONFIG?.apiKey) {
    console.error("[firebaseApp] initializeApp called with empty config", FIREBASE_CONFIG);
  }
  return initializeApp(FIREBASE_CONFIG);
};
