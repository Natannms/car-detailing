import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse } from "../../_lib/response";
import { firestore } from "../../../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../../../infrastructure/firebase/converters";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request, { allowUnsubscribed: true });
    const encoder = new TextEncoder();
    const db = firestore();
    const headers = new Headers({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });

    let ping: ReturnType<typeof setInterval> | null = null;
    let unsub: (() => void) | null = null;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const write = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        ping = setInterval(() => {
          controller.enqueue(encoder.encode(`:keepalive\n\n`));
        }, 15000);

        unsub = db
          .collection("organizationBilling")
          .doc(auth.organizationId)
          .onSnapshot(snap => {
            const billing = snap.exists
              ? (() => {
                  const raw = snap.data() as any;
                  const validUntil = fromFirestoreDate(raw.validUntil);
                  return {
                    ...raw,
                    organizationId: raw.organizationId ?? auth.organizationId,
                    validUntil: validUntil ? validUntil.toISOString() : null,
                    createdAt: (fromFirestoreDate(raw.createdAt) ?? null) ? (fromFirestoreDate(raw.createdAt) as Date).toISOString() : null,
                    updatedAt: (fromFirestoreDate(raw.updatedAt) ?? null) ? (fromFirestoreDate(raw.updatedAt) as Date).toISOString() : null,
                  };
                })()
              : null;
            write({ billing });
          });

        controller.enqueue(encoder.encode(`event: ready\ndata: {}\n\n`));
      },
      cancel() {
        if (ping) clearInterval(ping);
        if (unsub) unsub();
      },
    });

    return new Response(stream, { headers });
  } catch (e) {
    return errorToResponse(e);
  }
}
