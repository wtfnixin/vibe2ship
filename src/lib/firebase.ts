import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

let rawBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
if (rawBucket.startsWith("gs://")) {
  rawBucket = rawBucket.replace("gs://", "");
}
if (rawBucket.endsWith("/")) {
  rawBucket = rawBucket.slice(0, -1);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: rawBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if configuration is set, otherwise use mock config to prevent build time crashes
const isConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "your_firebase_api_key" && 
  firebaseConfig.apiKey !== "";

const activeConfig = isConfigured 
  ? firebaseConfig 
  : {
      apiKey: "AIzaSyMockKeyForBuildCompilationOnly",
      authDomain: "civicpulse-mock.firebaseapp.com",
      projectId: "civicpulse-mock",
      storageBucket: "civicpulse-mock.appspot.com",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:0000000000000000000000"
    };

const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
