import { json } from "../_lib/response";
import { firestore } from "../../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../../infrastructure/firebase/converters";

export const runtime = "nodejs";

export async function GET() {
  const snap = await firestore().collection("plans").get();
  const plans = snap.docs.map(d => {
    const raw = d.data() as any;
    return {
      id: raw.id ?? d.id,
      name: raw.name ?? "",
      description: raw.description ?? "",
      monthlyPrice: typeof raw.monthlyPrice === "number" ? raw.monthlyPrice : null,
      maxUnits: typeof raw.maxUnits === "number" ? raw.maxUnits : raw.maxUnits ?? null,
      features: Array.isArray(raw.features) ? raw.features : [],
      createdAt: (fromFirestoreDate(raw.createdAt) ?? null) ? (fromFirestoreDate(raw.createdAt) as Date).toISOString() : null,
      updatedAt: (fromFirestoreDate(raw.updatedAt) ?? null) ? (fromFirestoreDate(raw.updatedAt) as Date).toISOString() : null,
    };
  });
  plans.sort((a, b) => (a.monthlyPrice ?? 0) - (b.monthlyPrice ?? 0));
  return json({ plans });
}

