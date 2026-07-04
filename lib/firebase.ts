import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json" assert { type: "json" };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the database ID from the config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
