import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(8000).nullable().optional(),
  status: z.string().max(50).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    const task = await services.tasks.get(auth, id);
    return json({ task });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    const patch = patchSchema.parse(await request.json());
    const task = await services.tasks.update(auth, id, patch);
    return json({ task });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    await services.tasks.delete(auth, id);
    return json({ ok: true });
  } catch (e) {
    return errorToResponse(e);
  }
}
