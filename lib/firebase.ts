import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "excellent-nation-pcf5x",
  appId: "1:555178685778:web:f113c6043762d7ccce368b",
  apiKey: "AIzaSyBKNt-k6hjGR-AIxYrVqNIFmsxoKehl8Ig",
  authDomain: "excellent-nation-pcf5x.firebaseapp.com",
  storageBucket: "excellent-nation-pcf5x.firebasestorage.app",
  messagingSenderId: "555178685778"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the custom databaseId from config
const db = initializeFirestore(app, {
  databaseId: "ai-studio-autonomousdatase-5ba253b1-5018-4fde-8819-1ac8cf13f608"
});

export { app, db };
