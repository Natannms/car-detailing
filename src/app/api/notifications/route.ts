import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authFirebase";
import { errorToResponse, json } from "../_lib/response";

const schema = z.object({
  type: z.enum(["CALL_PATIENT"]),
  appointmentId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = schema.parse(await request.json());
    if (body.type !== "CALL_PATIENT") return json({ error: { code: "BAD_REQUEST", message: "Tipo inválido" } }, { status: 400 });
    const notification = await services.notifications.callPatient(auth, { appointmentId: body.appointmentId });
    return json({ notification }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}

