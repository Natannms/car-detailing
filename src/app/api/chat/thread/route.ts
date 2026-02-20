import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";
import { firestore } from "../../../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../../../infrastructure/firebase/converters";

export const runtime = "nodejs";

export type MessageThreadItem = {
  id: string;
  customerPhone: string;
  isBot: boolean;
  messageText: string;
  organizationId: string;
  unit_id: string | null;
  createdAt: string;
  updatedAt: string;
};

function normalizePhone(phone: string | null): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const url = new URL(request.url);
    const customerPhone = url.searchParams.get("customerPhone")?.trim();
    if (!customerPhone) {
      return json({ messages: [] }, { status: 200 });
    }
    const phoneDigits = normalizePhone(customerPhone);
    if (!phoneDigits) {
      return json({ messages: [] }, { status: 200 });
    }

    const db = firestore();
    const snap = await db
      .collection("messageThreads")
      .where("customerPhone", "==", phoneDigits)
      .get();

    const items: MessageThreadItem[] = snap.docs
      .map(doc => {
        const d = doc.data() as {
          customerPhone?: string;
          isBot?: boolean;
          messageText?: string;
          organizationId?: string;
          unit_id?: string | null;
          createdAt?: unknown;
          updatedAt?: unknown;
        };
        if (d.organizationId && d.organizationId !== auth.organizationId) return null;
        const createdAt = fromFirestoreDate(d.createdAt);
        const updatedAt = fromFirestoreDate(d.updatedAt);
        return {
          id: doc.id,
          customerPhone: d.customerPhone ?? "",
          isBot: Boolean(d.isBot),
          messageText: d.messageText ?? "",
          organizationId: d.organizationId ?? "",
          unit_id: d.unit_id ?? null,
          createdAt: createdAt ? createdAt.toISOString() : "",
          updatedAt: updatedAt ? updatedAt.toISOString() : "",
        };
      })
      .filter((x): x is MessageThreadItem => x !== null);

    items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return json({ messages: items });
  } catch (e) {
    return errorToResponse(e);
  }
}
