import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

let FIREBASE_CONFIG: Record<string, any>;
try {
  FIREBASE_CONFIG = JSON.parse(import.meta.env.VITE_APP_FIREBASE_CONFIG);
} catch {
  FIREBASE_CONFIG = {};
}

let firebaseApp: ReturnType<typeof initializeApp> | null = null;
const getFirebaseApp = () => {
  if (!firebaseApp) {
    firebaseApp = initializeApp(FIREBASE_CONFIG);
  }
  return firebaseApp;
};

let auth: ReturnType<typeof getAuth> | null = null;
export const getFirebaseAuth = () => {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  // Ensure prompt select account
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(getFirebaseAuth(), provider);
    return result.user;
  } catch (e: any) {
    const code = e?.code || "";
    if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      // Fallback to redirect - will reload page
      await signInWithRedirect(getFirebaseAuth(), provider);
      // This line never returns because redirect happens
      return null as unknown as User;
    }
    throw e;
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(getFirebaseAuth());
    return result?.user ?? null;
  } catch (e) {
    console.warn("redirect result error", e);
    return null;
  }
};

export const signOut = async () => {
  await firebaseSignOut(getFirebaseAuth());
};

export const subscribeAuth = (cb: (user: User | null) => void) => {
  return onAuthStateChanged(getFirebaseAuth(), cb);
};

export type { User };
