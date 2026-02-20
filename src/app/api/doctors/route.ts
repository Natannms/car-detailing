import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authFirebase";
import { errorToResponse, json } from "../_lib/response";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(40).optional().nullable(),
  gender: z.enum(["MASCULINO", "FEMININO", "OUTRO"]).optional().nullable(),
  specialty: z.string().max(200).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const url = new URL(request.url);
    const requestUnitId = url.searchParams.get("unitId") ?? undefined;
    const doctors = await services.doctors.list(auth, requestUnitId);
    return json({ doctors });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = createSchema.parse(await request.json());
    const doctor = await services.doctors.create(auth, {
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      gender: body.gender ?? null,
      specialty: body.specialty ?? null,
      userId: null,
    });
    return json({ doctor }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}

