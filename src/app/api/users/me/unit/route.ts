import { z } from "zod";
import { services } from "../../../../../infrastructure/container";
import { requireAuthContext } from "../../../_lib/authFirebase";
import { errorToResponse, json } from "../../../_lib/response";

export const runtime = "nodejs";

const schema = z.object({ unitId: z.string().uuid() });

export async function PUT(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = schema.parse(await request.json());
    const r = await services.units.setCurrentUnit(auth, body.unitId);
    return json(r);
  } catch (e) {
    return errorToResponse(e);
  }
}

