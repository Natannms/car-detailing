import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

export async function GET(request: Request) {
  try {
    await requireAuthContext(request);
    return json({ statuses: services.medicalKanban.statuses() });
  } catch (e) {
    return errorToResponse(e);
  }
}

