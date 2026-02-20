import { auth } from "../../../infrastructure/firebase/admin";
import { UnauthorizedError } from "../../../domain/errors";
import { services } from "../../../infrastructure/container";

const SESSION_COOKIE_NAME = "__session";

function getSessionCookieFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

export async function requireAuthContext(request: Request, options?: { allowUnsubscribed?: boolean }) {
  const sessionCookie = getSessionCookieFromRequest(request);
  if (!sessionCookie) throw new UnauthorizedError();

  const authInstance = auth();
  const decodedClaims = await authInstance.verifySessionCookie(sessionCookie, true).catch(() => null);
  if (!decodedClaims) throw new UnauthorizedError();

  const uid = decodedClaims.uid;
  const email =
    (decodedClaims.email as string | undefined) ??
    (decodedClaims as { email?: string }).email ??
    null;
  if (!email) throw new UnauthorizedError("Email ausente");

  const user = await services.authSync.sync({ firebaseUid: uid, email });
  if (!options?.allowUnsubscribed) {
    await services.billingGate.assertActiveOrganization(user.organizationId);
  }
  return {
    auth: { userId: user.id, organizationId: user.organizationId, unitId: user.unitId ?? null, roles: user.roles },
    user,
  };
}
