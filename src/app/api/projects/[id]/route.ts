import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authClerk";
import { errorToResponse, json } from "../../_lib/response";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await requireAuthContext();
    const { id } = await params;
    const project = await services.projects.get(auth, id);
    return json({ project });
  } catch (e) {
    return errorToResponse(e);
  }
}
