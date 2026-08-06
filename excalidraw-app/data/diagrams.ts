
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import { clearAppStateForLocalStorage } from "@excalidraw/excalidraw/appState";

import { getFirebaseApp } from "./firebaseApp";
let db: ReturnType<typeof getFirestore> | null = null;
const getDb = () => {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
};

export type DiagramDoc = {
  id: string;
  ownerId: string;
  name: string;
  elements: string; // JSON stringified
  appState: string; // JSON stringified (cleared)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

const COLLECTION = "diagrams";

export const createDiagram = async (ownerId: string, name: string) => {
  const db = getDb();
  const ref = doc(collection(db, COLLECTION));
  const now = new Date().toISOString();
  const payload: DiagramDoc = {
    id: ref.id,
    ownerId,
    name: name || "Untitled",
    elements: JSON.stringify([]),
    appState: JSON.stringify({}),
    createdAt: serverTimestamp() as unknown as Timestamp,
    updatedAt: serverTimestamp() as unknown as Timestamp,
  };
  await setDoc(ref, payload);
  return ref.id;
};

export const getDiagram = async (id: string): Promise<DiagramDoc | null> => {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return snap.data() as DiagramDoc;
};

export const listDiagrams = async (ownerId: string): Promise<DiagramDoc[]> => {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where("ownerId", "==", ownerId),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as DiagramDoc);
};

export const updateDiagram = async (
  id: string,
  data: { name?: string; elements?: readonly ExcalidrawElement[]; appState?: Partial<AppState>; files?: BinaryFiles }
) => {
  const db = getDb();
  const payload: Record<string, any> = { updatedAt: serverTimestamp() };
  if (data.name !== undefined) payload.name = data.name;
  if (data.elements !== undefined) payload.elements = JSON.stringify(data.elements);
  if (data.appState !== undefined) {
    try {
      const cleared = clearAppStateForLocalStorage(data.appState as AppState);
      payload.appState = JSON.stringify(cleared);
    } catch {
      payload.appState = JSON.stringify(data.appState);
    }
  }
  await updateDoc(doc(db, COLLECTION, id), payload);
};

export const renameDiagram = async (id: string, name: string) => {
  await updateDoc(doc(getDb(), COLLECTION, id), { name, updatedAt: serverTimestamp() });
};

export const deleteDiagram = async (id: string) => {
  await deleteDoc(doc(getDb(), COLLECTION, id));
};

// helpers for serialization
export const parseElements = (doc: DiagramDoc): readonly ExcalidrawElement[] => {
  try {
    return JSON.parse(doc.elements || "[]");
  } catch {
    return [];
  }
};
export const parseAppState = (doc: DiagramDoc): Partial<AppState> => {
  try {
    return JSON.parse(doc.appState || "{}");
  } catch {
    return {};
  }
};
