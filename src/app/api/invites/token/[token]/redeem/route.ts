import { services, repositories } from "../../../../../../infrastructure/container";
import { errorToResponse, json } from "../../../../_lib/response";
import { requireAuthContext } from "../../../../_lib/authClerk";
import { ConflictError } from "../../../../../../domain/errors";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const preview = await services.invites.previewInvite(token);
    const { auth, user } = await requireAuthContext();
    if (auth.organizationId !== preview.organization.id) throw new ConflictError("Convite não é desta organização");

    await repositories.invites.markUsed(preview.invite.id, new Date(), user.id);
    return json({ ok: true, organization: preview.organization }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}
