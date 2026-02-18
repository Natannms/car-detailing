import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authClerk";
import { errorToResponse, json } from "../../_lib/response";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  context: z.string().max(5000).nullable().optional(),
  expected: z.string().max(5000).nullable().optional(),
  status: z.string().max(50).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext();
    const { id } = await params;
    const epic = await services.epics.get(auth, id);
    return json({ epic });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext();
    const { id } = await params;
    const patch = patchSchema.parse(await request.json());
    const epic = await services.epics.update(auth, id, patch);
    return json({ epic });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext();
    const { id } = await params;
    await services.epics.delete(auth, id);
    return json({ ok: true });
  } catch (e) {
    return errorToResponse(e);
  }
}
