import { z } from "zod";
import { auth } from "../../../../infrastructure/firebase/admin";
import { services } from "../../../../infrastructure/container";
import { errorToResponse } from "../../_lib/response";

const SESSION_COOKIE_NAME = "__session";
const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60; // 14 dias (máximo permitido pelo Firebase)

const bodySchema = z.object({ idToken: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const decoded = await auth().verifyIdToken(body.idToken);
    const uid = decoded.uid;
    const email = decoded.email ?? null;
    if (!email) {
      return new Response(JSON.stringify({ error: { code: "EMAIL_REQUIRED", message: "Email ausente no token." } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await services.authSync.sync({ firebaseUid: uid, email });
    const sessionCookie = await auth().createSessionCookie(body.idToken, { expiresIn: SESSION_MAX_AGE_SECONDS });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieValue = `${SESSION_COOKIE_NAME}=${sessionCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${isProduction ? "; Secure" : ""}`;

    return new Response(JSON.stringify({ ok: true, user: { id: user.id, organizationId: user.organizationId } }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieValue,
      },
    });
  } catch (e) {
    return errorToResponse(e);
  }
}
