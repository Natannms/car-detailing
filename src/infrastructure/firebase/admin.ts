import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

/** Service account JSON (project_id, client_email, private_key). Usado no .env para evitar arquivo JSON (ex.: Vercel). */
type ServiceAccountJson = { project_id?: string; client_email?: string; private_key?: string };

function parseServiceAccountToCredential(serviceAccount: ServiceAccountJson) {
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) return null;
  return cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
  });
}

/** GOOGLE_SERVICE_ACCOUNT como JSON em uma linha (ex.: Vercel – colar o JSON inteiro na variável). */
function getCredentialFromEnv() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw || !raw.trim().startsWith("{")) return null;
  try {
    const parsed = JSON.parse(raw.trim()) as ServiceAccountJson;
    return parseServiceAccountToCredential(parsed);
  } catch {
    return null;
  }
}

/** GOOGLE_SERVICE_ACCOUNT multi-linha no .env local (Next não coloca multi-line em process.env). */
function getCredentialFromDotEnvFile() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, "utf8");
    const lines = content.split(/\r?\n/);
    const startIndex = lines.findIndex(l => l.startsWith("GOOGLE_SERVICE_ACCOUNT="));
    if (startIndex === -1) return null;
    const first = lines[startIndex]!.slice("GOOGLE_SERVICE_ACCOUNT=".length).trim();
    if (!first.startsWith("{")) return null;

    let jsonText = first;
    let i = startIndex + 1;
    while (i < lines.length && !jsonText.trim().endsWith("}")) {
      jsonText += `\n${lines[i] ?? ""}`;
      i += 1;
    }

    const parsed = JSON.parse(jsonText) as ServiceAccountJson;
    return parseServiceAccountToCredential(parsed);
  } catch {
    return null;
  }
}

function getFirebaseApp() {
  const apps = getApps();
  if (apps.length) return apps[0]!;

  const credential = getCredentialFromEnv() ?? getCredentialFromDotEnvFile();
  if (!credential) {
    throw new Error(
      "Firebase Admin não configurado. Defina GOOGLE_SERVICE_ACCOUNT no .env com o JSON do service account (multi-linha local ou uma linha no Vercel).",
    );
  }

  return initializeApp({
    credential,
  });
}

export function firestore() {
  const app = getFirebaseApp();
  return getFirestore(app);
}

export function auth() {
  const app = getFirebaseApp();
  return getAuth(app);
}
