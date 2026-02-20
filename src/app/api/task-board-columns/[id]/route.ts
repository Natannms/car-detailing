import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

const renameSchema = z.object({
  name: z.string().min(1).max(60),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    const body = renameSchema.parse(await request.json());
    const column = await services.taskBoardColumns.rename(auth, { columnId: id, name: body.name });
    return json({ column });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    await services.taskBoardColumns.delete(auth, { columnId: id });
    return json({ ok: true });
  } catch (e) {
    return errorToResponse(e);
  }
}

