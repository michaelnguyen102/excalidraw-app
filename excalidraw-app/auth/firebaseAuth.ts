import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User,
} from "firebase/auth";
import { getFirebaseApp } from "../data/firebaseApp";

let auth: ReturnType<typeof getAuth> | null = null;
let persistenceSet = false;
export const getFirebaseAuth = () => {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (!persistenceSet) {
      persistenceSet = true;
      setPersistence(auth, browserLocalPersistence).catch((e) =>
        console.warn("auth persistence failed", e),
      );
    }
  }
  return auth;
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(getFirebaseAuth(), provider);
    return result.user;
  } catch (e: any) {
    const code = e?.code || "";
    if (
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      await signInWithRedirect(getFirebaseAuth(), provider);
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
