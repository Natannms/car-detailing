/**
 * Seed de desenvolvimento: uma org, uma unit, conta admin, conta médico e billing ativo.
 *
 * Uso: npm run firebase:seed:dev
 *
 * Variáveis no .env (obrigatórias):
 *   ORG_ID_DEV, UNIT_ID_DEV, ACCOUNT_ADMIN_EMAIL_DEV, ACCOUNT_DOCTOR_EMAIL_DEV, DEV_SEED_PASSWORD
 *
 * Requer também GOOGLE_SERVICE_ACCOUNT para Firebase Admin.
 * Idempotente: pode rodar de novo; usuários Auth existentes são reutilizados.
 */

import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { auth, firestore } from "../src/infrastructure/firebase/admin";

const PLANS = [
  { id: "basic", name: "Basic", description: "Para empresas com 1 unidade.", monthlyPrice: 21.9, maxUnits: 1, features: ["1 unidade", "Atendimentos WhatsApp", "Agendamentos e pacientes"] },
  { id: "premium", name: "Premium", description: "Para empresas com até 6 unidades.", monthlyPrice: 31.9, maxUnits: 6, features: ["Até 6 unidades", "Atendimentos WhatsApp", "Agendamentos e pacientes"] },
  { id: "enterprise", name: "Enterprise", description: "Para redes e operações maiores.", monthlyPrice: 99.9, maxUnits: null, features: ["Unidades ilimitadas (sob consulta)", "SLA e onboarding dedicado"] },
];

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

function getRequired(env: Record<string, string>, key: string): string {
  const v = env[key]?.trim();
  if (!v) throw new Error(`Defina ${key} no .env`);
  return v;
}

async function ensurePlans(db: ReturnType<typeof firestore>) {
  const now = new Date();
  for (const p of PLANS) {
    await db.collection("plans").doc(p.id).set({ ...p, createdAt: now, updatedAt: now }, { merge: true });
  }
}

async function ensureAuthUser(email: string, password: string, displayName: string): Promise<string> {
  const a = auth();
  try {
    const u = await a.getUserByEmail(email);
    return u.uid;
  } catch {
    const u = await a.createUser({ email, password, displayName, emailVerified: true });
    return u.uid;
  }
}

async function main() {
  const env = loadEnvVars();
  const orgId = getRequired(env, "ORG_ID_DEV");
  const unitId = getRequired(env, "UNIT_ID_DEV");
  const adminEmail = getRequired(env, "ACCOUNT_ADMIN_EMAIL_DEV");
  const doctorEmail = getRequired(env, "ACCOUNT_DOCTOR_EMAIL_DEV");
  const password = getRequired(env, "DEV_SEED_PASSWORD");

  const db = firestore();
  const now = new Date();

  console.info("Garantindo planos...");
  await ensurePlans(db);

  console.info("Criando/atualizando organização e unidade...");
  await db.collection("organizations").doc(orgId).set({ id: orgId, name: "Dev Org", createdAt: now, updatedAt: now }, { merge: true });
  await db.collection("units").doc(unitId).set({
    id: unitId,
    organizationId: orgId,
    name: "Unidade Dev",
    phone: null,
    address: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }, { merge: true });

  console.info("Criando/obtendo usuários no Firebase Auth...");
  const adminUid = await ensureAuthUser(adminEmail, password, "Admin Dev");
  const doctorUid = await ensureAuthUser(doctorEmail, password, "Doctor Dev");

  const usersRef = db.collection("users");
  let adminUserDoc = (await usersRef.where("firebaseUid", "==", adminUid).limit(1).get()).docs[0];
  let doctorUserDoc = (await usersRef.where("firebaseUid", "==", doctorUid).limit(1).get()).docs[0];

  if (!adminUserDoc) {
    const adminId = randomUUID();
    await usersRef.doc(adminId).set({
      id: adminId,
      organizationId: orgId,
      unitId,
      email: adminEmail.toLowerCase(),
      passwordHash: null,
      firebaseUid: adminUid,
      roles: ["ORG_ADMIN"],
      createdAt: now,
      updatedAt: now,
    });
    adminUserDoc = await usersRef.doc(adminId).get();
  } else {
    await usersRef.doc(adminUserDoc.id).update({ organizationId: orgId, unitId, updatedAt: now });
  }

  if (!doctorUserDoc) {
    const doctorUserId = randomUUID();
    await usersRef.doc(doctorUserId).set({
      id: doctorUserId,
      organizationId: orgId,
      unitId,
      email: doctorEmail.toLowerCase(),
      passwordHash: null,
      firebaseUid: doctorUid,
      roles: ["DOCTOR"],
      createdAt: now,
      updatedAt: now,
    });
    doctorUserDoc = await usersRef.doc(doctorUserId).get();
  } else {
    await usersRef.doc(doctorUserDoc.id).update({ organizationId: orgId, unitId, updatedAt: now });
  }

  const doctorUserId = doctorUserDoc.id;

  console.info("Criando/atualizando médico...");
  const doctorsSnap = await db.collection("doctors").where("organizationId", "==", orgId).where("userId", "==", doctorUserId).limit(1).get();
  if (doctorsSnap.empty) {
    const doctorDocId = randomUUID();
    await db.collection("doctors").doc(doctorDocId).set({
      id: doctorDocId,
      organizationId: orgId,
      unitId,
      userId: doctorUserId,
      name: "Dr. Dev",
      email: doctorEmail.toLowerCase(),
      phone: null,
      gender: null,
      specialty: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  console.info("Criando/atualizando billing ativo...");
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await db.collection("organizationBilling").doc(orgId).set({
    organizationId: orgId,
    asaasCustomerId: null,
    asaasSubscriptionId: null,
    planId: "basic",
    billingType: null,
    status: "ACTIVE",
    validUntil,
    currentPaymentId: null,
    currentInvoiceUrl: null,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  console.info("\nSeed dev concluído.");
  console.info("  Org:", orgId);
  console.info("  Unit:", unitId);
  console.info("  Admin:", adminEmail);
  console.info("  Médico:", doctorEmail);
  console.info("  Senha (dev):", "***");
  console.info("  Billing: ACTIVE até", validUntil.toISOString().slice(0, 10));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
