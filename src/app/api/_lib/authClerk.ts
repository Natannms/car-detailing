import { auth, clerkClient } from "@clerk/nextjs/server";
import { UnauthorizedError } from "../../../domain/errors";
import { services } from "../../../infrastructure/container";

export async function requireAuthContext() {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
  if (!email) throw new UnauthorizedError("Email ausente");

  const user = await services.clerkSync.sync({ clerkUserId: userId, email });
  return {
    auth: { userId: user.id, organizationId: user.organizationId, roles: user.roles },
    user,
  };
}
