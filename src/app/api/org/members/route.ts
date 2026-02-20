import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext();
    const members = await services.invites.listMembers(auth);
    return json({ members: members.map(m => ({ id: m.id, email: m.email, roles: m.roles, organizationId: m.organizationId })) });
  } catch (e) {
    return errorToResponse(e);
  }
}
