import { json } from "../_lib/response";
import { firestore } from "../../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../../infrastructure/firebase/converters";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snap = await firestore().collection("plans").get();
    const plans = snap.docs.map(d => {
      const raw = d.data() as Record<string, unknown>;
      const createdAt = fromFirestoreDate(raw.createdAt as never);
      const updatedAt = fromFirestoreDate(raw.updatedAt as never);
      return {
        id: (raw.id as string) ?? d.id,
        name: (raw.name as string) ?? "",
        description: (raw.description as string) ?? "",
        monthlyPrice: typeof raw.monthlyPrice === "number" ? raw.monthlyPrice : null,
        maxUnits: typeof raw.maxUnits === "number" ? raw.maxUnits : (raw.maxUnits as number | null) ?? null,
        features: Array.isArray(raw.features) ? (raw.features as string[]) : [],
        createdAt: createdAt ? (createdAt as Date).toISOString() : null,
        updatedAt: updatedAt ? (updatedAt as Date).toISOString() : null,
      };
    });
    plans.sort((a, b) => (a.monthlyPrice ?? 0) - (b.monthlyPrice ?? 0));
    return json({ plans });
  } catch (e) {
    console.error("[api/plans] GET error", e);
    return json(
      { error: "Falha ao carregar planos. Verifique GOOGLE_SERVICE_ACCOUNT no .env." },
      { status: 500 },
    );
  }
}

