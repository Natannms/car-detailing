import type { Timestamp } from "firebase-admin/firestore";

export type FirestoreDate = Date | Timestamp | null | undefined;

export function fromFirestoreDate(v: FirestoreDate) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof (v as any).toDate === "function") return (v as any).toDate() as Date;
  return null;
}

export function toFirestoreDate(v: Date | null | undefined) {
  return v ?? null;
}

