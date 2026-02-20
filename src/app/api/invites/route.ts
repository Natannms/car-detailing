import { z } from "zod";
import { services } from "../../../infrastructure/container";
import { requireAuthContext } from "../_lib/authFirebase";
import { errorToResponse, json } from "../_lib/response";

const createSchema = z.object({
  emailHint: z.string().email().max(320).nullable().optional(),
  expiresInDays: z.number().int().min(1).max(30).optional(),
  roleToGrant: z.enum(["ORG_ADMIN", "MEMBER", "DOCTOR"]).optional(),
});

export async function GET(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const invites = await services.invites.listInvites(auth);
    return json({ invites });
  } catch (e) {
    return errorToResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const body = createSchema.parse(await request.json().catch(() => ({})));
    const { rawToken, invite, organization } = await services.invites.createInvite(auth, body);
    const origin = new URL(request.url).origin;
    const inviteLink = `${origin}/dashboard/account?invite=${encodeURIComponent(rawToken)}`;
    return json({
      invite: { id: invite.id, expiresAt: invite.expiresAt, usedAt: invite.usedAt, emailHint: invite.emailHint, organizationId: invite.organizationId },
      organization: { id: organization.id, name: organization.name },
      inviteLink,
    });
  } catch (e) {
    return errorToResponse(e);
  }
}
