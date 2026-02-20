import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request, { allowUnsubscribed: true });
    const { user } = await services.auth.me(auth);
    return json({ user: { id: user.id, email: user.email, roles: user.roles, organizationId: user.organizationId, unitId: user.unitId ?? null } });
  } catch (e) {
    return errorToResponse(e);
  }
}
