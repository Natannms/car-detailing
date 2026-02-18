import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authClerk";
import { errorToResponse, json } from "../../_lib/response";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext();
    const { id } = await params;
    await services.invites.revokeInvite(auth, id);
    return json({ ok: true });
  } catch (e) {
    return errorToResponse(e);
  }
}
