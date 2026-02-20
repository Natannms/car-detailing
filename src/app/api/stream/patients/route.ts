import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse } from "../../_lib/response";
import { getFilterUnitId } from "../../../../application/unitFilter";
import { firestore } from "../../../../infrastructure/firebase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const url = new URL(request.url);
    const requestUnitId = url.searchParams.get("unitId") ?? undefined;
    const allInUnit = url.searchParams.get("all") === "1" || url.searchParams.get("all") === "true";
    const filterUnitId = getFilterUnitId(auth, requestUnitId);

    const encoder = new TextEncoder();
    const db = firestore();
    const headers = new Headers({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });

    let ping: ReturnType<typeof setInterval> | null = null;
    let unsubPatients: (() => void) | null = null;
    let unsubAppointments: (() => void) | null = null;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const write = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        let lastPatients: Array<Record<string, unknown> & { id: string; unitId?: string | null }> = [];
        let patientIdsWithAppointments = new Set<string>();

        const byUnit = (p: { unitId?: string | null }) =>
          filterUnitId == null || filterUnitId === "" || p.unitId === filterUnitId;

        const sendFiltered = () => {
          const byUnitList = lastPatients.filter(byUnit);
          const filtered = allInUnit ? byUnitList : byUnitList.filter(p => patientIdsWithAppointments.has(p.id));
          write({ patients: filtered });
        };

        ping = setInterval(() => {
          controller.enqueue(encoder.encode(`:keepalive\n\n`));
        }, 15000);

        unsubAppointments = db
          .collection("appointments")
          .where("organizationId", "==", auth.organizationId)
          .onSnapshot(snapshot => {
            patientIdsWithAppointments = new Set(
              snapshot.docs
                .filter(d => {
                  const data = d.data() as { deletedAt?: unknown; patientId?: string; unitId?: string | null };
                  if (data.deletedAt) return false;
                  if (filterUnitId != null && filterUnitId !== "" && data.unitId !== filterUnitId) return false;
                  return Boolean(data.patientId);
                })
                .map(d => (d.data() as { patientId?: string }).patientId as string),
            );
            sendFiltered();
          });

        unsubPatients = db
          .collection("patients")
          .where("organizationId", "==", auth.organizationId)
          .onSnapshot(snapshot => {
            lastPatients = snapshot.docs.map(d => {
              const data = d.data() as any;
              return { ...data, id: data?.id ?? d.id };
            });
            sendFiltered();
          });

        controller.enqueue(encoder.encode(`event: ready\ndata: {}\n\n`));
      },
      cancel() {
        if (ping) clearInterval(ping);
        unsubPatients?.();
        unsubAppointments?.();
      },
    });

    return new Response(stream, { headers });
  } catch (e) {
    return errorToResponse(e);
  }
}
