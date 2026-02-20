"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence, type Auth } from "firebase/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
  (projectId ? `${projectId}.firebaseapp.com` : undefined);

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
};

function getFirebaseApp(): FirebaseApp | null {
  if (!apiKey || !projectId) return null;
  if (getApps().length) return getApp();
  return initializeApp(firebaseConfig);
}

let persistenceSet = false;

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  const auth = getAuth(app);
  if (!persistenceSet) {
    persistenceSet = true;
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  }
  return auth;
}
