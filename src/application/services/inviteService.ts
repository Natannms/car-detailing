import crypto from "crypto";
import type { AuthContext } from "../../domain/entities";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../../domain/errors";
import type { InviteTokenRepository, OrganizationRepository, UserRepository } from "../../domain/repositories";

function hashInviteToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateInviteToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export class InviteService {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly users: UserRepository,
    private readonly invites: InviteTokenRepository,
  ) {}

  async createInvite(auth: AuthContext, input?: { emailHint?: string | null; expiresInDays?: number; roleToGrant?: "ORG_ADMIN" | "MEMBER" | "DOCTOR" }) {
    if (!auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();
    const org = await this.organizations.findById(auth.organizationId);
    if (!org) throw new NotFoundError("Organização não encontrada");

    const expiresInDays = input?.expiresInDays ?? 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const rawToken = generateInviteToken();
    const tokenHash = hashInviteToken(rawToken);

    const invite = await this.invites.create({
      organizationId: auth.organizationId,
      tokenHash,
      roleToGrant: input?.roleToGrant ?? "MEMBER",
      emailHint: input?.emailHint ?? null,
      expiresAt,
      createdByUserId: auth.userId,
    });

    return { invite, rawToken, organization: org };
  }

  async previewInvite(rawToken: string) {
    const tokenHash = hashInviteToken(rawToken);
    const invite = await this.invites.findByTokenHash(tokenHash);
    if (!invite) throw new NotFoundError("Convite não encontrado");
    if (invite.usedAt) throw new UnauthorizedError("Convite já utilizado");
    if (invite.expiresAt.getTime() < Date.now()) throw new UnauthorizedError("Convite expirado");

    const org = await this.organizations.findById(invite.organizationId);
    if (!org) throw new NotFoundError("Organização não encontrada");

    return { invite, organization: org };
  }

  async redeemInvite(rawToken: string, input: { email: string; password: string }) {
    const tokenHash = hashInviteToken(rawToken);
    const invite = await this.invites.findByTokenHash(tokenHash);
    if (!invite) throw new NotFoundError("Convite não encontrado");
    if (invite.usedAt) throw new UnauthorizedError("Convite já utilizado");
    if (invite.expiresAt.getTime() < Date.now()) throw new UnauthorizedError("Convite expirado");

    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new UnauthorizedError("Não foi possível concluir o registro");

    const org = await this.organizations.findById(invite.organizationId);
    if (!org) throw new NotFoundError("Organização não encontrada");

    return { invite, organization: org, organizationId: invite.organizationId };
  }

  async listInvites(auth: AuthContext) {
    if (!auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();
    return this.invites.listByOrganization(auth.organizationId);
  }

  async revokeInvite(auth: AuthContext, inviteId: string) {
    if (!auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();
    await this.invites.revoke(inviteId);
  }

  async listMembers(auth: AuthContext) {
    if (!auth.roles.includes("ORG_ADMIN")) throw new ForbiddenError();
    return this.users.listByOrganization(auth.organizationId);
  }
}
