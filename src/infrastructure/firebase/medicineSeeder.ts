import { randomUUID } from "crypto";
import { firestore } from "./admin";

type SeedCounts = { doctors: number; patients: number; appointments: number };

const defaultCounts: SeedCounts = { doctors: 10, patients: 40, appointments: 30 };

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const genders = ["MASCULINO", "FEMININO", "OUTRO"] as const;
const treatments = ["CONSULTA", "EXAME", "CIRURGIA", "TERAPIA", "VACINACAO", "OUTRO"] as const;
const appointmentStatuses = [
  "AGENDADO",
  "PRIMEIRA_CONSULTA",
  "RETORNO",
  "URGENCIA",
  "EMERGENCIA",
  "AVALIACAO",
  "ENCAMINHAMENTO",
  "PRE_OPERATORIO",
  "POS_OPERATORIO",
  "MANUTENCAO",
  "TELECONSULTA_ONLINE",
  "RETORNO_REMARCADO",
] as const;

const specialties = [
  "Cardiologia",
  "Dermatologia",
  "Neurologia",
  "Psiquiatria",
  "Pediatria",
  "Ginecologia e Obstetrícia",
  "Ortopedia e Traumatologia",
  "Oftalmologia",
  "Otorrinolaringologia",
  "Endocrinologia e Metabologia",
  "Gastroenterologia",
  "Pneumologia",
  "Urologia",
  "Reumatologia",
  "Nefrologia",
  "Infectologia",
  "Hematologia e Hemoterapia",
  "Oncologia Clínica",
  "Radiologia e Diagnóstico por Imagem",
  "Medicina de Família e Comunidade",
];

function pick<T>(arr: readonly T[], idx: number) {
  return arr[idx % arr.length]!;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seeded(seedText: string) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) h = Math.imul(h ^ seedText.charCodeAt(i), 16777619);
  return mulberry32(h >>> 0);
}

function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pad(n: number, width: number) {
  const s = String(n);
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensureOrganization(orgId: string) {
  const db = firestore();
  const ref = db.collection("organizations").doc(orgId);
  const snap = await ref.get();
  if (!snap.exists) {
    const now = new Date();
    await ref.set({ id: orgId, name: "Seed Medicina", createdAt: now, updatedAt: now });
  }
}

export async function seedMedicine(input?: { organizationId?: string; counts?: Partial<SeedCounts> }) {
  const counts = { ...defaultCounts, ...(input?.counts ?? {}) };
  const organizationId = input?.organizationId?.trim() || process.env.SEED_ORG_ID?.trim() || randomUUID();
  await ensureOrganization(organizationId);

  const rng = seeded(organizationId);
  const db = firestore();
  const batch = db.batch();
  const now = new Date();

  const doctorIds: string[] = [];
  for (let i = 0; i < counts.doctors; i++) {
    const id = randomUUID();
    doctorIds.push(id);
    const name = `Dr(a). ${pad(i + 1, 2)}`;
    const email = normalizeEmail(`medico${i + 1}@seed.local`);
    const gender = pick(genders, i);
    const specialty = pick(specialties, i);
    const phone = `+55 11 9${pad(randInt(rng, 1000, 9999), 4)}-${pad(randInt(rng, 1000, 9999), 4)}`;
    batch.set(db.collection("doctors").doc(id), {
      id,
      organizationId,
      userId: null,
      name,
      email,
      phone,
      gender,
      specialty,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  const patientIds: string[] = [];
  for (let i = 0; i < counts.patients; i++) {
    const id = randomUUID();
    patientIds.push(id);
    const patientNumber = pad(i + 1, 5);
    const name = `Paciente ${pad(i + 1, 2)}`;
    const email = normalizeEmail(`paciente${i + 1}@seed.local`);
    const phone = `+55 11 9${pad(randInt(rng, 1000, 9999), 4)}-${pad(randInt(rng, 1000, 9999), 4)}`;
    const gender = pick(genders, randInt(rng, 0, 1000));
    const age = randInt(rng, 1, 90);
    const bloodType = pick(bloodTypes, randInt(rng, 0, 1000));
    const treatment = pick(treatments, randInt(rng, 0, 1000));
    const cpf = `${pad(randInt(rng, 100, 999), 3)}.${pad(randInt(rng, 100, 999), 3)}.${pad(randInt(rng, 100, 999), 3)}-${pad(randInt(rng, 10, 99), 2)}`;
    const rg = `${pad(randInt(rng, 10, 99), 2)}.${pad(randInt(rng, 100, 999), 3)}.${pad(randInt(rng, 100, 999), 3)}-${pad(randInt(rng, 0, 9), 1)}`;
    const address = {
      street: `Rua ${pad(randInt(rng, 1, 500), 3)}`,
      district: `Bairro ${pad(randInt(rng, 1, 80), 2)}`,
      city: "São Paulo",
      state: "SP",
      number: String(randInt(rng, 1, 9999)),
    };
    batch.set(db.collection("patients").doc(id), {
      id,
      organizationId,
      patientNumber,
      name,
      email,
      phone,
      gender,
      age,
      bloodType,
      treatment,
      cpf,
      rg,
      address,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  for (let i = 0; i < counts.appointments; i++) {
    const id = randomUUID();
    const patientId = patientIds[randInt(rng, 0, patientIds.length - 1)]!;
    const doctorId = doctorIds[randInt(rng, 0, doctorIds.length - 1)]!;
    const scheduledAt = new Date(Date.now() + randInt(rng, -7, 21) * 24 * 60 * 60 * 1000 + randInt(rng, 8, 18) * 60 * 60 * 1000);
    const status = pick(appointmentStatuses, randInt(rng, 0, 1000));
    const notes = rng() > 0.35 ? `Observação ${pad(i + 1, 2)}` : null;
    batch.set(db.collection("appointments").doc(id), {
      id,
      organizationId,
      patientId,
      doctorId,
      scheduledAt,
      status,
      notes,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  await batch.commit();
  process.stdout.write(`Seed concluído. organizationId=${organizationId}\n`);
  return { organizationId, counts };
}

async function deleteCollectionByOrganizationId(collectionName: string, organizationId: string) {
  const db = firestore();
  let total = 0;

  while (true) {
    const snap = await db.collection(collectionName).where("organizationId", "==", organizationId).limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    total += snap.size;
  }

  return total;
}

export async function rollbackMedicine(input?: { organizationId?: string; deleteAuth?: boolean }) {
  const organizationId = input?.organizationId?.trim() || process.env.SEED_ORG_ID?.trim();
  if (!organizationId) {
    throw new Error("Defina SEED_ORG_ID para executar o rollback com segurança.");
  }

  const totals: Record<string, number> = {};
  const collections = ["appointments", "patients", "doctors", "kanbanCards", "inviteTokens"];
  for (const c of collections) totals[c] = await deleteCollectionByOrganizationId(c, organizationId);

  const deleteAuth = input?.deleteAuth ?? (process.env.SEED_DELETE_AUTH === "true");
  if (deleteAuth) {
    totals.users = await deleteCollectionByOrganizationId("users", organizationId);
    await firestore().collection("organizations").doc(organizationId).delete().catch(() => undefined);
  }

  process.stdout.write(`Rollback concluído. organizationId=${organizationId} ${JSON.stringify(totals)}\n`);
  return { organizationId, totals };
}

