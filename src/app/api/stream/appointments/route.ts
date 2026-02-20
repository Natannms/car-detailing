import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse } from "../../_lib/response";
import { firestore } from "../../../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../../../infrastructure/firebase/converters";
import { getFilterUnitId } from "../../../../application/unitFilter";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const requestUnitId = new URL(request.url).searchParams.get("unitId");
    const filterUnitId = getFilterUnitId(auth, requestUnitId);

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
          .collection("appointments")
          .where("organizationId", "==", auth.organizationId)
          .onSnapshot(snapshot => {
            let appointments = snapshot.docs.map(d => {
              const raw = d.data() as any;
              const scheduledAt = fromFirestoreDate(raw.scheduledAt);
              return {
                ...raw,
                id: raw?.id ?? d.id,
                scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
                createdAt: (fromFirestoreDate(raw.createdAt) ?? null) ? (fromFirestoreDate(raw.createdAt) as Date).toISOString() : null,
                updatedAt: (fromFirestoreDate(raw.updatedAt) ?? null) ? (fromFirestoreDate(raw.updatedAt) as Date).toISOString() : null,
                deletedAt: (fromFirestoreDate(raw.deletedAt) ?? null) ? (fromFirestoreDate(raw.deletedAt) as Date).toISOString() : null,
              };
            });
            if (filterUnitId != null) {
              appointments = appointments.filter((a: { unitId?: string | null }) => a.unitId === filterUnitId);
            }
            write({ appointments });
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
