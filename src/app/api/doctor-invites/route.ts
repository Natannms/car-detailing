import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authFirebase";
import { errorToResponse, json } from "../_lib/response";

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const { rawToken } = await services.invites.createInvite(auth, { roleToGrant: "DOCTOR" });
    const origin = new URL(request.url).origin;
    const inviteUrl = `${origin}/register?invite=${encodeURIComponent(rawToken)}`;
    return json({ inviteUrl }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}

