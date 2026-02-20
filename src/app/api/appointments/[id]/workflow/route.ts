import { z } from "zod";
import { services } from "../../../../../infrastructure/container";
import { requireAuthContext } from "../../../_lib/authFirebase";
import { errorToResponse, json } from "../../../_lib/response";

const schema = z.object({
  action: z.enum(["TO_RECEPTION", "TO_WAITING", "START", "FINISH"]),
});

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = schema.parse(await request.json());
    const { id } = await ctx.params;
    const result = await services.appointmentWorkflow.transition(auth, { appointmentId: id, action: body.action });
    return json(result, { status: 200 });
  } catch (e) {
    return errorToResponse(e);
  }
}

