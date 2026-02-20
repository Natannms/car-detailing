import { z } from "zod";
import { services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

const schema = z.object({
  projectId: z.string().uuid(),
  markdown: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = schema.parse(await request.json());
    const report = await services.backlogImport.importMarkdown(auth, body.projectId, body.markdown);
    return json({ report });
  } catch (e) {
    return errorToResponse(e);
  }
}
