import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse } from "../../_lib/response";
import { getFilterUnitId } from "../../../../application/unitFilter";
import { firestore } from "../../../../infrastructure/firebase/admin";
import { fromFirestoreDate } from "../../../../infrastructure/firebase/converters";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const url = new URL(request.url);
    const requestUnitId = url.searchParams.get("unitId") ?? undefined;
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
          .collection("kanbanCards")
          .where("organizationId", "==", auth.organizationId)
          .onSnapshot(snapshot => {
            let rawCards = snapshot.docs.map(d => ({ ...(d.data() as any), id: (d.data() as any)?.id ?? d.id }));
            if (filterUnitId != null && filterUnitId !== "") {
              rawCards = rawCards.filter((c: { unitId?: string | null }) => c.unitId === filterUnitId);
            }
            const cards = rawCards.map((c: any) => ({
                ...c,
                createdAt: (fromFirestoreDate(c.createdAt) ?? null) ? (fromFirestoreDate(c.createdAt) as Date).toISOString() : null,
                updatedAt: (fromFirestoreDate(c.updatedAt) ?? null) ? (fromFirestoreDate(c.updatedAt) as Date).toISOString() : null,
              }));
            write({ cards });
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
