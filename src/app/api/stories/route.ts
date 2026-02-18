import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authClerk";
import { errorToResponse, json } from "../_lib/response";

const createSchema = z.object({
  epicId: z.string().uuid(),
  title: z.string().min(1).max(200),
  userStory: z.string().min(1).max(5000),
  acceptanceCriteria: z.string().min(1).max(8000),
  status: z.string().max(50).optional(),
  points: z.number().int().nonnegative().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext();
    const url = new URL(request.url);
    const epicId = z.string().uuid().parse(url.searchParams.get("epicId"));
    const stories = await services.stories.list(auth, epicId);
    return json({ stories });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext();
    const body = createSchema.parse(await request.json());
    const story = await services.stories.create(auth, body);
    return json({ story }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}
