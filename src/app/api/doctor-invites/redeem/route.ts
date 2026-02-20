import crypto from "crypto";
import { z } from "zod";
import { repositories, services } from "../../../../infrastructure/container";
import { requireAuthContext } from "../../_lib/authFirebase";
import { errorToResponse, json } from "../../_lib/response";

const schema = z.object({
  token: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const { auth } = await requireAuthContext(request);
    const startedAt = Date.now();
    const body = schema.parse(await request.json());
    console.error("[doctor-invites/redeem] start", { userId: auth.userId });
    const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex");
    const invite = await repositories.invites.findByTokenHash(tokenHash);
    console.error("[doctor-invites/redeem] invite_lookup", {
      found: Boolean(invite),
      tokenHashPrefix: tokenHash.slice(0, 10),
    });
    if (!invite) return json({ ok: false, message: "Convite inválido" }, { status: 404 });
    if (invite.expiresAt.getTime() < Date.now()) return json({ ok: false, message: "Convite expirado" }, { status: 401 });
    if (invite.roleToGrant !== "DOCTOR") return json({ ok: false, message: "Convite inválido" }, { status: 400 });

    if (invite.usedAt) {
      if (invite.usedByUserId !== auth.userId) return json({ ok: false, message: "Convite já utilizado" }, { status: 401 });
    } else {
      await repositories.invites.markUsed(invite.id, new Date(), auth.userId);
    }
    console.error("[doctor-invites/redeem] invite_mark_used", {
      inviteId: invite.id,
      usedAt: Boolean(invite.usedAt),
      orgId: invite.organizationId,
    });

    const roles = Array.from(new Set([...(auth.roles ?? []), "DOCTOR" as const])) as ("ORG_ADMIN" | "MEMBER" | "DOCTOR")[];
    await repositories.users.update(auth.userId, { organizationId: invite.organizationId, roles });
    console.error("[doctor-invites/redeem] user_updated", {
      userId: auth.userId,
      orgId: invite.organizationId,
      roles,
    });

    const existingUser = await repositories.users.findById(auth.userId);
    const email = existingUser?.email.toLowerCase() ?? "";
    const name = existingUser?.email ?? "Médico";
    console.error("[doctor-invites/redeem] user_profile", {
      hasEmail: Boolean(email),
      hasName: Boolean(name),
    });

    if (email) {
      const existingDoctor = await repositories.doctors.findByEmail(email);
      if (!existingDoctor) {
        await repositories.doctors.create({
          organizationId: invite.organizationId,
          userId: auth.userId,
          name,
          email,
          phone: null,
          gender: null,
          specialty: null,
        });
      } else if (!existingDoctor.userId) {
        await repositories.doctors.update(existingDoctor.id, { userId: auth.userId });
      }
    }

    console.error("[doctor-invites/redeem] done", { ms: Date.now() - startedAt });
    return json({ ok: true });
  } catch (e) {
    console.error("[doctor-invites/redeem] error", e);
    return errorToResponse(e);
  }
}
