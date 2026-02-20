import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authFirebase";
import { errorToResponse, json } from "../_lib/response";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(80).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(400).optional().nullable(),
  instagram: z.string().max(200).optional().nullable(),
  linkedin: z.string().max(400).optional().nullable(),
  companyName: z.string().max(200).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});

export async function GET() {
  try {
    const { auth } = await requireAuthContext(request);
    const clients = await services.clients.list(auth);
    return json({ clients });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = createSchema.parse(await request.json());
    const client = await services.clients.create(auth, {
      name: body.name,
      code: body.code ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      instagram: body.instagram ?? null,
      linkedin: body.linkedin ?? null,
      companyName: body.companyName ?? null,
      notes: body.notes ?? null,
    });
    return json({ client }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}
