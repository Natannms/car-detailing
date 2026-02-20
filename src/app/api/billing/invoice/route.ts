import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request, { allowUnsubscribed: true });
    const r = await services.billing.refreshInvoice(auth);
    return json(r);
  } catch (e) {
    return errorToResponse(e);
  }
}
