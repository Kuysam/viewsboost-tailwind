// src/lib/firestoreTemplates.ts
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "./firebase"; // adjust import if needed

const db = getFirestore(app);

export async function fetchTemplates() {
  const snap = await getDocs(collection(db, "templates"));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
