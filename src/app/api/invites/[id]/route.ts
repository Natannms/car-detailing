import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext(request);
    const { id } = await params;
    await services.invites.revokeInvite(auth, id);
    return json({ ok: true });
  } catch (e) {
    return errorToResponse(e);
  }
}
