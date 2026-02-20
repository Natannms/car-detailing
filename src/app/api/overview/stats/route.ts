import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request, { allowUnsubscribed: true });
    const stats = await services.overview.getStats(auth.organizationId, auth.unitId);
    return json(stats);
  } catch (e) {
    return errorToResponse(e);
  }
}
