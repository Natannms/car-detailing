import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request, { allowUnsubscribed: true });
    if (!auth.roles.includes("ORG_ADMIN")) return json({ error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });

    const raw = process.env.ASAAS_TOKEN_API ?? process.env.TOKEN_GATEWAY;
    const token =
      typeof raw === "string"
        ? raw
            .trim()
            .replace(/^"(.*)"$/, "$1")
            .replace(/^'(.*)'$/, "$1")
            .trim()
        : "";

    return json({
      asaas: {
        hasToken: Boolean(token),
        tokenLength: token.length,
        baseUrl: process.env.ASAAS_BASE_URL ?? null,
      },
    });
  } catch (e) {
    return errorToResponse(e);
  }
}
