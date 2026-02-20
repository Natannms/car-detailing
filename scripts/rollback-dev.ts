/**
 * Rollback do seed de desenvolvimento: remove apenas a organização ORG_ID_DEV.
 *
 * Uso: npm run firebase:rollback:dev
 *
 * Requer ORG_ID_DEV no .env.
 * Remove: usuários Firebase Auth da org, Firestore (users, doctors, organizationBilling, units, organizations, inviteTokens).
 * Não remove: planos nem outras organizações.
 */

import fs from "fs";
import path from "path";
import { auth, firestore } from "../src/infrastructure/firebase/admin";

function loadEnvVars(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env");
  const out: Record<string, string> = { ...process.env } as Record<string, string>;
  if (!fs.existsSync(envPath)) return out;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

async function deleteByOrganization(db: ReturnType<typeof firestore>, collectionName: string, organizationId: string): Promise<number> {
  let total = 0;
  const col = db.collection(collectionName);
  while (true) {
    const snap = await col.where("organizationId", "==", organizationId).limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    total += snap.size;
  }
  return total;
}

async function main() {
  const env = loadEnvVars();
  const orgId = env.ORG_ID_DEV?.trim();
  if (!orgId) {
    throw new Error("Defina ORG_ID_DEV no .env para executar o rollback.");
  }

  const db = firestore();
  const a = auth();

  console.info("Rollback dev: removendo organização", orgId, "\n");

  const usersSnap = await db.collection("users").where("organizationId", "==", orgId).get();
  const uids: string[] = [];
  for (const doc of usersSnap.docs) {
    const data = doc.data() as { firebaseUid?: string | null };
    if (data.firebaseUid) uids.push(data.firebaseUid);
  }

  console.info("Removendo", uids.length, "usuário(s) do Firebase Auth...");
  for (const uid of uids) {
    try {
      await a.deleteUser(uid);
    } catch (e) {
      console.warn("  Auth deleteUser", uid, (e as Error).message);
    }
  }

  const totals: Record<string, number> = {};
  const collections = ["users", "doctors", "inviteTokens"];
  for (const c of collections) {
    totals[c] = await deleteByOrganization(db, c, orgId);
    console.info("  " + c + ":", totals[c], "doc(s)");
  }

  const billingRef = db.collection("organizationBilling").doc(orgId);
  const billingSnap = await billingRef.get();
  if (billingSnap.exists) {
    await billingRef.delete();
    totals.organizationBilling = 1;
    console.info("  organizationBilling: 1 doc");
  }

  totals.units = await deleteByOrganization(db, "units", orgId);
  console.info("  units:", totals.units, "doc(s)");

  const orgRef = db.collection("organizations").doc(orgId);
  const orgSnap = await orgRef.get();
  if (orgSnap.exists) {
    await orgRef.delete();
    totals.organizations = 1;
    console.info("  organizations: 1 doc");
  }

  console.info("\nRollback dev concluído.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
