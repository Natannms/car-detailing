import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(40).optional().nullable(),
  gender: z.enum(["MASCULINO", "FEMININO", "OUTRO"]).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const doctor = await services.doctors.me(auth);
    return json({ doctor });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function PUT(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = updateSchema.parse(await request.json());
    const doctor = await services.doctors.updateMe(auth, body as any);
    return json({ doctor });
  } catch (e) {
    return errorToResponse(e);
  }
}

