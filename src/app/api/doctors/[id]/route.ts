import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(40).optional().nullable(),
  gender: z.enum(["MASCULINO", "FEMININO", "OUTRO"]).optional().nullable(),
  specialty: z.string().max(200).optional().nullable(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    const body = updateSchema.parse(await request.json());
    const doctor = await services.doctors.update(auth, id, body as any);
    return json({ doctor });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    await services.doctors.delete(auth, id);
    return json({ ok: true });
  } catch (e) {
    return errorToResponse(e);
  }
}

