import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authFirebase";
import { errorToResponse, json } from "../_lib/response";

const querySchema = z.object({
  storyId: z.string().uuid(),
});

const createSchema = z.object({
  storyId: z.string().uuid(),
  name: z.string().min(1).max(60),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const url = new URL(request.url);
    const { storyId } = querySchema.parse({ storyId: url.searchParams.get("storyId") });
    const columns = await services.taskBoardColumns.list(auth, storyId);
    return json({ columns });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = createSchema.parse(await request.json());
    const column = await services.taskBoardColumns.create(auth, body);
    return json({ column }, { status: 201 });
  } catch (e) {
    return errorToResponse(e);
  }
}

