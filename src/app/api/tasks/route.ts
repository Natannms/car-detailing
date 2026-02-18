import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authClerk";
import { errorToResponse, json } from "../_lib/response";

const createSchema = z.object({
  storyId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(8000).nullable().optional(),
  status: z.string().max(50).optional(),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext();
    const url = new URL(request.url);
    const storyId = z.string().uuid().parse(url.searchParams.get("storyId"));
    const tasks = await services.tasks.list(auth, storyId);
    return json({ tasks });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext();
    const body = createSchema.parse(await request.json());
    const task = await services.tasks.create(auth, body);
    return json({ task }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}
