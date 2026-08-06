import { initializeApp, getApps, getApp } from "firebase/app";

export let FIREBASE_CONFIG: Record<string, any>;
try {
  FIREBASE_CONFIG = JSON.parse(import.meta.env.VITE_APP_FIREBASE_CONFIG);
} catch {
  FIREBASE_CONFIG = {};
}

export const getFirebaseApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(FIREBASE_CONFIG);
};
