import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authClerk";
import { errorToResponse, json } from "../../_lib/response";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  userStory: z.string().min(1).max(5000).optional(),
  acceptanceCriteria: z.string().min(1).max(8000).optional(),
  status: z.string().max(50).optional(),
  points: z.number().int().nonnegative().nullable().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext();
    const { id } = await params;
    const story = await services.stories.get(auth, id);
    return json({ story });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext();
    const { id } = await params;
    const patch = patchSchema.parse(await request.json());
    const story = await services.stories.update(auth, id, patch);
    return json({ story });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext();
    const { id } = await params;
    await services.stories.delete(auth, id);
    return json({ ok: true });
  } catch (e) {
    return errorToResponse(e);
  }
}
