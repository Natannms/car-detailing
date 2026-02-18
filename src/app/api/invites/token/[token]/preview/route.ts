import { services } from "../../../../../../infrastructure/container";
import { errorToResponse, json } from "../../../../_lib/response";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { organization, invite } = await services.invites.previewInvite(token);
    return json({
      organization: { id: organization.id, name: organization.name },
      invite: { expiresAt: invite.expiresAt, emailHint: invite.emailHint },
    });
  } catch (e) {
    return errorToResponse(e);
  }
}

