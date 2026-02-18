import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authClerk";
import { errorToResponse, json } from "../_lib/response";

const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  context: z.string().max(5000).nullable().optional(),
  expected: z.string().max(5000).nullable().optional(),
  status: z.string().max(50).optional(),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext();
    const url = new URL(request.url);
    const projectId = z.string().uuid().parse(url.searchParams.get("projectId"));
    const epics = await services.epics.list(auth, projectId);
    return json({ epics });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext();
    const body = createSchema.parse(await request.json());
    const epic = await services.epics.create(auth, body);
    return json({ epic }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}
