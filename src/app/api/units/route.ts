import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authFirebase";
import { errorToResponse, json } from "../_lib/response";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const url = new URL(request.url);
    const requestUnitId = url.searchParams.get("unitId") ?? undefined;
    const r = await services.units.list(auth, requestUnitId);
    return json(r);
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = createSchema.parse(await request.json());
    const r = await services.units.create(auth, body);
    return json(r, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}

